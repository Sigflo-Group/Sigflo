import { useEffect, useRef, type CSSProperties } from 'react';
import type { ExitAiMode } from '@/types/aiExitAutomation';
import type { ManageTradePositionContext } from '@/lib/manageTradeContext';
import type { PositionBiasStat } from '@/lib/positionBiasStat';
import type { PositionHealthResult, PositionHealthStatus } from '@/lib/positionHealth';
import type { ExitAiCoPilotModel } from '@/lib/exitAiCoPilot';
import { ExitAiCoPilotBlock } from '@/components/trade/exit/ExitAiCoPilotBlock';
import { TriggeredStatusBadge } from '@/components/ui/TriggeredStatusBadge';
import { formatQuoteNumber } from '@/lib/formatQuote';
import { formatSignedPercent, formatSignedUsd } from '@/lib/signedPnl';
import type { TradeSide } from '@/types/trade';
import { playAlertSound } from '@/utils/sound';

function sizeSummary(ctx: ManageTradePositionContext): string {
  const base = ctx.pair.includes('/') ? ctx.pair.split('/')[0].trim() : ctx.pair;
  if (ctx.posSize != null && Number.isFinite(ctx.posSize)) {
    return `${formatQuoteNumber(Math.abs(ctx.posSize))} ${base}`;
  }
  return `≈ $${Math.round(ctx.positionUsd).toLocaleString('en-US')} notional`;
}

function healthStyles(status: PositionHealthResult['status'], label?: string): string {
  const normalizedStatus = String(status ?? '').trim().toLowerCase();
  const normalizedLabel = String(label ?? '').trim().toLowerCase();
  const key =
    normalizedStatus ||
    (normalizedLabel.includes('near invalidation')
      ? 'near_invalidation'
      : normalizedLabel.includes('losing momentum')
        ? 'losing_momentum'
        : normalizedLabel.includes('risk')
          ? 'at_risk'
          : 'healthy');

  switch (key) {
    case 'healthy':
      return 'border-emerald-300/50 ring-1 ring-emerald-200/20 text-emerald-50';
    case 'at_risk':
      return 'border-amber-200/60 ring-1 ring-amber-100/30 text-amber-50';
    case 'losing_momentum':
      return 'border-orange-200/65 ring-1 ring-orange-100/25 text-orange-50';
    case 'near_invalidation':
      return 'border-rose-200/70 ring-1 ring-rose-100/30 text-rose-50';
    default:
      return 'border-white/[0.08] bg-black/25 text-landing-text';
  }
}

function healthSurfaceStyle(status: PositionHealthResult['status'], label?: string): CSSProperties {
  const normalizedStatus = String(status ?? '').trim().toLowerCase();
  const normalizedLabel = String(label ?? '').trim().toLowerCase();
  const key =
    normalizedStatus ||
    (normalizedLabel.includes('near invalidation')
      ? 'near_invalidation'
      : normalizedLabel.includes('losing momentum')
        ? 'losing_momentum'
        : normalizedLabel.includes('risk')
          ? 'at_risk'
          : 'healthy');
  switch (key) {
    case 'healthy':
      return { backgroundColor: 'rgba(16, 185, 129, 0.24)' };
    case 'at_risk':
      return { backgroundColor: 'rgba(245, 158, 11, 0.28)' };
    case 'losing_momentum':
      return { backgroundColor: 'rgba(249, 115, 22, 0.30)' };
    case 'near_invalidation':
      return { backgroundColor: 'rgba(244, 63, 94, 0.36)' };
    default:
      return {};
  }
}

export type ManagePositionControlPanelProps = {
  manageCtx: ManageTradePositionContext;
  pnlUsd: number;
  pnlPct: number;
  mark: number;
  leverageLabel: string;
  isFutures: boolean;
  /** When set (e.g. live Bybit leg), Long/Short chip follows the exchange instead of URL `manageCtx.side`. */
  exchangeLegSide?: TradeSide | null;
  health: PositionHealthResult;
  /** Open leg vs scanner bias for the same pair; omit to hide the row. */
  positionBias?: PositionBiasStat | null;
  exitAiModel: ExitAiCoPilotModel;
  exitMode: ExitAiMode;
  onExitModeChange: (mode: ExitAiMode) => void;
  onCloseFull: () => void;
  onPartialOpen: () => void;
  onMoveStopBreakeven: () => void;
  onTightenStop: () => void;
  onAddToPosition: () => void;
  onReversePosition?: () => void;
  onAdjustRisk?: () => void;
  /** Zoom chart to entry / stop / target (same Trade screen). */
  onViewSetupOnChart?: () => void;
  timeline: string[];
  actionsDisabled: boolean;
  canMoveStops: boolean;
  triggeredPairCount: number;
};

export function ManagePositionControlPanel({
  manageCtx,
  pnlUsd,
  pnlPct,
  mark,
  leverageLabel,
  isFutures,
  exchangeLegSide,
  health,
  positionBias,
  exitAiModel,
  exitMode,
  onExitModeChange,
  onCloseFull,
  onPartialOpen,
  onMoveStopBreakeven,
  onTightenStop,
  onAddToPosition,
  onReversePosition,
  onAdjustRisk,
  onViewSetupOnChart,
  timeline,
  actionsDisabled,
  canMoveStops,
  triggeredPairCount,
}: ManagePositionControlPanelProps) {
  const chipSide: TradeSide =
    isFutures && (exchangeLegSide === 'long' || exchangeLegSide === 'short') ? exchangeLegSide : manageCtx.side;
  const winning = pnlUsd >= 0;
  const staticActive = exitMode === 'manual';
  const aiActive = exitMode !== 'manual';

  const prevHealthStatusRef = useRef<PositionHealthStatus | null>(null);
  useEffect(() => {
    const s = health.status;
    const prev = prevHealthStatusRef.current;
    prevHealthStatusRef.current = s;
    if (prev == null) return;
    if (prev === 'healthy' && s !== 'healthy') {
      playAlertSound();
    }
  }, [health.status]);

  return (
    <div
      className={`mx-auto w-full max-w-lg space-y-3 px-3 pt-2 ${
        winning
          ? 'shadow-[0_0_48px_-28px_rgba(0,200,120,0.35)]'
          : 'shadow-[0_0_40px_-24px_rgba(248,113,113,0.22)]'
      }`}
    >
      <section
        className={`rounded-2xl border px-3 py-3 ${
          winning
            ? 'border-landing-accent/20 bg-landing-surface sigflo-panel-texture'
            : 'border-rose-400/25 bg-[#1a0c10]'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-landing-muted">Live PnL</p>
            <p
              className={`mt-0.5 font-mono text-3xl font-bold tabular-nums tracking-tight ${
                winning ? 'text-emerald-300' : 'text-rose-300'
              }`}
            >
              {formatSignedUsd(pnlUsd)}
            </p>
            <p className={`mt-0.5 font-mono text-lg font-semibold tabular-nums ${winning ? 'text-emerald-200/90' : 'text-rose-200/90'}`}>
              {formatSignedPercent(pnlPct, 2)}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
              chipSide === 'long'
                ? 'border-landing-accent/40 bg-landing-accent-dim text-landing-accent-hi'
                : 'border-rose-400/35 bg-rose-500/15 text-rose-100'
            }`}
          >
            {chipSide === 'long' ? 'Long' : 'Short'}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/[0.06] pt-3 text-[11px]">
          <span className="font-semibold text-landing-text">{manageCtx.pair}</span>
          <span className="text-landing-muted">·</span>
          <span className="text-landing-muted">Size</span>
          <span className="font-medium text-landing-text">{sizeSummary(manageCtx)}</span>
          <span className="text-landing-muted">·</span>
          <span className="text-landing-muted">Lev</span>
          <span className="font-mono font-semibold text-landing-text">{leverageLabel}</span>
        </div>
        <div className="mt-2">
          <TriggeredStatusBadge count={triggeredPairCount} className="text-[9px]" />
        </div>
        <dl className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <dt className="text-landing-muted">Entry</dt>
            <dd className="mt-0.5 font-mono font-semibold text-landing-text">${formatQuoteNumber(manageCtx.entryPrice)}</dd>
          </div>
          <div>
            <dt className="text-landing-muted">Mark</dt>
            <dd className="mt-0.5 font-mono font-semibold text-landing-text">${formatQuoteNumber(mark)}</dd>
          </div>
        </dl>
      </section>

      <section
        className={`rounded-2xl border px-3 py-2.5 ${healthStyles(health.status, health.label)}`}
        style={healthSurfaceStyle(health.status, health.label)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] opacity-80">Position health</p>
            <p className="mt-1 text-sm font-bold">{health.label}</p>
          </div>
          {positionBias ? (
            <div className="min-w-0 shrink-0 border-l border-white/[0.14] pl-2.5 sm:pl-3">
              <div className="ml-auto w-fit max-w-[min(100%,15rem)] rounded-lg border border-white/[0.1] bg-black/25 px-2 py-1.5 text-right">
                <div className="flex items-baseline justify-end gap-1.5">
                  <span className="shrink-0 text-[9px] font-bold uppercase tracking-[0.16em] opacity-75">Bias</span>
                  <p
                    className={`min-w-0 text-sm font-bold leading-none ${
                      positionBias.variant === 'aligned'
                        ? 'text-emerald-100'
                        : positionBias.variant === 'counter'
                          ? 'text-amber-100'
                          : 'text-white/80'
                    }`}
                  >
                    {positionBias.title}
                  </p>
                </div>
                <p className="mt-1 text-[11px] leading-snug opacity-90">{positionBias.subtitle}</p>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section>
        <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-landing-muted">Quick actions</p>
        <div className="grid grid-cols-2 gap-2">
          {onAdjustRisk ? (
            <button
              type="button"
              disabled={actionsDisabled}
              onClick={onAdjustRisk}
              className="min-h-[44px] rounded-xl border border-landing-accent/35 bg-landing-accent-dim/40 px-3 py-3 text-sm font-bold leading-tight text-landing-accent-hi transition hover:border-landing-accent/50 active:scale-[0.99] disabled:opacity-45 sm:min-h-[40px] sm:py-2.5 sm:text-[11px]"
            >
              Adjust risk
            </button>
          ) : null}
          <button
            type="button"
            disabled={actionsDisabled}
            onClick={onCloseFull}
            className="min-h-[44px] rounded-xl border border-rose-400/35 bg-rose-500/15 px-3 py-3 text-sm font-bold leading-tight text-rose-100 transition hover:border-rose-300/65 hover:bg-rose-500/28 hover:text-rose-50 active:scale-[0.99] disabled:opacity-45 sm:min-h-[40px] sm:py-2.5 sm:text-[11px]"
          >
            Close position
          </button>
          <button
            type="button"
            disabled={actionsDisabled}
            onClick={onPartialOpen}
            className="min-h-[44px] rounded-xl border border-white/[0.1] bg-landing-surface landing-panel-texture px-3 py-3 text-sm font-bold leading-tight text-landing-text transition hover:border-landing-accent/30 active:scale-[0.99] disabled:opacity-45 sm:min-h-[40px] sm:py-2.5 sm:text-[11px]"
          >
            Partial close
          </button>
          <button
            type="button"
            disabled={actionsDisabled || !canMoveStops || !isFutures}
            onClick={onMoveStopBreakeven}
            className="min-h-[44px] rounded-xl border border-white/[0.1] bg-landing-surface landing-panel-texture px-3 py-3 text-sm font-bold leading-tight text-landing-text transition hover:border-landing-accent/30 active:scale-[0.99] disabled:opacity-45 sm:min-h-[40px] sm:py-2.5 sm:text-[11px]"
          >
            Stop → breakeven
          </button>
          <button
            type="button"
            disabled={actionsDisabled || !canMoveStops || !isFutures}
            onClick={onTightenStop}
            className="min-h-[44px] rounded-xl border border-white/[0.1] bg-landing-surface landing-panel-texture px-3 py-3 text-sm font-bold leading-tight text-landing-text transition hover:border-landing-accent/30 active:scale-[0.99] disabled:opacity-45 sm:min-h-[40px] sm:py-2.5 sm:text-[11px]"
          >
            Tighten stop
          </button>
          {onReversePosition ? (
            <button
              type="button"
              disabled={actionsDisabled || !isFutures}
              onClick={onReversePosition}
              className="min-h-[44px] rounded-xl border border-amber-300/35 bg-amber-500/12 px-3 py-3 text-sm font-bold leading-tight text-amber-100 transition hover:border-amber-200/65 hover:bg-amber-500/24 hover:text-amber-50 active:scale-[0.99] disabled:opacity-45 sm:min-h-[40px] sm:py-2.5 sm:text-[11px]"
            >
              Reverse position
            </button>
          ) : null}
          <button
            type="button"
            disabled={actionsDisabled}
            onClick={onAddToPosition}
            className="min-h-[46px] rounded-xl bg-landing-accent px-3 py-3.5 text-[15px] font-bold leading-tight text-landing-bg shadow-landing-glow-sm transition hover:brightness-110 active:scale-[0.99] disabled:opacity-45 sm:min-h-[42px] sm:py-3 sm:text-sm"
          >
            Add to position
          </button>
        </div>
      </section>

      <ExitAiCoPilotBlock
        model={exitAiModel}
        exitMode={exitMode}
        onExitModeChange={onExitModeChange}
        onCloseNow={onCloseFull}
        actionsDisabled={actionsDisabled}
      />

      <section className="rounded-2xl border border-landing-border bg-black/25 px-3 py-2.5">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-landing-muted">Exit mode</p>
        <div className="mt-2 flex rounded-xl border border-white/[0.08] bg-landing-bg/80 p-0.5">
          <button
            type="button"
            disabled={actionsDisabled}
            onClick={() => onExitModeChange('manual')}
            className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition sm:py-2 sm:text-[11px] ${
              staticActive ? 'bg-landing-accent-dim text-landing-accent-hi' : 'text-landing-muted'
            }`}
          >
            Static SL/TP
          </button>
          <button
            type="button"
            disabled={actionsDisabled}
            onClick={() => onExitModeChange('assisted')}
            className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition sm:py-2 sm:text-[11px] ${
              aiActive ? 'bg-landing-accent-dim text-landing-accent-hi' : 'text-landing-muted'
            }`}
          >
            AI exit
          </button>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-landing-muted">
          {staticActive
            ? 'Chart shows your planned stop and target; updates sync to the exchange when you apply TP/SL.'
            : 'AI exit uses assisted automation — trims and exits follow your safeguards. Target on chart is a reference, not a fixed take-profit.'}
        </p>
        {onViewSetupOnChart ? (
          <button
            type="button"
            disabled={actionsDisabled}
            onClick={onViewSetupOnChart}
            className="mt-2 min-h-[40px] w-full rounded-lg border border-cyan-400/25 bg-cyan-500/[0.08] px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] leading-tight text-cyan-100/95 transition hover:border-cyan-400/40 hover:bg-cyan-500/14 active:scale-[0.99] disabled:opacity-45 sm:min-h-[36px] sm:py-2 sm:text-[10px]"
          >
            View on chart
          </button>
        ) : null}
      </section>

      {timeline.length > 0 ? (
        <section className="rounded-2xl border border-white/[0.06] bg-black/20 px-3 py-2">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-landing-muted">Exit timeline</p>
          <ul className="mt-2 space-y-1.5">
            {timeline.map((line) => (
              <li key={line} className="text-[11px] leading-snug text-landing-text/90 before:mr-1.5 before:text-landing-accent-hi before:content-['·']">
                {line}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
