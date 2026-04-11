import { Controller, Get, Post, Body, Param, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { MarketGenerationService } from './market-generation.service';
import { MarketRelayerService } from './market-relayer.service';
import { MarketPricesService } from '../market-sync/market-prices.service';
import * as fs from 'fs';
import * as path from 'path';

function toOddsPercent(raw: string | null): number {
  if (!raw || raw === '0') return 50;
  try {
    return Number((BigInt(raw) * 10000n / BigInt('1000000000000000000'))) / 100;
  } catch (e) {
    return 50;
  }
}

@Controller()
export class MarketsController {
  private readonly jsonFilePath = path.join(process.cwd(), 'markets.json');

  constructor(
    private readonly supabase: SupabaseService,
    private readonly generationService: MarketGenerationService,
    private readonly relayerService: MarketRelayerService,
    private readonly pricesService: MarketPricesService,
  ) {}

  @Post('markets/execute-creation')
  async executeCreation(@Body() body: {
    question: string;
    description: string;
    endTime: number;
    initialLiquidity: string;
    collateralToken: string;
    creatorAddress?: string;
    userPaymentTxHash?: string;
  }) {
    return this.relayerService.executeMarketCreation(body);
  }

  @Post('markets/generate')
  async generateMarket(@Body('prompt') prompt: string) {
    if (!prompt) {
      throw new NotFoundException('Prompt is required');
    }
    return this.generationService.generateFromPrompt(prompt);
  }

  @Post('markets/chat')
  async diagnosticChat(@Body('prompt') prompt: string) {
    if (!prompt) {
      throw new NotFoundException('Prompt is required');
    }
    return { response: await this.generationService.chat(prompt) };
  }

  @Get('markets/sync')
  async manualSync() {
    return this.pricesService.refreshPrices();
  }

  @Get('markets')
  async getMarkets() {
    // 1. Fetch from JSON
    let jsonMarkets: any[] = [];
    if (fs.existsSync(this.jsonFilePath)) {
      try {
        const content = fs.readFileSync(this.jsonFilePath, 'utf8');
        jsonMarkets = JSON.parse(content);
      } catch (e) {
        jsonMarkets = [];
      }
    }

    // 2. Fetch from Supabase
    const { data: dbData } = await this.supabase
      .getClawdbetClient()
      .from(this.supabase.writeTable)
      .select('market_createdTime, market_address, market_endTime, creator, question, yes_token_supply, no_token_supply');

    const dbRows = (dbData ?? []) as Array<any>;
    
    // 3. Merge (use a Map to avoid duplicates by market_address)
    const allMarketsMap = new Map();
    
    // Add JSON markets first (often more metadata)
    jsonMarkets.forEach(m => allMarketsMap.set(m.market_address, m));
    
    // Add DB markets (override or augment)
    dbRows.forEach(m => {
      const existing = allMarketsMap.get(m.market_address) || {};
      allMarketsMap.set(m.market_address, { ...existing, ...m });
    });

    const rows = Array.from(allMarketsMap.values());

    return rows.map((r) => ({
      createdAt: r.market_createdTime,
      market_address: r.market_address,
      market_endTime: r.market_endTime,
      creator: r.creator,
      question: r.question,
      yes_token_supply: r.yes_token_supply,
      no_token_supply: r.no_token_supply,
      yes_odds: toOddsPercent(r.yes_token_supply),
      no_odds: toOddsPercent(r.no_token_supply),
    }));
  }

  @Get('market/:conditionId')
  async getMarket(@Param('conditionId') conditionId: string) {
    // 1. Try Supabase first (Primary source of truth)
    const { data, error } = await this.supabase
      .getClawdbetClient()
      .from(this.supabase.writeTable)
      .select('*')
      .eq('market_address', conditionId)
      .single();

    if (data && !error) {
      const row = data as Record<string, unknown>;
      return {
        ...row,
        yes_odds: toOddsPercent(row.yes_token_supply as string | null),
        no_odds: toOddsPercent(row.no_token_supply as string | null),
      };
    }

    // 2. Try JSON as fallback
    if (fs.existsSync(this.jsonFilePath)) {
      try {
        const content = fs.readFileSync(this.jsonFilePath, 'utf8');
        const markets = JSON.parse(content);
        const match = markets.find((m: any) => m.market_address.toLowerCase() === conditionId.toLowerCase());
        if (match) {
          return {
            ...match,
            yes_odds: toOddsPercent(match.yes_token_supply),
            no_odds: toOddsPercent(match.no_token_supply),
          };
        }
      } catch (e) { /* ignore */ }
    }

    throw new NotFoundException(`Market ${conditionId} not found`);
  }
}
