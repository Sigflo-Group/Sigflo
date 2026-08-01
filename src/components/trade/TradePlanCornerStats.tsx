import type { CSSProperties } from 'react';
import { pctToLevel } from '@/lib/tradePlanOverlayGeometry';

function fmtPct(n: number) {
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

export function TradePlanCornerStats({
  entry,
  stop,
  target,
  lastPrice,
  riskReward,
  className = '',
  style,
}: {
  entry: number;
  stop: number;
  target: number;
  lastPrice: number;
  riskReward: number;
  className?: string;
  style?: CSSProperties;
}) {
  const refPx = Math.abs(entry) > 0 ? Math.abs(entry) : 1;
  // Measured from entry (not lastPrice) so these percentages describe the same fixed plan as
  // riskReward below — their ratio is R:R by construction. Mixing an entry-anchored R:R with
  // lastPrice-anchored Stop/Tgt percentages made the two lines contradict each other as soon as
  // price moved away from entry (e.g. "Stop -0.33% / Tgt +48.27%" next to "R:R 242:1").
  const pctStop = pctToLevel(entry, stop, refPx);
  const pctTarget = pctToLevel(entry, target, refPx);
  const rr = Number.isFinite(riskReward) && riskReward > 0 ? riskReward : null;
  void lastPrice;

  return (
    <div
      className={`rounded-lg border border-white/[0.1] bg-[#0c0c0f] py-1 pl-[18px] pr-2 text-[8px] font-semibold leading-snug text-sigflo-muted shadow-lg ${className}`}
      style={style}
      aria-hidden
    >
      <div className="tabular-nums text-white/90">
        <span className="text-rose-200/90">Stop</span> {fmtPct(pctStop)}
        <span className="mx-1 text-white/25">·</span>
        <span className="text-emerald-200/90">Tgt</span> {fmtPct(pctTarget)}
      </div>
      {rr != null ? (
        <div className="mt-0.5 text-[7px] font-bold uppercase tracking-wide text-cyan-200/90">
          R:R {rr.toFixed(2)} : 1
        </div>
      ) : null}
    </div>
  );
}
