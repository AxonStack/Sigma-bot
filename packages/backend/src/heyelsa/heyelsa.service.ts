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
      from_token: req.fromToken,
      to_token: req.toToken,
      amount: req.amount,
      chain_id: req.chainId ?? 8453, // Default to Base
      slippage: req.slippage ?? 0.5,
    });
  }

  /** Get portfolio balances for a wallet across chains. Cost: ~$0.01 per call. */
  async getPortfolio(req: PortfolioRequest): Promise<PortfolioResponse> {
    return this.call<PortfolioResponse>('get_portfolio', {
      evm_address: req.evmAddress,
      chains: req.chains,
    });
  }

  /** Get token balances for a wallet. Cost: ~$0.005 per call. */
  async getBalances(evmAddress: string): Promise<PortfolioResponse> {
    return this.call<PortfolioResponse>('get_balances', {
      evm_address: evmAddress,
    });
  }

  /** Search for tokens by name or symbol. Cost: ~$0.002 per call. */
  async searchTokens(query: string, chainId?: number, limit?: number): Promise<TokenSearchResult[]> {
    const result = await this.call<{ tokens: TokenSearchResult[] }>('search_tokens', {
      query,
      chain_id: chainId,
      limit: limit ?? 10,
    });
    return result.tokens ?? [];
  }

  /** Analyze a wallet's holdings and DeFi positions. Cost: ~$0.01 per call. */
  async analyzeWallet(evmAddress: string): Promise<WalletAnalysis> {
    return this.call<WalletAnalysis>('analyze_wallet', {
      evm_address: evmAddress,
    });
  }

  /** Get price for a specific token. Cost: ~$0.002 per call. */
  async getTokenPrice(tokenAddress: string, chainId: number = 8453): Promise<{ price: number; symbol: string }> {
    return this.call<{ price: number; symbol: string }>('get_token_price', {
      token_address: tokenAddress,
      chain_id: chainId,
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
