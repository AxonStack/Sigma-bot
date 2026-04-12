import { Controller, Get, Post, Body, Param, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { MarketGenerationService } from './market-generation.service';
import { MarketRelayerService } from './market-relayer.service';
import { MarketPricesService } from '../market-sync/market-prices.service';
import { SUPABASE_MARKET_REQUESTS_TABLE, SUPABASE_MARKET_JOBS_TABLE } from '../supabase/supabase.constants';
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

  @Get('markets/debug/inspect')
  async inspectDb() {
    const { data: requests } = await this.supabase
      .getClawdbetClient()
      .from(SUPABASE_MARKET_REQUESTS_TABLE)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
      
    const { data: jobs } = await this.supabase
      .getClawdbetClient()
      .from(SUPABASE_MARKET_JOBS_TABLE)
      .select('*')
      .order('scheduled_for', { ascending: false })
      .limit(20);
      
    return { requests, jobs };
  }

  @Get('markets/debug/reset-jobs')
  async resetJobs() {
    const { data, error } = await this.supabase
      .getClawdbetClient()
      .from(SUPABASE_MARKET_JOBS_TABLE)
      .update({ status: 'scheduled' })
      .eq('status', 'failed');
      
    if (error) throw new Error(`Failed to reset jobs: ${error.message}`);
    return { success: true };
  }

  @Post('markets/request')
  async createMarketRequest(@Body() body: {
    prompt: string;
    creator: string;
    txHash: string;
  }) {
    if (!body.prompt || !body.creator || !body.txHash) {
      throw new NotFoundException('Prompt, creator, and txHash are required');
    }

    // 1. Create the market request
    const { data: request, error: requestError } = await this.supabase
      .getClawdbetClient()
      .from(SUPABASE_MARKET_REQUESTS_TABLE)
      .insert([
        {
          prompt: body.prompt,
          creator: body.creator.toLowerCase(),
          tx_hash: body.txHash,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (requestError) throw new Error(`Failed to create request: ${requestError.message}`);

    // 2. Schedule the first job (5 minutes from now)
    const scheduledFor = new Date();
    scheduledFor.setMinutes(scheduledFor.getMinutes() + 5);

    const { error: jobError } = await this.supabase
      .getClawdbetClient()
      .from(SUPABASE_MARKET_JOBS_TABLE)
      .insert([
        {
          market_request_id: request.id,
          job_type: 'transition_to_evaluating',
          status: 'scheduled',
          scheduled_for: scheduledFor.toISOString(),
        },
      ]);

    if (jobError) throw new Error(`Failed to schedule job: ${jobError.message}`);

    return request;
  }

  @Get('markets/requests/:address')
  async getMarketRequests(@Param('address') address: string) {
    const { data, error } = await this.supabase
      .getClawdbetClient()
      .from(SUPABASE_MARKET_REQUESTS_TABLE)
      .select('*')
      .eq('creator', address.toLowerCase())
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch requests: ${error.message}`);

    // Calculate simulated global queue info
    const { count: realQueueCount } = await this.supabase
      .getClawdbetClient()
      .from(SUPABASE_MARKET_REQUESTS_TABLE)
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'evaluating']);

    const totalQueue = (realQueueCount || 0) + 5 + Math.floor(Math.random() * 10);
    const passedPending = (realQueueCount || 0) > 0 
      ? Math.floor(Math.random() * totalQueue)
      : Math.floor(Math.random() * 3);
    
    // Map to the frontend format expected by MarketRequestEntry
    return (data || []).map(r => {
      const isQueueStage = r.status === 'pending' || r.status === 'evaluating';
      
      return {
        id: r.id,
        creator: r.creator,
        prompt: r.prompt,
        question: r.question || r.prompt,
        createdAt: new Date(r.created_at).getTime(),
        reviewEndsAt: new Date(r.created_at).getTime() + (9 * 60 * 1000), // Approx 9 mins total
        status: r.status === 'evaluating' ? 'reviewing' : r.status,
        resolutionMessage: r.error_message,
        description: r.description,
        txHash: r.tx_hash,
        conditionId: r.condition_id,
        refundTxHash: r.refund_tx_hash,
        queueInfo: isQueueStage ? {
          current: passedPending,
          total: totalQueue
        } : undefined
      };
    });
  }

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
