import { useCallback } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { SigfloLogo } from '@/components/branding/SigfloLogo';
import { getFeedRoute } from '@/config/appRoutes';
import { useAuth } from '@/context/AuthContext';
import {
  isTradingStyleOnboarded,
  markTradingStyleOnboarded,
  type TradingStyleChoice,
} from '@/lib/tradingStyleOnboarding';
import { isExchangeConnectOnboardingSeen } from '@/lib/exchangeConnectOnboarding';

const OPTIONS: {
  choice: TradingStyleChoice;
  title: string;
  bot: string;
  blurb: string;
}[] = [
  {
    choice: 'aggressive',
    title: 'Aggressive',
    bot: 'Kai',
    blurb: 'Wider stops, longer holds — momentum first.',
  },
  {
    choice: 'balanced',
    title: 'Balanced',
    bot: 'Nova',
    blurb: 'Staged exits and balanced risk.',
  },
  {
    choice: 'defensive',
    title: 'Defensive',
    bot: 'Rio',
    blurb: 'Tight invalidation, protect capital early.',
  },
];

export default function OnboardingTradingStyleScreen() {
  const navigate = useNavigate();
  const { user, authMode } = useAuth();

  const pick = useCallback(
    (choice: TradingStyleChoice) => {
      markTradingStyleOnboarded(choice);
      navigate('/onboarding/connect', { replace: true });
    },
    [navigate],
  );

  if (authMode !== 'supabase' || !user) {
    return <Navigate to={getFeedRoute()} replace />;
  }

  if (isTradingStyleOnboarded()) {
    return isExchangeConnectOnboardingSeen() ? (
      <Navigate to={getFeedRoute()} replace />
    ) : (
      <Navigate to="/onboarding/connect" replace />
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#0F1115] px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(0,200,120,0.1),transparent)]" aria-hidden />

      <div className="relative mx-auto max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <SigfloLogo size={44} glowing className="mb-5" />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[rgba(245,247,250,0.45)]">One quick step</p>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-[#F5F7FA]">Choose your trading style</h1>
          <p className="mt-2 text-sm leading-relaxed text-[rgba(245,247,250,0.65)]">
            Sets a default temperament for suggestions. You can change this anytime in Profile.
          </p>
        </div>

        <div className="space-y-3">
          {OPTIONS.map(({ choice, title, bot, blurb }) => (
            <button
              key={choice}
              type="button"
              onClick={() => pick(choice)}
              className="flex w-full flex-col items-start rounded-2xl border border-white/[0.08] bg-[#171A20] px-4 py-4 text-left shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] transition hover:border-[rgba(0,200,120,0.35)] hover:bg-[#1a1e26] active:scale-[0.99]"
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span className="text-base font-bold text-[#F5F7FA]">{title}</span>
                <span className="rounded-full border border-[rgba(0,200,120,0.28)] bg-[rgba(0,200,120,0.08)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#7ee8d3]">
                  {bot}
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-[rgba(245,247,250,0.6)]">{blurb}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
