import { db } from '../db/index.js';
import { log } from './logger.js';

const REQUIRED_PUBLIC_TABLES = [
  'users',
  'user_security_settings',
  'user_sessions',
  'exchange_integrations',
  'integration_audit_log',
  'broker_accounts',
  'trade_intents',
  'trades',
  'audit_logs',
  'exit_automation_watches',
  'opportunities',
] as const;

export async function runStartupSchemaCheck(): Promise<void> {
  try {
    const { rows } = await db.query<{ table_name: string }>(
      `select table_name
       from information_schema.tables
       where table_schema = 'public'
         and table_name = any($1::text[])`,
      [REQUIRED_PUBLIC_TABLES],
    );
    const present = new Set(rows.map((r) => r.table_name));
    const missing = REQUIRED_PUBLIC_TABLES.filter((t) => !present.has(t));
    if (missing.includes('user_sessions')) {
      await db.query(`
        create table if not exists public.user_sessions (
          id uuid primary key default gen_random_uuid(),
          user_id uuid not null references auth.users (id) on delete cascade,
          session_identifier text not null,
          step_up_verified_at timestamptz,
          revoked_at timestamptz,
          ip_address text,
          user_agent text,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now(),
          constraint user_sessions_user_session_key unique (user_id, session_identifier)
        );
      `);
      log('warn', 'Startup schema check auto-repaired missing table.', {
        table: 'user_sessions',
        hint: 'Still run migrations 001 -> latest to provision all required tables.',
      });
      missing.splice(missing.indexOf('user_sessions'), 1);
    }
    if (missing.length > 0) {
      log('warn', 'Startup schema check: missing required tables.', {
        missing,
        hint: 'Run supabase/migrations in order (001 -> latest) against DATABASE_URL.',
      });
      return;
    }
    log('info', 'Startup schema check: required tables present.', {
      checked: REQUIRED_PUBLIC_TABLES.length,
    });
  } catch (e) {
    log('warn', 'Startup schema check failed.', {
      error: e instanceof Error ? e.message : String(e),
    });
  }
}

