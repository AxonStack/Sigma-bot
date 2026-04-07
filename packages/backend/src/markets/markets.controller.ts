import { Controller, Get, Post, Body, Param, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { MarketGenerationService } from './market-generation.service';
import { MarketRelayerService } from './market-relayer.service';

function toOddsPercent(raw: string | null): number {
  if (!raw || raw === '0') return 0;
  return Number((BigInt(raw) * 10000n / BigInt('1000000000000000000'))) / 100;
}

@Controller()
export class MarketsController {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly generationService: MarketGenerationService,
    private readonly relayerService: MarketRelayerService,
  ) {}

  @Post('markets/execute-creation')
  async executeCreation(@Body() body: {
    question: string;
    description: string;
    endTime: number;
    initialLiquidity: string;
    collateralToken: string;
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

  @Get('markets')
  async getMarkets() {
    const { data } = await this.supabase
      .getClawdbetClient()
      .from(this.supabase.writeTable)
      .select('market_createdTime, market_address, market_endTime, creator, question, yes_token_supply, no_token_supply');

    const rows = (data ?? []) as Array<{
      market_createdTime: string | null;
      market_address: string;
      market_endTime: string | null;
      creator: string;
      question: string | null;
      yes_token_supply: string | null;
      no_token_supply: string | null;
    }>;

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
    const { data, error } = await this.supabase
      .getClawdbetClient()
      .from(this.supabase.writeTable)
      .select('*')
      .eq('market_address', conditionId)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Market ${conditionId} not found`);
    }

    const row = data as Record<string, unknown>;
    return {
      ...row,
      yes_odds: toOddsPercent(row.yes_token_supply as string | null),
      no_odds: toOddsPercent(row.no_token_supply as string | null),
    };
  }
}
