import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import { Contract, JsonRpcProvider } from 'ethers';
import { PNP_FACTORY_ABI } from '../abi/pnp-factory.abi';
import { SupabaseService } from '../supabase/supabase.service';

const POLL_INTERVAL_MS = 30_000;

/**
 * Periodically refreshes yes_token_supply & no_token_supply for all markets (factory pool balances).
 * Requires clawdbet_markets_data columns: yes_token_supply (text), no_token_supply (text).
 */
@Injectable()
export class MarketPricesService {
  private readonly logger = new Logger(MarketPricesService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly supabase: SupabaseService,
  ) {}

  /** Runs every 30s to refresh yes_token_supply & no_token_supply for all markets. */
  @Interval(POLL_INTERVAL_MS)
  async refreshPrices(): Promise<void> {
    const rpcUrl = this.config.get<string>('RPC_URL');
    const factoryAddress = this.config.get<string>('CONTRACT_FACTORY_ADDRESS');

    if (!rpcUrl || !factoryAddress) {
      this.logger.warn('Missing RPC_URL or CONTRACT_FACTORY_ADDRESS, skipping supply refresh');
      return;
    }

    const { data: rows, error: fetchError } = await this.supabase
      .getClawdbetClient()
      .from(this.supabase.writeTable)
      .select('market_address');

    if (fetchError || !rows?.length) {
      if (fetchError) this.logger.warn('Failed to fetch markets for supply refresh:', fetchError.message);
      return;
    }

    try {
      const provider = new JsonRpcProvider(rpcUrl, { chainId: 8453, name: 'base-mainnet' });
      const factory = new Contract(factoryAddress, PNP_FACTORY_ABI, provider);

      let updated = 0;
      let failed = 0;

      for (const row of rows as { market_address: string }[]) {
        const marketAddress = toHexBytes32(row.market_address);
        let yesSupply: string | null = null;
        let noSupply: string | null = null;
        try {
          const [yesPrice, noPrice] = await factory.getMarketPrices(marketAddress);
          if (yesPrice != null) yesSupply = String(yesPrice);
          if (noPrice != null) noSupply = String(noPrice);
        } catch {
          // Contract reverted – skip update so we never overwrite existing values with null
          failed++;
          continue;
        }
        if (yesSupply == null && noSupply == null) {
          failed++;
          continue;
        }
        const payload: Record<string, string> = {};
        if (yesSupply != null) payload.yes_token_supply = yesSupply;
        if (noSupply != null) payload.no_token_supply = noSupply;
        const { error } = await this.supabase
          .getClawdbetClient()
          .from(this.supabase.writeTable)
          .update(payload)
          .eq('market_address', row.market_address);

        if (error) {
          failed++;
          continue;
        }
        updated++;
      }

      if (updated > 0 || failed > 0) {
        this.logger.log(`Supply refresh: ${updated} updated, ${failed} failed`);
      }
    } catch (e) {
      this.logger.error('Supply refresh failed', e);
    }
  }
}

function toHexBytes32(value: unknown): string {
  if (value == null) return '';
  const hex = typeof value === 'string' ? value : String(value);
  const normalized = hex.startsWith('0x') ? hex.slice(2) : hex;
  return '0x' + normalized.padStart(64, '0').slice(-64);
}
