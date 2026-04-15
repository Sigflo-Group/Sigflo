import { useEffect, useState, type RefObject } from 'react';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';
import { TradePlanCornerStats } from '@/components/trade/TradePlanCornerStats';
import {
  entryBandPrices,
  stopProximityBoost,
  targetBandPrices,
  targetProximityBoost,
} from '@/lib/tradePlanOverlayGeometry';
import type { TradeSide } from '@/types/trade';

/**
 * Fallback when `priceScale('right').width()` is not ready yet (0). Prefer live measurement so overlays align with
 * the real candle pane — a fixed gutter was often too wide and lines/zones stopped short of the latest bars.
 */
const PRICE_SCALE_GUTTER_FALLBACK_PX = 72;
/** Breathing room past measured axis width so we do not clip the last-price line / labels. */
const PRICE_SCALE_GUTTER_PAD_PX = 6;
/** Small gap between the Stop/Tgt chip and the price scale (plot is already inset by `rightGutterPx`). */
const CORNER_STATS_RIGHT_GAP_PX = 6;

type SeriesHost = ISeriesApi<'Candlestick'> | ISeriesApi<'Line'>;

function priceToY(series: SeriesHost | null, price: number): number | null {
  if (!series) return null;
  const fn = (series as { priceToCoordinate?: (p: number) => number | null }).priceToCoordinate;
  if (typeof fn !== 'function') return null;
  const y = fn.call(series, price);
  return y != null && Number.isFinite(y) ? y : null;
}

function ySpan(yA: number, yB: number): { top: number; height: number } {
  const top = Math.min(yA, yB);
  const height = Math.max(1, Math.abs(yB - yA));
  return { top, height };
}

export function TradePlanZonesOverlay({
  plotEl,
  chartRef,
  candleSeriesRef,
  lineSeriesRef,
  candlesActive,
  side,
  entry,
  stop,
  target,
  lastPrice,
  riskReward,
  visibleEntry,
  visibleStop,
  visibleTarget,
  focusPulse,
  exitZoneMode,
  /** Bumps when Lightweight Charts instance is (re)created so subscriptions reattach. */
  chartGen,
  /** When false, the Stop/Tgt/R:R chip is omitted (e.g. rendered in the manage header above TF chips). */
  showCornerStats = true,
}: {
  plotEl: HTMLElement | null;
  chartRef: RefObject<IChartApi | null>;
  candleSeriesRef: RefObject<ISeriesApi<'Candlestick'> | null>;
  lineSeriesRef: RefObject<ISeriesApi<'Line'> | null>;
  candlesActive: boolean;
  chartGen: number;
  side: TradeSide;
  entry: number;
  stop: number;
  target: number;
  lastPrice: number;
  riskReward: number;
  visibleEntry: boolean;
  visibleStop: boolean;
  visibleTarget: boolean;
  focusPulse: boolean;
  exitZoneMode?: 'exit' | 'ai';
  showCornerStats?: boolean;
}) {
  const [coordTick, setCoordTick] = useState(0);
  const exitLabel = exitZoneMode === 'ai' ? 'AI Exit' : 'Exit zone';

  useEffect(() => {
    if (!plotEl) return;
    const chart = chartRef.current;
    if (!chart) return;
    const bump = () => setCoordTick((n) => n + 1);
    const ts = chart.timeScale();
    ts.subscribeVisibleLogicalRangeChange(bump);
    const ro = new ResizeObserver(() => bump());
    ro.observe(plotEl);
    const ps = chart.priceScale('right') as {
      subscribeVisiblePriceRangeChange?: (cb: () => void) => void;
      unsubscribeVisiblePriceRangeChange?: (cb: () => void) => void;
    };
    if (typeof ps.subscribeVisiblePriceRangeChange === 'function') {
      ps.subscribeVisiblePriceRangeChange(bump);
    }
    const id = window.setInterval(bump, 650);
    return () => {
      ts.unsubscribeVisibleLogicalRangeChange(bump);
      ro.disconnect();
      if (typeof ps.unsubscribeVisiblePriceRangeChange === 'function') {
        ps.unsubscribeVisiblePriceRangeChange(bump);
      }
      window.clearInterval(id);
    };
  }, [chartRef, plotEl, chartGen]);

  void coordTick;

  const chart = chartRef.current;
  const series: SeriesHost | null = candlesActive ? candleSeriesRef.current : lineSeriesRef.current;

  if (!plotEl || !chart || !series) return null;

  const showAny = visibleEntry || visibleStop || visibleTarget;
  if (!showAny) return null;

  const measuredScaleW = chart.priceScale('right').width();
  const rightGutterPx =
    measuredScaleW > 0
      ? Math.min(140, Math.ceil(measuredScaleW + PRICE_SCALE_GUTTER_PAD_PX))
      : PRICE_SCALE_GUTTER_FALLBACK_PX;

  const H = plotEl.clientHeight;
  const W = plotEl.clientWidth;
  if (H < 8 || W < 8) return null;

  const timeGutter = 26;
  const plotBottom = H - timeGutter;
  /** Pixels between the exact stop price and the start of the danger fill so the stop line stays visible on top of the chart. */
  const STOP_ZONE_GAP_PX = 6;

  const eBand = entryBandPrices(entry, stop);
  const tBand = targetBandPrices(target, entry, stop);

  const yE0 = priceToY(series, eBand.lo);
  const yE1 = priceToY(series, eBand.hi);
  const yEntry = priceToY(series, entry);
  const yS = priceToY(series, stop);
  const yT0 = priceToY(series, tBand.lo);
  const yT1 = priceToY(series, tBand.hi);

  const stopBoost = stopProximityBoost(lastPrice, stop, entry);
  const tgtBoost = targetProximityBoost(lastPrice, target, entry);

  let stopZone: { top: number; height: number } | null = null;
  if (visibleStop && yS != null) {
    if (side === 'long') {
      const top = yS + STOP_ZONE_GAP_PX;
      stopZone = { top, height: Math.max(0, plotBottom - top) };
    } else {
      const h = Math.max(0, yS - STOP_ZONE_GAP_PX);
      stopZone = { top: 0, height: h };
    }
  }

  let entryZone: { top: number; height: number } | null = null;
  if (visibleEntry && yE0 != null && yE1 != null) {
    entryZone = ySpan(yE0, yE1);
  }

  let targetZone: { top: number; height: number } | null = null;
  if (visibleTarget && yT0 != null && yT1 != null) {
    targetZone = ySpan(yT0, yT1);
  }

  const lineY = {
    entry: visibleEntry ? yEntry : null,
    stop: visibleStop ? yS : null,
    target: visibleTarget ? priceToY(series, target) : null,
  };

  const focusClass = focusPulse ? 'sigflo-trade-plan--focus-in' : '';

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${focusClass}`} aria-hidden>
      {stopZone && visibleStop ? (
        <div
          className="sigflo-trade-plan-zone sigflo-trade-plan-zone--stop absolute left-0"
          style={{
            right: rightGutterPx,
            top: stopZone.top,
            height: stopZone.height,
            opacity: stopBoost,
            background:
              side === 'long'
                ? 'linear-gradient(180deg, rgba(248,113,113,0.22) 0%, rgba(248,113,113,0.06) 55%, transparent 100%)'
                : 'linear-gradient(0deg, rgba(248,113,113,0.22) 0%, rgba(248,113,113,0.06) 55%, transparent 100%)',
            boxShadow:
              side === 'long'
                ? 'inset 0 2px 24px rgba(248,113,113,0.25)'
                : 'inset 0 -2px 24px rgba(248,113,113,0.25)',
          }}
        />
      ) : null}

      {entryZone && visibleEntry ? (
        <div
          className="sigflo-trade-plan-zone sigflo-trade-plan-zone--entry absolute left-0"
          style={{
            right: rightGutterPx,
            top: entryZone.top,
            height: entryZone.height,
            background:
              'linear-gradient(180deg, rgba(45,212,191,0.14) 0%, rgba(45,212,191,0.05) 50%, rgba(45,212,191,0.12) 100%)',
          }}
        />
      ) : null}

      {targetZone && visibleTarget ? (
        <div
          className="sigflo-trade-plan-zone sigflo-trade-plan-zone--target absolute left-0 sigflo-exit-zone-pulse"
          style={{
            right: rightGutterPx,
            top: targetZone.top,
            height: targetZone.height,
            opacity: tgtBoost,
            background:
              'linear-gradient(180deg, rgba(74,222,128,0.1) 0%, rgba(74,222,128,0.04) 45%, rgba(74,222,128,0.08) 100%)',
            borderTop: '1px solid rgba(74,222,128,0.18)',
            borderBottom: '1px solid rgba(74,222,128,0.18)',
          }}
        />
      ) : null}

      {lineY.entry != null && visibleEntry ? (
        <div
          className="sigflo-trade-plan-line sigflo-trade-plan-line--entry absolute left-0"
          style={{ top: lineY.entry - 0.5, height: 1, right: rightGutterPx }}
        />
      ) : null}
      {lineY.stop != null && visibleStop ? (
        <div
          className="sigflo-trade-plan-line sigflo-trade-plan-line--stop absolute left-0 z-[35]"
          style={{ top: lineY.stop - 0.5, height: 1, right: rightGutterPx }}
        />
      ) : null}
      {lineY.target != null && visibleTarget ? (
        <div
          className="sigflo-trade-plan-line sigflo-trade-plan-line--target absolute left-0"
          style={{ top: lineY.target - 0.5, height: 1, right: rightGutterPx }}
        />
      ) : null}

      {visibleEntry && lineY.entry != null ? (
        <div
          className="absolute z-30 rounded-md border border-teal-400/35 bg-[#0c0c0f] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-teal-100 shadow-[0_0_12px_rgba(45,212,191,0.35)]"
          style={{ left: 8, top: Math.max(4, lineY.entry - 22) }}
        >
          Entry
        </div>
      ) : null}

      {visibleStop && lineY.stop != null ? (
        <div
          className="absolute z-30 rounded-md border border-rose-400/45 bg-[#0c0c0f] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-rose-100 shadow-[0_0_16px_rgba(248,113,113,0.45)]"
          style={{ left: 8, top: Math.min(plotBottom - 28, Math.max(4, lineY.stop - 22)) }}
        >
          Stop
        </div>
      ) : null}

      {visibleTarget && lineY.target != null ? (
        <div
          className="absolute z-30 rounded-md border border-emerald-400/35 bg-[#0c0c0f] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-100 shadow-[0_0_14px_rgba(74,222,128,0.35)]"
          style={{ left: 8, top: Math.max(4, lineY.target - 22) }}
        >
          {exitLabel}
        </div>
      ) : null}

      {showCornerStats ? (
        <TradePlanCornerStats
          entry={entry}
          stop={stop}
          target={target}
          lastPrice={lastPrice}
          riskReward={riskReward}
          className="absolute top-2 z-30 max-w-[min(100%,11rem)]"
          style={{ right: rightGutterPx + CORNER_STATS_RIGHT_GAP_PX }}
        />
      ) : null}
    </div>
  );
}
