# Supabase tables schema reference

**Last verified:** Run `npx ts-node -r dotenv/config scripts/verify-schema.ts` to re-check.

---

## 1. market_oracle_db (read-only)

**Actual columns in DB** (casing and extras from live DB):

| Column               | Notes |
|----------------------|--------|
| id                   | (in DB) |
| market_address       | text |
| question             | text |
| settlement_criteria  | jsonb |
| settlement_data      | jsonb |
| market_createdtime   | time – **lowercase** in DB (not `market_createdTime`) |
| market_endtime       | time – **lowercase** in DB (not `market_endTime`) |
| market_volume        | (in DB) |
| token_address        | in DB (we had documented `collateral_token_mint`) |
| token_data           | (in DB) |
| type                 | (in DB) |

---

## 2. market_allData (read-only)

**Actual columns in DB** – all documented columns exist; extra columns:

| Column (expected)    | In DB |
|----------------------|--------|
| market               | ✓ varchar |
| question             | ✓ text |
| creator              | ✓ varchar |
| initial_liquidity    | ✓ numeric |
| market_reserves      | ✓ numeric |
| end_time             | ✓ timestamptz |
| resolved             | ✓ bool |
| yes_token_mint       | ✓ varchar |
| no_token_mint        | ✓ varchar |

**Extra in DB:** id, category, created_at, updated_at, creator_fees, extra_data, market_volume, no_token_supply, yes_token_supply, question_embedding, signature, slot, timestamp, type.

---

## 3. clawdbet_markets_data (write)

**Project:** Separate Supabase project — use `CLAWDBET_SUPABASE_URL` and `CLAWDBET_SUPABASE_SERVICE_ROLE_KEY` (see `getClawdbetClient()`).

| Column               | Type   |
|----------------------|--------|
| market_address       | text   |
| question             | text   |
| settlement_criteria   | jsonb  |
| settlement_data      | jsonb  |
| market_createdTime   | time   |
| market_endTime       | time   |
| creator              | varchar |
| yes_token_mint       | varchar |
| no_token_mint        | varchar |
