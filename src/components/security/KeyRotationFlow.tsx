import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { rotateExchangeKey } from '@/services/api/securityClient';
import type { IntegrationStatus } from '@/types/integrations';

type Step = 'intro' | 'enter_credentials' | 'confirming' | 'success';

type Props = {
  account: IntegrationStatus;
  onComplete?: () => void;
  onCancel?: () => void;
};

export function KeyRotationFlow({ account, onComplete, onCancel }: Props) {
  const [step, setStep] = useState<Step>('intro');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleRotate = useCallback(async () => {
    if (!apiKey.trim() || !apiSecret.trim()) return;
    setError(null);
    setStep('confirming');
    try {
      await rotateExchangeKey({
        accountId: account.id,
        apiKey: apiKey.trim(),
        apiSecret: apiSecret.trim(),
        reason: reason.trim() || undefined,
      });
      setStep('success');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Key rotation failed.');
      setStep('enter_credentials');
    }
  }, [account.id, apiKey, apiSecret, reason]);

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
        >
          {step === 'intro' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-sigflo-text">Rotate API key</h3>
                <p className="mt-1 text-sm text-sigflo-muted">
                  Replace your <span className="capitalize">{account.exchange}</span> credentials with a new key. The old key stays active on the exchange until you revoke it there.
                </p>
              </div>

              <div className="space-y-2.5">
                <RotationTip
                  title="When to rotate"
                  body="Rotate your key if you suspect it was compromised, if you've shared it, or as part of a regular security review."
                />
                <RotationTip
                  title="Create the new key first"
                  body={`Before continuing, create a new API key on ${account.exchange} with the same read-only permissions. Then come back here.`}
                />
                <RotationTip
                  title="Old key"
                  body="After rotation, revoke the old key from your exchange's API management page. Sigflo will stop using it immediately."
                />
              </div>

              <div className="flex gap-3">
                {onCancel && (
                  <button onClick={onCancel} className="flex-1 py-2.5 rounded-lg text-sm text-sigflo-muted border border-white/6 hover:border-white/12 transition-colors">
                    Cancel
                  </button>
                )}
                <button
                  onClick={() => setStep('enter_credentials')}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-sigflo-elevated border border-white/10 text-sigflo-text hover:border-sigflo-accent/30 transition-all"
                >
                  I have a new key ready
                </button>
              </div>
            </div>
          )}

          {step === 'enter_credentials' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-sigflo-text">Enter new credentials</h3>
                <p className="mt-1 text-sm text-sigflo-muted capitalize">
                  New {account.exchange} API key and secret
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-sigflo-muted mb-1.5">New API Key</label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Paste new API key"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-sigflo-surface border border-white/8 text-sigflo-text text-sm placeholder:text-sigflo-muted/50 focus:outline-none focus:border-sigflo-accent/40 focus:ring-1 focus:ring-sigflo-accent/20 transition-all font-mono"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-sigflo-muted mb-1.5">New API Secret</label>
                  <input
                    type="password"
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    placeholder="Paste new API secret"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-sigflo-surface border border-white/8 text-sigflo-text text-sm placeholder:text-sigflo-muted/50 focus:outline-none focus:border-sigflo-accent/40 focus:ring-1 focus:ring-sigflo-accent/20 transition-all font-mono"
                    autoComplete="new-password"
                    spellCheck={false}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-sigflo-muted mb-1.5">
                    Reason <span className="text-sigflo-muted/60">(optional, logged)</span>
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Scheduled rotation, suspected exposure"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-sigflo-surface border border-white/8 text-sigflo-text text-sm placeholder:text-sigflo-muted/50 focus:outline-none focus:border-sigflo-accent/40 focus:ring-1 focus:ring-sigflo-accent/20 transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-sigflo-lossDim border border-sigflo-loss/20">
                  <svg className="w-4 h-4 text-sigflo-loss flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7 7h2v4H7V7zm0 5h2v2H7v-2z" />
                  </svg>
                  <p className="text-xs text-sigflo-loss leading-relaxed">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep('intro')} className="flex-1 py-2.5 rounded-lg text-sm text-sigflo-muted border border-white/6 hover:border-white/12 transition-colors">
                  Back
                </button>
                <button
                  onClick={handleRotate}
                  disabled={apiKey.trim().length < 8 || apiSecret.trim().length < 8}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-sigflo-accent text-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-sigflo-accent/90 transition-all"
                >
                  Rotate key
                </button>
              </div>
            </div>
          )}

          {step === 'confirming' && (
            <div className="flex flex-col items-center py-10 space-y-3">
              <div className="w-9 h-9 rounded-full border-2 border-sigflo-accent/20 border-t-sigflo-accent animate-spin" />
              <p className="text-sm text-sigflo-muted">Validating and rotating key</p>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center py-8 space-y-5 text-center">
              <div className="w-13 h-13 w-12 h-12 rounded-2xl bg-sigflo-accent/15 flex items-center justify-center">
                <svg className="w-6 h-6 text-sigflo-accent" fill="none" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-sigflo-text">Key rotated</h3>
                <p className="mt-2 text-sm text-sigflo-muted max-w-xs mx-auto leading-relaxed">
                  Sigflo is now using your new key. Go to your exchange and revoke the old one.
                </p>
              </div>
              <div className="w-full p-3 rounded-lg bg-amber-500/5 border border-amber-500/15 text-left">
                <p className="text-xs text-amber-400 font-medium">Revoke the old key now</p>
                <p className="text-xs text-sigflo-muted mt-1 leading-relaxed">
                  Sigflo no longer uses it, but it's still active on your exchange until you revoke it. Do this now from your exchange's API management page.
                </p>
              </div>
              <button
                onClick={onComplete}
                className="w-full py-2.5 rounded-lg text-sm font-medium bg-sigflo-accent text-black hover:bg-sigflo-accent/90 transition-all"
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

function RotationTip({ title, body }: { title: string; body: string }) {
  return (
    <div className="p-3.5 rounded-xl border border-white/6 bg-sigflo-surface">
      <p className="text-xs font-medium text-sigflo-text">{title}</p>
      <p className="text-xs text-sigflo-muted mt-0.5 leading-relaxed">{body}</p>
    </div>
  );
}
