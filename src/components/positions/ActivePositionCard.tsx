import { useEffect, useRef, type ReactNode } from 'react';
import { formatQuoteNumber, formatQuoteUsd } from '@/lib/formatQuote';
import type { SigfloActivePosition } from '@/types/position';

function formatDuration(openedAt: number, nowMs: number): string {
  const s = Math.max(0, Math.floor((nowMs - openedAt) / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

type ActivePositionCardProps = {
  position: SigfloActivePosition;
  /** Live mark (e.g. throttled last) overrides `position.markPrice` for display. */
  liveMarkPrice?: number | null;
  nowMs: number;
};

export function ActivePositionCard({ position, liveMarkPrice, nowMs }: ActivePositionCardProps) {
  const prevPnlRef = useRef<number | null>(null);
  const mark =
    liveMarkPrice != null && Number.isFinite(liveMarkPrice) && liveMarkPrice > 0
      ? liveMarkPrice
      : position.markPrice;
  const pnlUsd = position.unrealizedPnl;
  const pnlPct = position.unrealizedPnlPct;

  useEffect(() => {
    prevPnlRef.current = pnlUsd;
  }, [pnlUsd]);

  const prev = prevPnlRef.current;
  const tickUp = prev != null && pnlUsd > prev + 0.01;
  const tickDown = prev != null && pnlUsd < prev - 0.01;
  const pnlPositive = pnlUsd >= 0;
  const pnlClass = pnlPositive ? 'text-emerald-300' : 'text-rose-300';
  const glowClass = tickUp
    ? 'shadow-[0_0_18px_-6px_rgba(52,211,153,0.4)]'
    : tickDown
      ? 'shadow-[0_0_18px_-6px_rgba(248,113,113,0.35)]'
      : pnlPositive
        ? 'shadow-[0_0_14px_-8px_rgba(52,211,153,0.18)]'
        : 'shadow-[0_0_14px_-8px_rgba(248,113,113,0.16)]';

  const sourceLabel =
    position.source === 'bybit' ? 'Bybit' : position.source === 'demo' ? 'Demo' : 'Manual';

  return (
    <div
      className={`rounded-xl border border-[#00ffc8]/22 bg-gradient-to-br from-black/55 to-black/40 px-2 py-2 transition-shadow duration-300 sm:px-2.5 sm:py-2.5 ${glowClass}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-extrabold uppercase tracking-[0.12em] text-white/90">
            {position.pair}
          </p>
          <p className="mt-0.5 text-[9px] font-semibold text-sigflo-muted">
            <span className={position.direction === 'long' ? 'text-emerald-200/90' : 'text-rose-200/90'}>
              {position.direction.toUpperCase()}
            </span>
            <span className="mx-1.5 text-white/25">·</span>
            {formatDuration(position.openedAt, nowMs)} in trade
            <span className="mx-1.5 text-white/25">·</span>
            <span className="rounded border border-white/10 bg-white/[0.04] px-1 py-px font-mono text-[8px] uppercase tracking-wide text-zinc-300">
              {sourceLabel}
            </span>
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className={`font-mono text-[12px] font-bold tabular-nums sm:text-[13px] ${pnlClass}`}>
            {pnlUsd >= 0 ? '+' : ''}
            {formatQuoteUsd(pnlUsd)}
          </p>
          <p className={`font-mono text-[9px] tabular-nums ${pnlClass}`}>
            {pnlPct >= 0 ? '+' : ''}
            {pnlPct.toFixed(2)}% ROE
          </p>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-1 sm:grid-cols-3">
        <Cell label="Entry">{formatQuoteNumber(position.entryPrice)}</Cell>
        <Cell label="Mark">{formatQuoteNumber(mark)}</Cell>
        <Cell label="Size">{Math.abs(position.size).toFixed(4)}</Cell>
        <Cell label="Lev">{position.leverage}×</Cell>
        <Cell label="Margin">{position.marginMode}</Cell>
        <Cell label="Stop">{position.stopPrice != null ? formatQuoteNumber(position.stopPrice) : '—'}</Cell>
        <Cell label="Liq">{position.liquidationPrice != null ? formatQuoteNumber(position.liquidationPrice) : '—'}</Cell>
        <Cell label="Targets" className="sm:col-span-2">
          {position.targets.length
            ? position.targets.map((t) => formatQuoteNumber(t)).join(' · ')
            : '—'}
        </Cell>
      </div>
    </div>
  );
}

function Cell({
  label,
  children,
  className = '',
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0 rounded-md border border-white/[0.06] bg-black/35 px-1.5 py-1 ${className}`}>
      <p className="truncate text-[7px] font-bold uppercase tracking-[0.1em] text-sigflo-muted">{label}</p>
      <p className="mt-0.5 truncate font-mono text-[10px] font-semibold tabular-nums text-white/92 sm:text-[11px]">
        {children}
      </p>
    </div>
  );
}
