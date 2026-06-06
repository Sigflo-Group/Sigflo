/** Simple per-instance rate limiter for Netlify functions (best-effort). */
const buckets = new Map();

function evictBuckets(now) {
  if (buckets.size <= 5_000) return;
  const expired = [];
  for (const [k, b] of buckets) {
    if (now >= b.resetAt) expired.push(k);
  }
  for (const k of expired) buckets.delete(k);
  if (buckets.size <= 5_000) return;
  const oldest = [...buckets.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt).slice(0, 1_000);
  for (const [k] of oldest) buckets.delete(k);
}

/**
 * @param {string} key
 * @param {{ windowMs?: number, max?: number }} opts
 * @returns {boolean} true if allowed, false if rate limited
 */
export function consumeRateLimit(key, opts = {}) {
  const windowMs = opts.windowMs ?? 60_000;
  const max = opts.max ?? 30;
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count > max) return false;
  evictBuckets(now);
  return true;
}
