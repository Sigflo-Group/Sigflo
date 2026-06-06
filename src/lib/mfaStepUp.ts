import { supabase } from '@/lib/supabase';

export type MfaFactor = { id: string; friendlyName?: string };

export async function listVerifiedTotpFactors(): Promise<MfaFactor[]> {
  if (!supabase) return [];
  const mfa = supabase.auth.mfa;
  if (!mfa?.listFactors) return [];
  const { data, error } = await mfa.listFactors();
  if (error) throw error;
  const totp = data?.totp ?? [];
  return totp
    .filter((f) => f.status === 'verified')
    .map((f) => ({ id: f.id, friendlyName: f.friendly_name ?? undefined }));
}

export async function verifyTotpStepUp(factorId: string, code: string): Promise<void> {
  if (!supabase?.auth.mfa) throw new Error('MFA is not available.');
  const trimmed = code.trim();
  if (!/^\d{6}$/.test(trimmed)) throw new Error('Enter a valid 6-digit authenticator code.');

  const { data: challenged, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
  if (challengeError) throw challengeError;
  const challengeId = challenged?.id;
  if (!challengeId) throw new Error('Unable to start MFA challenge.');

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId,
    code: trimmed,
  });
  if (verifyError) throw verifyError;
}

export async function currentAuthenticatorAssuranceLevel(): Promise<'aal1' | 'aal2' | null> {
  if (!supabase?.auth.mfa?.getAuthenticatorAssuranceLevel) return null;
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) return null;
  return (data?.currentLevel as 'aal1' | 'aal2' | undefined) ?? null;
}
