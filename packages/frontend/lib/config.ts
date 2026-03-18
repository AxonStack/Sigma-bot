/** App config: API URLs and other shared constants */

const MARKET_SERVICE_BASE = (
  process.env.NEXT_PUBLIC_CLAWDBET_MARKET_SERVICE_URL ??
  process.env.CLAWDBET_MARKET_SERVICE_URL ??
  ""
).replace(/\/$/, "");

export const MARKET_SERVICE_BASE_URL = MARKET_SERVICE_BASE;

export const MARKETS_API = `${MARKET_SERVICE_BASE}/markets`;
