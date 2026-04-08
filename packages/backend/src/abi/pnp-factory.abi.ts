/** Mirror of lib/abi/abi.ts PNP_FACTORY_ABI for Nest build (src is the only compiled root). */
export const PNP_FACTORY_ABI = [
  // Events
  'event OPENBET_MarketCreated(bytes32 indexed conditionId, address indexed marketCreator)',
  'event OPENBET_DecisionTokensMinted(bytes32 indexed conditionId, uint256 tokenId, address indexed minter, uint256 amount)',
  'event OPENBET_DecisionTokenBurned(bytes32 indexed conditionId, uint256 tokenId, address indexed burner, uint256 amount)',
  'event OPENBET_PositionRedeemed(address indexed user, bytes32 indexed conditionId, uint256 amount)',
  'event OPENBET_MarketSettled(bytes32 indexed conditionId, uint256 winningTokenId, address indexed user)',
  'event OPENBET_ProtocolFeeCollected(bytes32 indexed conditionId, address indexed payer, uint256 amount)',
  'event OPENBET_RemainingReserveClaimed(bytes32 indexed conditionId, address indexed claimer, uint256 amount)',
  
  // Functions
  'function createPredictionMarket(uint256 _initialLiquidity, address _collateralToken, string _question, uint256 _endTime) returns (bytes32)',
  'function mintDecisionTokens(bytes32 conditionId, uint256 collateralAmount, uint256 tokenIdToMint, uint256 minTokensToMint, uint256 deadline)',
  'function burnDecisionTokens(bytes32 conditionId, uint256 tokenIdToBurn, uint256 tokensToBurn, uint256 minCollateralReceived, uint256 deadline) returns (uint256)',
  'function settleMarket(bytes32 conditionId, uint256 _winningTokenId) returns (uint256)',
  'function redeemPosition(bytes32 conditionId) returns (uint256)',
  'function claimRemainingReserve(bytes32 conditionId) returns (uint256)',
  
  // Getters
  'function marketQuestion(bytes32 conditionId) view returns (string)',
  'function marketEndTime(bytes32 conditionId) view returns (uint256)',
  'function isMarketCreated(bytes32 conditionId) view returns (bool)',
  'function marketSettled(bytes32 conditionId) view returns (bool)',
  'function marketReserve(bytes32 conditionId) view returns (uint256)',
  'function collateralToken(bytes32 conditionId) view returns (address)',
  'function winningTokenId(bytes32 conditionId) view returns (uint256)',
  'function getMarketPrices(bytes32 conditionId) view returns (uint256 yesPrice, uint256 noPrice)',
  
  // Errors
  'error InvalidMarketEndTime(address marketCreator, uint256 endTime)',
  'error MarketTradingStopped()',
  'error InvalidAddress(address addr)',
  'error InvalidTokenId(address addr, uint256 tokenId)',
] as const;
