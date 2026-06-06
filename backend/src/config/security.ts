export const SECURITY = {
  executionIntentTtlSec: 60,
  stepUpTtlSec: 10 * 60,
  /** MFA must have occurred within this window for server-side step-up acceptance. */
  mfaFreshnessSec: 15 * 60,
  idempotencyTtlSec: 10 * 60,
  maxJsonBodyBytes: 200 * 1024,
  tradeExecutePerMinute: 12,
  tradeIntentPerMinute: 30,
  exchangeLinkPerMinute: 10,
} as const;
