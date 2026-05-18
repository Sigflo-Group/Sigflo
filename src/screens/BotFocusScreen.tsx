import { secureStorage } from '@/lib/storage';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { TRADING_AUTO_EXECUTION_ACTIVE } from '@/lib/tradingControlMode';
import { motion } from 'framer-motion';
import {
  BotFocusChartToolsDock,
  BotFocusFullChartTopBar,
  BotFocusInsightDrawer,
} from '@/components/bots/BotFocusFullChartChrome';
import { BotExecutionSheet } from '@/components/bots/BotExecutionSheet';
import { AdjustRiskSheet, type AdjustRiskPositionSnapshot } from '@/components/trade/AdjustRiskSheet';
import { TradeChartPanel } from '@/components/trade/TradeChartPanel';
import { TriggeredStatusBadge } from '@/components/ui/TriggeredStatusBadge';
import {
  BOT_FOCUS_CHART_PLOT_PX,
  BOT_FOCUS_FULL_CHART_DOCK_GAP_PX,
  BOT_FOCUS_FULL_CHART_FLEX_BASIS,
  BOT_FOCUS_FULL_CHART_OUTSIDE_PLOT_RESERVE_PX,
  BOT_FOCUS_FULL_CHART_PLOT_FLEX_FILL,
  CHART_TIMESCALE_MAX_BAR_SPACING_PX,
} from '@/config/tradeChartHeights';
import { useBotFocusLayout } from '@/context/botFocusLayoutContext';
import { useTradingControlMode } from '@/context/TradingControlModeContext';
import { useCanGoBack } from '@/hooks/useCanGoBack';
import type { TradeChartInterval } from '@/hooks/useLiveTradeMarket';
import { useLiveTradeMarket } from '@/hooks/useLiveTradeMarket';
import { useSyncedTradeChartInterval } from '@/hooks/useSyncedTradeChartInterval';
import { ExitAiCoPilotBlock } from '@/components/trade/exit/ExitAiCoPilotBlock';
import { useAccountSnapshot } from '@/hooks/useAccountSnapshot';
import { useExitAutomation } from '@/hooks/useExitAutomation';
import { useBotStatuses } from '@/hooks/useBotStatuses';
import { useSignalEngine } from '@/hooks/useSignalEngine';
import { requestChartSetupFocus } from '@/lib/chartSetupFocus';
import {
  baseBots,
  botCardStatusMeta,
  botPersonality,
  formatBotPrice,
  resolveBotCardStatus,
  type BotAgent,
} from '@/lib/bots';
import {
  buildTrackedFallbackSignal,
  countTriggeredPairs,
  deriveMarketStatus,
  isFeedActionableOpportunity,
  pickBestSignalForPair,
} from '@/lib/marketScannerRows';
import {
  SIGFLO_CHART_INTERVAL_EVENT,
  TRADE_CHART_INTERVAL_STORAGE_KEY,
  tradeChartIntervalShortLabel,
} from '@/lib/tradeChartIntervalPreference';
import { uiSignalStateFromMarketStatus } from '@/lib/signalState';
import { resolveBybitTradeError } from '@/lib/bybitUserFacingError';
import { linearTpSlStringsForOpen } from '@/lib/bybitLinearTpSl';
import { DEFAULT_BYBIT_TPSL_TRIGGER } from '@/lib/bybitTpSlTrigger';
import { applyOpenOrderNotionalBuffer, linearQtyFromNotionalUsd } from '@/lib/linearOrderQty';
import { buildExitAiCoPilotModel, buildManageAiExitZoneAuxLines } from '@/lib/exitAiCoPilot';
import { resolveExitGuidanceFlow } from '@/lib/tradeExitGuidanceFlow';
import { buildGroundedMarketContext } from '@/lib/buildGroundedMarketContext';
import {
  buildManageTradeQueryFromLinearPosition,
  buildTradeQueryString,
} from '@/lib/tradeNavigation';
import { buildLiveBotSetupCopy } from '@/lib/botSetupLevelCopy';
import { deriveTradeMetrics } from '@/lib/tradeRisk';
import { buildTradeViewModelFromSignal, resolveTradeAnchorPrice } from '@/lib/tradeViewFromSignal';
import { requestAssistantSuggestion } from '@/services/ai/client';
import {
  postBybitLinearOrder,
  postBybitLinearTradingStop,
} from '@/services/api/tradeClient';
import { fetchLinearMaxLeverage } from '@/services/bybit/client';
import type { ExchangeSnapshot, PositionItem } from '@/types/integrations';
import type { TradeViewModel } from '@/types/trade';
import type { TradeSide } from '@/types/trade';

const BETA_FALLBACK_MIN_ORDER_USD = 5;
const SYMBOL_MIN_NOTIONAL_USD: Record<string, number> = {
  BTCUSDT: 5,
  ETHUSDT: 5,
};

function resolveMinOrderUsd(symbol: string): number {
  const s = symbol.toUpperCase();
  return SYMBOL_MIN_NOTIONAL_USD[s] ?? BETA_FALLBACK_MIN_ORDER_USD;
}

function roundUsdAmount(n: number): number {
  return Math.round(n * 100) / 100;
}

function coerceUsdField(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

type TradeBalanceOverview = {
  availableToTrade: number | null;
  totalWalletBalance: number | null;
};

function utaSizingCapUsd(o: TradeBalanceOverview): number {
  const av = o.availableToTrade;
  const tw = o.totalWalletBalance;
  if (av != null && Number.isFinite(av) && av > 0) return av;
  if (tw != null && Number.isFinite(tw) && tw > 0) return tw;
  return 0;
}

function utaBalanceDisplayUsd(o: TradeBalanceOverview): number {
  const cap = utaSizingCapUsd(o);
  if (cap > 0) return cap;
  const av = o.availableToTrade;
  if (av != null && Number.isFinite(av)) return Math.max(0, av);
  const tw = o.totalWalletBalance;
  if (tw != null && Number.isFinite(tw)) return Math.max(0, tw);
  return 0;
}

function findBybitLinearOpenLeg(
  snapshots: ExchangeSnapshot[],
  orderSymbol: string,
  legSide: TradeSide,
): PositionItem | null {
  const bybit = snapshots.find((s) => s.exchange === 'bybit' && s.status === 'connected');
  if (!bybit?.positions?.length) return null;
  const open = bybit.positions.filter((x) => x.symbol === orderSymbol && x.size > 0);
  if (open.length === 0) return null;
  return open.find((x) => x.side === legSide) ?? open[0];
}

const FOCUS_INTERVAL_OPTIONS: { value: TradeChartInterval; label: string }[] = [
  { value: '1', label: '1m' },
  { value: '5', label: '5m' },
  { value: '15', label: '15m' },
  { value: '60', label: '1H' },
  { value: '240', label: '4H' },
  { value: 'D', label: '1D' },
  { value: 'W', label: '1W' },
];

function pairToLinearSymbol(raw: string): string {
  const t = raw.trim().toUpperCase();
  if (!t) return 'BTCUSDT';
  if (t.endsWith('USDT') && t.length > 4) return t;
  const base = t.replace(/[^A-Z0-9]/g, '').replace(/USDT$/i, '') || 'BTC';
  return `${base}USDT`;
}

function pairFromWatched(raw: string): string {
  const t = raw.trim().toUpperCase();
  if (t.includes('/')) return t.split('/')[0]?.trim() || 'BTC';
  return t.replace(/USDT$/i, '').replace(/[^A-Z0-9]/g, '') || 'BTC';
}

function levelsValid(e?: number, s?: number, t?: number): boolean {
  return (
    e != null &&
    s != null &&
    t != null &&
    Number.isFinite(e) &&
    Number.isFinite(s) &&
    Number.isFinite(t) &&
    e > 0 &&
    s > 0 &&
    t > 0
  );
}

function rrFromLevels(side: TradeSide, entry: number, stop: number, target: number): number {
  const risk = side === 'long' ? entry - stop : stop - entry;
  const reward = side === 'long' ? target - entry : entry - target;
  if (!Number.isFinite(risk) || risk <= 0) return 0;
  return reward / risk;
}

function biasToSide(bias: string): TradeSide {
  return bias.trim().toLowerCase() === 'short' ? 'short' : 'long';
}

function focusStateLabel(args: {
  paused: boolean;
  pending: boolean;
  hasSignal: boolean;
  actionable: boolean;
  marketStatus: ReturnType<typeof deriveMarketStatus>;
}): string {
  if (args.paused) return 'Watching';
  if (args.pending || !args.hasSignal) return 'Waiting';
  if (args.marketStatus === 'triggered') return 'Triggered';
  if (args.actionable) return 'Ready';
  if (args.marketStatus === 'developing' || args.marketStatus === 'overextended') return 'Waiting';
  return 'Watching';
}

/**
 * Bot card detail can carry a stale seed setup while the chart shows live spot. Merging far-off levels (e.g. ~94k
 * entry vs ~72k BTC) makes the scale look broken. Still allow large but plausible drift for real open trades.
 */
function botDetailMatchesChartScale(botEntry: number, chartAnchor: number): boolean {
  if (!(botEntry > 0) || !(chartAnchor > 0)) return false;
  const r = botEntry / chartAnchor;
  return r >= 0.8 && r <= 1.25;
}

function mergeModelWithBotLevels(
  base: TradeViewModel,
  bot: BotAgent,
  applyMergedBotSeed: boolean,
): TradeViewModel {
  if (!applyMergedBotSeed || !levelsValid(bot.detail.entry, bot.detail.stop, bot.detail.target)) {
    return base;
  }
  const side = biasToSide(bot.detail.bias);
  const entry = bot.detail.entry!;
  const stop = bot.detail.stop!;
  const target = bot.detail.target!;
  const stopMovePct = Math.abs((stop - entry) / entry);
  const targetMovePct = Math.abs((target - entry) / entry);
  const riskReward = rrFromLevels(side, entry, stop, target);
  const positionSizeUsd = base.positionSizeUsd;
  const targetProfitUsd = positionSizeUsd * targetMovePct;
  const stopLossUsd = -(positionSizeUsd * stopMovePct);

  return {
    ...base,
    side,
    entry,
    stop,
    target,
    riskReward: Number.isFinite(riskReward) && riskReward > 0 ? riskReward : base.riskReward,
    targetProfitUsd,
    stopLossUsd,
  };
}

function BotFocusHeader({
  bot,
  cardStatus,
  triggeredPairCount,
  onBack,
}: {
  bot: BotAgent;
  cardStatus: ReturnType<typeof resolveBotCardStatus>;
  triggeredPairCount: number;
  onBack?: () => void;
}) {
  const personality = botPersonality(bot.personalityId);
  const meta = botCardStatusMeta(cardStatus);
  const glow =
    cardStatus === 'active' || cardStatus === 'in_trade'
      ? 'shadow-[0_0_20px_-6px_rgba(0,200,120,0.45)]'
      : '';

  return (
    <header className="landing-panel-texture relative overflow-hidden border-b border-landing-border/80 bg-landing-bg px-3 py-2.5">
      <div className="relative z-[1] flex w-full min-w-0 items-center gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-landing-border bg-landing-surface/80 text-landing-text transition active:scale-[0.96]"
            aria-label="Back"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M15 6l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h1 className="truncate text-base font-bold tracking-tight text-landing-text">{bot.name}</h1>
            <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-landing-muted">
              {bot.strategy}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-landing-surface/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.textClass} ${glow}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
              {meta.label}
            </span>
            <span className="inline-flex max-w-full rounded-full border border-landing-accent/30 bg-landing-accent-dim/50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-landing-accent-hi">
              {personality.label}
            </span>
            <TriggeredStatusBadge count={triggeredPairCount} className="bg-landing-accent-dim/50 text-[9px]" />
          </div>
        </div>
      </div>
    </header>
  );
}

function MarketContextTags({
  volatility,
  structure,
  volume,
}: {
  volatility: string;
  structure: string;
  volume: string;
}) {
  const items = [
    { k: 'Volatility', v: volatility },
    { k: 'Structure', v: structure },
    { k: 'Volume', v: volume },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(({ k, v }) => (
        <span
          key={k}
          className="inline-flex items-center rounded-full border border-white/[0.08] bg-black/30 px-2.5 py-1 text-[10px] font-medium text-landing-muted"
        >
          <span className="text-landing-text/75">{k}:</span>
          <span className="ml-1 text-landing-accent-hi">{v}</span>
        </span>
      ))}
    </div>
  );
}

export default function BotFocusScreen() {
  const { botId } = useParams<{ botId: string }>();
  const navigate = useNavigate();
  const canGoBack = useCanGoBack();
  const [searchParams, setSearchParams] = useSearchParams();
  const { signals } = useSignalEngine();
  const { statusMap, togglePause } = useBotStatuses();
  const chartInterval = useSyncedTradeChartInterval();
  const [selectedPairRaw, setSelectedPairRaw] = useState<string | null>(null);
  const [whyOpen, setWhyOpen] = useState(false);
  const [tapFlash, setTapFlash] = useState<string | null>(null);
  const [executionOpen, setExecutionOpen] = useState(false);
  const [adjustRiskOpen, setAdjustRiskOpen] = useState(false);
  const [execLive, setExecLive] = useState(false);
  const [execFillEntry, setExecFillEntry] = useState<number | null>(null);
  const [execNotionalUsd, setExecNotionalUsd] = useState(0);
  const [execSideOverride, setExecSideOverride] = useState<TradeSide | null>(null);
  const { fullChartMode, setFullChartMode } = useBotFocusLayout();
  const { mode: tradingControlMode, meta: tradingModeMeta } = useTradingControlMode();
  const [insightDrawerOpen, setInsightDrawerOpen] = useState(false);
  /** Clean vs Setup overlays on the focus chart (same control as Trade dock; left of live time / PERP cluster). */
  const [chartSetupMode, setChartSetupMode] = useState(true);
  const onChartSetupModeToggle = useCallback(() => {
    setChartSetupMode((v) => !v);
  }, []);
  const [setupFocusBanner, setSetupFocusBanner] = useState<string | null>(null);
  const setupFocusBannerTimerRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (setupFocusBannerTimerRef.current != null) window.clearTimeout(setupFocusBannerTimerRef.current);
    };
  }, []);
  const onSetupFocusBannerCb = useCallback((label: string) => {
    if (setupFocusBannerTimerRef.current != null) window.clearTimeout(setupFocusBannerTimerRef.current);
    setSetupFocusBanner(label);
    setupFocusBannerTimerRef.current = window.setTimeout(() => {
      setSetupFocusBanner(null);
      setupFocusBannerTimerRef.current = null;
    }, 4200);
  }, []);
  const chartSlotRef = useRef<HTMLDivElement | null>(null);
  const [fullChartPlotPx, setFullChartPlotPx] = useState(BOT_FOCUS_CHART_PLOT_PX);

  useLayoutEffect(() => {
    const fc = searchParams.get('fullChart');
    if (fc !== '1' && fc !== 'true') return;
    setFullChartMode(true);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('fullChart');
        return next;
      },
      { replace: true },
    );
  }, [botId, searchParams, setFullChartMode, setSearchParams]);

  const { items: accountSnapshots, refresh: refreshAccountSnapshots } = useAccountSnapshot({ pollMs: 12_000 });
  const [symbolMaxLeverage, setSymbolMaxLeverage] = useState<number | null>(null);

  const bot = useMemo(() => baseBots.find((b) => b.id === botId) ?? null, [botId]);

  const selectedWatched = selectedPairRaw ?? bot?.watchedPairs[0] ?? 'BTC';
  const linearSymbol = pairToLinearSymbol(selectedWatched);
  const triggeredPairCount = useMemo(() => countTriggeredPairs(signals), [signals]);

  const focusSignal = useMemo(() => {
    if (!bot) return null;
    const watchBase = pairFromWatched(selectedWatched);
    const sym = pairToLinearSymbol(selectedWatched);
    const byId = signals.find((s) => s.id === bot.signalId);
    const forPair = pickBestSignalForPair(signals, watchBase);
    if (byId && pairFromWatched(byId.pair) === watchBase) return byId;
    if (forPair) return forPair;
    return buildTrackedFallbackSignal(watchBase, sym);
  }, [bot, signals, selectedWatched]);

  const live = useLiveTradeMarket(linearSymbol, chartInterval);

  useEffect(() => {
    setChartSetupMode(true);
  }, [linearSymbol]);

  useLayoutEffect(() => {
    const el = chartSlotRef.current;
    if (!el || !fullChartMode || BOT_FOCUS_FULL_CHART_PLOT_FLEX_FILL) return;
    const apply = () => {
      const cs = getComputedStyle(el);
      const padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
      const inner = el.clientHeight - padY;
      const liveStrip = execLive ? 34 : 0;
      setFullChartPlotPx(
        Math.max(
          200,
          Math.floor(inner - BOT_FOCUS_FULL_CHART_OUTSIDE_PLOT_RESERVE_PX - liveStrip),
        ),
      );
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fullChartMode, execLive]);

  useEffect(() => {
    if (!fullChartMode) setInsightDrawerOpen(false);
  }, [fullChartMode]);

  useEffect(() => {
    if (!fullChartMode) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [fullChartMode]);

  useEffect(() => {
    let cancelled = false;
    void fetchLinearMaxLeverage(linearSymbol).then((m) => {
      if (!cancelled) setSymbolMaxLeverage(m);
    });
    return () => {
      cancelled = true;
    };
  }, [linearSymbol]);

  const tradeBalance = useMemo(() => {
    const bybit = accountSnapshots.find((s) => s.exchange === 'bybit' && s.status === 'connected');
    const overview = bybit?.accountBreakdown?.overview;
    if (!overview) return null;
    return {
      availableToTrade: coerceUsdField(overview.availableToTrade),
      totalWalletBalance: coerceUsdField(overview.totalWalletBalance),
    };
  }, [accountSnapshots]);

  const linkedUtaRawMaxUsd = useMemo(() => {
    if (!tradeBalance) return null;
    const raw = Math.max(utaSizingCapUsd(tradeBalance), utaBalanceDisplayUsd(tradeBalance));
    if (!Number.isFinite(raw)) return null;
    return Math.max(0, raw);
  }, [tradeBalance]);

  const balanceForSizing = useMemo(() => {
    if (linkedUtaRawMaxUsd != null && linkedUtaRawMaxUsd > 0) {
      return roundUsdAmount(linkedUtaRawMaxUsd);
    }
    return 0;
  }, [linkedUtaRawMaxUsd]);

  const bybitSnap = useMemo(
    () => accountSnapshots.find((s) => s.exchange === 'bybit' && s.status === 'connected'),
    [accountSnapshots],
  );

  const storedStatus = bot ? statusMap[bot.id] ?? bot.status : 'active';
  const marketStatus = focusSignal ? deriveMarketStatus(focusSignal) : 'idle';
  const uiState = focusSignal ? uiSignalStateFromMarketStatus(marketStatus) : null;
  const cardStatus = resolveBotCardStatus(storedStatus, uiState);

  /** Static card seed levels (may be wrong scale vs pair picker — never use alone for SETUP readout). */
  const botSeededLevels = Boolean(
    bot && !bot.expandedSetupPending && levelsValid(bot.detail.entry, bot.detail.stop, bot.detail.target),
  );

  const baseModel = useMemo(() => {
    if (!focusSignal) return null;
    const anchorPx = resolveTradeAnchorPrice(null, live.lastPrice, focusSignal.pair);
    return buildTradeViewModelFromSignal(
      focusSignal,
      {
        lastPrice: live.lastPrice,
        change24hPct: live.change24hPct,
        high24h: live.high24h,
        low24h: live.low24h,
        volume24h: live.volume24h,
        priceSeries: live.priceSeries,
        chartCandles: live.chartCandles,
      },
      {
        anchorPrice: anchorPx,
        balanceUsd: 0,
        tradeSide: bot ? biasToSide(bot.detail.bias) : undefined,
      },
    );
  }, [focusSignal, live, bot]);

  const chartModel = useMemo(() => {
    if (!baseModel || !bot) return baseModel;
    const levelsValidForBot = botSeededLevels && levelsValid(bot.detail.entry, bot.detail.stop, bot.detail.target);
    const hasLiveSignalForPair = Boolean(focusSignal && !focusSignal.id.startsWith('tracked-'));
    const anchor =
      Number.isFinite(baseModel.lastPrice) && baseModel.lastPrice > 0
        ? baseModel.lastPrice
        : Number.isFinite(baseModel.entry) && baseModel.entry > 0
          ? baseModel.entry
          : 0;
    /**
     * Seeded bot levels are fallback-only. When a live signal exists for the selected pair, keep
     * plan levels tied to live-derived chart context instead of static bot defaults.
     */
    const applyBotLevels =
      levelsValidForBot &&
      !hasLiveSignalForPair &&
      bot.detail.entry != null &&
      anchor > 0 &&
      botDetailMatchesChartScale(bot.detail.entry, anchor);
    return mergeModelWithBotLevels(baseModel, bot, applyBotLevels);
  }, [baseModel, bot, botSeededLevels, focusSignal]);

  /** Levels actually driving the chart / orders for the selected pair (live signal + anchor). */
  const hasDisplayableSetup = Boolean(
    chartModel && levelsValid(chartModel.entry, chartModel.stop, chartModel.target),
  );

  /** Live swing-derived intent copy for this symbol + active chart interval (never uses stale seed prices). */
  const liveSetupCopy = useMemo(() => {
    if (!bot || !chartModel) return null;
    const currentPrice =
      live.lastPrice != null && live.lastPrice > 0
        ? live.lastPrice
        : chartModel.lastPrice > 0
          ? chartModel.lastPrice
          : 0;
    return buildLiveBotSetupCopy({
      bias: bot.detail.bias,
      candles: chartModel.chartCandles,
      currentPrice,
      intervalLabel: tradeChartIntervalShortLabel(chartInterval),
    });
  }, [bot, chartModel, chartInterval, live.lastPrice]);

  const setupSideForExec: TradeSide = bot ? biasToSide(bot.detail.bias) : 'long';
  const effectiveExecSide: TradeSide = execSideOverride ?? setupSideForExec;

  useEffect(() => {
    const open = bybitSnap?.positions?.filter((p) => p.symbol === linearSymbol && p.size > 0) ?? [];
    if (open.length === 0) {
      setExecLive(false);
      setExecFillEntry(null);
      setExecNotionalUsd(0);
      setExecSideOverride(null);
      return;
    }
    const pos = open.find((p) => p.side === setupSideForExec) ?? open[0]!;
    const entry = Number.isFinite(pos.entryPrice) && pos.entryPrice > 0 ? pos.entryPrice : null;
    const refPrice =
      Number.isFinite(pos.markPrice) && (pos.markPrice as number) > 0
        ? (pos.markPrice as number)
        : entry ?? 0;
    const notional = refPrice > 0 ? Math.max(0, pos.size * refPrice) : 0;
    setExecFillEntry(entry);
    setExecNotionalUsd(notional);
    setExecSideOverride(pos.side);
    setExecLive(true);
  }, [bybitSnap, linearSymbol, setupSideForExec]);

  const chartModelForPlot = useMemo((): TradeViewModel | null => {
    if (!chartModel) return null;
    if (execFillEntry != null) {
      const last =
        live.lastPrice != null && live.lastPrice > 0 ? live.lastPrice : execFillEntry;
      return { ...chartModel, entry: execFillEntry, lastPrice: last };
    }
    return chartModel;
  }, [chartModel, execFillEntry, live.lastPrice]);

  const headerSecondaryPnl = useMemo((): {
    label: string;
    tone: 'positive' | 'negative' | 'neutral';
  } | null => {
    if (!execLive || execNotionalUsd <= 0 || !chartModelForPlot) return null;
    const markPx =
      live.lastPrice != null && live.lastPrice > 0 ? live.lastPrice : chartModelForPlot.entry;
    const entryPx = execFillEntry ?? chartModelForPlot.entry;
    if (!(markPx > 0) || !(entryPx > 0)) return null;
    const frac =
      effectiveExecSide === 'long'
        ? (markPx - entryPx) / entryPx
        : (entryPx - markPx) / entryPx;
    const u = execNotionalUsd * frac;
    const tone: 'positive' | 'negative' | 'neutral' =
      u > 0 ? 'positive' : u < 0 ? 'negative' : 'neutral';
    const label = `${u >= 0 ? '+' : '−'}${Math.abs(u).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })} uPnL`;
    return { label, tone };
  }, [effectiveExecSide, execLive, execNotionalUsd, chartModelForPlot, live.lastPrice, execFillEntry]);

  const exitAutomationScopeKey = bot ? `botFocus:${bot.id}:${linearSymbol}` : 'botFocus:none';
  const exitAuto = useExitAutomation(exitAutomationScopeKey);

  const adjustRiskExitApi = useMemo(
    () => ({
      mode: exitAuto.mode,
      strategy: exitAuto.strategy,
      setStrategy: exitAuto.setStrategy,
      setSafeguards: exitAuto.setSafeguards,
      pushActivity: exitAuto.pushActivity,
    }),
    [exitAuto.mode, exitAuto.strategy, exitAuto.setStrategy, exitAuto.setSafeguards, exitAuto.pushActivity],
  );

  const adjustRiskFocusSnapshot = useMemo((): AdjustRiskPositionSnapshot | null => {
    if (!execLive || execNotionalUsd <= 0 || !chartModelForPlot) return null;
    const entryPx = execFillEntry ?? chartModelForPlot.entry;
    const markPx =
      live.lastPrice != null && live.lastPrice > 0 ? live.lastPrice : chartModelForPlot.lastPrice ?? entryPx;
    if (!(entryPx > 0) || !(markPx > 0)) return null;
    const frac =
      effectiveExecSide === 'long' ? (markPx - entryPx) / entryPx : (entryPx - markPx) / entryPx;
    const pnlUsd = execNotionalUsd * frac;
    const stop = chartModelForPlot.stop;
    const target = chartModelForPlot.target;
    if (!(stop > 0) || !(target > 0)) return null;
    return {
      pairLabel: chartModelForPlot.pair,
      side: effectiveExecSide,
      positionNotionalUsd: execNotionalUsd,
      entryPrice: entryPx,
      markPrice: markPx,
      pnlUsd,
      stopPrice: stop,
      targetPrice: target,
    };
  }, [
    chartModelForPlot,
    execFillEntry,
    execLive,
    execNotionalUsd,
    live.lastPrice,
    effectiveExecSide,
  ]);

  const botExitFlow = useMemo(() => {
    if (!execLive || !chartModelForPlot || !focusSignal) return null;
    const entry = execFillEntry ?? chartModelForPlot.entry;
    const mark =
      live.lastPrice != null && live.lastPrice > 0 ? live.lastPrice : chartModelForPlot.lastPrice ?? entry;
    if (!(entry > 0) || !(mark > 0)) return null;
    const pnlPct =
      effectiveExecSide === 'long' ? ((mark - entry) / entry) * 100 : ((entry - mark) / entry) * 100;
    return resolveExitGuidanceFlow({
      variant: 'manage',
      side: effectiveExecSide,
      entry,
      mark,
      stop: chartModelForPlot.stop,
      target: chartModelForPlot.target,
      trendAlignment: focusSignal.scoreBreakdown.trendAlignment,
      momentumQuality: focusSignal.scoreBreakdown.momentumQuality,
      pnlPct,
      strategyPreset: exitAuto.strategy,
      customStrategyThresholds: exitAuto.customStrategyThresholds,
      safeguards: exitAuto.safeguards,
      exitAiMode: exitAuto.mode,
    });
  }, [
    chartModelForPlot,
    execFillEntry,
    execLive,
    exitAuto.customStrategyThresholds,
    exitAuto.mode,
    exitAuto.safeguards,
    exitAuto.strategy,
    focusSignal,
    live.lastPrice,
    effectiveExecSide,
  ]);

  const botExitChartAux = useMemo(() => {
    if (!execLive || !chartModelForPlot) return undefined;
    const entry = execFillEntry ?? chartModelForPlot.entry;
    const mark =
      live.lastPrice != null && live.lastPrice > 0 ? live.lastPrice : chartModelForPlot.lastPrice ?? entry;
    return buildManageAiExitZoneAuxLines({
      mode: exitAuto.mode,
      side: effectiveExecSide,
      entry,
      target: chartModelForPlot.target,
      stop: chartModelForPlot.stop,
      mark,
      referencePrice: botExitFlow?.effective.referencePrice,
    });
  }, [
    botExitFlow?.effective.referencePrice,
    chartModelForPlot,
    execFillEntry,
    execLive,
    exitAuto.mode,
    live.lastPrice,
    effectiveExecSide,
  ]);

  const botExitAiModel = useMemo(
    () =>
      buildExitAiCoPilotModel({
        mode: exitAuto.mode,
        side: effectiveExecSide,
        flow: botExitFlow,
        nextPlanned: botExitFlow?.nextPlanned ?? 'Automation watching trend and risk.',
        safeguards: exitAuto.safeguards,
        assistedPromptVisible: false,
        orderExitInFlight: false,
        stop: chartModelForPlot?.stop ?? 0,
        target: chartModelForPlot?.target ?? 0,
        contextLine: liveSetupCopy?.commentaryShort ?? bot?.intentLine ?? null,
        personalityExitNote: bot ? botPersonality(bot.personalityId).exitAiNote : null,
      }),
    [
      bot,
      botExitFlow,
      chartModelForPlot?.stop,
      chartModelForPlot?.target,
      exitAuto.mode,
      exitAuto.safeguards,
      liveSetupCopy?.commentaryShort,
      effectiveExecSide,
    ],
  );

  const navigateToTradeForExit = useCallback(() => {
    const connected = accountSnapshots.find((s) => s.exchange === 'bybit' && s.status === 'connected');
    const pos = connected ? findBybitLinearOpenLeg([connected], linearSymbol, effectiveExecSide) : null;
    const mark =
      live.lastPrice != null && live.lastPrice > 0 ? live.lastPrice : chartModelForPlot?.lastPrice ?? 0;
    if (pos && mark > 0) {
      navigate(
        `/trade?${buildManageTradeQueryFromLinearPosition(pos, {
          markPrice: mark,
          leverageFallback: pos.leverage ?? 1,
        })}`,
      );
      return;
    }
    if (focusSignal) {
      navigate(`/trade?${buildTradeQueryString(focusSignal, { marketStatus })}&reviewTop=1`);
    }
  }, [
    accountSnapshots,
    chartModelForPlot?.lastPrice,
    focusSignal,
    linearSymbol,
    live.lastPrice,
    marketStatus,
    navigate,
    effectiveExecSide,
  ]);

  const executeTradeFromFocus = useCallback(
    async ({
      amountUsd,
      leverage,
    }: {
      amountUsd: number;
      leverage: number;
    }): Promise<{ ok: true } | { ok: false; message: string; cta?: { label: string; href: string } }> => {
      if (!chartModel || !focusSignal) {
        return { ok: false, message: 'Chart or signal not ready.' };
      }
      const useReal = Boolean(bybitSnap);
      let entryMark = NaN;
      if (Number.isFinite(chartModel.lastPrice) && chartModel.lastPrice > 0) {
        entryMark = chartModel.lastPrice;
      } else if (live.lastPrice != null && live.lastPrice > 0) {
        entryMark = live.lastPrice;
      } else if (Number.isFinite(chartModel.entry) && chartModel.entry > 0) {
        entryMark = chartModel.entry;
      }
      if (!Number.isFinite(entryMark) || entryMark <= 0) {
        return { ok: false, message: 'No price yet — wait for the chart to load.' };
      }
      if (!useReal) {
        return { ok: false, message: 'Connect Bybit in Account to execute.' };
      }

      const amt = roundUsdAmount(amountUsd);
      const lev = Math.min(leverage, symbolMaxLeverage ?? 200);
      const riskModel: TradeViewModel = { ...chartModel, balanceUsd: Math.max(0, balanceForSizing) };
      const metrics = deriveTradeMetrics(riskModel, {
        amountUsd: amt,
        leverage: lev,
        side: setupSideForExec,
        market: 'futures',
        setupScore: focusSignal.setupScore,
      });
      const minOrder = resolveMinOrderUsd(linearSymbol);
      if (amt < minOrder) {
        return { ok: false, message: `Minimum margin is about $${minOrder}.` };
      }

      const orderNotionalUsd = applyOpenOrderNotionalBuffer(metrics.positionSizeUsd, {
        minNotionalUsd: minOrder,
      });
      const qtyStr = linearQtyFromNotionalUsd(orderNotionalUsd, entryMark);
      const sideBybit = setupSideForExec === 'long' ? 'Buy' : 'Sell';
      const { tpSl } = linearTpSlStringsForOpen(setupSideForExec, entryMark, chartModel.target, chartModel.stop);

      try {
        const tpslBot =
          tpSl.takeProfit || tpSl.stopLoss
            ? {
                ...(tpSl.takeProfit ? { takeProfit: tpSl.takeProfit } : {}),
                ...(tpSl.stopLoss ? { stopLoss: tpSl.stopLoss } : {}),
                tpTriggerBy: DEFAULT_BYBIT_TPSL_TRIGGER,
                slTriggerBy: DEFAULT_BYBIT_TPSL_TRIGGER,
              }
            : {};
        await postBybitLinearOrder({
          symbol: linearSymbol,
          side: sideBybit,
          qty: qtyStr,
          orderType: 'Market',
          leverage: lev,
          positionIdx: 0,
          ...tpslBot,
        });
        const snapshotsAfter = await refreshAccountSnapshots({ silent: false });
        if (tpSl.takeProfit || tpSl.stopLoss) {
          const pos = findBybitLinearOpenLeg(snapshotsAfter, linearSymbol, setupSideForExec);
          if (pos && Number.isFinite(pos.entryPrice) && pos.entryPrice > 0) {
            const synced = linearTpSlStringsForOpen(setupSideForExec, pos.entryPrice, chartModel.target, chartModel.stop);
            if (synced.tpSl.takeProfit || synced.tpSl.stopLoss) {
              try {
                await postBybitLinearTradingStop({
                  symbol: linearSymbol,
                  positionIdx: pos.positionIdx ?? 0,
                  takeProfit: synced.tpSl.takeProfit ?? '0',
                  stopLoss: synced.tpSl.stopLoss ?? '0',
                  tpTriggerBy: DEFAULT_BYBIT_TPSL_TRIGGER,
                  slTriggerBy: DEFAULT_BYBIT_TPSL_TRIGGER,
                });
              } catch (e) { console.error("[Caught Error]", e); }
            }
          }
        }
        await refreshAccountSnapshots({ silent: true });
        setExecFillEntry(entryMark);
        setExecNotionalUsd(orderNotionalUsd);
        setExecSideOverride(setupSideForExec);
        setExecLive(true);
        return { ok: true };
      } catch (e) {
        const tradeErr = resolveBybitTradeError(e, 'Order failed — retry');
        return { ok: false, message: tradeErr.message, ...(tradeErr.cta ? { cta: tradeErr.cta } : {}) };
      }
    },
    [
      balanceForSizing,
      bybitSnap,
      chartModel,
      focusSignal,
      linearSymbol,
      live.lastPrice,
      refreshAccountSnapshots,
      setupSideForExec,
      symbolMaxLeverage,
    ],
  );

  const actionable = Boolean(focusSignal && isFeedActionableOpportunity(focusSignal));
  const canExecute =
    Boolean(
      bot &&
        focusSignal &&
        hasDisplayableSetup &&
        storedStatus !== 'paused' &&
        (actionable || bot.detail.confidencePct >= 62),
    );

  /** Shown beside Trade when execution is disabled — matches `canExecute` guardrails. */
  const tradeDisabledNote = useMemo(() => {
    if (canExecute || !bot) return null;
    if (!focusSignal) return 'No signal for this pair';
    if (storedStatus === 'paused') return 'Resume bot to trade';
    if (!hasDisplayableSetup) return 'No active setup';
    if (!actionable && bot.detail.confidencePct < 62) return 'Need score 65+ or 62% confidence';
    return null;
  }, [actionable, bot, canExecute, focusSignal, hasDisplayableSetup, storedStatus]);

  const confidencePct = bot
    ? Math.round((bot.detail.confidencePct + (focusSignal?.setupScore ?? bot.detail.confidencePct)) / 2)
    : 0;

  const stateLabel = bot
    ? focusStateLabel({
        paused: storedStatus === 'paused',
        pending: Boolean(bot.expandedSetupPending),
        hasSignal: focusSignal != null && !focusSignal.id.startsWith('tracked-'),
        actionable,
        marketStatus,
      })
    : 'Watching';

  const activityLines = useMemo(() => {
    if (!bot || !focusSignal) return [];
    const p0 = pairFromWatched(bot.watchedPairs[0] ?? 'BTC');
    const p1 = pairFromWatched(bot.watchedPairs[1] ?? p0);
    const p2 = pairFromWatched(bot.watchedPairs[2] ?? p1);
    const lines = [
      `Scanned ${p0} — ${hasDisplayableSetup ? 'structure mapped' : 'no valid setup'}`,
      `Monitoring ${p1} after ${marketStatus === 'developing' ? 'impulse' : 'pullback'}`,
    ];
    if (!hasDisplayableSetup) {
      lines.push(`Rejected ${p2} — ${bot.detail.marketContext.volume === 'Weak' ? 'low volume' : 'timing'}`);
    } else {
      lines.push(`${p2} momentum check complete`);
    }
    if (marketStatus === 'triggered') {
      lines.push(`Trigger watch on ${focusSignal.pair}`);
    }
    return lines.slice(0, 5);
  }, [bot, focusSignal, hasDisplayableSetup, marketStatus]);

  const whyExplainKey = useMemo(
    () =>
      bot && focusSignal && chartModel
        ? `${bot.id}:${focusSignal.id}:${linearSymbol}:${chartInterval}`
        : '',
    [bot, focusSignal, chartModel, linearSymbol, chartInterval],
  );

  const tradeScoreForWhy = useMemo(() => {
    if (!focusSignal) return 55;
    if (bot && hasDisplayableSetup) return Math.round((bot.detail.confidencePct + focusSignal.setupScore) / 2);
    return focusSignal.setupScore;
  }, [bot, focusSignal, hasDisplayableSetup]);

  const [whyAiCache, setWhyAiCache] = useState<{
    key: string;
    headline: string;
    body: string;
    source: 'local' | 'remote';
  } | null>(null);
  const [whyAiLoading, setWhyAiLoading] = useState(false);

  const whyDisplay = whyAiCache?.key === whyExplainKey ? whyAiCache : null;

  useEffect(() => {
    if (!whyOpen || !whyExplainKey || !bot || !focusSignal || !chartModel) return;
    if (whyAiCache?.key === whyExplainKey) return;

    let cancelled = false;
    setWhyAiLoading(true);

    void (async () => {
      const status = deriveMarketStatus(focusSignal);
      try {
        const ctx = buildGroundedMarketContext({
          signal: focusSignal,
          status,
          tradeScore: tradeScoreForWhy,
          market: 'futures',
          chartInterval: String(chartInterval),
          model: chartModel,
          recentCandles: chartModel.chartCandles,
        });
        const res = await requestAssistantSuggestion({
          action: 'explain',
          signal: focusSignal,
          status,
          tradeScore: tradeScoreForWhy,
          context: ctx,
        });
        if (!cancelled) {
          setWhyAiCache({
            key: whyExplainKey,
            headline: res.headline,
            body: res.body,
            source: res.source,
          });
        }
      } finally {
        if (!cancelled) setWhyAiLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    whyOpen,
    whyExplainKey,
    whyAiCache?.key,
    bot,
    focusSignal,
    chartModel,
    chartInterval,
    tradeScoreForWhy,
  ]);

  const onIntervalChange = (v: TradeChartInterval) => {
    try {
      secureStorage.setItem(TRADE_CHART_INTERVAL_STORAGE_KEY, v);
      window.dispatchEvent(new CustomEvent(SIGFLO_CHART_INTERVAL_EVENT, { detail: v }));
    } catch (e) { console.error("[Caught Error]", e); }
  };

  const tapFlashTimerRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (tapFlashTimerRef.current != null) window.clearTimeout(tapFlashTimerRef.current);
    };
  }, []);
  const flash = (id: string) => {
    if (tapFlashTimerRef.current != null) window.clearTimeout(tapFlashTimerRef.current);
    setTapFlash(id);
    tapFlashTimerRef.current = window.setTimeout(() => {
      setTapFlash(null);
      tapFlashTimerRef.current = null;
    }, 160);
  };

  useEffect(() => {
    const fs = searchParams.get('focusSetup');
    if (fs !== '1' && fs !== 'true') return;
    if (!bot || !chartModelForPlot) return;
    const t = window.setTimeout(() => {
      requestChartSetupFocus({ pairFilter: chartModelForPlot.pair, botName: bot.name });
      setSearchParams(
        (prev) => {
          const n = new URLSearchParams(prev);
          n.delete('focusSetup');
          return n;
        },
        { replace: true },
      );
    }, 160);
    return () => clearTimeout(t);
  }, [bot, chartModelForPlot, searchParams, setSearchParams]);

  if (!bot) {
    return (
      <div className="space-y-3 pt-4 text-landing-text">
        <p className="text-sm text-landing-muted">Bot not found.</p>
        <Link to="/bots" className="text-sm font-semibold text-landing-accent-hi">
          Back to Bots
        </Link>
      </div>
    );
  }

  if (!chartModel || !chartModelForPlot) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-landing-muted">
        Preparing chart…
      </div>
    );
  }

  const setupSide = setupSideForExec;
  const rrDisplay = hasDisplayableSetup
    ? rrFromLevels(chartModel.side, chartModel.entry, chartModel.stop, chartModel.target)
    : chartModel.riskReward;

  const stickyTone =
    hasDisplayableSetup && cardStatus !== 'paused'
      ? 'shadow-[0_12px_40px_-12px_rgba(0,200,120,0.25)] ring-1 ring-landing-accent/15'
      : 'shadow-[0_8px_32px_rgba(0,0,0,0.35)]';

  const plotHeightPx = fullChartMode ? fullChartPlotPx : BOT_FOCUS_CHART_PLOT_PX;

  const chartPanelProps = {
    collapsed: false as const,
    plotExpandedPx: plotHeightPx,
    plotCollapsedPx: plotHeightPx,
    chartPlotFlexFill: fullChartMode && BOT_FOCUS_FULL_CHART_PLOT_FLEX_FILL,
    chartWrapClassName:
      fullChartMode && BOT_FOCUS_FULL_CHART_PLOT_FLEX_FILL
        ? 'mx-auto flex h-full min-h-0 min-w-0 w-full max-w-full flex-1 flex-col px-1 sm:px-2'
        : fullChartMode
          ? 'mx-auto h-full w-full max-w-full px-1 sm:px-2'
          : 'mx-auto w-full max-w-full px-1.5',
    timeScaleMaxBarSpacingPx: CHART_TIMESCALE_MAX_BAR_SPACING_PX,
    model: chartModelForPlot,
    market: 'futures' as const,
    intervalLabel: tradeChartIntervalShortLabel(chartInterval),
    loadingInterval: live.loadingInterval,
    liveUpdatedAt: live.lastUpdateTs,
    change24hPct: chartModelForPlot.change24hPct,
    timeframeOptions: FOCUS_INTERVAL_OPTIONS,
    chartInterval,
    onChartIntervalChange: onIntervalChange,
    exchangeStyleHero: true,
    metaCaption: (execLive ? 'PERP · Live position' : fullChartMode ? 'PERP · Full chart' : 'PERP · Bot focus') as string,
    setupMode: chartSetupMode,
    onSetupModeToggle: onChartSetupModeToggle,
    liveTradeMode: execLive,
    liveTradeOverlayPreset: execLive,
    suppressExchangeHeroLivePrice: execLive,
    liveActivePositionTitle: 'Live position',
    auxiliaryPriceLines: botExitChartAux,
    liveTradeRefitKey: execLive && execFillEntry != null ? `bot-focus-${execFillEntry}` : undefined,
    /** Snap time scale to the live candle when opening focus / switching pair (see PriceChartCard). */
    chartViewportSnapKey: whyExplainKey || undefined,
    liveHeaderMetrics: {
      riskPercent:
        chartModelForPlot.entry > 0
          ? Math.abs(((chartModelForPlot.stop - chartModelForPlot.entry) / chartModelForPlot.entry) * 100)
          : 0,
      rewardPercent:
        chartModelForPlot.entry > 0
          ? Math.abs(((chartModelForPlot.target - chartModelForPlot.entry) / chartModelForPlot.entry) * 100)
          : 0,
      rrRatio: Number.isFinite(rrDisplay) && rrDisplay > 0 ? rrDisplay : chartModelForPlot.riskReward,
      badge: `${confidencePct}%`,
      ...(headerSecondaryPnl
        ? {
            secondaryLine: headerSecondaryPnl.label,
            secondaryLineTone: headerSecondaryPnl.tone,
          }
        : {}),
    },
    pnlHeaderLabel: execLive ? headerSecondaryPnl?.label : undefined,
    pnlHeaderTone: execLive ? headerSecondaryPnl?.tone : undefined,
    className:
      fullChartMode && BOT_FOCUS_FULL_CHART_PLOT_FLEX_FILL
        ? 'flex min-h-0 min-w-0 flex-1 flex-col pb-0'
        : fullChartMode
          ? 'min-h-0 flex-1 pb-0'
          : 'pb-1',
    chartInnerChromeToggle: {
      expanded: fullChartMode,
      onToggle: () => {
        flash('expand');
        setFullChartMode(!fullChartMode);
      },
      variant: 'immersive' as const,
    },
    onSetupFocusBanner: onSetupFocusBannerCb,
    tradePlanExitLabel: (execLive ? 'ai' : 'exit') as 'ai' | 'exit',
  };

  const biasOverlay = (
    <div className="pointer-events-none absolute left-0 top-[3.5rem] z-[5] max-w-[min(100%,18rem)] px-3">
      <span
        className={`inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase leading-none tracking-wide backdrop-blur-sm shadow-[0_0_20px_rgba(0,200,120,0.2)] ${
          setupSide === 'short'
            ? 'border-rose-400/40 bg-rose-500/18 text-rose-100 shadow-[0_0_20px_rgba(248,113,113,0.2)]'
            : 'border-landing-accent/40 bg-landing-accent-dim text-landing-accent-hi'
        }`}
      >
        {setupSide === 'short' ? 'Short' : 'Long'} · {confidencePct}%
      </span>
    </div>
  );

  const pairPicker =
    bot.watchedPairs.length > 1 ? (
      <div className="relative z-[6] shrink-0 bg-landing-bg/95 px-3 py-2">
        <div className="flex min-h-[2rem] items-center gap-1.5 overflow-x-auto overflow-y-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {bot.watchedPairs.map((p) => {
            const active = pairFromWatched(p) === pairFromWatched(selectedWatched);
            return (
              <button
                key={p}
                type="button"
                onClick={() => {
                  flash(`pair-${p}`);
                  setSelectedPairRaw(p);
                }}
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition active:scale-[0.97] ${
                  active
                    ? 'border-landing-accent/40 bg-landing-accent-dim text-landing-accent-hi'
                    : 'border-white/[0.08] bg-landing-surface/80 text-landing-muted'
                } ${tapFlash === `pair-${p}` ? 'brightness-110' : ''}`}
              >
                {pairFromWatched(p)}
              </button>
            );
          })}
        </div>
      </div>
    ) : null;

  return (
    <motion.div
      layout={false}
      className={
        fullChartMode
          ? 'sigflo-bot-focus-root fixed inset-0 z-[95] flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-landing-bg text-landing-text motion-reduce:transition-none'
          : 'sigflo-bot-focus-root relative -mx-4 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-landing-bg text-landing-text'
      }
      transition={{ layout: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
    >
      {setupFocusBanner ? (
        <div
          className="pointer-events-none fixed left-0 right-0 z-[98] flex justify-center px-4"
          style={{
            top: fullChartMode
              ? 'calc(env(safe-area-inset-top, 0px) + 3.25rem)'
              : 'calc(env(safe-area-inset-top, 0px) + 4.25rem)',
          }}
          role="status"
        >
          <p className="max-w-sm rounded-full border border-landing-accent/35 bg-landing-bg/95 px-4 py-2 text-center text-[11px] font-semibold text-landing-accent-hi shadow-lg backdrop-blur-md">
            {setupFocusBanner}
          </p>
        </div>
      ) : null}
      {fullChartMode ? (
        <>
          <BotFocusFullChartTopBar
            bot={bot}
            onBack={() => setFullChartMode(false)}
            pairLabel={chartModel.pair}
            triggeredPairCount={triggeredPairCount}
            onOpenTradeWorkspace={() => {
              if (focusSignal) navigate(`/trade?${buildTradeQueryString(focusSignal, { marketStatus })}&reviewTop=1`);
            }}
          />
          {/*
            Chart must NOT sit inside overflow-y-auto — mobile scroll parents steal touch drags from Lightweight Charts.
            Scroll only the tools + insights stack below the plot.
          */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-1 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]">
            <div className="pointer-events-none shrink-0 px-2 pt-1 text-center">
              <p className="text-[10px] font-medium tracking-tight text-landing-muted/80">
                {bot.detail.setupStateLabel}
              </p>
            </div>
            {pairPicker}
            <div className="relative flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden">
              <motion.div
                layout={false}
                ref={chartSlotRef}
                className={`relative min-h-0 w-full min-w-0 overflow-hidden overscroll-none motion-reduce:transition-none ${
                  BOT_FOCUS_FULL_CHART_PLOT_FLEX_FILL ? 'flex min-h-0 flex-1 flex-col' : ''
                }`}
                style={{
                  flex: `1 1 ${BOT_FOCUS_FULL_CHART_FLEX_BASIS}`,
                  minHeight: BOT_FOCUS_FULL_CHART_PLOT_FLEX_FILL ? 220 : 0,
                  paddingBottom: BOT_FOCUS_FULL_CHART_DOCK_GAP_PX,
                }}
              >
                <TradeChartPanel {...chartPanelProps} />
                {biasOverlay}
              </motion.div>
            </div>
            <div className="max-h-[min(52dvh,480px)] min-h-0 shrink-0 overflow-y-auto overflow-x-hidden overscroll-y-contain [-webkit-overflow-scrolling:touch] border-t border-landing-border/35">
              <BotFocusChartToolsDock
                chartInterval={chartInterval}
                onIntervalChange={onIntervalChange}
                options={FOCUS_INTERVAL_OPTIONS}
                onFocusSetup={() =>
                  requestChartSetupFocus({ pairFilter: chartModelForPlot.pair, botName: bot.name })
                }
              />
              {execLive && chartModelForPlot && focusSignal ? (
                <div className="shrink-0 border-t border-landing-border/40 bg-landing-bg/90 px-2 py-2">
                  <ExitAiCoPilotBlock
                    model={botExitAiModel}
                    exitMode={exitAuto.mode}
                    onExitModeChange={exitAuto.setMode}
                    onCloseNow={navigateToTradeForExit}
                    compact
                  />
                </div>
              ) : null}
              <BotFocusInsightDrawer
                open={insightDrawerOpen}
                onToggle={() => setInsightDrawerOpen((v) => !v)}
                bot={bot}
                hasActiveSetup={hasDisplayableSetup}
                rrDisplay={Number.isFinite(rrDisplay) ? rrDisplay : chartModel.riskReward}
                toggleClassName="pr-[4.75rem] sm:pr-[5.25rem]"
                intentDisplay={liveSetupCopy?.intentLine}
                commentaryDisplay={liveSetupCopy?.commentaryShort}
                structureNote={liveSetupCopy?.structureFootnote}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {/*
            Chart stays outside overflow-y-auto so pan/zoom reaches Lightweight Charts on touch devices.
          */}
          <div
            className={`sticky top-0 z-20 shrink-0 -mx-0 border-b border-landing-border/60 bg-landing-bg/95 backdrop-blur-xl ${stickyTone}`}
          >
            <BotFocusHeader
              bot={bot}
              cardStatus={cardStatus}
              triggeredPairCount={triggeredPairCount}
              onBack={canGoBack ? () => navigate(-1) : undefined}
            />
            <div className="border-t border-landing-border/50 bg-black/20 px-3 py-1.5">
              <p className="text-[9px] leading-snug text-landing-muted">
                <span className="font-semibold text-landing-accent-hi">{tradingModeMeta.shortLabel}</span>
                <span className="text-landing-muted/80"> · </span>
                {tradingModeMeta.focusHint}
                {tradingControlMode === 'auto' && !TRADING_AUTO_EXECUTION_ACTIVE ? (
                  <span className="text-amber-200/90"> Change mode on Bots.</span>
                ) : null}
              </p>
            </div>
          </div>
          {pairPicker}
          <div className="relative w-full shrink-0 overflow-hidden overscroll-none">
            <motion.div
              layout={false}
              ref={chartSlotRef}
              className="relative w-full shrink-0"
              transition={{ layout: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
            >
              <TradeChartPanel {...chartPanelProps} />
              {biasOverlay}
            </motion.div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain [-webkit-overflow-scrolling:touch]">
          <div className="space-y-4 px-4 pb-[calc(12.5rem+env(safe-area-inset-bottom))] pt-4 md:pb-[calc(13rem+env(safe-area-inset-bottom))]">
        <section className="rounded-2xl border border-landing-border bg-landing-surface landing-panel-texture p-4 shadow-landing-card">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-landing-muted">Intent</p>
          <p className="mt-1.5 text-sm font-medium leading-snug text-landing-text">
            {liveSetupCopy?.intentLine ?? bot.intentLine}
          </p>
          {liveSetupCopy?.structureFootnote ? (
            <p className="mt-1 text-[10px] leading-snug text-landing-muted">{liveSetupCopy.structureFootnote}</p>
          ) : null}
          <p className="mt-2 text-xs leading-relaxed text-landing-muted">
            {liveSetupCopy?.commentaryShort ?? bot.detail.commentaryShort ?? bot.detail.aiNote}
          </p>
          <div className="mt-3 inline-flex items-center rounded-full border border-white/[0.08] bg-black/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-landing-accent-hi">
            {stateLabel}
          </div>
        </section>

        {execLive && chartModelForPlot && focusSignal ? (
          <ExitAiCoPilotBlock
            model={botExitAiModel}
            exitMode={exitAuto.mode}
            onExitModeChange={exitAuto.setMode}
            onCloseNow={navigateToTradeForExit}
            compact
          />
        ) : null}

        <section
          className={`rounded-2xl border bg-landing-surface landing-panel-texture p-4 ${
            hasDisplayableSetup ? 'border-landing-accent/25 shadow-landing-glow-sm' : 'border-landing-border'
          }`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-landing-muted">Setup</p>
          {hasDisplayableSetup ? (
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
              <div>
                <dt className="text-landing-muted">Bias</dt>
                <dd className="mt-0.5 font-semibold text-landing-text">
                  {chartModel.side === 'long' ? 'Long' : 'Short'}
                </dd>
              </div>
              <div>
                <dt className="text-landing-muted">Confidence</dt>
                <dd className="mt-0.5 font-semibold text-landing-accent-hi">{bot.detail.confidencePct}%</dd>
              </div>
              <div>
                <dt className="text-landing-muted">Entry</dt>
                <dd className="mt-0.5 font-mono text-landing-text">{formatBotPrice(chartModel.entry)}</dd>
              </div>
              <div>
                <dt className="text-landing-muted">Stop</dt>
                <dd className="mt-0.5 font-mono text-rose-200/90">{formatBotPrice(chartModel.stop)}</dd>
              </div>
              <div>
                <dt className="text-landing-muted">Target</dt>
                <dd className="mt-0.5 font-mono text-emerald-200/90">{formatBotPrice(chartModel.target)}</dd>
              </div>
              <div>
                <dt className="text-landing-muted">R:R</dt>
                <dd className="mt-0.5 font-mono font-semibold text-landing-text">
                  {Number.isFinite(rrDisplay) && rrDisplay > 0 ? `${rrDisplay.toFixed(2)} : 1` : '—'}
                </dd>
              </div>
            </dl>
          ) : (
            <div className="mt-2">
              <p className="text-sm font-semibold text-landing-text">No active setup</p>
              <p className="mt-1 text-xs text-landing-muted">Bot is monitoring market conditions</p>
            </div>
          )}
        </section>

        <section>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-landing-muted">
            Market context
          </p>
          <MarketContextTags
            volatility={bot.detail.marketContext.volatility}
            structure={bot.detail.marketContext.structure}
            volume={bot.detail.marketContext.volume}
          />
        </section>

        <section>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-landing-muted">Activity</p>
          <ul className="space-y-2">
            {activityLines.map((line) => (
              <li
                key={line}
                className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#12171f] py-2.5 pl-3 pr-2 text-xs text-landing-text/90"
              >
                <span
                  className="pointer-events-none absolute left-0 top-0 z-[1] h-full w-0.5 rounded-full bg-landing-accent/50"
                  aria-hidden
                />
                <span className="relative z-[1] block">{line}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-landing-accent/20 bg-landing-surface landing-panel-texture p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-landing-muted">Agent personality</p>
          <p className="mt-2 text-sm font-medium leading-snug text-landing-text">{botPersonality(bot.personalityId).tagline}</p>
          <ul className="mt-3 space-y-1.5">
            {botPersonality(bot.personalityId).traits.map((t) => (
              <li key={t} className="flex gap-2 text-[11px] leading-snug text-landing-muted">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-landing-accent/70" aria-hidden />
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 rounded-xl border border-white/[0.06] bg-black/25 px-3 py-2 text-[10px] leading-relaxed text-landing-muted">
            Exit AI readouts respect this style in <span className="font-semibold text-landing-accent-hi/95">suggestion</span>{' '}
            mode — you stay in control; auto-exit is off unless you enable it later.
          </p>
        </section>

        <section className="rounded-2xl border border-landing-border bg-[#12171f]">
          <button
            type="button"
            onClick={() => setWhyOpen((v) => !v)}
            className="flex w-full items-center justify-between px-3 py-2.5 text-left text-xs font-semibold text-landing-text transition active:bg-white/[0.04]"
          >
            Why this setup?
            <span className="text-landing-muted">{whyOpen ? '−' : '+'}</span>
          </button>
          {whyOpen ? (
            <div className="border-t border-landing-border px-3 py-2.5">
              {whyAiLoading && !whyDisplay ? (
                <div className="space-y-2" aria-busy="true" aria-live="polite">
                  <div className="h-3 w-[85%] animate-pulse rounded bg-white/[0.08]" />
                  <div className="h-3 w-full animate-pulse rounded bg-white/[0.06]" />
                  <div className="h-3 w-[92%] animate-pulse rounded bg-white/[0.06]" />
                  <p className="text-[10px] font-medium text-landing-muted">Generating explanation…</p>
                </div>
              ) : whyDisplay ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 text-xs font-semibold leading-snug text-landing-text">
                      {whyDisplay.headline}
                    </p>
                    <span
                      className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                        whyDisplay.source === 'remote'
                          ? 'border-emerald-400/35 bg-emerald-500/15 text-emerald-200'
                          : 'border-amber-400/35 bg-amber-500/15 text-amber-200'
                      }`}
                    >
                      {whyDisplay.source === 'remote' ? 'AI live' : 'Offline'}
                    </span>
                  </div>
                  <p className="whitespace-pre-line text-xs leading-relaxed text-landing-muted">{whyDisplay.body}</p>
                  <p className="border-t border-landing-border pt-2 text-[10px] leading-relaxed text-landing-muted/90">
                    <span className="font-semibold text-landing-muted">Agent note: </span>
                    {bot.detail.aiNote}
                  </p>
                </div>
              ) : (
                <p className="text-xs leading-relaxed text-landing-muted">
                  {whyExplainKey
                    ? 'Could not load chart context for AI. Showing the static agent note below.'
                    : 'Open a market on this bot to generate an explanation.'}
                  {bot.detail.aiNote ? (
                    <>
                      {' '}
                      <span className="block pt-2">{bot.detail.aiNote}</span>
                    </>
                  ) : null}
                </p>
              )}
            </div>
          ) : null}
        </section>
          </div>
          </div>
        </div>
      )}

      {!fullChartMode && !executionOpen ? (
      <div
        className={`fixed left-0 right-0 z-[35] border-t border-landing-border bg-landing-surface landing-panel-texture px-4 py-2.5 backdrop-blur-xl transition ${
          tapFlash === 'trade' ? 'brightness-105' : ''
        }`}
        style={{ bottom: 'calc(5.35rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <button
          type="button"
          disabled={!canExecute}
          onClick={() => {
            flash('trade');
            setExecutionOpen(true);
          }}
          className={`w-full rounded-xl bg-landing-accent py-2.5 text-sm font-bold text-landing-bg transition enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-landing-muted disabled:shadow-none ${
            canExecute ? 'sigflo-bot-focus-trade-fab-tradable' : 'shadow-landing-glow-sm'
          }`}
        >
          Execute trade
        </button>
        {tradeDisabledNote ? (
          <p className="mt-1.5 text-center text-[10px] leading-snug text-landing-muted/90">{tradeDisabledNote}</p>
        ) : null}
        <div className="mt-2 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => {
              flash('pause');
              togglePause(bot.id);
            }}
            className={`rounded-xl border border-landing-border bg-landing-bg/80 py-2 text-[11px] font-semibold transition active:scale-[0.98] ${
              storedStatus === 'paused' ? 'text-landing-accent-hi' : 'text-landing-text'
            }`}
          >
            {storedStatus === 'paused' ? 'Resume' : 'Pause bot'}
          </button>
          <button
            type="button"
            onClick={() => {
              flash('risk');
              if (adjustRiskFocusSnapshot) setAdjustRiskOpen(true);
              else navigate(`/bots/${bot.id}/settings`);
            }}
            className="rounded-xl border border-landing-border bg-landing-bg/80 py-2 text-[11px] font-semibold text-landing-text transition active:scale-[0.98]"
          >
            Adjust risk
          </button>
          <button
            type="button"
            onClick={() => {
              flash('chart');
              setFullChartMode(true);
            }}
            className="rounded-xl border border-landing-border bg-landing-bg/80 py-2 text-[11px] font-semibold text-landing-text transition active:scale-[0.98]"
          >
            Full chart
          </button>
        </div>
      </div>
      ) : null}

      {fullChartMode && !executionOpen ? (
        <div
          className="pointer-events-none fixed inset-x-0 z-[100] flex justify-end pr-[max(0.5rem,env(safe-area-inset-right,0px))] pl-2"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 3.5rem)' }}
        >
          {/*
            Column stays pointer-events-none so only the compact control clusters capture taps.
            A single pointer-events-auto wrapper was as wide as note+FAB and blocked the Insights Hide row underneath.
          */}
          <div className="pointer-events-none flex w-fit flex-col items-end gap-2">
            <div className="pointer-events-auto flex w-fit flex-col gap-1.5 rounded-2xl border border-landing-border/80 bg-landing-surface landing-panel-texture p-1.5 shadow-landing-card backdrop-blur-md">
              <button
                type="button"
                onClick={() => {
                  flash('pause');
                  togglePause(bot.id);
                }}
                className={`rounded-xl border border-white/[0.06] bg-landing-bg/80 px-3 py-2 text-[10px] font-semibold transition active:scale-[0.98] ${
                  storedStatus === 'paused' ? 'text-landing-accent-hi' : 'text-landing-text'
                }`}
              >
                {storedStatus === 'paused' ? 'Resume' : 'Pause'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (adjustRiskFocusSnapshot) setAdjustRiskOpen(true);
                  else navigate(`/bots/${bot.id}/settings`);
                }}
                className="rounded-xl border border-white/[0.06] bg-landing-bg/80 px-3 py-2 text-[10px] font-semibold text-landing-text transition active:scale-[0.98]"
              >
                Risk
              </button>
            </div>
            <div className="pointer-events-auto flex w-fit max-w-[min(100vw-1rem,14rem)] items-center justify-end gap-2">
              {tradeDisabledNote ? (
                <p className="max-w-[6.75rem] text-right text-[9px] font-medium leading-tight text-landing-muted/90">
                  {tradeDisabledNote}
                </p>
              ) : null}
              <button
                type="button"
                disabled={!canExecute}
                onClick={() => {
                  flash('trade');
                  setExecutionOpen(true);
                }}
                className={`shrink-0 flex h-14 w-14 items-center justify-center rounded-full bg-landing-accent text-xs font-bold leading-tight text-landing-bg transition enabled:active:scale-[0.96] disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-landing-muted disabled:shadow-none ${
                  canExecute
                    ? 'sigflo-bot-focus-trade-fab-tradable'
                    : 'shadow-[0_8px_28px_-6px_rgba(0,255,200,0.45)]'
                }`}
                aria-label="Execute trade"
              >
                Trade
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <BotExecutionSheet
        open={executionOpen}
        onClose={() => setExecutionOpen(false)}
        pairLabel={chartModel.pair}
        chartModel={chartModel}
        side={setupSideForExec}
        setupScore={focusSignal?.setupScore ?? 55}
        balanceUsd={balanceForSizing}
        minOrderUsd={resolveMinOrderUsd(linearSymbol)}
        maxLeverage={symbolMaxLeverage ?? 200}
        onExecute={executeTradeFromFocus}
        onViewPosition={() => {
          if (focusSignal) {
            navigate(`/trade?${buildTradeQueryString(focusSignal, { marketStatus })}&reviewTop=1`);
          }
        }}
        tabBarInsetPx={fullChartMode ? 16 : 74}
      />

      <AdjustRiskSheet
        open={adjustRiskOpen}
        onClose={() => setAdjustRiskOpen(false)}
        tabBarInsetPx={fullChartMode ? 16 : 74}
        snapshot={adjustRiskFocusSnapshot}
        exitAuto={adjustRiskExitApi}
      />
    </motion.div>
  );
}
