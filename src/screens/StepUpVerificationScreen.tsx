import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { performStepUpCheck } from '@/lib/api/session';
import { useSession } from '@/hooks/useSession';
import {
  currentAuthenticatorAssuranceLevel,
  listVerifiedTotpFactors,
  verifyTotpStepUp,
  type MfaFactor,
} from '@/lib/mfaStepUp';

export default function StepUpVerificationScreen() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshSecurityState } = useSession();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [factors, setFactors] = useState<MfaFactor[]>([]);
  const [factorId, setFactorId] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [loadingFactors, setLoadingFactors] = useState(true);

  const redirectTarget = searchParams.get('redirect') || '/settings/security';

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoadingFactors(true);
      try {
        const list = await listVerifiedTotpFactors();
        if (cancelled) return;
        setFactors(list);
        setFactorId(list[0]?.id ?? '');
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Unable to load 2FA factors.');
        }
      } finally {
        if (!cancelled) setLoadingFactors(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onVerify() {
    setPending(true);
    setError(null);
    try {
      if (factors.length === 0) {
        setError('Enable two-factor authentication in Profile → Security before continuing.');
        return;
      }
      if (!factorId) {
        setError('Select an authenticator factor.');
        return;
      }

      const aal = await currentAuthenticatorAssuranceLevel();
      if (aal !== 'aal2') {
        await verifyTotpStepUp(factorId, totpCode);
      }

      await performStepUpCheck();
      await refreshSecurityState();
      navigate(redirectTarget, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Step-up verification failed.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <h1 className="text-lg font-semibold text-white">Step-up verification required</h1>
      <p className="mt-2 text-sm text-zinc-300">
        Sensitive actions require a fresh authenticator verification (2FA). Enter your 6-digit code below.
      </p>
      {loadingFactors ? (
        <p className="mt-3 text-xs text-zinc-400">Loading security factors...</p>
      ) : factors.length === 0 ? (
        <p className="mt-3 text-sm text-amber-200">
          No verified 2FA factor found.{' '}
          <Link to="/profile" className="underline text-sigflo-accent">
            Enable 2FA in Profile
          </Link>{' '}
          first.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {factors.length > 1 ? (
            <label className="block text-xs text-zinc-400">
              Authenticator
              <select
                value={factorId}
                onChange={(e) => setFactorId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
              >
                {factors.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.friendlyName ?? f.id}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="block text-xs text-zinc-400">
            6-digit code
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white tracking-widest"
              placeholder="000000"
            />
          </label>
        </div>
      )}
      {error ? <p className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-200">{error}</p> : null}
      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => void onVerify()}
          disabled={pending || loadingFactors || factors.length === 0}
          className="rounded-lg border border-sigflo-accent/40 bg-sigflo-accent/10 px-3 py-2 text-sm font-semibold text-sigflo-accent disabled:opacity-60"
        >
          {pending ? 'Verifying...' : 'Verify and continue'}
        </button>
        <button
          type="button"
          onClick={() => navigate('/profile')}
          disabled={pending}
          className="rounded-lg border border-white/15 bg-white/[0.03] px-3 py-2 text-sm text-zinc-300 disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
