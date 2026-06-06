import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  TrackingModeExitMode,
  createChart,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type Time,
  type UTCTimestamp,
} from 'lightweight-charts';
import { clientYToSeriesCoordinateY } from '@/lib/chartSeriesOverlayCoordinates';
import { getKlines } from '@/services/market/marketDataService';
import type { Candle } from '@/types/market';

export type TradeMiniChartProps = {
  pair: string;
  entryPrice?: number;
  stopPrice?: number;
  targets?: number[];
  direction: 'LONG' | 'SHORT';
  liquidationPrice?: number;
  interactiveLevels?: boolean;
  onPlannedStopChange?: (price: number) => void;
  onPlannedTargetsChange?: (next: number[]) => void;
  onLevelsDragEnd?: () => void;
  planGeometryWarning?: boolean;
};

const CHART_HEIGHT = 168;
/** Vertical hit band for dragging stop / targets — keep narrow so pan/zoom reaches the chart canvas elsewhere. */
const LEVEL_DRAG_BAND_PX = 26;
const LEVEL_DRAG_HANDLE_WIDTH_PX = 48;

const COL_ENTRY = 'rgba(0, 255, 200, 0.42)';
const COL_STOP = 'rgba(220, 90, 90, 0.82)';
const COL_TARGET = 'rgba(0, 230, 200, 0.52)';
const COL_LIQ = 'rgba(148, 163, 184, 0.32)';

function toTime(ts: number): Time {
  return Math.floor(ts / 1000) as UTCTimestamp;
}

function numFromBarPrice(p: unknown): number | null {
  const n = typeof p === 'number' ? p : Number(p);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function fmtDragPx(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US', { maximumFractionDigits: 6 });
}

function buildSyntheticCandles(count: number, anchor: number, intervalMs: number): Candle[] {
  const out: Candle[] = [];
  const now = Date.now();
  let px = anchor;
  for (let i = count - 1; i >= 0; i--) {
    const ts = now - i * intervalMs;
    const wobble = Math.sin(i * 0.21) * anchor * 0.0015 + ((i % 7) - 3) * anchor * 0.00025;
    const o = px;
    const c = o + wobble;
    const h = Math.max(o, c) + anchor * 0.0008;
    const l = Math.min(o, c) - anchor * 0.0008;
    out.push({ ts, open: o, high: h, low: l, close: c, volume: 1 });
    px = c;
  }
  return out;
}

export function TradeMiniChart({
  pair,
  entryPrice,
  stopPrice,
  targets,
  direction,
  liquidationPrice,
  interactiveLevels,
  onPlannedStopChange,
  onPlannedTargetsChange,
  onLevelsDragEnd,
  planGeometryWarning,
}: TradeMiniChartProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lineDisposersRef = useRef<(() => void)[]>([]);

  const levelsRef = useRef({
    entryPrice,
    stopPrice,
    targets: targets ?? [] as number[],
    liquidationPrice,
  });
  levelsRef.current = {
    entryPrice,
    stopPrice,
    targets: targets ?? [],
    liquidationPrice,
  };

  const [chartGen, setChartGen] = useState(0);
  const [coordTick, setCoordTick] = useState(0);
  const [floatLabel, setFloatLabel] = useState<string | null>(null);
  const [levelBands, setLevelBands] = useState<
    { key: string; top: number; height: number; kind: 'stop' | number; initialPrice: number }[]
  >([]);
  const dragKindRef = useRef<'stop' | number | null>(null);

  const clearPriceLines = useCallback(() => {
    const series = seriesRef.current;
    for (const fn of lineDisposersRef.current) {
      try {
        fn();
      } catch (e) { console.error("[Caught Error]", e); }
    }
    lineDisposersRef.current = [];
    void series;
  }, []);

  const applyPriceLines = useCallback(() => {
    const series = seriesRef.current;
    if (!series) return;
    clearPriceLines();

    const pushLine = (ln: IPriceLine) => {
      lineDisposersRef.current.push(() => {
        try {
          series.removePriceLine(ln);
        } catch (e) { console.error("[Caught Error]", e); }
      });
    };

    const { entryPrice: ent, stopPrice: stp, targets: tg, liquidationPrice: liq } = levelsRef.current;

    if (ent != null && Number.isFinite(ent) && ent > 0) {
      const ln = series.createPriceLine({
        price: ent,
        color: COL_ENTRY,
        lineWidth: 1,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: 'Entry',
      });
      pushLine(ln);
    }
    if (stp != null && Number.isFinite(stp) && stp > 0) {
      const ln = series.createPriceLine({
        price: stp,
        color: COL_STOP,
        lineWidth: 1,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: 'Stop',
      });
      pushLine(ln);
    }
    for (let i = 0; i < tg.length; i++) {
      const t = tg[i]!;
      if (!Number.isFinite(t) || t <= 0) continue;
      const ln = series.createPriceLine({
        price: t,
        color: COL_TARGET,
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `T${i + 1}`,
      });
      pushLine(ln);
    }
    if (liq != null && Number.isFinite(liq) && liq > 0) {
      const ln = series.createPriceLine({
        price: liq,
        color: COL_LIQ,
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        axisLabelVisible: true,
        title: 'Liq',
      });
      pushLine(ln);
    }
    setCoordTick((n) => n + 1);
  }, [clearPriceLines]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;

    const chart = createChart(host, {
      width: host.clientWidth || 320,
      height: CHART_HEIGHT,
      layout: {
        background: { type: ColorType.Solid, color: 'rgba(0,0,0,0)' },
        textColor: 'rgba(161,161,170,0.75)',
        fontSize: 10,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.02)' },
        horzLines: { color: 'rgba(255,255,255,0.04)' },
      },
      crosshair: { mode: CrosshairMode.Hidden },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.12, bottom: 0.06 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 2,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        mouseWheel: true,
        pinch: true,
        axisPressedMouseMove: { time: true, price: true },
      },
      trackingMode: { exitMode: TrackingModeExitMode.OnTouchEnd },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: 'rgba(52,211,153,0.85)',
      downColor: 'rgba(248,113,113,0.85)',
      borderUpColor: 'rgba(52,211,153,0.85)',
      borderDownColor: 'rgba(248,113,113,0.85)',
      wickUpColor: 'rgba(52,211,153,0.55)',
      wickDownColor: 'rgba(248,113,113,0.55)',
      lastValueVisible: false,
      priceLineVisible: false,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const load = async () => {
      let candles = await getKlines(pair, '15m', 50);
      if (cancelled) return;
      const lv = levelsRef.current;
      if (!candles.length) {
        const anchor =
          lv.entryPrice && Number.isFinite(lv.entryPrice) && lv.entryPrice > 0
            ? lv.entryPrice
            : lv.stopPrice && Number.isFinite(lv.stopPrice) && lv.stopPrice > 0
              ? lv.stopPrice * 1.002
              : 50_000;
        candles = buildSyntheticCandles(50, anchor, 15 * 60 * 1000);
      }
      if (cancelled) return;
      const data = candles.map((c) => ({
        time: toTime(c.ts),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));
      series.setData(data);
      applyPriceLines();
      chart.timeScale().fitContent();
      setChartGen((g) => g + 1);
    };

    void load();

    const bumpCoords = () => setCoordTick((n) => n + 1);
    const ts = chart.timeScale();
    ts.subscribeVisibleLogicalRangeChange(bumpCoords);
    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            if (!hostRef.current || !chartRef.current) return;
            const w = hostRef.current.clientWidth;
            if (w > 0) chartRef.current.applyOptions({ width: w, height: CHART_HEIGHT });
            bumpCoords();
          })
        : null;
    ro?.observe(host);

    return () => {
      cancelled = true;
      ts.unsubscribeVisibleLogicalRangeChange(bumpCoords);
      ro?.disconnect();
      clearPriceLines();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [pair, applyPriceLines, clearPriceLines]);

  useEffect(() => {
    if (!seriesRef.current) return;
    applyPriceLines();
  }, [applyPriceLines, entryPrice, stopPrice, targets?.join(','), liquidationPrice, chartGen]);

  const targetsKey = targets?.join(',') ?? '';

  useLayoutEffect(() => {
    const series = seriesRef.current;
    if (!series || !interactiveLevels || chartGen === 0) {
      setLevelBands([]);
      return;
    }
    const h = LEVEL_DRAG_BAND_PX;
    const next: { key: string; top: number; height: number; kind: 'stop' | number; initialPrice: number }[] = [];
    if (stopPrice != null && Number.isFinite(stopPrice) && stopPrice > 0 && onPlannedStopChange) {
      const y = series.priceToCoordinate(stopPrice);
      if (y != null && Number.isFinite(Number(y))) {
        const cy = Number(y);
        next.push({
          key: 'stop',
          top: Math.max(0, Math.min(CHART_HEIGHT - h, cy - h / 2)),
          height: h,
          kind: 'stop',
          initialPrice: stopPrice,
        });
      }
    }
    if (onPlannedTargetsChange && targets?.length) {
      for (let i = 0; i < targets.length; i++) {
        const t = targets[i]!;
        if (!Number.isFinite(t) || t <= 0) continue;
        const y = series.priceToCoordinate(t);
        if (y != null && Number.isFinite(Number(y))) {
          const cy = Number(y);
          next.push({
            key: `t-${i}`,
            top: Math.max(0, Math.min(CHART_HEIGHT - h, cy - h / 2)),
            height: h,
            kind: i,
            initialPrice: t,
          });
        }
      }
    }
    setLevelBands(next);
  }, [interactiveLevels, chartGen, coordTick, stopPrice, targetsKey, onPlannedStopChange, onPlannedTargetsChange]);

  const onBandPointerDown =
    (kind: 'stop' | number, initialPrice: number) => (e: React.PointerEvent<HTMLDivElement>) => {
      if (!interactiveLevels) return;
      dragKindRef.current = kind;
      e.currentTarget.setPointerCapture(e.pointerId);
      setFloatLabel(fmtDragPx(initialPrice));
    };

  const onBandPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const kind = dragKindRef.current;
    if (kind === null) return;
    const series = seriesRef.current;
    if (!series) return;
    const yPane = clientYToSeriesCoordinateY(series, e.clientY);
    if (yPane == null) return;
    const raw = series.coordinateToPrice(yPane);
    const price = numFromBarPrice(raw);
    if (price == null) return;
    setFloatLabel(fmtDragPx(price));
    if (kind === 'stop') {
      onPlannedStopChange?.(price);
    } else if (typeof kind === 'number' && onPlannedTargetsChange) {
      const next = [...(targets ?? [])];
      if (kind >= 0 && kind < next.length) {
        next[kind] = price;
        onPlannedTargetsChange(next);
      }
    }
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragKindRef.current === null) return;
    dragKindRef.current = null;
    setFloatLabel(null);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (e) { console.error("[Caught Error]", e); }
    onLevelsDragEnd?.();
  };

  return (
    <div className="w-full">
      <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-zinc-500">15m · last 50 bars</p>
      <div
        className={`relative touch-none overflow-hidden rounded-xl border bg-[#050505]/40 ${
          planGeometryWarning ? 'border-amber-500/35 ring-1 ring-amber-500/25' : 'border-white/[0.08]'
        }`}
      >
        {floatLabel ? (
          <div
            className="pointer-events-none absolute left-1/2 top-2 z-20 -translate-x-1/2 rounded-md border border-white/15 bg-black/75 px-2 py-0.5 font-mono text-[10px] tabular-nums text-zinc-100 shadow-lg backdrop-blur-sm"
            aria-live="polite"
          >
            {floatLabel}
          </div>
        ) : null}
        <div
          ref={hostRef}
          className="h-[168px] w-full"
          aria-label={`Mini price chart for ${pair}, ${direction === 'LONG' ? 'long' : 'short'} setup`}
        />
        {interactiveLevels && chartGen > 0 && levelBands.length > 0
          ? levelBands.map((b) => (
              <div
                key={b.key}
                className="absolute right-0 z-10 cursor-ns-resize touch-none"
                style={{ top: b.top, height: b.height, width: LEVEL_DRAG_HANDLE_WIDTH_PX }}
                onPointerDown={onBandPointerDown(b.kind, b.initialPrice)}
                onPointerMove={onBandPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                aria-hidden
              />
            ))
          : null}
      </div>
    </div>
  );
}
