import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SupabaseService } from '../supabase/supabase.service';
import { MarketGenerationService } from './market-generation.service';
import { MarketRelayerService } from './market-relayer.service';
import { SUPABASE_MARKET_REQUESTS_TABLE, SUPABASE_MARKET_JOBS_TABLE } from '../supabase/supabase.constants';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MarketJobsService {
  private readonly logger = new Logger(MarketJobsService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly generationService: MarketGenerationService,
    private readonly relayerService: MarketRelayerService,
    private readonly config: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    this.logger.debug('Polling for market jobs...');

    const { data: jobs, error } = await this.supabase
      .getClawdbetClient()
      .from(SUPABASE_MARKET_JOBS_TABLE)
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_for', new Date().toISOString());

    if (error) {
      this.logger.error(`Failed to fetch jobs: ${error.message}`);
      return;
    }

    if (!jobs || jobs.length === 0) return;

    for (const job of jobs) {
      await this.processJob(job);
    }
  }

  private async processJob(job: any) {
    this.logger.log(`Processing job ${job.id} of type ${job.job_type}`);

    // Mark job as processing
    await this.supabase
      .getClawdbetClient()
      .from(SUPABASE_MARKET_JOBS_TABLE)
      .update({ status: 'processing' })
      .eq('id', job.id);

    try {
      if (job.job_type === 'transition_to_evaluating') {
        await this.handleTransitionToEvaluating(job);
      } else if (job.job_type === 'execute_ai_evaluation') {
        await this.handleAiEvaluation(job);
      }

      // Mark job as completed
      await this.supabase
        .getClawdbetClient()
        .from(SUPABASE_MARKET_JOBS_TABLE)
        .update({ status: 'completed' })
        .eq('id', job.id);
    } catch (error) {
      this.logger.error(`Job ${job.id} failed: ${error.message}`);
      await this.supabase
        .getClawdbetClient()
        .from(SUPABASE_MARKET_JOBS_TABLE)
        .update({ status: 'failed' })
        .eq('id', job.id);

      // Update the request with the error so the user isn't stuck in "Reviewing"
      await this.supabase
        .getClawdbetClient()
        .from(SUPABASE_MARKET_REQUESTS_TABLE)
        .update({ 
          status: 'failed',
          error_message: error.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', job.market_request_id);
    }
  }

  private async handleTransitionToEvaluating(job: any) {
    this.logger.log(`Transitioning market request ${job.market_request_id} to evaluating...`);

    // 1. Update request status
    const { error: updateError } = await this.supabase
      .getClawdbetClient()
      .from(SUPABASE_MARKET_REQUESTS_TABLE)
      .update({ status: 'evaluating', updated_at: new Date().toISOString() })
      .eq('id', job.market_request_id);

    if (updateError) throw new Error(`Failed to update request: ${updateError.message}`);

    // 2. Schedule AI evaluation job (4 minutes later)
    const scheduledFor = new Date();
    scheduledFor.setMinutes(scheduledFor.getMinutes() + 4);

    const { error: jobError } = await this.supabase
      .getClawdbetClient()
      .from(SUPABASE_MARKET_JOBS_TABLE)
      .insert([
        {
          market_request_id: job.market_request_id,
          job_type: 'execute_ai_evaluation',
          status: 'scheduled',
          scheduled_for: scheduledFor.toISOString(),
        },
      ]);

    if (jobError) throw new Error(`Failed to schedule next job: ${jobError.message}`);
  }

  private async handleAiEvaluation(job: any) {
    this.logger.log(`Executing AI evaluation for market request ${job.market_request_id}...`);

    // 1. Get request details
    const { data: request, error: fetchError } = await this.supabase
      .getClawdbetClient()
      .from(SUPABASE_MARKET_REQUESTS_TABLE)
      .select('*')
      .eq('id', job.market_request_id)
      .single();

    if (fetchError || !request) throw new Error(`Failed to fetch request: ${fetchError?.message}`);

    try {
      // 2. Call AI
      const aiResult = await this.generationService.generateFromPrompt(request.prompt);

      if (aiResult.resolvable) {
        // 3. Accepted: Deploy Market
        this.logger.log(`AI accepted question. Deploying market for request ${job.market_request_id}...`);
        
        const sigmaAddress = this.config.getOrThrow<string>('SIGMA_TOKEN_ADDRESS');
        
        const deployment = await this.relayerService.executeMarketCreation({
          question: aiResult.question,
          description: aiResult.description,
          endTime: aiResult.endTime,
          initialLiquidity: '100', // Default
          collateralToken: sigmaAddress,
          creatorAddress: request.creator,
          userPaymentTxHash: request.tx_hash,
        });

        await this.supabase
          .getClawdbetClient()
          .from(SUPABASE_MARKET_REQUESTS_TABLE)
          .update({
            status: 'deployed',
            question: aiResult.question,
            description: aiResult.description,
            condition_id: deployment.conditionId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', job.market_request_id);
          
      } else {
        // 4. Rejected: Refund 2 USDC
        this.logger.warn(`AI rejected question: ${aiResult.reason}. Refunding 2 USDC to ${request.creator}...`);
        
        const refundTxHash = await this.relayerService.refundUSDC(request.creator);

        await this.supabase
          .getClawdbetClient()
          .from(SUPABASE_MARKET_REQUESTS_TABLE)
          .update({
            status: 'rejected',
            error_message: aiResult.reason || 'Rejected by AI evaluation',
            refund_tx_hash: refundTxHash,
            updated_at: new Date().toISOString(),
          })
          .eq('id', job.market_request_id);
      }
    } catch (error) {
      this.logger.error(`Failed to evaluate or deploy market: ${error.message}`);
      // On internal failure, we might want to mark it as rejected to avoid manual intervention?
      // For now, let's just throw so the job system can retry or mark as failed.
      throw error;
    }
  }
}
