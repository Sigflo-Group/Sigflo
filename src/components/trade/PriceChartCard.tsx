import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import {
  CandlestickSeries,
  ColorType,
  createChart,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  LineStyle,
  TickMarkType,
  TrackingModeExitMode,
  type IChartApi,
  type ISeriesApi,
  type Time,
  type UTCTimestamp,
} from 'lightweight-charts';
import { MarketStatsRow } from '@/components/trade/MarketStatsRow';
import { SetupToggle } from '@/components/trade/SetupToggle';
import { TradePlanCornerStats } from '@/components/trade/TradePlanCornerStats';
import { TradePlanDragHandles } from '@/components/trade/TradePlanDragHandles';
import { TradePlanZonesOverlay } from '@/components/trade/TradePlanZonesOverlay';
import { TRADE_CHART_PLOT_EXPANDED_PX } from '@/config/tradeChartHeights';
import type { TradeChartInterval } from '@/hooks/useLiveTradeMarket';
import { hexToRgba } from '@/lib/chartColorUtils';
import {
  CHART_SETUP_FOCUS_EVENT,
  type ChartSetupFocusDetail,
} from '@/lib/chartSetupFocus';
import {
  tradeTimingLineAlpha,
  tradeTimingOverlayVisual,
  type TradeTimingChipState,
} from '@/lib/tradeTimingChip';
import { formatQuoteNumber, formatQuoteUsd } from '@/lib/formatQuote';
import {
  TRADE_CHART_LEVEL_COLORS,
  buildChartOverlayPresetLive,
  chartOverlayPresetSetupLevels,
  type TradeChartAuxLine,
} from '@/lib/tradeChartLevels';
import type { MarketMode, TradeViewModel } from '@/types/trade';

/** Normalize pair for setup-focus filter (`BTC` vs `BTC / USDT`). */
function chartSetupFocusPairBase(pair: string): string {
  const raw = pair.trim().toUpperCase();
  if (raw.includes('/')) {
    return raw.split('/')[0]?.trim().replace(/[^A-Z0-9]/g, '') || '';
  }
  return raw.replace(/USDT$/i, '').replace(/[^A-Z0-9]/g, '') || '';
}

/**
 * Chart surface: Lightweight Charts plot, interval chips, `SetupToggle` (Clean vs Setup overlays).
 * Overlay series use ease-out fade in `SETUP_LINE_ANIM_MS`; line weight/opacity from `tradeTimingOverlayVisual`.
 */
type LevelKey = 'entry' | 'stop' | 'target' | 'liquidation';

const levelStyles: Record<LevelKey, { label: string; stroke: string; labelClass: string }> = {
  entry: { label: 'Entry', stroke: TRADE_CHART_LEVEL_COLORS.entry, labelClass: 'text-teal-300' },
  stop: { label: 'Stop', stroke: TRADE_CHART_LEVEL_COLORS.stop, labelClass: 'text-rose-300' },
  target: { label: 'Target', stroke: TRADE_CHART_LEVEL_COLORS.target, labelClass: 'text-emerald-300' },
  liquidation: {
    label: 'Liq.',
    stroke: TRADE_CHART_LEVEL_COLORS.liquidation,
    labelClass: 'text-amber-200',
  },
};

/** Ease-out fade for setup overlays (entry / stop / target / liq). */
const SETUP_LINE_ANIM_MS = 175;

function toUtcTime(tsMs: number): UTCTimestamp {
  return Math.floor(tsMs / 1000) as UTCTimestamp;
}

function timePointToLocalDate(time: Time): Date {
  let utc: Date;
  if (typeof time === 'number') {
    utc = new Date(time * 1000);
  } else if (typeof time === 'string') {
    utc = new Date(`${time}T00:00:00Z`);
  } else {
    utc = new Date(Date.UTC(time.year, time.month - 1, time.day));
  }
  return new Date(
    utc.getUTCFullYear(),
    utc.getUTCMonth(),
    utc.getUTCDate(),
    utc.getUTCHours(),
    utc.getUTCMinutes(),
    utc.getUTCSeconds(),
    utc.getUTCMilliseconds(),
  );
}

/** Compact time-axis labels; smaller glyph strings help LC fit ticks in short plot heights. */
function formatTimeScaleTick(time: Time, tickMarkType: TickMarkType, locale: string): string | null {
  const d = timePointToLocalDate(time);
  switch (tickMarkType) {
    case TickMarkType.Year:
      return d.toLocaleString(locale, { year: 'numeric' });
    case TickMarkType.Month:
      return d.toLocaleString(locale, { month: 'short' });
    case TickMarkType.DayOfMonth:
      return d.toLocaleString(locale, { month: 'short', day: 'numeric' });
    case TickMarkType.Time:
      return d.toLocaleString(locale, { hour: 'numeric', minute: '2-digit', hour12: false });
    case TickMarkType.TimeWithSeconds:
      return d.toLocaleString(locale, {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    default:
      return null;
  }
}

export function PriceChartCard({
  model,
  market,
  intervalLabel,
  loadingInterval,
  liveUpdatedAt,
  /** When set, shows a chart-hero title row (pair) above the live price. */
  heroPairLabel,
  change24hPct,
  chartHeightPx = TRADE_CHART_PLOT_EXPANDED_PX,
  timeframeOptions,
  chartInterval,
  onChartIntervalChange,
  /** Fixed plot height (px). When set, overrides dvh / --chart-h-desktop (e.g. collapsible trade header). */
  chartPlotHeightPx,
  exchangeStyleHero = false,
  metaCaption,
  setupMode,
  onSetupModeToggle,
  onRequestSetupMode,
  tradeTimingState,
  /** When true, chart chrome emphasizes active position context (header metrics, optional proximity). */
  liveTradeMode = false,
  /** Extra horizontal levels (e.g. trim) — not toggled via overlay chips. */
  auxiliaryPriceLines,
  /** Compact R / T / R:R (+ optional badge) under the exchange hero row. */
  liveHeaderMetrics,
  /** When this key changes, refit time scale once so entry/stop/target stay in view. */
  liveTradeRefitKey,
  /**
   * When this key changes (e.g. bot focus route / pair context), refit + scroll to the live edge so the latest
   * candle is aligned like Trade screen — not stuck on early history after OHLC loads.
   */
  chartViewportSnapKey,
  /** Subtle frame hint when price is near stop or target. */
  chartProximity = null,
  /**
   * When true (open position), apply the Live Trade overlay preset once and auto-enable liq when it becomes
   * available unless the user toggled it. Resets to setup (all off) when false. Manual chip toggles while
   * live are tracked per-level until the position closes.
   */
  liveTradeOverlayPreset = false,
  /**
   * When true, the exchange TF row still shows last price + 24h; `liveHeaderMetrics.secondaryLine` (e.g. uPnL)
   * is merged into that left cluster instead of duplicating last in a separate live-metrics band.
   */
  suppressExchangeHeroLivePrice = false,
  /** Strip label when `liveTradeMode` (open position context). */
  liveActivePositionTitle = 'Live position',
  pnlHeaderLabel,
  pnlHeaderTone,
  timeScaleMaxBarSpacingPx,
  chartInnerChromeToggle,
  onSetupFocusBanner,
  /** When true, plot height fills space below header chrome (parent must be a flex column with bounded height). */
  chartPlotFlexFill = false,
  /** Premium zone overlay: exit label when live / AI exit tooling is active. */
  tradePlanExitLabel = 'exit' as 'exit' | 'ai',
  /** When Setup premium zones are on, allow dragging stop/target hit strips (parent updates plan inputs). */
  draggablePlanLevels = false,
  onPlanStopChange,
  onPlanTargetChange,
  onPlanStopDragEnd,
  onPlanTargetDragEnd,
}: {
  model: TradeViewModel;
  market: MarketMode;
  intervalLabel?: string;
  loadingInterval?: boolean;
  liveUpdatedAt?: number;
  heroPairLabel?: string;
  change24hPct?: number;
  /** Fallback desktop height when `chartPlotHeightPx` is not set. */
  chartHeightPx?: number;
  /** When set, timeframe chips render at the top of this panel. */
  timeframeOptions?: { value: TradeChartInterval; label: string }[];
  chartInterval?: TradeChartInterval;
  onChartIntervalChange?: (value: TradeChartInterval) => void;
  chartPlotHeightPx?: number;
  /** Exchange-style layout: caption, large price + 24h delta, underline timeframe tabs (pair title omitted). */
  exchangeStyleHero?: boolean;
  /** e.g. "PERP · Funding +0.010%" (shown beside chart overlay toggles when `exchangeStyleHero`). */
  metaCaption?: string;
  /** When set, parent controls trade overlays: false = hidden, true = entry/stop/target (+ liq on perps). */
  setupMode?: boolean;
  onSetupModeToggle?: () => void;
  /** Prefer this from overlay chips (Clean → show one level): forces Setup on without toggling off if state drifts. */
  onRequestSetupMode?: () => void;
  /** When Setup overlays are on, scales line alpha / entry emphasis from timing chip state. */
  tradeTimingState?: TradeTimingChipState;
  liveTradeMode?: boolean;
  auxiliaryPriceLines?: TradeChartAuxLine[];
  liveHeaderMetrics?: {
    riskPercent: number;
    rewardPercent: number;
    rrRatio: number;
    badge?: string;
    /** Shown next to last price in the exchange TF row when `suppressExchangeHeroLivePrice` (e.g. uPnL). */
    secondaryLine?: string;
    /** uPnL coloring: green / red / muted when flat. */
    secondaryLineTone?: 'positive' | 'negative' | 'neutral';
  };
  liveTradeRefitKey?: string;
  chartViewportSnapKey?: string;
  chartProximity?: 'stop' | 'target' | null;
  liveTradeOverlayPreset?: boolean;
  suppressExchangeHeroLivePrice?: boolean;
  liveActivePositionTitle?: string;
  /** Optional compact PnL line next to live chart price. */
  pnlHeaderLabel?: string;
  pnlHeaderTone?: 'positive' | 'negative' | 'neutral';
  /**
   * When set, limits time-scale bar width so `fitContent()` does not stretch a short history into huge candles
   * (common on desktop bot focus / wide containers).
   */
  timeScaleMaxBarSpacingPx?: number;
  /**
   * Compact control in the exchange-style chart header (next to the live clock): e.g. collapse trade dock or
   * enter/exit bot full-chart mode — same actions as outer chrome, discoverable from inside the chart card.
   */
  chartInnerChromeToggle?: {
    expanded: boolean;
    onToggle: () => void;
    /** `dock` = trade price-chart strip; `immersive` = bot focus full-chart. */
    variant: 'dock' | 'immersive';
  };
  /** Optional banner when setup focus runs (e.g. “Viewing Nova setup”). */
  onSetupFocusBanner?: (label: string) => void;
  chartPlotFlexFill?: boolean;
  tradePlanExitLabel?: 'exit' | 'ai';
  draggablePlanLevels?: boolean;
  onPlanStopChange?: (price: number) => void;
  onPlanTargetChange?: (price: number) => void;
  onPlanStopDragEnd?: (price: number) => void | Promise<void>;
  onPlanTargetDragEnd?: (price: number) => void | Promise<void>;
}) {
  const showTimeframeBar =
    Boolean(timeframeOptions?.length && chartInterval != null && onChartIntervalChange);
  /** Exchange trade header: price/TF row should meet the plot with no extra chrome gap. */
  const exchangeTfHero =
    Boolean(exchangeStyleHero && showTimeframeBar && timeframeOptions && chartInterval != null && onChartIntervalChange);
  /** Bot focus: pull price + TF row down toward the plot; trade dock keeps the tighter `items-end` strip. */
  const immersiveTfHero = exchangeTfHero && chartInnerChromeToggle?.variant === 'immersive';
  const pnlHeaderToneClass =
    pnlHeaderTone === 'positive'
      ? 'text-emerald-300'
      : pnlHeaderTone === 'negative'
        ? 'text-rose-300'
        : 'text-sigflo-muted';
  const showLiquidation = market === 'futures';
  const setupControlled = typeof setupMode === 'boolean';
  /** Latest setup flag for async fade-out (avoid clearing overlays after user re-enters Setup). */
  const setupModeLiveRef = useRef(setupMode === true);
  useEffect(() => {
    setupModeLiveRef.current = setupMode === true;
  }, [setupMode]);
  const prevSetupOnRef = useRef<boolean | undefined>(undefined);
  /** One-shot: animate setup lines in only when entering Setup mode (not when toggling individual levels). */
  const setupFadeInArmRef = useRef(false);
  /** Last timed alpha used for setup lines — so fade-out matches visibility when leaving Setup. */
  const lastSetupAlphaScaleRef = useRef(1);
  const [showVolume, setShowVolume] = useState(true);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | 'flat'>('flat');
  /** Single plot host — fixed height + overflow-hidden; autoSize tracks this element. */
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const [chartPlotMountEl, setChartPlotMountEl] = useState<HTMLDivElement | null>(null);
  const [tradePlanChartGen, setTradePlanChartGen] = useState(0);
  const bindChartPlotEl = useCallback((node: HTMLDivElement | null) => {
    chartContainerRef.current = node;
    setChartPlotMountEl(node);
  }, []);
  /** After pointer down, first move past this threshold disables price autoscale so LC can scroll the Y range. */
  const pricePanPrimedRef = useRef<{ x: number; y: number } | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lineRef = useRef<ISeriesApi<'Line'> | null>(null);
  const volRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  type PriceLineHandle = ReturnType<ISeriesApi<'Candlestick'>['createPriceLine']>;
  const priceLineByKeyRef = useRef<Partial<Record<LevelKey, PriceLineHandle>>>({});
  const auxPriceLineByIdRef = useRef<Record<string, PriceLineHandle>>({});
  /** Which series owns `priceLineByKeyRef` — must match candle vs line fallback in data effect. */
  const priceLineHostModeRef = useRef<'candle' | 'line' | null>(null);
  const [setupFocusPulse, setSetupFocusPulse] = useState(false);
  /** After programmatic setup zoom, block candle refresh from forcing price autoscale. */
  const lockSetupPriceViewportRef = useRef(false);
  const onSetupFocusBannerRef = useRef(onSetupFocusBanner);
  onSetupFocusBannerRef.current = onSetupFocusBanner;
  /** Manage-position hero TF strip: active chip ref for scroll-into-view (narrow widths + overflow-x). */
  const heroTfActiveChipRef = useRef<HTMLButtonElement | null>(null);
  const heroTfScrollRef = useRef<HTMLDivElement | null>(null);

  const [visibleLevels, setVisibleLevels] = useState<Record<LevelKey, boolean>>({
    entry: false,
    stop: false,
    target: false,
    liquidation: false,
  });
  /** Set when leaving Clean via a single overlay chip — next Setup entry shows only that level. */
  const [soloOverlayFromClean, setSoloOverlayFromClean] = useState<LevelKey | null>(null);
  /** Tracks market futures/spot for liq sync (avoid forcing liq on every Setup toggle). */
  const prevShowLiqForSyncRef = useRef(showLiquidation);
  const prevSetupModeForSoloRef = useRef(setupMode);
  const prevLiveOverlayPresetRef = useRef<boolean | undefined>(undefined);
  const liveOverlayTouchedKeysRef = useRef<Set<LevelKey>>(new Set());

  useEffect(() => {
    if (setupControlled && prevSetupModeForSoloRef.current === true && setupMode === false) {
      setSoloOverlayFromClean(null);
    }
    prevSetupModeForSoloRef.current = setupMode;
  }, [setupMode, setupControlled]);

  useLayoutEffect(() => {
    if (!heroPairLabel || !showTimeframeBar) return;
    const strip = heroTfScrollRef.current;
    if (strip) strip.scrollLeft = Math.max(0, strip.scrollWidth - strip.clientWidth);
    heroTfActiveChipRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [heroPairLabel, showTimeframeBar, chartInterval]);

  useEffect(() => {
    if (!setupControlled) return;
    if (!setupMode) {
      prevSetupOnRef.current = false;
      return;
    }
    const wasOn = prevSetupOnRef.current === true;
    prevSetupOnRef.current = true;
    if (wasOn) return;
    setupFadeInArmRef.current = true;

    const solo = soloOverlayFromClean;
    if (solo != null) {
      setSoloOverlayFromClean(null);
      setVisibleLevels({
        entry: solo === 'entry',
        stop: solo === 'stop',
        target: solo === 'target',
        liquidation: solo === 'liquidation' && showLiquidation,
      });
      prevShowLiqForSyncRef.current = showLiquidation;
      return;
    }

    if (liveTradeOverlayPreset) {
      liveOverlayTouchedKeysRef.current.clear();
      setVisibleLevels(buildChartOverlayPresetLive(showLiquidation, model.liquidation));
      prevShowLiqForSyncRef.current = showLiquidation;
      return;
    }

    setVisibleLevels({
      entry: true,
      stop: true,
      target: true,
      liquidation: showLiquidation,
    });
    prevShowLiqForSyncRef.current = showLiquidation;
  }, [setupMode, setupControlled, showLiquidation, soloOverlayFromClean, liveTradeOverlayPreset, model.liquidation]);

  /** Enter / exit live trade: preset overlay toggles; reset touches when the preset boundary changes. */
  useEffect(() => {
    if (!setupControlled) return;
    const prev = prevLiveOverlayPresetRef.current;
    const next = liveTradeOverlayPreset;
    prevLiveOverlayPresetRef.current = next;

    if (next && prev !== true) {
      liveOverlayTouchedKeysRef.current.clear();
      setVisibleLevels(buildChartOverlayPresetLive(showLiquidation, model.liquidation));
      setupFadeInArmRef.current = true;
      prevSetupOnRef.current = true;
      return;
    }
    if (!next && prev === true) {
      liveOverlayTouchedKeysRef.current.clear();
      prevSetupOnRef.current = false;
      // If still in Setup mode, keep entry/stop/target visible instead of blanking to all-off.
      // Without this, levels stay hidden because effect 340's wasOn guard stays true.
      if (setupModeLiveRef.current) {
        setVisibleLevels({ entry: true, stop: true, target: true, liquidation: showLiquidation });
      } else {
        setVisibleLevels(chartOverlayPresetSetupLevels());
      }
      return;
    }
  }, [liveTradeOverlayPreset, setupControlled, showLiquidation, model.liquidation]);

  /** While live: turn liq on when a valid price appears, unless the user already toggled liq. */
  useEffect(() => {
    if (!setupControlled || !setupMode || !liveTradeOverlayPreset) return;
    if (liveOverlayTouchedKeysRef.current.has('liquidation')) return;
    const liqOn =
      showLiquidation &&
      model.liquidation != null &&
      Number.isFinite(model.liquidation) &&
      model.liquidation > 0;
    if (!liqOn) return;
    setVisibleLevels((prev) => (prev.liquidation ? prev : { ...prev, liquidation: true }));
  }, [liveTradeOverlayPreset, model.liquidation, setupControlled, setupMode, showLiquidation]);

  /** Futures ↔ spot: sync liq row visibility unless user overrode liq during live trade. */
  useEffect(() => {
    if (!setupControlled || !setupMode) {
      prevShowLiqForSyncRef.current = showLiquidation;
      return;
    }
    if (prevShowLiqForSyncRef.current === showLiquidation) return;
    prevShowLiqForSyncRef.current = showLiquidation;
    if (liveTradeOverlayPreset && liveOverlayTouchedKeysRef.current.has('liquidation')) {
      return;
    }
    setVisibleLevels((prev) => ({ ...prev, liquidation: showLiquidation }));
  }, [showLiquidation, setupMode, setupControlled, liveTradeOverlayPreset]);

  const visibleLevelKeys = useMemo(
    () =>
      (Object.keys(levelStyles) as LevelKey[])
        .filter((key) => (key === 'liquidation' ? showLiquidation : true))
        .filter((key) => visibleLevels[key]),
    [showLiquidation, visibleLevels],
  );

  const usePremiumTradeZones = setupControlled && setupMode === true;
  /** Must match candle vs line branch below: we draw OHLC whenever `length > 0`, so overlays / price lines must use the same host series. */
  const candlesActiveOverlay = (model.chartCandles?.length ?? 0) > 0;

  const premiumZonesVisible =
    usePremiumTradeZones && (visibleLevels.entry || visibleLevels.stop || visibleLevels.target);

  /** Keep the live last-price line visible; only hide the axis value chip when premium zones are active. */
  useEffect(() => {
    const candle = candleRef.current;
    const line = lineRef.current;
    if (!candle || !line) return;
    const showLastValueOnScale = !premiumZonesVisible;
    candle.applyOptions({ lastValueVisible: showLastValueOnScale, priceLineVisible: true });
    line.applyOptions({ lastValueVisible: showLastValueOnScale, priceLineVisible: true });
  }, [premiumZonesVisible]);

  const useTimedSetupOverlays = setupControlled && setupMode && tradeTimingState != null;
  const setupOverlayVisual = useMemo(() => {
    if (!useTimedSetupOverlays || tradeTimingState == null) {
      return { alphaScale: 1, entryLineExtraWidth: 0 };
    }
    return tradeTimingOverlayVisual(tradeTimingState);
  }, [tradeTimingState, useTimedSetupOverlays]);

  useEffect(() => {
    if (useTimedSetupOverlays) {
      lastSetupAlphaScaleRef.current = setupOverlayVisual.alphaScale;
    }
  }, [useTimedSetupOverlays, setupOverlayVisual.alphaScale]);

  const liveTime = liveUpdatedAt
    ? new Date(liveUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;
  const prevPriceRef = useRef<number>(model.lastPrice);
  /** Avoid full setData + fitContent on every tick; update last bar only when same candle. */
  const candleStructRef = useRef<{ len: number; lastTs: number } | null>(null);
  /** Only auto-fit when pair/interval changes or first paint — not on every new candle (preserves zoom). */
  const chartViewKeyRef = useRef<string>('');
  const didFitContentRef = useRef(false);
  /**
   * Line fallback runs while OHLC is empty (`priceSeries` can still be synthetic). That path sets
   * `didFitContentRef`; when real candles arrive we must refit + `scrollToRealTime` or the viewport
   * stays aligned to the short synthetic series instead of the latest candle.
   */
  const hadOhlcCandlesRef = useRef(false);
  /** Last bar logical index (0-based) for live-edge detection — updated when series data changes. */
  const lastBarLogicalIndexRef = useRef(0);
  /** While true, `subscribeVisibleLogicalRangeChange` ignores updates (programmatic fit/scroll). */
  const programmaticViewportRef = useRef(false);
  /**
   * When true, live ticks skip `scrollToRealTime` (viewport stays put). Set when the user pans away from the
   * live edge, leaves the chart plot (`pointerleave`), or the window blurs; cleared when the viewport is
   * back at the live edge (pan or `pointerenter` resync) or on pair/interval / refit.
   */
  const skipScrollToRealTimeRef = useRef(false);
  /** Line fallback (≤10 candles): avoid `Date.now()` per point — shifting times on every tick resets the x-axis. */
  const lineFallbackAnchorSecRef = useRef(Math.floor(Date.now() / 1000));
  const lineFallbackSeriesLenRef = useRef(-1);

  const runProgrammaticViewport = useCallback((fn: () => void) => {
    programmaticViewportRef.current = true;
    try {
      fn();
    } finally {
      requestAnimationFrame(() => {
        programmaticViewportRef.current = false;
      });
    }
  }, []);

  const handleSetupFocusRef = useRef<(d?: ChartSetupFocusDetail) => void>(() => {});
  handleSetupFocusRef.current = (d) => {
    const pairFilter = d?.pairFilter;
    const botName = d?.botName;
    if (pairFilter) {
      const fa = chartSetupFocusPairBase(pairFilter);
      const fb = chartSetupFocusPairBase(model.pair);
      if (fa && fb && fa !== fb) return;
    }

    onRequestSetupMode?.();

    const entry = model.entry;
    const stop = model.stop;
    const target = model.target;
    const last = model.lastPrice;
    const prices = [entry, stop, target, last].filter(
      (p): p is number => typeof p === 'number' && Number.isFinite(p) && p > 0,
    );
    if (prices.length < 2) return;

    setVisibleLevels((prev) => ({
      ...prev,
      entry: true,
      stop: true,
      target: true,
      liquidation: false,
    }));

    setSetupFocusPulse(true);
    window.setTimeout(() => setSetupFocusPulse(false), 2600);

    const label =
      botName != null && String(botName).trim().length > 0
        ? `Viewing ${String(botName).trim()} setup`
        : 'Viewing setup on chart';
    onSetupFocusBannerRef.current?.(label);

    const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
    const durationMs = 420;

    const startAnim = () => {
      const chart = chartRef.current;
      if (!chart) return;

      const lastIdx = Math.max(0, lastBarLogicalIndexRef.current);
      const targetFromL = Math.max(0, lastIdx - 72);
      const targetToL = lastIdx + 4;

      /**
       * Animate **time** only. Animating the price scale to entry/stop/target can clip candles when those
       * levels sit far from live OHLC (e.g. stale plan vs ~72k spot). Autoscale keeps price + lines in view.
       */
      runProgrammaticViewport(() => {
        try {
          chart.priceScale('right').setAutoScale(true);
        } catch {
          /* ignore */
        }
      });

      requestAnimationFrame(() => {
        const chart2 = chartRef.current;
        if (!chart2) return;
        const ts = chart2.timeScale();
        const lStart = ts.getVisibleLogicalRange();
        const fromL0 = lStart?.from ?? targetFromL;
        const toL0 = lStart?.to ?? targetToL;

        const t0 = performance.now();

        const tick = (now: number) => {
          const c = chartRef.current;
          if (!c) return;
          const tss = c.timeScale();
          const u = Math.min(1, (now - t0) / durationMs);
          const e = easeOutCubic(u);
          const lf = fromL0 + (targetFromL - fromL0) * e;
          const lt = toL0 + (targetToL - toL0) * e;
          const lLo = Math.min(lf, lt);
          const lHi = Math.max(lf, lt);
          try {
            runProgrammaticViewport(() => {
              tss.setVisibleLogicalRange({ from: lLo, to: lHi });
            });
          } catch {
            /* LC may reject degenerate ranges */
          }
          if (u < 1) requestAnimationFrame(tick);
          else skipScrollToRealTimeRef.current = true;
        };
        requestAnimationFrame(tick);
      });
    };

    const tryMount = (attempt: number) => {
      if (!chartRef.current) {
        if (attempt < 20) requestAnimationFrame(() => tryMount(attempt + 1));
        return;
      }
      startAnim();
    };
    requestAnimationFrame(() => tryMount(0));
  };

  useEffect(() => {
    const fn = (e: Event) => {
      const ce = e as CustomEvent<ChartSetupFocusDetail>;
      handleSetupFocusRef.current(ce.detail);
    };
    window.addEventListener(CHART_SETUP_FOCUS_EVENT, fn);
    return () => window.removeEventListener(CHART_SETUP_FOCUS_EVENT, fn);
  }, []);

  /** After full `setData`, restore horizontal zoom when the user had panned off the live edge. */
  function clampVisibleLogicalRange(
    chart: IChartApi,
    saved: { from: number; to: number } | null,
    lastIdx: number,
  ): void {
    if (!saved || lastIdx < 0) return;
    const from = Math.max(0, Math.min(saved.from, lastIdx));
    const to = Math.max(from, Math.min(saved.to, lastIdx));
    if (to - from < 0.2) return;
    chart.timeScale().setVisibleLogicalRange({ from, to });
  }

  /** Latest viewport→skip logic for subscription + pointer handlers (chart mounts in layout effect). */
  const applySkipScrollFromViewportRef = useRef<() => void>(() => {});
  applySkipScrollFromViewportRef.current = () => {
    if (programmaticViewportRef.current) return;
    const chart = chartRef.current;
    if (!chart) return;
    const range = chart.timeScale().getVisibleLogicalRange();
    if (!range) return;
    const lastIdx = lastBarLogicalIndexRef.current;
    if (lastIdx <= 0) {
      skipScrollToRealTimeRef.current = false;
      return;
    }
    const atLiveEdge = range.to >= lastIdx - 0.5;
    skipScrollToRealTimeRef.current = !atLiveEdge;
  };

  const staticLevelPrices = useMemo(
    () =>
      ({
        entry: model.entry,
        stop: model.stop,
        target: model.target,
        liquidation: model.liquidation,
      }) as const,
    [model.entry, model.liquidation, model.stop, model.target],
  );

  useLayoutEffect(() => {
    const el = chartContainerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: '#0c0c0f' },
        textColor: 'rgba(148,163,184,0.9)',
        /** Drives time + price scale label metrics (shared by lightweight-charts). */
        fontSize: 12,
        /** Hides bottom-left TV mark so custom trade labels (e.g. Stop) are not covered. Keep attribution in app docs if required by license. */
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.03)' },
        horzLines: { color: 'rgba(255,255,255,0.06)' },
      },
      /** Default is Magnet/MagnetOHLC — snaps to bar OHLC; Normal follows the cursor. */
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.12)',
        /** LC default is `{ top: 0.2, bottom: 0.1 }`. Tighter bottom keeps time labels snug; top must stay ≥ default or highs/wicks clip under `overflow-hidden`. */
        scaleMargins: { top: 0.26, bottom: 0.02 },
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.12)',
        rightOffset: 1,
        borderVisible: false,
        /** Default is false: intraday ticks use day-of-month only → "4" repeated on one calendar day. */
        timeVisible: true,
        secondsVisible: false,
        allowBoldLabels: false,
        tickMarkFormatter: formatTimeScaleTick,
        ...(typeof timeScaleMaxBarSpacingPx === 'number' &&
        Number.isFinite(timeScaleMaxBarSpacingPx) &&
        timeScaleMaxBarSpacingPx > 0
          ? { maxBarSpacing: timeScaleMaxBarSpacingPx }
          : {}),
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
      /** Touch: exit crosshair/inspect mode on lift so the next gesture can pan/zoom without an extra tap. */
      trackingMode: { exitMode: TrackingModeExitMode.OnTouchEnd },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#34d399',
      downColor: '#f87171',
      borderUpColor: '#34d399',
      borderDownColor: '#f87171',
      wickUpColor: '#34d399',
      wickDownColor: '#f87171',
      lastValueVisible: true,
      priceLineVisible: true,
      /** LC default is dashed — reads as “dotted” under HTML trade overlays when last ≈ entry. */
      priceLineStyle: LineStyle.Solid,
    });
    const lineSeries = chart.addSeries(LineSeries, {
      color: '#22d3ee',
      lineWidth: 2,
      crosshairMarkerVisible: false,
      lastValueVisible: true,
      priceLineVisible: true,
      priceLineStyle: LineStyle.Solid,
    });
    const volSeries = chart.addSeries(HistogramSeries, {
      priceScaleId: '',
      priceFormat: { type: 'volume' },
      lastValueVisible: false,
      priceLineVisible: false,
    });
    /** Larger `top` = thinner volume band at bottom of pane (frees height for candles + time row feels shorter). */
    volSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.91, bottom: 0 },
    });

    chartRef.current = chart;
    candleRef.current = candleSeries;
    lineRef.current = lineSeries;
    volRef.current = volSeries;
    setTradePlanChartGen((g) => g + 1);

    const onVisibleLogicalRangeChange = () => applySkipScrollFromViewportRef.current();

    const timeScale = chart.timeScale();
    timeScale.subscribeVisibleLogicalRangeChange(onVisibleLogicalRangeChange);

    return () => {
      timeScale.unsubscribeVisibleLogicalRangeChange(onVisibleLogicalRangeChange);
      priceLineByKeyRef.current = {};
      auxPriceLineByIdRef.current = {};
      priceLineHostModeRef.current = null;
      chartViewKeyRef.current = '';
      didFitContentRef.current = false;
      candleStructRef.current = null;
      skipScrollToRealTimeRef.current = false;
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      lineRef.current = null;
      volRef.current = null;
    };
  }, [timeScaleMaxBarSpacingPx]);

  /** Keep LC in sync with the plot box — `chartPlotHeightPx` uses CSS `transition` on height; a one-shot effect
   * often read stale `clientHeight`. ResizeObserver + rAF resizes after layout and through the transition. */
  useLayoutEffect(() => {
    const el = chartContainerRef.current;
    if (!el || !chartRef.current) return;

    let raf = 0;
    const fit = () => {
      if (raf !== 0) cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const chart = chartRef.current;
        if (!chart) return;
        const w = Math.max(1, Math.round(el.clientWidth));
        const h = Math.max(1, Math.round(el.clientHeight));
        chart.resize(w, h);
      });
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => {
      ro.disconnect();
      if (raf !== 0) window.cancelAnimationFrame(raf);
    };
  }, []);

  /** Stop live auto-scroll when focus leaves the page (e.g. another tab) — same as leaving the chart. */
  useEffect(() => {
    const onBlur = () => {
      skipScrollToRealTimeRef.current = true;
    };
    window.addEventListener('blur', onBlur);
    return () => window.removeEventListener('blur', onBlur);
  }, []);

  useEffect(() => {
    const candleSeries = candleRef.current;
    const lineSeries = lineRef.current;
    const volSeries = volRef.current;
    if (!candleSeries || !lineSeries || !volSeries) return;

    const viewKey = `${model.pair}|${intervalLabel ?? ''}`;
    if (chartViewKeyRef.current !== viewKey) {
      chartViewKeyRef.current = viewKey;
      didFitContentRef.current = false;
      candleStructRef.current = null;
      skipScrollToRealTimeRef.current = false;
      lineFallbackSeriesLenRef.current = -1;
      lockSetupPriceViewportRef.current = false;
      hadOhlcCandlesRef.current = false;
    }

    const candles = model.chartCandles ?? [];
    if (candles.length === 0) {
      hadOhlcCandlesRef.current = false;
    } else if (!hadOhlcCandlesRef.current) {
      hadOhlcCandlesRef.current = true;
      didFitContentRef.current = false;
    }

    if (candles.length > 0) {
      lineFallbackSeriesLenRef.current = -1;
      const last = candles[candles.length - 1];
      const struct = candleStructRef.current;
      const sameCandle =
        last &&
        struct &&
        struct.len === candles.length &&
        struct.lastTs === last.ts;

      lastBarLogicalIndexRef.current = Math.max(0, candles.length - 1);

      if (sameCandle && last) {
        const t = toUtcTime(last.ts) as Time;
        candleSeries.update({
          time: t,
          open: last.open,
          high: last.high,
          low: last.low,
          close: last.close,
        });
        volSeries.update({
          time: t,
          value: last.volume ?? 0,
          color: last.close >= last.open ? 'rgba(52,211,153,0.30)' : 'rgba(248,113,113,0.30)',
        });
        // Intrabar OHLC updates share the same logical index — do not scroll; avoids viewport drift / “resets”.
      } else {
        const chart = chartRef.current;
        const ts = chart?.timeScale();
        const preserveViewport = skipScrollToRealTimeRef.current;
        const savedLogical =
          preserveViewport && chart && ts ? ts.getVisibleLogicalRange() : null;
        const lastIdx = Math.max(0, candles.length - 1);

        runProgrammaticViewport(() => {
          /** Set before `setData` so `subscribeVisibleLogicalRangeChange` sees the correct live index. */
          lastBarLogicalIndexRef.current = lastIdx;
          candleSeries.setData(
            candles.map((c) => ({
              time: toUtcTime(c.ts) as Time,
              open: c.open,
              high: c.high,
              low: c.low,
              close: c.close,
            })),
          );
          volSeries.setData(
            candles.map((c) => ({
              time: toUtcTime(c.ts) as Time,
              value: c.volume ?? 0,
              color: c.close >= c.open ? 'rgba(52,211,153,0.30)' : 'rgba(248,113,113,0.30)',
            })),
          );
          lineSeries.setData([]);
          if (last) {
            candleStructRef.current = { len: candles.length, lastTs: last.ts };
          }
          if (!didFitContentRef.current) {
            ts?.fitContent();
            if (
              ts &&
              typeof timeScaleMaxBarSpacingPx === 'number' &&
              Number.isFinite(timeScaleMaxBarSpacingPx) &&
              timeScaleMaxBarSpacingPx > 0
            ) {
              ts.applyOptions({ maxBarSpacing: timeScaleMaxBarSpacingPx });
            }
            didFitContentRef.current = true;
            if (!preserveViewport && !lockSetupPriceViewportRef.current) {
              chart?.priceScale('right').setAutoScale(true);
            }
            if (!preserveViewport && !skipScrollToRealTimeRef.current) {
              ts?.scrollToRealTime();
            }
          } else if (preserveViewport && savedLogical != null && chart) {
            clampVisibleLogicalRange(chart, savedLogical, lastIdx);
            requestAnimationFrame(() => {
              applySkipScrollFromViewportRef.current();
            });
          } else if (!skipScrollToRealTimeRef.current) {
            ts?.scrollToRealTime();
            if (!lockSetupPriceViewportRef.current) {
              chart?.priceScale('right').setAutoScale(true);
            }
          }
        });
      }
    } else {
      candleStructRef.current = null;
      const chart = chartRef.current;
      const ts = chart?.timeScale();

      const base = model.lastPrice;
      const plen = model.priceSeries.length;
      if (plen !== lineFallbackSeriesLenRef.current) {
        lineFallbackSeriesLenRef.current = plen;
        lineFallbackAnchorSecRef.current = Math.floor(Date.now() / 1000);
      }
      const anchorSec = lineFallbackAnchorSecRef.current;
      const series = model.priceSeries.map((v, i) => ({
        time: (anchorSec - (plen - i) * 60) as Time,
        value: base * (0.985 + v * 0.03),
      }));
      lastBarLogicalIndexRef.current = Math.max(0, series.length - 1);

      const lineIsUp =
        series.length >= 2 ? series[series.length - 1].value >= series[0].value : model.lastPrice >= prevPriceRef.current;
      lineSeries.applyOptions({
        color: lineIsUp ? '#34d399' : '#fb7185',
      });
      const preserveViewport = skipScrollToRealTimeRef.current;
      const savedLogical =
        preserveViewport && chart && ts ? ts.getVisibleLogicalRange() : null;
      const lastIdxLine = Math.max(0, series.length - 1);
      runProgrammaticViewport(() => {
        lastBarLogicalIndexRef.current = lastIdxLine;
        lineSeries.setData(series);
        candleSeries.setData([]);
        volSeries.setData([]);
        if (!didFitContentRef.current) {
          ts?.fitContent();
          if (
            ts &&
            typeof timeScaleMaxBarSpacingPx === 'number' &&
            Number.isFinite(timeScaleMaxBarSpacingPx) &&
            timeScaleMaxBarSpacingPx > 0
          ) {
            ts.applyOptions({ maxBarSpacing: timeScaleMaxBarSpacingPx });
          }
          didFitContentRef.current = true;
          if (!preserveViewport && !lockSetupPriceViewportRef.current) {
            chart?.priceScale('right').setAutoScale(true);
          }
          if (!preserveViewport && !skipScrollToRealTimeRef.current) {
            ts?.scrollToRealTime();
          }
        } else if (preserveViewport && savedLogical != null && chart) {
          clampVisibleLogicalRange(chart, savedLogical, lastIdxLine);
          requestAnimationFrame(() => {
            applySkipScrollFromViewportRef.current();
          });
        } else if (!skipScrollToRealTimeRef.current) {
          ts?.scrollToRealTime();
          if (!lockSetupPriceViewportRef.current) {
            chart?.priceScale('right').setAutoScale(true);
          }
        }
      });
    }
  }, [
    intervalLabel,
    model.chartCandles,
    model.lastPrice,
    model.pair,
    model.priceSeries,
    runProgrammaticViewport,
    timeScaleMaxBarSpacingPx,
  ]);

  useEffect(() => {
    const prev = prevPriceRef.current;
    if (model.lastPrice > prev) setPriceDirection('up');
    else if (model.lastPrice < prev) setPriceDirection('down');
    else setPriceDirection('flat');
    prevPriceRef.current = model.lastPrice;
  }, [model.lastPrice]);

  useEffect(() => {
    const candleSeries = candleRef.current;
    const lineSeries = lineRef.current;
    if (!candleSeries || !lineSeries) return;

    const candlesActive = (model.chartCandles?.length ?? 0) > 0;
    const host = candlesActive ? candleSeries : lineSeries;
    const nextHostMode: 'candle' | 'line' = candlesActive ? 'candle' : 'line';
    const prevMode = priceLineHostModeRef.current;
    if (prevMode != null && prevMode !== nextHostMode) {
      const oldHost = prevMode === 'candle' ? candleSeries : lineSeries;
      for (const key of Object.keys(priceLineByKeyRef.current) as LevelKey[]) {
        const pl = priceLineByKeyRef.current[key];
        if (pl) oldHost.removePriceLine(pl);
        delete priceLineByKeyRef.current[key];
      }
      for (const id of Object.keys(auxPriceLineByIdRef.current)) {
        const pl = auxPriceLineByIdRef.current[id];
        if (pl) oldHost.removePriceLine(pl);
        delete auxPriceLineByIdRef.current[id];
      }
    }
    priceLineHostModeRef.current = nextHostMode;

    const want = new Set(visibleLevelKeys);
    for (const key of Object.keys(priceLineByKeyRef.current) as LevelKey[]) {
      if (!want.has(key)) {
        const line = priceLineByKeyRef.current[key];
        if (line) host.removePriceLine(line);
        delete priceLineByKeyRef.current[key];
      }
    }

    const strokeFor = (key: LevelKey) => {
      const style = levelStyles[key];
      if (usePremiumTradeZones && key === 'stop') return '#fecaca';
      if (usePremiumTradeZones && key === 'entry') return 'rgba(45,212,191,0.95)';
      if (usePremiumTradeZones && key === 'target') return 'rgba(74,222,128,0.88)';
      if (useTimedSetupOverlays) {
        const a = tradeTimingLineAlpha(key, setupOverlayVisual.alphaScale);
        return hexToRgba(style.stroke, a);
      }
      if (setupFocusPulse && (key === 'entry' || key === 'stop' || key === 'target')) {
        return hexToRgba(style.stroke, 0.95);
      }
      return style.stroke;
    };
    const widthFor = (key: LevelKey): 1 | 2 | 3 | 4 => {
      if (usePremiumTradeZones && (key === 'entry' || key === 'stop' || key === 'target')) {
        if (key === 'stop') return 4;
        if (key === 'entry') return 2;
        return 1;
      }
      if (setupFocusPulse && (key === 'entry' || key === 'stop' || key === 'target')) {
        return (key === 'entry' ? 3 : 2) as 1 | 2 | 3 | 4;
      }
      if (key !== 'entry') return 1;
      const w = 2 + (useTimedSetupOverlays ? setupOverlayVisual.entryLineExtraWidth : 0);
      return (w <= 4 ? w : 4) as 1 | 2 | 3 | 4;
    };

    for (const key of visibleLevelKeys) {
      const style = levelStyles[key];
      const price = staticLevelPrices[key];
      if (!Number.isFinite(price) || price <= 0) {
        const ghost = priceLineByKeyRef.current[key];
        if (ghost) {
          host.removePriceLine(ghost);
          delete priceLineByKeyRef.current[key];
        }
        continue;
      }
      const existing = priceLineByKeyRef.current[key];
      const premiumPlan = usePremiumTradeZones && key !== 'liquidation';
      /** Native LC lines sit under `TradePlanZonesOverlay`; hiding them avoids a thin “dotted” double line under the HTML bars. */
      const lineVisible = !premiumPlan;
      if (existing) {
        existing.applyOptions({
          price,
          color: strokeFor(key),
          lineWidth: widthFor(key),
          lineStyle: LineStyle.Solid,
          lineVisible,
          title: premiumPlan ? '' : style.label,
          axisLabelVisible: !premiumPlan,
        });
      } else {
        priceLineByKeyRef.current[key] = host.createPriceLine({
          price,
          color: strokeFor(key),
          lineWidth: widthFor(key),
          lineStyle: LineStyle.Solid,
          lineVisible,
          axisLabelVisible: !premiumPlan,
          title: premiumPlan ? '' : style.label,
        });
      }
    }
  }, [
    model.chartCandles,
    staticLevelPrices,
    visibleLevelKeys,
    useTimedSetupOverlays,
    setupOverlayVisual,
    setupFocusPulse,
    usePremiumTradeZones,
  ]);

  useEffect(() => {
    const candleSeries = candleRef.current;
    const lineSeries = lineRef.current;
    if (!candleSeries || !lineSeries) return;

    const candlesActive = (model.chartCandles?.length ?? 0) > 0;
    const host = candlesActive ? candleSeries : lineSeries;

    const want = new Map((auxiliaryPriceLines ?? []).filter((a) => Number.isFinite(a.price) && a.price > 0).map((a) => [a.id, a]));
    for (const id of Object.keys(auxPriceLineByIdRef.current)) {
      if (!want.has(id)) {
        const pl = auxPriceLineByIdRef.current[id];
        if (pl) host.removePriceLine(pl);
        delete auxPriceLineByIdRef.current[id];
      }
    }
    for (const aux of want.values()) {
      const existing = auxPriceLineByIdRef.current[aux.id];
      if (existing) {
        existing.applyOptions({
          price: aux.price,
          color: aux.color,
          title: aux.title,
        });
      } else {
        auxPriceLineByIdRef.current[aux.id] = host.createPriceLine({
          price: aux.price,
          color: aux.color,
          lineWidth: 1,
          axisLabelVisible: true,
          title: aux.title,
        });
      }
    }
  }, [auxiliaryPriceLines, model.chartCandles, model.lastPrice]);

  const viewportRefitSeenKeyRef = useRef<string | undefined>(undefined);
  const viewportRefitCompositeKey = [liveTradeRefitKey, chartViewportSnapKey].filter(
    (k): k is string => typeof k === 'string' && k.length > 0,
  ).join('\u0000');

  useEffect(() => {
    if (!viewportRefitCompositeKey) {
      viewportRefitSeenKeyRef.current = undefined;
      return;
    }
    if (viewportRefitSeenKeyRef.current === viewportRefitCompositeKey) return;
    viewportRefitSeenKeyRef.current = viewportRefitCompositeKey;
    didFitContentRef.current = false;
    skipScrollToRealTimeRef.current = false;
    lockSetupPriceViewportRef.current = false;
    const id = window.requestAnimationFrame(() => {
      const chart = chartRef.current;
      if (!chart) return;
      runProgrammaticViewport(() => {
        const ts = chart.timeScale();
        ts.fitContent();
        if (
          typeof timeScaleMaxBarSpacingPx === 'number' &&
          Number.isFinite(timeScaleMaxBarSpacingPx) &&
          timeScaleMaxBarSpacingPx > 0
        ) {
          ts.applyOptions({ maxBarSpacing: timeScaleMaxBarSpacingPx });
        }
        didFitContentRef.current = true;
        chart.priceScale('right').setAutoScale(true);
        ts.scrollToRealTime();
      });
    });
    return () => window.cancelAnimationFrame(id);
  }, [viewportRefitCompositeKey, runProgrammaticViewport, timeScaleMaxBarSpacingPx]);

  useEffect(() => {
    if (!setupControlled || setupMode) return;

    const setupKeys = (
      ['entry', 'stop', 'target', ...(showLiquidation ? (['liquidation'] as const) : [])] as LevelKey[]
    ).filter((k) => priceLineByKeyRef.current[k]);

    const easeOut = (t: number) => 1 - (1 - t) * (1 - t);

    if (setupKeys.length === 0) {
      setVisibleLevels((p) => ({
        ...p,
        entry: false,
        stop: false,
        target: false,
        liquidation: false,
      }));
      return;
    }

    let raf = 0;
    let cancelled = false;
    const start = performance.now();

    const cap = lastSetupAlphaScaleRef.current;
    const step = (now: number) => {
      if (cancelled) return;
      const p = Math.min(1, (now - start) / SETUP_LINE_ANIM_MS);
      const alpha = easeOut(1 - p) * cap;
      for (const key of setupKeys) {
        const line = priceLineByKeyRef.current[key];
        if (line) line.applyOptions({ color: hexToRgba(levelStyles[key].stroke, alpha) });
      }
      if (p < 1) {
        raf = requestAnimationFrame(step);
      } else if (!setupModeLiveRef.current) {
        setVisibleLevels((prev) => ({
          ...prev,
          entry: false,
          stop: false,
          target: false,
          liquidation: false,
        }));
      }
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [setupMode, showLiquidation, setupControlled]);

  useEffect(() => {
    if (!setupControlled || !setupMode) return;
    if (!setupFadeInArmRef.current) return;

    const keys = (
      ['entry', 'stop', 'target', ...(showLiquidation ? (['liquidation'] as const) : [])] as LevelKey[]
    ).filter((k) => visibleLevels[k]);

    if (keys.length === 0) return;

    setupFadeInArmRef.current = false;

    let cancelled = false;
    let raf = 0;
    const easeOut = (t: number) => 1 - (1 - t) * (1 - t);
    const cap = useTimedSetupOverlays ? setupOverlayVisual.alphaScale : 1;

    const run = () => {
      for (const key of keys) {
        const line = priceLineByKeyRef.current[key];
        if (line) line.applyOptions({ color: hexToRgba(levelStyles[key].stroke, 0) });
      }
      const start = performance.now();
      const step = (now: number) => {
        if (cancelled) return;
        const p = Math.min(1, (now - start) / SETUP_LINE_ANIM_MS);
        const t = easeOut(p);
        for (const key of keys) {
          const line = priceLineByKeyRef.current[key];
          if (line) {
            const stroke = levelStyles[key].stroke;
            const peak = !useTimedSetupOverlays ? 1 : tradeTimingLineAlpha(key, cap);
            line.applyOptions({ color: hexToRgba(stroke, t * peak) });
          }
        }
        if (p < 1) {
          raf = requestAnimationFrame(step);
        } else {
          for (const key of keys) {
            const line = priceLineByKeyRef.current[key];
            if (line) {
              const stroke = levelStyles[key].stroke;
              const endAlpha = !useTimedSetupOverlays ? 1 : tradeTimingLineAlpha(key, cap);
              line.applyOptions({
                color: !useTimedSetupOverlays ? stroke : hexToRgba(stroke, endAlpha),
              });
            }
          }
        }
      };
      raf = requestAnimationFrame(step);
    };

    const id = requestAnimationFrame(() => requestAnimationFrame(run));
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(id);
    };
  }, [
    setupMode,
    visibleLevelKeys,
    showLiquidation,
    setupControlled,
    useTimedSetupOverlays,
    setupOverlayVisual.alphaScale,
  ]);

  useEffect(() => {
    const vol = volRef.current;
    if (!vol) return;
    vol.applyOptions({ visible: showVolume });
  }, [showVolume]);

  const change =
    change24hPct != null && Number.isFinite(change24hPct) ? change24hPct : model.change24hPct ?? 0;
  const changeClass = change >= 0 ? 'text-emerald-400' : 'text-rose-400';
  const abs24hUsd =
    change !== 0 && Number.isFinite(model.lastPrice) ? (model.lastPrice * change) / (100 + change) : 0;
  const abs24hFmt = formatQuoteNumber(Math.abs(abs24hUsd));

  const marketTag =
    market === 'spot'
      ? `Spot${showTimeframeBar ? '' : ` · ${intervalLabel ?? '5m'}`}`
      : showTimeframeBar
        ? null
        : (intervalLabel ?? '5m');

  const perpTimeCluster = (
    <span className="inline-flex shrink-0 flex-col items-end gap-0 leading-none">
      {marketTag ? (
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sigflo-muted/90 md:text-[11px]">
          {marketTag}
        </span>
      ) : null}
      {liveTime ? (
        <span className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-200/90 md:text-[11px]">
          <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-emerald-300" />
          <span className="tabular-nums leading-tight">{liveTime}</span>
        </span>
      ) : null}
      {loadingInterval ? (
        <span className="mt-0.5 inline-flex h-3 w-3 items-center justify-center rounded-full border border-cyan-400/35 bg-cyan-500/10 text-cyan-200">
          <svg viewBox="0 0 24 24" className="h-2 w-2 animate-spin" fill="none" aria-label="Loading interval">
            <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" opacity="0.35" />
            <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
      ) : null}
    </span>
  );

  /** Clean mode: overlay chips still click — first tap turns on Setup so levels can render. */
  const setupGated = setupControlled && !setupMode;

  const chartFrameToneClass =
    chartProximity === 'stop'
      ? 'shadow-[inset_0_0_20px_-8px_rgba(248,113,113,0.35)]'
      : chartProximity === 'target'
        ? 'shadow-[inset_0_0_20px_-8px_rgba(74,222,128,0.22)]'
        : '';

  const showPairTfHero =
    Boolean(heroPairLabel) &&
    showTimeframeBar &&
    Boolean(timeframeOptions && chartInterval != null && onChartIntervalChange);
  /**
   * Price + TF header rows render inside the chart panel (not in the padded card body) so quotes sit flush
   * above the plot — applies to the trade dock (`exchangeStyleHero`) and manage (`heroPairLabel`) charts.
   */
  const headerDockedInPlotPanel =
    showTimeframeBar && (exchangeStyleHero || Boolean(heroPairLabel));

  /** Manage dock: show Stop/Tgt/R:R in the header above TF chips instead of on the plot (clears scale clutter). */
  const dockTradePlanCornerStatsInHeader =
    premiumZonesVisible && headerDockedInPlotPanel && !exchangeStyleHero && Boolean(heroPairLabel);

  const pairTfHeroTfChips = (
    <div
      ref={heroTfScrollRef}
      className="flex min-w-0 max-w-full justify-end overflow-x-auto overscroll-x-contain py-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden touch-pan-x"
    >
      <div className="inline-flex min-w-max shrink-0 items-center gap-1 sm:gap-1.5">
        <span className="hidden shrink-0 text-[8px] font-semibold uppercase tracking-[0.14em] text-sigflo-muted/80 sm:inline sm:text-[9px] md:text-[10px]">
          TF
        </span>
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          {timeframeOptions!.map((intv) => (
            <button
              key={intv.value}
              ref={chartInterval === intv.value ? heroTfActiveChipRef : undefined}
              type="button"
              onClick={() => onChartIntervalChange!(intv.value)}
              className={`shrink-0 rounded-md px-1.5 py-1 text-[9px] font-bold leading-none transition sm:px-2 sm:py-1.5 sm:text-[10px] md:px-2.5 md:text-[11px] ${
                chartInterval === intv.value
                  ? 'bg-sigflo-accent/18 text-sigflo-accent ring-1 ring-inset ring-sigflo-accent/35'
                  : 'border border-white/[0.06] bg-white/[0.04] text-sigflo-muted hover:border-white/[0.1] hover:text-sigflo-text'
              }`}
            >
              {intv.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const pairTfHeroTfStrip = (
    <div className="order-last flex w-full min-w-0 justify-end border-t border-white/[0.06] pt-1">
      {pairTfHeroTfChips}
    </div>
  );

  const pairTfHeroQuoteCluster = (
    <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-1.5 gap-y-0 leading-tight md:gap-x-2">
      <h2 className="max-w-[min(100%,40vw)] truncate text-xs font-bold tracking-tight text-white sm:max-w-[12rem] md:max-w-none md:text-xl">
        {heroPairLabel}
      </h2>
      <span
        className={`shrink-0 text-sm font-bold tabular-nums leading-none transition-colors md:text-2xl ${
          priceDirection === 'up' ? 'text-emerald-200' : priceDirection === 'down' ? 'text-rose-200' : 'text-white'
        }`}
      >
        {formatQuoteUsd(model.lastPrice)}
      </span>
      <span className={`shrink-0 text-[10px] font-bold tabular-nums leading-none md:text-sm ${changeClass}`}>
        {change >= 0 ? '+' : ''}
        {change.toFixed(2)}%
      </span>
    </div>
  );

  const pairTfHeroQuoteRow = (
    <div
      className={`flex w-full min-w-0 items-start justify-between gap-2 ${
        headerDockedInPlotPanel ? 'shrink-0 py-1' : 'pt-0'
      }`}
    >
      {pairTfHeroQuoteCluster}
      {dockTradePlanCornerStatsInHeader ? null : (
        <div className="shrink-0 border-l border-white/[0.08] pl-1.5 md:pl-2">{perpTimeCluster}</div>
      )}
    </div>
  );

  /** Manage dock + premium zones: pair / price / % on the same row as Stop·Tgt·R:R and live time. */
  const pairTfHeroDockedQuoteStatsTimeRow = (
    <div className="flex w-full min-w-0 shrink-0 items-start justify-between gap-2 py-1">
      {pairTfHeroQuoteCluster}
      <div className="flex shrink-0 items-start justify-end gap-2">
        <div className="pointer-events-none shrink-0">
          <TradePlanCornerStats
            entry={model.entry}
            stop={model.stop}
            target={model.target}
            lastPrice={model.lastPrice}
            riskReward={model.riskReward}
            className="max-w-[min(100%,11rem)] shrink-0"
          />
        </div>
        <div className="pointer-events-none shrink-0">{perpTimeCluster}</div>
      </div>
    </div>
  );

  const pairTfHeroPnlRow =
    pnlHeaderLabel != null && pnlHeaderLabel !== '' ? (
      <div className={`flex w-full min-w-0 ${headerDockedInPlotPanel ? 'shrink-0 pb-1 pt-0' : ''}`}>
        <p
          className={`max-w-full truncate text-[9px] font-semibold tabular-nums leading-tight sm:text-[10px] md:text-[11px] ${pnlHeaderToneClass}`}
        >
          {pnlHeaderLabel}
        </p>
      </div>
    ) : null;

  /** Manage dock: PnL + TF chips share one row above the plot. */
  const pairTfHeroDockedPnlTfRow = (
    <div className="flex w-full min-w-0 shrink-0 items-center justify-between gap-2 py-1">
      <div className="min-w-0 flex-1">
        {pnlHeaderLabel != null && pnlHeaderLabel !== '' ? (
          <p
            className={`max-w-full truncate text-[9px] font-semibold tabular-nums leading-tight sm:text-[10px] md:text-[11px] ${pnlHeaderToneClass}`}
          >
            {pnlHeaderLabel}
          </p>
        ) : null}
      </div>
      <div className="flex min-w-0 max-w-[min(100%,11.5rem)] shrink-0 items-center sm:max-w-[min(100%,16rem)] md:max-w-none">
        {pairTfHeroTfChips}
      </div>
      {chartInnerChromeToggle && !exchangeStyleHero ? (
        <button
          type="button"
          onClick={chartInnerChromeToggle.onToggle}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/[0.12] bg-white/[0.05] text-sigflo-muted transition hover:border-cyan-400/35 hover:text-cyan-100 active:scale-[0.97] md:h-7 md:w-7"
          aria-label={
            chartInnerChromeToggle.variant === 'immersive'
              ? chartInnerChromeToggle.expanded
                ? 'Exit full chart'
                : 'Expand to full chart'
              : chartInnerChromeToggle.expanded
                ? 'Minimize chart'
                : 'Maximize chart'
          }
          title={
            chartInnerChromeToggle.variant === 'immersive'
              ? chartInnerChromeToggle.expanded
                ? 'Exit full chart'
                : 'Full chart'
              : chartInnerChromeToggle.expanded
                ? 'Minimize chart'
                : 'Maximize chart'
          }
        >
          {chartInnerChromeToggle.variant === 'immersive' ? (
            chartInnerChromeToggle.expanded ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="md:h-4 md:w-4" aria-hidden>
                <path
                  d="M9 9H5V5M15 9h4V5M9 15H5v4M15 15h4v4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="md:h-4 md:w-4" aria-hidden>
                <path
                  d="M9 3H5a2 2 0 00-2 2v4M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h4m8 0h4a2 2 0 002-2v-3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )
          ) : chartInnerChromeToggle.expanded ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="md:h-4 md:w-4" aria-hidden>
              <path
                d="M9 9H5V5M15 9h4V5M9 15H5v4M15 15h4v4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="md:h-4 md:w-4" aria-hidden>
              <path
                d="M9 3H5a2 2 0 00-2 2v4M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h4m8 0h4a2 2 0 002-2v-3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      ) : null}
    </div>
  );

  const pairTfHeroContent = showPairTfHero ? (
    <div
      className={`flex w-full min-w-0 flex-col border-b border-[#00ffc8]/28 ${
        headerDockedInPlotPanel
          ? 'shrink-0 divide-y divide-[#00ffc8]/18 px-[4.5px] pb-0 pt-1 md:px-[5.5px] md:pt-1.5'
          : 'mb-0 gap-0 pb-px md:gap-0.5 md:pb-0.5'
      }`}
    >
      {headerDockedInPlotPanel ? (
        <>
          {dockTradePlanCornerStatsInHeader ? pairTfHeroDockedQuoteStatsTimeRow : pairTfHeroQuoteRow}
          {pairTfHeroDockedPnlTfRow}
        </>
      ) : (
        <>
          {pairTfHeroTfStrip}
          {pairTfHeroQuoteRow}
          {pairTfHeroPnlRow}
        </>
      )}
    </div>
  ) : null;

  const showExchangeTfHeader =
    exchangeStyleHero &&
    showTimeframeBar &&
    Boolean(timeframeOptions && chartInterval != null && onChartIntervalChange);

  /** Trade dock: one bar above the plot — price/PnL left, TF + chrome right. */
  const exchangeTfHeaderSingleRowDocked = headerDockedInPlotPanel && !immersiveTfHero;

  const exchangeTfControlsRow = (
    <div
      className={`${exchangeTfHeaderSingleRowDocked ? '' : 'ml-auto '}flex min-w-0 max-w-full shrink-0 items-end justify-end gap-x-1 gap-y-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:gap-x-1.5 md:gap-y-1`}
    >
      <div className="flex w-max shrink-0 flex-nowrap items-end justify-end gap-1 md:gap-1.5">
        {timeframeOptions!.map((intv) => (
          <button
            key={intv.value}
            type="button"
            onClick={() => onChartIntervalChange!(intv.value)}
            className={`shrink-0 rounded px-[6px] py-[3px] text-[8px] font-medium uppercase leading-none tracking-wide transition md:px-2 md:py-1 md:text-[9px] ${
              chartInterval === intv.value
                ? 'bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-400/25'
                : 'bg-white/[0.04] text-sigflo-muted hover:bg-white/[0.07] hover:text-sigflo-text'
            }`}
          >
            {intv.label}
          </button>
        ))}
      </div>
      {onSetupModeToggle ? (
        <div className="shrink-0">
          <SetupToggle isActive={setupMode === true} onToggle={onSetupModeToggle} />
        </div>
      ) : null}
      <span className="h-3 w-px shrink-0 bg-white/[0.12]" aria-hidden />
      <div className="flex shrink-0 items-end pb-px">{perpTimeCluster}</div>
      {chartInnerChromeToggle ? (
        <button
          type="button"
          onClick={chartInnerChromeToggle.onToggle}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/[0.12] bg-white/[0.05] text-sigflo-muted transition hover:border-cyan-400/35 hover:text-cyan-100 active:scale-[0.97] md:h-7 md:w-7"
          aria-label={
            chartInnerChromeToggle.variant === 'immersive'
              ? chartInnerChromeToggle.expanded
                ? 'Exit full chart'
                : 'Expand to full chart'
              : chartInnerChromeToggle.expanded
                ? 'Minimize chart'
                : 'Maximize chart'
          }
          title={
            chartInnerChromeToggle.variant === 'immersive'
              ? chartInnerChromeToggle.expanded
                ? 'Exit full chart'
                : 'Full chart'
              : chartInnerChromeToggle.expanded
                ? 'Minimize chart'
                : 'Maximize chart'
          }
        >
          {chartInnerChromeToggle.variant === 'immersive' ? (
            chartInnerChromeToggle.expanded ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="md:h-4 md:w-4" aria-hidden>
                <path
                  d="M9 9H5V5M15 9h4V5M9 15H5v4M15 15h4v4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="md:h-4 md:w-4" aria-hidden>
                <path
                  d="M9 3H5a2 2 0 00-2 2v4M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h4m8 0h4a2 2 0 002-2v-3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )
          ) : chartInnerChromeToggle.expanded ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="md:h-4 md:w-4" aria-hidden>
              <path
                d="M9 9H5V5M15 9h4V5M9 15H5v4M15 15h4v4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="md:h-4 md:w-4" aria-hidden>
              <path
                d="M9 3H5a2 2 0 00-2 2v4M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h4m8 0h4a2 2 0 002-2v-3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      ) : null}
    </div>
  );

  const exchangePricePnlStack = (
    <div
      className={
        immersiveTfHero
          ? 'flex min-h-0 min-w-0 shrink-0 flex-col justify-end gap-0.5 self-stretch'
          : exchangeTfHeaderSingleRowDocked
            ? 'flex min-w-0 min-h-0 flex-1 flex-col items-start justify-end gap-0.5 overflow-hidden'
            : 'flex min-w-0 shrink-0 flex-col justify-end gap-0.5'
      }
    >
      <div className="flex min-w-0 max-w-full flex-wrap items-baseline gap-x-2 gap-y-0">
        <span
          className={`text-xs font-bold tabular-nums leading-none transition-colors md:text-sm ${
            priceDirection === 'up'
              ? 'text-emerald-200'
              : priceDirection === 'down'
                ? 'text-rose-200'
                : 'text-white'
          }`}
        >
          {Number.isFinite(model.lastPrice) && model.lastPrice > 0 ? formatQuoteUsd(model.lastPrice) : '—'}
        </span>
        <span className={`text-[7px] font-medium tabular-nums leading-tight md:text-[8px] ${changeClass}`}>
          {change >= 0 ? '+' : '−'}
          {abs24hFmt} ({change >= 0 ? '+' : ''}
          {change.toFixed(2)}%)
        </span>
      </div>
      {suppressExchangeHeroLivePrice && liveHeaderMetrics?.secondaryLine ? (
        <p
          className={`w-full min-w-0 max-w-[min(100%,16rem)] shrink-0 truncate text-left leading-tight text-[7px] font-semibold tabular-nums md:text-[8px] ${
            liveHeaderMetrics.secondaryLineTone === 'positive'
              ? 'text-emerald-300'
              : liveHeaderMetrics.secondaryLineTone === 'negative'
                ? 'text-rose-300'
                : 'text-sigflo-muted'
          }`}
        >
          {liveHeaderMetrics.secondaryLine}
        </p>
      ) : null}
    </div>
  );

  const renderExchangeTfHeaderBlock = () => (
    <>
      {headerDockedInPlotPanel && !immersiveTfHero ? (
        <div
          className={`shrink-0 flex min-w-0 w-full border-b bg-[rgb(12,12,15)] ${
            suppressExchangeHeroLivePrice && liveTradeMode ? 'border-[#00ffc8]/12' : 'border-white/[0.06]'
          } ${chartPlotFlexFill ? 'shrink-0' : ''}`}
        >
          <div className="flex w-full min-w-0 items-end justify-between gap-2 px-[4.5px] pb-1 pt-1 md:px-[5.5px] md:pt-1.5">
            {exchangePricePnlStack}
            {exchangeTfControlsRow}
          </div>
        </div>
      ) : (
        <div
          className={`shrink-0 flex min-w-0 w-full justify-between gap-x-2 border-b bg-[rgb(12,12,15)] md:gap-x-2.5 ${
            immersiveTfHero
              ? 'flex-wrap items-stretch gap-y-1 px-[4.5px] pb-1 pt-0 md:px-[5.5px] md:pb-1.5 md:pt-0'
              : 'flex-wrap items-end gap-y-1 px-[4.5px] pb-[3px] pt-1.5 md:px-[5.5px] md:pb-[3.5px] md:pt-2'
          } ${chartPlotFlexFill ? 'shrink-0' : ''} ${
            suppressExchangeHeroLivePrice && liveTradeMode
              ? 'border-[#00ffc8]/12'
              : 'border-white/[0.06]'
          }`}
        >
          {exchangePricePnlStack}
          {exchangeTfControlsRow}
        </div>
      )}
      {liveTradeMode && liveHeaderMetrics && !suppressExchangeHeroLivePrice ? (
        <div
          className={`shrink-0 flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-[#00ffc8]/12 bg-gradient-to-r from-[#00ffc8]/[0.06] via-black/20 to-transparent px-[4.5px] py-[4px] md:px-[5.5px] ${
            chartPlotFlexFill ? 'shrink-0' : ''
          }`}
        >
          <span className="text-[6px] font-extrabold uppercase tracking-[0.14em] text-[#7ee8d3]/90 md:text-[7px]">
            {liveActivePositionTitle}
          </span>
          <span className="text-[7px] font-medium tabular-nums text-sigflo-muted md:text-[8px]">
            Risk{' '}
            <span className="text-rose-200/90">{liveHeaderMetrics.riskPercent.toFixed(1)}%</span>
            <span className="text-sigflo-muted/60"> · </span>
            Target{' '}
            <span className="text-emerald-200/90">{liveHeaderMetrics.rewardPercent.toFixed(1)}%</span>
            <span className="text-sigflo-muted/60"> · </span>
            R:R{' '}
            <span className="text-white/90">
              {Number.isFinite(liveHeaderMetrics.rrRatio) && liveHeaderMetrics.rrRatio > 0
                ? liveHeaderMetrics.rrRatio.toFixed(1)
                : '—'}
            </span>
          </span>
          {liveHeaderMetrics.badge ? (
            <span className="rounded border border-cyan-400/25 bg-cyan-500/10 px-1.5 py-px text-[6px] font-bold uppercase tracking-wide text-cyan-100/95 md:text-[7px]">
              {liveHeaderMetrics.badge}
            </span>
          ) : null}
        </div>
      ) : null}
    </>
  );

  return (
    <Card
      panelTexture={false}
      className={`min-w-0 overflow-hidden border-cyan-400/35 bg-gradient-to-b from-[#14141a] via-[#0e0e12] to-[#0c0c0f] shadow-[0_20px_50px_-28px_rgba(0,0,0,0.9)] ${
        immersiveTfHero ? 'px-1.5 pb-1.5 pt-1 md:px-2 md:pb-2 md:pt-1.5' : headerDockedInPlotPanel
          ? 'px-1.5 pb-1.5 pt-0 md:px-2 md:pb-2 md:pt-0'
          : 'p-1.5 md:p-2'
      } ${
        chartPlotFlexFill ? 'flex h-full min-h-0 min-w-0 flex-1 flex-col' : ''
      } ${liveTradeMode ? 'ring-1 ring-[#00ffc8]/14 shadow-[0_0_48px_-28px_rgba(0,255,200,0.12)]' : ''}`}
      style={{ ['--chart-h-desktop' as string]: `${chartHeightPx}px` }}
    >
      {showExchangeTfHeader ? null : heroPairLabel ? (
        headerDockedInPlotPanel && !exchangeStyleHero ? null : pairTfHeroContent ? (
          pairTfHeroContent
        ) : (
          <div className="mb-1 flex items-start justify-between gap-1.5 md:mb-3 md:gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-xs font-bold tracking-tight text-white md:text-xl">{heroPairLabel}</h2>
              <div className="mt-0 flex flex-wrap items-baseline gap-1 md:mt-1 md:gap-2">
                <span
                  className={`text-sm font-bold tabular-nums leading-tight transition-colors md:text-2xl ${
                    priceDirection === 'up' ? 'text-emerald-200' : priceDirection === 'down' ? 'text-rose-200' : 'text-white'
                  }`}
                >
                  {formatQuoteUsd(model.lastPrice)}
                </span>
                <span className={`text-[11px] font-bold tabular-nums md:text-sm ${changeClass}`}>
                  {change >= 0 ? '+' : ''}
                  {change.toFixed(2)}%
                </span>
              </div>
              {pnlHeaderLabel ? (
                <p className={`mt-0.5 text-[10px] font-semibold tabular-nums md:text-[11px] ${pnlHeaderToneClass}`}>
                  {pnlHeaderLabel}
                </p>
              ) : null}
            </div>
            <div className="shrink-0 text-right">{perpTimeCluster}</div>
          </div>
        )
      ) : exchangeStyleHero && metaCaption ? (
        <div className="mb-0 space-y-0">
          <p
            className={`text-xl font-bold tabular-nums md:text-2xl ${
              priceDirection === 'up' ? 'text-emerald-200' : priceDirection === 'down' ? 'text-rose-200' : 'text-white'
            }`}
          >
            {formatQuoteUsd(model.lastPrice)}
          </p>
          <p className={`mt-0.5 text-xs font-semibold tabular-nums leading-tight md:text-sm ${changeClass}`}>
            {change >= 0 ? '+' : '−'}
            {abs24hFmt} ({change >= 0 ? '+' : ''}
            {change.toFixed(2)}%)
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between md:py-0">
          <h2
            className={`text-xs font-semibold transition-colors md:text-sm ${
              priceDirection === 'up' ? 'text-emerald-300' : priceDirection === 'down' ? 'text-rose-300' : 'text-white'
            }`}
          >
            {formatQuoteUsd(model.lastPrice)}
          </h2>
          <div className="inline-flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[9px] text-sigflo-muted md:text-[11px]">
              Live{showTimeframeBar ? '' : ` ${intervalLabel ?? '5m'}`} + overlays
              {liveTime ? (
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-emerald-200">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                  {liveTime}
                </span>
              ) : null}
              {loadingInterval ? (
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-cyan-400/35 bg-cyan-500/10 text-cyan-200">
                  <svg viewBox="0 0 24 24" className="h-3 w-3 animate-spin" fill="none" aria-label="Loading interval">
                    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" opacity="0.35" />
                    <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
              ) : null}
            </span>
          </div>
        </div>
      )}
      {exchangeStyleHero &&
      metaCaption &&
      !(showTimeframeBar && timeframeOptions && chartInterval != null && onChartIntervalChange) ? (
        <p className="mt-0 border-b border-white/[0.06] bg-[rgb(12,12,15)] px-2 py-1 text-[9px] font-medium leading-snug tracking-wide text-sigflo-muted/75 md:px-2.5 md:py-1 md:text-[10px]">
          {metaCaption}
        </p>
      ) : null}
      <div
        className={`mt-0 min-h-0 overflow-hidden transition-[box-shadow] duration-500 ${
          chartPlotFlexFill || headerDockedInPlotPanel ? 'flex min-h-0 min-w-0 flex-1 flex-col' : ''
        } ${
          headerDockedInPlotPanel || !exchangeTfHero
            ? 'rounded-lg border border-white/[0.08] bg-[rgb(12,12,15)] md:rounded-xl'
            : 'rounded-t-none rounded-b-lg border border-t-0 border-white/[0.08] bg-[rgb(12,12,15)] md:rounded-b-xl'
        } ${chartFrameToneClass} ${setupFocusPulse ? 'sigflo-chart-setup-focus-pulse' : ''}`}
      >
        {showExchangeTfHeader ? renderExchangeTfHeaderBlock() : null}
        {headerDockedInPlotPanel && !exchangeStyleHero ? pairTfHeroContent : null}
        <div
          className={
            chartPlotFlexFill
              ? 'relative isolate z-0 min-h-0 w-full min-w-0 flex-1 basis-0 overflow-hidden bg-[rgb(12,12,15)]'
              : chartPlotHeightPx != null
                ? 'relative isolate z-0 w-full shrink-0 overflow-hidden bg-[rgb(12,12,15)] transition-[height] duration-300 ease-out'
                : 'relative isolate z-0 h-[20dvh] min-h-[72px] max-h-[20dvh] w-full shrink-0 overflow-hidden bg-[rgb(12,12,15)] md:h-[var(--chart-h-desktop)] md:max-h-none md:min-h-[200px]'
          }
          style={
            chartPlotFlexFill
              ? undefined
              : chartPlotHeightPx != null
                ? { height: chartPlotHeightPx, minHeight: chartPlotHeightPx }
                : undefined
          }
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            pricePanPrimedRef.current = { x: e.clientX, y: e.clientY };
          }}
          onPointerMoveCapture={(e) => {
            const start = pricePanPrimedRef.current;
            if (!start) return;
            if (e.pointerType === 'mouse' && e.buttons === 0) return;
            const dx = e.clientX - start.x;
            const dy = e.clientY - start.y;
            if (dx * dx + dy * dy < 9) return;
            pricePanPrimedRef.current = null;
            chartRef.current?.priceScale('right').setAutoScale(false);
          }}
          onPointerUp={() => {
            pricePanPrimedRef.current = null;
          }}
          onPointerCancel={() => {
            pricePanPrimedRef.current = null;
          }}
          onPointerLeave={() => {
            pricePanPrimedRef.current = null;
            skipScrollToRealTimeRef.current = true;
          }}
          onPointerEnter={() => {
            applySkipScrollFromViewportRef.current();
          }}
        >
          {/*
            Plot inset: docked manage hero sits above this wrapper; otherwise `top-px` avoids subpixel shear
            from `overflow-hidden` ancestors (LC uses devicePixelRatio).
          */}
          <div
            ref={bindChartPlotEl}
            className={`touch-none absolute inset-x-0 bottom-0 z-[1] bg-[#0c0c0f] ${headerDockedInPlotPanel ? 'top-0' : 'top-px'}`}
          />
          {usePremiumTradeZones ? (
            <div
              className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 overflow-hidden ${headerDockedInPlotPanel ? 'top-0' : 'top-px'}`}
            >
              <TradePlanZonesOverlay
                plotEl={chartPlotMountEl}
                chartRef={chartRef}
                candleSeriesRef={candleRef}
                lineSeriesRef={lineRef}
                candlesActive={candlesActiveOverlay}
                chartGen={tradePlanChartGen}
                side={model.side}
                entry={model.entry}
                stop={model.stop}
                target={model.target}
                lastPrice={model.lastPrice}
                riskReward={model.riskReward}
                visibleEntry={visibleLevels.entry}
                visibleStop={visibleLevels.stop}
                visibleTarget={visibleLevels.target}
                focusPulse={setupFocusPulse}
                exitZoneMode={tradePlanExitLabel}
                showCornerStats={!dockTradePlanCornerStatsInHeader}
              />
            </div>
          ) : null}
          {usePremiumTradeZones &&
          draggablePlanLevels &&
          (onPlanStopChange != null ||
            onPlanTargetChange != null ||
            onPlanStopDragEnd != null ||
            onPlanTargetDragEnd != null) ? (
            <div
              className={`pointer-events-none absolute inset-x-0 bottom-0 z-[38] overflow-hidden ${
                headerDockedInPlotPanel ? 'top-0' : 'top-px'
              }`}
            >
              <TradePlanDragHandles
                plotEl={chartPlotMountEl}
                chartRef={chartRef}
                candleSeriesRef={candleRef}
                lineSeriesRef={lineRef}
                candlesActive={candlesActiveOverlay}
                chartGen={tradePlanChartGen}
                stop={model.stop}
                target={model.target}
                visibleStop={visibleLevels.stop}
                visibleTarget={visibleLevels.target}
                onStopChange={onPlanStopChange}
                onTargetChange={onPlanTargetChange}
                onStopDragEnd={onPlanStopDragEnd}
                onTargetDragEnd={onPlanTargetDragEnd}
              />
            </div>
          ) : null}
        </div>
        <div
          className={`relative z-10 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-t border-white/[0.06] bg-[rgb(12,12,15)] px-[4.5px] py-[3.5px] md:gap-x-2.5 md:px-[5.5px] md:py-[4.5px] ${
            chartPlotFlexFill ? 'shrink-0' : ''
          }`}
        >
          <div className="relative z-10 flex min-w-0 flex-wrap items-center gap-[3.5px] text-[7px] font-medium leading-tight md:gap-[4.5px] md:text-[8px]">
            <button
              type="button"
              onClick={() => setShowVolume((v) => !v)}
              className={`rounded-sm px-[5.5px] py-[3.5px] transition md:px-[7px] md:py-[3px] ${
                showVolume
                  ? 'bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-400/30'
                  : 'bg-white/[0.04] text-sigflo-muted'
              }`}
              aria-pressed={showVolume}
              aria-label="Toggle volume bars"
            >
              Vol
            </button>
            {(Object.keys(levelStyles) as LevelKey[])
              .filter((key) => (key === 'liquidation' ? showLiquidation : true))
              .map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    if (setupGated) {
                      setSoloOverlayFromClean(key);
                      if (onRequestSetupMode) onRequestSetupMode();
                      else onSetupModeToggle?.();
                      return;
                    }
                    if (liveTradeOverlayPreset) {
                      liveOverlayTouchedKeysRef.current.add(key);
                    }
                    setVisibleLevels((prev) => ({
                      ...prev,
                      [key]: !prev[key],
                    }));
                  }}
                  title={
                    setupGated
                      ? `Clean view — tap to show only ${levelStyles[key].label} in Setup`
                      : undefined
                  }
                  className={`rounded-sm px-[5.5px] py-[3.5px] transition md:px-[7px] md:py-[3px] ${
                    setupGated ? 'opacity-70 ring-1 ring-white/[0.06] hover:opacity-95' : ''
                  } ${
                    visibleLevels[key]
                      ? `${levelStyles[key].labelClass} bg-white/[0.08] ring-1 ring-white/15`
                      : 'bg-white/[0.03] text-sigflo-muted'
                  }`}
                  aria-pressed={visibleLevels[key]}
                  aria-label={
                    setupGated ? `Enable setup overlays (${levelStyles[key].label})` : `Toggle ${levelStyles[key].label} level`
                  }
                >
                  {levelStyles[key].label}
                </button>
              ))}
            {exchangeStyleHero && metaCaption ? (
              <>
                <span className="h-3 w-px shrink-0 self-center bg-white/[0.12]" aria-hidden />
                <span className="shrink-0 whitespace-nowrap text-[7px] font-medium leading-tight text-sigflo-muted md:text-[8px]">
                  {metaCaption}
                </span>
              </>
            ) : null}
          </div>
          <MarketStatsRow model={model} variant="compact" />
        </div>
      </div>
    </Card>
  );
}
