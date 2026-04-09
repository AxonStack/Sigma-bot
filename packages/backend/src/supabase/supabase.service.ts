import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_WRITE_TABLE } from './supabase.constants';

@Injectable()
export class SupabaseService {
  private readonly client: SupabaseClient;

  constructor(private readonly config: ConfigService) {
    const url = this.config.getOrThrow<string>('CLAWDBET_SUPABASE_URL');
    const key = this.config.getOrThrow<string>(
      'CLAWDBET_SUPABASE_SERVICE_ROLE_KEY',
    );
    this.client = createClient(url, key, {
      auth: { persistSession: false },
    });
  }

  /** Supabase client for the OpenBet project. Legacy write target: clawdbet_markets_data. */
  getClawdbetClient(): SupabaseClient {
    return this.client;
  }

  get writeTable(): string {
    return SUPABASE_WRITE_TABLE;
  }
}
