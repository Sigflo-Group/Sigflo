import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExchangeIntegrations } from '@/hooks/useExchangeIntegrations';
import type { IntegrationStatus, ExchangeId } from '@/types/integrations';

const EXCHANGE_NAMES: Record<ExchangeId, string> = {
  bybit: 'Bybit',
  mexc: 'MEXC',
};

type Props = {
  onAddExchange?: () => void;
};

export function ExchangeSwitcher({ onAddExchange }: Props) {
  const { items, loading, setActive } = useExchangeIntegrations();
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connectedExchanges = items.filter((e) => e.status === 'connected');

  const handleSwitch = useCallback(
    async (account: IntegrationStatus) => {
      if (account.isActive || switchingId) return;
      setSwitchingId(account.id);
      setError(null);
      try {
        await setActive(account.id);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to switch exchange.');
      } finally {
        setSwitchingId(null);
      }
    },
    [setActive, switchingId],
  );

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-sigflo-surface border border-white/6 animate-pulse" />
        ))}
      </div>
    );
  }

  if (connectedExchanges.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-sigflo-surface px-4 py-5 text-center">
        <p className="text-sm text-sigflo-muted mb-3">No exchange connected</p>
        {onAddExchange && (
          <button
            onClick={onAddExchange}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-sigflo-accentDim text-sigflo-accent border border-sigflo-accent/20 hover:bg-sigflo-accent/15 transition-all"
          >
            Connect exchange
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-xs text-sigflo-loss px-0.5">{error}</p>}

      {connectedExchanges.map((account) => {
        const name = EXCHANGE_NAMES[account.exchange] ?? account.exchange;
        const isActive = account.isActive;
        const isSwitching = switchingId === account.id;

        return (
          <button
            key={account.id}
            onClick={() => handleSwitch(account)}
            disabled={isActive || !!switchingId}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
              isActive
                ? 'border-sigflo-accent/25 bg-sigflo-accentDim cursor-default'
                : 'border-white/6 bg-sigflo-surface hover:border-white/12 hover:bg-white/[0.02] disabled:opacity-60'
            }`}
          >
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-sigflo-accent' : 'bg-white/20'}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-sigflo-text">{name}</span>
                {account.accountLabel && (
                  <span className="text-xs text-sigflo-muted truncate">{account.accountLabel}</span>
                )}
              </div>
              <div className="text-xs text-sigflo-muted mt-0.5">
                {isActive ? 'Active' : 'Connected — click to switch'}
              </div>
            </div>

            <AnimatePresence>
              {isSwitching && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-4 h-4 rounded-full border-2 border-sigflo-accent/20 border-t-sigflo-accent animate-spin flex-shrink-0"
                />
              )}
              {isActive && !isSwitching && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-5 h-5 rounded-full bg-sigflo-accent flex items-center justify-center flex-shrink-0"
                >
                  <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 12 12">
                    <path d="M2.5 6l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        );
      })}

      {onAddExchange && (
        <button
          onClick={onAddExchange}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-white/8 text-xs text-sigflo-muted hover:text-sigflo-text hover:border-white/16 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          Add another exchange
        </button>
      )}
    </div>
  );
}
