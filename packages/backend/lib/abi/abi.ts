export const ERC20_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)"
  ];
  
  export const PNP_FACTORY_ABI = [
    // Events
    "event PNP_MarketCreated(bytes32 indexed conditionId, address indexed marketCreator)",
    "event PNP_DecisionTokensMinted(bytes32 indexed conditionId, uint256 tokenId, address indexed minter, uint256 amount)",
    "event PNP_DecisionTokenBurned(bytes32 indexed conditionId, uint256 tokenId, address indexed burner, uint256 amount)",
    "event PNP_PositionRedeemed(address indexed user, bytes32 indexed conditionId, uint256 amount)",
    "event PNP_MarketSettled(bytes32 indexed conditionId, uint256 winningTokenId, address indexed user)",
  
    // Write Functions
    "function createPredictionMarket(uint256 _initialLiquidity, address _collateralToken, string _question, uint256 _endTime) returns (bytes32)",
    "function mintDecisionTokens(bytes32 conditionId, uint256 collateralAmount, uint256 tokenIdToMint, uint256 minTokensToMint, uint256 deadline)",
    "function burnDecisionTokens(bytes32 conditionId, uint256 tokenIdToBurn, uint256 tokensToBurn, uint256 minCollateralReceived, uint256 deadline) returns (uint256)",
    "function redeemPosition(bytes32 conditionId) returns (uint256)",
    "function settleMarket(bytes32 conditionId, uint256 _winningTokenId) returns (uint256)",
    
    // Read Functions
    "function getYesTokenId(bytes32 conditionId) view returns (uint256)",
    "function getNoTokenId(bytes32 conditionId) view returns (uint256)",
    "function marketQuestion(bytes32 conditionId) view returns (string)",
    "function marketEndTime(bytes32 conditionId) view returns (uint256)",
    "function isMarketCreated(bytes32 conditionId) view returns (bool)",
    "function marketSettled(bytes32 conditionId) view returns (bool)",
    "function marketReserve(bytes32 conditionId) view returns (uint256)",
    "function collateralToken(bytes32 conditionId) view returns (address)",
    "function winningTokenId(bytes32 conditionId) view returns (uint256)",
    "function balanceOf(address account, uint256 id) view returns (uint256)",
    "function getMarketPrices(bytes32 conditionId) view returns (uint256 yesPrice, uint256 noPrice)",
    "function previewMint(bytes32 conditionId, uint256 collateralAmount, uint256 tokenIdToMint) view returns (uint256 tokensOut, uint256 effectivePrice)",
    "function previewBurn(bytes32 conditionId, uint256 tokenIdToBurn, uint256 tokensToBurn) view returns (uint256 collateralOut, uint256 effectivePrice)",
  
    // Errors
    "error InvalidMarketEndTime(address marketCreator, uint256 endTime)",
    "error MarketTradingStopped()",
    "error InvalidAddress(address addr)",
    "error InvalidTokenId(address addr, uint256 tokenId)"
  ];