import { useEffect, useRef, useState, type RefObject } from 'react';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';
import { clientYToSeriesCoordinateY, seriesPriceToOverlayY } from '@/lib/chartSeriesOverlayCoordinates';

type SeriesHost = ISeriesApi<'Candlestick'> | ISeriesApi<'Line'>;

const PRICE_SCALE_GUTTER_FALLBACK_PX = 72;
const PRICE_SCALE_GUTTER_PAD_PX = 6;
const HIT_STRIP_PX = 14;

function numFromBarPrice(p: unknown): number | null {
  const n = typeof p === 'number' ? p : Number(p);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function fmtDragPx(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US', { maximumFractionDigits: 6 });
}

export type TradePlanDragHandlesProps = {
  plotEl: HTMLElement | null;
  chartRef: RefObject<IChartApi | null>;
  candleSeriesRef: RefObject<ISeriesApi<'Candlestick'> | null>;
  lineSeriesRef: RefObject<ISeriesApi<'Line'> | null>;
  candlesActive: boolean;
  chartGen: number;
  stop: number;
  target: number;
  visibleStop: boolean;
  visibleTarget: boolean;
  onStopChange?: (price: number) => void;
  onTargetChange?: (price: number) => void;
  /** Fired on pointer up (not cancel) after a stop drag — use for exchange TP/SL commit. */
  onStopDragEnd?: (price: number) => void;
  onTargetDragEnd?: (price: number) => void;
};

/**
 * Thin horizontal hit strips over stop / target (Setup + premium zones). Does not cover the full plot so
 * Lightweight Charts pan/zoom still works outside those levels.
 */
export function TradePlanDragHandles({
  plotEl,
  chartRef,
  candleSeriesRef,
  lineSeriesRef,
  candlesActive,
  chartGen,
  stop,
  target,
  visibleStop,
  visibleTarget,
  onStopChange,
  onTargetChange,
  onStopDragEnd,
  onTargetDragEnd,
}: TradePlanDragHandlesProps) {
  const [coordTick, setCoordTick] = useState(0);
  const [floatLabel, setFloatLabel] = useState<string | null>(null);
  const dragKindRef = useRef<'stop' | 'target' | null>(null);
  const lastDragPriceRef = useRef<number | null>(null);

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
    const id = window.setInterval(bump, 500);
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

  const measuredScaleW = chart.priceScale('right').width();
  const rightGutterPx =
    measuredScaleW > 0
      ? Math.min(140, Math.ceil(measuredScaleW + PRICE_SCALE_GUTTER_PAD_PX))
      : PRICE_SCALE_GUTTER_FALLBACK_PX;

  const H = plotEl.clientHeight;
  const W = plotEl.clientWidth;
  if (H < 8 || W < 8) return null;

  const yStop =
    visibleStop && Number.isFinite(stop) && stop > 0 ? seriesPriceToOverlayY(plotEl, series, stop) : null;
  const yTgt =
    visibleTarget && Number.isFinite(target) && target > 0 ? seriesPriceToOverlayY(plotEl, series, target) : null;

  const beginStripDrag = (
    e: React.PointerEvent<HTMLDivElement>,
    kind: 'stop' | 'target',
    labelPrice: number,
  ) => {
    dragKindRef.current = kind;
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    lastDragPriceRef.current = labelPrice;
    setFloatLabel(fmtDragPx(labelPrice));
  };

  const onStripMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const kind = dragKindRef.current;
    if (kind == null) return;
    e.stopPropagation();
    const y = clientYToSeriesCoordinateY(series, e.clientY);
    if (y == null) return;
    const raw = series.coordinateToPrice(y);
    const price = numFromBarPrice(raw);
    if (price == null) return;
    lastDragPriceRef.current = price;
    setFloatLabel(fmtDragPx(price));
    if (kind === 'stop') onStopChange?.(price);
    else onTargetChange?.(price);
  };

  const endStripDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragKindRef.current == null) return;
    const kind = dragKindRef.current;
    const last = lastDragPriceRef.current;
    dragKindRef.current = null;
    lastDragPriceRef.current = null;
    setFloatLabel(null);
    const cancelled = e.type === 'pointercancel';
    if (!cancelled) {
      if (kind === 'stop' && last != null) onStopDragEnd?.(last);
      if (kind === 'target' && last != null) onTargetDragEnd?.(last);
    }
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const stripWrapClass = 'pointer-events-auto absolute left-0 z-[40] cursor-ns-resize touch-none';

  return (
    <>
      {floatLabel ? (
        <div
          className="pointer-events-none absolute left-1/2 top-3 z-[45] -translate-x-1/2 rounded-md border border-white/15 bg-black/80 px-2 py-0.5 font-mono text-[10px] tabular-nums text-zinc-100 shadow-lg backdrop-blur-sm"
          aria-live="polite"
        >
          {floatLabel}
        </div>
      ) : null}
      {yStop != null && (onStopChange || onStopDragEnd) ? (
        <div
          aria-label="Drag to adjust stop price"
          className={stripWrapClass}
          style={{
            top: yStop - HIT_STRIP_PX / 2,
            height: HIT_STRIP_PX,
            right: rightGutterPx,
          }}
          onPointerDown={(e) => beginStripDrag(e, 'stop', stop)}
          onPointerMove={onStripMove}
          onPointerUp={endStripDrag}
          onPointerCancel={endStripDrag}
        />
      ) : null}
      {yTgt != null && (onTargetChange || onTargetDragEnd) ? (
        <div
          aria-label="Drag to adjust target price"
          className={stripWrapClass}
          style={{
            top: yTgt - HIT_STRIP_PX / 2,
            height: HIT_STRIP_PX,
            right: rightGutterPx,
          }}
          onPointerDown={(e) => beginStripDrag(e, 'target', target)}
          onPointerMove={onStripMove}
          onPointerUp={endStripDrag}
          onPointerCancel={endStripDrag}
        />
      ) : null}
    </>
  );
}
