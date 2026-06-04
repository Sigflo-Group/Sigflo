import type { SecurityState } from '@/types/auth';

/** Fail-closed step-up gate used by SessionProvider. */
export function computeStepUpRequired(
  securityState: SecurityState | null,
  securityStateUnknown: boolean,
): boolean {
  return securityStateUnknown || Boolean(securityState?.stepUp.required);
}
