import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ADD_BOT_TEMPLATES, normalizeMarketTokens, type BotUserRiskLevel } from '@/lib/botUserConfig';

export type AddBotCompletePayload = {
  botId: 'bot-kai' | 'bot-nova' | 'bot-rio';
  watchedPairs: string[];
  riskLevel: BotUserRiskLevel;
  setupMode: 'suggestion' | 'assisted';
};

export type AddBotFlowModalProps = {
  open: boolean;
  onClose: () => void;
  onComplete: (payload: AddBotCompletePayload) => void;
};

const CORE_KEYS = ['BTC', 'ETH', 'SOL'] as const;

function initials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

function buildWatchedPairs(core: Record<(typeof CORE_KEYS)[number], boolean>, extraRaw: string): string[] {
  const fromCore = CORE_KEYS.filter((k) => core[k]);
  const fromExtra = normalizeMarketTokens(extraRaw.split(/[,;\s]+/).filter(Boolean));
  const merged = [...fromCore, ...fromExtra];
  return normalizeMarketTokens(merged);
}

export function AddBotFlowModal({ open, onClose, onComplete }: AddBotFlowModalProps) {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(1);
  const [selectedId, setSelectedId] = useState<AddBotCompletePayload['botId'] | null>(null);
  const [coreMarkets, setCoreMarkets] = useState<Record<(typeof CORE_KEYS)[number], boolean>>({
    BTC: true,
    ETH: true,
    SOL: true,
  });
  const [extraMarkets, setExtraMarkets] = useState('');
  const [riskLevel, setRiskLevel] = useState<BotUserRiskLevel>('medium');
  const [setupMode, setSetupMode] = useState<'suggestion' | 'assisted'>('suggestion');
  const [phase, setPhase] = useState<'idle' | 'activating' | 'scanning'>('idle');

  useEffect(() => {
    if (!open) {
      setStep(1);
      setSelectedId(null);
      setCoreMarkets({ BTC: true, ETH: true, SOL: true });
      setExtraMarkets('');
      setRiskLevel('medium');
      setSetupMode('suggestion');
      setPhase('idle');
      return;
    }
    setStep(1);
    setSelectedId(null);
    setCoreMarkets({ BTC: true, ETH: true, SOL: true });
    setExtraMarkets('');
    setRiskLevel('medium');
    setSetupMode('suggestion');
    setPhase('idle');
  }, [open]);

  const watchedPairs = useMemo(() => buildWatchedPairs(coreMarkets, extraMarkets), [coreMarkets, extraMarkets]);
  const marketsValid = watchedPairs.length > 0;

  const selectedTemplate = useMemo(
    () => (selectedId ? ADD_BOT_TEMPLATES.find((t) => t.id === selectedId) ?? null : null),
    [selectedId],
  );

  const handleSelectBot = useCallback((id: AddBotCompletePayload['botId']) => {
    setSelectedId(id);
    setStep(2);
  }, []);

  const handleStartBot = useCallback(() => {
    if (!selectedId || !marketsValid || phase !== 'idle') return;
    const payload: AddBotCompletePayload = {
      botId: selectedId,
      watchedPairs,
      riskLevel,
      setupMode,
    };

    const tActivate = reduceMotion ? 0 : 720;
    const tScan = reduceMotion ? 0 : 480;

    setPhase('activating');
    window.setTimeout(() => {
      setPhase('scanning');
      window.setTimeout(() => {
        onComplete(payload);
        onClose();
      }, tScan);
    }, tActivate);
  }, [selectedId, marketsValid, phase, watchedPairs, riskLevel, setupMode, onComplete, onClose, reduceMotion]);

  if (!open) return null;

  const stepTitle =
    step === 1 ? 'Choose your agent' : step === 2 ? 'Quick setup' : phase === 'scanning' ? 'Going live' : 'Activate';

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-[#06080c]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-bot-flow-title"
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex min-w-0 items-center gap-2">
          {step > 1 && phase === 'idle' ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-semibold text-cyan-100/90 active:scale-[0.98]"
            >
              Back
            </button>
          ) : (
            <span className="w-[52px]" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1 text-center">
          <p id="add-bot-flow-title" className="truncate text-sm font-bold text-white">
            {stepTitle}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sigflo-muted">
            Step {Math.min(step, 3)} of 3
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={phase !== 'idle'}
          className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-semibold text-sigflo-muted hover:text-white disabled:opacity-40"
        >
          Close
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
        <AnimatePresence mode="wait" initial={false}>
          {step === 1 && phase === 'idle' ? (
            <motion.div
              key="s1"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className="space-y-3"
            >
              <p className="text-xs leading-relaxed text-sigflo-muted">
                Pick a personality — each agent scans and suggests trades in its own style.
              </p>
              <div className="space-y-3">
                {ADD_BOT_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectBot(t.id)}
                    className={`flex w-full items-stretch gap-3 rounded-2xl border bg-gradient-to-br p-3.5 text-left shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] transition active:scale-[0.99] ${t.accentClass} border-white/[0.08] hover:border-white/[0.14]`}
                  >
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-[13px] font-bold tracking-tight ${t.borderActiveClass} border bg-black/35 text-white`}
                      aria-hidden
                    >
                      {initials(t.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white">
                        {t.name}{' '}
                        <span className="font-semibold text-cyan-200/85">({t.archetype})</span>
                      </p>
                      <p className="mt-1 text-[12px] leading-snug text-sigflo-muted">{t.tagline}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : null}

          {step === 2 && phase === 'idle' ? (
            <motion.div
              key="s2"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className="space-y-5"
            >
              {selectedTemplate ? (
                <div className="rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-sigflo-muted">Selected</p>
                  <p className="mt-0.5 text-sm font-bold text-white">
                    {selectedTemplate.name}{' '}
                    <span className="font-medium text-cyan-200/80">· {selectedTemplate.archetype}</span>
                  </p>
                </div>
              ) : null}

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-sigflo-muted">Markets</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CORE_KEYS.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setCoreMarkets((m) => ({ ...m, [k]: !m[k] }))}
                      className={`rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition ${
                        coreMarkets[k]
                          ? 'border-[rgba(0,255,200,0.35)] bg-[rgba(0,255,200,0.1)] text-[#b8fff0]'
                          : 'border-white/[0.08] bg-white/[0.03] text-sigflo-muted'
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
                <label className="mt-3 block">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sigflo-muted">
                    Add tickers
                  </span>
                  <input
                    type="text"
                    value={extraMarkets}
                    onChange={(e) => setExtraMarkets(e.target.value)}
                    placeholder="e.g. AVAX, LINK"
                    className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-sigflo-muted/70 focus:border-[rgba(0,255,200,0.35)] focus:outline-none"
                  />
                </label>
                {!marketsValid ? (
                  <p className="mt-2 text-[11px] font-medium text-amber-200/90">Select at least one market.</p>
                ) : (
                  <p className="mt-2 text-[11px] text-sigflo-muted">
                    Watching: <span className="font-semibold text-cyan-100/90">{watchedPairs.join(', ')}</span>
                  </p>
                )}
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-sigflo-muted">Risk level</p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRiskLevel(r)}
                      className={`rounded-xl border py-2.5 text-[11px] font-bold capitalize transition ${
                        riskLevel === r
                          ? 'border-[rgba(0,255,200,0.35)] bg-[rgba(0,255,200,0.08)] text-[#b8fff0]'
                          : 'border-white/[0.08] bg-white/[0.03] text-sigflo-muted'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-sigflo-muted">Mode</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSetupMode('suggestion')}
                    className={`rounded-xl border px-2 py-2.5 text-left transition ${
                      setupMode === 'suggestion'
                        ? 'border-[rgba(0,255,200,0.35)] bg-[rgba(0,255,200,0.08)]'
                        : 'border-white/[0.08] bg-white/[0.03]'
                    }`}
                  >
                    <p className="text-[11px] font-bold text-white">Suggestion</p>
                    <p className="mt-0.5 text-[10px] leading-snug text-sigflo-muted">Ideas only — you confirm trades.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSetupMode('assisted')}
                    className={`rounded-xl border px-2 py-2.5 text-left transition ${
                      setupMode === 'assisted'
                        ? 'border-[rgba(0,255,200,0.35)] bg-[rgba(0,255,200,0.08)]'
                        : 'border-white/[0.08] bg-white/[0.03]'
                    }`}
                  >
                    <p className="text-[11px] font-bold text-white">Assisted</p>
                    <p className="mt-0.5 text-[10px] leading-snug text-sigflo-muted">Guided execution with guardrails.</p>
                  </button>
                </div>
              </div>

              <button
                type="button"
                disabled={!marketsValid}
                onClick={() => setStep(3)}
                className="w-full rounded-xl border border-[rgba(0,255,200,0.28)] bg-[rgba(0,255,200,0.1)] py-3 text-sm font-bold text-[#b8fff0] shadow-[0_0_20px_-12px_rgba(0,255,200,0.35)] disabled:opacity-40"
              >
                Continue
              </button>
            </motion.div>
          ) : null}

          {step === 3 ? (
            <motion.div
              key="s3"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className="space-y-5"
            >
              <div className="rounded-2xl border border-white/[0.06] bg-black/35 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-sigflo-muted">Deploy summary</p>
                <ul className="mt-3 space-y-2 text-[12px] text-cyan-100/90">
                  <li>
                    <span className="text-sigflo-muted">Agent: </span>
                    <span className="font-bold text-white">
                      {selectedTemplate?.name} ({selectedTemplate?.archetype})
                    </span>
                  </li>
                  <li>
                    <span className="text-sigflo-muted">Markets: </span>
                    {watchedPairs.join(', ')}
                  </li>
                  <li>
                    <span className="text-sigflo-muted">Risk: </span>
                    <span className="capitalize">{riskLevel}</span>
                  </li>
                  <li>
                    <span className="text-sigflo-muted">Mode: </span>
                    <span className="capitalize">{setupMode}</span>
                  </li>
                </ul>
              </div>

              <div className="relative flex min-h-[200px] flex-col items-center justify-center">
                <AnimatePresence mode="wait">
                  {phase === 'activating' ? (
                    <motion.div
                      key="act"
                      initial={{ scale: 0.92, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 1.04, opacity: 0 }}
                      className="flex flex-col items-center gap-4"
                    >
                      <motion.div
                        className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-[rgba(0,255,200,0.45)] bg-[rgba(0,255,200,0.06)] shadow-[0_0_40px_-12px_rgba(0,255,200,0.45)]"
                        animate={
                          reduceMotion
                            ? undefined
                            : {
                                boxShadow: [
                                  '0 0 28px -8px rgba(0,255,200,0.35)',
                                  '0 0 48px -8px rgba(0,255,200,0.55)',
                                  '0 0 28px -8px rgba(0,255,200,0.35)',
                                ],
                              }
                        }
                        transition={{ duration: 1.1, repeat: reduceMotion ? 0 : Infinity, ease: 'easeInOut' }}
                      >
                        <span className="text-lg font-black tracking-tight text-[#b8fff0]">
                          {selectedTemplate?.name ?? '…'}
                        </span>
                        {!reduceMotion ? (
                          <motion.span
                            className="pointer-events-none absolute inset-[-6px] rounded-full border border-[rgba(0,255,200,0.25)]"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
                            aria-hidden
                          />
                        ) : null}
                      </motion.div>
                      <p className="text-sm font-semibold text-white">Activating agent…</p>
                    </motion.div>
                  ) : null}

                  {phase === 'scanning' ? (
                    <motion.div
                      key="scan"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center gap-3 text-center"
                    >
                      <span className="relative flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400/50 opacity-60" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.5)]" />
                      </span>
                      <p className="text-base font-bold text-cyan-100">Scanning…</p>
                      <p className="max-w-[260px] text-xs text-sigflo-muted">
                        {selectedTemplate?.name} is pulling live context for {watchedPairs.join(', ')}.
                      </p>
                    </motion.div>
                  ) : null}

                  {phase === 'idle' ? (
                    <motion.div
                      key="idle"
                      initial={false}
                      animate={{ opacity: 1 }}
                      className="w-full space-y-4"
                    >
                      <p className="text-center text-xs text-sigflo-muted">
                        Your agent will appear in the list and begin monitoring right away.
                      </p>
                      <button
                        type="button"
                        onClick={handleStartBot}
                        className="w-full rounded-xl border border-[rgba(0,255,200,0.35)] bg-gradient-to-b from-[rgba(0,255,200,0.18)] to-[rgba(0,255,200,0.06)] py-3.5 text-sm font-extrabold uppercase tracking-wide text-[#0a1614] shadow-[0_0_28px_-10px_rgba(0,255,200,0.5)] active:scale-[0.99]"
                      >
                        Start Bot
                      </button>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
