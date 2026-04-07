import { Controller, Get, Query, Param, BadRequestException } from '@nestjs/common';
import { HeyElsaService } from './heyelsa.service';

/**
 * HeyElsa x402 endpoints — DeFi market intelligence for SigmaBet.
 *
 * Powered by HeyElsa's pay-per-call x402 protocol.
 * @see https://x402.heyelsa.ai
 */
@Controller('heyelsa')
export class HeyElsaController {
  constructor(private readonly heyelsa: HeyElsaService) { }

  /** Health check for the x402 integration. */
  @Get('health')
  async health() {
    return this.heyelsa.healthCheck();
  }

  /**
   * GET /heyelsa/quote?from=0x...&to=0x...&amount=1000000&chainId=8453&slippage=0.5
   *
   * Fetch a swap quote via HeyElsa x402. Useful for pricing market outcome tokens.
   */
  @Get('quote')
  async getQuote(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('amount') amount: string,
    @Query('chainId') chainId?: string,
    @Query('slippage') slippage?: string,
  ) {
    if (!from || !to || !amount) {
      throw new BadRequestException('from, to, and amount query params are required');
    }

    return this.heyelsa.getSwapQuote({
      fromToken: from,
      toToken: to,
      amount,
      fromChain: chainId ? Number(chainId) : 8453,
      toChain: chainId ? Number(chainId) : 8453,
      slippage: slippage ? Number(slippage) : undefined,
    });
  }

  /**
   * GET /heyelsa/portfolio/:address?chains=8453,1
   *
   * Get multi-chain portfolio for a wallet. Useful for showing bettor holdings.
   */
  @Get('portfolio/:address')
  async getPortfolio(
    @Param('address') address: string,
    @Query('chains') chains?: string,
  ) {
    if (!address) {
      throw new BadRequestException('address param is required');
    }

    return this.heyelsa.getPortfolio({
      evmAddress: address,
      chains: chains ? chains.split(',').map(Number) : undefined,
      includeSpam: false,
      includeNfts: false,
    });
  }

  /**
   * GET /heyelsa/balances/:address
   *
   * Get token balances for a wallet.
   */
  @Get('balances/:address')
  async getBalances(@Param('address') address: string) {
    if (!address) {
      throw new BadRequestException('address param is required');
    }

    return this.heyelsa.getBalances(address);
  }

  /**
   * GET /heyelsa/tokens?q=USDC&chainId=8453&limit=5
   *
   * Search for tokens by name or symbol.
   */
  @Get('tokens')
  async searchTokens(
    @Query('q') query: string,
    @Query('chainId') chainId?: string,
    @Query('limit') limit?: string,
  ) {
    if (!query) {
      throw new BadRequestException('q query param is required');
    }

    return this.heyelsa.searchToken(
      query,
      chainId ? Number(chainId) : undefined,
      limit ? Number(limit) : undefined,
    );
  }

  /**
   * GET /heyelsa/analyze/:address
   *
   * Analyze a wallet's holdings, DeFi positions, and risk profile.
   */
  @Get('analyze/:address')
  async analyzeWallet(@Param('address') address: string) {
    if (!address) {
      throw new BadRequestException('address param is required');
    }

    return this.heyelsa.analyzeWallet(address);
  }

  /**
   * GET /heyelsa/price/:tokenAddress?chainId=8453
   *
   * Get current price for a token.
   */
  @Get('price/:tokenAddress')
  async getTokenPrice(
    @Param('tokenAddress') tokenAddress: string,
    @Query('chainId') chainId?: string,
  ) {
    if (!tokenAddress) {
      throw new BadRequestException('tokenAddress param is required');
    }

    return this.heyelsa.getTokenPrice(tokenAddress, chainId ? Number(chainId) : 8453);
  }

  // ── New Endpoints (Limit Orders, Airdrops, Analytics) ──────────────

  /** Get active limit orders for a wallet. */
  @Get('orders/:address')
  async getLimitOrders(@Param('address') address: string) {
    if (!address) {
      throw new BadRequestException('address param is required');
    }
    return this.heyelsa.getLimitOrders(address);
  }

  /** Check eligibility for ELSA airdrop. */
  @Get('airdrop/check/:address')
  async checkAirdrop(
    @Param('address') address: string,
    @Query('chain') chain: string,
    @Query('tranche') tranche: string,
  ) {
    if (!address || !chain || !tranche) {
      throw new BadRequestException('address, chain, and tranche are required');
    }
    return this.heyelsa.checkAirdrop({
      eoaAddress: address,
      chain,
      tranche,
    });
  }

  /** Get PnL report for a wallet. */
  @Get('pnl/:address')
  async getPnLReport(
    @Param('address') address: string,
    @Query('period') period?: '24h' | '7d' | '30d' | 'all',
  ) {
    if (!address) {
      throw new BadRequestException('address param is required');
    }
    return this.heyelsa.getPnLReport({
      walletAddress: address,
      timePeriod: period,
    });
  }

  /** Get yield suggestions for a wallet. */
  @Get('yield/:address')
  async getYieldSuggestions(
    @Param('address') address: string,
    @Query('risk') risk?: string,
  ) {
    if (!address) {
      throw new BadRequestException('address param is required');
    }
    return this.heyelsa.getYieldSuggestions(address, risk);
  }
}
