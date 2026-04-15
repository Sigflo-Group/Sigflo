import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SigfloLogo } from '@/components/branding/SigfloLogo';
import { getFeedRoute } from '@/config/appRoutes';
import { describeAuthError } from '@/lib/supabaseAuthErrors';
import { supabase } from '@/lib/supabase';

/** True when the URL likely came from a Supabase reset email (hash, query, or PKCE code on this route). */
function looksLikeRecoveryRedirect(): boolean {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash.replace(/^#/, '');
  if (hash) {
    const fromHash = new URLSearchParams(hash);
    if (fromHash.get('type') === 'recovery') return true;
    // Implicit / some templates put tokens in the hash without `type` before redirect cleanup.
    if (fromHash.get('access_token')) return true;
  }
  const q = new URLSearchParams(window.location.search);
  if (q.get('type') === 'recovery') return true;
  // PKCE recovery emails use ?code= on the redirect URL; OAuth uses /auth/callback, not this screen.
  if (q.get('code')) return true;
  if (q.get('token_hash')) return true;
  if (q.get('token')) return true;
  return false;
}

/**
 * Supabase recovery emails vary by template:
 * - `token_hash` or `token` + `type=recovery` → verifyOtp (no PKCE verifier; works from any device).
 * - Hash `access_token` + `refresh_token` + `type=recovery` → setSession.
 * - `code` → exchangeCodeForSession (needs verifier from the same browser that requested the reset).
 */
async function consumeRecoveryFromUrl(client: SupabaseClient): Promise<boolean> {
  const url = new URL(window.location.href);

  const typeParam = url.searchParams.get('type');
  const otpToken = url.searchParams.get('token_hash') ?? url.searchParams.get('token');
  if (typeParam === 'recovery' && otpToken) {
    const { error } = await client.auth.verifyOtp({
      type: 'recovery',
      token_hash: otpToken,
    });
    if (!error) {
      url.searchParams.delete('token_hash');
      url.searchParams.delete('token');
      url.searchParams.delete('type');
      const qs = url.searchParams.toString();
      window.history.replaceState(null, '', `${url.pathname}${qs ? `?${qs}` : ''}${url.hash}`);
      return true;
    }
  }

  const hash = url.hash.replace(/^#/, '');
  if (hash) {
    const hp = new URLSearchParams(hash);
    const access_token = hp.get('access_token');
    const refresh_token = hp.get('refresh_token');
    if (access_token && refresh_token && hp.get('type') === 'recovery') {
      const { error } = await client.auth.setSession({ access_token, refresh_token });
      if (!error) {
        window.history.replaceState(null, '', `${url.pathname}${url.search}`);
        return true;
      }
    }
  }

  const code = url.searchParams.get('code');
  if (code) {
    const { data, error } = await client.auth.exchangeCodeForSession(code);
    if (!error && data.session) {
      url.searchParams.delete('code');
      const qs = url.searchParams.toString();
      window.history.replaceState(null, '', `${url.pathname}${qs ? `?${qs}` : ''}${url.hash}`);
      return true;
    }
  }

  return false;
}

export default function ResetPasswordScreen() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  /**
   * True when we have a session from the reset link. We use PASSWORD_RECOVERY when it fires, plus getSession
   * (immediate + short poll) because PASSWORD_RECOVERY can emit before React subscribes to onAuthStateChange.
   */
  const [recoverySessionReady, setRecoverySessionReady] = useState(false);
  const [verifyTimedOut, setVerifyTimedOut] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  /** Captured once — Supabase may strip hash/query after parsing tokens. */
  const [arrivedFromRecoveryEmail] = useState(() => looksLikeRecoveryRedirect());
  const recoveryAppliedRef = useRef(false);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let cancelled = false;

    const markReadyIfSession = () => {
      if (cancelled || !arrivedFromRecoveryEmail || recoveryAppliedRef.current) return;
      void client.auth.getSession().then(({ data }) => {
        if (cancelled || recoveryAppliedRef.current) return;
        if (data.session) {
          recoveryAppliedRef.current = true;
          setRecoverySessionReady(true);
          setVerifyTimedOut(false);
        }
      });
    };

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === 'PASSWORD_RECOVERY' && session) {
        recoveryAppliedRef.current = true;
        setRecoverySessionReady(true);
        setVerifyTimedOut(false);
      }
    });

    void (async () => {
      const consumed = await consumeRecoveryFromUrl(client);
      if (cancelled) return;
      if (consumed) {
        recoveryAppliedRef.current = true;
        setRecoverySessionReady(true);
        setVerifyTimedOut(false);
        return;
      }

      // Race: PASSWORD_RECOVERY often fires during client init, before this listener runs.
      markReadyIfSession();
      // PKCE token exchange can take several seconds on slow networks.
      for (let i = 0; i < 80 && !cancelled && arrivedFromRecoveryEmail && !recoveryAppliedRef.current; i++) {
        await new Promise((r) => setTimeout(r, 200));
        const { data } = await client.auth.getSession();
        if (cancelled || recoveryAppliedRef.current) return;
        if (data.session) {
          recoveryAppliedRef.current = true;
          setRecoverySessionReady(true);
          setVerifyTimedOut(false);
          return;
        }
      }
    })();

    let timeoutId: number | undefined;
    if (arrivedFromRecoveryEmail) {
      timeoutId = window.setTimeout(() => {
        if (!cancelled && !recoveryAppliedRef.current) {
          setVerifyTimedOut(true);
        }
      }, 25000);
    }

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [arrivedFromRecoveryEmail]);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      if (password.length < 6) {
        setError('Use at least 6 characters.');
        return;
      }
      if (password !== confirm) {
        setError('Passwords do not match.');
        return;
      }
      if (!supabase) return;
      setBusy(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          setError(
            'Your reset session expired or this page was opened without the email link. Request a new reset from the login screen.',
          );
          setRecoverySessionReady(false);
          return;
        }
        const { error: upErr } = await supabase.auth.updateUser({ password });
        if (upErr) throw upErr;
        setDone(true);
        window.setTimeout(() => navigate(getFeedRoute(), { replace: true }), 1200);
      } catch (err) {
        setError(describeAuthError(err, 'Could not update password.'));
      } finally {
        setBusy(false);
      }
    },
    [confirm, navigate, password],
  );

  if (!supabase) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#0F1115] px-6 text-center text-sm text-[rgba(245,247,250,0.65)]">
        Supabase is not configured.
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#0F1115] px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(0,200,120,0.12),transparent)]" aria-hidden />
      <div className="relative mx-auto w-full max-w-sm flex-1">
        <div className="mb-8 flex flex-col items-center text-center">
          <SigfloLogo size={48} glowing className="mb-4" />
          <h1 className="text-xl font-bold tracking-tight text-[#F5F7FA]">Set new password</h1>
          <p className="mt-2 text-sm text-[rgba(245,247,250,0.65)]">Choose a strong password for your account.</p>
        </div>

        {!recoverySessionReady ? (
          verifyTimedOut ? (
            <div className="rounded-2xl border border-white/[0.08] bg-[#171A20] p-5 text-sm leading-relaxed text-[rgba(245,247,250,0.75)]">
              <p>
                We could not confirm your reset link (it may have expired). Request a new password reset from the login
                screen, then open the link in the <span className="font-medium text-white">same browser</span> you use
                for Sigflo (same site URL and port as when you tapped &quot;Forgot password&quot;). If your email uses a
                long <span className="font-mono text-[11px] text-white/80">code=</span> link, that flow only works when
                the verifier stored in that browser is still present.
              </p>
              <Link to="/login" className="mt-4 inline-block text-sm font-semibold text-[#7ee8d3]">
                Back to sign in
              </Link>
            </div>
          ) : arrivedFromRecoveryEmail ? (
            <div className="rounded-2xl border border-white/[0.08] bg-[#171A20] p-5 text-center text-sm leading-relaxed text-[rgba(245,247,250,0.75)]">
              <p>Verifying your reset link…</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.08] bg-[#171A20] p-5 text-sm leading-relaxed text-[rgba(245,247,250,0.75)]">
              <p>
                Open the reset link from your email in this browser. Do not bookmark this page — it only works after you
                tap the link in the message.
              </p>
              <Link to="/login" className="mt-4 inline-block text-sm font-semibold text-[#7ee8d3]">
                Back to sign in
              </Link>
            </div>
          )
        ) : done ? (
          <div className="rounded-2xl border border-[rgba(0,200,120,0.22)] bg-[#171A20] p-5 text-center">
            <p className="text-sm font-semibold text-[#00E08A]">Password updated</p>
            <p className="mt-2 text-sm text-[rgba(245,247,250,0.75)]">Taking you to Sigflo…</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="reset-pw" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[rgba(245,247,250,0.45)]">
                New password
              </label>
              <div className="relative">
                <input
                  id="reset-pw"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                  disabled={busy}
                  className="w-full rounded-xl border border-white/[0.1] bg-[#171A20] py-3.5 pl-4 pr-12 text-base text-[#F5F7FA] outline-none focus:border-[rgba(0,200,120,0.45)] focus:shadow-[0_0_0_3px_rgba(0,200,120,0.12)] disabled:opacity-50"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-[11px] font-semibold text-[rgba(245,247,250,0.5)] hover:text-[#F5F7FA]"
                >
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="reset-pw2" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[rgba(245,247,250,0.45)]">
                Confirm password
              </label>
              <input
                id="reset-pw2"
                type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirm}
                onChange={(ev) => setConfirm(ev.target.value)}
                disabled={busy}
                className="w-full rounded-xl border border-white/[0.1] bg-[#171A20] px-4 py-3.5 text-base text-[#F5F7FA] outline-none focus:border-[rgba(0,200,120,0.45)] focus:shadow-[0_0_0_3px_rgba(0,200,120,0.12)] disabled:opacity-50"
              />
            </div>
            {error ? <p className="text-sm text-rose-300/95">{error}</p> : null}
            <button
              type="submit"
              disabled={busy || !password || !confirm}
              className="w-full rounded-xl bg-[#00C878] py-3.5 text-sm font-bold text-[#0F1115] shadow-[0_8px_28px_-8px_rgba(0,200,120,0.45)] transition enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-[rgba(245,247,250,0.4)] disabled:shadow-none"
            >
              {busy ? 'Saving…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
