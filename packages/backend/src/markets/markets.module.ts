import { Module } from '@nestjs/common';
import { MarketsController } from './markets.controller';
import { MarketGenerationService } from './market-generation.service';
import { MarketRelayerService } from './market-relayer.service';
import { MarketJobsService } from './market-jobs.service';
import { MarketSyncModule } from '../market-sync/market-sync.module';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule, MarketSyncModule],
  controllers: [MarketsController],
  providers: [MarketGenerationService, MarketRelayerService, MarketJobsService],
  exports: [MarketRelayerService],
})
export class MarketsModule {}
