import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Contract, JsonRpcProvider, Wallet, parseEther, formatEther, parseUnits } from 'ethers';
import { PNP_FACTORY_ABI } from '../abi/pnp-factory.abi';
import { SupabaseService } from '../supabase/supabase.service';
import { ERC20_ABI } from '../abi/erc20.abi';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MarketRelayerService {
  private readonly logger = new Logger(MarketRelayerService.name);
  private readonly jsonFilePath = path.join(process.cwd(), 'markets.json');
  private nextNonce: number | null = null;
  private nonceLock: Promise<void> = Promise.resolve();

  constructor(
    private readonly config: ConfigService,
    private readonly supabase: SupabaseService,
  ) {}

  /**
   * Safe nonce acquisition with locking to prevent parallel collisions.
   */
  private async getAtomicNonce(wallet: Wallet): Promise<number> {
    await this.nonceLock; // Wait for any existing tx to finish preparing
    
    let resolveLock: () => void;
    this.nonceLock = new Promise((resolve) => {
      resolveLock = resolve;
    });

    try {
      if (this.nextNonce === null) {
        this.nextNonce = await wallet.getNonce('latest');
        this.logger.log(`Initialized relayer nonce to: ${this.nextNonce}`);
      }
      const nonceToUse = this.nextNonce;
      this.nextNonce++; // Optimistically increment for the next person in line
      return nonceToUse;
    } finally {
      resolveLock!(); // Release the lock
    }
  }

  /**
   * Executes the on-chain market creation after verifying user payment.
   */
  async executeMarketCreation(params: {
    question: string;
    description: string;
    endTime: number;
    initialLiquidity: string;
    collateralToken: string;
    userPaymentTxHash?: string;
  }, retryCount = 0): Promise<{ txHash: string; conditionId: string }> {
    const rpcUrl = this.config.get<string>('RPC_URL');
    const factoryAddress = this.config.get<string>('OPENBET_FACTORY_ADDRESS');
    const privateKey = this.config.get<string>('WALLET_PRIVATE_KEY');

    if (!rpcUrl || !factoryAddress || !privateKey) {
      throw new BadRequestException('Relayer configuration is incomplete');
    }

    const provider = new JsonRpcProvider(rpcUrl);
    const relayerWallet = new Wallet(privateKey, provider);
    const factory = new Contract(factoryAddress, PNP_FACTORY_ABI, relayerWallet);

    this.logger.log(`${retryCount > 0 ? 'Retrying (Nonce Fix): ' : ''}Executing market creation for: "${params.question}"`);

    try {
      // 1. Prepare Token and Liquidity
      const isNative = params.collateralToken === '0x0000000000000000000000000000000000000000';
      if (isNative) {
        throw new BadRequestException('Factory is non-payable. Please provide a valid ERC20 collateral token address.');
      }

      const token = new Contract(params.collateralToken, ERC20_ABI, relayerWallet);
      const decimals = await token.decimals();
      
      // Use parseUnits for safe decimal scaling (no mixing of BigInt and Number)
      const adjustedLiquidity = parseUnits('100', decimals);

      // 2. Check Balance
      const balance = await token.balanceOf(relayerWallet.address);
      if (balance < adjustedLiquidity) {
        const symbol = await token.symbol();
        throw new BadRequestException(`Relayer token balance too low. Has ${formatEther(balance)} ${symbol}, needs 100 ${symbol}`);
      }

      // 3. Check and Handle Allowance
      const allowance = await token.allowance(relayerWallet.address, factoryAddress);
      if (allowance < adjustedLiquidity) {
        this.logger.log(`Insufficient allowance. Approving factory for ${params.collateralToken}...`);
        const approveTx = await token.approve(factoryAddress, adjustedLiquidity * 10n); // Approve 10x for future use
        await approveTx.wait();
        this.logger.log(`Approval confirmed: ${approveTx.hash}`);
      }

      // 4. Send Transaction (Backend Relayer) with Atomic Nonce
      const nonce = await this.getAtomicNonce(relayerWallet);
      this.logger.log(`[Queue] Sending Market Created with Nonce: ${nonce}`);

      const tx = await factory.createPredictionMarket(
        adjustedLiquidity,
        params.collateralToken,
        params.question,
        BigInt(params.endTime),
        { nonce }
      );

      this.logger.log(`Creation transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();

      // 5. Extract conditionId from events
      const event = receipt.logs.map((log: any) => {
        try { return factory.interface.parseLog(log); } catch (e) { return null; }
      }).find((ev: any) => ev?.name === 'OPENBET_MarketCreated');

      const conditionId = event?.args?.conditionId || '0x...';

      // 6. Save Metadata (Supabase + JSON)
      await this.saveMarketMetadata({
        conditionId,
        question: params.question,
        description: params.description,
        endTime: params.endTime,
        creator: relayerWallet.address,
        collateralToken: params.collateralToken,
      });

      return {
        txHash: tx.hash,
        conditionId,
      };
    } catch (error: any) {
      // Automatic Nonce Recovery
      if ((error.message?.includes('nonce too low') || error.code === 'NONCE_EXPIRED') && retryCount < 2) {
        this.logger.warn(`NONCE_EXPIRED detected for nonce ${this.nextNonce}. Re-syncing with chain...`);
        this.nextNonce = null; // Force re-fetch from chain next time
        return this.executeMarketCreation(params, retryCount + 1);
      }

      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Failed to execute market creation', error.message);
      throw new BadRequestException(`On-chain error: ${error.message}`);
    }
  }

  /**
   * Saves the market metadata to Supabase and a local JSON file.
   */
  private async saveMarketMetadata(data: {
    conditionId: string;
    question: string;
    description: string;
    endTime: number;
    creator: string;
    collateralToken: string;
  }) {
    const marketRow = {
      market_address: data.conditionId,
      question: data.question,
      description: data.description,
      market_endTime: new Date(data.endTime * 1000).toISOString(),
      creator: data.creator,
      market_createdTime: new Date().toISOString(),
      collateralToken: data.collateralToken,
      yes_token_supply: '0',
      no_token_supply: '0',
    };

    // 1. Save to Supabase (Primary)
    try {
      this.logger.log(`Inserting market ${data.conditionId} into Supabase...`);
      const { error } = await this.supabase
        .getClawdbetClient()
        .from(this.supabase.writeTable)
        .insert([marketRow]);
      
      if (error) {
        this.logger.warn(`Failed to save to Supabase: ${error.message}`);
      } else {
        this.logger.log(`Market ${data.conditionId} saved to Supabase`);
      }
    } catch (e) {
      this.logger.warn(`Supabase error: ${e.message}`);
    }

    // 2. Save to Local JSON
    try {
      let markets: any[] = [];
      if (fs.existsSync(this.jsonFilePath)) {
        const fileContent = fs.readFileSync(this.jsonFilePath, 'utf8');
        try {
          markets = JSON.parse(fileContent);
        } catch (e) {
          markets = [];
        }
      }
      markets.push({ ...marketRow, description: data.description, collateralToken: data.collateralToken });
      fs.writeFileSync(this.jsonFilePath, JSON.stringify(markets, null, 2));
      this.logger.log(`Market ${data.conditionId} saved to local JSON`);
    } catch (e) {
      this.logger.error(`Failed to save to JSON file: ${e.message}`);
    }
  }

  /**
   * Calculates the total fee required from the user (Fee + 10%).
   */
  getRequiredFee(baseTokenPrice: string): string {
    const base = parseFloat(baseTokenPrice);
    const commission = base * 0.1;
    return (base + commission).toString();
  }
}
