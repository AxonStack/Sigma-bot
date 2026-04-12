import { Module } from '@nestjs/common';
import { FaucetController } from './faucet.controller';
import { FaucetService } from './faucet.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { MarketsModule } from '../markets/markets.module';

@Module({
  imports: [SupabaseModule, MarketsModule],
  controllers: [FaucetController],
  providers: [FaucetService],
})
export class FaucetModule {}
