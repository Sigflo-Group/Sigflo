import { db } from '../db/index.js';
import { log } from '../lib/logger.js';

/**
 * Returns true when the key is new (caller may proceed). False when duplicate within TTL.
 * Uses Postgres when available so multiple app instances share state.
 * Fails closed when Postgres is unreachable.
 */
export async function consumeIdempotencyKey(key: string, ttlMs: number): Promise<boolean> {
  const expiresAt = new Date(Date.now() + ttlMs);
  try {
    const { rowCount } = await db.query(
      `insert into idempotency_keys (key, expires_at)
       values ($1, $2)
       on conflict (key) do nothing`,
      [key, expiresAt.toISOString()],
    );
    if ((rowCount ?? 0) > 0) {
      void db.query('delete from idempotency_keys where expires_at < now()').catch(() => {});
      return true;
    }

    const { rows } = await db.query<{ key: string }>(
      `update idempotency_keys
       set expires_at = $2
       where key = $1 and expires_at <= now()
       returning key`,
      [key, expiresAt.toISOString()],
    );
    return rows.length > 0;
  } catch (error) {
    log('error', 'Idempotency store unavailable; rejecting duplicate-risk request.', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
