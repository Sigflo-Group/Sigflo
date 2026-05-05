import { setupBandDockCompactLabel, setupBandDockEmphasisClass } from '@/lib/setupBandUi';
import { playSideEntryClickSound } from '@/utils/sound';
import type { TradeTimingChipState } from '@/lib/tradeTimingChip';
import { StatusChip } from '@/components/trade/StatusChip';
import type { MarketMode } from '@/types/trade';

/**
 * Chart-inline SHORT/LONG (`ChartInlineTradeButtons`) with optional bias emphasis + `dockMeta`.
 * Primary ticket actions also flow through `TradeControls` on `TradeScreen`.
 *
 * Props below: compact Short/Long (or Sell/Buy) embedded in the chart timeframe row or assistant strip.
 */
export type ChartTradeQuickActions = {
  market: MarketMode;
  canExecute: boolean;
  onOpenShort: () => void;
  onOpenLong: () => void;
  flashSide?: 'long' | 'short' | null;
};

function withSideEntrySound(fn: () => void) {
  return () => {
    playSideEntryClickSound();
    fn();
  };
}

export type ChartDockDecisionMeta = {
  confidenceLabel: string;
  setupQualityLabel: string;
  timing: { label: string; state: TradeTimingChipState };
};

/** 2×2 Trade / Setup score grid used in the chart dock (with Short/Long or beside position actions). */
export function ChartDockScoreGrid({ dockMeta }: { dockMeta: ChartDockDecisionMeta }) {
  const dockTealGlow =
    'font-semibold text-cyan-200/95 [text-shadow:0_0_6px_rgba(0,255,200,0.55),0_0_14px_rgba(0,255,200,0.3)]';
  const setupShown =
    dockMeta.setupQualityLabel === 'Developing'
      ? 'Building'
      : setupBandDockCompactLabel(dockMeta.setupQualityLabel);
  return (
    <div
      className="grid w-full max-w-[7.4rem] shrink grid-cols-[minmax(0,1fr)_minmax(0,1fr)] grid-rows-2 overflow-hidden rounded-[5px] border border-white/[0.14] text-[7px] font-medium tabular-nums text-sigflo-muted/90 sm:max-w-[8rem] sm:text-[8px]"
      title={`Trade score ${dockMeta.confidenceLabel} (readiness). Setup tier ${dockMeta.setupQualityLabel} (signal structure).`}
    >
      <span className="flex min-h-[1.15rem] min-w-0 items-center justify-center border-r border-b border-white/[0.1] px-0.5 py-px leading-none text-sigflo-muted/90 sm:min-h-[1.25rem] sm:px-0.5">
        Trade
      </span>
      <span className="flex min-h-[1.15rem] min-w-0 items-center justify-center border-b border-white/[0.1] px-0.5 py-px leading-none text-sigflo-muted/90 sm:min-h-[1.25rem] sm:px-0.5">
        Setup
      </span>
      <span
        className={`flex min-h-[1.15rem] min-w-0 items-center justify-center border-r border-white/[0.1] px-0.5 py-px text-center leading-none tabular-nums sm:min-h-[1.25rem] ${setupBandDockEmphasisClass(dockMeta.setupQualityLabel)}`}
      >
        <span className="min-w-0 max-w-full truncate">{setupShown}</span>
      </span>
      <span
        className={`flex min-h-[1.15rem] min-w-0 items-center justify-center px-0.5 py-px leading-none tabular-nums sm:min-h-[1.25rem] ${dockTealGlow}`}
      >
        <span className="min-w-0 max-w-full truncate">{dockMeta.confidenceLabel}</span>
      </span>
    </div>
  );
}

function dockTradeSetupDerived(dockMeta: ChartDockDecisionMeta) {
  const dockTealGlow =
    'font-semibold text-cyan-200/95 [text-shadow:0_0_6px_rgba(0,255,200,0.55),0_0_14px_rgba(0,255,200,0.3)]';
  const setupShown =
    dockMeta.setupQualityLabel === 'Developing'
      ? 'Building'
      : setupBandDockCompactLabel(dockMeta.setupQualityLabel);
  return { dockTealGlow, setupShown };
}

/** Compact Trade | Setup score pair (e.g. chart dock header between timing chip and partial). */
export function ChartDockTradeSetupPair({
  dockMeta,
  compact = false,
  /** When true with `compact`, use a narrower max width so a long timing chip (e.g. Developing) fits on one row. */
  reserveSpaceForLongTiming = false,
  className = '',
}: {
  dockMeta: ChartDockDecisionMeta;
  compact?: boolean;
  reserveSpaceForLongTiming?: boolean;
  className?: string;
}) {
  const { dockTealGlow, setupShown } = dockTradeSetupDerived(dockMeta);
  const h = compact ? 'min-h-[26px] sm:min-h-[28px]' : 'min-h-[34px] sm:min-h-[36px]';
  const labelCls = compact
    ? 'text-[4px] font-extrabold uppercase tracking-[0.1em] text-sigflo-muted/90 sm:text-[5px]'
    : 'text-[5px] font-extrabold uppercase tracking-[0.12em] text-sigflo-muted/90 sm:text-[6px]';
  const valCls = compact
    ? 'min-w-0 truncate text-center text-[7px] tabular-nums leading-tight sm:text-[8px]'
    : 'min-w-0 truncate text-center text-[8px] tabular-nums leading-tight sm:text-[9px]';
  const compactMax =
    compact && reserveSpaceForLongTiming
      ? 'max-w-[4.35rem] sm:max-w-[4.65rem]'
      : compact
        ? 'max-w-[5.1rem] sm:max-w-[5.4rem]'
        : 'w-full max-w-none';

  return (
    <div
      className={`grid shrink-0 grid-cols-2 gap-px overflow-hidden rounded-md border border-white/[0.12] bg-black/30 transition-[max-width] duration-200 ease-out ${compactMax} ${className}`}
      title={`Trade score ${dockMeta.confidenceLabel} (readiness). Setup tier ${dockMeta.setupQualityLabel} (signal structure).`}
    >
      <div
        className={`flex min-w-0 flex-col justify-center border-r border-white/[0.08] bg-black/20 px-0.5 py-px ${h}`}
      >
        <span className={labelCls}>Trade</span>
        <span className={`${valCls} ${dockTealGlow}`}>{dockMeta.confidenceLabel}</span>
      </div>
      <div className={`flex min-w-0 flex-col justify-center bg-black/20 px-0.5 py-px ${h}`}>
        <span className={labelCls}>Setup</span>
        <span className={`${valCls} ${setupBandDockEmphasisClass(dockMeta.setupQualityLabel)}`}>
          {setupShown}
        </span>
      </div>
    </div>
  );
}

/** Dock row: Close position | Close all (live position). Trade/setup scores live in the chart header row. */
export function ChartDockCloseRow({
  disabled = false,
  partialClosePct,
  onClosePosition,
  onCloseAll,
}: {
  disabled?: boolean;
  partialClosePct: number;
  onClosePosition: () => void;
  onCloseAll: () => void;
}) {
  const closePrimaryBtnClass =
    'flex min-h-[34px] min-w-0 items-center justify-center rounded-lg bg-gradient-to-b from-rose-500/95 to-rose-600/95 px-1 text-center text-[9px] font-bold leading-tight text-white shadow-[0_0_14px_-6px_rgba(248,113,113,0.45)] ring-1 ring-rose-300/20 transition hover:from-rose-400/95 hover:to-rose-500/95 hover:ring-rose-200/45 hover:shadow-[0_0_20px_-6px_rgba(248,113,113,0.62)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-[36px] sm:px-1.5 sm:text-[10px]';
  const closeAllBtnClass =
    'flex min-h-[34px] min-w-0 items-center justify-center rounded-lg border border-rose-500/40 bg-rose-950/40 px-1 text-[8px] font-bold uppercase tracking-wide text-rose-100/90 transition hover:bg-rose-950/55 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-[36px] sm:text-[10px]';

  return (
    <div className="grid w-full min-w-0 grid-cols-2 gap-1" role="group" aria-label="Close position actions">
      <button
        type="button"
        disabled={disabled}
        onClick={onClosePosition}
        aria-label={
          partialClosePct >= 100
            ? 'Close full position'
            : `Close position: submit ${partialClosePct} percent scale-out`
        }
        className={closePrimaryBtnClass}
      >
        Close position
      </button>
      <button type="button" disabled={disabled} onClick={onCloseAll} className={closeAllBtnClass}>
        Close all
      </button>
    </div>
  );
}

/**
 * Flat-account dock: **Short | Long** (or Sell/Buy) as two equal columns so both actions use the
 * full chart-dock row width (in-position row above stays three-column: manage | adjust | reverse).
 */
export function DockSplitEntryButtons({
  market,
  canExecute,
  onOpenShort,
  onOpenLong,
  flashSide,
  signalBias = null,
}: ChartTradeQuickActions & { signalBias?: 'long' | 'short' | null }) {
  const isSpot = market === 'spot';
  const shortLabel = isSpot ? 'Sell' : 'Short';
  const longLabel = isSpot ? 'Buy' : 'Long';
  const disabledHint = !canExecute ? 'Set a position size and ensure balance is available' : undefined;

  const btnRow =
    'flex min-h-[28px] min-w-0 w-full items-center justify-center rounded-lg px-2 text-[9px] font-bold uppercase tracking-[0.08em] transition enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-[30px] sm:px-3 sm:text-[10px]';

  const shortDim = signalBias === 'long' ? 'opacity-[0.72] brightness-[0.92] saturate-[0.92]' : '';
  const longDim = signalBias === 'short' ? 'opacity-[0.72] brightness-[0.92] saturate-[0.92]' : '';
  const shortGlow =
    signalBias === 'short'
      ? 'shadow-[0_0_22px_-4px_rgba(248,113,113,0.55)] ring-1 ring-rose-200/45'
      : flashSide === 'short'
        ? 'ring-1 ring-red-200/80'
        : 'ring-1 ring-rose-400/25';
  const longGlow =
    signalBias === 'long'
      ? 'shadow-[0_0_22px_-4px_rgba(52,211,153,0.5)] ring-1 ring-emerald-200/50'
      : flashSide === 'long'
        ? 'ring-1 ring-emerald-200/80'
        : 'ring-1 ring-emerald-400/25';

  const shortBtn = `bg-gradient-to-b from-rose-500/95 to-rose-600 text-white shadow-[0_0_14px_-5px_rgba(239,68,68,0.45)] enabled:hover:brightness-110 ${btnRow} ${shortDim} ${shortGlow}`;
  const longBtn = `bg-gradient-to-b from-emerald-500/95 to-emerald-600 text-white shadow-[0_0_14px_-5px_rgba(34,197,94,0.4)] enabled:hover:brightness-110 ${btnRow} ${longDim} ${longGlow}`;

  return (
    <div className="grid min-w-0 w-full grid-cols-2 gap-1.5 sm:gap-2" role="group" aria-label="Open trade">
      <button
        type="button"
        disabled={!canExecute}
        title={disabledHint}
        onClick={withSideEntrySound(onOpenShort)}
        className={shortBtn}
      >
        {shortLabel}
      </button>
      <button
        type="button"
        disabled={!canExecute}
        title={disabledHint}
        onClick={withSideEntrySound(onOpenLong)}
        className={longBtn}
      >
        {longLabel}
      </button>
    </div>
  );
}

type ChartInlineTradeButtonsProps = ChartTradeQuickActions & {
  /** Tighter pills for the sticky price-chart dock row. */
  variant?: 'default' | 'dock';
  /** Signal bias: emphasized side gets a subtle glow; the other is slightly dimmed. */
  signalBias?: 'long' | 'short' | null;
  /** Micro copy under dock buttons (confidence, setup quality, timing chip). */
  dockMeta?: ChartDockDecisionMeta | null;
  /**
   * When true, timing + Trade/Setup scores are not rendered in this row (parent shows them in the Price Chart
   * strip). Only Sell/Buy (or Short/Long) buttons render here — same dock shape for futures + spot.
   */
  omitDockTimingChip?: boolean;
};

/** Compact Short/Long (or Sell/Buy) — e.g. price-chart dock or assistant row. */
export function ChartInlineTradeButtons({
  market,
  canExecute,
  onOpenShort,
  onOpenLong,
  flashSide,
  variant = 'default',
  signalBias = null,
  dockMeta = null,
  omitDockTimingChip = false,
}: ChartInlineTradeButtonsProps) {
  const isSpot = market === 'spot';
  const shortLabel = isSpot ? 'Sell' : 'Short';
  const longLabel = isSpot ? 'Buy' : 'Long';
  const disabledHint = !canExecute ? 'Set a position size and ensure balance is available' : undefined;
  const btnBase =
    variant === 'dock'
      ? 'inline-flex h-[31px] min-w-[3.42rem] items-center justify-center rounded-[7px] px-[10px] py-0 text-[12px] font-bold leading-none sm:h-[34px] sm:min-w-[3.72rem] sm:px-[11px] sm:text-[13px]'
      : 'px-2 py-1 text-[10px] rounded-md';

  const shortDim =
    variant === 'dock' && signalBias === 'long' ? 'opacity-[0.72] brightness-[0.92] saturate-[0.92]' : '';
  const longDim =
    variant === 'dock' && signalBias === 'short' ? 'opacity-[0.72] brightness-[0.92] saturate-[0.92]' : '';
  const shortGlow =
    variant === 'dock' && signalBias === 'short'
      ? 'shadow-[0_0_22px_-4px_rgba(248,113,113,0.55)] ring-1 ring-rose-200/45'
      : flashSide === 'short'
        ? 'ring-1 ring-red-200/80'
        : 'ring-1 ring-rose-400/25';
  const longGlow =
    variant === 'dock' && signalBias === 'long'
      ? 'shadow-[0_0_22px_-4px_rgba(52,211,153,0.5)] ring-1 ring-emerald-200/50'
      : flashSide === 'long'
        ? 'ring-1 ring-emerald-200/80'
        : 'ring-1 ring-emerald-400/25';

  const buttons = (
    <div
      className={`flex shrink-0 items-center ${variant === 'dock' ? 'gap-[5px]' : 'gap-px sm:gap-0.5'}`}
      role="group"
      aria-label="Open trade"
    >
      <button
        type="button"
        disabled={!canExecute}
        title={disabledHint}
        onClick={withSideEntrySound(onOpenShort)}
        className={`bg-gradient-to-b from-rose-500/95 to-rose-600 font-bold uppercase leading-tight tracking-wide text-white shadow-[0_0_14px_-5px_rgba(239,68,68,0.45)] transition duration-200 ease-out enabled:active:scale-[0.98] enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 ${variant === 'dock' ? '' : 'shrink-0'} ${btnBase} ${shortDim} ${shortGlow}`}
      >
        {shortLabel}
      </button>
      <button
        type="button"
        disabled={!canExecute}
        title={disabledHint}
        onClick={withSideEntrySound(onOpenLong)}
        className={`bg-gradient-to-b from-emerald-500/95 to-emerald-600 font-bold uppercase leading-tight tracking-wide text-white shadow-[0_0_14px_-5px_rgba(34,197,94,0.4)] transition duration-200 ease-out enabled:active:scale-[0.98] enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 ${variant === 'dock' ? '' : 'shrink-0'} ${btnBase} ${longDim} ${longGlow}`}
      >
        {longLabel}
      </button>
    </div>
  );

  if (variant === 'dock' && dockMeta && !omitDockTimingChip) {
    // Always show setup timing in dock (Building uses chip state `developing` for visuals — still user-facing).
    const showTimingHere = true;
    return (
      <div
        className={`grid w-full min-w-0 items-center gap-x-1 sm:gap-x-1.5 ${
          showTimingHere ? 'grid-cols-[max-content_minmax(0,auto)_minmax(0,1fr)]' : 'grid-cols-[max-content_minmax(0,auto)]'
        }`}
      >
        <div className="w-max max-w-none justify-self-start self-center">{buttons}</div>
        <div className="min-w-0 max-w-full justify-self-start self-center">
          <ChartDockScoreGrid dockMeta={dockMeta} />
        </div>
        {showTimingHere ? (
          <div className="flex min-w-0 items-center justify-end justify-self-end self-center pl-1 sm:pl-2">
            <StatusChip label={dockMeta.timing.label} state={dockMeta.timing.state} compact />
          </div>
        ) : null}
      </div>
    );
  }

  return buttons;
}

export function TradeActionBar(props: {
  market: MarketMode;
  canExecute: boolean;
  onOpenShort: () => void;
  onOpenLong: () => void;
  /** Brief glow after tap (instant execution feedback). */
  flashSide?: 'long' | 'short' | null;
  className?: string;
  /** Card-style block inside scroll content (vs full-width dock chrome). */
  embedded?: boolean;
}) {
  const { market, canExecute, onOpenShort, onOpenLong, flashSide, className = '', embedded = false } = props;

  const isSpot = market === 'spot';
  const primaryShort = isSpot ? 'Sell' : 'Open Short';
  const primaryLong = isSpot ? 'Buy' : 'Open Long';
  const disabledHint = !canExecute ? 'Set a position size and ensure balance is available' : undefined;

  return (
    <div
      className={`pointer-events-auto px-3 ${
        embedded
          ? 'rounded-2xl border border-white/[0.1] bg-black/35 py-3 shadow-[0_12px_40px_-28px_rgba(0,0,0,0.85)] backdrop-blur-sm'
          : 'bg-black/75 pt-3 backdrop-blur-xl'
      } ${className}`}
    >
      <div className="mx-auto max-w-lg space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={!canExecute}
            title={disabledHint}
            onClick={withSideEntrySound(onOpenShort)}
            className={`flex min-h-[3.5rem] flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-rose-500 to-rose-600 px-2 py-2 text-[15px] font-bold text-white shadow-[0_10px_32px_-10px_rgba(239,68,68,0.55)] transition enabled:active:scale-[0.98] enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 ${
              flashSide === 'short' ? 'ring-2 ring-red-200/90 shadow-[0_0_28px_-4px_rgba(248,113,113,0.55)]' : ''
            }`}
          >
            <span className="inline-flex items-center gap-1">
              <span aria-hidden>↓</span>
              {primaryShort}
            </span>
            <span className="mt-0.5 text-[10px] font-semibold text-white/85">Market · Instant</span>
          </button>
          <button
            type="button"
            disabled={!canExecute}
            title={disabledHint}
            onClick={withSideEntrySound(onOpenLong)}
            className={`flex min-h-[3.5rem] flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-emerald-500 to-emerald-600 px-2 py-2 text-[15px] font-bold text-white shadow-[0_10px_32px_-10px_rgba(34,197,94,0.5)] transition enabled:active:scale-[0.98] enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 ${
              flashSide === 'long' ? 'ring-2 ring-emerald-200/90 shadow-[0_0_28px_-4px_rgba(0,255,200,0.45)]' : ''
            }`}
          >
            <span className="inline-flex items-center gap-1">
              <span aria-hidden>↑</span>
              {primaryLong}
            </span>
            <span className="mt-0.5 text-[10px] font-semibold text-white/85">Market · Instant</span>
          </button>
        </div>
      </div>
      <p
        className={`mx-auto mt-2 flex max-w-lg items-center justify-center gap-1.5 text-[10px] text-sigflo-muted ${
          embedded ? 'pb-0' : 'pb-[max(0.5rem,env(safe-area-inset-bottom))]'
        }`}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="shrink-0 text-emerald-400/80" aria-hidden>
          <path
            d="M12 3l7 4v5c0 5-3 9-7 10-4-1-7-5-7-10V7l7-4z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
        Trades execute instantly — plan size and risk before you tap.
      </p>
    </div>
  );
}
