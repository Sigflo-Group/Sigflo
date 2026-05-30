import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Navigate, useNavigate } from 'react-router-dom';
import { SigfloLogo } from '@/components/branding/SigfloLogo';
import { getFeedRoute } from '@/config/appRoutes';
import { useAuth } from '@/context/AuthContext';
import {
  markTradingStyleOnboarded,
  isTradingStyleOnboarded,
} from '@/lib/tradingStyleOnboarding';
import { markExchangeConnectOnboardingSeen } from '@/lib/exchangeConnectOnboarding';

const STEPS = [
  {
    title: 'Discover Signals',
    body: 'Sigflo scans 50+ crypto pairs across multiple timeframes and delivers AI-driven trade signals ranked by conviction.',
  },
  {
    title: 'Paper Trade Risk-Free',
    body: 'Start with a $10,000 simulated balance. Review every setup and paper trade without risking real capital.',
  },
  {
    title: 'Review & Execute',
    body: 'Set your entry, stop loss, and take-profit targets on an interactive chart. Paper trade any setup in seconds.',
  },
];

export default function OnboardingTradingStyleScreen() {
  const navigate = useNavigate();
  const { user, authMode } = useAuth();
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;

  const startPaperTrading = useCallback(() => {
    markTradingStyleOnboarded('balanced');
    markExchangeConnectOnboardingSeen();
    navigate(getFeedRoute(), { replace: true });
  }, [navigate]);

  const connectExchange = useCallback(() => {
    markTradingStyleOnboarded('balanced');
    navigate('/onboarding/connect', { replace: true });
  }, [navigate]);

  if (authMode !== 'supabase' || !user) {
    return <Navigate to={getFeedRoute()} replace />;
  }

  if (isTradingStyleOnboarded()) {
    return <Navigate to={getFeedRoute()} replace />;
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#0F1115] px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(0,200,120,0.1),transparent)]" aria-hidden />

      <div className="relative mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
        <div className="mb-6 flex justify-center">
          <SigfloLogo size={44} glowing />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[rgba(245,247,250,0.45)]">
              Welcome to Sigflo
            </p>
            <h1 className="mt-2 text-xl font-bold tracking-tight text-[#F5F7FA]">{STEPS[step].title}</h1>
            <p className="mx-auto mt-2 max-w-[280px] text-sm leading-relaxed text-[rgba(245,247,250,0.65)]">
              {STEPS[step].body}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Step dots */}
        <div className="mt-8 flex items-center justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-6 bg-[#00C878]' : 'w-1.5 bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="mt-8">
          {!isLast ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="flex w-full items-center justify-center rounded-xl bg-[#00C878] py-3 text-sm font-bold text-[#0F1115] transition hover:brightness-105 active:scale-[0.99]"
            >
              Next
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={startPaperTrading}
                className="mb-3 flex w-full items-center justify-center rounded-xl bg-[#00C878] py-3 text-sm font-bold text-[#0F1115] transition hover:brightness-105 active:scale-[0.99]"
              >
                Start Paper Trading
              </button>
              <button
                type="button"
                onClick={connectExchange}
                className="mb-6 flex w-full items-center justify-center rounded-xl border border-white/[0.14] bg-white/[0.04] py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                Connect Exchange (optional)
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
