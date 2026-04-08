import { Module } from '@nestjs/common';
import { MarketPricesService } from './market-prices.service';
import { MarketResolutionService } from './market-resolution.service';

@Module({
  providers: [MarketPricesService, MarketResolutionService],
  exports: [MarketPricesService],
})
export class MarketSyncModule {}
