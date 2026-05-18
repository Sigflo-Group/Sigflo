/**
 * One-shot migration runner. Run from the repo root: node scripts/run-migrations.mjs
 * Requires: cd backend && npm install (pg must be in backend/node_modules)
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from '../backend/node_modules/pg/lib/index.js';

const { Client } = pg;

// Load backend/.env manually
const envPath = fileURLToPath(new URL('../backend/.env', import.meta.url));
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  const val = trimmed.slice(eq + 1).trim();
  if (!process.env[key]) process.env[key] = val;
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set in backend/.env');
  process.exit(1);
}

// The direct Supabase connection (db.*.supabase.co:5432) is IPv6-only.
// For migration runs from IPv4 environments, rewrite to the session pooler
// which is IPv4-compatible and supports full DDL (unlike the tx pooler).
function toSessionPoolerUrl(url) {
  try {
    const u = new URL(url);
    const match = u.hostname.match(/^db\.([^.]+)\.supabase\.co$/);
    if (!match) return url; // already pooler or custom host, leave as-is
    const ref = match[1];
    u.username = `postgres.${ref}`;
    u.hostname = 'aws-1-ap-southeast-2.pooler.supabase.com';
    u.port = '5432';
    return u.toString();
  } catch {
    return url;
  }
}

const connectionString = toSessionPoolerUrl(DATABASE_URL);
if (connectionString !== DATABASE_URL) {
  console.log('Note: rewriting direct connection to session pooler (IPv4-compatible).\n');
}

const root = fileURLToPath(new URL('..', import.meta.url));

const MIGRATIONS = [
  'backend/migrations/001_init.sql',
  'supabase/migrations/001_profiles.sql',
  'supabase/migrations/002_user_security_settings.sql',
  'supabase/migrations/003_broker_accounts.sql',
  'supabase/migrations/004_trade_intents.sql',
  'supabase/migrations/005_trades.sql',
  'supabase/migrations/006_audit_logs.sql',
  'supabase/migrations/007_user_sessions.sql',
  'supabase/migrations/008_indexes.sql',
  'supabase/migrations/009_rls_policies.sql',
  'supabase/migrations/010_triggers_and_helpers.sql',
  'supabase/migrations/011_create_opportunities.sql',
  'backend/migrations/002_exit_automation_watches.sql',
];

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
console.log('Connected.\n');

let passed = 0;
let failed = 0;

for (const rel of MIGRATIONS) {
  const sql = readFileSync(path.join(root, rel), 'utf8');
  process.stdout.write(`  ${rel} ... `);
  try {
    await client.query(sql);
    console.log('OK');
    passed++;
  } catch (err) {
    console.log(`FAILED\n    ${err.message}`);
    failed++;
  }
}

await client.end();
console.log(`\n${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
