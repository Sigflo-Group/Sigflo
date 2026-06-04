/** Simple per-instance rate limiter for Netlify functions (best-effort). */
const buckets = new Map();

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
  if (buckets.size > 5_000) {
    for (const [k, b] of buckets) {
      if (now >= b.resetAt) buckets.delete(k);
    }
  }
  return true;
}
