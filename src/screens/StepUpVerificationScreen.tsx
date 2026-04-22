import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { performStepUpCheck } from '@/lib/api/session';
import { useSession } from '@/hooks/useSession';

export default function StepUpVerificationScreen() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshSecurityState } = useSession();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTarget = searchParams.get('redirect') || '/settings/security';

  async function onVerify() {
    setPending(true);
    setError(null);
    try {
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
        This action is security-sensitive. Verify your session to continue.
      </p>
      {error ? <p className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-200">{error}</p> : null}
      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => void onVerify()}
          disabled={pending}
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
