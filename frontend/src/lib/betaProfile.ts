import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { BetaProfileRow } from '@/types/betaProfile';

function isUniqueViolation(err: { code?: string; message?: string }): boolean {
  return err.code === '23505' || (err.message ?? '').includes('duplicate key');
}

/**
 * Loads the signed-in user’s profile, or inserts a new row (`approved: false`) if missing.
 * Caller must ensure `supabase` and `user` are non-null.
 */
export async function fetchOrCreateBetaProfile(user: User): Promise<BetaProfileRow> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data: existing, error: selErr } = await supabase
    .from('profiles')
    .select('id, email, approved, created_at')
    .eq('id', user.id)
    .maybeSingle();

  if (selErr) throw selErr;
  if (existing) return existing as BetaProfileRow;

  const email = user.email ?? '';
  const { data: created, error: insErr } = await supabase
    .from('profiles')
    .insert({ id: user.id, email, approved: false })
    .select('id, email, approved, created_at')
    .single();

  if (!insErr && created) return created as BetaProfileRow;

  if (insErr && isUniqueViolation(insErr)) {
    const { data: retry, error: retryErr } = await supabase
      .from('profiles')
      .select('id, email, approved, created_at')
      .eq('id', user.id)
      .single();
    if (retryErr) throw retryErr;
    if (!retry) throw new Error('Profile not found after insert conflict.');
    return retry as BetaProfileRow;
  }

  if (insErr) throw insErr;
  throw new Error('Profile insert returned no row.');
}
