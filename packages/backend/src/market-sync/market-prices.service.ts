import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import { Contract, JsonRpcProvider } from 'ethers';
import { PNP_FACTORY_ABI } from '../abi/pnp-factory.abi';
import { SupabaseService } from '../supabase/supabase.service';
import * as fs from 'fs';
import * as path from 'path';

const POLL_INTERVAL_MS = 10_000;

@Injectable()
export class MarketPricesService implements OnModuleInit {
  private readonly logger = new Logger(MarketPricesService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly supabase: SupabaseService,
  ) {
    this.logger.log('MarketPricesService constructor initialized');
  }

  async onModuleInit() {
    this.logger.log('MarketPricesService onModuleInit - starting initial price refresh');
    // Trigger an immediate refresh so we don't wait for the interval
    this.refreshPrices().catch(err => {
      this.logger.error('Initial price refresh failed', err);
    });
  }

  @Interval(POLL_INTERVAL_MS)
  async refreshPrices(): Promise<{ updated: number; failed: number }> {
    const rpcUrl = this.config.get<string>('RPC_URL');
    const factoryAddress = this.config.get<string>('CONTRACT_FACTORY_ADDRESS');
    
    this.logger.log(`Starting price refresh... RPC: ${rpcUrl}, Factory: ${factoryAddress}`);

    if (!rpcUrl || !factoryAddress) {
      this.logger.warn('Missing RPC_URL or CONTRACT_FACTORY_ADDRESS, skipping supply refresh');
      return { updated: 0, failed: 0 };
    }

    // 1. Get addresses from Supabase
    const { data: dbRows, error: fetchError } = await this.supabase
      .getClawdbetClient()
      .from(this.supabase.writeTable)
      .select('market_address');

    if (fetchError) {
      this.logger.warn(`Supabase fetch error: ${fetchError.message}. Falling back to JSON only.`);
    }

    // 2. Load local JSON for sync
    const jsonPath = path.join(process.cwd(), 'markets.json');
    let jsonMarkets: any[] = [];
    if (fs.existsSync(jsonPath)) {
      try { jsonMarkets = JSON.parse(fs.readFileSync(jsonPath, 'utf8')); } catch (e) { jsonMarkets = []; }
    }

    // 3. Merge addresses for sync (Priority to JSON if DB fails)
    const dbAddresses = (dbRows || []).map((r: any) => r.market_address.toLowerCase());
    const jsonAddresses = jsonMarkets.map((m: any) => m.market_address.toLowerCase());
    const allUniqueAddresses = Array.from(new Set([...dbAddresses, ...jsonAddresses]));

    if (allUniqueAddresses.length === 0) {
      this.logger.debug('No markets found in DB or JSON to sync.');
      return { updated: 0, failed: 0 };
    }

    this.logger.log(`Found ${allUniqueAddresses.length} markets to sync. Starting contract calls...`);

    try {
      const provider = new JsonRpcProvider(rpcUrl, { chainId: 8453, name: 'base-mainnet' });
      const factory = new Contract(factoryAddress, PNP_FACTORY_ABI, provider);

      let updatedCount = 0;
      let failedCount = 0;

      for (const address of allUniqueAddresses) {
        const marketAddress = toHexBytes32(address);
        let yesPriceStr: string | null = null;
        let noPriceStr: string | null = null;
        
        try {
          const [yesPrice, noPrice] = await factory.getMarketPrices(marketAddress);
          if (yesPrice != null) yesPriceStr = String(yesPrice);
          if (noPrice != null) noPriceStr = String(noPrice);
        } catch (e) {
          failedCount++;
          continue;
        }

        const payload: Record<string, string> = {
          yes_token_supply: yesPriceStr || '0',
          no_token_supply: noPriceStr || '0',
        };

        this.logger.log(`Syncing market ${address.slice(0, 10)}...: YES Price = ${yesPriceStr}`);

        // 1. Update Supabase (Try only, don't block)
        this.supabase
          .getClawdbetClient()
          .from(this.supabase.writeTable)
          .update(payload)
          .eq('market_address', address)
          .then(({ error }) => {
            if (error) this.logger.warn(`Supabase update failed for ${address}: ${error.message}`);
          });

        // 2. Update Local JSON
        const jsonIdx = jsonMarkets.findIndex(m => m.market_address.toLowerCase() === address.toLowerCase());
        if (jsonIdx !== -1) {
          jsonMarkets[jsonIdx] = { ...jsonMarkets[jsonIdx], ...payload };
        }

        updatedCount++;
      }

      // Write updated JSON if we had changes
      if (updatedCount > 0) {
        fs.writeFileSync(jsonPath, JSON.stringify(jsonMarkets, null, 2));
      }

      if (updatedCount > 0 || failedCount > 0) {
        this.logger.log(`Price Sync: ${updatedCount} updated, ${failedCount} failed`);
      }
      return { updated: updatedCount, failed: failedCount };
    } catch (e) {
      this.logger.error('Price Sync Failed', e);
      return { updated: 0, failed: 0 };
    }
  }
}

function toHexBytes32(value: unknown): string {
  if (value == null) return '';
  const hex = typeof value === 'string' ? value : String(value);
  const normalized = hex.startsWith('0x') ? hex.slice(2) : hex;
  return '0x' + normalized.padStart(64, '0').slice(-64);
}
