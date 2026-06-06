/**
 * Supabase JWT assurance (aal / amr). Used for step-up and session security state.
 */

const MFA_METHODS = new Set(['mfa', 'totp', 'webauthn']);

function isMfaMethod(value: string): boolean {
  return MFA_METHODS.has(value.toLowerCase());
}

function amrEntryIsMfa(entry: unknown): boolean {
  if (typeof entry === 'string') return isMfaMethod(entry);
  if (entry && typeof entry === 'object' && 'method' in entry) {
    return isMfaMethod(String((entry as { method: string }).method));
  }
  return false;
}

function amrEntryTimestamp(entry: unknown): number | null {
  if (!entry || typeof entry !== 'object' || !('timestamp' in entry)) return null;
  const ts = (entry as { timestamp: unknown }).timestamp;
  if (typeof ts === 'number' && Number.isFinite(ts)) return ts;
  if (typeof ts === 'string') {
    const parsed = Date.parse(ts);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function hasAal2(claims: Record<string, unknown> | undefined): boolean {
  if (!claims) return false;
  if (claims.aal === 'aal2') return true;
  const amr = claims.amr;
  if (!Array.isArray(amr)) return false;
  return amr.some(amrEntryIsMfa);
}

/** True when a recent MFA method appears in amr within maxAgeSec (seconds). */
export function isMfaFresh(claims: Record<string, unknown> | undefined, maxAgeSec: number): boolean {
  if (!claims || maxAgeSec <= 0) return false;
  const amr = claims.amr;
  if (!Array.isArray(amr)) return false;
  const cutoffMs = Date.now() - maxAgeSec * 1000;
  return amr.some((entry) => {
    if (!amrEntryIsMfa(entry)) return false;
    const ts = amrEntryTimestamp(entry);
    if (ts == null) return false;
    return ts >= cutoffMs;
  });
}
