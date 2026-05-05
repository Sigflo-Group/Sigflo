const seen = new Map<string, number>();

export function consumeIdempotencyKey(key: string, ttlMs: number): boolean {
  const now = Date.now();
  const existing = seen.get(key);
  if (existing && existing > now) return false;
  seen.set(key, now + ttlMs);
  // Prune expired entries to prevent unbounded memory growth
  if (seen.size > 10_000) {
    for (const [k, exp] of seen) {
      if (exp <= now) seen.delete(k);
    }
  }
  return true;
}
