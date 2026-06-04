import { db } from '../db/index.js';

const memorySeen = new Map<string, number>();

function consumeInMemory(key: string, ttlMs: number): boolean {
  const now = Date.now();
  const existing = memorySeen.get(key);
  if (existing && existing > now) return false;
  memorySeen.set(key, now + ttlMs);
  if (memorySeen.size > 10_000) {
    for (const [k, exp] of memorySeen) {
      if (exp <= now) memorySeen.delete(k);
    }
  }
  return true;
}

/**
 * Returns true when the key is new (caller may proceed). False when duplicate within TTL.
 * Uses Postgres when available so multiple app instances share state.
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
    const { rows } = await db.query<{ expires_at: string }>(
      'select expires_at from idempotency_keys where key = $1',
      [key],
    );
    const row = rows[0];
    if (!row) return consumeInMemory(key, ttlMs);
    if (Date.parse(row.expires_at) > Date.now()) return false;
    const { rowCount: renewed } = await db.query(
      'update idempotency_keys set expires_at = $2 where key = $1 and expires_at <= now()',
      [key, expiresAt.toISOString()],
    );
    return (renewed ?? 0) > 0;
  } catch {
    return consumeInMemory(key, ttlMs);
  }
}
