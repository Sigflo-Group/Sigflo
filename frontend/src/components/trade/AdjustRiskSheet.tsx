import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { formatQuoteNumber } from '@/lib/formatQuote';
import { formatSignedUsd } from '@/lib/signedPnl';
import type {
  AutomationSafeguards,
  ExitAiMode,
  ExitAutomationActivityEntry,
  ExitStrategyPreset,
} from '@/types/aiExitAutomation';
import type { TradeSide } from '@/types/trade';

const THUMB_W = 44;
const SLIDE_COMMIT_THRESHOLD = 0.88;
const SLIDE_COMMIT_DELAY_MS = 200;

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

export type AdjustRiskPositionSnapshot = {
  pairLabel: string;
  side: TradeSide;
  /** Approximate position notional in USD. */
  positionNotionalUsd: number;
  entryPrice: number;
  markPrice: number;
  pnlUsd: number;
  stopPrice: number;
  targetPrice: number;
};

export type AdjustRiskExitAutomationApi = {
  mode: ExitAiMode;
  strategy: ExitStrategyPreset;
  setStrategy: (s: ExitStrategyPreset) => void;
  setSafeguards: Dispatch<SetStateAction<AutomationSafeguards>>;
  pushActivity: (
    entry: Omit<ExitAutomationActivityEntry, 'id' | 'ts'> & { id?: string; ts?: number },
  ) => void;
};

export type AdjustRiskSheetProps = {
  open: boolean;
  onClose: () => void;
  tabBarInsetPx: number;
  snapshot: AdjustRiskPositionSnapshot | null;
  exitAuto: AdjustRiskExitAutomationApi;
  /**
   * When set, slide-to-apply will submit this stop to the exchange if the draft stop changed.
   * Used from Trade manage mode (linear TP/SL).
   */
  onApplyExchangeStop?: (stopPrice: number) => Promise<void>;
  exchangeStopApplyDisabled?: boolean;
};

type RiskProfileId = 'let_run' | 'balanced' | 'protect';

const FOCUS_STEPS = [25, 50, 75, 100] as const;

const PROFILE_META: Record<
  RiskProfileId,
  { label: string; blurb: string; strategy: ExitStrategyPreset; safeguards: AutomationSafeguards }
> = {
  let_run: {
    label: 'Let it run',
    blurb: 'Wider loss room, later trims, trend-following exits.',
    strategy: 'trend_follow',
    safeguards: {
      maxLossPct: 8,
      minProfitBeforeTrimPct: 1.4,
      allowPartialExits: true,
      allowFullAutoClose: true,
    },
  },
  balanced: {
    label: 'Balanced',
    blurb: 'Default safeguards — protect profit without over-tightening.',
    strategy: 'protect_profit',
    safeguards: {
      maxLossPct: 5,
      minProfitBeforeTrimPct: 0.35,
      allowPartialExits: true,
      allowFullAutoClose: true,
    },
  },
  protect: {
    label: 'Protect capital',
    blurb: 'Tighter max loss, earlier trims, defensive exits.',
    strategy: 'tight_risk',
    safeguards: {
      maxLossPct: 2.5,
      minProfitBeforeTrimPct: 0.12,
      allowPartialExits: true,
      allowFullAutoClose: true,
    },
  },
};

function profileFromStrategy(s: ExitStrategyPreset): RiskProfileId {
  if (s === 'trend_follow') return 'let_run';
  if (s === 'tight_risk') return 'protect';
  return 'balanced';
}

function computePreview(
  snap: AdjustRiskPositionSnapshot,
  draftStop: number,
  focusPct: number,
): { maxLossUsd: number; lockedProfitUsd: number; rr: number | null; riskUsd: number; exposureUsd: number } {
  const scale = focusPct / 100;
  const notional = Math.max(0, snap.positionNotionalUsd) * scale;
  const entry = Math.max(1e-12, snap.entryPrice);
  const target = snap.targetPrice;
  const side = snap.side;

  let riskDist = 0;
  if (side === 'long') {
    riskDist = entry - draftStop;
  } else {
    riskDist = draftStop - entry;
  }
  if (!Number.isFinite(riskDist) || riskDist <= 0) {
    return {
      maxLossUsd: 0,
      lockedProfitUsd: 0,
      rr: null,
      riskUsd: 0,
      exposureUsd: notional,
    };
  }

  const maxLossUsd = notional * (riskDist / entry);

  let locked = 0;
  if (side === 'long' && draftStop > entry) {
    locked = notional * ((draftStop - entry) / entry);
  } else if (side === 'short' && draftStop < entry) {
    locked = notional * ((entry - draftStop) / entry);
  }

  let rewardDist = 0;
  if (side === 'long') {
    rewardDist = target - entry;
  } else {
    rewardDist = entry - target;
  }
  const rr =
    Number.isFinite(rewardDist) && rewardDist > 0 && riskDist > 0 ? rewardDist / riskDist : null;

  return {
    maxLossUsd,
    lockedProfitUsd: Math.max(0, locked),
    rr,
    riskUsd: maxLossUsd,
    exposureUsd: notional,
  };
}

function SlideToApply({
  disabled,
  busy,
  onCommit,
}: {
  disabled: boolean;
  busy: boolean;
  onCommit: () => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackW, setTrackW] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);
  const startX = useRef(0);
  const startDragX = useRef(0);
  const commitScheduledRef = useRef(false);
  const maxXRef = useRef(0);
  const dragXRef = useRef(0);
  const disabledRef = useRef(disabled);
  const busyRef = useRef(busy);
  const onCommitRef = useRef(onCommit);
  const removeWindowListenersRef = useRef<(() => void) | null>(null);

  const maxX = Math.max(0, trackW - THUMB_W);
  maxXRef.current = maxX;
  dragXRef.current = dragX;
  disabledRef.current = disabled;
  busyRef.current = busy;
  onCommitRef.current = onCommit;

  const rawProgress = maxX > 0 ? dragX / maxX : 0;
  const fillProgress = maxX > 0 ? Math.pow(rawProgress, 1.12) : 0;

  useLayoutEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      setTrackW(w);
      if (w === 0) {
        requestAnimationFrame(() => setTrackW(el.clientWidth));
      }
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (disabled || busy) {
      removeWindowListenersRef.current?.();
      removeWindowListenersRef.current = null;
      draggingRef.current = false;
      setDragging(false);
      setDragX(0);
      commitScheduledRef.current = false;
    }
  }, [disabled, busy]);

  useEffect(
    () => () => {
      removeWindowListenersRef.current?.();
      removeWindowListenersRef.current = null;
    },
    [],
  );

  const snapBack = useCallback(() => setDragX(0), []);

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (disabledRef.current || busyRef.current || maxXRef.current <= 0) return;
    e.preventDefault();
    e.stopPropagation();
    removeWindowListenersRef.current?.();
    removeWindowListenersRef.current = null;
    commitScheduledRef.current = false;
    const pointerId = e.pointerId;
    const target = e.currentTarget;
    try {
      target.setPointerCapture(pointerId);
    } catch (e) { console.error("[Caught Error]", e); }
    draggingRef.current = true;
    setDragging(true);
    startX.current = e.clientX;
    startDragX.current = dragXRef.current;

    const removeListeners = () => {
      window.removeEventListener('pointermove', onMove, true);
      window.removeEventListener('pointerup', onUp, true);
      window.removeEventListener('pointercancel', onUp, true);
      removeWindowListenersRef.current = null;
    };

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      if (!draggingRef.current || disabledRef.current || busyRef.current) return;
      ev.preventDefault();
      const dx = ev.clientX - startX.current;
      const mx = maxXRef.current;
      setDragX(clamp(startDragX.current + dx, 0, mx));
    };

    const onUp = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      removeListeners();
      if (!draggingRef.current) return;
      draggingRef.current = false;
      setDragging(false);
      try {
        target.releasePointerCapture(pointerId);
      } catch (e) { console.error("[Caught Error]", e); }
      const mx = maxXRef.current;
      const x = clamp(startDragX.current + (ev.clientX - startX.current), 0, mx);
      if (mx > 0 && x >= mx * SLIDE_COMMIT_THRESHOLD && !commitScheduledRef.current) {
        commitScheduledRef.current = true;
        window.setTimeout(() => onCommitRef.current(), SLIDE_COMMIT_DELAY_MS);
      } else {
        snapBack();
      }
    };

    removeWindowListenersRef.current = removeListeners;
    window.addEventListener('pointermove', onMove, { capture: true, passive: false });
    window.addEventListener('pointerup', onUp, { capture: true });
    window.addEventListener('pointercancel', onUp, { capture: true });
  };

  return (
    <div className="select-none">
      <div
        ref={trackRef}
        className={`relative h-[48px] touch-none overflow-hidden rounded-2xl border border-landing-accent/25 bg-black/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ${
          disabled || busy ? 'opacity-45' : ''
        }`}
      >
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-landing-accent/30 to-landing-accent/10 transition-[width] duration-75 ease-out"
          style={{ width: `${fillProgress * 100}%` }}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center pr-10">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-landing-muted">
            {busy ? 'Applying…' : 'Slide to apply →'}
          </span>
        </div>
        <button
          type="button"
          disabled={disabled || busy}
          onPointerDown={onPointerDown}
          className="absolute top-1 bottom-1 flex w-11 touch-none items-center justify-center rounded-xl border border-landing-accent/40 bg-landing-surface text-landing-accent-hi shadow-landing-glow-sm transition-[transform] duration-150 ease-out hover:brightness-110 disabled:cursor-not-allowed"
          style={{
            transform: `translateX(${dragX}px)`,
            transition: dragging ? 'none' : 'transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            left: 4,
          }}
          aria-label="Slide to apply risk changes"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <p className="mt-1.5 text-center text-[9px] text-landing-muted">Full slide required — confirms your risk plan</p>
    </div>
  );
}

export function AdjustRiskSheet({
  open,
  onClose,
  tabBarInsetPx,
  snapshot,
  exitAuto,
  onApplyExchangeStop,
  exchangeStopApplyDisabled,
}: AdjustRiskSheetProps) {
  const [profileId, setProfileId] = useState<RiskProfileId>('balanced');
  const [focusPct, setFocusPct] = useState<(typeof FOCUS_STEPS)[number]>(100);
  const [draftStop, setDraftStop] = useState(0);
  const [baselineStop, setBaselineStop] = useState(0);
  const [applyBusy, setApplyBusy] = useState(false);
  const seededForOpenRef = useRef(false);

  useEffect(() => {
    if (!open) {
      seededForOpenRef.current = false;
      return;
    }
    if (!snapshot || seededForOpenRef.current) return;
    seededForOpenRef.current = true;
    setProfileId(profileFromStrategy(exitAuto.strategy));
    setFocusPct(100);
    const s = Number.isFinite(snapshot.stopPrice) && snapshot.stopPrice > 0 ? snapshot.stopPrice : snapshot.entryPrice;
    setDraftStop(s);
    setBaselineStop(s);
  }, [open, snapshot, exitAuto.strategy]);

  const preview = useMemo(() => {
    if (!snapshot) {
      return {
        maxLossUsd: 0,
        lockedProfitUsd: 0,
        rr: null as number | null,
        riskUsd: 0,
        exposureUsd: 0,
      };
    }
    return computePreview(snapshot, draftStop, focusPct);
  }, [snapshot, draftStop, focusPct]);

  const applyProfile = useCallback((id: RiskProfileId) => {
    setProfileId(id);
  }, []);

  const nudgeStopCustom = useCallback(
    (dir: -1 | 1) => {
      if (!snapshot) return;
      const entry = snapshot.entryPrice;
      if (!(entry > 0)) return;
      const step = entry * 0.0025 * dir;
      setDraftStop((prev) => {
        const next = snapshot.side === 'long' ? prev + step : prev - step;
        if (!Number.isFinite(next) || next <= 0) return prev;
        return next;
      });
    },
    [snapshot],
  );

  const onBreakeven = useCallback(() => {
    if (!snapshot) return;
    const entry = snapshot.entryPrice;
    if (!(entry > 0)) return;
    const buf = 0.00012;
    const be = snapshot.side === 'long' ? entry * (1 - buf) : entry * (1 + buf);
    setDraftStop(be);
  }, [snapshot]);

  const onTighten = useCallback(() => {
    if (!snapshot) return;
    const entry = snapshot.entryPrice;
    const cur = draftStop;
    if (!(entry > 0) || !(cur > 0)) return;
    const tightened =
      snapshot.side === 'long' ? cur + (entry - cur) * 0.38 : cur - (cur - entry) * 0.38;
    if (Number.isFinite(tightened) && tightened > 0) setDraftStop(tightened);
  }, [draftStop, snapshot]);

  const handleApply = useCallback(async () => {
    if (!snapshot) return;
    const meta = PROFILE_META[profileId];
    exitAuto.setStrategy(meta.strategy);
    exitAuto.setSafeguards({ ...meta.safeguards });
    const stopChanged = Math.abs(draftStop - baselineStop) > baselineStop * 1e-8;
    if (onApplyExchangeStop && stopChanged && !exchangeStopApplyDisabled) {
      setApplyBusy(true);
      try {
        await onApplyExchangeStop(draftStop);
      } finally {
        setApplyBusy(false);
      }
    }
    const pctLine = `Exposure view ${focusPct}%`;
    const stopLine = stopChanged
      ? onApplyExchangeStop && !exchangeStopApplyDisabled
        ? `Stop synced ~$${formatQuoteNumber(draftStop)}`
        : `Stop plan ~$${formatQuoteNumber(draftStop)} (sync in Manage if needed)`
      : 'Stop unchanged';
    exitAuto.pushActivity({
      kind: 'strategy_change',
      message: `Risk profile: ${meta.label} · ${pctLine} · ${stopLine}`,
    });
    onClose();
  }, [
    baselineStop,
    draftStop,
    exchangeStopApplyDisabled,
    exitAuto,
    focusPct,
    onApplyExchangeStop,
    onClose,
    profileId,
    snapshot,
  ]);

  if (!open) return null;

  const bottomPad = `calc(${tabBarInsetPx}px + env(safe-area-inset-bottom, 0px) + 12px)`;

  return (
    <>
      <button
        type="button"
        aria-label="Dismiss adjust risk"
        className="fixed inset-0 z-[120] bg-black/55 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className="fixed left-0 right-0 z-[121] mx-auto max-h-[min(88vh,640px)] w-full max-w-lg overflow-hidden rounded-t-3xl border border-white/[0.08] bg-landing-surface landing-panel-texture shadow-landing-card"
        style={{ bottom: 0, paddingBottom: bottomPad }}
      >
        <div className="flex justify-center pt-2 pb-1">
          <div className="h-1 w-10 rounded-full bg-white/15" />
        </div>
        <div className="border-b border-white/[0.06] px-4 pb-3 pt-1">
          <h2 className="text-base font-bold text-landing-text">Adjust risk</h2>
          <p className="mt-0.5 text-[11px] leading-relaxed text-landing-muted">
            Tune automation and your stop plan before you commit — one slide to apply.
          </p>
        </div>

        <div className="max-h-[min(62vh,520px)] overflow-y-auto overscroll-y-contain px-4 py-3">
          {!snapshot ? (
            <p className="text-sm text-landing-muted">No active position context.</p>
          ) : (
            <div className="space-y-4">
              <section className="rounded-2xl border border-white/[0.07] bg-black/25 px-3 py-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-landing-muted">Position</p>
                <div className="mt-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-landing-text">{snapshot.pairLabel}</p>
                    <p className="mt-0.5 text-[11px] text-landing-muted">
                      Size ≈{' '}
                      <span className="font-mono font-semibold text-landing-text">
                        ${Math.round(snapshot.positionNotionalUsd).toLocaleString('en-US')}
                      </span>{' '}
                      notional
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                      snapshot.side === 'long'
                        ? 'border-landing-accent/40 bg-landing-accent-dim text-landing-accent-hi'
                        : 'border-rose-400/35 bg-rose-500/12 text-rose-100'
                    }`}
                  >
                    {snapshot.side === 'long' ? 'Long' : 'Short'}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <dt className="text-landing-muted">Entry</dt>
                    <dd className="mt-0.5 font-mono font-semibold text-landing-text">
                      ${formatQuoteNumber(snapshot.entryPrice)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-landing-muted">Mark</dt>
                    <dd className="mt-0.5 font-mono font-semibold text-landing-text">
                      ${formatQuoteNumber(snapshot.markPrice)}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-landing-muted">Unrealized PnL</dt>
                    <dd
                      className={`mt-0.5 font-mono text-sm font-bold ${
                        snapshot.pnlUsd >= 0 ? 'text-emerald-200/95' : 'text-rose-200/90'
                      }`}
                    >
                      {formatSignedUsd(snapshot.pnlUsd)}
                    </dd>
                  </div>
                </dl>
              </section>

              <section>
                <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.16em] text-landing-muted">
                  Risk profile
                </p>
                <div className="grid gap-2">
                  {(Object.keys(PROFILE_META) as RiskProfileId[]).map((id) => {
                    const m = PROFILE_META[id];
                    const active = profileId === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => applyProfile(id)}
                        className={`rounded-2xl border px-3 py-2.5 text-left transition active:scale-[0.99] ${
                          active
                            ? 'border-landing-accent/45 bg-landing-accent-dim/80 ring-1 ring-landing-accent/25'
                            : 'border-white/[0.08] bg-black/20 hover:border-white/[0.12]'
                        }`}
                      >
                        <p className="text-[13px] font-bold text-landing-text">{m.label}</p>
                        <p className="mt-0.5 text-[11px] leading-snug text-landing-muted">{m.blurb}</p>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl border border-white/[0.07] bg-black/20 px-3 py-2.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-landing-muted">
                  Position size focus
                </p>
                <p className="mt-1 text-[10px] leading-relaxed text-landing-muted">
                  Preview risk and exposure as a fraction of the open leg (does not scale the live order until you
                  partially close).
                </p>
                <div className="mt-3 flex gap-1.5">
                  {FOCUS_STEPS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFocusPct(p)}
                      className={`flex-1 rounded-xl py-2 text-[11px] font-bold transition active:scale-[0.98] ${
                        focusPct === p
                          ? 'bg-landing-accent-dim text-landing-accent-hi ring-1 ring-landing-accent/30'
                          : 'border border-white/[0.08] bg-landing-bg/80 text-landing-muted'
                      }`}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-landing-muted">Risk at stop (preview)</span>
                    <p className="mt-0.5 font-mono font-semibold text-rose-200/90">
                      ≈ ${preview.maxLossUsd.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <span className="text-landing-muted">Exposure (preview)</span>
                    <p className="mt-0.5 font-mono font-semibold text-landing-text">
                      ≈ ${preview.exposureUsd.toFixed(2)}
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.16em] text-landing-muted">
                  Stop loss
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onBreakeven}
                    className="rounded-xl border border-white/[0.1] bg-landing-surface landing-panel-texture py-2.5 text-[11px] font-bold text-landing-text transition hover:border-landing-accent/30 active:scale-[0.99]"
                  >
                    Move to breakeven
                  </button>
                  <button
                    type="button"
                    onClick={onTighten}
                    className="rounded-xl border border-white/[0.1] bg-landing-surface landing-panel-texture py-2.5 text-[11px] font-bold text-landing-text transition hover:border-landing-accent/30 active:scale-[0.99]"
                  >
                    Tighten stop
                  </button>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => nudgeStopCustom(-1)}
                    className="flex-1 rounded-xl border border-white/[0.08] bg-black/25 py-2 text-[10px] font-bold text-landing-muted transition hover:border-white/[0.14] active:scale-[0.99]"
                  >
                    Custom −0.25%
                  </button>
                  <button
                    type="button"
                    onClick={() => nudgeStopCustom(1)}
                    className="flex-1 rounded-xl border border-white/[0.08] bg-black/25 py-2 text-[10px] font-bold text-landing-muted transition hover:border-white/[0.14] active:scale-[0.99]"
                  >
                    Custom +0.25%
                  </button>
                </div>
                <p className="mt-2 text-center font-mono text-[11px] text-landing-text">
                  Draft stop ~${formatQuoteNumber(draftStop)}
                </p>
              </section>

              <section className="rounded-2xl border border-landing-accent/20 bg-landing-accent-dim/25 px-3 py-2.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-landing-muted">Live preview</p>
                <dl className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <dt className="text-landing-muted">Max loss</dt>
                    <dd className="mt-0.5 font-mono font-semibold text-rose-200/90">
                      ${preview.maxLossUsd.toFixed(2)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-landing-muted">Locked profit</dt>
                    <dd className="mt-0.5 font-mono font-semibold text-emerald-200/90">
                      ${preview.lockedProfitUsd.toFixed(2)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-landing-muted">R:R</dt>
                    <dd className="mt-0.5 font-mono font-semibold text-landing-text">
                      {preview.rr != null && Number.isFinite(preview.rr) ? `${preview.rr.toFixed(2)} : 1` : '—'}
                    </dd>
                  </div>
                </dl>
              </section>

              {exitAuto.mode !== 'manual' ? (
                <p className="rounded-xl border border-cyan-400/20 bg-cyan-500/[0.08] px-3 py-2 text-[11px] leading-relaxed text-cyan-100/90">
                  AI will adjust exit strategy accordingly ({PROFILE_META[profileId].label} preset).
                </p>
              ) : null}

              <SlideToApply disabled={!snapshot || applyBusy} busy={applyBusy} onCommit={() => void handleApply()} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
