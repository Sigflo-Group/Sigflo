import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Navigate, useNavigate } from 'react-router-dom';
import { getFeedRoute } from '@/config/appRoutes';
import { useAuth } from '@/context/AuthContext';
import { isExchangeConnectOnboardingSeen, markExchangeConnectOnboardingSeen } from '@/lib/exchangeConnectOnboarding';
import { isTradingStyleOnboarded } from '@/lib/tradingStyleOnboarding';

function ConnectionGlyphIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.652l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
      />
    </svg>
  );
}

export default function OnboardingConnect() {
  const navigate = useNavigate();
  const { user, authMode } = useAuth();

  const goFeed = useCallback(() => {
    markExchangeConnectOnboardingSeen();
    navigate(getFeedRoute(), { replace: true });
  }, [navigate]);

  if (authMode !== 'supabase' || !user) {
    return <Navigate to={getFeedRoute()} replace />;
  }

  if (!isTradingStyleOnboarded()) {
    return <Navigate to="/onboarding" replace />;
  }

  if (isExchangeConnectOnboardingSeen()) {
    return <Navigate to={getFeedRoute()} replace />;
  }

  return (
    <div className="min-h-[100dvh] bg-[#050505] px-5 pb-10 pt-20">
      <motion.div
        className="mx-auto flex max-w-[380px] flex-col items-center"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035]"
          aria-hidden
        >
          <ConnectionGlyphIcon className="text-white/45" />
        </div>

        <h1 className="mt-8 text-center text-2xl font-medium tracking-tight text-zinc-100">
          Exchange connection coming soon
        </h1>
        <p className="mx-auto mt-3 max-w-[280px] text-center text-sm leading-6 text-zinc-400">
          Live exchange linking is not available in this preview. Your API keys are never stored or sent.
        </p>
        <p className="mx-auto mt-3 max-w-[280px] text-center text-sm leading-6 text-zinc-500">
          You can still explore signals and trade with paper positions while you wait.
        </p>

        <button
          type="button"
          onClick={goFeed}
          className="mt-10 flex h-12 w-full items-center justify-center rounded-xl bg-[#00ffc8] text-sm font-medium text-black transition-all hover:brightness-110 active:scale-[0.985]"
        >
          Continue to Sigflo
        </button>

        <p className="mt-8 text-center text-xs leading-5 text-zinc-500">
          No data is sent to any server. Everything runs locally in your browser.
        </p>
      </motion.div>
    </div>
  );
}
