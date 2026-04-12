/** App config: API URLs and other shared constants */

function cleanEnv(value: string | undefined): string {
  return (value ?? "").trim().replace(/\/$/, "");
}

const MARKET_SERVICE_BASE = cleanEnv(
  process.env.NEXT_PUBLIC_OPENBET_MARKET_SERVICE_URL ??
    process.env.OPENBET_MARKET_SERVICE_URL ??
    process.env.NEXT_PUBLIC_CLAWDBET_MARKET_SERVICE_URL ??
    process.env.CLAWDBET_MARKET_SERVICE_URL
);

export const MARKET_SERVICE_BASE_URL = MARKET_SERVICE_BASE;

export const MARKETS_API = `${MARKET_SERVICE_BASE}/markets`;
export const FAUCET_API = `${MARKET_SERVICE_BASE}/faucet`;
