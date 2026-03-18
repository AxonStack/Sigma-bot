# ClawdBet Monorepo

Prediction market platform — frontend + backend in a single monorepo.

## Structure

```
packages/
  frontend/   — Next.js 16 web app (React 19, RainbowKit, Wagmi)
  backend/    — NestJS market service (Supabase, ethers.js, HeyElsa x402)
```

## Setup

```bash
npm install          # installs all workspace dependencies
cp packages/backend/.env.example packages/backend/.env
# fill in your env vars
```

## Development

```bash
npm run dev:frontend   # Next.js dev server
npm run dev:backend    # NestJS watch mode
```

## Build

```bash
npm run build          # builds both packages
```

## HeyElsa x402 Integration

The backend includes pay-per-call DeFi API endpoints powered by [HeyElsa x402](https://x402.heyelsa.ai):

- `GET /heyelsa/quote` — Swap quotes across 20+ DEXs
- `GET /heyelsa/portfolio/:address` — Multi-chain portfolio
- `GET /heyelsa/balances/:address` — Token balances
- `GET /heyelsa/tokens?q=` — Token search
- `GET /heyelsa/analyze/:address` — Wallet analysis
- `GET /heyelsa/price/:tokenAddress` — Token price

Configure via `HEYELSA_X402_PAYMENT_TOKEN` in the backend `.env`.
