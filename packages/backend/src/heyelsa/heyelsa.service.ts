import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  X402Config,
  SwapQuoteRequest,
  SwapQuoteResponse,
  PortfolioRequest,
  PortfolioResponse,
  TokenSearchResult,
  WalletAnalysis,
  CreateLimitOrderRequest,
  LimitOrderResponse,
  AirdropCheckRequest,
  AirdropClaimRequest,
  AirdropResponse,
  PnLReportRequest,
  PnLReportResponse,
} from './heyelsa.types';

const DEFAULT_API_URL = 'https://x402-api.heyelsa.ai/api';

/**
 * HeyElsa x402 Service — Pay-per-call DeFi API client.
 *
 * Uses the x402 micropayment protocol to access DeFi endpoints
 * (portfolio, swap quotes, token search, wallet analysis) without API keys.
 *
 * @see https://x402.heyelsa.ai
 */
@Injectable()
export class HeyElsaService {
  private readonly logger = new Logger(HeyElsaService.name);
  private readonly config: X402Config;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      apiUrl: this.configService.get<string>('HEYELSA_X402_API_URL') ?? DEFAULT_API_URL,
      paymentToken: this.configService.get<string>('HEYELSA_X402_PAYMENT_TOKEN') ?? '',
      dryRun: this.configService.get<string>('HEYELSA_X402_DRY_RUN') !== 'false',
    };

    if (!this.config.paymentToken) {
      this.logger.warn('HEYELSA_X402_PAYMENT_TOKEN not set — x402 calls will fail');
    }

    this.logger.log(
      `HeyElsa x402 initialized (api=${this.config.apiUrl}, dryRun=${this.config.dryRun})`,
    );
  }

  /** Get a swap quote for a token pair. Cost: ~$0.01 per call. */
  async getSwapQuote(req: SwapQuoteRequest): Promise<SwapQuoteResponse> {
    return this.call<SwapQuoteResponse>('get_swap_quote', {
      from_chain: req.fromChain ?? 8453,
      to_chain: req.toChain ?? 8453,
      from_token: req.fromToken,
      to_token: req.toToken,
      from_amount: req.amount,
      wallet_address: req.walletAddress,
      slippage: req.slippage ?? 0.5,
    });
  }

  /** Get portfolio balances for a wallet across chains. Cost: ~$0.01 per call. */
  async getPortfolio(req: PortfolioRequest): Promise<PortfolioResponse> {
    return this.call<PortfolioResponse>('get_portfolio', {
      wallet_address: req.evmAddress,
      chains: req.chains,
      include_spam: req.includeSpam ?? false,
      include_nfts: req.includeNfts ?? false,
    });
  }

  /** Get token balances for a wallet. Cost: ~$0.005 per call. */
  async getBalances(evmAddress: string): Promise<PortfolioResponse> {
    return this.call<PortfolioResponse>('get_balances', {
      wallet_address: evmAddress,
    });
  }

  /** Search for tokens by name or symbol. Cost: ~$0.002 per call. */
  async searchToken(query: string, chainId?: number, limit?: number): Promise<TokenSearchResult[]> {
    const result = await this.call<{ tokens: TokenSearchResult[] }>('search_token', {
      symbol_or_address: query,
      chain_id: chainId,
      limit: limit ?? 10,
    });
    return result.tokens ?? [];
  }

  /** Analyze a wallet's holdings and DeFi positions. Cost: ~$0.01 per call. */
  async analyzeWallet(evmAddress: string): Promise<WalletAnalysis> {
    return this.call<WalletAnalysis>('analyze_wallet', {
      wallet_address: evmAddress,
    });
  }

  /** Get price for a specific token. Cost: ~$0.002 per call. */
  async getTokenPrice(tokenAddress: string, chainId: number = 8453): Promise<{ price: number; symbol: string }> {
    return this.call<{ price: number; symbol: string }>('get_token_price', {
      token_address: tokenAddress,
      chain: chainId,
    });
  }

  // ── New Endpoints (Limit Orders, Airdrops, Analytics) ──────────────

  /** Create a new limit order. */
  async createLimitOrder(req: CreateLimitOrderRequest): Promise<LimitOrderResponse> {
    return this.call<LimitOrderResponse>('create_limit_order', {
      from_chain: req.fromChain,
      from_token: req.fromToken,
      from_amount: req.fromAmount,
      to_token: req.toToken,
      limit_price: req.limitPrice,
      wallet_address: req.walletAddress,
      valid_for_hours: req.validForHours ?? 24,
      dry_run: req.dryRun ?? this.config.dryRun,
    });
  }

  /** Get active limit orders for a wallet. */
  async getLimitOrders(walletAddress: string): Promise<LimitOrderResponse[]> {
    const result = await this.call<{ orders: LimitOrderResponse[] }>('get_limit_orders', {
      wallet_address: walletAddress,
    });
    return result.orders ?? [];
  }

  /** Cancel an active limit order. */
  async cancelLimitOrder(orderId: string, walletAddress: string): Promise<{ status: string }> {
    return this.call<{ status: string }>('cancel_limit_order', {
      order_id: orderId,
      wallet_address: walletAddress,
      dry_run: this.config.dryRun,
    });
  }

  /** Check eligibility for ELSA airdrop. */
  async checkAirdrop(req: AirdropCheckRequest): Promise<AirdropResponse> {
    return this.call<AirdropResponse>('check_airdrop', {
      chain: req.chain,
      tranche: req.tranche,
      eoa_address: req.eoaAddress,
    });
  }

  /** Claim ELSA airdrop tokens. */
  async claimAirdrop(req: AirdropClaimRequest): Promise<AirdropResponse> {
    return this.call<AirdropResponse>('claim_airdrop', {
      chain: req.chain,
      tranche: req.tranche,
      eoa_address: req.eoaAddress,
      dry_run: req.dryRun ?? this.config.dryRun,
    });
  }

  /** Get PnL report for a wallet. */
  async getPnLReport(req: PnLReportRequest): Promise<PnLReportResponse> {
    return this.call<PnLReportResponse>('get_pnl_report', {
      wallet_address: req.walletAddress,
      time_period: req.timePeriod ?? 'all',
    });
  }

  /** Get yield suggestions for a wallet. */
  async getYieldSuggestions(walletAddress: string, riskTolerance: string = 'medium'): Promise<any> {
    return this.call<any>('get_yield_suggestions', {
      wallet_address: walletAddress,
      risk_tolerance: riskTolerance,
    });
  }

  /** Check service health / reachability. */
  async healthCheck(): Promise<{ status: string; dryRun: boolean; apiUrl: string }> {
    return {
      status: this.config.paymentToken ? 'configured' : 'missing_payment_token',
      dryRun: this.config.dryRun,
      apiUrl: this.config.apiUrl,
    };
  }

  // ── Internal ──────────────────────────────────────────────────────

  private async call<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
    const url = `${this.config.apiUrl}/${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.paymentToken) {
      headers['X-PAYMENT'] = this.config.paymentToken;
    }

    if (this.config.dryRun) {
      headers['X-DRY-RUN'] = 'true';
    }

    this.logger.debug(`x402 → POST ${endpoint}`);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      this.logger.error(`x402 ${endpoint} failed (${response.status}): ${text}`);
      throw new Error(`HeyElsa x402 ${endpoint} returned ${response.status}: ${text}`);
    }

    return (await response.json()) as T;
  }
}
