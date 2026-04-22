const RETRYABLE_CODES = new Set([
  'EAI_AGAIN',
  'EAI_OVERFLOW',
  'ENOTFOUND',
  'ETIMEDOUT',
  'ECONNRESET',
  'ECONNREFUSED',
]);

/** True for common transient DNS / TCP issues from `pg`, `fetch`, etc. */
export function isTransientNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = (error as NodeJS.ErrnoException).code;
  if (typeof code === 'string' && RETRYABLE_CODES.has(code)) return true;
  const msg = error instanceof Error ? error.message : String(error);
  return /EAI_AGAIN|getaddrinfo|ENOTFOUND|ETIMEDOUT|ECONNRESET|ECONNREFUSED/i.test(msg);
}

export async function retryTransientNetwork<T>(
  fn: () => Promise<T>,
  options?: { retries?: number; baseDelayMs?: number },
): Promise<T> {
  const retries = options?.retries ?? 4;
  const baseDelayMs = options?.baseDelayMs ?? 400;
  let last: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (attempt >= retries || !isTransientNetworkError(e)) throw e;
      await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** attempt));
    }
  }
  throw last;
}
