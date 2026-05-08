import { Outlet } from 'react-router-dom';
import { useBetaAccess } from '@/hooks/useBetaAccess';
import BetaWaitlistBlockedScreen from '@/screens/BetaWaitlistBlockedScreen';

const ACCENT = '#00ffc8';

/**
 * After Supabase auth, loads `profiles` and only renders the app when `approved` is true.
 * Dev / no-Supabase sessions bypass this gate.
 */
export function BetaAccessGate() {
  const { status, approved, error, refresh } = useBetaAccess();

  if (status === 'loading' || status === 'idle') {
    return (
      <div
        className="fixed inset-0 z-[350] flex flex-col items-center justify-center gap-3 px-6"
        style={{ backgroundColor: '#050505' }}
      >
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-transparent"
          style={{ borderTopColor: ACCENT }}
          aria-hidden
        />
        <p className="text-sm font-medium text-white/55">Checking access…</p>
      </div>
    );
  }

  if (!approved) {
    return (
      <BetaWaitlistBlockedScreen
        errorMessage={error}
        onRetry={() => void refresh()}
      />
    );
  }

  return <Outlet />;
}
