import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { acknowledgeRisk, getRiskAcknowledgement } from '@/services/api/securityClient';
import { useAuth } from '@/context/AuthContext';

const CURRENT_VERSION = 'v1';

type Props = {
  children: ReactNode;
};

export function RiskDisclosureGate({ children }: Props) {
  const { user } = useAuth();
  const [acknowledged, setAcknowledged] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setAcknowledged(true);
      setChecking(false);
      return;
    }
    setChecking(true);
    getRiskAcknowledgement()
      .then((res) => {
        setAcknowledged(res.acknowledged && res.version === CURRENT_VERSION);
      })
      .catch(() => {
        setAcknowledged(true);
      })
      .finally(() => setChecking(false));
  }, [user]);

  const handleAccept = useCallback(async () => {
    setAccepting(true);
    setError(null);
    try {
      await acknowledgeRisk(CURRENT_VERSION);
      setAcknowledged(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to record acceptance.');
    } finally {
      setAccepting(false);
    }
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const isNearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 24;
    if (isNearBottom) setScrolledToBottom(true);
  }, []);

  if (checking) return null;
  if (acknowledged) return <>{children}</>;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-sigflo-bg/95 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-md bg-sigflo-surface border border-white/8 rounded-2xl overflow-hidden shadow-card"
        >
          <div className="px-6 pt-6 pb-4 border-b border-white/6">
            <div className="w-10 h-10 rounded-xl bg-sigflo-accent/15 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-sigflo-accent" fill="none" viewBox="0 0 20 20">
                <path d="M9 2a7 7 0 100 14A7 7 0 009 2zm0 7V6m0 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-sigflo-text">Before you start</h2>
            <p className="text-sm text-sigflo-muted mt-1 leading-relaxed">
              Please read and accept these terms to continue.
            </p>
          </div>

          <div
            className="px-6 py-4 max-h-72 overflow-y-auto space-y-4 text-sm text-sigflo-muted leading-relaxed"
            onScroll={handleScroll}
          >
            <section>
              <h3 className="text-sigflo-text font-medium mb-1.5">Market risk</h3>
              <p>
                Crypto markets are volatile. Prices can move dramatically in short periods. Sigflo provides analysis tools — it does not guarantee any trading outcome. Past signal performance does not predict future results.
              </p>
            </section>
            <section>
              <h3 className="text-sigflo-text font-medium mb-1.5">Read-only access</h3>
              <p>
                Sigflo reads your exchange account to display positions and balance. It does not and cannot place orders or move funds on your behalf. You remain fully in control of your account.
              </p>
            </section>
            <section>
              <h3 className="text-sigflo-text font-medium mb-1.5">Not financial advice</h3>
              <p>
                Nothing shown in Sigflo constitutes financial advice. Signal indicators and market analysis are educational tools. All trading decisions are yours alone.
              </p>
            </section>
            <section>
              <h3 className="text-sigflo-text font-medium mb-1.5">API key security</h3>
              <p>
                You are responsible for creating API keys with appropriate permissions. Never enable withdrawal access on keys used with Sigflo. Revoke unused keys from your exchange promptly.
              </p>
            </section>
            <section>
              <h3 className="text-sigflo-text font-medium mb-1.5">Beta software</h3>
              <p>
                Sigflo is in active development. Features may change and errors can occur. Do not rely solely on Sigflo for critical trading decisions.
              </p>
            </section>
            <div className="h-4" />
          </div>

          <div className="px-6 py-4 border-t border-white/6 space-y-3">
            {!scrolledToBottom && (
              <p className="text-xs text-sigflo-muted text-center">Scroll to read all terms</p>
            )}
            {error && (
              <p className="text-xs text-sigflo-loss text-center">{error}</p>
            )}
            <button
              onClick={handleAccept}
              disabled={!scrolledToBottom || accepting}
              className="w-full py-2.5 rounded-lg text-sm font-medium bg-sigflo-accent text-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-sigflo-accent/90 transition-all"
            >
              {accepting ? 'Recording...' : 'I understand — continue to Sigflo'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
