/**
 * Backfill synced_at, synced_block, market_createdTime, market_endTime,
 * yes_token_supply, and no_token_supply for rows in the legacy
 * clawdbet_markets_data table that are missing them.
 *
 * Run: npx ts-node -r dotenv/config scripts/backfill-openbet.ts
 */
import { createClient } from '@supabase/supabase-js';
import { Contract, JsonRpcProvider } from 'ethers';
import { PNP_FACTORY_ABI } from '../src/abi/pnp-factory.abi';

const WRITE_TABLE = 'clawdbet_markets_data';

function toTimeString(d: Date): string {
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function toHexBytes32(value: unknown): string {
  if (value == null) return '';
  const hex = typeof value === 'string' ? value : String(value);
  const normalized = hex.startsWith('0x') ? hex.slice(2) : hex;
  return '0x' + normalized.padStart(64, '0').slice(-64);
}

async function main() {
  const rpcUrl = process.env.RPC_URL;
  const factoryAddress = process.env.CONTRACT_FACTORY_ADDRESS;
  const supabaseUrl = process.env.CLAWDBET_SUPABASE_URL;
  const supabaseKey =
    process.env.CLAWDBET_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.CLAWDBET_SUPABASE_ANON_KEY;

  if (!rpcUrl || !factoryAddress) {
    console.error('Missing RPC_URL or CONTRACT_FACTORY_ADDRESS in .env');
    process.exit(1);
  }

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      'Missing CLAWDBET_SUPABASE_URL and CLAWDBET_SUPABASE_SERVICE_ROLE_KEY (or ANON_KEY) in .env',
    );
    process.exit(1);
  }

  const provider = new JsonRpcProvider(rpcUrl, { chainId: 8453, name: 'base-mainnet' });
  const factory = new Contract(factoryAddress, PNP_FACTORY_ABI, provider);
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  const { data: rows, error: fetchError } = await supabase
    .from(WRITE_TABLE)
    .select('market_address, synced_block')
    .or('market_createdTime.is.null,market_endTime.is.null,yes_token_supply.is.null,no_token_supply.is.null');

  if (fetchError) {
    console.error('Failed to fetch rows:', fetchError.message);
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.log(
      'No rows with missing market_createdTime / market_endTime / yes_token_supply / no_token_supply. Nothing to do.',
    );
    return;
  }

  console.log(`Found ${rows.length} market(s) to backfill (timestamps &/or prices).\n`);

  const currentBlock = await provider.getBlockNumber();
  let updated = 0;
  let failed = 0;

  for (const row of rows as { market_address: string; synced_block: number | null }[]) {
    const marketAddress = toHexBytes32(row.market_address);
    process.stdout.write(`  ${marketAddress} ... `);

    const updatePayload: Record<string, unknown> = {
      synced_at: new Date().toISOString(),
      synced_block: currentBlock,
    };

    if (row.synced_block != null) {
      try {
        const block = await provider.getBlock(row.synced_block);
        if (block?.timestamp != null) {
          updatePayload.market_createdTime = toTimeString(new Date(block.timestamp * 1000));
        }
      } catch {
        // ignore block fetch errors
      }
    }

    let skipRow = false;
    try {
      const isCreated = await factory.isMarketCreated(marketAddress);
      if (!isCreated) {
        console.log('skipped (not found on-chain)');
        skipRow = true;
      }
    } catch {
      // Contract reverted; still do partial update.
    }

    if (!skipRow) {
      try {
        const endTimeBig = await factory.marketEndTime(marketAddress);
        if (endTimeBig != null) {
          updatePayload.market_endTime = toTimeString(new Date(Number(endTimeBig) * 1000));
        }
      } catch {
        // Contract reverted; still update what we have.
      }

      let yesSupply = '0';
      let noSupply = '0';
      try {
        const [yesPrice, noPrice] = await factory.getMarketPrices(marketAddress);
        yesSupply = String(yesPrice);
        noSupply = String(noPrice);
      } catch {
        // Contract reverted; use zero so we never leave null values behind.
      }
      updatePayload.yes_token_supply = yesSupply;
      updatePayload.no_token_supply = noSupply;

      const { error } = await supabase
        .from(WRITE_TABLE)
        .update(updatePayload)
        .eq('market_address', row.market_address);

      if (error) {
        console.log('error:', error.message);
        failed++;
      } else {
        console.log('ok');
        updated++;
      }
    }
  }

  console.log(`\nDone. Updated: ${updated}, Failed: ${failed}`);
}

main();
