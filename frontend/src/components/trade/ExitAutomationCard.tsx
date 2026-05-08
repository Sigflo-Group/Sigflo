import { useMemo } from 'react';
import { formatQuoteNumber } from '@/lib/formatQuote';
import type { SigfloActivePosition } from '@/types/position';

type ExitAutomationCardProps = {
  position: SigfloActivePosition;
  liveMarkPrice?: number | null;
  onSuggestStopMove?: (suggestedStop: number | null) => void;
  onSuggestPartialTp?: () => void;
  onDisableAutomation?: () => void;
};

function computeSuggestedStop(position: SigfloActivePosition, mark: number): number | null {
  const entry = position.entryPrice;
  if (!(entry > 0) || !(mark > 0)) return null;
  const trailPct = 0.35;
  if (position.direction === 'long') {
    const floor = entry * (1 - trailPct / 100);
    const fromMark = mark * (1 - trailPct / 100);
    return Math.max(floor, fromMark, position.stopPrice ?? 0);
  }
  const cap = entry * (1 + trailPct / 100);
  const fromMark = mark * (1 + trailPct / 100);
  const cur = position.stopPrice;
  const next = Math.min(cap, fromMark, cur != null && cur > 0 ? cur : Infinity);
  return Number.isFinite(next) && next > 0 ? next : null;
}

function suggestedStopMoveLabel(position: SigfloActivePosition, mark: number): string {
  const next = computeSuggestedStop(position, mark);
  if (!(next != null && next > 0)) return '—';
  return position.direction === 'long'
    ? `Raise toward ${formatQuoteNumber(next)} (trail ~0.35%)`
    : `Tighten toward ${formatQuoteNumber(next)} (trail ~0.35%)`;
}

function partialTpSuggestion(position: SigfloActivePosition): string {
  const t1 = position.targets[0];
  if (t1 != null && Number.isFinite(t1) && t1 > 0) {
    return `Scale ~25% into T1 (${formatQuoteNumber(t1)}) — Suggestion only`;
  }
  return 'Scale ~25% at next resistance — Suggestion only';
}

function riskState(position: SigfloActivePosition, mark: number): string {
  const liq = position.liquidationPrice;
  if (liq == null || !(liq > 0) || !(mark > 0)) return 'Unknown (no liq)';
  const dist =
    position.direction === 'long'
      ? ((mark - liq) / mark) * 100
      : ((liq - mark) / mark) * 100;
  if (dist < 1.2) return 'Elevated — cushion thin';
  if (dist < 3) return 'Watch — room to breathe';
  return 'Comfortable vs. liq';
}

export function ExitAutomationCard({
  position,
  liveMarkPrice,
  onSuggestStopMove,
  onSuggestPartialTp,
  onDisableAutomation,
}: ExitAutomationCardProps) {
  const mark =
    liveMarkPrice != null && Number.isFinite(liveMarkPrice) && liveMarkPrice > 0
      ? liveMarkPrice
      : position.markPrice;

  const rows = useMemo(
    () => ({
      currentStop: position.stopPrice != null ? formatQuoteNumber(position.stopPrice) : 'None set',
      suggestedStop: suggestedStopMoveLabel(position, mark),
      partialTp: partialTpSuggestion(position),
      risk: riskState(position, mark),
    }),
    [mark, position],
  );
  const suggestedStop = useMemo(() => computeSuggestedStop(position, mark), [mark, position]);

  return (
    <div className="rounded-xl border border-cyan-500/20 bg-black/40 px-2 py-2 sm:px-2.5 sm:py-2.5">
      <h3 className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-cyan-100/95">Exit automation</h3>

      <div className="mt-2 space-y-1.5">
        <Row k="Current stop" v={rows.currentStop} />
        <Row k="Suggested stop move" v={rows.suggestedStop} />
        <Row k="Partial take-profit suggestion" v={rows.partialTp} />
        <Row k="Risk state" v={rows.risk} />
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <ActionBtn label="Suggest stop move" onClick={onSuggestStopMove ? () => onSuggestStopMove(suggestedStop) : undefined} />
        <ActionBtn label="Suggest partial take-profit" onClick={onSuggestPartialTp} />
        <ActionBtn label="Disable automation" onClick={onDisableAutomation} tone="muted" />
      </div>

      <p className="mt-2 text-center text-[8px] leading-snug text-zinc-500">
        Suggestion only · Live changes require confirmation
      </p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1.5">
      <p className="text-[7px] font-bold uppercase tracking-[0.1em] text-sigflo-muted">{k}</p>
      <p className="text-[10px] font-medium leading-snug text-zinc-200">{v}</p>
    </div>
  );
}

function ActionBtn({
  label,
  onClick,
  tone = 'default',
}: {
  label: string;
  onClick?: () => void;
  tone?: 'default' | 'muted';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`rounded-md border px-2 py-1 text-[8px] font-bold uppercase tracking-wide transition sm:text-[9px] ${
        tone === 'muted'
          ? 'border-white/12 bg-white/[0.04] text-zinc-400 hover:border-white/18 hover:text-zinc-200'
          : 'border-cyan-400/35 bg-cyan-500/[0.08] text-cyan-100/95 hover:bg-cyan-500/14'
      } disabled:cursor-not-allowed disabled:opacity-45`}
    >
      {label}
    </button>
  );
}
