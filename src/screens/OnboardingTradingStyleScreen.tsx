import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Navigate, useNavigate } from 'react-router-dom';
import { getFeedRoute } from '@/config/appRoutes';
import { useAuth } from '@/context/AuthContext';
import {
  markTradingStyleOnboarded,
  isTradingStyleOnboarded,
} from '@/lib/tradingStyleOnboarding';
import { markExchangeConnectOnboardingSeen } from '@/lib/exchangeConnectOnboarding';
import { markFeedWalkthroughSeen } from '@/lib/feedWalkthrough';

function FeedMockup() {
  return (
    <div className="mx-auto w-full max-w-[260px] space-y-2 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[#00C878]" />
        <span className="text-[9px] font-semibold uppercase tracking-wide text-zinc-500">Signals · Live</span>
        <span className="ml-auto text-[9px] text-zinc-600">12 setups</span>
      </div>
      <div className="rounded-lg border border-[#00C878]/30 bg-[#00C878]/[0.06] px-2.5 py-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-white">BTC/USDT</p>
            <p className="mt-0.5 text-[9px] font-semibold uppercase text-emerald-400">Long</p>
          </div>
          <span className="rounded bg-[#00C878]/15 px-1.5 py-0.5 text-[9px] font-bold text-[#00C878]">92</span>
        </div>
        <div className="mt-1.5 h-6 rounded bg-gradient-to-r from-emerald-500/10 via-emerald-500/30 to-emerald-500/10" />
      </div>
      <div className="rounded-lg border border-white/[0.06] px-2.5 py-2 opacity-60">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-white">ETH/USDT</p>
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-zinc-400">78</span>
        </div>
        <div className="mt-1.5 h-6 rounded bg-gradient-to-r from-cyan-500/10 via-cyan-500/20 to-cyan-500/10" />
      </div>
    </div>
  );
}

function ChartMockup() {
  return (
    <div className="mx-auto w-full max-w-[260px] rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
      <div className="flex items-center justify-between text-[9px] text-zinc-500">
        <span>BTC/USDT · 15m</span>
        <span className="font-medium text-white">67,240</span>
      </div>
      <svg viewBox="0 0 240 80" className="mt-2 h-16 w-full" aria-hidden>
        <defs>
          <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0,65 L12,58 L24,62 L36,48 L48,52 L60,40 L72,44 L84,30 L96,34 L108,22 L120,26 L132,18 L144,20 L156,14 L168,16 L180,12 L192,14 L204,10 L216,12 L228,8 L240,10"
          fill="none"
          stroke="#34d399"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M0,65 L12,58 L24,62 L36,48 L48,52 L60,40 L72,44 L84,30 L96,34 L108,22 L120,26 L132,18 L144,20 L156,14 L168,16 L180,12 L192,14 L204,10 L216,12 L228,8 L240,10 L240,80 L0,80 Z"
          fill="url(#chart-grad)"
        />
        <line x1="50" y1="0" x2="50" y2="80" stroke="#fbbf24" strokeWidth="1" strokeDasharray="3,2" opacity="0.6" />
        <line x1="130" y1="0" x2="130" y2="80" stroke="#f87171" strokeWidth="1" strokeDasharray="3,2" opacity="0.6" />
        <line x1="190" y1="0" x2="190" y2="80" stroke="#34d399" strokeWidth="1" strokeDasharray="3,2" opacity="0.6" />
        <text x="48" y="14" fontSize="7" fill="#fbbf24" opacity="0.8">Entry</text>
        <text x="124" y="14" fontSize="7" fill="#f87171" opacity="0.8">Stop</text>
        <text x="186" y="14" fontSize="7" fill="#34d399" opacity="0.8">Target</text>
      </svg>
    </div>
  );
}

const STEPS = [
  {
    visual: <FeedMockup />,
    title: 'Step 1: Find a Signal',
    body: 'Signals appear in your feed, ranked by strength. Your best setup is at the top with a score out of 100.',
  },
  {
    visual: (
      <div className="mx-auto w-full max-w-[260px] rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-left">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-[9px] font-bold text-cyan-300">i</span>
          <span className="text-[9px] font-semibold uppercase tracking-wide text-zinc-500">Setup Thesis</span>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-zinc-300">
          BTC broke above a key resistance level with above-average volume. Momentum is bullish, suggesting the uptrend will continue.
        </p>
        <div className="mt-2 flex gap-2">
          <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-300">Trend: Bullish</span>
          <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300">Conviction: 92</span>
        </div>
      </div>
    ),
    title: 'Step 2: Read the Thesis',
    body: 'Tap any signal to open the full analysis. The thesis explains why the setup was detected and its conviction score.',
  },
  {
    visual: <ChartMockup />,
    title: 'Step 3: Set Your Levels',
    body: 'Drag on the chart or type prices to place your entry, stop loss, and take-profit targets. The preview updates live.',
  },
  {
    visual: (
      <div className="mx-auto w-full max-w-[260px] rounded-xl border border-[#00C878]/25 bg-[#00C878]/[0.06] px-4 py-3">
        <p className="text-center text-[9px] font-semibold uppercase tracking-wider text-[#00C878]/80">Simulated</p>
        <div className="mt-2 flex items-center justify-center gap-3">
          <div className="text-center">
            <p className="text-[9px] text-zinc-500">Balance</p>
            <p className="text-base font-bold text-white">$10,000</p>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="text-center">
            <p className="text-[9px] text-zinc-500">Risk</p>
            <p className="text-base font-bold text-white">2%</p>
          </div>
        </div>
        <div className="mt-3 rounded-lg bg-[#00C878] py-2 text-center text-xs font-bold text-black">
          → Paper Trade
        </div>
      </div>
    ),
    title: 'Step 4: Trade Risk-Free',
    body: 'Hit Paper Trade to execute with $10,000 in virtual funds. No real money, no exchange needed — just practice.',
  },
];

export default function OnboardingTradingStyleScreen() {
  const navigate = useNavigate();
  const { user, authMode } = useAuth();
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;

  const finish = () => {
    markTradingStyleOnboarded('balanced');
    markExchangeConnectOnboardingSeen();
    markFeedWalkthroughSeen();
    navigate(getFeedRoute(), { replace: true });
  };

  const goConnectExchange = () => {
    markTradingStyleOnboarded('balanced');
    markFeedWalkthroughSeen();
    navigate('/onboarding/connect', { replace: true });
  };

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
        <div className="mb-2 flex justify-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[rgba(245,247,250,0.35)]">
            Step {step + 1} of {STEPS.length}
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex justify-center">{STEPS[step].visual}</div>
            <div className="mt-5 text-center">
              <h1 className="text-xl font-bold tracking-tight text-[#F5F7FA]">{STEPS[step].title}</h1>
              <p className="mx-auto mt-2 max-w-[280px] text-sm leading-relaxed text-[rgba(245,247,250,0.65)]">
                {STEPS[step].body}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex items-center justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-6 bg-[#00C878]' : 'w-1.5 bg-white/20'
              }`}
            />
          ))}
        </div>

        <div className="mt-8 space-y-2.5">
          <button
            type="button"
            onClick={isLast ? finish : () => setStep((s) => s + 1)}
            className="flex w-full items-center justify-center rounded-xl bg-[#00C878] py-3 text-sm font-bold text-[#0F1115] transition hover:brightness-105 active:scale-[0.99]"
          >
            {isLast ? 'Start Trading' : 'Next'}
          </button>
          {isLast && (
            <button
              type="button"
              onClick={goConnectExchange}
              className="flex w-full items-center justify-center rounded-xl border border-white/[0.14] bg-white/[0.04] py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08] active:scale-[0.985]"
            >
              Connect Exchange
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
