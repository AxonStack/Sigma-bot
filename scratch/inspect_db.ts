import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../packages/backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  console.log('--- MARKET REQUESTS ---');
  const { data: requests, error: rError } = await supabase
    .from('market_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (rError) console.error(rError);
  else console.table(requests?.map(r => ({
    id: r.id.slice(0, 8),
    status: r.status,
    prompt: r.prompt.slice(0, 30),
    error: r.error_message?.slice(0, 30),
    created: r.created_at
  })));

  console.log('\n--- MARKET JOBS ---');
  const { data: jobs, error: jError } = await supabase
    .from('market_jobs')
    .select('*')
    .order('scheduled_for', { ascending: false })
    .limit(10);

  if (jError) console.error(jError);
  else console.table(jobs?.map(j => ({
    id: j.id.slice(0, 8),
    req_id: j.market_request_id.slice(0, 8),
    type: j.job_type,
    status: j.status,
    scheduled: j.scheduled_for
  })));
}

inspect();
