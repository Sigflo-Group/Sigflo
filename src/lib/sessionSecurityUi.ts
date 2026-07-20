import type { SecurityState } from '@/types/auth';

/** Fail-closed step-up gate used by SessionProvider. */
export function computeStepUpRequired(
  securityState: SecurityState | null,
  securityStateUnknown: boolean,
): boolean {
  if (securityStateUnknown || !securityState) return true;
  if (securityState.stepUp.required) return true;

  const validUntil = securityState.stepUp.validUntil;
  if (!validUntil) return true;
  const validUntilMs = Date.parse(validUntil);
  if (!Number.isFinite(validUntilMs)) return true;

  return Date.now() >= validUntilMs;
}
