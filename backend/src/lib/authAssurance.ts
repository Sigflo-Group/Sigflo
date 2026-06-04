/**
 * Supabase JWT assurance (aal / amr). Used for step-up and session security state.
 */
export function hasAal2(claims: Record<string, unknown> | undefined): boolean {
  if (!claims) return false;
  if (claims.aal === 'aal2') return true;
  const amr = claims.amr;
  if (!Array.isArray(amr)) return false;
  return amr.some((entry) => {
    if (typeof entry === 'string') return /mfa|totp|webauthn/i.test(entry);
    if (entry && typeof entry === 'object' && 'method' in entry) {
      return /mfa|totp|webauthn/i.test(String((entry as { method: string }).method));
    }
    return false;
  });
}
