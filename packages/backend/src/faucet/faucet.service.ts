import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { MarketRelayerService } from '../markets/market-relayer.service';
import { Contract, JsonRpcProvider, Wallet, parseUnits, formatUnits } from 'ethers';
import { ERC20_ABI } from '../abi/erc20.abi';

@Injectable()
export class FaucetService {
  private readonly logger = new Logger(FaucetService.name);
  private readonly TABLE_NAME = 'faucet_claims';

  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
    private readonly relayer: MarketRelayerService,
  ) {}

  /**
   * Checks the status of a user's claim cooldown.
   */
  async getStatus(address: string) {
    const { data: latestClaim, error } = await this.supabase
      .getClawdbetClient()
      .from(this.TABLE_NAME)
      .select('claimed_at')
      .eq('address', address.toLowerCase())
      .order('claimed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      this.logger.error(`Error checking faucet status: ${error.message}`);
    }

    if (!latestClaim) {
      return { canClaim: true, remaining: 0 };
    }

    const lastClaimedAt = new Date(latestClaim.claimed_at).getTime();
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const elapsed = now - lastClaimedAt;

    if (elapsed < twentyFourHours) {
      return {
        canClaim: false,
        remaining: twentyFourHours - elapsed,
        lastClaimedAt,
      };
    }

    return { canClaim: true, remaining: 0 };
  }

  /**
   * Claims 10 WSUSDC and 100 SIGMA for the user.
   */
  async claim(address: string) {
    if (!address || address === '0x0000000000000000000000000000000000000000') {
      throw new BadRequestException('Invalid address.');
    }

    const status = await this.getStatus(address);
    if (!status.canClaim) {
      throw new BadRequestException(`Wait for countdown. Remaining: ${Math.ceil(status.remaining / 1000 / 60)} minutes.`);
    }

    const rpcUrl = this.config.getOrThrow<string>('RPC_URL');
    const privateKey = this.config.getOrThrow<string>('WALLET_PRIVATE_KEY');
    const usdcAddress = this.config.getOrThrow<string>('USDC_ADDRESS');
    const sigmaAddress = this.config.getOrThrow<string>('SIGMA_TOKEN_ADDRESS');

    const provider = new JsonRpcProvider(rpcUrl);
    const relayerWallet = new Wallet(privateKey, provider);

    const usdcToken = new Contract(usdcAddress, ERC20_ABI, relayerWallet);
    const sigmaToken = new Contract(sigmaAddress, ERC20_ABI, relayerWallet);

    const wsusdcAmount = parseUnits('10', 6);
    const sigmaAmount = parseUnits('100', 18);

    // Balance checks
    const relayerUsdc = await usdcToken.balanceOf(relayerWallet.address);
    const relayerSigma = await sigmaToken.balanceOf(relayerWallet.address);

    if (relayerUsdc < wsusdcAmount) {
      throw new BadRequestException(`Relayer lacks WSUSDC. Found ${formatUnits(relayerUsdc, 6)}`);
    }
    if (relayerSigma < sigmaAmount) {
      throw new BadRequestException(`Relayer lacks SIGMA. Found ${formatUnits(relayerSigma, 18)}`);
    }

    this.logger.log(`Faucet claim attempt for ${address}`);

    try {
      // 1. Send WSUSDC
      const nonce1 = await this.relayer.getAtomicNonce(relayerWallet);
      const txUsdc = await usdcToken.transfer(address, wsusdcAmount, { nonce: nonce1 });
      this.logger.log(`WSUSDC sent: ${txUsdc.hash}. Waiting for confirmation...`);
      await txUsdc.wait();

      // 2. Send SIGMA
      const nonce2 = await this.relayer.getAtomicNonce(relayerWallet);
      const txSigma = await sigmaToken.transfer(address, sigmaAmount, { nonce: nonce2 });
      this.logger.log(`SIGMA sent: ${txSigma.hash}. Waiting for confirmation...`);
      await txSigma.wait();

      // 3. Record claim in DB
      await this.supabase
        .getClawdbetClient()
        .from(this.TABLE_NAME)
        .insert([
          {
            address: address.toLowerCase(),
            token_type: 'ALL',
            tx_hash: txUsdc.hash,
          },
        ]);

      return {
        success: true,
        txHashes: [txUsdc.hash, txSigma.hash],
      };
    } catch (e) {
      this.logger.error(`Faucet claim failed: ${e.message}`);
      throw new BadRequestException(`On-chain transfer failed: ${e.message}`);
    }
  }

  /**
   * Resets the claim status for a specific user.
   */
  async resetClaim(address: string) {
    const { error } = await this.supabase
      .getClawdbetClient()
      .from(this.TABLE_NAME)
      .delete()
      .eq('address', address.toLowerCase());

    if (error) throw new Error(`Reset failed: ${error.message}`);
    return { success: true, address };
  }

  /**
   * Truncates the entire faucet_claims table.
   */
  async truncateClaims() {
    // Supabase JS doesn't have truncate, so we delete all
    const { error } = await this.supabase
      .getClawdbetClient()
      .from(this.TABLE_NAME)
      .delete()
      .neq('address', '0x'); // Common trick to delete all rows

    if (error) throw new Error(`Truncate failed: ${error.message}`);
    return { success: true };
  }

  /**
   * Gets relayer balances for debugging.
   */
  async getRelayerBalances() {
    const rpcUrl = this.config.getOrThrow<string>('RPC_URL');
    const privateKey = this.config.getOrThrow<string>('WALLET_PRIVATE_KEY');
    const usdcAddress = this.config.getOrThrow<string>('USDC_ADDRESS');
    const sigmaAddress = this.config.getOrThrow<string>('SIGMA_TOKEN_ADDRESS');

    const provider = new JsonRpcProvider(rpcUrl);
    const relayerWallet = new Wallet(privateKey, provider);

    const usdcToken = new Contract(usdcAddress, ERC20_ABI, relayerWallet);
    const sigmaToken = new Contract(sigmaAddress, ERC20_ABI, relayerWallet);

    const [usdc, sigma, eth] = await Promise.all([
      usdcToken.balanceOf(relayerWallet.address),
      sigmaToken.balanceOf(relayerWallet.address),
      provider.getBalance(relayerWallet.address),
    ]);

    return {
      relayerAddress: relayerWallet.address,
      wsusdc: formatUnits(usdc, 6),
      sigma: formatUnits(sigma, 18),
      eth: formatUnits(eth, 18),
    };
  }
}
