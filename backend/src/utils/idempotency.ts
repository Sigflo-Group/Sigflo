const seen = new Map<string, number>();

export function consumeIdempotencyKey(key: string, ttlMs: number): boolean {
  const now = Date.now();
  const existing = seen.get(key);
  if (existing && existing > now) return false;
  seen.set(key, now + ttlMs);
  return true;
}
