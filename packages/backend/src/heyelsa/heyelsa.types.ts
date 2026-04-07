/** HeyElsa x402 API types */

export interface X402Config {
  apiUrl: string;
  paymentToken: string;
  dryRun: boolean;
}

export interface SwapQuoteRequest {
  fromToken: string;
  toToken: string;
  amount: string;
  fromChain?: number;
  toChain?: number;
  walletAddress?: string;
  slippage?: number;
}

export interface SwapQuoteResponse {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  priceImpact: number;
  route: string[];
  estimatedGas: string;
  provider: string;
}

export interface PortfolioRequest {
  evmAddress: string;
  chains?: number[];
  includeSpam?: boolean;
  includeNfts?: boolean;
}

export interface PortfolioResponse {
  address: string;
  totalValueUsd: number;
  chains: ChainBalance[];
}

export interface ChainBalance {
  chainId: number;
  chainName: string;
  totalValueUsd: number;
  tokens: TokenBalance[];
}

export interface TokenBalance {
  symbol: string;
  name: string;
  address: string;
  balance: string;
  valueUsd: number;
  price: number;
}

export interface TokenSearchRequest {
  query: string;
  chainId?: number;
  limit?: number;
}

export interface TokenSearchResult {
  address: string;
  symbol: string;
  name: string;
  chainId: number;
  decimals: number;
  priceUsd: number;
  logoUrl?: string;
}

export interface WalletAnalysis {
  address: string;
  totalValueUsd: number;
  defiPositions: number;
  activeChains: number;
  riskScore: string;
  topHoldings: TokenBalance[];
}

// ── Limit Orders ──────────────────────────────────────────────────

export interface CreateLimitOrderRequest {
  fromChain: number;
  fromToken: string;
  fromAmount: string;
  toToken: string;
  limitPrice: string;
  walletAddress: string;
  validForHours?: number;
  dryRun?: boolean;
}

export interface LimitOrderResponse {
  orderId: string;
  status: string; // 'active', 'filled', 'cancelled'
  fromToken: string;
  toToken: string;
  fromAmount: string;
  limitPrice: string;
}

// ── Airdrops ──────────────────────────────────────────────────────

export interface AirdropCheckRequest {
  chain: number | string;
  tranche: string;
  eoaAddress: string;
}

export interface AirdropClaimRequest extends AirdropCheckRequest {
  dryRun?: boolean;
}

export interface AirdropResponse {
  eligible: boolean;
  amount: string;
  proof?: string[];
  claimed: boolean;
}

// ── Analytics ─────────────────────────────────────────────────────

export interface PnLReportRequest {
  walletAddress: string;
  timePeriod?: '24h' | '7d' | '30d' | 'all';
}

export interface PnLReportResponse {
  walletAddress: string;
  totalPnLUsd: number;
  realizedPnLUsd: number;
  unrealizedPnLUsd: number;
  tradesCount: number;
}
