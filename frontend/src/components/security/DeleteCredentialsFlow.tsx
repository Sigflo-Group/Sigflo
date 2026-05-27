import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExchangeIntegrations } from '@/hooks/useExchangeIntegrations';
import type { IntegrationStatus, ExchangeId } from '@/types/integrations';

type Step = 'confirm' | 'deleting' | 'success';

type Props = {
  account: IntegrationStatus;
  onComplete?: () => void;
  onCancel?: () => void;
};

const EXCHANGE_NAMES: Record<ExchangeId, string> = {
  bybit: 'Bybit',
  mexc: 'MEXC',
};

export function DeleteCredentialsFlow({ account, onComplete, onCancel }: Props) {
  const [step, setStep] = useState<Step>('confirm');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { disconnect } = useExchangeIntegrations();

  const exchangeName = EXCHANGE_NAMES[account.exchange] ?? account.exchange;

  const handleDelete = useCallback(async () => {
    if (!confirmed) return;
    setError(null);
    setStep('deleting');
    try {
      await disconnect(account.exchange);
      setStep('success');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to disconnect exchange.');
      setStep('confirm');
    }
  }, [confirmed, disconnect, account.exchange]);

  return (
    <div className="w-full max-w-sm mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.16 }}
        >
          {step === 'confirm' && (
            <div className="space-y-5">
              <div>
                <div className="w-10 h-10 rounded-xl bg-sigflo-loss/10 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-sigflo-loss" fill="none" viewBox="0 0 20 20">
                    <path d="M9 2a7 7 0 100 14A7 7 0 009 2zm0 3v5m0 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-sigflo-text">
                  Disconnect {exchangeName}?
                </h3>
                <p className="mt-1.5 text-sm text-sigflo-muted leading-relaxed">
                  This removes your stored API credentials from Sigflo. Your{' '}
                  <span className="capitalize">{exchangeName}</span> account is not affected — only Sigflo's access is removed.
                </p>
              </div>

              <div className="space-y-2 text-xs text-sigflo-muted">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-sigflo-muted/50" />
                  <span>Your API key is deleted from our vault immediately.</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-sigflo-muted/50" />
                  <span>Position and balance data for this account will no longer sync.</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-sigflo-muted/50" />
                  <span>You can reconnect at any time.</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-sigflo-accentDim border border-sigflo-accent/10">
                <p className="text-xs text-sigflo-muted leading-relaxed">
                  <span className="text-sigflo-text font-medium">Also revoke on {exchangeName}.</span>{' '}
                  After disconnecting here, go to your exchange and revoke the API key directly. This prevents any future access by third parties if the key was ever exposed.
                </p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <div
                  className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                    confirmed ? 'bg-sigflo-loss border-sigflo-loss/60' : 'border-white/20 hover:border-white/40'
                  }`}
                  onClick={() => setConfirmed(!confirmed)}
                >
                  {confirmed && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-xs text-sigflo-muted leading-relaxed" onClick={() => setConfirmed(!confirmed)}>
                  I understand this removes Sigflo's access and I will revoke the key on {exchangeName} separately.
                </span>
              </label>

              {error && (
                <p className="text-xs text-sigflo-loss">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 py-2.5 rounded-lg text-sm text-sigflo-muted border border-white/6 hover:border-white/12 transition-colors"
                >
                  Keep connected
                </button>
                <button
                  onClick={handleDelete}
                  disabled={!confirmed}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-sigflo-loss/20 text-sigflo-loss border border-sigflo-loss/20 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-sigflo-loss/30 transition-all"
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}

          {step === 'deleting' && (
            <div className="flex flex-col items-center py-10 space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-sigflo-loss/20 border-t-sigflo-loss animate-spin" />
              <p className="text-sm text-sigflo-muted">Removing credentials</p>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center py-8 space-y-5 text-center">
              <div className="w-12 h-12 rounded-2xl bg-sigflo-elevated border border-white/8 flex items-center justify-center">
                <svg className="w-6 h-6 text-sigflo-muted" fill="none" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-sigflo-text">{exchangeName} disconnected</h3>
                <p className="mt-2 text-sm text-sigflo-muted leading-relaxed max-w-xs mx-auto">
                  Your credentials have been removed from Sigflo. Remember to revoke the API key on {exchangeName} too.
                </p>
              </div>
              <button
                onClick={onComplete}
                className="w-full py-2.5 rounded-lg text-sm font-medium bg-sigflo-elevated border border-white/10 text-sigflo-text hover:border-white/20 transition-all"
              >
                Done
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
