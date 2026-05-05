import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Navigate, useNavigate } from 'react-router-dom';
import { ExchangeConnectButton } from '@/components/onboarding/ExchangeConnectButton';
import { getFeedRoute } from '@/config/appRoutes';
import { useAuth } from '@/context/AuthContext';
import { isExchangeConnectOnboardingSeen, markExchangeConnectOnboardingSeen } from '@/lib/exchangeConnectOnboarding';
import { isTradingStyleOnboarded } from '@/lib/tradingStyleOnboarding';

export type ExchangeProvider = 'bybit' | 'mexc';

const providers: { id: ExchangeProvider; label: string; badge: string }[] = [
  { id: 'bybit', label: 'Bybit', badge: 'B' },
  { id: 'mexc', label: 'MEXC', badge: 'M' },
];

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
  const [manualMode, setManualMode] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ExchangeProvider | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [manualAwaitContinue, setManualAwaitContinue] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');

  const goFeed = useCallback(() => {
    markExchangeConnectOnboardingSeen();
    navigate(getFeedRoute(), { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (!isConnecting) return;
    const t = window.setTimeout(() => setIsConnecting(false), 900);
    return () => window.clearTimeout(t);
  }, [isConnecting]);

  const onProviderPress = useCallback((id: ExchangeProvider) => {
    setSelectedProvider(id);
    setIsConnecting(true);
    setStatusMessage('Connection flow coming soon.');
  }, []);

  const onManualSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiKey('');
    setSecretKey('');
    setStatusMessage('Nothing was sent or saved. This is a preview only.');
    setManualAwaitContinue(true);
  }, []);

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

        <AnimatePresence mode="wait">
          {manualMode ? (
            <motion.div
              key="manual"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 w-full"
            >
              <h1 className="text-center text-2xl font-medium tracking-tight text-zinc-100">Connect manually with API</h1>
              <p className="mx-auto mt-3 max-w-[280px] text-center text-sm leading-6 text-zinc-400">
                Create a key in your exchange account and paste it here.
              </p>

              <form onSubmit={onManualSubmit} className="mt-8 w-full space-y-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-zinc-500">API Key</span>
                  <input
                    type="password"
                    name="apiKey"
                    autoComplete="off"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Paste key"
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.035] px-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-[#00ffc8]/40 focus:bg-white/[0.05] focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-zinc-500">Secret Key</span>
                  <input
                    type="password"
                    name="secretKey"
                    autoComplete="off"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    placeholder="Paste secret"
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.035] px-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-[#00ffc8]/40 focus:bg-white/[0.05] focus:outline-none"
                  />
                </label>

                <button
                  type="submit"
                  disabled={manualAwaitContinue}
                  className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-[#00ffc8] text-sm font-medium text-black transition-all hover:brightness-110 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Connect account
                </button>
              </form>

              <p className="mt-4 text-center text-xs leading-5 text-zinc-500">
                Make sure withdrawals are disabled when creating your key.
              </p>

              {manualAwaitContinue ? (
                <div className="mt-4 w-full space-y-3" aria-live="polite" role="status">
                  <p className="text-center text-xs leading-5 text-zinc-500">{statusMessage}</p>
                  <button
                    type="button"
                    onClick={goFeed}
                    className="flex h-12 w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.045] text-sm font-medium text-zinc-100 transition-all hover:bg-white/[0.07] active:scale-[0.985]"
                  >
                    Continue to Sigflo
                  </button>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  setManualMode(false);
                  setStatusMessage(null);
                  setManualAwaitContinue(false);
                }}
                className="mt-6 w-full text-center text-sm text-zinc-400 transition-colors hover:text-zinc-200"
              >
                Back to quick connect
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="quick"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 w-full"
            >
              <h1 className="text-center text-2xl font-medium tracking-tight text-zinc-100">Connect your exchange</h1>
              <p className="mx-auto mt-3 max-w-[280px] text-center text-sm leading-6 text-zinc-400">
                Securely link your account to use Sigflo with real trades
              </p>

              <div className="mt-10 flex w-full flex-col gap-3">
                {providers.map((p, i) => (
                  <ExchangeConnectButton
                    key={p.id}
                    provider={p.id}
                    badge={p.badge}
                    label={`Connect ${p.label}`}
                    onPress={() => onProviderPress(p.id)}
                    disabled={isConnecting}
                    motionIndex={i}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setStatusMessage(null);
                  setManualAwaitContinue(false);
                  setManualMode(true);
                }}
                className="mt-5 w-full text-center text-sm text-zinc-400 transition-colors hover:text-zinc-200"
              >
                Connect manually with API
              </button>

              <ul className="mt-8 w-full space-y-2 text-xs text-zinc-500">
                {['Withdrawals are never enabled', 'You stay in control', 'You can disconnect anytime'].map((line) => (
                  <li key={line} className="flex items-center justify-center gap-2">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-white/25" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={goFeed}
                className="mt-10 w-full text-center text-sm text-zinc-500 transition-colors hover:text-zinc-300"
              >
                Continue without linking
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {statusMessage && !manualMode ? (
          <div className="mt-4 w-full text-center" aria-live="polite" role="status">
            <p className="text-xs leading-5 text-zinc-500">{statusMessage}</p>
            {selectedProvider ? (
              <p className="mt-1 text-[11px] text-zinc-600">
                {selectedProvider === 'bybit' ? 'Bybit' : 'MEXC'} · preview only
              </p>
            ) : null}
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}
