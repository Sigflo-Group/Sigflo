import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type TradeDirection = 'long' | 'short';

export type GuidedExecutionSetup = {
  symbol: string;
  direction: TradeDirection;
  statusLabel: string;
  setupScore: number;
  setupLabel: string;
  rationale: string;
  entry: number;
  stop: number;
  target: number;
  positionSizeUsd: number;
  leverage: number;
  estimatedMarginUsd: number;
  liquidationBufferPct: number;
  riskRewardRatio: number;
};

export type GuidedExecutionPanelProps = {
  open: boolean;
  setup: GuidedExecutionSetup;
  onClose: () => void;
  onExecute: (payload: {
    symbol: string;
    direction: TradeDirection;
    entry: number;
    stop: number;
    target: number;
    positionSizeUsd: number;
    leverage: number;
  }) => Promise<void>;
  onViewPosition?: () => void;
};

type UiState =
  | 'closed'
  | 'opening'
  | 'idle'
  | 'editing'
  | 'readyToExecute'
  | 'submitting'
  | 'success'
  | 'error';

const OPEN_CLOSE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function fmtUsd(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtPx(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return `${n.toFixed(2)}%`;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function mapExecutionError(msg: string): string {
  const raw = msg.trim();
  if (!raw) return 'Order rejected';
  const m = raw.toLowerCase();
  if (m.includes('margin') || m.includes('insufficient')) return 'Insufficient margin';
  if (m.includes('price') || m.includes('slippage')) return 'Price moved outside accepted range';
  return 'Order rejected';
}

function ExecutionRiskRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-black/25 p-2.5">
      <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function ExecutionAdjustDrawer({
  open,
  disabled,
  positionSizeUsd,
  leverage,
  stop,
  target,
  onPositionSizeUsd,
  onLeverage,
  onStop,
  onTarget,
}: {
  open: boolean;
  disabled: boolean;
  positionSizeUsd: number;
  leverage: number;
  stop: number;
  target: number;
  onPositionSizeUsd: (v: number) => void;
  onLeverage: (v: number) => void;
  onStop: (v: number) => void;
  onTarget: (v: number) => void;
}) {
  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: OPEN_CLOSE_EASE }}
          className="overflow-hidden"
        >
          <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl border border-white/[0.08] bg-black/20 p-2.5">
            <label className="text-xs text-zinc-400">
              Position Size
              <input
                disabled={disabled}
                type="number"
                value={positionSizeUsd}
                min={0}
                step={10}
                onChange={(e) => onPositionSizeUsd(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/35 px-2 py-1.5 text-sm text-white disabled:opacity-60"
              />
            </label>
            <label className="text-xs text-zinc-400">
              Leverage
              <input
                disabled={disabled}
                type="number"
                value={leverage}
                min={1}
                step={0.5}
                onChange={(e) => onLeverage(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/35 px-2 py-1.5 text-sm text-white disabled:opacity-60"
              />
            </label>
            <label className="text-xs text-zinc-400">
              Stop
              <input
                disabled={disabled}
                type="number"
                value={stop}
                min={0}
                step={0.01}
                onChange={(e) => onStop(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/35 px-2 py-1.5 text-sm text-white disabled:opacity-60"
              />
            </label>
            <label className="text-xs text-zinc-400">
              Target
              <input
                disabled={disabled}
                type="number"
                value={target}
                min={0}
                step={0.01}
                onChange={(e) => onTarget(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/35 px-2 py-1.5 text-sm text-white disabled:opacity-60"
              />
            </label>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function SlideToConfirm({
  disabled,
  loading,
  success,
  onConfirm,
}: {
  disabled?: boolean;
  loading?: boolean;
  success?: boolean;
  onConfirm: () => void;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const knobW = 46;
  const threshold = 0.86;

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    if (loading || success) setProgress(1);
  }, [loading, success]);

  const handlePointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (disabled || loading || success) return;
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    setDragging(true);
    const onMove = (ev: PointerEvent) => {
      const maxX = Math.max(1, rect.width - knobW - 8);
      const x = clamp(ev.clientX - rect.left - knobW / 2 - 4, 0, maxX);
      const next = x / maxX;
      progressRef.current = next;
      setProgress(next);
    };
    const onUp = () => {
      setDragging(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (progressRef.current >= threshold) {
        setProgress(1);
        onConfirm();
      } else {
        setProgress(0);
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const fillPct = `${Math.round(progress * 100)}%`;
  const label = loading ? 'Sending order...' : success ? 'Confirmed' : 'Slide to execute';

  return (
    <div className="space-y-2">
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">Slide to execute</p>
      <div
        ref={trackRef}
        className={`relative h-14 w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ${
          disabled ? 'opacity-60' : ''
        }`}
      >
        <motion.div
          className="absolute inset-y-0 left-0 bg-[linear-gradient(90deg,rgba(0,255,200,0.22),rgba(0,255,200,0.05))]"
          animate={{ width: fillPct }}
          transition={{ duration: 0.15, ease: 'linear' }}
        />
        {loading ? (
          <motion.div
            className="absolute inset-0 -translate-x-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)]"
            animate={{ x: ['0%', '220%'] }}
            transition={{ duration: 1.15, repeat: Infinity, ease: 'linear' }}
          />
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-zinc-100">{label}</span>
        </div>
        <motion.button
          type="button"
          onPointerDown={handlePointerDown}
          aria-label="Slide to execute"
          disabled={disabled || loading || success}
          className="absolute top-1 z-10 h-12 w-12 rounded-xl border border-white/15 bg-[#0f1216] text-[#00ffc8] shadow-[0_0_20px_-10px_rgba(0,255,200,0.7)] disabled:cursor-not-allowed"
          style={{ left: `min(calc(100% - 3.25rem), max(0.25rem, ${fillPct}))` }}
          animate={{ scale: dragging ? 0.97 : 1 }}
          transition={{ duration: 0.12 }}
        >
          →
        </motion.button>
      </div>
    </div>
  );
}

function ExecutionSuccessState({ onViewPosition }: { onViewPosition?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-[#00ffc8]/30 bg-[#00ffc8]/8 p-3 text-center"
    >
      <motion.div
        className="mx-auto mb-2 h-10 w-10 rounded-full border border-[#00ffc8]/40 bg-[#00ffc8]/12"
        animate={{ boxShadow: ['0 0 0 rgba(0,255,200,0)', '0 0 24px rgba(0,255,200,0.58)', '0 0 0 rgba(0,255,200,0)'] }}
        transition={{ duration: 1.2, repeat: 2, ease: 'easeInOut' }}
      />
      <p className="text-sm font-semibold text-[#b8fff2]">Position opened</p>
      <p className="mt-0.5 text-xs text-[#b8fff2]/80">Order sent to broker</p>
      {onViewPosition ? (
        <button
          type="button"
          onClick={onViewPosition}
          className="mt-2 rounded-lg border border-[#00ffc8]/30 bg-[#00ffc8]/12 px-3 py-1.5 text-xs font-semibold text-[#b8fff2] hover:bg-[#00ffc8]/16"
        >
          View Position
        </button>
      ) : null}
    </motion.div>
  );
}

export function GuidedExecutionPanel({ open, setup, onClose, onExecute, onViewPosition }: GuidedExecutionPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openedAt, setOpenedAt] = useState<number>(0);

  const [positionSizeUsd, setPositionSizeUsd] = useState(setup.positionSizeUsd);
  const [leverage, setLeverage] = useState(setup.leverage);
  const [stop, setStop] = useState(setup.stop);
  const [target, setTarget] = useState(setup.target);

  useEffect(() => {
    if (!open) return;
    setOpenedAt(Date.now());
    setAdjustOpen(false);
    setSubmitting(false);
    setSuccess(false);
    setError(null);
    setPositionSizeUsd(setup.positionSizeUsd);
    setLeverage(setup.leverage);
    setStop(setup.stop);
    setTarget(setup.target);
  }, [open, setup]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, open, submitting]);

  const uiState: UiState = useMemo(() => {
    if (!open) return 'closed';
    if (submitting) return 'submitting';
    if (success) return 'success';
    if (error) return 'error';
    if (adjustOpen) return 'editing';
    if (Date.now() - openedAt < 220) return 'opening';
    return 'readyToExecute';
  }, [adjustOpen, error, open, openedAt, submitting, success]);

  const riskReward = useMemo(() => {
    if (Number.isFinite(setup.riskRewardRatio)) return setup.riskRewardRatio;
    const risk = Math.abs(setup.entry - stop);
    const reward = Math.abs(target - setup.entry);
    return risk > 0 ? reward / risk : 0;
  }, [setup.entry, setup.riskRewardRatio, stop, target]);

  const estimatedMargin = useMemo(() => {
    if (!(positionSizeUsd > 0) || !(leverage > 0)) return setup.estimatedMarginUsd;
    return positionSizeUsd / leverage;
  }, [leverage, positionSizeUsd, setup.estimatedMarginUsd]);

  const canExecute =
    !submitting &&
    !success &&
    positionSizeUsd > 0 &&
    leverage > 0 &&
    stop > 0 &&
    target > 0 &&
    ((setup.direction === 'long' && stop < setup.entry && target > setup.entry) ||
      (setup.direction === 'short' && stop > setup.entry && target < setup.entry));

  const onSubmit = async () => {
    if (!canExecute || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await onExecute({
        symbol: setup.symbol,
        direction: setup.direction,
        entry: setup.entry,
        stop,
        target,
        positionSizeUsd,
        leverage,
      });
      setSuccess(true);
      setSubmitting(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      setError(mapExecutionError(msg));
      setSubmitting(false);
    }
  };

  const directionBadge =
    setup.direction === 'long'
      ? 'bg-emerald-400/15 text-emerald-200 ring-emerald-400/25'
      : 'bg-rose-400/15 text-rose-200 ring-rose-400/25';

  const setupScoreText = `${setup.setupScore} — ${setup.setupLabel}`;
  const rationaleText = setup.rationale?.trim() || 'Conditions aligned across trend, momentum, and structure.';

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm md:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.button
            type="button"
            aria-label="Close guided execution panel"
            className="absolute inset-0"
            onClick={() => {
              if (!submitting) onClose();
            }}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            className="relative z-10 max-h-[92dvh] w-full overflow-hidden rounded-t-3xl border border-white/10 bg-[#0b0b0b]/90 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:max-h-[88vh] md:max-w-md md:rounded-3xl"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.24, ease: OPEN_CLOSE_EASE }}
          >
            <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-white/20 md:hidden" />
            <div className="max-h-[calc(92dvh-0.5rem)] overflow-y-auto px-5 py-5 md:max-h-[88vh] md:px-6 md:py-6">
              <div className="mb-4 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold tracking-tight text-white">{setup.symbol}</h2>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ring-1 ${directionBadge}`}>
                      {setup.direction}
                    </span>
                    <span className="inline-flex rounded-full bg-cyan-500/12 px-2 py-0.5 text-[10px] font-semibold text-cyan-100 ring-1 ring-cyan-400/20">
                      In Play
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-300">{setupScoreText}</p>
                </div>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={onClose}
                  className="rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-400 hover:text-white disabled:opacity-50"
                >
                  Close
                </button>
              </div>

              <p className="mb-4 rounded-xl border border-white/[0.08] bg-black/25 px-3 py-2 text-xs leading-relaxed text-zinc-300">
                {rationaleText}
              </p>

              <div className="grid grid-cols-3 gap-2">
                <ExecutionRiskRow label="Entry" value={fmtPx(setup.entry)} />
                <ExecutionRiskRow label="Stop" value={fmtPx(stop)} />
                <ExecutionRiskRow label="Target" value={fmtPx(target)} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <ExecutionRiskRow label="Position Size" value={fmtUsd(positionSizeUsd)} />
                <ExecutionRiskRow label="Leverage" value={`${leverage.toFixed(1)}x`} />
                <ExecutionRiskRow label="Estimated Margin" value={fmtUsd(estimatedMargin)} />
                <ExecutionRiskRow label="Liquidation Buffer" value={fmtPct(setup.liquidationBufferPct)} />
                <div className="col-span-2">
                  <ExecutionRiskRow label="Risk / Reward" value={`${riskReward.toFixed(2)}R`} />
                </div>
              </div>

              <div className="mt-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setAdjustOpen((v) => !v)}
                  className="flex w-full items-center justify-between rounded-xl border border-white/[0.08] bg-black/25 px-3 py-2 text-left disabled:opacity-60"
                >
                  <span className="text-xs font-semibold text-white">Adjust setup</span>
                  <span className="text-xs text-zinc-400">{adjustOpen ? 'Hide' : 'Optional'}</span>
                </button>
                <ExecutionAdjustDrawer
                  open={adjustOpen}
                  disabled={submitting}
                  positionSizeUsd={positionSizeUsd}
                  leverage={leverage}
                  stop={stop}
                  target={target}
                  onPositionSizeUsd={setPositionSizeUsd}
                  onLeverage={setLeverage}
                  onStop={setStop}
                  onTarget={setTarget}
                />
              </div>

              <p className="mt-3 text-xs leading-snug text-zinc-400">
                You are responsible for all trades. This setup is generated from market data and may be incorrect.
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">Execution uses live market fills. Slippage may apply.</p>

              <div className="mt-3 rounded-2xl border border-white/[0.08] bg-black/35 p-3">
                <p className="text-sm font-semibold text-white">Execute Setup</p>
                <div className="mt-2">
                  {uiState === 'success' ? (
                    <ExecutionSuccessState onViewPosition={onViewPosition} />
                  ) : (
                    <div className="space-y-2">
                      <SlideToConfirm disabled={!canExecute} loading={submitting} success={success} onConfirm={() => void onSubmit()} />
                      <button
                        type="button"
                        disabled={!canExecute || submitting}
                        onClick={() => void onSubmit()}
                        className="w-full rounded-xl border border-[#00ffc8]/30 bg-[#00ffc8]/12 px-3 py-2 text-sm font-semibold text-[#bafef1] hover:bg-[#00ffc8]/16 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        Confirm execution (keyboard)
                      </button>
                      {error ? (
                        <div className="rounded-lg border border-rose-400/25 bg-rose-500/[0.08] p-2.5">
                          <p className="text-xs font-medium text-rose-200">{error}</p>
                          <button
                            type="button"
                            onClick={() => setError(null)}
                            className="mt-1 text-xs font-semibold text-rose-100 underline underline-offset-2"
                          >
                            Review and try again
                          </button>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default GuidedExecutionPanel;
