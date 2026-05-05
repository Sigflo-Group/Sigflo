import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { checkIsBetaAdmin } from '@/lib/adminBetaApi';
import { fetchOrCreateBetaProfile } from '@/lib/betaProfile';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { BetaProfileRow } from '@/types/betaProfile';

function formatProfileLoadError(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'object' && e !== null) {
    const o = e as Record<string, unknown>;
    const msg = typeof o.message === 'string' ? o.message : '';
    const details = typeof o.details === 'string' ? o.details : '';
    const hint = typeof o.hint === 'string' ? o.hint : '';
    const code = typeof o.code === 'string' ? o.code : '';
    const parts = [msg, details, hint, code].filter(Boolean);
    if (parts.length) return parts.join(' — ');
  }
  return 'Could not load your access profile.';
}

export type BetaAccessStatus = 'idle' | 'loading' | 'ready';

export type UseBetaAccessResult = {
  status: BetaAccessStatus;
  /** When `ready`, true if `profiles.approved` or server-verified beta admin (see Netlify `SIGFLO_BETA_ADMIN_*`). */
  approved: boolean;
  profile: BetaProfileRow | null;
  error: string | null;
  /** Re-fetch profile after admin approves (or retry after error). */
  refresh: () => Promise<void>;
};

/**
 * Resolves beta access from `public.profiles` for Supabase sessions.
 * Dev mode (no Supabase) or missing client → treated as approved so local/dev flows keep working.
 */
export function useBetaAccess(): UseBetaAccessResult {
  const { user, loading: authLoading, authMode, session } = useAuth();
  const [status, setStatus] = useState<BetaAccessStatus>('idle');
  const [approved, setApproved] = useState(false);
  const [profile, setProfile] = useState<BetaProfileRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    if (authLoading) return;

    if (authMode !== 'supabase' || !user || !isSupabaseConfigured() || !supabase) {
      setProfile(null);
      setError(null);
      setApproved(true);
      setStatus('ready');
      return;
    }

    setStatus('loading');
    setError(null);
    try {
      const row = await fetchOrCreateBetaProfile(user);
      setProfile(row);
      if (row.approved === true) {
        setApproved(true);
        setStatus('ready');
        return;
      }
      const token = session?.access_token;
      if (token && (await checkIsBetaAdmin(token))) {
        setApproved(true);
        setStatus('ready');
        return;
      }
      setApproved(false);
      setStatus('ready');
    } catch (e) {
      const msg = formatProfileLoadError(e);
      setProfile(null);
      setApproved(false);
      setError(msg);
      setStatus('ready');
    }
  }, [authLoading, authMode, user, session]);

  useEffect(() => {
    void run();
  }, [run]);

  return { status, approved, profile, error, refresh: run };
}
