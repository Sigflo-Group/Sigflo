import { Pool } from 'pg';
import { env } from '../config/env.js';

/**
 * `pg` merges `parse(connectionString)` *after* your Pool options. If the URL contains
 * `sslmode=require`, pg-connection-string sets `ssl: {}`, which overwrites an explicit
 * `ssl: { rejectUnauthorized: false }` and restores default TLS verification — causing
 * "self-signed certificate in certificate chain" against Supabase/Railway poolers.
 * Strip `sslmode` from the URL and set TLS via our `ssl` option only.
 */
function stripSslQueryParams(connectionString: string): string {
  try {
    const u = new URL(connectionString, 'postgres://localhost');
    u.searchParams.delete('sslmode');
    u.searchParams.delete('ssl');
    return u.toString();
  } catch {
    return connectionString;
  }
}

/**
 * Node `pg` often hits "self-signed certificate in certificate chain" against hosted Postgres
 * (Supabase pooler, proxies, etc.) when `rejectUnauthorized` defaults to true.
 *
 * - Localhost Postgres: no `ssl` object (typical dev).
 * - Remote URLs: default `rejectUnauthorized: false` unless `DATABASE_SSL_REJECT_UNAUTHORIZED=true`.
 */
function pgSslOption(): { rejectUnauthorized: boolean } | undefined {
  const url = env.DATABASE_URL;
  const flag = env.DATABASE_SSL_REJECT_UNAUTHORIZED?.trim().toLowerCase();
  if (flag === 'true' || flag === '1') {
    return { rejectUnauthorized: true };
  }
  if (flag === 'false' || flag === '0') {
    return { rejectUnauthorized: false };
  }

  const looksLocal = /(^|@)(localhost|127\.0\.0\.1)(:|\/)/.test(url);
  if (looksLocal && !url.includes('sslmode=require') && !url.includes('sslmode=verify-full')) {
    return undefined;
  }

  return { rejectUnauthorized: false };
}

const ssl = pgSslOption();
const connectionString = stripSslQueryParams(env.DATABASE_URL);

const looksLocal = /(^|@)(localhost|127\.0\.0\.1)(:|\/)/.test(env.DATABASE_URL);

/**
 * Supabase / PgBouncer (e.g. port 6543) often closes idle TCP sessions; without a listener, `pg-pool`
 * emits `error` on the pool and Node treats it as fatal (`Unhandled 'error' event`).
 */
export const db = new Pool({
  connectionString,
  ...(ssl ? { ssl } : {}),
  max: 20,
  // Surface DB connection failures quickly instead of hanging forever.
  connectionTimeoutMillis: 12_000,
  // Reduce surprise pooler disconnects; still handle `pool.on('error')` below.
  ...(!looksLocal
    ? {
        keepAlive: true,
        keepAliveInitialDelayMillis: 10_000,
        // Recycle clients periodically — transaction poolers prefer short-lived server-side sessions.
        maxUses: 750,
      }
    : {}),
});

db.on('error', (err) => {
  console.error(
    '[db] Idle pool client error (server may have closed the connection — next query will open a new one):',
    err instanceof Error ? err.message : err,
  );
});

// Kill any query that takes longer than 12s so the HTTP handler fails fast
// instead of blocking the event loop and leaving the client stuck loading.
db.on('connect', (client) => {
  client.query('SET statement_timeout = 12000').catch(() => {});
});
