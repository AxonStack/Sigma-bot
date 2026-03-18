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
  chainId?: number;
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
