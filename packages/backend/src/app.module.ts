import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HeyElsaModule } from './heyelsa/heyelsa.module';
import { MarketSyncModule } from './market-sync/market-sync.module';
import { MarketsModule } from './markets/markets.module';
import { FaucetModule } from './faucet/faucet.module';
import { ProfilesModule } from './profiles/profiles.module';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ScheduleModule.forRoot(),
    SupabaseModule,
    MarketSyncModule,
    MarketsModule,
    ProfilesModule,
    HeyElsaModule,
    FaucetModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
