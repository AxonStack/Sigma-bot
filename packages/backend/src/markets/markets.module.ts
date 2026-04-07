import { Module } from '@nestjs/common';
import { MarketsController } from './markets.controller';
import { MarketGenerationService } from './market-generation.service';
import { MarketRelayerService } from './market-relayer.service';

@Module({
  controllers: [MarketsController],
  providers: [MarketGenerationService, MarketRelayerService],
})
export class MarketsModule {}
