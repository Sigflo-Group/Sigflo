import { config } from 'dotenv';
config({ path: "./backend/.env.local" });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.DATABASE_URL;
if (!supabaseUrl) {
  console.error('❌ DATABASE_URL is not set in the environment.');
  process.exit(1);
}

async function main() {
  const client = createClient(supabaseUrl, null, { auth: { persistSession: false } });
  console.log('🚀 Starting Sigflo seed script (idempotent)');

  // Example: check if a tenant exists; if not, insert one.
  const tenantName = 'Dev Org';
  let result = await client.from('tenants').select('id').eq('name', tenantName).single();
  let tenantId;
  if (result.error && !result.data) {
    console.log(`[SKIP] Tenant already exists.`);
    tenantId = result.data?.id;
  } else {
    const insertResult = await client.from('tenants').insert({ name: tenantName }).select().single();
    if (insertResult.error) throw insertResult.error;
    console.log(`[SUCCESS] Created tenant with ID ${insertResult.data.id}`);
    tenantId = insertResult.data.id;
  }

  // Continue for workspace and user as needed...
}

main().catch(err => {
  console.error('❌ Seed script failed:', err.message || err);
  process.exit(1);
});
