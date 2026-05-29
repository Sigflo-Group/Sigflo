import { secureStorage } from '@/lib/storage';
import { dismissFirstTradeGuide, isFirstTradeGuideDismissed } from '@/lib/firstTradeGuide';
import { ariaExpanded, ariaPressed, ariaSelected } from '@/a11y/ariaBoolean';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AssistedExitConfirmBar } from '@/components/trade/AssistedExitConfirmBar';
import { ExitAutomationControls } from '@/components/trade/ExitAutomationControls';
import { TradeChartScenarioStrip, computeScenarioProbabilities } from '@/components/trade/TradeChartScenarioStrip';
import { MarketToggle } from '@/components/trade/MarketToggle';
import { ActivePositionsPanel } from '@/components/trade/ActivePositionsPanel';
import { CloseAllPositionsModal } from '@/components/trade/CloseAllPositionsModal';
import { ClosedPositionSummaryModal } from '@/components/trade/ClosedPositionSummaryModal';
import { ExitModePanel } from '@/components/trade/ExitModePanel';
import { LiveMarketStrip } from '@/components/trade/LiveMarketStrip';
import { DockManageAdjustButtons } from '@/components/trade/PositionActionsBar';
import { TradeChartPanel } from '@/components/trade/TradeChartPanel';
import {
  ChartDockCloseRow,
  ChartDockTradeSetupPair,
  DockSplitEntryButtons,
} from '@/components/trade/TradeActionBar';
import { StatusChip } from '@/components/trade/StatusChip';
import { ScannerInsightCard } from '@/components/trade/ScannerInsightCard';
import { EarlyRegimeWarningPanel } from '@/components/analytics/EarlyRegimeWarningPanel';
import { WhyThisTradePanel } from '@/components/trade/WhyThisTradePanel';
import { EntryPlanCard } from '@/components/trade/EntryPlanCard';
import { ExecutionLockCard } from '@/components/trade/ExecutionLockCard';
import { PaperTradePreview } from '@/components/trade/PaperTradePreview';
import { RiskReviewCard } from '@/components/trade/RiskReviewCard';
import { SetupThesisCard } from '@/components/trade/SetupThesisCard';
import { TradeReasoningTimeline } from '@/components/trade/TradeReasoningTimeline';
import { TradeMiniChart } from '@/components/trade/TradeMiniChart';
import { TradeReviewHeader } from '@/components/trade/TradeReviewHeader';
import { TradingControlExitBridge } from '@/components/trade/TradingControlExitBridge';
import { TradingControlTradeHint } from '@/components/trade/TradingControlTradeHint';
import { TradeControls } from '@/components/trade/TradeControls';
import { GuidedExecutionPanel, type GuidedExecutionSetup } from '@/components/trade/GuidedExecutionPanel';
import { LiveIndicator } from '@/components/trade/LiveIndicator';
import { AdjustRiskSheet, type AdjustRiskPositionSnapshot } from '@/components/trade/AdjustRiskSheet';
import { ManagePartialCloseSheet } from '@/components/trade/position/ManagePartialCloseSheet';
import { ManagePositionControlPanel } from '@/components/trade/position/ManagePositionControlPanel';
import { TradeStats } from '@/components/trade/TradeStats';
import { getFeedRoute } from '@/config/appRoutes';
import {
  CHART_TIMESCALE_MAX_BAR_SPACING_PX,
  TRADE_CHART_PLOT_EXPANDED_PX,
  TRADE_CHART_PLOT_MANAGE_MAXIMIZED_PX,
} from '@/config/tradeChartHeights';
import { requestChartSetupFocus } from '@/lib/chartSetupFocus';
import {
  buildReasoningTimelineItems,
  deriveRiskLabelForReview,
  parseSourceEngineFromOpportunityId,
} from '@/lib/tradeReviewCockpit';
import { formatQuoteNumber } from '@/lib/formatQuote';
import { roundUsdAmount, coerceUsdField } from '@/lib/tradeMath';
import { useCanGoBack } from '@/hooks/useCanGoBack';
import { useExitAutomation } from '@/hooks/useExitAutomation';
import { useAppAnnouncementsEnabled } from '@/hooks/useAppAnnouncementsEnabled';
import { usePaperTrading } from '@/hooks/usePaperTrading';
import { emitGlobalAnnouncement } from '@/lib/globalAnnouncements';
import { useAccountSnapshot } from '@/hooks/useAccountSnapshot';
import { useSignalEngine } from '@/hooks/useSignalEngine';
import { useLiveTradeMarket, type TradeChartInterval } from '@/hooks/useLiveTradeMarket';
import { useThrottledLiveUnrealized } from '@/hooks/useThrottledLiveUnrealized';
import { managePnlFromPrices, parseManageTradeContext } from '@/lib/manageTradeContext';
import { buildManageTradeQueryFromLinearPosition, buildTradeQueryString } from '@/lib/tradeNavigation';
import { isTradePairFavorite, normalizeTradePairBase, toggleTradePairFavorite } from '@/lib/tradePairFavorites';
import {
  readAppAnnouncementsEnabled,
  setAppAnnouncementsEnabled,
} from '@/lib/appAnnouncementsPreference';
import { setBiasFlipNotifyTradeFocusLinearSymbol } from '@/lib/biasFlipNotifyGate';
import { positionBiasForSignalRow } from '@/lib/positionBiasStat';
import { computePositionHealth } from '@/lib/positionHealth';
import { positionMicroInsight } from '@/lib/positionMicroInsight';
import {
  buildTrackedFallbackSignal,
  countTriggeredPairs,
  deriveMarketStatus,
  pickBestSignalForPair,
  parseMarketStatusQuery,
  symbolToPair,
} from '@/lib/marketScannerRows';
import { formatElapsedAgo, postedAgoToSeconds, uiSignalStateClasses, uiSignalStateFromMarketStatus, uiSignalStateLabel } from '@/lib/signalState';
import { EXIT_AI_MODE_LABEL, EXIT_STRATEGY_LABEL } from '@/lib/aiExitAutomation';
import { TRADE_CHART_LEVEL_COLORS } from '@/lib/tradeChartLevels';
import {
  readPersistedTradeChartInterval,
  SIGFLO_CHART_INTERVAL_EVENT,
  TRADE_CHART_INTERVAL_STORAGE_KEY,
} from '@/lib/tradeChartIntervalPreference';
import {
  nextExitFlowForDisplay,
  type ExitFlowDisplayStash,
} from '@/lib/exitFlowDisplayStabilize';
import { buildExitAiCoPilotModel, buildManageAiExitZoneAuxLines } from '@/lib/exitAiCoPilot';
import { resolveExitGuidanceFlow } from '@/lib/tradeExitGuidanceFlow';
import {
  buildTradeTimingUiModel,
  getExecutionQuality,
  getExecutionTradeScorePenalty,
  getSetupDisplayState,
  resolveIdealEntryForExecution,
  type TriggerLockSnapshot,
} from '@/lib/tradeSetupExecutionModel';
import { setupScoreBandShort } from '@/lib/setupScore';
import { buildClosedPositionSummary, type ClosedPositionSummary } from '@/lib/closedPositionSummary';
import { buildGroundedMarketContext } from '@/lib/buildGroundedMarketContext';
import { buildWhyThisTradeModel } from '@/lib/whyThisTrade';
import { BYBIT_ASSET_TRANSFER_HREF } from '@/lib/exchangeTransferUrls';
import {
  buildTradeViewModelFromSignal,
  coerceStopTargetToSide,
  ensureStopForOpenPosition,
  ensureTargetForOpenPosition,
  resolveTradeAnchorPrice,
} from '@/lib/tradeViewFromSignal';
import { syntheticFromExchangePosition, syntheticFromSpotHolding } from '@/lib/exchangePositionSynthetic';
import { formatBybitTradeErrorMessage, resolveBybitTradeError } from '@/lib/bybitUserFacingError';
import { formatLinearPriceStringForBybit, linearTpSlStringsForOpen } from '@/lib/bybitLinearTpSl';
import { DEFAULT_BYBIT_TPSL_TRIGGER, type BybitTpSlTriggerBy } from '@/lib/bybitTpSlTrigger';
import {
  applyOpenOrderNotionalBuffer,
  linearQtyFromBaseAmount,
  linearQtyFromNotionalUsd,
  spotQuoteQtyFromUsd,
} from '@/lib/linearOrderQty';
import { spotBaseAssetFromOrderSymbol } from '@/lib/spotSymbol';
import { deriveTradeMetrics } from '@/lib/tradeRisk';
import {
  deleteExitAutomationWatch,
  listExitAutomationWatches,
  postBybitLinearOrder,
  postBybitSetLinearLeverage,
  postBybitLinearTradingStop,
  postBybitSpotOrder,
  postMexcLinearOrder,
  putExitAutomationWatch,
} from '@/services/api/tradeClient';
import { fetchLinearMaxLeverage } from '@/services/bybit/client';
import { signalsToOpportunities } from '@/lib/signalsToOpportunities';
import {
  getPositionRepository,
  normalizePositionPairKey,
  sigfloActivePositionFromExchange,
  simulatedFromSigfloActive,
} from '@/services/positions';
import { DEMO_POSITIONS_CHANGED_EVENT } from '@/services/positions/demoPositionRepository';
import { DailyRiskGuardBanner } from '@/components/risk/DailyRiskGuardBanner';
import { useDailyRiskGuard } from '@/services/risk/dailyRiskGuard';
import { activePositionCountForRisk, countExchangeOpenLegs, useRiskSettings } from '@/services/risk/riskSettings';
import type { SymbolTicker } from '@/types/market';
import type { CryptoSignal, SetupScoreLabel, SignalRiskTag, SignalSetupTag } from '@/types/signal';
import type { SimulatedActivePosition } from '@/types/activePosition';
import type { ExchangeSnapshot, PositionItem } from '@/types/integrations';
import type { OpportunityCardModel } from '@/types/botSystem';
import type { MarketMode, TradeSide } from '@/types/trade';
import {
  parseEntryZoneMidpoint,
  parsePriceFromString,
  parseTargetPrices,
  validateBotsPaperPlan,
} from '@/utils/tradeMath';


const PAPER_REAL_ACCOUNT_NUDGE_DISMISS_KEY = 'sigflo_paper_real_account_nudge_dismissed';

const TRADE_PAIR_PICKER_FALLBACKS: CryptoSignal[] = [
  buildTrackedFallbackSignal('BTC', 'BTCUSDT'),
  buildTrackedFallbackSignal('ETH', 'ETHUSDT'),
  buildTrackedFallbackSignal('SOL', 'SOLUSDT'),
  buildTrackedFallbackSignal('PAXG', 'PAXGUSDT'),
  buildTrackedFallbackSignal('XAG', 'XAGUSDT'),
];

/** Recent `auto_close` activity with an order submit — used to label sync feedback after the position drops off the account. */
function recentExitAiAutoCloseSubmit(
  activity: readonly { ts: number; kind: string; message: string }[],
  withinMs: number,
): boolean {
  const cutoff = Date.now() - withinMs;
  for (let i = activity.length - 1; i >= 0; i--) {
    const e = activity[i]!;
    if (e.ts < cutoff) break;
    if (e.kind === 'auto_close' && /submitting/i.test(e.message)) return true;
  }
  return false;
}



/** Fresh snapshot after an order — pick the open leg for TP/SL sync (hedge-safe `positionIdx`). */
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

/** Bybit linear hedge: idx 1 = long leg, 2 = short; one-way uses 0. */
function bybitLinearPositionIdxForOpenSide(side: TradeSide, hedgeHintIdx: number): number {
  if (hedgeHintIdx === 1 || hedgeHintIdx === 2) {
    return side === 'long' ? 1 : 2;
  }
  return 0;
}

function bybitLinearLegStillOpen(
  snapshots: ExchangeSnapshot[],
  orderSymbol: string,
  legSide: TradeSide,
  positionIdx: number,
): boolean {
  const bybit = snapshots.find((s) => s.exchange === 'bybit' && s.status === 'connected');
  return Boolean(
    bybit?.positions?.some(
      (x) =>
        x.symbol === orderSymbol &&
        x.size > 0 &&
        x.side === legSide &&
        (x.positionIdx ?? 0) === positionIdx,
    ),
  );
}

/**
 * Trade screen layout map (refinement anchor):
 * - Signal / scanner state: sticky header (pair, `uiSignalState` + LiveIndicator, live connection meta).
 * - Timing / readiness: `ScannerInsightCard`, `ChartHeader` subtitle, chart dock strip (`dockDecisionMeta`).
 * - LONG / SHORT: flat dock uses full-width `DockSplitEntryButtons` (Sell/Buy two-up); sheet uses `TradeControls` when expanded.
 * - Chart, intervals, Clean vs Setup: `TradeChartPanel` → `PriceChartCard` (`SetupToggle`).
 * - Entry / stop / target overlays: `PriceChartCard`, gated by `setupMode` (default false).
 * - AI explanation: `ScannerInsightCard` (scroll stack, above scenario strip).
 */
const TRADE_CHART_INTERVAL_OPTIONS: { value: TradeChartInterval; label: string }[] = [
  { value: '1', label: '1m' },
  { value: '5', label: '5m' },
  { value: '15', label: '15m' },
  { value: '60', label: '1H' },
  { value: '240', label: '4H' },
  { value: 'D', label: '1D' },
  { value: 'W', label: '1W' },
];

/**
 * Beta fallback minimum notional when per-symbol exchange rules are not wired yet.
 * Keep this low so small-balance users can still validate flows.
 */
const BETA_FALLBACK_MIN_ORDER_USD = 5;

/**
 * Optional symbol-specific overrides (USD notional). Add real exchange metadata when available.
 */
const SYMBOL_MIN_NOTIONAL_USD: Record<string, number> = {
  BTCUSDT: 5,
  ETHUSDT: 5,
};
const EXIT_AI_AUTO_TRIM_MIN_POSITION_AGE_MS = 30_000;

function resolveMinOrderUsd(symbol: string, _market: MarketMode): number {
  const s = symbol.toUpperCase();
  return SYMBOL_MIN_NOTIONAL_USD[s] ?? BETA_FALLBACK_MIN_ORDER_USD;
}

function pairBaseToLinearSymbol(pair: string): string {
  const raw = pair.trim().toUpperCase();
  const base = raw.includes('/') ? raw.split('/')[0].trim() : raw.replace(/USDT$/i, '').trim();
  const clean = base.replace(/[^A-Z0-9]/g, '');
  return `${clean || 'BTC'}USDT`;
}

/** Linked Bybit overview subset — used for UTA sizing vs display (must stay in sync). */
type TradeBalanceOverview = {
  availableToTrade: number | null;
  totalWalletBalance: number | null;
};

/**
 * Cap for amount slider / validation when the exchange is linked. Bybit often reports
 * `availableToTrade === 0` while `totalWalletBalance` still reflects equity you see in the app;
 * using only the former makes `amountMax` 0 and triggers "Insufficient available balance".
 */
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



/** Display label for signal `pair` in the live strip ticker (matches chart pair style when possible). */
function formatSignalPairForTicker(pair: string): string {
  const p = pair.trim();
  if (p.includes('/')) return p;
  const base = p.replace(/USDT$/i, '').replace(/[^a-zA-Z0-9]/g, '');
  return `${base || '—'} / USDT`;
}

/** Pretty pair for Bots → Trade query params (often `BTCUSDT` without slash). */
function formatBotsQueryPair(pairParam: string): string {
  const p = pairParam.trim().toUpperCase();
  if (!p) return '—';
  if (p.includes('/')) return p;
  const base = p.replace(/USDT$/i, '').replace(/USDC$/i, '');
  if (base && base !== p) return `${base} / USDT`;
  return p;
}

export function TradeScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const canGoBack = useCanGoBack();
  const [params, setSearchParams] = useSearchParams();
  const botsReviewContext = useMemo(() => {
    const source = (params.get('source') ?? '').trim().toLowerCase();
    if (source !== 'bots') return null;
    const pair = (params.get('pair') ?? '').trim();
    const setup = (params.get('setup') ?? '').trim();
    const state = (params.get('state') ?? '').trim();
    const opportunityId = (params.get('opportunityId') ?? '').trim();
    const dirRaw = (params.get('direction') ?? '').trim().toUpperCase();
    const directionFromQuery = dirRaw === 'LONG' || dirRaw === 'SHORT' ? (dirRaw as 'LONG' | 'SHORT') : null;
    return { pair, setup, state, opportunityId, directionFromQuery };
  }, [params]);
  const [botsTradeOpp, setBotsTradeOpp] = useState<OpportunityCardModel | null | undefined>(undefined);
  const [botsTradeOppLoading, setBotsTradeOppLoading] = useState(false);
  const [botsPlannedStop, setBotsPlannedStop] = useState<number | null>(null);
  const [botsPlannedTargets, setBotsPlannedTargets] = useState<number[] | null>(null);
  const [botsPaperPulseToken, setBotsPaperPulseToken] = useState(0);

  /** Deep link from Bots active strip: `/trade?pair=BTCUSDT&source=position` */
  const positionReviewFromQuery = useMemo(() => {
    const src = (params.get('source') ?? '').trim().toLowerCase();
    if (src !== 'position') return null;
    const raw = (params.get('pair') ?? '').trim();
    if (!raw) return null;
    return { pairRaw: raw };
  }, [params]);

  const opportunityIdFromQuery = useMemo(() => (params.get('opportunityId') ?? '').trim(), [params]);

  /** When reviewing an open Sigflo row without an engine opportunity, skip workspace setup hints. */
  const hideFreshSetupTradeHint = Boolean(positionReviewFromQuery && !opportunityIdFromQuery);
  const [showTradeGuide, setShowTradeGuide] = useState(() => !hideFreshSetupTradeHint && !isFirstTradeGuideDismissed());

  useEffect(() => {
    if (!botsTradeOpp) return;
    setSide(botsTradeOpp.direction === 'LONG' ? 'long' : 'short');
  }, [botsTradeOpp]);

  /** Any `source=bots` review path stays off live exchange entry; paper preview only. */
  const liveExecutionLocked = Boolean(botsReviewContext);
  const signalId = params.get('signal') ?? 'sig-1';
  const [market, setMarket] = useState<MarketMode>('futures');
  const [chartInterval, setChartInterval] = useState<TradeChartInterval>(readPersistedTradeChartInterval);
  const [amountUsd, setAmountUsd] = useState<number>(0);
  const [leverage, setLeverage] = useState<number>(8);
  /** Bybit linear `instruments-info` max leverage for the active symbol (futures only). */
  const [symbolMaxLeverage, setSymbolMaxLeverage] = useState<number | null>(null);
  const [side, setSide] = useState<TradeSide>('long');
  const [stopStr, setStopStr] = useState('');
  const [targetStr, setTargetStr] = useState('');
  /** Futures: Bybit TP/SL trigger (mark / last / index) for new orders + manage TP/SL apply. */
  const [futuresTpSlTriggerBy, setFuturesTpSlTriggerBy] = useState<BybitTpSlTriggerBy>(DEFAULT_BYBIT_TPSL_TRIGGER);
  const [tradeToast, setTradeToast] = useState<string | null>(null);
  const [tradeToastCta, setTradeToastCta] = useState<{ label: string; href: string } | null>(null);
  /** Bumps after `Notification.requestPermission()` so header/menu re-reads `Notification.permission`. */
  const [biasNotifyPermTick, setBiasNotifyPermTick] = useState(0);
  const [termsRetrySide, setTermsRetrySide] = useState<TradeSide | null>(null);
  const toastClearRef = useRef<number>(0);
  /** After an in-app close, polling will drop the leg — skip duplicate “external close” toasts. */
  const suppressExternalPositionCloseFeedbackUntilRef = useRef(0);
  /** Close-then-open reverse: snapshot can briefly show flat — do not auto-leave manage mid-flight. */
  const reverseOrderInProgressRef = useRef(false);
  const [execFlash, setExecFlash] = useState<'long' | 'short' | null>(null);
  const execFlashClearRef = useRef<number>(0);
  /** Price chart dock always mounts collapsed; manage mode forces it open. */
  const [chartDockOpen, setChartDockOpen] = useState(false);
  /** Trade dock chart-only full-height mode (triggered by in-chart maximize control). */
  const [chartDockMaximized, setChartDockMaximized] = useState(false);
  /** Manage-position chart expand/collapse from in-chart maximize button. */
  const [manageChartMaximized, setManageChartMaximized] = useState(false);
  const [managePartialSheetOpen, setManagePartialSheetOpen] = useState(false);
  const [adjustRiskOpen, setAdjustRiskOpen] = useState(false);
  const [managePartialFraction, setManagePartialFraction] = useState(0.25);
  const [dockPartialPct, setDockPartialPct] = useState(100);
  const [dockPartialOpen, setDockPartialOpen] = useState(false);
  /** After user toggles the chart dock (title or chevron), drop the chevron glow/pulse. */
  const [chartDockChevronIdle, setChartDockChevronIdle] = useState(false);
  /** Header pair chevron: pick another tracked setup / watchlist symbol. */
  const [tradePairMenuOpen, setTradePairMenuOpen] = useState(false);
  const [tradeHeaderMoreOpen, setTradeHeaderMoreOpen] = useState(false);
  /** Bumps when watchlist toggles so `isTradePairFavorite` re-reads localStorage. */
  const [tradeFavRevision, setTradeFavRevision] = useState(0);
  const tradePairMenuRef = useRef<HTMLDivElement>(null);
  const tradeHeaderMoreRef = useRef<HTMLDivElement>(null);
  /** Tracks manual partial-close confirms so Exit AI can log success/failure follow-up. */
  const pendingManualPartialClosePctRef = useRef<number | null>(null);
  /** Clean = no trade overlays; Setup = entry / stop / target (and liq on perps). */
  const [setupMode, setSetupMode] = useState(false);
  const [orderPending, setOrderPending] = useState<'open' | 'close' | 'tpsl' | null>(null);
  const [manageTpSlDirty, setManageTpSlDirty] = useState(false);
  const [manageOrderDraftDirty, setManageOrderDraftDirty] = useState(false);
  const [closeAllModalOpen, setCloseAllModalOpen] = useState(false);
  const [closeAllDemoModalOpen, setCloseAllDemoModalOpen] = useState(false);
  const [demoPositionsRevision, setDemoPositionsRevision] = useState(0);
  const [closedPositionSummary, setClosedPositionSummary] = useState<ClosedPositionSummary | null>(null);
  const [guidedExecutionOpen, setGuidedExecutionOpen] = useState(false);
  const [guidedExecutionSide, setGuidedExecutionSide] = useState<TradeSide>('long');
  const [tick, setTick] = useState(0);
  const tradeScrollRef = useRef<HTMLDivElement>(null);
  const appliedPortfolioDefaults = useRef<string | null>(null);
  /** One-time seed for amount from balance cap (avoid default $1200 → 100% on small UTA). */
  const amountFromCapSeededRef = useRef(false);
  useEffect(() => {
    const id = window.setInterval(() => setTick((v) => v + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const pairFromQuery = params.get('pair');
  const reviewTopFromQuery = params.get('reviewTop') === '1';
  const ticketIntent = params.get('ticketIntent');
  const modeRaw = params.get('mode');
  const manageCtx = useMemo(() => parseManageTradeContext(params), [params]);
  const requestedManage = modeRaw === 'manage';
  const isManageMode = Boolean(requestedManage && manageCtx);
  const manageDataInvalid = requestedManage && manageCtx === null;
  const isBotsReviewCockpit = Boolean(botsReviewContext && !isManageMode);

  const botsReviewCockpitModel = useMemo(() => {
    if (!botsReviewContext) return null;
    const opp = botsTradeOpp ?? null;
    const pair = opp?.pair || formatBotsQueryPair(botsReviewContext.pair);
    const direction: 'LONG' | 'SHORT' = opp?.direction ?? botsReviewContext.directionFromQuery ?? 'LONG';
    const setupType = opp?.setupType || botsReviewContext.setup || '';
    const score = opp?.score ?? null;
    const state = opp?.state || botsReviewContext.state || '—';
    const sourceEngine =
      (opp ? parseSourceEngineFromOpportunityId(opp.id) : undefined) ??
      (botsReviewContext.opportunityId
        ? parseSourceEngineFromOpportunityId(botsReviewContext.opportunityId)
        : undefined);
    const riskLabel = opp ? deriveRiskLabelForReview(opp) : ('Medium' as const);
    const thesis = opp?.thesis ?? 'Setup context unavailable';
    const rationale =
      opp?.rationale ??
      'Pair loaded from route, but full engine context was not found.';
    const timeframeAlignment = opp?.timeframeAlignment;
    const timelineItems =
      botsTradeOppLoading && botsReviewContext.opportunityId
        ? []
        : buildReasoningTimelineItems(opp, Boolean(opp));
    return {
      pair,
      direction,
      setupType,
      score,
      state,
      sourceEngine,
      riskLabel,
      thesis,
      rationale,
      timeframeAlignment,
      timelineItems,
      entryZone: opp?.entryZone,
      invalidation: opp?.invalidation,
      targets: opp?.targets,
    };
  }, [botsReviewContext, botsTradeOpp, botsTradeOppLoading]);

  const botsEnginePlanLevels = useMemo(() => {
    if (!isBotsReviewCockpit || !botsReviewCockpitModel) return null;
    if (botsReviewContext?.opportunityId && botsTradeOppLoading) return null;
    const entryPrice = parseEntryZoneMidpoint(botsReviewCockpitModel.entryZone);
    const stopPrice = parsePriceFromString(botsReviewCockpitModel.invalidation);
    const targets = parseTargetPrices(botsReviewCockpitModel.targets);
    if (entryPrice == null || stopPrice == null) return null;
    return {
      entryPrice,
      stopPrice,
      targets,
      direction: botsReviewCockpitModel.direction,
      pair: botsReviewCockpitModel.pair,
    };
  }, [isBotsReviewCockpit, botsReviewCockpitModel, botsReviewContext?.opportunityId, botsTradeOppLoading]);

  useEffect(() => {
    if (!botsEnginePlanLevels) {
      setBotsPlannedStop(null);
      setBotsPlannedTargets(null);
      return;
    }
    setBotsPlannedStop(botsEnginePlanLevels.stopPrice);
    setBotsPlannedTargets([...botsEnginePlanLevels.targets]);
  }, [botsEnginePlanLevels]);

  const botsPaperPreviewModel = useMemo(() => {
    if (!isBotsReviewCockpit || !botsReviewCockpitModel || !botsEnginePlanLevels) return null;
    if (botsReviewContext?.opportunityId && botsTradeOppLoading) return null;
    const entryPrice = botsEnginePlanLevels.entryPrice;
    const stopPrice = botsPlannedStop ?? botsEnginePlanLevels.stopPrice;
    const targets = botsPlannedTargets ?? botsEnginePlanLevels.targets;
    const { direction } = botsEnginePlanLevels;
    const validation = validateBotsPaperPlan(entryPrice, stopPrice, targets, direction);
    return {
      entryPrice,
      stopPrice,
      targets,
      direction,
      previewEnabled: validation.ok,
      previewDisabledReason: validation.ok ? null : (validation.stopWarning ?? validation.targetsWarning),
      planGeometryWarning: !validation.ok,
    };
  }, [
    isBotsReviewCockpit,
    botsReviewCockpitModel,
    botsEnginePlanLevels,
    botsReviewContext?.opportunityId,
    botsTradeOppLoading,
    botsPlannedStop,
    botsPlannedTargets,
  ]);

  const botsPlanDirty = useMemo(() => {
    if (!botsEnginePlanLevels) return false;
    const stop = botsPlannedStop ?? botsEnginePlanLevels.stopPrice;
    const tg = botsPlannedTargets ?? botsEnginePlanLevels.targets;
    if (stop !== botsEnginePlanLevels.stopPrice) return true;
    if (tg.length !== botsEnginePlanLevels.targets.length) return true;
    return tg.some((t, i) => t !== botsEnginePlanLevels.targets[i]);
  }, [botsEnginePlanLevels, botsPlannedStop, botsPlannedTargets]);

  const resetBotsPlanToEngine = useCallback(() => {
    if (!botsEnginePlanLevels) return;
    setBotsPlannedStop(botsEnginePlanLevels.stopPrice);
    setBotsPlannedTargets([...botsEnginePlanLevels.targets]);
  }, [botsEnginePlanLevels]);

  const bumpBotsPaperPreviewPulse = useCallback(() => {
    setBotsPaperPulseToken((t) => t + 1);
  }, []);

  useEffect(() => {
    if (isManageMode) setChartDockOpen(true);
  }, [isManageMode]);
  useEffect(() => {
    if (!isManageMode) setManageChartMaximized(false);
  }, [isManageMode]);

  const { signals: liveSignals, liveTickersBySymbol, regimePredictorBySymbol, proIntelligenceMode } = useSignalEngine();

  const oppPrices = useMemo(() => {
    const p: Record<string, number> = {};
    for (const [sym, ticker] of Object.entries(liveTickersBySymbol)) {
      const pair = sym.replace(/USDT$/i, '/USDT').replace(/USDC$/i, '/USDC');
      p[pair] = ticker.lastPrice;
    }
    return p;
  }, [liveTickersBySymbol]);

  const tradeScreenOpps = useMemo(() => signalsToOpportunities(liveSignals, oppPrices, {}), [liveSignals, oppPrices]);

  useEffect(() => {
    const id = botsReviewContext?.opportunityId?.trim();
    if (!id) {
      setBotsTradeOpp(undefined);
      setBotsTradeOppLoading(false);
      return;
    }
    setBotsTradeOppLoading(true);
    setBotsTradeOpp(tradeScreenOpps.find((o) => o.id === id) ?? null);
    setBotsTradeOppLoading(false);
  }, [botsReviewContext?.opportunityId, tradeScreenOpps]);

  const selectedSignal = useMemo(() => {
    const fromQuery = buildSignalContextFromQuery(params, signalId);
    if (fromQuery) {
      const qPair = fromQuery.pair.trim().toUpperCase().replace(/\s*\/\s*/g, '');
      const liveMatch = liveSignals.find((s) => {
        const lp = s.pair.trim().toUpperCase().replace(/\s*\/\s*/g, '');
        return lp === qPair || lp === qPair.replace(/USDT$/i, '');
      });
      if (liveMatch) {
        return {
          ...fromQuery,
          setupScore: liveMatch.setupScore,
          setupScoreLabel: liveMatch.setupScoreLabel,
          scoreBreakdown: liveMatch.scoreBreakdown,
          setupType: liveMatch.setupType,
          setupTags: liveMatch.setupTags,
          riskTag: liveMatch.riskTag,
          side: liveMatch.side,
          biasLabel: liveMatch.biasLabel,
          aiExplanation: liveMatch.aiExplanation,
          timingState: liveMatch.timingState,
          timingScore: liveMatch.timingScore,
          entryFreshnessScore: liveMatch.entryFreshnessScore,
          roomToTargetScore: liveMatch.roomToTargetScore,
          actionabilityScore: liveMatch.actionabilityScore,
          triggerType: liveMatch.triggerType,
          triggerReason: liveMatch.triggerReason,
          idealEntryPrice: liveMatch.idealEntryPrice,
          candlesSinceTrigger: liveMatch.candlesSinceTrigger,
          candlesSincePeakTiming: liveMatch.candlesSincePeakTiming,
          penaltyBreakdown: liveMatch.penaltyBreakdown,
          positiveTimingFactors: liveMatch.positiveTimingFactors,
          watchCue: liveMatch.watchCue ?? fromQuery.watchCue,
          watchNext: liveMatch.watchNext ?? fromQuery.watchNext,
          plannedEntry: liveMatch.plannedEntry ?? fromQuery.plannedEntry,
          plannedStop: liveMatch.plannedStop ?? fromQuery.plannedStop,
          plannedTarget: liveMatch.plannedTarget ?? fromQuery.plannedTarget,
        };
      }
      return fromQuery;
    }
    const direct = liveSignals.find((s) => s.id === signalId);
    if (direct) return direct;
    const legacy = resolveShellSignalForLegacyId(signalId, liveSignals);
    if (legacy) return legacy;
    if (liveSignals.length > 0) return liveSignals[0];
    return buildTrackedFallbackSignal('BTC', 'BTCUSDT');
  }, [params, signalId, liveSignals]);

  /** Prefer live engine signal that matches `?pair=` so levels align with that asset. */
  const signalForTrade = useMemo(() => {
    const raw = pairFromQuery?.trim();
    if (raw) {
      const sym = pairBaseToLinearSymbol(raw);
      const pair = symbolToPair(sym);
      const fromLive = liveSignals.find(
        (s) => s.pair.trim().toUpperCase() === pair || s.pair.trim().toUpperCase() === raw.toUpperCase().replace(/\s+/g, ''),
      );
      if (fromLive) return fromLive;
      return buildTrackedFallbackSignal(pair, sym);
    }
    return selectedSignal;
  }, [pairFromQuery, selectedSignal, liveSignals]);

  useEffect(() => {
    if (isManageMode || signalId.startsWith('pf-')) return;
    if (positionReviewFromQuery) {
      const sym = pairBaseToLinearSymbol(positionReviewFromQuery.pairRaw);
      const row = getPositionRepository().getActivePositionByPair(sym);
      if (row) {
        setMarket('futures');
        setSide(row.direction);
        return;
      }
    }
    setSide(selectedSignal.side === 'short' ? 'short' : 'long');
  }, [isManageMode, signalId, selectedSignal.side, positionReviewFromQuery]);

  const manageSideParam = params.get('side');
  useEffect(() => {
    if (!isManageMode) return;
    if (manageSideParam === 'long' || manageSideParam === 'short') setSide(manageSideParam);
  }, [isManageMode, manageSideParam]);

  useEffect(() => {
    const fromPf = signalId.startsWith('pf-');
    if (!fromPf) {
      appliedPortfolioDefaults.current = null;
      return;
    }
    const key = `${signalId}|${params.toString()}`;
    if (appliedPortfolioDefaults.current === key) return;
    appliedPortfolioDefaults.current = key;

    const pu = Number(params.get('positionUsd'));
    if (Number.isFinite(pu) && pu > 0) {
      setAmountUsd(roundUsdAmount(Math.min(Math.max(pu, 0.01), 1_000_000)));
    }
    const s = params.get('side');
    if (s === 'long' || s === 'short') setSide(s);
  }, [params, signalId]);

  const scannerStatus = useMemo(() => {
    const derived = deriveMarketStatus(selectedSignal);
    const queryStatus = parseMarketStatusQuery(params.get('marketStatus'));
    if (queryStatus == null) return derived;
    const selectedSym = pairBaseToLinearSymbol(selectedSignal.pair);
    const hasLiveMatchForSelected = liveSignals.some((s) => pairBaseToLinearSymbol(s.pair) === selectedSym);
    // Prevent stale URL `marketStatus` from pinning timing chips after live score/status updates.
    return hasLiveMatchForSelected ? derived : queryStatus;
  }, [liveSignals, params, selectedSignal]);
  const uiState = uiSignalStateFromMarketStatus(scannerStatus);
  const uiStateStyle = uiSignalStateClasses(uiState);
  const isTriggered = uiState === 'triggered';
  const triggeredPairCount = useMemo(() => countTriggeredPairs(liveSignals), [liveSignals]);
  const stateAgeLabel = useMemo(
    () => formatElapsedAgo(postedAgoToSeconds(selectedSignal.postedAgo) + tick),
    [selectedSignal.postedAgo, tick],
  );

  const liveSymbol = useMemo(() => {
    if (pairFromQuery?.trim()) return pairBaseToLinearSymbol(pairFromQuery);
    return pairBaseToLinearSymbol(selectedSignal.pair);
  }, [pairFromQuery, selectedSignal.pair]);

  useEffect(() => {
    setBiasFlipNotifyTradeFocusLinearSymbol(liveSymbol.trim() ? liveSymbol.trim().toUpperCase() : null);
  }, [liveSymbol]);

  const tradePairPickerSignals = useMemo(() => {
    const source = liveSignals.length > 0 ? liveSignals : TRADE_PAIR_PICKER_FALLBACKS;
    const bySym = new Map<string, CryptoSignal>();
    for (const s of source) {
      const sym = pairBaseToLinearSymbol(s.pair);
      const prev = bySym.get(sym);
      if (!prev || s.setupScore > prev.setupScore) bySym.set(sym, s);
    }
    return [...bySym.values()].sort(
      (a, b) =>
        b.setupScore - a.setupScore ||
        formatSignalPairForTicker(a.pair).localeCompare(formatSignalPairForTicker(b.pair)),
    );
  }, [liveSignals]);

  const { items: accountSnapshots, refresh: refreshAccountSnapshots } = useAccountSnapshot({ pollMs: 12_000 });
  const bybitSnap = useMemo(
    () => accountSnapshots.find((s) => s.exchange === 'bybit' && s.status === 'connected'),
    [accountSnapshots],
  );
  const mexcSnap = useMemo(
    () => accountSnapshots.find((s) => s.exchange === 'mexc' && s.status === 'connected'),
    [accountSnapshots],
  );
  const activeExchange: 'bybit' | 'mexc' | null = bybitSnap ? 'bybit' : mexcSnap ? 'mexc' : null;

  const live = useLiveTradeMarket(liveSymbol, chartInterval, {
    uiThrottleMs: isManageMode ? 16 : undefined,
    immediateUiOnTick: isManageMode,
    exchange: activeExchange ?? 'bybit',
  });
  const [manageFastMark, setManageFastMark] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!isManageMode) {
      setManageFastMark(undefined);
      return;
    }
    const push = () => {
      const snap = live.tickSnapshotRef.current;
      const next =
        snap?.markPrice != null && Number.isFinite(snap.markPrice) && snap.markPrice > 0
          ? snap.markPrice
          : snap?.lastPrice != null && Number.isFinite(snap.lastPrice) && snap.lastPrice > 0
            ? snap.lastPrice
            : live.lastPrice;
      if (typeof next === 'number' && Number.isFinite(next) && next > 0) {
        setManageFastMark((prev) => (prev !== next ? next : prev));
      }
    };
    push();
    const id = window.setInterval(push, 25);
    return () => window.clearInterval(id);
  }, [isManageMode, live.tickSnapshotRef, live.lastPrice]);

  const liveMarketTickerItems = useMemo(
    () =>
      liveSignals.map((s) => {
        const sym = pairBaseToLinearSymbol(s.pair);
        const t = liveTickersBySymbol[sym];
        return {
          pair: formatSignalPairForTicker(s.pair),
          lastPrice: t != null && Number.isFinite(t.lastPrice) ? t.lastPrice : null,
          movePct: t != null && Number.isFinite(t.price24hPcnt) ? t.price24hPcnt * 100 : null,
        };
      }),
    [liveSignals, liveTickersBySymbol],
  );

  const tradeBalance = useMemo(() => {
    const bybit = accountSnapshots.find((s) => s.exchange === 'bybit' && s.status === 'connected');
    const overview = bybit?.accountBreakdown?.overview;
    if (overview) {
      const unifiedBucket = bybit?.accountBreakdown?.buckets?.find((b) => b.kind === 'unified');
      const utaUnrealizedPnl = unifiedBucket?.metrics?.unrealizedPnl;
      return {
        exchange: 'bybit' as const,
        availableToTrade: coerceUsdField(overview.availableToTrade),
        totalWalletBalance: coerceUsdField(overview.totalWalletBalance),
        totalEquity: coerceUsdField(overview.totalEquity),
        marginInUseUsd: coerceUsdField(overview.unifiedMarginInUseUsd ?? null),
        utaUnrealizedPnl: utaUnrealizedPnl != null ? coerceUsdField(utaUnrealizedPnl) : null,
        fundingWalletBalance: coerceUsdField(overview.fundingWalletBalance ?? null),
        fundingPrimaryAsset: overview.fundingPrimaryAsset ?? null,
      };
    }
    const mexc = accountSnapshots.find((s) => s.exchange === 'mexc' && s.status === 'connected');
    if (!mexc) return null;
    const mexcOverview = mexc.accountBreakdown?.overview;
    if (mexcOverview) {
      return {
        exchange: 'mexc' as const,
        availableToTrade: coerceUsdField(mexcOverview.availableToTrade),
        totalWalletBalance: coerceUsdField(mexcOverview.totalWalletBalance),
        totalEquity: coerceUsdField(mexcOverview.totalEquity),
        marginInUseUsd: null,
        utaUnrealizedPnl: null,
        fundingWalletBalance: coerceUsdField(mexcOverview.fundingWalletBalance ?? null),
        fundingPrimaryAsset: mexcOverview.fundingPrimaryAsset ?? null,
      };
    }
    const usdt = mexc.balances?.find((b) => b.asset.toUpperCase() === 'USDT');
    if (!usdt) return null;
    return {
      exchange: 'mexc' as const,
      availableToTrade: usdt.free,
      totalWalletBalance: usdt.total,
      totalEquity: usdt.total,
      marginInUseUsd: null,
      utaUnrealizedPnl: null,
      fundingWalletBalance: null,
      fundingPrimaryAsset: null,
    };
  }, [accountSnapshots]);

  const paperSnapshot = usePaperTrading();
  const paperCashUsd = useMemo(() => paperSnapshot?.cashUsd ?? 10_000, [paperSnapshot]);
  const [forcePaperMode, setForcePaperMode] = useState(false);

  const tradeBalanceHelper = useMemo(() => {
    if (!tradeBalance) return undefined;
    if (tradeBalance.exchange === 'mexc') {
      if (market === 'futures') {
        return 'Balances above update from your connected MEXC account. In Futures mode, Long/Short and Close place live orders.';
      }
      return 'MEXC only supports futures — switch to Futures mode to place live orders.';
    }
    if (market === 'futures') {
      return 'Balances above update from your connected Bybit account. In Futures mode, Long/Short and Close place live orders.';
    }
    return 'Balances above update from your connected Bybit account. In Spot mode, Buy/Sell and Close place live orders.';
  }, [tradeBalance, market]);

  /**
   * Single raw cap for linked UTA: max of sizing + display paths (they can diverge on edge API shapes).
   * Rounded to cents everywhere so 100% === validation cap (avoids float / rounding mismatches).
   */
  const linkedUtaRawMaxUsd = useMemo(() => {
    if (!tradeBalance) return null;
    const raw = Math.max(utaSizingCapUsd(tradeBalance), utaBalanceDisplayUsd(tradeBalance));
    if (!Number.isFinite(raw)) return null;
    return Math.max(0, raw);
  }, [tradeBalance]);

  const displayBalanceUsd = useMemo((): number | null => {
    if (linkedUtaRawMaxUsd != null && linkedUtaRawMaxUsd > 0 && !forcePaperMode) {
      return roundUsdAmount(linkedUtaRawMaxUsd);
    }
    return paperCashUsd;
  }, [linkedUtaRawMaxUsd, forcePaperMode, paperCashUsd]);

  const balanceForModel = useMemo(() => {
    if (tradeBalance && linkedUtaRawMaxUsd != null && linkedUtaRawMaxUsd > 0 && !forcePaperMode) {
      return roundUsdAmount(linkedUtaRawMaxUsd);
    }
    return paperCashUsd;
  }, [tradeBalance, linkedUtaRawMaxUsd, forcePaperMode, paperCashUsd]);

  const [tradePriceAnchor, setTradePriceAnchor] = useState<number | null>(null);
  useEffect(() => {
    setTradePriceAnchor(null);
  }, [signalId, pairFromQuery, liveSymbol]);

  useEffect(() => {
    if (tradePriceAnchor != null) return;
    if (live.lastPrice != null && Number.isFinite(live.lastPrice) && live.lastPrice > 0) {
      setTradePriceAnchor(live.lastPrice);
    }
  }, [live.lastPrice, tradePriceAnchor]);

  const model = useMemo(() => {
    const anchorPx = resolveTradeAnchorPrice(tradePriceAnchor, live.lastPrice, signalForTrade.pair);
    return buildTradeViewModelFromSignal(
      signalForTrade,
      {
        lastPrice: live.lastPrice,
        change24hPct: live.change24hPct,
        high24h: live.high24h,
        low24h: live.low24h,
        volume24h: live.volume24h,
        priceSeries: live.priceSeries,
        chartCandles: live.chartCandles,
      },
      { anchorPrice: anchorPx, balanceUsd: balanceForModel, tradeSide: side },
    );
  }, [
    balanceForModel,
    signalForTrade,
    side,
    tradePriceAnchor,
    live.change24hPct,
    live.high24h,
    live.low24h,
    live.volume24h,
    live.priceSeries,
    live.chartCandles,
    live.lastPrice,
  ]);

  /**
   * Guided sheet opens before `setSide(nextSide)` runs — `guidedExecutionSide` is the button intent.
   * Levels must follow that direction (and `signalForTrade` / chart pair), not only the pre-click ticket `side`.
   */
  const guidedPlanModel = useMemo(() => {
    const anchorPx = resolveTradeAnchorPrice(tradePriceAnchor, live.lastPrice, signalForTrade.pair);
    return buildTradeViewModelFromSignal(
      signalForTrade,
      {
        lastPrice: live.lastPrice,
        change24hPct: live.change24hPct,
        high24h: live.high24h,
        low24h: live.low24h,
        volume24h: live.volume24h,
        priceSeries: live.priceSeries,
        chartCandles: live.chartCandles,
      },
      { anchorPrice: anchorPx, balanceUsd: balanceForModel, tradeSide: guidedExecutionSide },
    );
  }, [
    balanceForModel,
    guidedExecutionSide,
    signalForTrade,
    tradePriceAnchor,
    live.change24hPct,
    live.high24h,
    live.low24h,
    live.volume24h,
    live.priceSeries,
    live.chartCandles,
    live.lastPrice,
  ]);

  const assetTransferHref = useMemo(() => {
    const bybit = accountSnapshots.find((s) => s.exchange === 'bybit' && s.status === 'connected');
    return bybit ? BYBIT_ASSET_TRANSFER_HREF : null;
  }, [accountSnapshots]);

  const portfolioEntryRaw = params.get('portfolioEntry');
  const portfolioEntry = portfolioEntryRaw ? Number(portfolioEntryRaw) : NaN;

  const mergedModel = useMemo(() => {
    const next = { ...model };
    if (live.lastPrice != null) next.lastPrice = live.lastPrice;
    if (live.change24hPct != null) next.change24hPct = live.change24hPct;
    if (live.high24h != null) next.high24h = live.high24h;
    if (live.low24h != null) next.low24h = live.low24h;
    if (live.volume24h != null) next.volume24h = live.volume24h;
    if (live.priceSeries && live.priceSeries.length > 20) next.priceSeries = live.priceSeries;
    if (live.chartCandles && live.chartCandles.length > 20) next.chartCandles = live.chartCandles;
    if (Number.isFinite(portfolioEntry) && portfolioEntry > 0) next.entry = portfolioEntry;
    if (isManageMode && manageCtx) {
      next.entry = manageCtx.entryPrice;
      if (manageCtx.pair) next.pair = manageCtx.pair;
    }
    return next;
  }, [
    model,
    live.lastPrice,
    live.change24hPct,
    live.high24h,
    live.low24h,
    live.volume24h,
    live.priceSeries,
    live.chartCandles,
    portfolioEntry,
    isManageMode,
    manageCtx,
  ]);

  const tradePairFavoriteBase = useMemo(() => normalizeTradePairBase(mergedModel.pair), [mergedModel.pair]);
  const regimeWarningModel = useMemo(
    () => regimePredictorBySymbol[pairBaseToLinearSymbol(mergedModel.pair)] ?? null,
    [regimePredictorBySymbol, mergedModel.pair],
  );
  const isPairInWatchlist = useMemo(
    () => isTradePairFavorite(tradePairFavoriteBase),
    [tradePairFavoriteBase, tradeFavRevision],
  );

  useEffect(() => {
    if (market !== 'futures') {
      setSymbolMaxLeverage(null);
      return;
    }
    const sym = pairBaseToLinearSymbol(mergedModel.pair);
    let cancelled = false;
    void fetchLinearMaxLeverage(sym).then((m) => {
      if (!cancelled) setSymbolMaxLeverage(m);
    });
    return () => {
      cancelled = true;
    };
  }, [market, mergedModel.pair]);

  const riskSettings = useRiskSettings();
  const dailyRiskGuard = useDailyRiskGuard();
  const dailyReviewLocked = Boolean(isBotsReviewCockpit && dailyRiskGuard.status === 'locked');
  const exchangeOpenLegCount = useMemo(() => countExchangeOpenLegs((bybitSnap ?? mexcSnap)?.positions), [(bybitSnap ?? mexcSnap)?.positions]);
  const riskMonitoredOpenCount = useMemo(
    () => activePositionCountForRisk(exchangeOpenLegCount),
    [exchangeOpenLegCount],
  );
  const maxOpenPositionsReached = riskMonitoredOpenCount >= riskSettings.maxOpenPositions;
  /** Manage mode still posts closes/adds via exchange API when an exchange is linked. MEXC only supports futures. */
  const useRealExecution =
    Boolean(bybitSnap && (market === 'futures' || market === 'spot')) ||
    Boolean(mexcSnap && market === 'futures');
  /** User opt-in from Risk controls — when false, Sigflo does not submit opens or TP/SL updates (closes use their own path). */
  const liveOrderSubmitEnabled = useRealExecution && riskSettings.allowLiveExecution;
  const paperModeActive = forcePaperMode || (!isManageMode && !liveOrderSubmitEnabled);
  const exchangePositionForSymbol = useMemo((): PositionItem | null => {
    const snap = bybitSnap ?? mexcSnap;
    if (!snap?.positions?.length) return null;
    const sym = pairBaseToLinearSymbol(mergedModel.pair);
    const open = snap.positions.filter((x) => x.symbol === sym && x.size > 0);
    if (open.length === 0) return null;
    /** Hedge mode (Bybit): same symbol can have long + short; managing uses URL leg, else UI `side`. */
    const legSide = isManageMode && manageCtx ? manageCtx.side : side;
    return open.find((x) => x.side === legSide) ?? open[0];
  }, [bybitSnap, mexcSnap, isManageMode, manageCtx, mergedModel.pair, side]);

  const spotBaseAsset = useMemo(
    () => spotBaseAssetFromOrderSymbol(pairBaseToLinearSymbol(mergedModel.pair)),
    [mergedModel.pair],
  );
  const exchangeSpotFreeBaseQty = useMemo(() => {
    if (!bybitSnap?.balances?.length) return null;
    const want = spotBaseAsset.toUpperCase();
    const row = bybitSnap.balances.find((b) => b.asset.toUpperCase() === want);
    if (!row || !Number.isFinite(row.free) || row.free <= 0) return null;
    return row.free;
  }, [bybitSnap, spotBaseAsset]);

  /** Manage-mode PnL UI only while the exchange still shows an open leg (perps or spot balance). */
  const hasManageOpenExposure = useMemo(() => {
    if (!isManageMode) return false;
    if (market === 'futures') return exchangePositionForSymbol != null;
    return exchangeSpotFreeBaseQty != null && exchangeSpotFreeBaseQty > 0;
  }, [exchangePositionForSymbol, exchangeSpotFreeBaseQty, isManageMode, market]);

  const hadFuturesManagePositionRef = useRef(false);
  const hadSpotManageBalanceRef = useRef(false);
  const leverageExchangeSyncTimerRef = useRef(0);
  const hasOpenLinearForOrderSymbolRef = useRef(false);

  useEffect(() => {
    hasOpenLinearForOrderSymbolRef.current = Boolean(
      exchangePositionForSymbol &&
        exchangePositionForSymbol.size > 0 &&
        exchangePositionForSymbol.symbol.trim().toUpperCase() === pairBaseToLinearSymbol(mergedModel.pair).trim().toUpperCase(),
    );
  }, [exchangePositionForSymbol, mergedModel.pair]);

  useEffect(() => {
    return () => window.clearTimeout(leverageExchangeSyncTimerRef.current);
  }, []);

  useEffect(() => {
    if (!isManageMode) {
      hadFuturesManagePositionRef.current = false;
      hadSpotManageBalanceRef.current = false;
      return;
    }
    if (!activeExchange) return;

    if (market === 'futures') {
      hadSpotManageBalanceRef.current = false;
      if (exchangePositionForSymbol) {
        hadFuturesManagePositionRef.current = true;
        return;
      }
      if (!hadFuturesManagePositionRef.current) return;
      if (reverseOrderInProgressRef.current) return;
      hadFuturesManagePositionRef.current = false;
      navigate(`/trade?${buildTradeQueryString(selectedSignal, { marketStatus: scannerStatus })}`, { replace: true });
      return;
    }

    hadFuturesManagePositionRef.current = false;
    const hasSpot = exchangeSpotFreeBaseQty != null && exchangeSpotFreeBaseQty > 0;
    if (hasSpot) {
      hadSpotManageBalanceRef.current = true;
      return;
    }
    if (!hadSpotManageBalanceRef.current) return;
    hadSpotManageBalanceRef.current = false;
    navigate(`/trade?${buildTradeQueryString(selectedSignal, { marketStatus: scannerStatus })}`, { replace: true });
  }, [
    activeExchange,
    exchangePositionForSymbol,
    exchangeSpotFreeBaseQty,
    isManageMode,
    market,
    navigate,
    scannerStatus,
    selectedSignal,
  ]);

  /** Sync SL/TP fields when computed plan changes, not only on pair (avoids stale stop after anchor moves from fallback to live). */
  useEffect(() => {
    if (isManageMode) return;
    setStopStr(
      Number.isFinite(mergedModel.stop) && mergedModel.stop > 0 ? formatQuoteNumber(mergedModel.stop) : '',
    );
    setTargetStr(
      Number.isFinite(mergedModel.target) && mergedModel.target > 0 ? formatQuoteNumber(mergedModel.target) : '',
    );
  }, [isManageMode, mergedModel.pair, mergedModel.stop, mergedModel.target]);

  useEffect(() => {
    if (!isManageMode) setManageTpSlDirty(false);
  }, [isManageMode]);
  useEffect(() => {
    if (!isManageMode) setManageOrderDraftDirty(false);
  }, [isManageMode]);
  useEffect(() => {
    if (!isManageMode || !manageCtx) return;
    setManageOrderDraftDirty(false);
  }, [isManageMode, manageCtx?.pair, manageCtx?.side, manageCtx?.entryPrice, manageCtx?.positionUsd]);

  const stopParsed = parseFloat(stopStr.replace(/,/g, ''));
  const targetParsed = parseFloat(targetStr.replace(/,/g, ''));

  /** Manage + linear: keep SL/TP inputs aligned with the exchange until the user edits (then sync again after a successful apply). */
  useEffect(() => {
    if (!isManageMode || market !== 'futures' || manageTpSlDirty) return;
    const pos = exchangePositionForSymbol;
    if (!pos) return;
    setStopStr(
      pos.stopLossPrice != null && Number.isFinite(pos.stopLossPrice) && pos.stopLossPrice > 0
        ? formatQuoteNumber(pos.stopLossPrice)
        : '',
    );
    setTargetStr(
      pos.takeProfitPrice != null && Number.isFinite(pos.takeProfitPrice) && pos.takeProfitPrice > 0
        ? formatQuoteNumber(pos.takeProfitPrice)
        : '',
    );
  }, [
    exchangePositionForSymbol,
    isManageMode,
    manageTpSlDirty,
    market,
  ]);

  const modelForMetrics = useMemo(() => {
    const next = { ...mergedModel };
    if (Number.isFinite(stopParsed) && stopParsed > 0) next.stop = stopParsed;
    if (Number.isFinite(targetParsed) && targetParsed > 0) next.target = targetParsed;
    if (tradeBalance && linkedUtaRawMaxUsd != null && linkedUtaRawMaxUsd > 0 && !forcePaperMode) {
      next.balanceUsd = roundUsdAmount(linkedUtaRawMaxUsd);
    }
    if (!Number.isFinite(next.balanceUsd) || next.balanceUsd < 0) {
      next.balanceUsd = forcePaperMode || !tradeBalance ? paperCashUsd : 0;
    }
    return next;
  }, [mergedModel, stopParsed, targetParsed, tradeBalance, linkedUtaRawMaxUsd, forcePaperMode, paperCashUsd]);

  // Prefer mark price for PnL (exchanges use mark price, not last price).
  const markForManage = manageFastMark ?? live.markPrice ?? manageCtx?.markPrice ?? live.lastPrice ?? mergedModel.lastPrice;

  const insightTicker = useMemo((): SymbolTicker | undefined => {
    if (live.lastPrice == null || live.high24h == null || live.low24h == null) return undefined;
    return {
      symbol: liveSymbol,
      lastPrice: live.lastPrice,
      high24h: live.high24h,
      low24h: live.low24h,
      volume24h: 0,
      turnover24h: 0,
      price24hPcnt: (live.change24hPct ?? 0) / 100,
    };
  }, [liveSymbol, live.lastPrice, live.high24h, live.low24h, live.change24hPct]);

  const managePnlDisplay = useMemo(() => {
    if (!isManageMode || !manageCtx) return null;
    if (market === 'futures' && exchangePositionForSymbol) {
      const pos = exchangePositionForSymbol;
      const entry = pos.entryPrice > 0 ? pos.entryPrice : manageCtx.entryPrice;
      const notional = Math.abs(pos.size) * (entry > 0 ? entry : manageCtx.entryPrice);
      // Prefer exchange-reported unrealizedPnl (authoritative) when available.
      if (pos.unrealizedPnl != null && Number.isFinite(pos.unrealizedPnl)) {
        const markPx =
          pos.markPrice != null && pos.markPrice > 0
            ? pos.markPrice
            : typeof markForManage === 'number' && Number.isFinite(markForManage) && markForManage > 0
              ? markForManage
              : entry;
        const lev = pos.leverage ?? manageCtx.leverage;
        const marginBase =
          pos.positionIM != null && pos.positionIM > 0
            ? pos.positionIM
            : lev && lev > 1 && notional > 0
              ? notional / lev
              : null;
        const pnlPct = marginBase != null ? (pos.unrealizedPnl / marginBase) * 100 : 0;
        return { pnlUsd: pos.unrealizedPnl, pnlPct };
      }
      const markPx =
        typeof markForManage === 'number' && Number.isFinite(markForManage) && markForManage > 0
          ? markForManage
          : pos.markPrice != null && pos.markPrice > 0
            ? pos.markPrice
            : entry;
      const usd = notional > 0 ? notional : manageCtx.positionUsd;
      const { pnlUsd } = managePnlFromPrices(pos.side, entry, markPx, usd);
      const lev = pos.leverage ?? manageCtx.leverage;
      const marginBase =
        pos.positionIM != null && pos.positionIM > 0
          ? pos.positionIM
          : lev && lev > 1 && notional > 0
            ? notional / lev
            : null;
      const pnlPct = marginBase != null ? (pnlUsd / marginBase) * 100 : (pnlUsd / usd) * 100;
      return { pnlUsd, pnlPct };
    }
    const result = managePnlFromPrices(manageCtx.side, manageCtx.entryPrice, markForManage, manageCtx.positionUsd);
    // Without a live exchange snapshot the leverage comes from the URL context.
    const lev = manageCtx.leverage;
    if (lev && lev > 1) {
      return { pnlUsd: result.pnlUsd, pnlPct: result.pnlPct * lev };
    }
    return result;
  }, [exchangePositionForSymbol, isManageMode, manageCtx, markForManage, market]);

  const manageInsightLine = useMemo(() => {
    if (!isManageMode || !manageCtx || !managePnlDisplay || !hasManageOpenExposure) return null;
    const insightSide =
      market === 'futures' && exchangePositionForSymbol ? exchangePositionForSymbol.side : manageCtx.side;
    return positionMicroInsight({ side: insightSide }, markForManage, managePnlDisplay.pnlPct, insightTicker);
  }, [
    exchangePositionForSymbol,
    hasManageOpenExposure,
    isManageMode,
    manageCtx,
    managePnlDisplay,
    markForManage,
    insightTicker,
    market,
  ]);

  const futuresLevCap = market === 'futures' ? (symbolMaxLeverage ?? 200) : 200;
  const effectiveFuturesLeverage = Math.min(leverage, futuresLevCap);
  const levForMetrics = market === 'spot' ? 1 : effectiveFuturesLeverage;

  useEffect(() => {
    if (market !== 'futures') return;
    if (leverage > futuresLevCap) setLeverage(futuresLevCap);
  }, [futuresLevCap, leverage, market]);

  const primaryOpenPosition = useMemo((): SimulatedActivePosition | null => {
    if (isManageMode) return null;
    const linearSym = pairBaseToLinearSymbol(mergedModel.pair);
    const mark =
      Number.isFinite(mergedModel.lastPrice) && mergedModel.lastPrice > 0
        ? mergedModel.lastPrice
        : live.lastPrice != null && Number.isFinite(live.lastPrice) && live.lastPrice > 0
          ? live.lastPrice
          : NaN;
    if (useRealExecution && market === 'futures' && exchangePositionForSymbol) {
      return syntheticFromExchangePosition(
        exchangePositionForSymbol,
        mergedModel.pair,
        market,
        effectiveFuturesLeverage,
      );
    }
    if (
      useRealExecution &&
      market === 'spot' &&
      exchangeSpotFreeBaseQty != null &&
      exchangeSpotFreeBaseQty > 0 &&
      Number.isFinite(mark) &&
      mark > 0
    ) {
      return syntheticFromSpotHolding(exchangeSpotFreeBaseQty, linearSym, mergedModel.pair, mark);
    }
    return null;
  }, [
    exchangePositionForSymbol,
    exchangeSpotFreeBaseQty,
    isManageMode,
    effectiveFuturesLeverage,
    live.lastPrice,
    market,
    mergedModel.lastPrice,
    mergedModel.pair,
    useRealExecution,
  ]);

  const sigfloRepoPosition = useMemo(() => {
    if (isManageMode) return null;
    if (market !== 'futures') return null;
    if (primaryOpenPosition != null) return null;
    return getPositionRepository().getActivePositionByPair(pairBaseToLinearSymbol(mergedModel.pair));
  }, [demoPositionsRevision, isManageMode, market, mergedModel.pair, primaryOpenPosition]);

  const primaryChartOpenPosition = useMemo((): SimulatedActivePosition | null => {
    if (primaryOpenPosition != null) return primaryOpenPosition;
    if (sigfloRepoPosition != null) return simulatedFromSigfloActive(sigfloRepoPosition, market);
    return null;
  }, [market, primaryOpenPosition, sigfloRepoPosition]);

  const sigfloManagedLayer = useMemo(() => {
    if (isManageMode || market !== 'futures') return null;
    const liveMark =
      Number.isFinite(mergedModel.lastPrice) && mergedModel.lastPrice > 0
        ? mergedModel.lastPrice
        : live.lastPrice != null && Number.isFinite(live.lastPrice) && live.lastPrice > 0
          ? live.lastPrice
          : NaN;
    if (useRealExecution && exchangePositionForSymbol) {
      const m =
        Number.isFinite(liveMark) && liveMark > 0 ? liveMark : exchangePositionForSymbol.entryPrice;
      return sigfloActivePositionFromExchange(exchangePositionForSymbol, mergedModel.pair, m);
    }
    return sigfloRepoPosition;
  }, [
    exchangePositionForSymbol,
    isManageMode,
    live.lastPrice,
    market,
    mergedModel.lastPrice,
    mergedModel.pair,
    sigfloRepoPosition,
    useRealExecution,
  ]);

  /** SL/TP "% from entry" anchor: exchange average fill when a leg exists, else plan/anchor `mergedModel.entry`. */
  const slTpPercentEntryAnchor = useMemo((): number | null => {
    if (market === 'futures' && exchangePositionForSymbol) {
      const e = exchangePositionForSymbol.entryPrice;
      if (Number.isFinite(e) && e > 0) return e;
    }
    if (!isManageMode && market === 'spot' && primaryOpenPosition?.entryPrice != null) {
      const e = primaryOpenPosition.entryPrice;
      if (Number.isFinite(e) && e > 0) return e;
    }
    return null;
  }, [exchangePositionForSymbol, isManageMode, market, primaryOpenPosition]);

  /**
   * `primaryOpenPosition` is null in `mode=manage`, but the chart should still show the same
   * exchange-backed entry / SL / TP / liq lines as the live trade view when Bybit is connected.
   */
  const exchangeSyntheticForManageChart = useMemo((): SimulatedActivePosition | null => {
    if (!isManageMode || market !== 'futures' || !exchangePositionForSymbol) return null;
    if (!useRealExecution) return null;
    return syntheticFromExchangePosition(
      exchangePositionForSymbol,
      mergedModel.pair,
      market,
      effectiveFuturesLeverage,
    );
  }, [
    effectiveFuturesLeverage,
    exchangePositionForSymbol,
    isManageMode,
    market,
    mergedModel.pair,
    useRealExecution,
  ]);

  /** Manage screen: show exchange leverage when synced, else URL (portfolio link), else trade slider. */
  const manageLeverageForUi = useMemo(() => {
    if (!isManageMode) return 1;
    if (market !== 'futures') return 1;
    if (exchangeSyntheticForManageChart != null) return exchangeSyntheticForManageChart.leverage;
    const fromUrl = manageCtx?.leverage;
    if (fromUrl != null && fromUrl > 0) return fromUrl;
    return effectiveFuturesLeverage;
  }, [
    effectiveFuturesLeverage,
    exchangeSyntheticForManageChart,
    isManageMode,
    manageCtx?.leverage,
    market,
  ]);

  const exchangeSpotPanelModel = useMemo(() => {
    if (!useRealExecution || market !== 'spot') return null;
    const p = primaryOpenPosition;
    return p != null && p.id.startsWith('bybit-spot:') ? p : null;
  }, [useRealExecution, market, primaryOpenPosition]);
  const hasActiveTradePosition = !isManageMode && primaryChartOpenPosition != null;
  const isExchangeBackedOpenLeg = primaryOpenPosition != null;

  /** Exchange-backed open leg for setup vs execution model (includes manage view when synced). */
  const exchangeOpenLegForTiming = useMemo(() => {
    if (isManageMode) {
      return market === 'futures' && exchangeSyntheticForManageChart != null && hasManageOpenExposure
        ? exchangeSyntheticForManageChart
        : null;
    }
    return primaryOpenPosition;
  }, [exchangeSyntheticForManageChart, hasManageOpenExposure, isManageMode, market, primaryOpenPosition]);

  const timingInPosition = exchangeOpenLegForTiming != null;

  /** Live exchange (or spot) leg exists — auto-submit is possible. */
  const exitAutoCanExchangeExecute = useMemo(
    () =>
      (market === 'futures' && exchangePositionForSymbol != null) ||
      (market === 'spot' && exchangeSpotFreeBaseQty != null && exchangeSpotFreeBaseQty > 0),
    [exchangePositionForSymbol, exchangeSpotFreeBaseQty, market],
  );

  /** Still in a position (live, demo, or manage) — avoid Exit AI decision spam after flat. */
  const shouldSurfaceAutoExitPopups = useMemo(
    () =>
      exitAutoCanExchangeExecute ||
      hasActiveTradePosition ||
      (isManageMode && hasManageOpenExposure),
    [exitAutoCanExchangeExecute, hasActiveTradePosition, hasManageOpenExposure, isManageMode],
  );

  const tradeTimingScopeKey = `${selectedSignal.id}:${mergedModel.pair}`;
  const [triggerLock, setTriggerLock] = useState<TriggerLockSnapshot | null>(null);

  useEffect(() => {
    setTriggerLock(null);
  }, [tradeTimingScopeKey]);

  useEffect(() => {
    if (timingInPosition || isManageMode) return;
    if (scannerStatus !== 'triggered') return;
    setTriggerLock((prev) => {
      if (prev) return prev;
      const ideal =
        selectedSignal.idealEntryPrice ??
        (Number.isFinite(mergedModel.entry) && mergedModel.entry > 0 ? mergedModel.entry : null) ??
        (live.lastPrice != null && live.lastPrice > 0 ? live.lastPrice : null);
      if (ideal == null || !(ideal > 0)) return prev;
      return { lockedAtMs: Date.now(), idealEntry: ideal };
    });
  }, [
    isManageMode,
    mergedModel.entry,
    scannerStatus,
    selectedSignal.idealEntryPrice,
    live.lastPrice,
    timingInPosition,
  ]);

  const [positionOpenedAtMs, setPositionOpenedAtMs] = useState<number | null>(null);
  const prevTimingOpenRef = useRef(false);
  useEffect(() => {
    if (timingInPosition && !prevTimingOpenRef.current) {
      setPositionOpenedAtMs(Date.now());
    }
    if (!timingInPosition) setPositionOpenedAtMs(null);
    prevTimingOpenRef.current = timingInPosition;
  }, [timingInPosition]);

  const idealEntryForExecution = useMemo(
    () =>
      resolveIdealEntryForExecution({
        triggerLock,
        signal: selectedSignal,
        planEntry: modelForMetrics.entry,
        lastPrice: live.lastPrice,
      }),
    [live.lastPrice, modelForMetrics.entry, selectedSignal, triggerLock],
  );

  const executionQuality = useMemo(() => {
    if (!timingInPosition) return null;
    const actual = exchangeOpenLegForTiming?.entryPrice;
    if (actual == null || !(actual > 0)) return null;
    return getExecutionQuality({
      inPosition: true,
      side: exchangeOpenLegForTiming.side,
      actualEntry: actual,
      idealEntry: idealEntryForExecution,
      openedAtMs: positionOpenedAtMs,
      triggerLock,
    });
  }, [
    exchangeOpenLegForTiming,
    idealEntryForExecution,
    positionOpenedAtMs,
    timingInPosition,
    triggerLock,
  ]);

  const executionTradeScorePenalty = getExecutionTradeScorePenalty(executionQuality);
  const setupDisplayState = getSetupDisplayState({ inPosition: timingInPosition, marketStatus: scannerStatus });

  const metrics = useMemo(
    () =>
      deriveTradeMetrics(modelForMetrics, {
        amountUsd,
        leverage: levForMetrics,
        side,
        market,
        setupScore: selectedSignal.setupScore,
        executionTradeScorePenalty,
        executionQuality,
        setupDisplayState,
      }),
    [
      amountUsd,
      executionQuality,
      executionTradeScorePenalty,
      levForMetrics,
      market,
      modelForMetrics,
      selectedSignal.setupScore,
      setupDisplayState,
      side,
    ],
  );

  /** Stable id for the open exchange leg on this ticket (trade + manage), for “position vanished” detection. */
  const exchangeTrackedOpenLegId = useMemo((): string | null => {
    if (!useRealExecution) return null;
    const pos = primaryOpenPosition ?? (isManageMode ? exchangeSyntheticForManageChart : null);
    return pos?.id ?? null;
  }, [
    exchangeSyntheticForManageChart,
    isManageMode,
    primaryOpenPosition,
    useRealExecution,
  ]);

  /** Chart overlays: liquidation tracks sizing inputs (`deriveTradeMetrics`), not a fixed placeholder liq. */
  const chartModelForPlot = useMemo(() => {
    const next = { ...modelForMetrics };
    if (market === 'futures' && Number.isFinite(metrics.liquidation) && metrics.liquidation > 0) {
      next.liquidation = metrics.liquidation;
    }
    const pos = primaryChartOpenPosition ?? exchangeSyntheticForManageChart;
    if (pos) {
      next.entry = pos.entryPrice;
      if (pos.stopLossPrice != null && Number.isFinite(pos.stopLossPrice) && pos.stopLossPrice > 0) {
        next.stop = pos.stopLossPrice;
      } else {
        next.stop = ensureStopForOpenPosition(
          pos.side,
          pos.entryPrice,
          modelForMetrics.stop,
          selectedSignal.setupScore,
        );
      }
      if (pos.takeProfitPrice != null && Number.isFinite(pos.takeProfitPrice) && pos.takeProfitPrice > 0) {
        next.target = pos.takeProfitPrice;
      } else {
        next.target = ensureTargetForOpenPosition(
          pos.side,
          pos.entryPrice,
          modelForMetrics.target,
          selectedSignal.setupScore,
        );
      }
      if (
        market === 'futures' &&
        pos.liquidationPrice != null &&
        Number.isFinite(pos.liquidationPrice) &&
        pos.liquidationPrice > 0
      ) {
        next.liquidation = pos.liquidationPrice;
      }
    }
    // Open position: exchange SL/TP win when present; otherwise `ensure*` aligns plan levels to `pos.side`
    // (UI long/short can differ from the exchange leg). Do not run full `coerceStopTargetToSide` when
    // exchange sent one leg — that helper replaces both levels and could drop a valid Bybit price.
    if (
      !pos &&
      Number.isFinite(next.entry) &&
      next.entry > 0 &&
      Number.isFinite(next.stop) &&
      next.stop > 0 &&
      Number.isFinite(next.target) &&
      next.target > 0
    ) {
      const c = coerceStopTargetToSide(side, next.entry, next.stop, next.target, selectedSignal.setupScore);
      next.stop = c.stop;
      next.target = c.target;
    }
    return next;
  }, [
    exchangeSyntheticForManageChart,
    isManageMode,
    market,
    metrics.liquidation,
    modelForMetrics,
    primaryChartOpenPosition,
    selectedSignal.setupScore,
    side,
  ]);

  /** Pre-entry / plan PnL from throttled React `lastPrice` (scenario strip). */
  const liveUnrealizedPre = useMemo(() => {
    const mark = modelForMetrics.lastPrice;
    if (primaryChartOpenPosition && Number.isFinite(mark)) {
      const entry = Math.max(1e-9, primaryChartOpenPosition.entryPrice);
      const dir = primaryChartOpenPosition.side === 'long' ? 1 : -1;
      const movePct = ((mark - entry) / entry) * 100 * dir;
      const pnlUsd = primaryChartOpenPosition.positionNotionalUsd * (movePct / 100);
      return { pnlUsd, movePct };
    }
    const entry = Math.max(0.000001, modelForMetrics.entry);
    const dir = side === 'long' ? 1 : -1;
    const movePct = ((modelForMetrics.lastPrice - entry) / entry) * 100 * dir;
    const pnlUsd = metrics.positionSizeUsd * (movePct / 100);
    return { pnlUsd, movePct };
  }, [
    primaryChartOpenPosition,
    modelForMetrics.entry,
    modelForMetrics.lastPrice,
    metrics.positionSizeUsd,
    side,
  ]);

  const throttledOpenPnl = useThrottledLiveUnrealized(
    live.lastPriceRef,
    primaryChartOpenPosition,
    hasActiveTradePosition,
  );

  const liveUnrealized = hasActiveTradePosition
    ? { pnlUsd: throttledOpenPnl.pnlUsd, movePct: throttledOpenPnl.movePct }
    : liveUnrealizedPre;

  /**
   * Match Portfolio behavior first: when an exchange leg is open, prefer the snapshot `unrealizedPnl`
   * (same field Portfolio renders) for display-facing PnL labels. Keep live throttled path as fallback.
   */
  const portfolioAlignedLiveUnrealized = useMemo(() => {
    if (!hasActiveTradePosition) return liveUnrealized;
    const snapshotPnl = exchangePositionForSymbol?.unrealizedPnl;
    if (!(snapshotPnl != null && Number.isFinite(snapshotPnl))) return liveUnrealized;
    const notional = primaryChartOpenPosition?.positionNotionalUsd ?? 0;
    const movePct =
      Number.isFinite(notional) && Math.abs(notional) > 1e-9 ? (snapshotPnl / notional) * 100 : liveUnrealized.movePct;
    return {
      pnlUsd: snapshotPnl,
      movePct,
    };
  }, [exchangePositionForSymbol?.unrealizedPnl, hasActiveTradePosition, liveUnrealized, primaryChartOpenPosition?.positionNotionalUsd]);

  const adjustRiskSnapshot = useMemo((): AdjustRiskPositionSnapshot | null => {
    if (!chartModelForPlot) return null;
    const entry = chartModelForPlot.entry;
    const stop = chartModelForPlot.stop;
    const target = chartModelForPlot.target;
    if (!(entry > 0) || !(stop > 0) || !(target > 0)) return null;

    if (isManageMode && manageCtx && managePnlDisplay) {
      const mark =
        typeof markForManage === 'number' && Number.isFinite(markForManage) && markForManage > 0
          ? markForManage
          : chartModelForPlot.lastPrice;
      return {
        pairLabel: manageCtx.pair,
        side: manageCtx.side,
        positionNotionalUsd: manageCtx.positionUsd,
        entryPrice: manageCtx.entryPrice,
        markPrice: mark,
        pnlUsd: managePnlDisplay.pnlUsd,
        stopPrice: stop,
        targetPrice: target,
      };
    }

    if (primaryChartOpenPosition && hasActiveTradePosition) {
      const mark =
        Number.isFinite(throttledOpenPnl.mark) && throttledOpenPnl.mark > 0
          ? throttledOpenPnl.mark
          : chartModelForPlot.lastPrice;
      return {
        pairLabel: mergedModel.pair,
        side: primaryChartOpenPosition.side,
        positionNotionalUsd: primaryChartOpenPosition.positionNotionalUsd,
        entryPrice: primaryChartOpenPosition.entryPrice,
        markPrice: mark,
        pnlUsd: throttledOpenPnl.pnlUsd,
        stopPrice: stop,
        targetPrice: target,
      };
    }

    return null;
  }, [
    chartModelForPlot,
    hasActiveTradePosition,
    isManageMode,
    manageCtx,
    managePnlDisplay,
    markForManage,
    mergedModel.pair,
    primaryChartOpenPosition,
    throttledOpenPnl.mark,
    throttledOpenPnl.pnlUsd,
  ]);

  useEffect(() => {
    if (params.get('focusAdjust') !== '1' || !adjustRiskSnapshot) return;
    setAdjustRiskOpen(true);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('focusAdjust');
        return next;
      },
      { replace: true },
    );
  }, [params, adjustRiskSnapshot, setSearchParams]);

  /** Round-trip taker fee heuristic (~0.055% per side). */
  const estFeeUsd = metrics.positionSizeUsd * 0.00055 * 2;
  const orderSymbol = pairBaseToLinearSymbol(mergedModel.pair);

  useEffect(() => {
    window.clearTimeout(leverageExchangeSyncTimerRef.current);
  }, [orderSymbol]);

  const minOrderUsd = resolveMinOrderUsd(orderSymbol, market);
  const sizingValidation = useMemo(() => {
    if (orderPending) {
      return { canExecute: false, reason: 'Order in progress…' };
    }
    const available = Number.isFinite(metrics.balanceUsd) ? Math.max(0, metrics.balanceUsd) : 0;
    const availCents = Math.round(available * 100);
    const amtCents = Math.round((Number.isFinite(amountUsd) ? amountUsd : 0) * 100);
    if (available <= 0) {
      return { canExecute: false, reason: 'Insufficient available balance' };
    }
    if (available < minOrderUsd) {
      return { canExecute: false, reason: 'Insufficient available balance' };
    }
    if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
      return { canExecute: false, reason: `Minimum order for ${orderSymbol} is $${minOrderUsd.toFixed(2)}` };
    }
    if (amtCents > availCents) {
      return { canExecute: false, reason: 'Insufficient available balance' };
    }
    if (amountUsd < minOrderUsd) {
      return { canExecute: false, reason: `Minimum order for ${orderSymbol} is $${minOrderUsd.toFixed(2)}` };
    }
    if (!Number.isFinite(metrics.positionSizeUsd) || metrics.positionSizeUsd <= 0) {
      return { canExecute: false, reason: 'Insufficient available balance' };
    }
    return { canExecute: true, reason: null as string | null };
  }, [amountUsd, metrics.balanceUsd, metrics.positionSizeUsd, minOrderUsd, orderSymbol, orderPending]);
  const canExecute = (!isManageMode && liveExecutionLocked) ? false : sizingValidation.canExecute;

  const onAmountUsdChange = useCallback(
    (n: number) => {
      const cap = Number.isFinite(metrics.balanceUsd) ? Math.max(0, metrics.balanceUsd) : 0;
      setAmountUsd(roundUsdAmount(Math.max(0, Math.min(Number.isFinite(n) ? n : 0, cap))));
      if (isManageMode) setManageOrderDraftDirty(true);
    },
    [isManageMode, metrics.balanceUsd],
  );
  const onStopStrForTrade = useCallback(
    (s: string) => {
      if (isManageMode && market === 'futures') setManageTpSlDirty(true);
      setStopStr(s);
    },
    [isManageMode, market],
  );

  const onTargetStrForTrade = useCallback(
    (s: string) => {
      if (isManageMode && market === 'futures') setManageTpSlDirty(true);
      setTargetStr(s);
    },
    [isManageMode, market],
  );

  /** Dock chart: drag stop/target strips (Setup + premium zones) update the same fields as the order card. */
  const onDockChartPlanStopDrag = useCallback((p: number) => {
    if (!Number.isFinite(p) || p <= 0) return;
    setStopStr(formatQuoteNumber(p));
  }, []);

  const onDockChartPlanTargetDrag = useCallback((p: number) => {
    if (!Number.isFinite(p) || p <= 0) return;
    setTargetStr(formatQuoteNumber(p));
  }, []);

  const linkedUta = tradeBalance != null;

  useEffect(() => {
    amountFromCapSeededRef.current = false;
  }, [signalId, pairFromQuery, linkedUta]);

  useEffect(() => {
    const cap = Number.isFinite(metrics.balanceUsd) ? Math.max(0, metrics.balanceUsd) : 0;
    const sym = pairBaseToLinearSymbol(mergedModel.pair);
    const minO = resolveMinOrderUsd(sym, market);
    const fromPortfolio = signalId.startsWith('pf-');

    if (!fromPortfolio && cap > 0 && !amountFromCapSeededRef.current) {
      amountFromCapSeededRef.current = true;
      const quarter = cap * 0.25;
      const target = linkedUta
        ? roundUsdAmount(Math.min(cap, Math.max(minO, quarter)))
        : roundUsdAmount(Math.min(1200, Math.max(minO, quarter)));
      setAmountUsd(target);
      return;
    }

    setAmountUsd((prev) => {
      const next = roundUsdAmount(Math.max(0, Math.min(prev, cap)));
      return next === prev ? prev : next;
    });
  }, [metrics.balanceUsd, mergedModel.pair, market, signalId, linkedUta]);

  const tradeDockStats = useMemo(() => {
    const entry = chartModelForPlot.entry;
    const stop = chartModelForPlot.stop;
    const target = chartModelForPlot.target;
    const rr = mergedModel.riskReward;
    const effSide = primaryChartOpenPosition && !isManageMode ? primaryChartOpenPosition.side : side;
    if (!Number.isFinite(entry) || entry <= 0) {
      return { rewardPercent: 0, riskPercent: 0, rrRatio: Number.isFinite(rr) ? rr : 0 };
    }
    let rewardPct: number;
    let riskPct: number;
    if (effSide === 'long') {
      rewardPct = ((target - entry) / entry) * 100;
      riskPct = ((entry - stop) / entry) * 100;
    } else {
      rewardPct = ((entry - target) / entry) * 100;
      riskPct = ((stop - entry) / entry) * 100;
    }
    return {
      rewardPercent: Number.isFinite(rewardPct) ? rewardPct : 0,
      riskPercent: Number.isFinite(riskPct) ? Math.abs(riskPct) : 0,
      rrRatio: Number.isFinite(rr) ? rr : 0,
    };
  }, [
    chartModelForPlot.entry,
    chartModelForPlot.stop,
    chartModelForPlot.target,
    isManageMode,
    mergedModel.riskReward,
    primaryChartOpenPosition,
    side,
  ]);

  const guidedExecutionSetup = useMemo<GuidedExecutionSetup>(() => {
    const sideForPanel = guidedExecutionSide;
    const sameSideAsTicket = sideForPanel === side;
    const planAnchorEntry = sameSideAsTicket
      ? Number.isFinite(mergedModel.entry) && mergedModel.entry > 0
        ? mergedModel.entry
        : Number.isFinite(mergedModel.lastPrice) && mergedModel.lastPrice > 0
          ? mergedModel.lastPrice
          : 0
      : Number.isFinite(guidedPlanModel.entry) && guidedPlanModel.entry > 0
        ? guidedPlanModel.entry
        : Number.isFinite(mergedModel.lastPrice) && mergedModel.lastPrice > 0
          ? mergedModel.lastPrice
          : 0;
    const stopCandidate =
      sameSideAsTicket && Number.isFinite(stopParsed) && stopParsed > 0 ? stopParsed : guidedPlanModel.stop;
    const targetCandidate =
      sameSideAsTicket && Number.isFinite(targetParsed) && targetParsed > 0 ? targetParsed : guidedPlanModel.target;
    const coerced = coerceStopTargetToSide(
      sideForPanel,
      planAnchorEntry,
      Number.isFinite(stopCandidate) && stopCandidate > 0
        ? stopCandidate
        : planAnchorEntry * (sideForPanel === 'long' ? 0.998 : 1.002),
      Number.isFinite(targetCandidate) && targetCandidate > 0
        ? targetCandidate
        : planAnchorEntry * (sideForPanel === 'long' ? 1.003 : 0.997),
      signalForTrade.setupScore,
    );
    const liveLast =
      Number.isFinite(mergedModel.lastPrice) && mergedModel.lastPrice > 0 ? mergedModel.lastPrice : 0;
    const entry = liveLast > 0 ? liveLast : planAnchorEntry;
    const planEntry =
      liveLast > 0 &&
      planAnchorEntry > 0 &&
      Math.abs(liveLast - planAnchorEntry) / planAnchorEntry > 1e-7
        ? planAnchorEntry
        : undefined;
    const rr =
      entry > 0 && Math.abs(coerced.stop - entry) > 0
        ? Math.abs(coerced.target - entry) / Math.abs(coerced.stop - entry)
        : 0;
    return {
      symbol: mergedModel.pair,
      direction: sideForPanel,
      statusLabel: uiSignalStateLabel(uiSignalStateFromMarketStatus(scannerStatus)),
      setupScore: signalForTrade.setupScore,
      setupLabel: setupScoreBandShort(signalForTrade),
      rationale: signalForTrade.aiExplanation,
      entry,
      planEntry,
      stop: coerced.stop,
      target: coerced.target,
      positionSizeUsd: metrics.positionSizeUsd,
      leverage,
      estimatedMarginUsd: metrics.amountUsedUsd,
      liquidationBufferPct:
        entry > 0 && Number.isFinite(metrics.liquidation)
          ? Math.abs((entry - metrics.liquidation) / entry) * 100
          : 0,
      riskRewardRatio: rr,
    };
  }, [
    guidedExecutionSide,
    guidedPlanModel.entry,
    guidedPlanModel.stop,
    guidedPlanModel.target,
    leverage,
    mergedModel.entry,
    mergedModel.lastPrice,
    mergedModel.pair,
    metrics.amountUsedUsd,
    metrics.liquidation,
    metrics.positionSizeUsd,
    scannerStatus,
    side,
    signalForTrade,
    stopParsed,
    targetParsed,
  ]);

  const scenarioProb = useMemo(
    () =>
      computeScenarioProbabilities({
        tradeScore: metrics.riskSummary.tradeScore,
        setupScore: selectedSignal.setupScore,
        side: side === 'long' ? 'long' : 'short',
      }),
    [metrics.riskSummary.tradeScore, selectedSignal.setupScore, side],
  );

  const timingUi = useMemo(
    () =>
      buildTradeTimingUiModel({
        inPosition: timingInPosition,
        marketStatus: scannerStatus,
        executionQuality,
      }),
    [executionQuality, scannerStatus, timingInPosition],
  );

  const dockTimingChip = useMemo(
    () => ({
      label: timingUi.chipLabel,
      state: timingUi.chipState,
      helperText: timingUi.helperText,
      executionLabel: timingUi.executionLabel,
    }),
    [timingUi],
  );

  const dockDecisionMeta = useMemo(
    () => ({
      confidenceLabel: String(metrics.riskSummary.tradeScore),
      setupQualityLabel: setupScoreBandShort(selectedSignal),
      timing: dockTimingChip,
    }),
    [dockTimingChip, metrics.riskSummary.tradeScore, selectedSignal],
  );

  /**
   * When the timing chip is long (e.g. Developing, Weak timing), free horizontal space by tightening adjacent dock
   * chrome; relax again for short labels (Ready, Too early).
   */
  const chartDockTimingLayout = useMemo(() => {
    const len = dockTimingChip.label.length;
    const bulky =
      dockTimingChip.state === 'developing' ||
      len > 10 ||
      (dockTimingChip.executionLabel != null && dockTimingChip.executionLabel.length > 0);
    return {
      bulky,
      partialHeaderClass: bulky
        ? 'min-w-[3.5rem] max-w-[6.25rem] basis-[6.25rem]'
        : 'min-w-[4rem] max-w-[8.5rem] basis-[8.5rem]',
      setupToggleMaxClass: bulky ? 'max-w-[168px]' : 'max-w-[220px]',
    } as const;
  }, [dockTimingChip.executionLabel, dockTimingChip.label, dockTimingChip.state]);

  const tradeAiScannerGroundedContext = useMemo(
    () =>
      buildGroundedMarketContext({
        signal: selectedSignal,
        status: scannerStatus,
        tradeScore: metrics.riskSummary.tradeScore,
        market,
        chartInterval,
        model: mergedModel,
        recentCandles: mergedModel.chartCandles,
      }),
    [
      chartInterval,
      market,
      mergedModel,
      metrics.riskSummary.tradeScore,
      scannerStatus,
      selectedSignal,
    ],
  );

  const whyThisTradeModel = useMemo(
    () =>
      buildWhyThisTradeModel(selectedSignal, {
        stopPrice:
          typeof modelForMetrics.stop === 'number' && Number.isFinite(modelForMetrics.stop) && modelForMetrics.stop > 0
            ? modelForMetrics.stop
            : null,
      }),
    [modelForMetrics.stop, selectedSignal],
  );

  const exitAutomationScopeKey = useMemo(() => {
    if (isManageMode && manageCtx) {
      return `pos:${manageCtx.pair}:${manageCtx.entryPrice}:${manageCtx.side}`;
    }
    return `pre:${signalId}:${mergedModel.pair}`;
  }, [isManageMode, manageCtx, signalId, mergedModel.pair]);

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

  const loggedModeRef = useRef<typeof exitAuto.mode | null>(null);
  const loggedStratRef = useRef<typeof exitAuto.strategy | null>(null);
  const prevEffStateRef = useRef<string | null>(null);
  const prevAutoStateRef = useRef<'hold' | 'trim' | 'exit' | null>(null);
  const prevPnlForSafeguardRef = useRef<number | null>(null);
  const exitFlowScopeRef = useRef(exitAutomationScopeKey);
  const exitFlowDisplayStashRef = useRef<ExitFlowDisplayStash | null>(null);
  const [exitFlowDisplayTick, setExitFlowDisplayTick] = useState(0);
  /** User tapped Confirm — hide assisted bar until exit guidance returns to hold (fresh prompt next cycle). */
  const [assistedExitAcknowledged, setAssistedExitAcknowledged] = useState(false);
  /** Raw state is hold but UI still shows trim/exit (stabilizer / threshold chatter) — auto-clear the bar after a beat. */
  const [assistedExitBarForceHidden, setAssistedExitBarForceHidden] = useState(false);
  const assistedPopupArmedRef = useRef(false);
  const [serverExitOvernightEnabled, setServerExitOvernightEnabled] = useState(false);
  const [serverExitOvernightHydrated, setServerExitOvernightHydrated] = useState(false);

  useEffect(() => {
    loggedModeRef.current = null;
    loggedStratRef.current = null;
    prevEffStateRef.current = null;
    prevAutoStateRef.current = null;
    prevPnlForSafeguardRef.current = null;
    exitFlowDisplayStashRef.current = null;
    setAssistedExitAcknowledged(false);
    setAssistedExitBarForceHidden(false);
  }, [exitAutomationScopeKey]);

  const exitFlowRaw = useMemo(() => {
    if (exitFlowScopeRef.current !== exitAutomationScopeKey) {
      exitFlowDisplayStashRef.current = null;
      exitFlowScopeRef.current = exitAutomationScopeKey;
    }
    if (isManageMode) {
      if (!manageCtx || !managePnlDisplay) return null;
      const mark =
        typeof markForManage === 'number' && Number.isFinite(markForManage)
          ? markForManage
          : mergedModel.entry;
      return resolveExitGuidanceFlow({
        variant: 'manage',
        side: manageCtx.side,
        entry: manageCtx.entryPrice,
        mark,
        stop: modelForMetrics.stop,
        target: modelForMetrics.target,
        trendAlignment: selectedSignal.scoreBreakdown.trendAlignment,
        momentumQuality: selectedSignal.scoreBreakdown.momentumQuality,
        pnlPct: managePnlDisplay.pnlPct,
        strategyPreset: exitAuto.strategy,
        customStrategyThresholds: exitAuto.customStrategyThresholds,
        safeguards: exitAuto.safeguards,
        exitAiMode: exitAuto.mode,
      });
    }
    return resolveExitGuidanceFlow({
      variant: 'trade',
      side: primaryChartOpenPosition?.side ?? side,
      entry: primaryChartOpenPosition?.entryPrice ?? modelForMetrics.entry,
      estimatedPnlPct: liveUnrealized.movePct,
      stop: chartModelForPlot.stop,
      target: chartModelForPlot.target,
      trendAlignment: selectedSignal.scoreBreakdown.trendAlignment,
      momentumQuality: selectedSignal.scoreBreakdown.momentumQuality,
      strategyPreset: exitAuto.strategy,
      customStrategyThresholds: exitAuto.customStrategyThresholds,
      safeguards: exitAuto.safeguards,
      exitAiMode: exitAuto.mode,
    });
  }, [
    exitAutomationScopeKey,
    chartModelForPlot.stop,
    chartModelForPlot.target,
    isManageMode,
    manageCtx,
    managePnlDisplay,
    markForManage,
    mergedModel.entry,
    primaryChartOpenPosition?.entryPrice,
    primaryChartOpenPosition?.side,
    side,
    liveUnrealized.movePct,
    selectedSignal.scoreBreakdown.trendAlignment,
    selectedSignal.scoreBreakdown.momentumQuality,
    exitAuto.mode,
    exitAuto.strategy,
    exitAuto.customStrategyThresholds,
    exitAuto.safeguards,
  ]);

  const exitFlow = useMemo(() => {
    if (exitFlowRaw == null) {
      exitFlowDisplayStashRef.current = null;
      return null;
    }
    const stash = nextExitFlowForDisplay(
      exitFlowDisplayStashRef.current,
      exitFlowRaw,
      Date.now(),
    );
    exitFlowDisplayStashRef.current = stash;
    return stash.displayed;
  }, [exitFlowRaw, exitFlowDisplayTick]);

  const serverExitEligible = useMemo(
    () =>
      exitAuto.mode === 'auto' &&
      useRealExecution &&
      market === 'futures' &&
      Boolean(exchangePositionForSymbol) &&
      bybitSnap?.status === 'connected',
    [exitAuto.mode, useRealExecution, market, exchangePositionForSymbol, bybitSnap?.status],
  );

  useEffect(() => {
    if (!serverExitEligible || !exchangePositionForSymbol) {
      setServerExitOvernightHydrated(false);
      return;
    }
    let cancelled = false;
    setServerExitOvernightHydrated(false);
    void listExitAutomationWatches()
      .then(({ watches }) => {
        if (cancelled) return;
        const m = watches.find(
          (w) =>
            w.enabled &&
            w.symbol === orderSymbol &&
            w.side === exchangePositionForSymbol.side &&
            w.positionIdx === (exchangePositionForSymbol.positionIdx ?? 0),
        );
        setServerExitOvernightEnabled(Boolean(m));
        setServerExitOvernightHydrated(true);
      })
      .catch(() => {
        if (!cancelled) {
          setServerExitOvernightEnabled(false);
          setServerExitOvernightHydrated(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [serverExitEligible, orderSymbol, exchangePositionForSymbol?.side, exchangePositionForSymbol?.positionIdx]);

  useEffect(() => {
    if (serverExitEligible) return;
    if (!serverExitOvernightEnabled) return;
    if (!exchangePositionForSymbol || market !== 'futures') {
      setServerExitOvernightEnabled(false);
      return;
    }
    void deleteExitAutomationWatch({
      symbol: orderSymbol,
      side: exchangePositionForSymbol.side,
      positionIdx: exchangePositionForSymbol.positionIdx ?? 0,
    }).catch((e) => { console.error("[Caught Promise Error]", e); });
    setServerExitOvernightEnabled(false);
  }, [serverExitEligible, serverExitOvernightEnabled, exchangePositionForSymbol, market, orderSymbol]);

  useEffect(() => {
    const until = exitFlowDisplayStashRef.current?.pendingHoldUntil;
    if (until == null) return;
    const ms = Math.max(0, until - Date.now()) + 1;
    const id = window.setTimeout(() => setExitFlowDisplayTick((n) => n + 1), ms);
    return () => window.clearTimeout(id);
  }, [exitFlowRaw, exitFlowDisplayTick]);

  useEffect(() => {
    if (exitFlow?.effective.state === 'hold') {
      setAssistedExitAcknowledged(false);
      setAssistedExitBarForceHidden(false);
    }
  }, [exitFlow?.effective.state]);

  useEffect(() => {
    const rs = exitFlowRaw?.effective.state;
    if (rs === 'trim' || rs === 'exit') {
      setAssistedExitBarForceHidden(false);
    }
  }, [exitFlowRaw?.effective.state]);

  const exitFlowDispState = exitFlow?.effective.state;
  const exitFlowRawState = exitFlowRaw?.effective.state;

  useEffect(() => {
    if (exitAuto.mode !== 'assisted') {
      setAssistedExitBarForceHidden(false);
      return;
    }
    if (exitFlowDispState !== 'trim' && exitFlowDispState !== 'exit') {
      setAssistedExitBarForceHidden(false);
      return;
    }
    if (exitFlowRawState !== 'hold') {
      setAssistedExitBarForceHidden(false);
      return;
    }
    const id = window.setTimeout(() => setAssistedExitBarForceHidden(true), 12000);
    return () => window.clearTimeout(id);
  }, [exitAuto.mode, exitFlowDispState, exitFlowRawState]);

  const chartAuxiliaryLines = useMemo(() => {
    if (!hasActiveTradePosition || !exitFlow) return undefined;
    if (exitFlow.effective.state !== 'trim') return undefined;
    const e = chartModelForPlot.entry;
    const t = chartModelForPlot.target;
    if (!Number.isFinite(e) || !Number.isFinite(t) || e <= 0 || t <= 0) return undefined;
    const mid = e + (t - e) * 0.55;
    if (!Number.isFinite(mid) || mid <= 0) return undefined;
    return [{ id: 'trim-sig', price: mid, color: TRADE_CHART_LEVEL_COLORS.trim, title: 'Trim' }];
  }, [chartModelForPlot.entry, chartModelForPlot.target, exitFlow, hasActiveTradePosition]);

  const chartProximity = useMemo((): 'stop' | 'target' | null => {
    if (!hasActiveTradePosition) return null;
    const mark = mergedModel.lastPrice;
    const stop = chartModelForPlot.stop;
    const target = chartModelForPlot.target;
    if (Number.isFinite(mark) && mark > 0 && Number.isFinite(stop) && stop > 0) {
      if (Math.abs(mark - stop) / mark < 0.004) return 'stop';
    }
    if (Number.isFinite(mark) && mark > 0 && Number.isFinite(target) && target > 0) {
      if (Math.abs(mark - target) / mark < 0.004) return 'target';
    }
    return null;
  }, [chartModelForPlot.stop, chartModelForPlot.target, hasActiveTradePosition, mergedModel.lastPrice]);

  const manageAiChartAux = useMemo(() => {
    if (!isManageMode || !manageCtx) return undefined;
    const mark =
      typeof markForManage === 'number' && Number.isFinite(markForManage) ? markForManage : mergedModel.entry;
    return buildManageAiExitZoneAuxLines({
      mode: exitAuto.mode,
      side: manageCtx.side,
      entry: chartModelForPlot.entry,
      target: chartModelForPlot.target,
      stop: chartModelForPlot.stop,
      mark,
      referencePrice: exitFlow?.effective.referencePrice,
    });
  }, [
    chartModelForPlot.entry,
    chartModelForPlot.target,
    chartModelForPlot.stop,
    exitAuto.mode,
    exitFlow?.effective.referencePrice,
    isManageMode,
    manageCtx,
    markForManage,
    mergedModel.entry,
  ]);

  const managePositionHealth = useMemo(() => {
    if (!isManageMode || !manageCtx || !managePnlDisplay || !hasManageOpenExposure) {
      return { status: 'healthy' as const, label: 'Healthy' };
    }
    const m =
      typeof markForManage === 'number' && Number.isFinite(markForManage) && markForManage > 0
        ? markForManage
        : mergedModel.lastPrice;
    const healthSide =
      market === 'futures' && exchangePositionForSymbol ? exchangePositionForSymbol.side : manageCtx.side;
    return computePositionHealth({
      side: healthSide,
      mark: m,
      stop: chartModelForPlot.stop,
      pnlPct: managePnlDisplay.pnlPct,
    });
  }, [
    chartModelForPlot.stop,
    exchangePositionForSymbol,
    hasManageOpenExposure,
    isManageMode,
    manageCtx,
    managePnlDisplay,
    markForManage,
    market,
    mergedModel.lastPrice,
  ]);

  const managePositionBiasStat = useMemo(() => {
    if (!isManageMode || !manageCtx || !hasManageOpenExposure) return null;
    const biasSide =
      market === 'futures' && exchangePositionForSymbol ? exchangePositionForSymbol.side : manageCtx.side;
    return positionBiasForSignalRow(manageCtx.pair, biasSide, selectedSignal);
  }, [exchangePositionForSymbol, hasManageOpenExposure, isManageMode, manageCtx, market, selectedSignal]);

  const manageTimelineLines = useMemo(() => {
    if (!isManageMode || !manageCtx) return [];
    const lines: string[] = [];
    const tlSide =
      market === 'futures' && exchangePositionForSymbol ? exchangePositionForSymbol.side : manageCtx.side;
    const tlEntry =
      market === 'futures' && exchangePositionForSymbol && exchangePositionForSymbol.entryPrice > 0
        ? exchangePositionForSymbol.entryPrice
        : manageCtx.entryPrice;
    lines.push(`Entered ${tlSide} at ${formatQuoteNumber(tlEntry)}`);
    const recent = exitAuto.activity.slice(-4);
    for (const a of recent) {
      lines.push(a.message);
    }
    return lines.slice(0, 5);
  }, [exchangePositionForSymbol, exitAuto.activity, isManageMode, manageCtx, market]);

  /** Omit dock open/closed — refitting on layout toggle wiped pan/zoom after the user dragged the chart. */
  const liveChartRefitKey =
    hasActiveTradePosition && primaryChartOpenPosition
      ? `${mergedModel.pair}|${primaryChartOpenPosition.id}`
      : undefined;

  /** Chart dock header (under `LiveMarketStrip`): R / T / R:R + setup tier or live exit-state badge — not last price. */
  const dockChartHeaderMetrics = useMemo(() => {
    const setupBand = setupScoreBandShort(selectedSignal);
    const setupBadge = setupBand === 'Developing' ? 'Building' : setupBand;
    let badge: string | undefined = setupBadge;
    if (hasActiveTradePosition && exitFlow) {
      const st = exitFlow.effective.state;
      badge = st === 'trim' ? 'TRIM' : st === 'exit' ? 'EXIT' : setupBadge;
    }
    const pnlOk = hasActiveTradePosition && Number.isFinite(portfolioAlignedLiveUnrealized.pnlUsd);
    const pnl = pnlOk ? portfolioAlignedLiveUnrealized.pnlUsd : 0;
    const secondaryLine = pnlOk
      ? `uPnL ${pnl >= 0 ? '+' : '−'}$${formatQuoteNumber(Math.abs(pnl))}`
      : undefined;
    const secondaryLineTone: 'positive' | 'negative' | 'neutral' | undefined = pnlOk
      ? pnl > 0
        ? 'positive'
        : pnl < 0
          ? 'negative'
          : 'neutral'
      : undefined;
    return {
      riskPercent: tradeDockStats.riskPercent,
      rewardPercent: tradeDockStats.rewardPercent,
      rrRatio: tradeDockStats.rrRatio,
      badge,
      secondaryLine,
      secondaryLineTone,
    };
  }, [
    exitFlow,
    hasActiveTradePosition,
    portfolioAlignedLiveUnrealized.pnlUsd,
    selectedSignal,
    tradeDockStats.rewardPercent,
    tradeDockStats.riskPercent,
    tradeDockStats.rrRatio,
  ]);

  const scenarioSummaryLine = useMemo(() => {
    const score = metrics.riskSummary.tradeScore;
    const setup = setupScoreBandShort(selectedSignal);
    const setupShown = setup === 'Developing' ? 'Building' : setup;
    const st = exitFlow?.effective.state;
    const head = st && st !== 'hold' ? `${st.toUpperCase()} · ` : '';
    return `${head}Trade ${score} · ${setupShown}`;
  }, [exitFlow?.effective.state, metrics.riskSummary.tradeScore, selectedSignal]);

  const exitAiModeLabel = EXIT_AI_MODE_LABEL[exitAuto.mode];
  const exitStrategyLabel = EXIT_STRATEGY_LABEL[exitAuto.strategy];

  /** Assisted confirm applies to a real open leg only — not hypothetical pre-entry guidance after close/liq. */
  const showAssistedExitConfirmBar =
    exitAuto.mode === 'assisted' &&
    !assistedExitAcknowledged &&
    !assistedExitBarForceHidden &&
    exitFlow != null &&
    (exitFlow.effective.state === 'trim' || exitFlow.effective.state === 'exit') &&
    (isManageMode
      ? exchangePositionForSymbol != null && manageCtx != null
      : hasActiveTradePosition && isExchangeBackedOpenLeg);

  useEffect(() => {
    if (!showAssistedExitConfirmBar || !exitFlow) {
      assistedPopupArmedRef.current = false;
      return;
    }
    if (assistedPopupArmedRef.current) return;
    assistedPopupArmedRef.current = true;
    emitGlobalAnnouncement({
      id: `assisted-exit-confirm-${Date.now()}`,
      kind: 'ai_action',
      title: 'Assisted Exit Confirmation Required',
      subtitle: `${exitFlow.effective.headline} · ${exitFlow.nextPlanned}`,
    });
  }, [exitFlow, showAssistedExitConfirmBar]);

  const manageExitAiCoPilot = useMemo(
    () =>
      buildExitAiCoPilotModel({
        mode: exitAuto.mode,
        side: primaryChartOpenPosition?.side ?? side,
        flow: exitFlow,
        nextPlanned: exitFlow?.nextPlanned ?? 'Automation watching trend and risk.',
        safeguards: exitAuto.safeguards,
        assistedPromptVisible: showAssistedExitConfirmBar,
        orderExitInFlight: orderPending === 'close',
        stop: chartModelForPlot.stop,
        target: chartModelForPlot.target,
        contextLine: manageInsightLine,
      }),
    [
      chartModelForPlot.stop,
      chartModelForPlot.target,
      exitAuto.mode,
      exitAuto.safeguards,
      exitFlow,
      manageInsightLine,
      orderPending,
      primaryChartOpenPosition?.side,
      side,
      showAssistedExitConfirmBar,
    ],
  );

  useEffect(() => {
    if (loggedModeRef.current === null) {
      loggedModeRef.current = exitAuto.mode;
      return;
    }
    if (loggedModeRef.current !== exitAuto.mode) {
      exitAuto.pushActivity({
        kind: 'mode_change',
        message: `Switched to ${EXIT_AI_MODE_LABEL[exitAuto.mode]}`,
      });
      loggedModeRef.current = exitAuto.mode;
    }
  }, [exitAuto.mode, exitAuto.pushActivity]);

  useEffect(() => {
    if (loggedStratRef.current === null) {
      loggedStratRef.current = exitAuto.strategy;
      return;
    }
    if (loggedStratRef.current !== exitAuto.strategy) {
      exitAuto.pushActivity({
        kind: 'strategy_change',
        message: `Exit behavior set to ${EXIT_STRATEGY_LABEL[exitAuto.strategy]}`,
      });
      loggedStratRef.current = exitAuto.strategy;
    }
  }, [exitAuto.strategy, exitAuto.pushActivity]);

  useEffect(() => {
    if (!exitFlow) return;
    const s = exitFlow.effective.state;
    if (prevEffStateRef.current === null) {
      prevEffStateRef.current = s;
      return;
    }
    if (prevEffStateRef.current !== s) {
      const message =
        s === 'hold'
          ? 'Held position — readout returned to neutral'
          : s === 'trim'
            ? 'Considering partial scale-out near plan target'
            : 'Favoring a protective exit near invalidation';
      exitAuto.pushActivity({
        kind: 'exit_state',
        message,
      });
      prevEffStateRef.current = s;
    }
  }, [exitFlow, exitAuto.pushActivity]);

  useEffect(() => {
    if (!exitFlow) return;
    const maxL = exitAuto.safeguards.maxLossPct;
    const pnl = exitFlow.pnlPct;
    const prev = prevPnlForSafeguardRef.current;
    const crossed = prev !== null && prev > -maxL && pnl <= -maxL;
    const hasPositionForSafeguard =
      hasActiveTradePosition || (isManageMode && hasManageOpenExposure);
    if (crossed && hasPositionForSafeguard) {
      exitAuto.pushActivity({
        kind: 'safeguard',
        message: 'Max loss safeguard crossed — favoring protective exit.',
      });
    }
    prevPnlForSafeguardRef.current = pnl;
  }, [
    exitFlow,
    exitAuto.safeguards.maxLossPct,
    exitAuto.pushActivity,
    hasActiveTradePosition,
    hasManageOpenExposure,
    isManageMode,
  ]);

  const flashTradeToast = useCallback(
    (message: string, durationMs = 2600, cta?: { label: string; href: string } | null) => {
    setTradeToast(message);
      setTradeToastCta(cta ?? null);
      if (!cta) setTermsRetrySide(null);
    window.clearTimeout(toastClearRef.current);
      toastClearRef.current = window.setTimeout(() => {
        setTradeToast(null);
        setTradeToastCta(null);
        setTermsRetrySide(null);
      }, durationMs);
    },
    [],
  );

  const onLeverageChange = useCallback(
    (n: number) => {
      const cap = futuresLevCap > 0 ? futuresLevCap : 200;
      const lev = Math.round(Math.min(Math.max(1, n), cap));
      setLeverage(lev);
      if (isManageMode) setManageOrderDraftDirty(true);

      if (!useRealExecution || market !== 'futures') return;
      // MEXC doesn't support the standalone set-leverage endpoint — skip for MEXC
      if (!bybitSnap || bybitSnap.status !== 'connected') return;

      window.clearTimeout(leverageExchangeSyncTimerRef.current);
      leverageExchangeSyncTimerRef.current = window.setTimeout(() => {
        void (async () => {
          if (!hasOpenLinearForOrderSymbolRef.current) return;
          try {
            await postBybitSetLinearLeverage({ symbol: orderSymbol, leverage: lev });
            flashTradeToast('Leverage updated on Bybit.');
            await refreshAccountSnapshots({ silent: true });
          } catch (e) {
            flashTradeToast(formatBybitTradeErrorMessage(e, 'Could not update leverage on Bybit'), 5200);
            const exLev = exchangePositionForSymbol?.leverage;
            if (exLev != null && exLev > 0) setLeverage(Math.min(Math.round(exLev), cap));
            await refreshAccountSnapshots({ silent: true });
          }
        })();
      }, 450);
    },
    [
      bybitSnap,
      exchangePositionForSymbol,
      flashTradeToast,
      futuresLevCap,
      isManageMode,
      market,
      orderSymbol,
      refreshAccountSnapshots,
      useRealExecution,
    ],
  );

  const biasNotifyPermission = useMemo((): NotificationPermission | 'unsupported' => {
    return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
  }, [biasNotifyPermTick]);

  const appAnnouncementsEnabled = useAppAnnouncementsEnabled();

  /**
   * Bell / menu: toggles all global announcements (banners, haptics, OS notifications).
   * When alerts are on and permission is "default", requests browser notification access.
   */
  const onBiasAlertsControl = useCallback(async () => {
    if (!readAppAnnouncementsEnabled()) {
      setAppAnnouncementsEnabled(true);
      flashTradeToast('All Sigflo alerts on — banners, haptics, and browser notifications (if allowed).');
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification('Sigflo', { body: 'Alerts are back on.' });
        } catch (e) { console.error("[Caught Error]", e); }
      }
      return;
    }

    if (typeof Notification === 'undefined') {
      setAppAnnouncementsEnabled(false);
      flashTradeToast('All Sigflo alerts off — this browser has no Notification API.');
      return;
    }

    if (Notification.permission === 'granted') {
      setAppAnnouncementsEnabled(false);
      flashTradeToast('All Sigflo alerts off.');
      return;
    }

    if (Notification.permission === 'denied') {
      setAppAnnouncementsEnabled(false);
      flashTradeToast('All Sigflo alerts off. Allow this site in browser settings to use OS notifications again.');
      return;
    }

    try {
      const r = await Notification.requestPermission();
      setBiasNotifyPermTick((n) => n + 1);
      if (r === 'granted') {
        flashTradeToast('Browser notifications enabled.');
        try {
          new Notification('Sigflo', {
            body: 'Only your Trade chart pair (this tab). ~$5+ notionals. Switch pair on Trade to change which one alerts.',
          });
        } catch (e) { console.error("[Caught Error]", e); }
      } else {
        flashTradeToast('OS notifications declined — you can mute in-app alerts with the bell.');
      }
    } catch {
      flashTradeToast('Could not request notifications.');
    }
  }, [flashTradeToast]);

  const copyTradeLink = useCallback(async (): Promise<boolean> => {
    const href = window.location.href;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(href);
        return true;
      }
    } catch {
      // Fallback below for environments that block async clipboard.
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = href;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!serverExitEligible || !serverExitOvernightHydrated || !serverExitOvernightEnabled) return;
    if (!exitFlow || !exchangePositionForSymbol) return;
    const stop = isManageMode ? modelForMetrics.stop : chartModelForPlot.stop;
    const target = isManageMode ? modelForMetrics.target : chartModelForPlot.target;
    if (!Number.isFinite(stop) || stop <= 0 || !Number.isFinite(target) || target <= 0) return;

    const t = window.setTimeout(() => {
      void putExitAutomationWatch({
        enabled: true,
        symbol: orderSymbol,
        side: exchangePositionForSymbol.side,
        positionIdx: exchangePositionForSymbol.positionIdx ?? 0,
        stopPrice: stop,
        targetPrice: target,
        trendAlignment: selectedSignal.scoreBreakdown.trendAlignment,
        momentumQuality: selectedSignal.scoreBreakdown.momentumQuality,
        strategyPreset: exitAuto.strategy,
        customStrategyThresholds: exitAuto.strategy === 'custom' ? exitAuto.customStrategyThresholds : null,
        safeguards: exitAuto.safeguards,
        lastGuidanceState: exitFlow.effective.state,
        exchange: 'bybit',
        market: 'linear',
      }).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Could not sync server exit automation.';
        flashTradeToast(msg);
      });
    }, 800);
    return () => window.clearTimeout(t);
  }, [
    serverExitEligible,
    serverExitOvernightHydrated,
    serverExitOvernightEnabled,
    exitFlow,
    exchangePositionForSymbol?.side,
    exchangePositionForSymbol?.positionIdx,
    orderSymbol,
    isManageMode,
    modelForMetrics.stop,
    modelForMetrics.target,
    chartModelForPlot.stop,
    chartModelForPlot.target,
    selectedSignal.scoreBreakdown.trendAlignment,
    selectedSignal.scoreBreakdown.momentumQuality,
    exitAuto.strategy,
    exitAuto.customStrategyThresholds,
    exitAuto.safeguards,
    flashTradeToast,
  ]);

  const prevExchangeOpenLegIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (
      !useRealExecution ||
      (activeExchange === 'bybit' && (!bybitSnap || bybitSnap.status !== 'connected')) ||
      (activeExchange === 'mexc' && (!mexcSnap || mexcSnap.status !== 'connected'))
    ) {
      prevExchangeOpenLegIdRef.current = exchangeTrackedOpenLegId;
      return;
    }
    const cur = exchangeTrackedOpenLegId;
    const prev = prevExchangeOpenLegIdRef.current;
    if (prev === undefined) {
      prevExchangeOpenLegIdRef.current = cur;
      return;
    }
    const vanished = prev !== null && cur === null;
    if (vanished && Date.now() >= suppressExternalPositionCloseFeedbackUntilRef.current) {
      const aiLikely =
        exitAuto.mode === 'auto' && recentExitAiAutoCloseSubmit(exitAuto.activity, 90_000);
      flashTradeToast(
        aiLikely
          ? 'Position closed on the exchange — AI auto-exit finished.'
          : 'Position closed on the exchange (manual, TP/SL, liquidation, or another app).',
        5200,
      );
      exitAuto.pushActivity({
        kind: 'exit_state',
        message: aiLikely
          ? 'Open position cleared after AI auto exit; account sync matched a full close.'
          : 'Open position no longer on the exchange — closed outside this flow or by the market.',
      });
    }
    prevExchangeOpenLegIdRef.current = cur;
  }, [
    activeExchange,
    bybitSnap,
    exchangeTrackedOpenLegId,
    exitAuto.activity,
    exitAuto.mode,
    exitAuto.pushActivity,
    flashTradeToast,
    mexcSnap,
    useRealExecution,
  ]);

  const submitExchangeClose = useCallback(
    async (
      args:
        | { kind: 'linear'; pos: PositionItem; fraction: number }
        | { kind: 'spot'; symbol: string; freeBase: number; fraction: number },
    ) => {
      setOrderPending('close');
      const fraction = args.fraction;
      try {
        if (args.kind === 'spot') {
          const qtyBase = args.freeBase * Math.min(1, Math.max(0, fraction));
          if (!(qtyBase > 0)) {
            flashTradeToast('No spot balance to sell for this pair.');
            return;
          }
          const qtyStr = linearQtyFromBaseAmount(qtyBase);
          await postBybitSpotOrder({
            symbol: args.symbol,
            side: 'Sell',
            qty: qtyStr,
            marketUnit: 'baseCoin',
            orderType: 'Market',
          });
        } else {
          const pos = args.pos;
          const qtyBase = Math.abs(pos.size) * Math.min(1, Math.max(0, fraction));
          const qtyStr = linearQtyFromBaseAmount(qtyBase);
          const closeSide = pos.side === 'long' ? 'Sell' : 'Buy';
          if (activeExchange === 'mexc') {
            await postMexcLinearOrder({
              symbol: pos.symbol,
              side: closeSide,
              qty: qtyStr,
              reduceOnly: true,
              orderType: 'Market',
            });
          } else {
            await postBybitLinearOrder({
              symbol: pos.symbol,
              side: closeSide,
              qty: qtyStr,
              reduceOnly: true,
              positionIdx: pos.positionIdx ?? 0,
              orderType: 'Market',
            });
          }
        }
        suppressExternalPositionCloseFeedbackUntilRef.current = Date.now() + 8000;
        const mark =
          throttledOpenPnl.mark > 0 && Number.isFinite(throttledOpenPnl.mark)
            ? throttledOpenPnl.mark
            : live.lastPrice != null && live.lastPrice > 0
              ? live.lastPrice
              : Number.isFinite(mergedModel.lastPrice) && mergedModel.lastPrice > 0
                ? mergedModel.lastPrice
                : 0;
        const summaryPos = primaryOpenPosition ?? (isManageMode ? exchangeSyntheticForManageChart : null);
        const summary =
          summaryPos && mark > 0 ? buildClosedPositionSummary(summaryPos, mark, fraction) : null;
        if (summary) {
          setClosedPositionSummary(summary);
        } else {
          flashTradeToast(
            fraction >= 0.999 ? 'Close submitted — syncing account…' : 'Partial close submitted — syncing…',
          );
        }
        const pct = Math.round(fraction * 100);
        if (fraction >= 0.995) {
          exitAuto.pushActivity({
            kind: 'exit_state',
            message: 'Position fully closed on the exchange.',
          });
        } else {
          exitAuto.pushActivity({
            kind: 'exit_state',
            message: `Scaled out ${pct}% · remaining position still active`,
          });
        }
        if (pendingManualPartialClosePctRef.current != null) {
          exitAuto.pushActivity({
            kind: 'exit_state',
            message: `Manual partial close ${pct}% submitted — syncing exchange fill…`,
          });
        }
        await refreshAccountSnapshots({ silent: false });
      } catch (e) {
        if (pendingManualPartialClosePctRef.current != null) {
          const pct = Math.round((pendingManualPartialClosePctRef.current ?? fraction) * 100);
          exitAuto.pushActivity({
            kind: 'exit_state',
            message: `Manual partial close ${pct}% failed — review order state and retry.`,
          });
        }
        flashTradeToast(formatBybitTradeErrorMessage(e, 'Close failed'), 5200);
      } finally {
        pendingManualPartialClosePctRef.current = null;
        setOrderPending(null);
      }
    },
    [
      activeExchange,
      exchangeSyntheticForManageChart,
      exitAuto.pushActivity,
      flashTradeToast,
      isManageMode,
      live.lastPrice,
      mergedModel.lastPrice,
      primaryOpenPosition,
      refreshAccountSnapshots,
      throttledOpenPnl.mark,
    ],
  );

  const executeTrade = useCallback(
    async (nextSide: TradeSide, opts?: { manageIntent?: 'add' | 'reverse'; bypassGuidedExecution?: boolean }) => {
      if (!isManageMode && isBotsReviewCockpit && dailyRiskGuard.status === 'locked') {
        flashTradeToast('Daily risk limit reached — new entries paused for today.', 4200, {
          label: 'Risk controls',
          href: '/risk',
        });
        return false;
      }
      if (!isManageMode && !opts?.bypassGuidedExecution) {
        setGuidedExecutionSide(nextSide);
        setGuidedExecutionOpen(true);
        return false;
      }
      if (!isManageMode && liveExecutionLocked) {
        flashTradeToast('Live execution locked — review-only flow from Bots.');
        return false;
      }
      if (!canExecute) {
        flashTradeToast(sizingValidation.reason ?? 'Set a valid position size before placing an order.');
        return false;
      }
      setSide(nextSide);
      setExecFlash(nextSide === 'long' ? 'long' : 'short');
      window.clearTimeout(execFlashClearRef.current);
      execFlashClearRef.current = window.setTimeout(() => setExecFlash(null), 420);

      let entryMark = NaN;
      if (Number.isFinite(mergedModel.lastPrice) && (mergedModel.lastPrice as number) > 0) {
        entryMark = mergedModel.lastPrice as number;
      } else if (Number.isFinite(mergedModel.entry) && (mergedModel.entry as number) > 0) {
        entryMark = mergedModel.entry as number;
      } else if (live.lastPrice != null && Number.isFinite(live.lastPrice) && live.lastPrice > 0) {
        entryMark = live.lastPrice;
      }
      if (!Number.isFinite(entryMark) || entryMark <= 0) {
        flashTradeToast('No price yet — wait for the chart to load, then try again.');
        return false;
      }

      // Manage: same-side adds only — reversing is an explicit opposite-side market (see `onReverseOrder`).
      if (isManageMode && opts?.manageIntent !== 'reverse' && nextSide !== side) {
        flashTradeToast('Adding size uses your open direction — adjust side from Portfolio if needed.');
        return false;
      }
      if (isManageMode && market === 'futures' && !exchangePositionForSymbol) {
        flashTradeToast(
          bybitSnap
            ? 'No open linear position on the exchange for this pair — confirm symbol or refresh Account.'
            : mexcSnap
              ? 'No open MEXC position for this pair — confirm symbol or refresh Account.'
              : 'Connect an exchange in Account to add size.',
        );
        return false;
      }

      if (liveOrderSubmitEnabled) {
        setOrderPending('open');
        try {
          let linearReverseAwaitPostSyncClear = false;
          let openedNewFuturesEntry: { side: 'Buy' | 'Sell'; qty: string; positionIdx: number } | null = null;
          const userRequestedStopLoss = Number.isFinite(stopParsed) && stopParsed > 0;
          const orderNotionalUsd = applyOpenOrderNotionalBuffer(metrics.positionSizeUsd, {
            minNotionalUsd: minOrderUsd,
          });
          const sideBybit = nextSide === 'long' ? 'Buy' : 'Sell';
          if (market === 'spot') {
            if (sideBybit === 'Buy') {
              const qtyQuote = spotQuoteQtyFromUsd(orderNotionalUsd);
              await postBybitSpotOrder({
                symbol: orderSymbol,
                side: 'Buy',
                orderType: 'Market',
                qty: qtyQuote,
                marketUnit: 'quoteCoin',
              });
            } else {
              const qtyStr = linearQtyFromNotionalUsd(orderNotionalUsd, entryMark);
              await postBybitSpotOrder({
                symbol: orderSymbol,
                side: 'Sell',
                orderType: 'Market',
                qty: qtyStr,
                marketUnit: 'baseCoin',
              });
            }
          } else {
            const qtyStr = linearQtyFromNotionalUsd(orderNotionalUsd, entryMark);
            const positionIdx = isManageMode ? (exchangePositionForSymbol?.positionIdx ?? 0) : 0;
            if (activeExchange === 'mexc') {
              // ── MEXC futures path ──────────────────────────────────────────
              // MEXC doesn't support hedge mode or positionIdx; reverse = close then open sequentially.
              if (isManageMode && opts?.manageIntent === 'reverse' && exchangePositionForSymbol) {
                const pos = exchangePositionForSymbol;
                const closeQtyStr = linearQtyFromBaseAmount(Math.abs(pos.size));
                const closeSide = pos.side === 'long' ? 'Sell' : 'Buy';
                reverseOrderInProgressRef.current = true;
                await postMexcLinearOrder({
                  symbol: orderSymbol,
                  side: closeSide,
                  qty: closeQtyStr,
                  reduceOnly: true,
                  orderType: 'Market',
                });
                suppressExternalPositionCloseFeedbackUntilRef.current = Date.now() + 12_000;
                // Brief settle wait before opening the new leg
                await new Promise<void>((r) => { window.setTimeout(r, 800); });
                await postMexcLinearOrder({
                  symbol: orderSymbol,
                  side: sideBybit,
                  qty: qtyStr,
                  orderType: 'Market',
                  leverage: Math.min(leverage, futuresLevCap),
                });
                linearReverseAwaitPostSyncClear = true;
              } else if (isManageMode) {
                await postMexcLinearOrder({
                  symbol: orderSymbol,
                  side: sideBybit,
                  qty: qtyStr,
                  orderType: 'Market',
                  leverage: Math.min(leverage, futuresLevCap),
                });
              } else {
                const { tpSl, skippedTarget, skippedStop } = linearTpSlStringsForOpen(
                  nextSide,
                  entryMark,
                  targetParsed,
                  stopParsed,
                );
                if (userRequestedStopLoss && skippedStop) {
                  flashTradeToast(
                    'Stop-loss is required for this entry and must be on the correct side of entry. Order was not sent.',
                    7000,
                  );
                  return false;
                }
                if (skippedTarget || skippedStop) {
                  flashTradeToast(
                    'Target/stop must be on the correct side of entry for exchange TP/SL — invalid level(s) were not sent.',
                    7000,
                  );
                }
                openedNewFuturesEntry = { side: sideBybit, qty: qtyStr, positionIdx: 0 };
                await postMexcLinearOrder({
                  symbol: orderSymbol,
                  side: sideBybit,
                  qty: qtyStr,
                  orderType: 'Market',
                  leverage: Math.min(leverage, futuresLevCap),
                  ...(tpSl.takeProfit ? { takeProfit: tpSl.takeProfit } : {}),
                  ...(tpSl.stopLoss ? { stopLoss: tpSl.stopLoss } : {}),
                });
              }
            } else {
              // ── Bybit futures path ─────────────────────────────────────────
              if (isManageMode && opts?.manageIntent === 'reverse' && exchangePositionForSymbol) {
                const pos = exchangePositionForSymbol;
                const closeIdx = pos.positionIdx ?? 0;
                const closeQtyStr = linearQtyFromBaseAmount(Math.abs(pos.size));
                const closeSide = pos.side === 'long' ? 'Sell' : 'Buy';
                const openIdx = bybitLinearPositionIdxForOpenSide(nextSide, closeIdx);
                reverseOrderInProgressRef.current = true;
                await postBybitLinearOrder({
                  symbol: orderSymbol,
                  side: closeSide,
                  qty: closeQtyStr,
                  reduceOnly: true,
                  positionIdx: closeIdx,
                  orderType: 'Market',
                });
                suppressExternalPositionCloseFeedbackUntilRef.current = Date.now() + 12_000;
                const deadline = Date.now() + 8000;
                let snaps = await refreshAccountSnapshots({ silent: true });
                while (
                  bybitLinearLegStillOpen(snaps, orderSymbol, pos.side, closeIdx) &&
                  Date.now() < deadline
                ) {
                  await new Promise<void>((r) => {
                    window.setTimeout(r, 250);
                  });
                  snaps = await refreshAccountSnapshots({ silent: true });
                }
                if (bybitLinearLegStillOpen(snaps, orderSymbol, pos.side, closeIdx)) {
                  reverseOrderInProgressRef.current = false;
                  flashTradeToast(
                    'Close leg still open on the exchange after reverse step 1 — new entry was not sent. Refresh Account or retry.',
                    7000,
                  );
                  return false;
                }
                await postBybitLinearOrder({
                  symbol: orderSymbol,
                  side: sideBybit,
                  qty: qtyStr,
                  orderType: 'Market',
                  leverage: Math.min(leverage, futuresLevCap),
                  positionIdx: openIdx,
                });
                linearReverseAwaitPostSyncClear = true;
              } else if (isManageMode) {
                await postBybitLinearOrder({
                  symbol: orderSymbol,
                  side: sideBybit,
                  qty: qtyStr,
                  orderType: 'Market',
                  leverage: Math.min(leverage, futuresLevCap),
                  positionIdx,
                });
              } else {
                const { tpSl, skippedTarget, skippedStop } = linearTpSlStringsForOpen(
                  nextSide,
                  entryMark,
                  targetParsed,
                  stopParsed,
                );
                if (userRequestedStopLoss && skippedStop) {
                  flashTradeToast(
                    'Stop-loss is required for this entry and must be on the correct side of entry. Order was not sent.',
                    7000,
                  );
                  return false;
                }
                if (skippedTarget || skippedStop) {
                  flashTradeToast(
                    'Target/stop must be on the correct side of entry for exchange TP/SL — invalid level(s) were not sent.',
                    7000,
                  );
                }
                const tpslAttach =
                  tpSl.takeProfit || tpSl.stopLoss
                    ? {
                        ...(tpSl.takeProfit ? { takeProfit: tpSl.takeProfit } : {}),
                        ...(tpSl.stopLoss ? { stopLoss: tpSl.stopLoss } : {}),
                        tpTriggerBy: futuresTpSlTriggerBy,
                        slTriggerBy: futuresTpSlTriggerBy,
                      }
                    : {};
                openedNewFuturesEntry = {
                  side: sideBybit,
                  qty: qtyStr,
                  positionIdx: 0,
                };
                await postBybitLinearOrder({
                  symbol: orderSymbol,
                  side: sideBybit,
                  qty: qtyStr,
                  orderType: 'Market',
                  leverage: Math.min(leverage, futuresLevCap),
                  positionIdx: 0,
                  ...tpslAttach,
                });
              }
            }
          }
          flashTradeToast('Order submitted — syncing account…');
          const snapshotsAfter = await refreshAccountSnapshots({ silent: false });
          if (linearReverseAwaitPostSyncClear) {
            reverseOrderInProgressRef.current = false;
          }
          const hasUserTpSl =
            (Number.isFinite(targetParsed) && targetParsed > 0) ||
            (Number.isFinite(stopParsed) && stopParsed > 0);
          if (market === 'futures' && !isManageMode && hasUserTpSl && activeExchange !== 'mexc') {
            const rollbackUnprotectedEntry = async (reason: string, details?: string) => {
              if (!openedNewFuturesEntry) {
                flashTradeToast(reason, 7600);
                return;
              }
              const closeSide = openedNewFuturesEntry.side === 'Buy' ? 'Sell' : 'Buy';
              try {
                await postBybitLinearOrder({
                  symbol: orderSymbol,
                  side: closeSide,
                  qty: openedNewFuturesEntry.qty,
                  orderType: 'Market',
                  reduceOnly: true,
                  positionIdx: openedNewFuturesEntry.positionIdx,
                });
                await refreshAccountSnapshots({ silent: true });
                flashTradeToast(details ? `${reason} ${details}` : reason, 7600);
              } catch (closeErr) {
                flashTradeToast(
                  formatBybitTradeErrorMessage(closeErr, `${reason} Auto-close also failed — close manually now.`),
                  9000,
                );
              }
            };

            const pos = findBybitLinearOpenLeg(snapshotsAfter, orderSymbol, nextSide);
            if (!pos || !Number.isFinite(pos.entryPrice) || pos.entryPrice <= 0) {
              if (userRequestedStopLoss) {
                await rollbackUnprotectedEntry(
                  'Stop-loss could not be verified on the new position. Entry was auto-closed.',
                  'Retry once account sync is stable.',
                );
                return false;
              }
            } else {
              const synced = linearTpSlStringsForOpen(nextSide, pos.entryPrice, targetParsed, stopParsed);
              if (synced.skippedTarget || synced.skippedStop) {
                flashTradeToast(
                  'TP/SL vs average fill: a level is on the wrong side — adjust in the form and use Apply TP/SL on manage if needed.',
                  7000,
                );
              }
              if (userRequestedStopLoss && (synced.skippedStop || !synced.tpSl.stopLoss)) {
                await rollbackUnprotectedEntry(
                  'Stop-loss could not be applied against the average fill price. Entry was auto-closed.',
                );
                return false;
              }
              if (synced.tpSl.takeProfit || synced.tpSl.stopLoss) {
                try {
                  await postBybitLinearTradingStop({
                    symbol: orderSymbol,
                    positionIdx: pos.positionIdx ?? 0,
                    takeProfit: synced.tpSl.takeProfit ?? '0',
                    stopLoss: synced.tpSl.stopLoss ?? '0',
                    tpTriggerBy: futuresTpSlTriggerBy,
                    slTriggerBy: futuresTpSlTriggerBy,
                  });
                } catch (e) {
                  if (userRequestedStopLoss) {
                    await rollbackUnprotectedEntry(
                      'Stop-loss placement failed on the exchange. Entry was auto-closed.',
                      `Exchange error: ${e instanceof Error ? e.message : String(e)}`,
                    );
                    return false;
                  }
                  flashTradeToast(formatBybitTradeErrorMessage(e, 'TP/SL sync after fill failed'), 5200);
                }
                await refreshAccountSnapshots({ silent: true });
              } else if (userRequestedStopLoss) {
                await rollbackUnprotectedEntry('Stop-loss placement failed on the exchange. Entry was auto-closed.');
                return false;
              }
            }
          }
          return true;
        } catch (e) {
          reverseOrderInProgressRef.current = false;
          const tradeErr = resolveBybitTradeError(e, 'Order failed');
          setTermsRetrySide(tradeErr.cta ? nextSide : null);
          flashTradeToast(tradeErr.message, 5200, tradeErr.cta);
          return false;
        } finally {
          setOrderPending(null);
        }
      }

      if (!isManageMode) {
        const repo = getPositionRepository();
        const open = repo.openPaperPosition?.({
          pair: mergedModel.pair,
          market,
          direction: nextSide,
          entryPrice: entryMark,
          notionalUsd: applyOpenOrderNotionalBuffer(metrics.positionSizeUsd, { minNotionalUsd: minOrderUsd }),
          leverage: market === 'spot' ? 1 : Math.min(leverage, futuresLevCap),
          stopPrice: Number.isFinite(stopParsed) && stopParsed > 0 ? stopParsed : null,
          targets: Number.isFinite(targetParsed) && targetParsed > 0 ? [targetParsed] : [],
          source: 'demo',
        });
        if (open?.ok) {
          flashTradeToast('Paper trade opened — simulated portfolio updated.');
          return true;
        }
        flashTradeToast(open?.error ?? 'Paper trade unavailable right now.');
        return false;
      }
      if (useRealExecution && !riskSettings.allowLiveExecution) {
        flashTradeToast('Live execution is locked — enable it in Risk controls when you are ready to send orders.', 5200, {
          label: 'Risk controls',
          href: '/risk',
        });
        return false;
      }
      if (mexcSnap && market !== 'futures') {
        flashTradeToast('MEXC only supports futures — switch to Futures mode to place live orders.');
        return false;
      }
      flashTradeToast('Connect an exchange in Account to place real orders.');
      return false;
    },
    [
      activeExchange,
      amountUsd,
      bybitSnap,
      canExecute,
      exchangePositionForSymbol,
      flashTradeToast,
      futuresLevCap,
      futuresTpSlTriggerBy,
      dailyRiskGuard.status,
      isBotsReviewCockpit,
      isManageMode,
      leverage,
      liveExecutionLocked,
      live.lastPrice,
      liveOrderSubmitEnabled,
      market,
      mergedModel.entry,
      mergedModel.lastPrice,
      mergedModel.pair,
      mexcSnap,
      metrics.positionSizeUsd,
      minOrderUsd,
      orderSymbol,
      refreshAccountSnapshots,
      riskSettings.allowLiveExecution,
      side,
      sizingValidation.reason,
      stopParsed,
      targetParsed,
      useRealExecution,
    ],
  );

  const submitManageTradingStopFromNumbers = useCallback(
    async (stopPrice: number, targetPrice: number) => {
      if (market !== 'futures') return false;
      if (!exchangePositionForSymbol) {
        flashTradeToast(
          bybitSnap
            ? 'No open linear position on the exchange for this pair — confirm symbol or refresh Account.'
            : mexcSnap
              ? 'No open MEXC position for this pair — confirm symbol or refresh Account.'
              : 'Connect an exchange in Account to update TP/SL.',
        );
        return false;
      }
      if (activeExchange === 'mexc') {
        flashTradeToast('MEXC does not support modifying TP/SL on open positions — set them when opening the trade.');
        return false;
      }
      if (!useRealExecution) {
        flashTradeToast('Connect an exchange in Account to update TP/SL.');
        return false;
      }
      if (!riskSettings.allowLiveExecution) {
        flashTradeToast(
          'Live execution is locked — enable it in Risk controls to push TP/SL changes to the exchange.',
          6200,
          { label: 'Risk controls', href: '/risk' },
        );
        return false;
      }
      const entry = exchangePositionForSymbol.entryPrice;
      if (!Number.isFinite(entry) || entry <= 0) {
        flashTradeToast('Missing entry price — refresh Account sync.');
        return false;
      }
      const legSide = exchangePositionForSymbol.side;
      const { tpSl, skippedTarget, skippedStop } = linearTpSlStringsForOpen(
        legSide,
        entry,
        targetPrice,
        stopPrice,
      );
      if (skippedTarget || skippedStop) {
        flashTradeToast(
          'A level is on the wrong side of entry — that leg was left unchanged on the exchange. Other legs still update.',
          7000,
        );
      }
      const tpExisting = exchangePositionForSymbol.takeProfitPrice;
      const slExisting = exchangePositionForSymbol.stopLossPrice;
      // When the caller doesn't supply a valid new price (absent, wrong-side, or non-finite),
      // preserve whatever the exchange already has rather than sending '0' (which clears the leg).
      const takeProfit =
        tpSl.takeProfit ??
        (tpExisting != null && Number.isFinite(tpExisting) && tpExisting > 0
          ? formatLinearPriceStringForBybit(tpExisting)
          : '0');
      const stopLoss =
        tpSl.stopLoss ??
        (slExisting != null && Number.isFinite(slExisting) && slExisting > 0
          ? formatLinearPriceStringForBybit(slExisting)
          : '0');
      setOrderPending('tpsl');
      try {
        await postBybitLinearTradingStop({
          symbol: orderSymbol,
          positionIdx: exchangePositionForSymbol.positionIdx ?? 0,
          takeProfit,
          stopLoss,
          tpTriggerBy: futuresTpSlTriggerBy,
          slTriggerBy: futuresTpSlTriggerBy,
        });
        setStopStr(Number.isFinite(stopPrice) && stopPrice > 0 ? formatQuoteNumber(stopPrice) : '');
        setTargetStr(Number.isFinite(targetPrice) && targetPrice > 0 ? formatQuoteNumber(targetPrice) : '');
        if (isManageMode) setManageTpSlDirty(false);
        flashTradeToast('TP/SL updated — syncing account…');
        await refreshAccountSnapshots({ silent: false });
        return true;
      } catch (e) {
        flashTradeToast(formatBybitTradeErrorMessage(e, 'Failed to update TP/SL'), 5200);
        return false;
      } finally {
        setOrderPending(null);
      }
    },
    [
      bybitSnap,
      exchangePositionForSymbol,
      flashTradeToast,
      futuresTpSlTriggerBy,
      isManageMode,
      market,
      orderSymbol,
      refreshAccountSnapshots,
      riskSettings.allowLiveExecution,
      useRealExecution,
    ],
  );

  const liveChartTpSlDragEligible = useMemo(
    () =>
      !isManageMode &&
      !isBotsReviewCockpit &&
      !liveExecutionLocked &&
      market === 'futures' &&
      useRealExecution &&
      activeExchange !== 'mexc' &&
      riskSettings.allowLiveExecution &&
      exchangePositionForSymbol != null &&
      isExchangeBackedOpenLeg &&
      orderPending == null,
    [
      activeExchange,
      exchangePositionForSymbol,
      isBotsReviewCockpit,
      isExchangeBackedOpenLeg,
      isManageMode,
      liveExecutionLocked,
      market,
      orderPending,
      riskSettings.allowLiveExecution,
      useRealExecution,
    ],
  );

  const onDockChartLiveStopDragCommit = useCallback(
    async (p: number) => {
      if (!Number.isFinite(p) || p <= 0) return;
      setStopStr(formatQuoteNumber(p));
      await submitManageTradingStopFromNumbers(p, targetParsed);
    },
    [submitManageTradingStopFromNumbers, targetParsed],
  );

  const onDockChartLiveTargetDragCommit = useCallback(
    async (p: number) => {
      if (!Number.isFinite(p) || p <= 0) return;
      setTargetStr(formatQuoteNumber(p));
      await submitManageTradingStopFromNumbers(stopParsed, p);
    },
    [stopParsed, submitManageTradingStopFromNumbers],
  );

  const applyManageTradingStop = useCallback(async () => {
    await submitManageTradingStopFromNumbers(stopParsed, targetParsed);
  }, [submitManageTradingStopFromNumbers, stopParsed, targetParsed]);

  const applyAdjustRiskExchangeStop = useCallback(
    async (stopPrice: number) => {
      await submitManageTradingStopFromNumbers(stopPrice, targetParsed);
    },
    [submitManageTradingStopFromNumbers, targetParsed],
  );

  const moveStopToBreakeven = useCallback(async () => {
    if (!isManageMode || market !== 'futures' || !exchangePositionForSymbol) {
      flashTradeToast('Open a linear position to move stops.');
      return;
    }
    const entry = exchangePositionForSymbol.entryPrice;
    const leg = exchangePositionForSymbol.side;
    if (!Number.isFinite(entry) || entry <= 0) return;
    const buf = 0.00012;
    const beStop = leg === 'long' ? entry * (1 - buf) : entry * (1 + buf);
    await submitManageTradingStopFromNumbers(beStop, targetParsed);
    exitAuto.pushActivity({
      kind: 'exit_state',
      message: `Stop nudged toward breakeven (~${formatQuoteNumber(beStop)})`,
    });
  }, [
    exchangePositionForSymbol,
    exitAuto,
    isManageMode,
    market,
    submitManageTradingStopFromNumbers,
    targetParsed,
  ]);

  const tightenStopManage = useCallback(async () => {
    if (!isManageMode || market !== 'futures' || !exchangePositionForSymbol) {
      flashTradeToast('Open a linear position to tighten stops.');
      return;
    }
    const entry = exchangePositionForSymbol.entryPrice;
    const leg = exchangePositionForSymbol.side;
    const curSl = exchangePositionForSymbol.stopLossPrice ?? stopParsed;
    if (!Number.isFinite(entry) || entry <= 0 || !Number.isFinite(curSl) || curSl <= 0) {
      flashTradeToast('Need a valid stop on file — set SL in the form or refresh Account.');
      return;
    }
    const tightened =
      leg === 'long' ? curSl + (entry - curSl) * 0.38 : curSl - (curSl - entry) * 0.38;
    if (!Number.isFinite(tightened) || tightened <= 0) return;
    await submitManageTradingStopFromNumbers(tightened, targetParsed);
    exitAuto.pushActivity({
      kind: 'exit_state',
      message: `Stop tightened toward entry (~${formatQuoteNumber(tightened)})`,
    });
  }, [
    exchangePositionForSymbol,
    exitAuto,
    isManageMode,
    market,
    stopParsed,
    submitManageTradingStopFromNumbers,
    targetParsed,
  ]);

  const openManagePositionView = useCallback(() => {
    const pos = exchangePositionForSymbol;
    if (!pos || market !== 'futures') return;
    const mark =
      hasActiveTradePosition && Number.isFinite(throttledOpenPnl.mark) && throttledOpenPnl.mark > 0
        ? throttledOpenPnl.mark
        : live.lastPrice != null && live.lastPrice > 0
          ? live.lastPrice
          : Number.isFinite(mergedModel.lastPrice) && mergedModel.lastPrice > 0
            ? mergedModel.lastPrice
            : undefined;
    const q = buildManageTradeQueryFromLinearPosition(pos, {
      markPrice: mark,
      leverageFallback: effectiveFuturesLeverage,
    });
    navigate(`/trade?${q}`);
  }, [
    effectiveFuturesLeverage,
    exchangePositionForSymbol,
    hasActiveTradePosition,
    live.lastPrice,
    market,
    mergedModel.lastPrice,
    navigate,
    throttledOpenPnl.mark,
  ]);

  const onActivePartialClose = useCallback(
    (fraction: number) => {
      if (market === 'futures' && exchangePositionForSymbol) {
        void submitExchangeClose({ kind: 'linear', pos: exchangePositionForSymbol, fraction });
        return;
      }
      if (market === 'spot' && exchangeSpotFreeBaseQty != null && exchangeSpotFreeBaseQty > 0) {
        void submitExchangeClose({
          kind: 'spot',
          symbol: orderSymbol,
          freeBase: exchangeSpotFreeBaseQty,
          fraction,
        });
        return;
      }
      pendingManualPartialClosePctRef.current = null;
      flashTradeToast(
        bybitSnap
          ? 'No matching open position on the exchange for this symbol — check pair and sync.'
          : 'Connect Bybit in Account to manage positions.',
      );
    },
    [bybitSnap, exchangePositionForSymbol, exchangeSpotFreeBaseQty, flashTradeToast, market, orderSymbol, submitExchangeClose],
  );

  const partialScaleOutEligible = useMemo(
    () =>
      useRealExecution &&
      ((market === 'futures' && exchangePositionForSymbol != null) ||
        (market === 'spot' && exchangeSpotFreeBaseQty != null && exchangeSpotFreeBaseQty > 0)),
    [exchangePositionForSymbol, exchangeSpotFreeBaseQty, market, useRealExecution],
  );

  const onPartialPositionScaleOut = useCallback(
    (fraction: number) => {
      setDockPartialPct(Math.round(fraction * 100));
      onActivePartialClose(fraction);
    },
    [onActivePartialClose],
  );

  const onExitAutomationSuggestStopMove = useCallback(
    async (suggestedStop: number | null) => {
      if (!(suggestedStop != null && Number.isFinite(suggestedStop) && suggestedStop > 0)) {
        flashTradeToast('No valid stop suggestion right now — wait for live mark updates.');
        return;
      }
      const applied = await submitManageTradingStopFromNumbers(suggestedStop, targetParsed);
      if (!applied) {
        exitAuto.pushActivity({
          kind: 'exit_state',
          message: `Suggested stop move blocked (~${formatQuoteNumber(suggestedStop)}) — review toast for reason.`,
        });
        return;
      }
      exitAuto.pushActivity({
        kind: 'exit_state',
        message: `Suggested stop move applied (~${formatQuoteNumber(suggestedStop)})`,
      });
    },
    [exitAuto, flashTradeToast, submitManageTradingStopFromNumbers, targetParsed],
  );

  const onExitAutomationSuggestPartialTp = useCallback(() => {
    setManagePartialFraction(0.25);
    if (!isManageMode) {
      openManagePositionView();
      window.setTimeout(() => setManagePartialSheetOpen(true), 0);
    } else {
      setManagePartialSheetOpen(true);
    }
    flashTradeToast('Partial take-profit suggestion prepared (25%). Review and confirm in the sheet.');
    emitGlobalAnnouncement({
      id: `partial-tp-suggestion-${Date.now()}`,
      kind: 'ai_action',
      title: 'Partial Take-Profit Suggestion',
      subtitle: 'Prepared 25% trim. Confirm in the sheet to submit live.',
    });
    exitAuto.pushActivity({
      kind: 'exit_state',
      message: 'Suggested partial take-profit ready (25%) — confirm in the sheet to submit.',
    });
  }, [exitAuto, flashTradeToast, isManageMode, openManagePositionView]);

  const onExitAutomationDisable = useCallback(() => {
    exitAuto.setMode('manual');
    exitAuto.pushActivity({
      kind: 'mode_change',
      message: 'Exit automation disabled — switched to Manual',
    });
    flashTradeToast('Exit automation set to Manual.');
  }, [exitAuto, flashTradeToast]);

  const onActiveCloseAllConfirm = useCallback(() => {
    if (market === 'futures' && exchangePositionForSymbol) {
      void submitExchangeClose({ kind: 'linear', pos: exchangePositionForSymbol, fraction: 1 });
      return;
    }
    if (market === 'spot' && exchangeSpotFreeBaseQty != null && exchangeSpotFreeBaseQty > 0) {
      void submitExchangeClose({
        kind: 'spot',
        symbol: orderSymbol,
        freeBase: exchangeSpotFreeBaseQty,
        fraction: 1,
      });
      return;
    }
    flashTradeToast(
      bybitSnap
        ? 'No matching open position on the exchange for this pair.'
        : 'Connect Bybit in Account to manage positions.',
    );
  }, [bybitSnap, exchangePositionForSymbol, exchangeSpotFreeBaseQty, flashTradeToast, market, orderSymbol, submitExchangeClose]);

  const onCloseAllDemoPositionsConfirm = useCallback(() => {
    const repo = getPositionRepository();
    const markByPair: Record<string, number> = {};
    for (const [symbol, ticker] of Object.entries(liveTickersBySymbol)) {
      if (!(ticker != null && Number.isFinite(ticker.lastPrice) && ticker.lastPrice > 0)) continue;
      const pair = symbolToPair(symbol).toUpperCase();
      markByPair[normalizePositionPairKey(pair)] = ticker.lastPrice;
    }
    const liveLastPrice = live.lastPrice;
    if (typeof liveLastPrice === 'number' && Number.isFinite(liveLastPrice) && liveLastPrice > 0) {
      markByPair[normalizePositionPairKey(mergedModel.pair)] = liveLastPrice;
    } else if (Number.isFinite(mergedModel.lastPrice) && mergedModel.lastPrice > 0) {
      markByPair[normalizePositionPairKey(mergedModel.pair)] = mergedModel.lastPrice;
    }
    const closed = typeof repo.closeAllPositions === 'function' ? repo.closeAllPositions({ markByPair }) : 0;
    if (closed > 0) {
      flashTradeToast(`Closed ${closed} simulated position${closed === 1 ? '' : 's'}.`);
      return;
    }
    flashTradeToast('No active simulated positions to close.');
  }, [flashTradeToast, live.lastPrice, liveTickersBySymbol, mergedModel.lastPrice, mergedModel.pair]);

  const onRequestActiveCloseAllModal = useCallback(() => {
    if (hasActiveTradePosition && !isExchangeBackedOpenLeg) {
      setCloseAllDemoModalOpen(true);
      return;
    }
    setCloseAllModalOpen(true);
  }, [hasActiveTradePosition, isExchangeBackedOpenLeg]);

  /** Exit AI Auto: submit reduce-only / spot sells when guidance crosses trim/exit (Protect Profit etc.), not log-only. */
  useEffect(() => {
    if (!exitFlow) {
      prevAutoStateRef.current = null;
      return;
    }
    if (exitAuto.mode !== 'auto') {
      prevAutoStateRef.current = null;
      return;
    }
    const curr = exitFlow.effective.state;
    const prev = prevAutoStateRef.current;
    const openedAtMs =
      primaryChartOpenPosition?.openedAtMs != null && Number.isFinite(primaryChartOpenPosition.openedAtMs)
        ? primaryChartOpenPosition.openedAtMs
        : positionOpenedAtMs;
    const withinAutoTrimWarmup =
      curr === 'trim' &&
      openedAtMs != null &&
      Number.isFinite(openedAtMs) &&
      openedAtMs > 0 &&
      Date.now() - openedAtMs < EXIT_AI_AUTO_TRIM_MIN_POSITION_AGE_MS;

    if (withinAutoTrimWarmup) {
      // Seed state during post-open noise so Auto mode doesn't immediately trim right after entry fill.
      prevAutoStateRef.current = curr;
      return;
    }

    let blockedAdvancePrev = false;
    if (prev !== null && prev !== curr) {
      const trimEdge = curr === 'trim' && prev === 'hold' && exitAuto.safeguards.allowPartialExits;
      const exitEdge =
        curr === 'exit' &&
        exitAuto.safeguards.allowFullAutoClose &&
        (prev === 'hold' || prev === 'trim');

      if ((trimEdge || exitEdge) && shouldSurfaceAutoExitPopups) {
        emitGlobalAnnouncement({
          id: `auto-exit-decision-${Date.now()}`,
          kind: 'ai_action',
          title: 'Auto Exit AI Decision',
          subtitle: `${prev.toUpperCase()} → ${curr.toUpperCase()} near $${formatQuoteNumber(exitFlow.lastPrice)} · ${exitFlow.nextPlanned}`,
        });
      }

      if (trimEdge || exitEdge) {
        if (orderPending) {
          blockedAdvancePrev = true;
        } else if (useRealExecution && exitAutoCanExchangeExecute) {
          if (trimEdge) {
            exitAuto.pushActivity({
              kind: 'auto_trim',
              message: `Auto trim ~50% near $${formatQuoteNumber(exitFlow.lastPrice)} — submitting…`,
            });
            onActivePartialClose(0.5);
          } else if (exitEdge) {
            exitAuto.pushActivity({
              kind: 'auto_close',
              message: `Auto full exit near $${formatQuoteNumber(exitFlow.lastPrice)} — submitting…`,
            });
            onActiveCloseAllConfirm();
          }
        } else {
          if (trimEdge) {
            exitAuto.pushActivity({
              kind: 'exit_state',
              message: useRealExecution
                ? `Trim signal near $${formatQuoteNumber(exitFlow.lastPrice)} — no exchange position on this pair.`
                : `Trim signal near $${formatQuoteNumber(exitFlow.lastPrice)} — connect Bybit in Account to auto-execute.`,
            });
          } else if (exitEdge) {
            exitAuto.pushActivity({
              kind: 'exit_state',
              message: useRealExecution
                ? `Exit signal near $${formatQuoteNumber(exitFlow.lastPrice)} — no exchange position on this pair.`
                : `Exit signal near $${formatQuoteNumber(exitFlow.lastPrice)} — connect Bybit in Account to auto-execute.`,
            });
          }
        }
      }
    }
    if (!blockedAdvancePrev) {
      prevAutoStateRef.current = curr;
    }
  }, [
    exitFlow,
    exitAuto.mode,
    exitAuto.safeguards.allowPartialExits,
    exitAuto.safeguards.allowFullAutoClose,
    exitAuto.pushActivity,
    exchangePositionForSymbol,
    exchangeSpotFreeBaseQty,
    market,
    onActiveCloseAllConfirm,
    onActivePartialClose,
    orderPending,
    positionOpenedAtMs,
    primaryChartOpenPosition?.openedAtMs,
    useRealExecution,
    shouldSurfaceAutoExitPopups,
    exitAutoCanExchangeExecute,
  ]);

  const onClosePosition = useCallback(() => {
    onActiveCloseAllConfirm();
  }, [onActiveCloseAllConfirm]);

  const onAddToPosition = useCallback(() => {
    void executeTrade(side);
  }, [executeTrade, side]);
  const applyManageAllChanges = useCallback(async () => {
    if (!isManageMode || market !== 'futures') {
      flashTradeToast('Open a linear managed position to apply settings.');
      return;
    }
    const shouldApplySize = manageOrderDraftDirty && Number.isFinite(amountUsd) && amountUsd > 0;
    const shouldApplyTpSl = manageTpSlDirty;
    if (!shouldApplySize && !shouldApplyTpSl) {
      flashTradeToast('No pending manage changes to apply.');
      return;
    }
    if (shouldApplySize) {
      await executeTrade(side);
    }
    if (shouldApplyTpSl) {
      await applyManageTradingStop();
    }
    setManageOrderDraftDirty(false);
  }, [
    amountUsd,
    applyManageTradingStop,
    executeTrade,
    flashTradeToast,
    isManageMode,
    manageOrderDraftDirty,
    manageTpSlDirty,
    market,
    side,
  ]);

  const onReverseOrder = useCallback(() => {
    const openLegSide =
      primaryChartOpenPosition?.side ??
      (isManageMode && manageCtx ? manageCtx.side : undefined) ??
      exchangePositionForSymbol?.side;
    if (openLegSide !== 'long' && openLegSide !== 'short') {
      flashTradeToast('No open leg to reverse — sync Account or reopen manage from Portfolio.');
      return;
    }
    const reverseSide: TradeSide = openLegSide === 'long' ? 'short' : 'long';
    void executeTrade(reverseSide, { manageIntent: 'reverse' });
  }, [
    executeTrade,
    exchangePositionForSymbol?.side,
    flashTradeToast,
    isManageMode,
    manageCtx,
    primaryChartOpenPosition?.side,
  ]);

  const chartPnlHeader = useMemo(() => {
    if (isManageMode && managePnlDisplay && hasManageOpenExposure) {
      const pnl = managePnlDisplay.pnlUsd;
      const pct = managePnlDisplay.pnlPct;
      if (!Number.isFinite(pnl) || !Number.isFinite(pct)) return { label: undefined, tone: undefined } as const;
      const sign = pnl >= 0 ? '+' : '−';
      const tone = pnl > 0 ? 'positive' : pnl < 0 ? 'negative' : 'neutral';
      return {
        label: `PnL ${sign}$${formatQuoteNumber(Math.abs(pnl))} (${sign}${Math.abs(pct).toFixed(2)}%)`,
        tone,
      } as const;
    }
    if (
      !isManageMode &&
      hasActiveTradePosition &&
      Number.isFinite(portfolioAlignedLiveUnrealized.pnlUsd) &&
      Number.isFinite(portfolioAlignedLiveUnrealized.movePct)
    ) {
      const pnl = portfolioAlignedLiveUnrealized.pnlUsd;
      const pct = portfolioAlignedLiveUnrealized.movePct;
      const sign = pnl >= 0 ? '+' : '−';
      const tone = pnl > 0 ? 'positive' : pnl < 0 ? 'negative' : 'neutral';
      return {
        label: `uPnL ${sign}$${formatQuoteNumber(Math.abs(pnl))} (${sign}${Math.abs(pct).toFixed(2)}%)`,
        tone,
      } as const;
    }
    return { label: undefined, tone: undefined } as const;
  }, [
    hasActiveTradePosition,
    hasManageOpenExposure,
    isManageMode,
    portfolioAlignedLiveUnrealized.movePct,
    portfolioAlignedLiveUnrealized.pnlUsd,
    managePnlDisplay,
  ]);

  const manageDockChartHeaderMetrics = useMemo(() => {
    const badge =
      exitAuto.mode === 'manual'
        ? 'Static TP/SL'
        : exitFlow?.effective.state === 'trim'
          ? 'AI trim'
          : exitFlow?.effective.state === 'exit'
            ? 'AI exit'
            : 'AI exit';
    return {
      riskPercent: tradeDockStats.riskPercent,
      rewardPercent: tradeDockStats.rewardPercent,
      rrRatio: tradeDockStats.rrRatio,
      badge,
      ...(chartPnlHeader.label
        ? {
            secondaryLine: chartPnlHeader.label,
            secondaryLineTone: chartPnlHeader.tone,
          }
        : {}),
    };
  }, [
    chartPnlHeader.label,
    chartPnlHeader.tone,
    exitAuto.mode,
    exitFlow?.effective.state,
    tradeDockStats.rewardPercent,
    tradeDockStats.riskPercent,
    tradeDockStats.rrRatio,
  ]);

  const manageChartProximity = useMemo((): 'stop' | 'target' | null => {
    if (!isManageMode) return null;
    const mark = mergedModel.lastPrice;
    const stop = chartModelForPlot.stop;
    const target = chartModelForPlot.target;
    if (Number.isFinite(mark) && mark > 0 && Number.isFinite(stop) && stop > 0) {
      if (Math.abs(mark - stop) / mark < 0.004) return 'stop';
    }
    if (Number.isFinite(mark) && mark > 0 && Number.isFinite(target) && target > 0) {
      if (Math.abs(mark - target) / mark < 0.004) return 'target';
    }
    return null;
  }, [chartModelForPlot.stop, chartModelForPlot.target, isManageMode, mergedModel.lastPrice]);

  const intervalLabel =
    chartInterval === 'D'
      ? '1D'
      : chartInterval === 'W'
        ? '1W'
        : chartInterval === '60'
          ? '1h'
          : chartInterval === '240'
            ? '4h'
            : chartInterval === '1'
              ? '1m'
              : `${chartInterval}m`;

  const toggleChartDock = useCallback(() => {
    setChartDockChevronIdle(true);
    setChartDockOpen((o) => {
      const next = !o;
      if (!next) setChartDockMaximized(false);
      return next;
    });
  }, []);

  const toggleChartDockMaximized = useCallback(() => {
    setChartDockChevronIdle(true);
    setChartDockOpen(true);
    setChartDockMaximized((v) => !v);
  }, []);

  const onPickTradePair = useCallback(
    (s: CryptoSignal) => {
      setTradePairMenuOpen(false);
      navigate(`/trade?${buildTradeQueryString(s, { marketStatus: deriveMarketStatus(s) })}`);
    },
    [navigate],
  );

  useEffect(() => {
    if (isManageMode) {
      setTradePairMenuOpen(false);
      setTradeHeaderMoreOpen(false);
    }
  }, [isManageMode]);

  useEffect(() => {
    const onDemoPositionsChanged = () => setDemoPositionsRevision((v) => v + 1);
    window.addEventListener(DEMO_POSITIONS_CHANGED_EVENT, onDemoPositionsChanged);
    return () => window.removeEventListener(DEMO_POSITIONS_CHANGED_EVENT, onDemoPositionsChanged);
  }, []);

  useEffect(() => {
    if (!tradePairMenuOpen && !tradeHeaderMoreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTradePairMenuOpen(false);
        setTradeHeaderMoreOpen(false);
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      const pairEl = tradePairMenuRef.current;
      const moreEl = tradeHeaderMoreRef.current;
      if (tradePairMenuOpen && pairEl && !pairEl.contains(t)) setTradePairMenuOpen(false);
      if (tradeHeaderMoreOpen && moreEl && !moreEl.contains(t)) setTradeHeaderMoreOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [tradePairMenuOpen, tradeHeaderMoreOpen]);

  useEffect(() => {
    if (!reviewTopFromQuery) return;
    window.requestAnimationFrame(() => {
      tradeScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    });
  }, [location.key, reviewTopFromQuery]);

  const paperPreviewRef = useRef<HTMLDivElement>(null);
  const scrollToPaperPreviewSection = useCallback(() => {
    window.requestAnimationFrame(() => {
      paperPreviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }, []);

  const [paperRealAccountNudgeVisible, setPaperRealAccountNudgeVisible] = useState(false);
  const dismissPaperRealAccountNudge = useCallback(() => {
    try {
      sessionStorage.setItem(PAPER_REAL_ACCOUNT_NUDGE_DISMISS_KEY, '1');
    } catch (e) { console.error("[Caught Error]", e); }
    setPaperRealAccountNudgeVisible(false);
  }, []);
  const onPaperPreviewInteraction = useCallback(() => {
    try {
      if (sessionStorage.getItem(PAPER_REAL_ACCOUNT_NUDGE_DISMISS_KEY) === '1') return;
    } catch (e) { console.error("[Caught Error]", e); }
    setPaperRealAccountNudgeVisible(true);
  }, []);
  const [setupFocusBanner, setSetupFocusBanner] = useState<string | null>(null);
  const onSetupFocusBannerCb = useCallback((label: string) => {
    setSetupFocusBanner(label);
    window.setTimeout(() => setSetupFocusBanner(null), 4200);
  }, []);
  const focusTradeSetupOnChart = useCallback(() => {
    if (isManageMode) {
      setManageChartMaximized(true);
    } else {
      setChartDockOpen(true);
      setChartDockChevronIdle(true);
    }
    requestChartSetupFocus({ pairFilter: mergedModel.pair });
  }, [isManageMode, mergedModel.pair]);

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-[#050505] text-white">
      {!isManageMode ? (
        <CloseAllPositionsModal
          open={closeAllModalOpen}
          exchangeExecution={useRealExecution}
          onCancel={() => setCloseAllModalOpen(false)}
          onConfirm={() => {
            setCloseAllModalOpen(false);
            onActiveCloseAllConfirm();
          }}
        />
      ) : null}
      {!isManageMode ? (
        <CloseAllPositionsModal
          open={closeAllDemoModalOpen}
          exchangeExecution={false}
          title="Close all demo positions?"
          confirmLabel="Close demo positions"
          bodyText="This will close every active demo/paper position tracked by Sigflo on this device. No live exchange orders will be submitted."
          onCancel={() => setCloseAllDemoModalOpen(false)}
          onConfirm={() => {
            setCloseAllDemoModalOpen(false);
            onCloseAllDemoPositionsConfirm();
          }}
        />
      ) : null}
      <ClosedPositionSummaryModal summary={closedPositionSummary} onDismiss={() => setClosedPositionSummary(null)} />
      {tradeToast ? (
        <div
          className="fixed left-1/2 z-[60] w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 transition-opacity duration-200"
          style={{ bottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))' }}
          role="status"
        >
          <div className="rounded-xl border border-[#00ffc8]/35 bg-black/90 px-3 py-2.5 text-center text-sm font-semibold text-[#00ffc8] shadow-[0_12px_40px_-12px_rgba(0,255,200,0.22)] backdrop-blur-md">
            <p>{tradeToast}</p>
            {tradeToastCta ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    window.open(tradeToastCta.href, '_blank', 'noopener,noreferrer');
                  }}
                  className="mt-2 w-full rounded-lg border border-[#00ffc8]/45 bg-[#00ffc8]/10 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#8fffe5] transition hover:bg-[#00ffc8]/18"
                >
                  {tradeToastCta.label}
                </button>
                {termsRetrySide ? (
                  <button
                    type="button"
                    onClick={() => {
                      setTradeToast(null);
                      setTradeToastCta(null);
                      const retrySide = termsRetrySide;
                      setTermsRetrySide(null);
                      void executeTrade(retrySide);
                    }}
                    className="mt-1.5 w-full rounded-lg border border-cyan-300/45 bg-cyan-500/10 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-cyan-100 transition hover:bg-cyan-500/18"
                  >
                    I accepted terms, retry now
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {setupFocusBanner ? (
        <div
          className="pointer-events-none fixed left-0 right-0 z-[55] flex justify-center px-4"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 3.75rem)' }}
          role="status"
        >
          <p className="max-w-sm rounded-full border border-cyan-400/35 bg-black/90 px-4 py-2 text-center text-[11px] font-semibold text-cyan-100 shadow-lg backdrop-blur-md">
            {setupFocusBanner}
          </p>
        </div>
      ) : null}

      <div className="sticky top-0 z-30 shrink-0 border-b border-[#00ffc8]/25 bg-black/60 backdrop-blur-md transition-[box-shadow] duration-300">
        <header className="mx-auto max-w-lg px-3 pb-1.5 pt-[max(0.35rem,env(safe-area-inset-top))]">
          <div className="flex items-center gap-2">
            {canGoBack ? (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] text-sigflo-muted transition hover:text-white"
                aria-label="Back"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : null}
            {isManageMode ? (
              <>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-200/90">Managing position</p>
                  <p className="mt-0.5 truncate text-sm font-bold text-white">{mergedModel.pair}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void onBiasAlertsControl()}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${
                    !appAnnouncementsEnabled
                      ? 'border-white/[0.1] text-sigflo-muted opacity-55 hover:opacity-90'
                      : biasNotifyPermission === 'granted'
                        ? 'border-cyan-400/35 text-cyan-200/95 hover:text-cyan-100'
                        : 'border-white/[0.08] text-sigflo-muted hover:text-cyan-100/90'
                  }`}
                  title={
                    !appAnnouncementsEnabled
                      ? 'All Sigflo alerts off — tap to turn on'
                      : biasNotifyPermission === 'granted'
                        ? 'All alerts on — tap to turn all off'
                        : biasNotifyPermission === 'denied'
                          ? 'Browser blocked OS alerts — tap to mute in-app banners too'
                          : 'Enable browser notifications or mute all alerts'
                  }
                  aria-label={!appAnnouncementsEnabled ? 'Turn on Sigflo alerts' : 'Sigflo alerts and notifications'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                    <path
                      d="M18 8A6 6 0 106 8c0 7-3 7-3 14h18c0-7-3-7-3-14"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <div ref={tradePairMenuRef} className="relative flex min-w-0 flex-1 items-center gap-1">
                  <button
                    type="button"
                    id="trade-pair-menu-button"
                    {...ariaExpanded(tradePairMenuOpen)}
                    aria-haspopup="listbox"
                    aria-controls="trade-pair-menu"
                    onClick={() => {
                      setTradeHeaderMoreOpen(false);
                      setTradePairMenuOpen((o) => !o);
                    }}
                    className="flex min-w-0 flex-1 items-center gap-1 rounded-xl border border-transparent py-1 text-left transition hover:border-white/[0.06] hover:bg-white/[0.03]"
                    aria-label="Choose trading pair"
                  >
                    <span className="truncate text-base font-bold tracking-tight text-white">{mergedModel.pair}</span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      className={`shrink-0 text-sigflo-muted transition-transform duration-200 ${tradePairMenuOpen ? 'rotate-180' : ''}`}
                      aria-hidden
                    >
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {tradePairMenuOpen ? (
                    <div
                      id="trade-pair-menu"
                      role="listbox"
                      aria-labelledby="trade-pair-menu-button"
                      className="absolute left-0 right-0 top-[calc(100%+4px)] z-[60] max-h-[min(18rem,calc(100dvh-7rem))] overflow-y-auto overscroll-y-contain rounded-xl border border-white/[0.12] bg-[#0a0a0a] py-1 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.85)] ring-1 ring-white/[0.06]"
                    >
                      {tradePairPickerSignals.map((s) => {
                        const active = pairBaseToLinearSymbol(s.pair) === liveSymbol;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            role="option"
                            {...ariaSelected(active)}
                            onClick={() => onPickTradePair(s)}
                            className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-white/[0.06] active:bg-white/[0.08] ${
                              active ? 'bg-white/[0.05]' : ''
                            }`}
                          >
                            <span className="min-w-0 truncate font-semibold text-white">
                              {formatSignalPairForTicker(s.pair)}
                            </span>
                            <span className="shrink-0 tabular-nums text-[11px] font-medium text-sigflo-muted">
                              {s.setupScore}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
                {isTriggered ? (
                  <button
                    type="button"
                    onClick={() => navigate(getFeedRoute())}
                    className={`sigflo-trade-header-triggered flex shrink-0 flex-col items-end gap-0.5 rounded-lg py-0.5 pl-2 text-right text-[10px] font-semibold leading-tight transition hover:bg-white/[0.08] active:scale-[0.98] ${uiStateStyle.text}`}
                    aria-label="Back to signals"
                  >
                    <span className="inline-flex items-center justify-end gap-1">
                      <LiveIndicator
                        pulse={uiStateStyle.pulse}
                        dotClassName={uiStateStyle.dot}
                        size="md"
                        pulseDurationSec={2.4}
                      />
                      <span className="truncate uppercase tracking-[0.11em] text-[#b2ffef]">
                        {uiSignalStateLabel(uiState)}
                      </span>
                      <span className="shrink-0 font-normal text-sigflo-muted">· {stateAgeLabel}</span>
                    </span>
                    <span className="max-w-full truncate font-normal text-sigflo-muted">
                      Triggered {triggeredPairCount}
                    </span>
                  </button>
                ) : (
                  <div
                    className={`flex shrink-0 flex-col items-end gap-0.5 text-right text-[10px] font-semibold leading-tight ${uiStateStyle.text}`}
                  >
                    <span className="inline-flex items-center justify-end gap-1">
                      <LiveIndicator
                        pulse={uiStateStyle.pulse}
                        dotClassName={uiStateStyle.dot}
                        size="sm"
                        pulseDurationSec={2.8}
                      />
                      <span className="truncate">{uiSignalStateLabel(uiState)}</span>
                    </span>
                    <span className="max-w-full truncate font-normal text-sigflo-muted">
                      Triggered {triggeredPairCount} · {live.mode} · {live.connection}
                    </span>
                  </div>
                )}
                {tradeBalance && !forcePaperMode ? (
                  <button
                    type="button"
                    onClick={() => setForcePaperMode(true)}
                    className="flex shrink-0 items-center gap-1 rounded-xl border border-violet-400/25 bg-violet-500/[0.08] px-2 py-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-violet-100 transition hover:bg-violet-500/[0.14]"
                    aria-label="Switch to paper mode"
                    title="Switch to paper mode"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <rect x="3" y="3" width="18" height="18" rx="2" strokeLinejoin="round" />
                      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Paper
                  </button>
                ) : null}
                {forcePaperMode ? (
                  <button
                    type="button"
                    onClick={() => setForcePaperMode(false)}
                    className="flex shrink-0 items-center gap-1 rounded-xl border border-cyan-400/25 bg-cyan-500/[0.08] px-2 py-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-cyan-100 transition hover:bg-cyan-500/[0.14]"
                    aria-label="Switch to live mode"
                    title="Switch to live mode"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.64 5.64l2.12 2.12m8.48 8.48l2.12 2.12M5.64 18.36l2.12-2.12m8.48-8.48l2.12-2.12" strokeLinecap="round" />
                    </svg>
                    Live
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    const on = toggleTradePairFavorite(tradePairFavoriteBase);
                    setTradeFavRevision((v) => v + 1);
                    flashTradeToast(on ? 'Saved to your watchlist' : 'Removed from watchlist');
                  }}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${
                    isPairInWatchlist
                      ? 'border-amber-400/30 text-amber-300/95 hover:text-amber-200'
                      : 'border-white/[0.08] text-sigflo-muted hover:text-amber-200/90'
                  }`}
                  aria-label={isPairInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
                  {...ariaPressed(isPairInWatchlist)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path
                      d="M12 3l2.09 6.26H21l-5.45 3.96 2.09 6.26L12 15.77 6.36 19.48l2.09-6.26L3 9.26h6.91L12 3z"
                      fill={isPairInWatchlist ? 'currentColor' : 'none'}
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <div ref={tradeHeaderMoreRef} className="relative shrink-0">
                  <button
                    type="button"
                    id="trade-header-more-button"
                    {...ariaExpanded(tradeHeaderMoreOpen)}
                    aria-haspopup="menu"
                    aria-controls="trade-header-more-menu"
                    onClick={() => {
                      setTradePairMenuOpen(false);
                      setTradeHeaderMoreOpen((o) => !o);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] text-sigflo-muted transition hover:text-white"
                    aria-label="More actions"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <circle cx="5" cy="12" r="1.5" fill="currentColor" />
                      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                      <circle cx="19" cy="12" r="1.5" fill="currentColor" />
                    </svg>
                  </button>
                  {tradeHeaderMoreOpen ? (
                    <div
                      id="trade-header-more-menu"
                      role="menu"
                      aria-labelledby="trade-header-more-button"
                      className="absolute right-0 top-[calc(100%+4px)] z-[60] min-w-[12.5rem] overflow-hidden rounded-xl border border-white/[0.12] bg-[#0a0a0a] py-1 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.85)] ring-1 ring-white/[0.06]"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        className="flex w-full px-3 py-2.5 text-left text-sm font-semibold text-white transition hover:bg-white/[0.06] active:bg-white/[0.08]"
                        onClick={() => {
                          setTradeHeaderMoreOpen(false);
                          navigate('/markets');
                        }}
                      >
                        Markets
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="flex w-full px-3 py-2.5 text-left text-sm font-semibold text-white transition hover:bg-white/[0.06] active:bg-white/[0.08]"
                        onClick={() => {
                          setTradeHeaderMoreOpen(false);
                          navigate(getFeedRoute());
                        }}
                      >
                        Signals
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="flex w-full px-3 py-2.5 text-left text-sm font-semibold text-white transition hover:bg-white/[0.06] active:bg-white/[0.08]"
                        onClick={() => {
                          setTradeHeaderMoreOpen(false);
                          navigate('/bots');
                        }}
                      >
                        Bots
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="flex w-full px-3 py-2.5 text-left text-sm font-semibold text-white transition hover:bg-white/[0.06] active:bg-white/[0.08]"
                        onClick={() => {
                          setTradeHeaderMoreOpen(false);
                          navigate('/portfolio');
                        }}
                      >
                        Portfolio
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="flex w-full px-3 py-2.5 text-left text-sm font-semibold text-white transition hover:bg-white/[0.06] active:bg-white/[0.08]"
                        onClick={() => {
                          setTradeHeaderMoreOpen(false);
                          navigate('/profile');
                        }}
                      >
                        Profile
                      </button>
                      <div className="my-1 h-px bg-white/[0.08]" />
                      <button
                        type="button"
                        role="menuitem"
                        className="flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left text-sm font-semibold text-white transition hover:bg-white/[0.06] active:bg-white/[0.08]"
                        onClick={() => {
                          setTradeHeaderMoreOpen(false);
                          void onBiasAlertsControl();
                        }}
                      >
                        <span>
                          {!appAnnouncementsEnabled
                            ? 'Turn all alerts on'
                            : biasNotifyPermission === 'unsupported'
                              ? 'Turn all alerts off (in-app only)'
                              : biasNotifyPermission === 'denied'
                                ? 'Turn all alerts off (browser blocked OS)'
                                : biasNotifyPermission === 'granted'
                                  ? 'Turn all alerts off'
                                  : 'Enable browser notifications…'}
                        </span>
                        {appAnnouncementsEnabled && biasNotifyPermission === 'default' ? (
                          <span className="text-[10px] font-medium leading-snug text-sigflo-muted">
                            Chart pair only (tab) · off = no banners, haptics, or OS pings
                          </span>
                        ) : appAnnouncementsEnabled && biasNotifyPermission === 'granted' ? (
                          <span className="text-[10px] font-medium leading-snug text-sigflo-muted">
                            Tap to silence everything from Sigflo
                          </span>
                        ) : null}
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="flex w-full px-3 py-2.5 text-left text-sm font-semibold text-white transition hover:bg-white/[0.06] active:bg-white/[0.08]"
                        onClick={() => {
                          setTradeHeaderMoreOpen(false);
                          void copyTradeLink().then((ok) => flashTradeToast(ok ? 'Link copied' : 'Could not copy link'));
                        }}
                      >
                        Copy trade link
                      </button>
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </header>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {isManageMode ? (
          <div className="shrink-0 border-b border-emerald-400/40 bg-landing-bg pt-2 shadow-[0_8px_28px_-8px_rgba(0,0,0,0.45)]">
            <div className="mx-auto w-full min-w-0 max-w-lg px-1.5">
              {/* Manage chart: boolean setupMode + live preset so PriceChartCard syncs overlays (undefined = uncontrolled, levels stuck off). */}
              <TradeChartPanel
                collapsed={false}
                plotExpandedPx={manageChartMaximized ? TRADE_CHART_PLOT_MANAGE_MAXIMIZED_PX : TRADE_CHART_PLOT_EXPANDED_PX}
                timeScaleMaxBarSpacingPx={CHART_TIMESCALE_MAX_BAR_SPACING_PX}
                model={chartModelForPlot}
                market={market}
                intervalLabel={intervalLabel}
                loadingInterval={live.loadingInterval}
                liveUpdatedAt={live.lastUpdateTs}
                change24hPct={mergedModel.change24hPct}
                timeframeOptions={TRADE_CHART_INTERVAL_OPTIONS}
                chartInterval={chartInterval}
                onChartIntervalChange={(v) => {
                  setChartInterval(v);
                  secureStorage.setItem(TRADE_CHART_INTERVAL_STORAGE_KEY, v);
                  window.dispatchEvent(new CustomEvent(SIGFLO_CHART_INTERVAL_EVENT, { detail: v }));
                }}
                exchangeStyleHero={false}
                heroPairLabel={mergedModel.pair}
                metaCaption={
                  exitAuto.mode === 'manual'
                    ? 'PERP · Static SL/TP'
                    : 'PERP · AI exit · dynamic trim when guided'
                }
                setupMode
                onSetupModeToggle={undefined}
                onRequestSetupMode={undefined}
                tradeTimingState={undefined}
                liveTradeMode
                suppressExchangeHeroLivePrice
                liveActivePositionTitle="Live position"
                liveTradeOverlayPreset
                auxiliaryPriceLines={manageAiChartAux}
                liveHeaderMetrics={manageDockChartHeaderMetrics}
                liveTradeRefitKey={
                  manageCtx
                    ? `${mergedModel.pair}|manage|${manageCtx.entryPrice}|${manageCtx.side}|${chartInterval}`
                    : undefined
                }
                chartProximity={manageChartProximity}
                pnlHeaderLabel={chartPnlHeader.label}
                pnlHeaderTone={chartPnlHeader.tone}
                chartInnerChromeToggle={{
                  expanded: manageChartMaximized,
                  onToggle: () => setManageChartMaximized((v) => !v),
                  variant: 'immersive',
                }}
                onSetupFocusBanner={onSetupFocusBannerCb}
                className="pb-2"
              />
            </div>
          </div>
        ) : null}
        <div
          ref={tradeScrollRef}
          className={`trade-scroll flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain ${
            hasActiveTradePosition ? 'gap-0' : 'gap-1'
          }`}
        >
        <div
          className={`mx-auto flex w-full max-w-lg flex-col px-3 pb-0 ${hasActiveTradePosition ? 'gap-0 pt-1.5' : 'gap-1 pt-2'}`}
        >
          <div className="flex flex-col gap-1">
            {!isManageMode && !isBotsReviewCockpit ? <MarketToggle value={market} onChange={setMarket} /> : null}
            {paperModeActive ? (
              <div className="rounded-lg border border-violet-400/25 bg-violet-500/[0.08] px-2.5 py-1.5 text-[10px] font-semibold tracking-wide text-violet-100">
                Paper Trading Mode · Simulated Portfolio
              </div>
            ) : null}
            {!isManageMode && hideFreshSetupTradeHint && hasActiveTradePosition ? (
              <p className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 text-[9px] leading-snug text-zinc-400">
                Review position · Managing exits · Suggestion only · Live changes require confirmation
              </p>
            ) : null}
            {showTradeGuide && !isManageMode && !hideFreshSetupTradeHint ? (
              <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/[0.06] px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] font-semibold text-cyan-100">How to review a setup</p>
                  <button
                    type="button"
                    onClick={() => { dismissFirstTradeGuide(); setShowTradeGuide(false); }}
                    className="text-[10px] text-zinc-500 hover:text-zinc-300"
                    aria-label="Dismiss trade guide"
                  >
                    Dismiss
                  </button>
                </div>
                <div className="mt-2 space-y-1.5">
                  <p className="text-[11px] leading-relaxed text-zinc-300">
                    <span className="text-cyan-200/80">1.</span> Review the signal thesis and score in the cards below.
                  </p>
                  <p className="text-[11px] leading-relaxed text-zinc-300">
                    <span className="text-cyan-200/80">2.</span> The chart shows price action — set your entry, stop, and target on the plan.
                  </p>
                  <p className="text-[11px] leading-relaxed text-zinc-300">
                    <span className="text-cyan-200/80">3.</span> Use <span className="font-semibold text-white">Paper trade</span> to try a position without real funds.
                  </p>
                </div>
              </div>
            ) : null}
            {!isManageMode ? (
              <ActivePositionsPanel
                market={market}
                exchangePosition={exchangePositionForSymbol}
                exchangeSpotDisplay={exchangeSpotPanelModel}
                displayPair={mergedModel.pair}
                leverageFallback={leverage}
                markPrice={
                  hasActiveTradePosition && Number.isFinite(throttledOpenPnl.mark) && throttledOpenPnl.mark > 0
                    ? throttledOpenPnl.mark
                    : Number.isFinite(mergedModel.lastPrice) && mergedModel.lastPrice > 0
                      ? mergedModel.lastPrice
                      : exchangePositionForSymbol?.entryPrice ?? exchangeSpotPanelModel?.entryPrice ?? 0
                }
                onRequestCloseAllModal={onRequestActiveCloseAllModal}
                onOpenManagePosition={
                  market === 'futures' && exchangePositionForSymbol ? openManagePositionView : undefined
                }
                exitAiModeLabel={exitAiModeLabel}
                exitStrategyLabel={exitStrategyLabel}
                scenarioSummary={scenarioSummaryLine}
                sigfloManagedLayer={sigfloManagedLayer}
                liveMarkForLayer={
                  hasActiveTradePosition && Number.isFinite(throttledOpenPnl.mark) && throttledOpenPnl.mark > 0
                    ? throttledOpenPnl.mark
                    : null
                }
                onSuggestStopMove={onExitAutomationSuggestStopMove}
                onSuggestPartialTp={onExitAutomationSuggestPartialTp}
                onDisableAutomation={onExitAutomationDisable}
              />
            ) : null}
            {!isManageMode && !isBotsReviewCockpit && !hideFreshSetupTradeHint ? <TradingControlTradeHint /> : null}
            {!isManageMode && isBotsReviewCockpit && botsReviewCockpitModel ? (
              <div className="space-y-3 pb-1">
                <DailyRiskGuardBanner model={dailyRiskGuard} />
                <p className="text-[10px] leading-snug text-zinc-500">
                  Engine review output for decision support. Not live exchange data. Outcomes are not guaranteed.
                </p>
                <TradeReviewHeader
                  pair={botsReviewCockpitModel.pair}
                  direction={botsReviewCockpitModel.direction}
                  setupType={botsReviewCockpitModel.setupType}
                  score={botsReviewCockpitModel.score}
                  state={botsReviewCockpitModel.state}
                  sourceEngine={botsReviewCockpitModel.sourceEngine}
                />
                {botsEnginePlanLevels ? (
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[10px] leading-snug text-zinc-500">
                        {dailyReviewLocked
                          ? 'Plan levels are read-only while the daily risk guard is active.'
                          : 'Drag stop or targets to adjust your plan'}
                      </p>
                      {botsPlanDirty && !dailyReviewLocked ? (
                        <button
                          type="button"
                          onClick={resetBotsPlanToEngine}
                          className="shrink-0 rounded-md border border-white/12 bg-white/[0.04] px-2 py-1 text-[10px] font-medium text-zinc-300 transition hover:border-[#00ffc8]/30 hover:text-zinc-100"
                        >
                          Reset to engine plan
                        </button>
                      ) : null}
                    </div>
                    <TradeMiniChart
                      pair={botsEnginePlanLevels.pair}
                      direction={botsEnginePlanLevels.direction}
                      entryPrice={botsEnginePlanLevels.entryPrice}
                      stopPrice={botsPlannedStop ?? botsEnginePlanLevels.stopPrice}
                      targets={botsPlannedTargets ?? botsEnginePlanLevels.targets}
                      interactiveLevels={!dailyReviewLocked}
                      onPlannedStopChange={setBotsPlannedStop}
                      onPlannedTargetsChange={setBotsPlannedTargets}
                      onLevelsDragEnd={bumpBotsPaperPreviewPulse}
                      planGeometryWarning={Boolean(botsPaperPreviewModel && !botsPaperPreviewModel.previewEnabled)}
                      liquidationPrice={
                        market === 'futures' &&
                        Number.isFinite(metrics.liquidation) &&
                        metrics.liquidation > 0
                          ? metrics.liquidation
                          : undefined
                      }
                    />
                  </div>
                ) : null}
                {proIntelligenceMode ? <EarlyRegimeWarningPanel model={regimeWarningModel} /> : null}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-sm">
                  <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Market context</h2>
                  <p className="mt-1 text-[11px] leading-snug text-zinc-500">Spot / Perps / Paper</p>
                  <div className="mt-2">
                    <MarketToggle value={market} onChange={setMarket} disabled={dailyReviewLocked} />
                  </div>
                </div>
                {botsReviewContext?.opportunityId && botsTradeOppLoading ? (
                  <div className="space-y-2" aria-busy="true" aria-label="Loading review">
                    <p className="text-xs text-zinc-500">Loading setup context…</p>
                    <div className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />
                    <div className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />
                  </div>
                ) : (
                  <>
                    <SetupThesisCard
                      thesis={botsReviewCockpitModel.thesis}
                      rationale={botsReviewCockpitModel.rationale}
                      timeframeAlignment={botsReviewCockpitModel.timeframeAlignment}
                    />
                    <EntryPlanCard
                      direction={botsReviewCockpitModel.direction}
                      entryZone={botsReviewCockpitModel.entryZone}
                      invalidation={botsReviewCockpitModel.invalidation}
                      targets={botsReviewCockpitModel.targets}
                    />
                    <RiskReviewCard
                      score={botsReviewCockpitModel.score}
                      riskLabel={botsReviewCockpitModel.riskLabel}
                      state={botsReviewCockpitModel.state}
                      userRiskMode={riskSettings.riskMode}
                      maxRiskPerTradePct={riskSettings.maxRiskPerTradePct}
                      maxOpenPositions={riskSettings.maxOpenPositions}
                      allowLiveExecution={riskSettings.allowLiveExecution}
                      reviewOnlyFromBotsPath={liveExecutionLocked}
                      requireConfirmation={riskSettings.requireConfirmation}
                      monitoredOpenCount={riskMonitoredOpenCount}
                    />
                    {hasActiveTradePosition ? (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-sm">
                        <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Exit automation</h2>
                        <p className="mt-1 text-xs font-medium text-zinc-300">Manage active position</p>
                        <p className="mt-2 text-[11px] leading-snug text-zinc-500">
                          Shown only while this pair has an open position on your account. Entry from this Bots review
                          stays locked; these controls adjust how Sigflo can assist with the position you already hold.
                        </p>
                        <ul className="mt-2 space-y-1 text-[11px] text-zinc-500">
                          <li className="flex gap-2">
                            <span className="text-[#00ffc8]/80" aria-hidden>
                              ·
                            </span>
                            <span>Suggest stop move</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="text-[#00ffc8]/80" aria-hidden>
                              ·
                            </span>
                            <span>Suggest partial take-profit</span>
                          </li>
                        </ul>
                        <div className="mt-3">
                          <ExitModePanel live={Boolean(hasActiveTradePosition)} showLiveBanner={false}>
                            <ExitAutomationControls
                              mode={exitAuto.mode}
                              onModeChange={exitAuto.setMode}
                              strategy={exitAuto.strategy}
                              onStrategyChange={exitAuto.setStrategy}
                              safeguards={exitAuto.safeguards}
                              onSafeguardsChange={exitAuto.setSafeguards}
                              customStrategyThresholds={exitAuto.customStrategyThresholds}
                              onCustomStrategyThresholdsMerge={exitAuto.mergeCustomStrategyThresholds}
                              onResetCustomStrategyThresholds={exitAuto.resetCustomStrategyThresholds}
                              activity={exitAuto.activity}
                              onClearActivity={exitAuto.clearActivity}
                              compactActivity
                              hasOpenPosition={hasActiveTradePosition}
                              exitFlowState={exitFlow?.effective.state ?? null}
                              exitFlowNextPlanned={exitFlow?.nextPlanned ?? null}
                            />
                            {serverExitEligible ? (
                              <div className="mt-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2.5">
                                <label className="flex cursor-pointer items-start gap-2.5">
                                  <input
                                    type="checkbox"
                                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-black/40 text-cyan-500 focus:ring-cyan-500/30"
                                    checked={serverExitOvernightEnabled}
                                    disabled={!serverExitOvernightHydrated}
                                    onChange={(e) => {
                                      const on = e.target.checked;
                                      if (!on && exchangePositionForSymbol) {
                                        void deleteExitAutomationWatch({
                                          symbol: orderSymbol,
                                          side: exchangePositionForSymbol.side,
                                          positionIdx: exchangePositionForSymbol.positionIdx ?? 0,
                                        }).catch((e) => { console.error("[Caught Promise Error]", e); });
                                      }
                                      setServerExitOvernightEnabled(on);
                                    }}
                                  />
                                  <span className="text-[11px] leading-snug text-sigflo-muted">
                                    <span className="font-semibold text-sigflo-text/90">Server overnight automation</span>
                                    {' — '}
                                    Runs Exit AI Auto on the Sigflo API while this device is off or asleep. Requires a
                                    hosted backend with Postgres, migration 002, and env{' '}
                                    <span className="font-mono text-[10px] text-cyan-200/85">
                                      EXIT_AUTOMATION_WORKER_ENABLED=true
                                    </span>
                                    . If you keep this trade tab open with Auto on, leave this off to avoid duplicate
                                    orders.
                                  </span>
                                </label>
                              </div>
                            ) : null}
                          </ExitModePanel>
                          <TradingControlExitBridge />
                        </div>
                      </div>
                    ) : null}
                    <ExecutionLockCard
                      state={botsReviewCockpitModel.state}
                      source="bots"
                      onPaperPreview={scrollToPaperPreviewSection}
                      allowLiveExecution={riskSettings.allowLiveExecution}
                      reviewOnlyFromBotsPath={liveExecutionLocked}
                      requireConfirmation={riskSettings.requireConfirmation}
                      paperModeDefault={riskSettings.paperModeDefault}
                      maxOpenPositionsReached={maxOpenPositionsReached}
                    />
                    {botsPaperPreviewModel ? (
                      <div ref={paperPreviewRef} id="sigflo-paper-trade-preview">
                        <PaperTradePreview
                          key={botsReviewContext?.opportunityId ?? 'paper-preview'}
                          entryPrice={botsPaperPreviewModel.entryPrice}
                          stopPrice={botsPaperPreviewModel.stopPrice}
                          targets={botsPaperPreviewModel.targets}
                          direction={botsPaperPreviewModel.direction}
                          previewEnabled={botsPaperPreviewModel.previewEnabled}
                          previewDisabledReason={botsPaperPreviewModel.previewDisabledReason}
                          highlightPulseToken={botsPaperPulseToken}
                          maxRiskPerTradePct={riskSettings.maxRiskPerTradePct}
                          onInteraction={onPaperPreviewInteraction}
                        />
                      </div>
                    ) : null}
                    {isBotsReviewCockpit && botsPaperPreviewModel && paperRealAccountNudgeVisible ? (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 backdrop-blur-sm">
                        <p className="text-sm font-medium text-zinc-200">Ready to try this on your real account?</p>
                        <p className="mt-1 text-[11px] leading-snug text-zinc-500">
                          Linking is optional. You can keep using paper-style review until you are ready.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              dismissPaperRealAccountNudge();
                              const returnTo = `${location.pathname}${location.search}`;
                              navigate(`/settings/exchange?returnTo=${encodeURIComponent(returnTo)}`);
                            }}
                            className="rounded-lg border border-[#00ffc8]/35 bg-[#00ffc8]/10 px-3 py-2 text-xs font-semibold text-[#00ffc8] transition hover:bg-[#00ffc8]/15"
                          >
                            Connect exchange
                          </button>
                          <button
                            type="button"
                            onClick={dismissPaperRealAccountNudge}
                            className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-zinc-400 transition hover:bg-white/[0.04]"
                          >
                            Not now
                          </button>
                        </div>
                      </div>
                    ) : null}
                    <TradeReasoningTimeline items={botsReviewCockpitModel.timelineItems} />
                  </>
                )}
              </div>
            ) : null}
            {!isManageMode && !isBotsReviewCockpit && proIntelligenceMode ? <EarlyRegimeWarningPanel model={regimeWarningModel} /> : null}
            {!isManageMode && !isBotsReviewCockpit ? (
              <ScannerInsightCard
                signal={selectedSignal}
                status={scannerStatus}
                tradeScore={metrics.riskSummary.tradeScore}
                groundedContext={tradeAiScannerGroundedContext}
                hasOpenPosition={hasActiveTradePosition}
                executionQuality={executionQuality}
              />
            ) : null}
            {!isManageMode && !isBotsReviewCockpit && proIntelligenceMode ? (
              <WhyThisTradePanel model={whyThisTradeModel} />
            ) : null}
            {!isManageMode && !isBotsReviewCockpit ? (
              <TradeChartScenarioStrip
                mode="trade"
                side={primaryChartOpenPosition?.side ?? side}
                estimatedPnlUsd={portfolioAlignedLiveUnrealized.pnlUsd}
                estimatedPnlPct={portfolioAlignedLiveUnrealized.movePct}
                targetProfitUsd={metrics.targetProfitUsd}
                stopLossUsd={metrics.stopLossUsd}
                riskReward={mergedModel.riskReward}
                probUp={scenarioProb.probUp}
                probDown={scenarioProb.probDown}
                marginUsd={primaryChartOpenPosition?.marginUsd ?? metrics.amountUsedUsd}
                estFeeUsd={estFeeUsd}
                liqPrice={
                  market === 'futures'
                    ? (primaryChartOpenPosition?.liquidationPrice ?? metrics.liquidation)
                    : null
                }
                entry={primaryChartOpenPosition?.entryPrice ?? modelForMetrics.entry}
                stop={modelForMetrics.stop}
                target={modelForMetrics.target}
                positionSizeUsd={primaryChartOpenPosition?.positionNotionalUsd ?? metrics.positionSizeUsd}
                leverage={primaryChartOpenPosition?.leverage ?? leverage}
                isFutures={market === 'futures'}
                tradeScore={metrics.riskSummary.tradeScore}
                setupScore={selectedSignal.setupScore}
                trendAlignment={selectedSignal.scoreBreakdown.trendAlignment}
                momentumQuality={selectedSignal.scoreBreakdown.momentumQuality}
                exitAiMode={exitAuto.mode}
                exitStrategyPreset={exitAuto.strategy}
                automationSafeguards={exitAuto.safeguards}
                customStrategyThresholds={exitAuto.customStrategyThresholds}
                scannerStatus={scannerStatus}
                lastPrice={
                  typeof mergedModel.lastPrice === 'number' && Number.isFinite(mergedModel.lastPrice)
                    ? mergedModel.lastPrice
                    : modelForMetrics.entry
                }
                hasOpenPosition={hasActiveTradePosition}
                executionQuality={executionQuality}
              />
            ) : null}
          </div>
          {isManageMode && managePnlDisplay && manageCtx && hasManageOpenExposure ? (
            <ManagePositionControlPanel
              manageCtx={manageCtx}
              pnlUsd={managePnlDisplay.pnlUsd}
              pnlPct={managePnlDisplay.pnlPct}
              mark={typeof markForManage === 'number' && Number.isFinite(markForManage) ? markForManage : mergedModel.entry}
              leverageLabel={market === 'futures' ? `${manageLeverageForUi ?? leverage}×` : '1× spot'}
              isFutures={market === 'futures'}
              exchangeLegSide={market === 'futures' ? exchangePositionForSymbol?.side ?? null : null}
              health={managePositionHealth}
              positionBias={managePositionBiasStat}
              exitAiModel={manageExitAiCoPilot}
              exitMode={exitAuto.mode}
              onExitModeChange={exitAuto.setMode}
              onCloseFull={onActiveCloseAllConfirm}
              onPartialOpen={() => setManagePartialSheetOpen(true)}
              onMoveStopBreakeven={() => void moveStopToBreakeven()}
              onTightenStop={() => void tightenStopManage()}
              onAddToPosition={() => void onAddToPosition()}
              onReversePosition={market === 'futures' ? onReverseOrder : undefined}
              onAdjustRisk={
                adjustRiskSnapshot ? () => setAdjustRiskOpen(true) : undefined
              }
              onViewSetupOnChart={focusTradeSetupOnChart}
              timeline={manageTimelineLines}
              actionsDisabled={!!orderPending}
              canMoveStops={Boolean(useRealExecution && exchangePositionForSymbol)}
              triggeredPairCount={triggeredPairCount}
            />
          ) : null}
          <div className="flex flex-col gap-1">
            {showAssistedExitConfirmBar && exitFlow ? (
              <AssistedExitConfirmBar
                headline={exitFlow.effective.headline}
                detail={exitFlow.effective.action}
                onConfirm={() => {
                  if (orderPending) {
                    flashTradeToast('Wait for the in-flight order to finish, then try again.');
                    return;
                  }
                  const st = exitFlow.effective.state;
                  setAssistedExitAcknowledged(true);
                  setAssistedExitBarForceHidden(false);
                  if (st === 'trim') {
                    exitAuto.pushActivity({
                      kind: 'assisted_ready',
                      message: `Assisted trim ~50% near $${formatQuoteNumber(exitFlow.lastPrice)} — submitting…`,
                    });
                    onActivePartialClose(0.5);
                    return;
                  }
                  if (st === 'exit') {
                    exitAuto.pushActivity({
                      kind: 'assisted_ready',
                      message: `Assisted full exit near $${formatQuoteNumber(exitFlow.lastPrice)} — submitting…`,
                    });
                    onActiveCloseAllConfirm();
                  }
                }}
                onDismiss={() => {
                  setAssistedExitAcknowledged(false);
                  setAssistedExitBarForceHidden(false);
                  exitAuto.pushActivity({
                    kind: 'mode_change',
                    message: 'Switched to Manual — dismissed prepared exit prompt',
                  });
                  exitAuto.setMode('manual');
                }}
              />
            ) : null}
            {!isBotsReviewCockpit ? (
              <>
                <ExitModePanel live={Boolean(hasActiveTradePosition) || isManageMode}>
                  <ExitAutomationControls
                    mode={exitAuto.mode}
                    onModeChange={exitAuto.setMode}
                    strategy={exitAuto.strategy}
                    onStrategyChange={exitAuto.setStrategy}
                    safeguards={exitAuto.safeguards}
                    onSafeguardsChange={exitAuto.setSafeguards}
                    customStrategyThresholds={exitAuto.customStrategyThresholds}
                    onCustomStrategyThresholdsMerge={exitAuto.mergeCustomStrategyThresholds}
                    onResetCustomStrategyThresholds={exitAuto.resetCustomStrategyThresholds}
                    activity={exitAuto.activity}
                    onClearActivity={exitAuto.clearActivity}
                    compactActivity={!isManageMode}
                    hasOpenPosition={hasActiveTradePosition || isManageMode}
                    exitFlowState={exitFlow?.effective.state ?? null}
                    exitFlowNextPlanned={exitFlow?.nextPlanned ?? null}
                  />
                  {serverExitEligible ? (
                    <div className="mt-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2.5">
                      <label className="flex cursor-pointer items-start gap-2.5">
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-black/40 text-cyan-500 focus:ring-cyan-500/30"
                          checked={serverExitOvernightEnabled}
                          disabled={!serverExitOvernightHydrated}
                          onChange={(e) => {
                            const on = e.target.checked;
                            if (!on && exchangePositionForSymbol) {
                              void deleteExitAutomationWatch({
                                symbol: orderSymbol,
                                side: exchangePositionForSymbol.side,
                                positionIdx: exchangePositionForSymbol.positionIdx ?? 0,
                              }).catch((e) => { console.error("[Caught Promise Error]", e); });
                            }
                            setServerExitOvernightEnabled(on);
                          }}
                        />
                        <span className="text-[11px] leading-snug text-sigflo-muted">
                          <span className="font-semibold text-sigflo-text/90">Server overnight automation</span>
                          {' — '}
                          Runs Exit AI Auto on the Sigflo API while this device is off or asleep. Requires a hosted
                          backend with Postgres, migration 002, and env{' '}
                          <span className="font-mono text-[10px] text-cyan-200/85">EXIT_AUTOMATION_WORKER_ENABLED=true</span>.
                          If you keep this trade tab open with Auto on, leave this off to avoid duplicate orders.
                        </span>
                      </label>
                    </div>
                  ) : null}
                </ExitModePanel>
                <TradingControlExitBridge />
              </>
            ) : null}
          </div>
        </div>

        {!isBotsReviewCockpit ? (
        <TradeControls
          manageDataInvalid={manageDataInvalid}
          ticketIntent={ticketIntent}
          market={market}
          quoteMarkPrice={market === 'futures' ? live.markPrice : undefined}
          quoteIndexPrice={market === 'futures' ? live.indexPrice : undefined}
          futuresTpSlTriggerBy={futuresTpSlTriggerBy}
          onFuturesTpSlTriggerByChange={setFuturesTpSlTriggerBy}
          slTpPercentEntryAnchor={slTpPercentEntryAnchor}
          mergedModel={mergedModel}
          isManageMode={isManageMode}
          manageCtx={manageCtx}
          managePnlDisplay={managePnlDisplay}
          markForManage={markForManage}
          manageInsightLine={manageInsightLine}
          amountUsd={amountUsd}
          leverage={leverage}
          managePositionLeverage={isManageMode ? manageLeverageForUi : undefined}
          maxLeverage={market === 'futures' ? futuresLevCap : null}
          side={side}
          stopStr={stopStr}
          targetStr={targetStr}
          onAmountChange={onAmountUsdChange}
          onLeverageChange={onLeverageChange}
          onStopStrChange={onStopStrForTrade}
          onTargetStrChange={onTargetStrForTrade}
          metrics={metrics}
          estFeeUsd={estFeeUsd}
          balanceLabel={
            forcePaperMode || !tradeBalance
              ? 'Simulated Cash (Paper)'
              : tradeBalance?.exchange === 'mexc'
                ? 'Available (USDT)'
                : tradeBalance?.availableToTrade != null
                  ? 'Available (UTA)'
                  : tradeBalance?.totalWalletBalance != null
                    ? 'UTA wallet balance'
                    : 'Wallet Balance'
          }
          balanceHelper={tradeBalanceHelper}
          displayBalanceUsd={displayBalanceUsd}
          fundingBalanceUsd={tradeBalance?.fundingWalletBalance}
          fundingBalanceAsset={tradeBalance?.fundingPrimaryAsset}
          minOrderUsd={minOrderUsd}
          orderSymbol={orderSymbol}
          utaMarginInUseUsd={tradeBalance?.marginInUseUsd}
          utaEquityUsd={tradeBalance?.totalEquity}
          utaUnrealizedPnlUsd={tradeBalance?.utaUnrealizedPnl}
          utaWalletBalanceUsd={tradeBalance?.totalWalletBalance}
          assetTransferHref={assetTransferHref}
          onClosePosition={onClosePosition}
          onAddToPosition={onAddToPosition}
          manageFuturesTpSl={
            isManageMode && market === 'futures'
              ? {
                  canApply: Boolean(useRealExecution && activeExchange !== 'mexc' && exchangePositionForSymbol),
                  pending: orderPending === 'tpsl',
                  onApply: applyManageTradingStop,
                  canApplyAll: Boolean(
                    useRealExecution &&
                      activeExchange !== 'mexc' &&
                      exchangePositionForSymbol &&
                      (manageTpSlDirty || (manageOrderDraftDirty && amountUsd > 0)),
                  ),
                  onApplyAll: applyManageAllChanges,
                  hasPendingChanges: manageTpSlDirty || (manageOrderDraftDirty && amountUsd > 0),
                }
              : null
          }
          suppressLegacyManageHero={isManageMode && Boolean(managePnlDisplay && manageCtx)}
          onPartialPositionScaleOut={partialScaleOutEligible ? onPartialPositionScaleOut : undefined}
          partialPositionScaleOutBusy={!!orderPending}
        />
        ) : null}
      </div>
      </div>

      {!isManageMode ? (
      <div
        className={`sticky bottom-0 z-30 shrink-0 bg-black/[0.92] backdrop-blur-xl ${
          hasActiveTradePosition
            ? 'border-t border-[#00ffc8]/20 shadow-[0_-20px_56px_-24px_rgba(0,255,200,0.14)]'
            : 'border-t border-white/10'
        }`}
      >
        <div>
          <LiveMarketStrip
            symbol={mergedModel.pair}
            lastPrice={Number.isFinite(mergedModel.lastPrice) ? mergedModel.lastPrice : null}
            movePct={mergedModel.change24hPct ?? null}
            moveLabel="24h"
            statusLabel={hasActiveTradePosition ? 'Live' : undefined}
            pulse={hasActiveTradePosition}
            tickerItems={liveMarketTickerItems}
          />
          <div className="mx-auto w-full max-w-lg border-b border-[#00ffc8]/24 bg-gradient-to-b from-black/55 to-black/[0.38] backdrop-blur-sm">
              <div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-[4.8px] px-[7px] py-[3px] sm:gap-x-[7px] sm:px-[10px]">
                <div className="min-w-0 justify-self-start" />
                <div className="flex min-w-0 w-full justify-self-stretch justify-start pl-0.5 sm:pl-1">
                  {hasActiveTradePosition && isExchangeBackedOpenLeg ? (
                    <div className="flex w-full min-w-0 flex-col gap-1">
                      <div className="flex w-full min-w-0 flex-col gap-0.5">
                        <DockManageAdjustButtons
                          disabled={!!orderPending}
                          onManagePosition={
                            market === 'futures' && exchangePositionForSymbol
                              ? openManagePositionView
                              : undefined
                          }
                          onReverseOrder={market === 'futures' ? onReverseOrder : undefined}
                          onAdjustRisk={
                            adjustRiskSnapshot ? () => setAdjustRiskOpen(true) : undefined
                          }
                        />
                        <ChartDockCloseRow
                          disabled={!!orderPending}
                          partialClosePct={dockPartialPct}
                          onClosePosition={() => onActivePartialClose(dockPartialPct / 100)}
                          onCloseAll={() => setCloseAllModalOpen(true)}
                        />
                      </div>
                    </div>
                  ) : hasActiveTradePosition && !isExchangeBackedOpenLeg ? (
                    <div className="flex w-full min-w-0 flex-col gap-1 py-0.5">
                      <p className="text-[10px] leading-snug text-zinc-500">
                        Demo active position — use Exit automation above for suggestions. Suggestion only · Live
                        changes require confirmation.
                      </p>
                    </div>
                  ) : isBotsReviewCockpit && botsReviewCockpitModel ? (
                    <div className="flex w-full min-w-0 flex-col gap-1.5 py-0.5">
                      <p className="text-[10px] leading-snug text-zinc-500">
                        {dailyReviewLocked
                          ? 'Daily risk guard is on — new entries are paused; paper preview and your chart stay available.'
                          : 'Review-only from Bots. No live entry — use the chart for context or open paper preview.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          scrollToPaperPreviewSection();
                        }}
                        className="w-full rounded-lg border border-[#00ffc8]/30 bg-[#00ffc8]/10 py-2 text-xs font-semibold text-[#00ffc8] transition hover:bg-[#00ffc8]/14"
                      >
                        Paper trade preview
                      </button>
                    </div>
                  ) : (
                    <DockSplitEntryButtons
                      market={market}
                      canExecute={canExecute && !orderPending}
                      flashSide={execFlash}
                      onOpenShort={() => void executeTrade('short')}
                      onOpenLong={() => void executeTrade('long')}
                      signalBias={selectedSignal.side === 'short' ? 'short' : 'long'}
                    />
                  )}
                </div>
                <button
                  type="button"
                  onClick={toggleChartDock}
                  className={`justify-self-end flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[7px] transition hover:bg-white/[0.06] active:bg-white/[0.08] ${
                    chartDockChevronIdle
                      ? 'text-sigflo-muted hover:text-white'
                      : 'sigflo-chart-dock-chevron-btn hover:text-cyan-100'
                  }`}
                  {...ariaExpanded(chartDockOpen)}
                  aria-label={chartDockOpen ? 'Collapse chart' : 'Expand chart'}
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    className={`text-current transition-transform duration-200 ${chartDockOpen ? 'rotate-180' : ''}`}
                    aria-hidden
                  >
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              <div className="flex items-start justify-between gap-2 px-[10px] pb-1 pt-0.5">
                <div
                  className={`flex min-w-0 flex-wrap items-center transition-[gap] duration-200 ease-out ${
                    chartDockTimingLayout.bulky ? 'gap-1' : 'gap-1.5'
                  }`}
                >
                  <button
                    type="button"
                    onClick={toggleChartDock}
                    className="max-w-full truncate rounded py-[2px] pr-[6px] text-left transition hover:bg-white/[0.03] active:bg-white/[0.05]"
                    {...ariaExpanded(chartDockOpen)}
                    aria-label={
                      chartDockOpen
                        ? `Collapse chart (${intervalLabel})`
                        : `Expand chart (${intervalLabel})`
                    }
                  >
                    <span className="whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.12em] text-sigflo-muted">
                      Price Chart
                    </span>
                  </button>
                  {/* Perps + flat: % target / risk / R:R grid after “Price chart”. Spot omits (no margin-style risk %). */}
                  {!hasActiveTradePosition && market === 'futures' ? (
                    <>
                      <div className="h-7 w-px shrink-0 self-center bg-white/[0.1]" aria-hidden />
                      <div
                        className={`shrink-0 origin-left transition-transform duration-200 ease-out ${
                          chartDockTimingLayout.bulky ? 'scale-[0.92]' : 'scale-100'
                        }`}
                      >
                        <TradeStats
                          variant="strip"
                          compact
                          layout="dockGrid"
                          riskPercent={tradeDockStats.riskPercent}
                          rewardPercent={tradeDockStats.rewardPercent}
                          rrRatio={tradeDockStats.rrRatio}
                        />
                      </div>
                    </>
                  ) : null}
                  <span className="flex min-w-0 shrink-0 flex-col items-start gap-0.5">
                    <StatusChip label={dockTimingChip.label} state={dockTimingChip.state} compact />
                    {dockTimingChip.helperText ? (
                      <span className="max-w-[9rem] text-[7px] font-medium leading-tight text-sigflo-muted/90">
                        {dockTimingChip.helperText}
                      </span>
                    ) : null}
                    {dockTimingChip.executionLabel ? (
                      <span
                        className="max-w-[9rem] text-[7px] font-semibold leading-tight text-cyan-200/85"
                        title={timingUi.executionHelperText ?? undefined}
                      >
                        {dockTimingChip.executionLabel}
                      </span>
                    ) : null}
                  </span>
                  <ChartDockTradeSetupPair
                    dockMeta={dockDecisionMeta}
                    compact
                    reserveSpaceForLongTiming={chartDockTimingLayout.bulky}
                  />
                </div>
                <div className="flex min-w-0 flex-1 items-center justify-end gap-1">
                  <div
                    className={`inline-flex min-h-[24px] w-full overflow-hidden rounded border border-white/[0.1] bg-white/[0.04] p-0.5 transition-[max-width] duration-200 ease-out ${chartDockTimingLayout.setupToggleMaxClass}`}
                    role="group"
                    aria-label="Chart overlay mode"
                  >
                    <button
                      type="button"
                      onClick={() => setSetupMode(false)}
                      className={`min-w-0 flex-1 rounded px-1.5 py-1 text-[7px] font-semibold uppercase tracking-[0.08em] transition ${
                        !setupMode
                          ? 'bg-white/[0.12] text-white'
                          : 'text-sigflo-muted hover:text-white'
                      }`}
                    >
                      Clean
                    </button>
                    <button
                      type="button"
                      onClick={() => setSetupMode(true)}
                      className={`min-w-0 flex-1 rounded px-1.5 py-1 text-[7px] font-semibold uppercase tracking-[0.08em] transition ${
                        setupMode
                          ? 'bg-cyan-500/18 text-cyan-100 ring-1 ring-cyan-400/25'
                          : 'text-sigflo-muted hover:text-cyan-100'
                      }`}
                    >
                      Setup
                    </button>
                  </div>
                  {hasActiveTradePosition ? (
                    <div
                      className={`shrink rounded border border-white/[0.06] bg-black/35 px-0.5 py-0.5 ring-1 ring-white/[0.02] transition-[min-width,max-width,flex-basis] duration-200 ease-out sm:px-1 ${chartDockTimingLayout.partialHeaderClass}`}
                    >
                    <button
                      type="button"
                      disabled={!!orderPending}
                      id="sigflo-dock-partial-toggle"
                      {...ariaExpanded(dockPartialOpen)}
                      aria-controls="sigflo-dock-partial-panel"
                      onClick={() => setDockPartialOpen((o) => !o)}
                      className="flex w-full items-center justify-between gap-1 rounded py-0.5 pl-0 pr-0.5 text-left leading-none transition hover:bg-white/[0.04] active:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent"
                    >
                      <span className="text-[6px] font-extrabold uppercase tracking-[0.12em] text-sigflo-muted">Partial</span>
                      <span className="flex shrink-0 items-center gap-0.5">
                        <span className="font-mono text-[9px] font-bold tabular-nums text-cyan-200/95">{dockPartialPct}%</span>
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          className={`text-sigflo-muted transition-transform duration-200 ${dockPartialOpen ? 'rotate-180' : ''}`}
                          aria-hidden
                        >
                          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </button>
                    <div
                      id="sigflo-dock-partial-panel"
                      role="region"
                      aria-labelledby="sigflo-dock-partial-toggle"
                      {...(dockPartialOpen ? {} : { hidden: true })}
                    >
                      {dockPartialOpen ? (
                        <>
                          <p id="sigflo-dock-partial-slider-hint" className="sr-only">
                            Choose what fraction of the position to close. This does not submit until you tap Close position.
                          </p>
                          <label className="mt-0.5 flex h-4 cursor-pointer items-center py-0">
                            <span className="sr-only">Percent of position to scale out</span>
                            <input
                              type="range"
                              min={5}
                              max={100}
                              step={5}
                              value={dockPartialPct}
                              disabled={!!orderPending}
                              onChange={(e) => setDockPartialPct(Number(e.target.value))}
                              className="sigflo-partial-slider sigflo-partial-slider--compact h-4 w-full min-w-0 cursor-pointer touch-manipulation disabled:cursor-not-allowed disabled:opacity-40"
                              aria-valuetext={`${dockPartialPct} percent`}
                              aria-describedby="sigflo-dock-partial-slider-hint"
                            />
                          </label>
                        </>
                      ) : null}
                    </div>
                  </div>
                  ) : null}
                </div>
              </div>
              {chartDockOpen ? (
                <TradeChartPanel
                  collapsed={false}
                  plotExpandedPx={chartDockMaximized ? TRADE_CHART_PLOT_MANAGE_MAXIMIZED_PX : TRADE_CHART_PLOT_EXPANDED_PX}
                  timeScaleMaxBarSpacingPx={CHART_TIMESCALE_MAX_BAR_SPACING_PX}
                  model={chartModelForPlot}
                  market={market}
                  intervalLabel={intervalLabel}
                  loadingInterval={live.loadingInterval}
                  liveUpdatedAt={live.lastUpdateTs}
                  change24hPct={mergedModel.change24hPct}
                  timeframeOptions={TRADE_CHART_INTERVAL_OPTIONS}
                  chartInterval={chartInterval}
                  onChartIntervalChange={(v) => {
                    setChartInterval(v);
                    secureStorage.setItem(TRADE_CHART_INTERVAL_STORAGE_KEY, v);
                    window.dispatchEvent(new CustomEvent(SIGFLO_CHART_INTERVAL_EVENT, { detail: v }));
                  }}
                  exchangeStyleHero
                  metaCaption={market === 'futures' ? 'PERP · Funding +0.010%' : 'Spot · No funding'}
                  setupMode={hasActiveTradePosition || setupMode}
                  onSetupModeToggle={!hasActiveTradePosition ? () => setSetupMode((v) => !v) : undefined}
                  onRequestSetupMode={() => setSetupMode(true)}
                  tradeTimingState={timingUi.overlayTimingState}
                  liveTradeMode={Boolean(chartDockOpen && hasActiveTradePosition)}
                  suppressExchangeHeroLivePrice
                  liveActivePositionTitle={hasActiveTradePosition ? 'Live position' : undefined}
                  liveTradeOverlayPreset={hasActiveTradePosition}
                  auxiliaryPriceLines={chartAuxiliaryLines}
                  liveHeaderMetrics={chartDockOpen ? dockChartHeaderMetrics : undefined}
                  liveTradeRefitKey={liveChartRefitKey}
                  chartProximity={chartProximity}
                  pnlHeaderLabel={chartPnlHeader.label}
                  pnlHeaderTone={chartPnlHeader.tone}
                  onSetupFocusBanner={onSetupFocusBannerCb}
                  draggablePlanLevels={
                    !isManageMode &&
                    !isBotsReviewCockpit &&
                    ((!hasActiveTradePosition && setupMode) || liveChartTpSlDragEligible)
                  }
                  onPlanStopChange={onDockChartPlanStopDrag}
                  onPlanTargetChange={onDockChartPlanTargetDrag}
                  onPlanStopDragEnd={liveChartTpSlDragEligible ? onDockChartLiveStopDragCommit : undefined}
                  onPlanTargetDragEnd={liveChartTpSlDragEligible ? onDockChartLiveTargetDragCommit : undefined}
                  chartInnerChromeToggle={{
                    expanded: chartDockMaximized,
                    onToggle: toggleChartDockMaximized,
                    variant: 'dock' as const,
                  }}
                  className="pb-2"
                />
              ) : null}

          </div>

        </div>
      </div>
      ) : (
        <div
          className="shrink-0 border-t border-white/[0.06] bg-[#050505] pb-[max(0.5rem,env(safe-area-inset-bottom))]"
          aria-hidden
        />
      )}

      {isManageMode ? (
        <ManagePartialCloseSheet
          open={managePartialSheetOpen}
          onClose={() => setManagePartialSheetOpen(false)}
          fraction={managePartialFraction}
          onFractionChange={setManagePartialFraction}
          onConfirm={(f) => {
            pendingManualPartialClosePctRef.current = f;
            exitAuto.pushActivity({
              kind: 'exit_state',
              message: `Manual partial close confirmed (${Math.round(f * 100)}%) — submitting…`,
            });
            setManagePartialSheetOpen(false);
            onActivePartialClose(f);
          }}
          disabled={!!orderPending}
          busy={!!orderPending}
        />
      ) : null}

      {!isManageMode ? (
        <GuidedExecutionPanel
          open={guidedExecutionOpen}
          setup={guidedExecutionSetup}
          previewOnly={isBotsReviewCockpit}
          onClose={() => setGuidedExecutionOpen(false)}
          onExecute={async () => {
            const ok = await executeTrade(guidedExecutionSide, { bypassGuidedExecution: true });
            if (!ok) {
              throw new Error('Order was not submitted.');
            }
            setGuidedExecutionOpen(false);
          }}
          onViewPosition={() => {
            if (market === 'futures' && exchangePositionForSymbol) {
              openManagePositionView();
              setGuidedExecutionOpen(false);
              return;
            }
            navigate('/portfolio');
            setGuidedExecutionOpen(false);
          }}
        />
      ) : null}

      <AdjustRiskSheet
        open={adjustRiskOpen}
        onClose={() => setAdjustRiskOpen(false)}
        tabBarInsetPx={88}
        snapshot={adjustRiskSnapshot}
        exitAuto={adjustRiskExitApi}
        onApplyExchangeStop={
          isManageMode && market === 'futures' && useRealExecution && exchangePositionForSymbol
            ? applyAdjustRiskExchangeStop
            : undefined
        }
        exchangeStopApplyDisabled={!!orderPending}
      />
    </div>
  );
}

/** Legacy `/trade?signal=sig-1` URLs — map to tracked pairs when the feed has not emitted that id yet. */
function resolveShellSignalForLegacyId(signalId: string, liveSignals: CryptoSignal[]): CryptoSignal | null {
  const map: Record<string, { pair: string; symbol: string }> = {
    'sig-1': { pair: 'BTC', symbol: 'BTCUSDT' },
    'sig-2': { pair: 'ETH', symbol: 'ETHUSDT' },
    'sig-3': { pair: 'SOL', symbol: 'SOLUSDT' },
  };
  const m = map[signalId];
  if (!m) return null;
  return pickBestSignalForPair(liveSignals, m.pair) ?? buildTrackedFallbackSignal(m.pair, m.symbol);
}

function buildSignalContextFromQuery(params: URLSearchParams, signalId: string): CryptoSignal | null {
  const setupScore = Number(params.get('setupScore'));
  const trend = Number(params.get('trend'));
  const momentum = Number(params.get('momentum'));
  const structure = Number(params.get('structure'));
  const volume = Number(params.get('volume'));
  const risk = Number(params.get('risk'));
  const pair = params.get('pair');
  if (!Number.isFinite(setupScore) || !Number.isFinite(trend) || !Number.isFinite(momentum)) return null;
  if (!Number.isFinite(structure) || !Number.isFinite(volume) || !Number.isFinite(risk) || !pair) return null;
  const tagsRaw = params.get('tags') ?? '';
  const tags = tagsRaw.split(',').map((t) => t.trim()).filter((t): t is SignalSetupTag => t === 'Breakout' || t === 'Pullback' || t === 'Overextended');
  const setupScoreLabel = (params.get('setupScoreLabel') ?? 'Developing setup') as SetupScoreLabel;
  const riskTag = (params.get('riskTag') ?? 'Medium Risk') as SignalRiskTag;
  const sideParam = (params.get('side') ?? 'long') as 'long' | 'short';
  const entryQ = Number(params.get('entry'));
  const stopQ = Number(params.get('stop'));
  const targetQ = Number(params.get('target'));
  return {
    id: signalId,
    pair,
    side: sideParam,
    biasLabel: params.get('biasLabel') ?? (sideParam === 'long' ? 'Potential Long' : 'Potential Short'),
    setupScore,
    setupScoreLabel,
    setupType: (params.get('setupType') as 'breakout' | 'pullback' | 'overextended' | null) ?? 'breakout',
    scoreBreakdown: { trendAlignment: trend, momentumQuality: momentum, structureQuality: structure, volumeConfirmation: volume, riskConditions: risk },
    riskTag,
    setupTags: tags,
    exchange: 'Bybit',
    postedAgo: 'Live',
    aiExplanation: params.get('explanation') ?? 'Setup context loaded from feed.',
    whyThisMatters: 'Loaded from selected setup context.',
    watchCue: params.get('watch')?.trim() || undefined,
    watchNext: params.get('watchNext')?.trim() || undefined,
    plannedEntry: Number.isFinite(entryQ) && entryQ > 0 ? entryQ : undefined,
    plannedStop: Number.isFinite(stopQ) && stopQ > 0 ? stopQ : undefined,
    plannedTarget: Number.isFinite(targetQ) && targetQ > 0 ? targetQ : undefined,
  };
}
