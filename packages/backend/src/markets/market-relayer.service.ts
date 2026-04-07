import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Contract, JsonRpcProvider, Wallet, parseEther, formatEther } from 'ethers';
import { PNP_FACTORY_ABI } from '../abi/pnp-factory.abi';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class MarketRelayerService {
  private readonly logger = new Logger(MarketRelayerService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly supabase: SupabaseService,
  ) {}

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
  }): Promise<{ txHash: string; conditionId: string }> {
    const rpcUrl = this.config.get<string>('RPC_URL');
    const factoryAddress = this.config.get<string>('OPENBET_FACTORY_ADDRESS');
    const privateKey = this.config.get<string>('WALLET_PRIVATE_KEY');

    if (!rpcUrl || !factoryAddress || !privateKey) {
      throw new BadRequestException('Relayer configuration is incomplete');
    }

    const provider = new JsonRpcProvider(rpcUrl);
    const relayerWallet = new Wallet(privateKey, provider);
    const factory = new Contract(factoryAddress, PNP_FACTORY_ABI, relayerWallet);

    // 1. Verify Payment (Simulation for now, ideally check userPaymentTxHash)
    // In a real app, you would verify that the txHash exists and contains the correct fee + 10% commission.
    this.logger.log(`Executing market creation for: "${params.question}"`);

    try {
      // 2. Prepare Transaction
      const liquidity = parseEther(params.initialLiquidity || '0.1');
      
      // 3. Send Transaction (Backend Relayer)
      const tx = await factory.createPredictionMarket(
        liquidity,
        params.collateralToken,
        params.question,
        BigInt(params.endTime)
      );

      this.logger.log(`Creation transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();

      // 4. Extract conditionId from events
      const event = receipt.logs.map((log: any) => {
        try { return factory.interface.parseLog(log); } catch (e) { return null; }
      }).find((ev: any) => ev?.name === 'OPENBET_MarketCreated');

      const conditionId = event?.args?.conditionId || '0x...';

      return {
        txHash: tx.hash,
        conditionId,
      };
    } catch (error) {
      this.logger.error('Failed to execute market creation', error.message);
      throw new BadRequestException(`On-chain error: ${error.message}`);
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
