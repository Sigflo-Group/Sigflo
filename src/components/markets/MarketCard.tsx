import { useEffect, useRef, useState } from 'react';
import { formatQuoteNumber } from '@/lib/formatQuote';
import { useTriggeredMotion } from '@/hooks/useTriggeredMotion';
import { marketStatusLabel, uiSignalStateClasses, uiSignalStateFromMarketStatus } from '@/lib/signalState';
import { TriggeredFireMark } from '@/components/ui/TriggeredFireMark';
import type { Candle } from '@/types/market';
import type { MarketScannerRow } from '@/types/markets';

function buildMiniSeries(row: MarketScannerRow): number[] {
  const len = 20;
  const trendBias = (row.signal.scoreBreakdown.trendAlignment - 12) / 22;
  const momentumBias = (row.signal.scoreBreakdown.momentumQuality - 10) / 18;
  const setupBias = (row.setupScore - 60) / 120;
  const change24hPct = Number.isFinite(row.change24hPct) ? row.change24hPct : 0;
  const dailyBias = Math.max(-0.04, Math.min(0.04, change24hPct / 250));
  const sideBias = row.signal.side === 'long' ? 0.02 : -0.02;
  const slope = trendBias * 0.35 + momentumBias * 0.25 + setupBias * 0.25 + dailyBias * 0.15 + sideBias;
  const out: number[] = [];
  for (let i = 0; i < len; i += 1) {
    const t = i / (len - 1);
    const wobble = Math.sin((i + row.symbol.length) * 0.7) * 0.06 + Math.cos((i + row.setupScore) * 0.33) * 0.04;
    const v = 0.5 + slope * (t - 0.5) + wobble;
    out.push(Math.max(0.1, Math.min(0.9, v)));
  }
  return out;
}

function seriesFromCandles(candles: Candle[], livePrice?: number): number[] {
  if (candles.length === 0) return [];
  const closes = candles.map((c) => c.close);
  // Blend live ticker into the latest point so mini charts move between candle closes.
  if (livePrice != null && Number.isFinite(livePrice) && closes.length > 0) {
    closes[closes.length - 1] = livePrice;
  }
  const finiteCloses = closes.filter(Number.isFinite);
  if (finiteCloses.length === 0) return [];
  const min = Math.min(...finiteCloses);
  const max = Math.max(...finiteCloses);
  const span = Math.max(0.000001, max - min);
  return closes.map((v) =>
    Number.isFinite(v) ? Math.max(0.1, Math.min(0.9, (v - min) / span)) : Number.NaN,
  );
}

function sparkPath(series: number[], w: number, h: number): string {
  if (series.length < 2) return '';
  return series
    .map((v, i) => {
      if (!Number.isFinite(v)) return '';
      const x = (i / (series.length - 1)) * w;
      const y = h - v * h;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .filter(Boolean)
    .join(' ');
}

export function MarketCard({
  row,
  onOpen,
  miniCandles,
  isPrimaryTriggered = false,
  isDimmed = false,
  isLocking = false,
}: {
  row: MarketScannerRow;
  onOpen: () => void;
  miniCandles?: Candle[];
  isPrimaryTriggered?: boolean;
  isDimmed?: boolean;
  isLocking?: boolean;
}) {
  const prevLivePriceRef = useRef<number | null>(null);
  const [tickDirection, setTickDirection] = useState<'up' | 'down' | 'flat'>('flat');
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    if (!Number.isFinite(row.lastPrice)) return;
    const prev = prevLivePriceRef.current;
    if (prev != null) {
      if (row.lastPrice > prev) setTickDirection('up');
      else if (row.lastPrice < prev) setTickDirection('down');
      else setTickDirection('flat');
    }
    prevLivePriceRef.current = row.lastPrice;
  }, [row.lastPrice]);

  const uiState = uiSignalStateFromMarketStatus(row.status);
  const uiStateStyle = uiSignalStateClasses(uiState);
  const isTriggered = uiState === 'triggered';
  const triggeredAgeSec =
    row.triggeredAtMs != null && Number.isFinite(row.triggeredAtMs)
      ? Math.max(0, Math.floor((nowMs - row.triggeredAtMs) / 1000))
      : null;
  const showJustTriggered = isTriggered && isPrimaryTriggered && triggeredAgeSec != null && triggeredAgeSec <= 18;
  const justTriggered = useTriggeredMotion(isTriggered, 900);
  const hoverOutlineClass =
    isTriggered
      ? 'group-hover:ring-2 group-hover:ring-[rgba(0,255,200,0.45)] group-hover:border-[rgba(0,255,200,0.72)] active:ring-2 active:ring-[rgba(0,255,200,0.5)] active:border-[rgba(0,255,200,0.9)]'
      : uiState === 'in_play'
        ? 'group-hover:ring-2 group-hover:ring-cyan-400/22 group-hover:border-cyan-300/32'
        : 'group-hover:ring-2 group-hover:ring-slate-400/18 group-hover:border-slate-300/22';
  const changePositive = row.change24hPct >= 0;
  const chartW = 120;
  const chartH = 36;
  const candleWindow = miniCandles && miniCandles.length >= 8 ? miniCandles.slice(-28) : undefined;
  const candleWindowWithLive =
    candleWindow && candleWindow.length > 0 && Number.isFinite(row.lastPrice)
      ? [...candleWindow.slice(0, -1), { ...candleWindow[candleWindow.length - 1], close: row.lastPrice }]
      : candleWindow;
  const series =
    candleWindow ? seriesFromCandles(candleWindow, row.lastPrice) : buildMiniSeries(row);
  const miniIsUp = (() => {
    // Prefer short trend direction so obvious moves don't get overridden by a single tick.
    if (candleWindowWithLive && candleWindowWithLive.length >= 6) {
      const last = candleWindowWithLive[candleWindowWithLive.length - 1].close;
      const lookback = candleWindowWithLive[candleWindowWithLive.length - 6].close;
      if (last !== lookback) return last > lookback;
    }
    if (series.length >= 6) {
      const last = series[series.length - 1];
      const lookback = series[series.length - 6];
      if (last !== lookback) return last > lookback;
    }
    if (tickDirection !== 'flat') return tickDirection === 'up';
    return true;
  })();
  const miniLineColor = miniIsUp ? '#34d399' : '#fb7185';
  const line = sparkPath(series, chartW, chartH);
  const area = line ? `${line} L${chartW},${chartH} L0,${chartH} Z` : '';
  const [pressed, setPressed] = useState(false);

  return (
    <button
      type="button"
      onClick={onOpen}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className="group w-full text-left"
      aria-label={`Open trade for ${row.symbol}`}
    >
      <div
        className={`rounded-xl border bg-sigflo-surface sigflo-panel-texture p-3 transition-all active:scale-[0.99] sm:rounded-2xl sm:p-3.5 ${
          isTriggered
            ? `${uiStateStyle.card} sigflo-trigger-card-rest ${justTriggered ? 'sigflo-trigger-card-just' : ''} ${
                isPrimaryTriggered
                  ? 'scale-[1.008] border-[rgba(0,255,200,0.88)] ring-2 ring-[rgba(0,255,200,0.46)] shadow-[0_14px_32px_-16px_rgba(0,255,200,0.72)]'
                  : 'scale-[1.004]'
              }`
            : uiState === 'in_play'
              ? `${uiStateStyle.card} scale-[1.002]`
              : uiStateStyle.card
        } ${hoverOutlineClass} ${
          isDimmed ? 'opacity-45 blur-[0.6px] saturate-75' : ''
        } ${
          isLocking ? 'scale-[1.01] shadow-[0_14px_30px_-16px_rgba(0,255,200,0.65)]' : ''
        } ${
          pressed ? 'scale-[0.992] shadow-[0_0_16px_-6px_rgba(0,255,200,0.5)]' : ''
        } group-hover:shadow-[0_8px_20px_-18px_rgba(0,0,0,0.55)] active:shadow-[0_0_14px_-8px_rgba(0,255,200,0.45)]`}
      >
        <div className="flex items-start gap-2.5 sm:items-center sm:gap-3">
          {/* Left: pair + status */}
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-2">
              <div className="min-w-0 flex items-center gap-1.5 sm:gap-1.5">
                {isTriggered ? <TriggeredFireMark hot={justTriggered || showJustTriggered} /> : null}
                <h3 className="max-w-[34vw] truncate text-[14px] font-bold tracking-tight text-white min-[380px]:max-w-[42vw] sm:max-w-none sm:text-[15px]">
                  {row.pair}
                </h3>
              </div>
              <span className={`min-w-0 inline-flex items-center gap-1.5 text-[10px] font-semibold sm:gap-1.5 sm:text-[10px] ${uiStateStyle.text}`}>
                <span className={`relative flex ${isTriggered ? 'h-2 w-2' : 'h-1.5 w-1.5'}`}>
                  {uiStateStyle.pulse ? (
                    <>
                      {justTriggered ? <span className="absolute inset-[-1px] rounded-full border border-[#7fffe0]/45 sigflo-trigger-dot-halo" /> : null}
                      <span className={`absolute inline-flex h-full w-full rounded-full ${uiStateStyle.dot} sigflo-trigger-dot ${justTriggered ? 'sigflo-trigger-dot-just' : ''}`} />
                    </>
                  ) : null}
                  <span className={`relative inline-flex h-full w-full rounded-full ${uiStateStyle.dot}`} />
                </span>
                <span
                  className={`max-w-[22vw] truncate min-[380px]:max-w-[28vw] sm:max-w-none ${
                    isTriggered ? 'uppercase tracking-[0.11em] text-[#b2ffef] drop-shadow-[0_0_8px_rgba(0,255,200,0.45)]' : ''
                  }`}
                >
                  {showJustTriggered ? 'Just triggered' : marketStatusLabel(row.status)}
                </span>
              </span>
            </div>
            {isTriggered && !showJustTriggered ? (
              <p className={`pl-6 pt-0.5 text-[10px] font-semibold text-[#9fffe9]/90 sm:pl-16 sm:text-[10px] ${justTriggered ? 'sigflo-trigger-entry-active sigflo-trigger-entry-shimmer' : ''}`}>
                Entry open
              </p>
            ) : null}
          </div>

          {/* Middle: mini chart (between status and price) */}
          <div className="w-[86px] shrink-0 min-[380px]:w-[110px] sm:w-[122px]">
            <div className="overflow-hidden rounded-md border border-white/[0.05] bg-[#08090d] px-1 py-1 sm:rounded-md sm:px-1 sm:py-0.5">
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="h-[26px] w-full sm:h-[30px]" aria-hidden>
                <defs>
                  <linearGradient id={`market-area-${row.symbol}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={miniLineColor} stopOpacity="0.24" />
                    <stop offset="100%" stopColor={miniLineColor} stopOpacity="0" />
                  </linearGradient>
                </defs>
                {area ? <path d={area} fill={`url(#market-area-${row.symbol})`} /> : null}
                {line ? (
                  <path
                    d={line}
                    fill="none"
                    stroke={miniLineColor}
                    strokeWidth="1.85"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : null}
              </svg>
            </div>
          </div>

          {/* Right: price + change */}
          <div className="w-[64px] shrink-0 text-right min-[380px]:w-[80px] sm:w-auto">
            <p className="text-[13px] font-bold tabular-nums text-white sm:text-[13px]">
              {Number.isFinite(row.lastPrice) ? `$${formatQuoteNumber(row.lastPrice)}` : '—'}
            </p>
            <p className={`text-[11px] font-semibold tabular-nums sm:text-[11px] ${changePositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {Number.isFinite(row.change24hPct) ? `${changePositive ? '+' : ''}${row.change24hPct.toFixed(2)}%` : '—'}
            </p>
            <p
              className={`mt-0.5 text-right text-[13px] font-bold transition-transform sm:text-[13px] ${
                uiState === 'triggered'
                  ? 'text-[#ddfff7] drop-shadow-[0_0_8px_rgba(0,255,200,0.55)]'
                  : uiState === 'in_play'
                    ? 'text-cyan-100'
                    : 'text-sigflo-muted/95'
              } ${pressed ? 'translate-x-1' : ''} group-hover:translate-x-0.5 group-hover:brightness-125 group-active:translate-x-1`}
              aria-hidden
            >
              →
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}
