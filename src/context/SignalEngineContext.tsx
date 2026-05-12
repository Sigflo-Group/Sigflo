import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { runScannerDeterminismCheck } from '@/engine/scannerDeterminism';
import { BybitWsClient } from '@/lib/bybitWsClient';
import { buildSignalFromMarket, inferMarketRegime } from '@/lib/signalDetectors';
import { atr } from '@/lib/indicators';
import { updateMarketMemory, type MarketMemorySnapshot } from '@/lib/marketMemory';
import {
  DEFAULT_STRATEGY_PERSONALITY_MODE,
  loadStrategyPersonalityMode,
  STRATEGY_PERSONALITY_PROFILES,
  STRATEGY_PERSONALITY_STORAGE_KEY,
  type StrategyPersonalityMode,
} from '@/lib/strategyPersonality';
import {
  appendAiSnapshotIfTriggered,
  findActiveLifecycleEvent,
  loadAiSnapshotStore,
  persistAiSnapshotStore,
} from '@/lib/aiSnapshotLog';
import {
  loadRegimePredictorStore,
  persistRegimePredictorStore,
  updateRegimePredictor,
} from '@/lib/regimePredictor';
import {
  createEmptySignalLifecycleTracker,
  deriveAdaptiveFeedback,
  registerSignalLifecycleEvent,
  updateSignalLifecycleOutcomes,
  type SignalLifecycleTrackerStore,
} from '@/lib/signalLifecycleTracker';
import { recordScannerDiagnostic } from '@/lib/scannerDiagnostics';
import {
  adaptationConfidenceAdjustment,
  createEmptyUserAdaptationStore,
  registerSignalFollow,
  registerSignalIgnore,
  registerSignalImpression,
  type UserAdaptationStore,
} from '@/lib/userAdaptation';
import {
  fetchKlines,
  fetchTickers,
} from '@/services/bybit/client';
import { TRACKED_SYMBOLS } from '@/lib/marketScannerRows';
import type { BybitWsTicker } from '@/lib/bybitWsClient';
import type { CandidateLifecycle } from '@/lib/timingLifecycle';
import type { Candle, KlineInterval, SymbolTicker } from '@/types/market';
import type { AiSnapshotStore } from '@/types/aiSnapshot';
import type { CryptoSignal } from '@/types/signal';
import type { RegimePredictorOutput, RegimePredictorState } from '@/types/regimePredictor';
import { shouldAnnounceScannerBiasFlip } from '@/lib/biasFlipNotifyGate';
import { emitGlobalAnnouncement } from '@/lib/globalAnnouncements';

export type SignalEngineState = {
  signals: CryptoSignal[];
  loading: boolean;
  mode: 'REST' | 'WS' | 'OFFLINE';
  connection: 'connected' | 'reconnecting' | 'disconnected';
  error?: string;
  /** WS-backed last prices for streamed symbols (Markets / Feed overlay). */
  liveTickersBySymbol: Record<string, SymbolTicker>;
  /** Top Movers symbols (not in Tracked) get live ticker WS subscriptions. */
  setScannerTickerExtras: (symbols: string[]) => void;
  strategyPersonalityMode: StrategyPersonalityMode;
  setStrategyPersonalityMode: (mode: StrategyPersonalityMode) => void;
  userAdaptation: UserAdaptationStore;
  registerSignalFollowed: (signal: CryptoSignal) => void;
  outcomeFeedbackSummary: string[];
  lifecycleAnalytics: SignalLifecycleTrackerStore;
  /** Append-only AI state snapshots for replay / telemetry (read-only for consumers). */
  aiSnapshotLog: AiSnapshotStore;
  /** Read-only regime transition early warning outputs keyed by symbol (e.g. BTCUSDT). */
  regimePredictorBySymbol: Record<string, RegimePredictorOutput>;
  /** Progressive-disclosure toggle for advanced analytics. */
  proIntelligenceMode: boolean;
  setProIntelligenceMode: (enabled: boolean) => void;
  advancedLayout: 'compact' | 'expanded';
  setAdvancedLayout: (layout: 'compact' | 'expanded') => void;
  isAdvancedPanelExpanded: (panelId: string) => boolean;
  setAdvancedPanelExpanded: (panelId: string, expanded: boolean) => void;
};

const COOLDOWN_MS = 20 * 60 * 1000;
const SCORE_IMPROVE_BYPASS = 6;
const ATR_MOVE_BYPASS = 0.6;
const MARKET_MEMORY_STORE_KEY = '__SIGFLO_MARKET_MEMORY_V1__';
const SIGNAL_LIFECYCLE_STORE_KEY = '__SIGFLO_SIGNAL_LIFECYCLE_V1__';
const USER_ADAPTATION_STORE_KEY = '__SIGFLO_USER_ADAPTATION_V1__';
const PRO_INTELLIGENCE_PREFS_KEY = '__SIGFLO_PRO_INTELLIGENCE_PREFS_V1__';
/** Same as Markets Tracked list — WS klines + tickers for live scanner + detectors. */
const STREAM_SYMBOLS: string[] = [...TRACKED_SYMBOLS];

const SignalEngineContext = createContext<SignalEngineState | null>(null);

function signalPairToLinearKey(pair: string): string {
  const raw = pair.trim().toUpperCase();
  const base = raw.includes('/') ? raw.split('/')[0].trim() : raw.replace(/USDT$/i, '').trim();
  const clean = base.replace(/[^A-Z0-9]/g, '');
  return `${clean || 'BTC'}USDT`;
}

function wsTickerToSymbolTicker(t: BybitWsTicker): SymbolTicker {
  return {
    symbol: t.symbol,
    lastPrice: t.lastPrice,
    ...(t.markPrice > 0 ? { markPrice: t.markPrice } : {}),
    ...(t.indexPrice != null && t.indexPrice > 0 ? { indexPrice: t.indexPrice } : {}),
    high24h: t.high24h,
    low24h: t.low24h,
    volume24h: t.volume24h,
    turnover24h: t.turnover24h,
    price24hPcnt: t.price24hPcnt,
  };
}

function loadMarketMemoryStore(): Record<string, MarketMemorySnapshot> {
  try {
    const raw = globalThis.localStorage?.getItem(MARKET_MEMORY_STORE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, MarketMemorySnapshot>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function persistMarketMemoryStore(store: Record<string, MarketMemorySnapshot>): void {
  try {
    globalThis.localStorage?.setItem(MARKET_MEMORY_STORE_KEY, JSON.stringify(store));
  } catch {
    // Ignore quota/privacy failures, memory remains in-session.
  }
}

function loadSignalLifecycleStore(): SignalLifecycleTrackerStore {
  try {
    const raw = globalThis.localStorage?.getItem(SIGNAL_LIFECYCLE_STORE_KEY);
    if (!raw) return createEmptySignalLifecycleTracker();
    const parsed = JSON.parse(raw) as SignalLifecycleTrackerStore;
    if (!parsed || typeof parsed !== 'object') return createEmptySignalLifecycleTracker();
    return {
      events: Array.isArray(parsed.events) ? parsed.events : [],
      feedbackBySymbolSetup:
        parsed.feedbackBySymbolSetup && typeof parsed.feedbackBySymbolSetup === 'object'
          ? parsed.feedbackBySymbolSetup
          : {},
      generatedInsights: Array.isArray(parsed.generatedInsights) ? parsed.generatedInsights : [],
    };
  } catch {
    return createEmptySignalLifecycleTracker();
  }
}

function persistSignalLifecycleStore(store: SignalLifecycleTrackerStore): void {
  try {
    globalThis.localStorage?.setItem(SIGNAL_LIFECYCLE_STORE_KEY, JSON.stringify(store));
  } catch {
    // ignore storage failures
  }
}

function loadUserAdaptationStore(): UserAdaptationStore {
  try {
    const raw = globalThis.localStorage?.getItem(USER_ADAPTATION_STORE_KEY);
    if (!raw) return createEmptyUserAdaptationStore();
    const parsed = JSON.parse(raw) as UserAdaptationStore;
    if (!parsed || typeof parsed !== 'object') return createEmptyUserAdaptationStore();
    return {
      ...createEmptyUserAdaptationStore(),
      ...parsed,
      bySetup: {
        ...createEmptyUserAdaptationStore().bySetup,
        ...(parsed.bySetup ?? {}),
      },
      byRisk: {
        ...createEmptyUserAdaptationStore().byRisk,
        ...(parsed.byRisk ?? {}),
      },
      preferences: {
        ...createEmptyUserAdaptationStore().preferences,
        ...(parsed.preferences ?? {}),
      },
      generatedNotes: Array.isArray(parsed.generatedNotes) ? parsed.generatedNotes : [],
    };
  } catch {
    return createEmptyUserAdaptationStore();
  }
}

function persistUserAdaptationStore(store: UserAdaptationStore): void {
  try {
    globalThis.localStorage?.setItem(USER_ADAPTATION_STORE_KEY, JSON.stringify(store));
  } catch {
    // ignore storage failures
  }
}

type CandleStore = Record<string, Record<KlineInterval, Candle[]>>;

type ProIntelligencePrefs = {
  enabled: boolean;
  layout: 'compact' | 'expanded';
  panelExpanded: Record<string, boolean>;
};

function loadProIntelligencePrefs(): ProIntelligencePrefs {
  try {
    const raw = globalThis.localStorage?.getItem(PRO_INTELLIGENCE_PREFS_KEY);
    if (!raw) return { enabled: false, layout: 'compact', panelExpanded: {} };
    const parsed = JSON.parse(raw) as Partial<ProIntelligencePrefs>;
    return {
      enabled: Boolean(parsed?.enabled),
      layout: parsed?.layout === 'expanded' ? 'expanded' : 'compact',
      panelExpanded:
        parsed?.panelExpanded && typeof parsed.panelExpanded === 'object'
          ? (parsed.panelExpanded as Record<string, boolean>)
          : {},
    };
  } catch {
    return { enabled: false, layout: 'compact', panelExpanded: {} };
  }
}

function persistProIntelligencePrefs(prefs: ProIntelligencePrefs): void {
  try {
    globalThis.localStorage?.setItem(PRO_INTELLIGENCE_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore storage failures
  }
}

function emptyIntervalCandles(): Record<KlineInterval, Candle[]> {
  return {
    '1': [],
    '5': [],
    '15': [],
    '60': [],
    '240': [],
    D: [],
    W: [],
  };
}

function upsertCandle(store: Candle[], next: Candle): Candle[] {
  const out = [...store];
  const last = out.at(-1);
  if (!last || next.ts > last.ts) out.push(next);
  else if (next.ts === last.ts) out[out.length - 1] = next;
  return out.slice(-240);
}

function useSignalEngineValue(): SignalEngineState {
  type EngineSnapshotState = Pick<
    SignalEngineState,
    | 'signals'
    | 'loading'
    | 'mode'
    | 'connection'
    | 'error'
    | 'outcomeFeedbackSummary'
    | 'lifecycleAnalytics'
    | 'regimePredictorBySymbol'
    | 'aiSnapshotLog'
  >;
  const initialAiLog = loadAiSnapshotStore();
  const initialProPrefs = loadProIntelligencePrefs();
  const aiSnapshotStoreRef = useRef<AiSnapshotStore>(initialAiLog);
  const [state, setState] = useState<EngineSnapshotState>({
    signals: [],
    loading: true,
    mode: 'REST',
    connection: 'disconnected',
    outcomeFeedbackSummary: [],
    lifecycleAnalytics: createEmptySignalLifecycleTracker(),
    regimePredictorBySymbol: {},
    aiSnapshotLog: initialAiLog,
  });
  const [liveTickersBySymbol, setLiveTickersBySymbol] = useState<Record<string, SymbolTicker>>({});
  const [scannerTickerExtras, setScannerTickerExtras] = useState<string[]>([]);
  const [proIntelligenceMode, setProIntelligenceModeState] = useState<boolean>(initialProPrefs.enabled);
  const [advancedLayout, setAdvancedLayoutState] = useState<'compact' | 'expanded'>(initialProPrefs.layout);
  const [advancedPanelsExpanded, setAdvancedPanelsExpanded] = useState<Record<string, boolean>>(
    initialProPrefs.panelExpanded,
  );
  const [strategyPersonalityMode, setStrategyPersonalityModeState] = useState<StrategyPersonalityMode>(() =>
    typeof window !== 'undefined' ? loadStrategyPersonalityMode() : DEFAULT_STRATEGY_PERSONALITY_MODE,
  );
  const mergedTickerSymbols = useMemo(
    () => [...new Set([...STREAM_SYMBOLS, ...scannerTickerExtras])],
    [scannerTickerExtras],
  );
  const setScannerTickerExtrasStable = useCallback((symbols: string[]) => {
    setScannerTickerExtras(symbols);
  }, []);
  const setStrategyPersonalityMode = useCallback((mode: StrategyPersonalityMode) => {
    setStrategyPersonalityModeState(mode);
    try {
      globalThis.localStorage?.setItem(STRATEGY_PERSONALITY_STORAGE_KEY, mode);
    } catch {
      // ignore storage failures
    }
  }, []);
  const setProIntelligenceMode = useCallback(
    (enabled: boolean) => {
      setProIntelligenceModeState(enabled);
      persistProIntelligencePrefs({
        enabled,
        layout: advancedLayout,
        panelExpanded: advancedPanelsExpanded,
      });
    },
    [advancedLayout, advancedPanelsExpanded],
  );
  const setAdvancedLayout = useCallback(
    (layout: 'compact' | 'expanded') => {
      setAdvancedLayoutState(layout);
      persistProIntelligencePrefs({
        enabled: proIntelligenceMode,
        layout,
        panelExpanded: advancedPanelsExpanded,
      });
    },
    [advancedPanelsExpanded, proIntelligenceMode],
  );
  const setAdvancedPanelExpanded = useCallback(
    (panelId: string, expanded: boolean) => {
      setAdvancedPanelsExpanded((prev) => {
        const next = { ...prev, [panelId]: expanded };
        persistProIntelligencePrefs({
          enabled: proIntelligenceMode,
          layout: advancedLayout,
          panelExpanded: next,
        });
        return next;
      });
    },
    [advancedLayout, proIntelligenceMode],
  );
  const isAdvancedPanelExpanded = useCallback(
    (panelId: string) => advancedPanelsExpanded[panelId] ?? true,
    [advancedPanelsExpanded],
  );
  const lastSignalRef = useRef<Record<string, { emittedAt: number; setupScore: number; refPrice: number; atr: number }>>({});
  const signalBookRef = useRef<Record<string, CryptoSignal>>({});
  const lifecycleRef = useRef<Record<string, CandidateLifecycle>>({});
  const marketMemoryRef = useRef<Record<string, MarketMemorySnapshot>>(loadMarketMemoryStore());
  const signalLifecycleStoreRef = useRef<SignalLifecycleTrackerStore>(loadSignalLifecycleStore());
  const regimePredictorStoreRef = useRef<Record<string, RegimePredictorState>>(loadRegimePredictorStore());
  const candlesRef = useRef<CandleStore>({});
  const tickersRef = useRef<Record<string, SymbolTicker>>({});
  const wsConnectedRef = useRef(false);
  const streamReadyRef = useRef(false);
  const didPrintDeterminismRef = useRef(false);
  const tickerFlushRafRef = useRef<number | null>(null);
  const wsClientRef = useRef<BybitWsClient | null>(null);
  const biasSideBySymbolRef = useRef<Record<string, 'long' | 'short'>>({});
  const userAdaptationRef = useRef<UserAdaptationStore>(loadUserAdaptationStore());
  const strategyPersonalityModeRef = useRef<StrategyPersonalityMode>(strategyPersonalityMode);
  strategyPersonalityModeRef.current = strategyPersonalityMode;

  const registerSignalFollowed = useCallback((signal: CryptoSignal) => {
    userAdaptationRef.current = registerSignalFollow(userAdaptationRef.current, {
      setupType: signal.setupType,
      riskLevel: signal.riskLevel ?? 'moderate',
      counterTrend: signal.facts?.counterTrend === 'yes',
    });
    persistUserAdaptationStore(userAdaptationRef.current);
    setState((prev) => ({ ...prev }));
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (import.meta.env.DEV && !didPrintDeterminismRef.current) {
      didPrintDeterminismRef.current = true;
      const check = runScannerDeterminismCheck();
      // Dev-only visibility: verifies deterministic first pass and cooldown/dedup on second pass.
      console.log('[Sigflo][Engine] determinism pass 1', check.firstPass);
      console.log('[Sigflo][Engine] determinism pass 2', check.secondPass);
    }

    function pickCryptoSignalForSymbol(sym: string): CryptoSignal | null {
      let best: CryptoSignal | null = null;
      for (const s of Object.values(signalBookRef.current)) {
        if (signalPairToLinearKey(s.pair) !== sym) continue;
        if (!best || s.setupScore > best.setupScore) best = s;
      }
      return best;
    }

    function pushState(mode: SignalEngineState['mode'], connection: SignalEngineState['connection'], error?: string) {
      const ranked = Object.values(signalBookRef.current).sort((a, b) => b.setupScore - a.setupScore);
      for (const sym of STREAM_SYMBOLS) {
        let best: CryptoSignal | null = null;
        for (const s of ranked) {
          if (signalPairToLinearKey(s.pair) !== sym) continue;
          if (!best || s.setupScore > best.setupScore) best = s;
        }
        if (!best) {
          delete biasSideBySymbolRef.current[sym];
          continue;
        }
        const next = best.side;
        const prev = biasSideBySymbolRef.current[sym];
        if (prev !== undefined && prev !== next && shouldAnnounceScannerBiasFlip(sym)) {
          const shortLabel = sym.replace(/USDT$/i, '');
          emitGlobalAnnouncement({
            id: `bias-${sym}-${Date.now()}`,
            kind: 'bias_flip',
            title: 'Bias changed',
            subtitle: `${shortLabel} ${prev === 'long' ? 'LONG' : 'SHORT'} → ${next === 'long' ? 'LONG' : 'SHORT'}`,
          });
        }
        biasSideBySymbolRef.current[sym] = next;
      }
      setState({
        signals: ranked,
        loading: false,
        // Reflect transport/data source truth even when no setups are currently emitted.
        mode,
        connection,
        error,
        outcomeFeedbackSummary: signalLifecycleStoreRef.current.generatedInsights.slice(-4).map((x) => x.insight),
        lifecycleAnalytics: signalLifecycleStoreRef.current,
        regimePredictorBySymbol: Object.fromEntries(
          Object.entries(regimePredictorStoreRef.current).map(([sym, row]) => [sym, row.output]),
        ),
        aiSnapshotLog: aiSnapshotStoreRef.current,
      });
    }

    // REST bootstrap / reconnect catch-up:
    // - backfill candles and tickers
    // - refresh in-memory stores
    // - run detector pipeline against fresh snapshots
    async function backfillFromRest(reason: 'startup' | 'reconnect') {
      console.log(`[Sigflo][Engine] REST bootstrap (${reason})`);
      streamReadyRef.current = false;
      try {
        const tickers = await fetchTickers(STREAM_SYMBOLS);
        for (const ticker of tickers) tickersRef.current[ticker.symbol] = ticker;
        for (const symbol of STREAM_SYMBOLS) {
          const [candles5m, candles15m] = await Promise.all([
            fetchKlines(symbol, '5', 240),
            fetchKlines(symbol, '15', 240),
          ]);
          candlesRef.current[symbol] = {
            ...emptyIntervalCandles(),
            ...candlesRef.current[symbol],
            '5': candles5m,
            '15': candles15m,
          };
        }
        recomputeAllFromStore('REST');
        if (cancelled) return;
        streamReadyRef.current = true;
        setLiveTickersBySymbol({ ...tickersRef.current });
        pushState('REST', wsConnectedRef.current ? 'connected' : 'disconnected');
      } catch (err) {
        if (cancelled) return;
        pushState('OFFLINE', wsConnectedRef.current ? 'reconnecting' : 'disconnected', err instanceof Error ? err.message : 'Signal engine failed');
      }
    }

    function recomputeForSymbol(symbol: string, mode: SignalEngineState['mode']) {
      const symbolCandles = candlesRef.current[symbol];
      const ticker = tickersRef.current[symbol];
      if (!symbolCandles || !ticker || symbolCandles['15'].length < 60) return;
      const priorLifecycle =
        lifecycleRef.current[`${symbol}:breakout`] ??
        lifecycleRef.current[`${symbol}:pullback`] ??
        lifecycleRef.current[`${symbol}:overextended`];
      const btc15 = candlesRef.current.BTCUSDT?.['15'] ?? [];
      const eth15 = candlesRef.current.ETHUSDT?.['15'] ?? [];
      if (btc15.length < 60 || eth15.length < 60) return;
      const regime = inferMarketRegime({ btc15m: btc15, eth15m: eth15 });
      const signal = buildSignalFromMarket({
        symbol,
        exchange: 'Bybit',
        ticker,
        candles15m: symbolCandles['15'],
        candles5m: symbolCandles['5'],
        regime,
        previousLifecycle: priorLifecycle,
        previousMarketMemory: marketMemoryRef.current[symbol],
        strategyPersonalityMode: strategyPersonalityModeRef.current,
        strategyPersonalityProfile: STRATEGY_PERSONALITY_PROFILES[strategyPersonalityModeRef.current],
        adaptationConfidenceAdjustmentForSetup: (setupType) =>
          adaptationConfidenceAdjustment(userAdaptationRef.current, setupType),
        adaptiveFeedbackForSetup: (setupType) =>
          deriveAdaptiveFeedback(signalLifecycleStoreRef.current, symbol, setupType),
      });
      signalLifecycleStoreRef.current = updateSignalLifecycleOutcomes({
        store: signalLifecycleStoreRef.current,
        symbol,
        price: ticker.lastPrice,
        now: Date.now(),
        candleTs: symbolCandles['15'].at(-1)?.ts ?? Date.now(),
      });
      persistSignalLifecycleStore(signalLifecycleStoreRef.current);
      const nextMemory = updateMarketMemory({
        symbol,
        previous: marketMemoryRef.current[symbol],
        candles15m: symbolCandles['15'],
        signal: signal?.signal ?? null,
        now: Date.now(),
      });
      marketMemoryRef.current[symbol] = nextMemory;
      persistMarketMemoryStore(marketMemoryRef.current);
      const nextRegimePredictor = updateRegimePredictor({
        previous: regimePredictorStoreRef.current[symbol] ?? null,
        symbol,
        memory: nextMemory,
        candles15m: symbolCandles['15'],
        lifecycleEvents: signalLifecycleStoreRef.current.events,
        now: Date.now(),
      });
      regimePredictorStoreRef.current[symbol] = nextRegimePredictor;
      persistRegimePredictorStore(regimePredictorStoreRef.current);
      setState((prev) => ({
        ...prev,
        regimePredictorBySymbol: {
          ...prev.regimePredictorBySymbol,
          [symbol]: nextRegimePredictor.output,
        },
      }));

      function flushAiSnapshot(
        memory: MarketMemorySnapshot,
        crypto: CryptoSignal | null,
        regimePredictor: RegimePredictorOutput,
      ) {
        const activeLifecycle = findActiveLifecycleEvent(signalLifecycleStoreRef.current.events, symbol);
        const snapResult = appendAiSnapshotIfTriggered({
          store: aiSnapshotStoreRef.current,
          symbol,
          price: ticker.lastPrice,
          memory,
          cryptoSignal: crypto,
          activeLifecycle,
          regimePredictor,
          now: Date.now(),
        });
        if (snapResult.appended) {
          aiSnapshotStoreRef.current = snapResult.store;
          persistAiSnapshotStore(snapResult.store);
          setState((prev) => ({
            ...prev,
            aiSnapshotLog: snapResult.store,
            regimePredictorBySymbol: {
              ...prev.regimePredictorBySymbol,
              [symbol]: regimePredictor,
            },
          }));
        }
      }

      flushAiSnapshot(
        nextMemory,
        signal?.signal ?? pickCryptoSignalForSymbol(symbol),
        nextRegimePredictor.output,
      );

      if (!signal) return;
      const key = `${symbol}:${signal.signal.setupType}`;
      const now = Date.now();
      const prev = lastSignalRef.current[key];
      const atrNow = Math.max(0.000001, atr(symbolCandles['15'], 14).at(-1) ?? 1);
      const priceNow = ticker.lastPrice;
      const scoreImproved = prev ? signal.signal.setupScore - prev.setupScore >= SCORE_IMPROVE_BYPASS : false;
      const priceMoved = prev ? Math.abs(priceNow - prev.refPrice) / Math.max(prev.atr, 0.000001) >= ATR_MOVE_BYPASS : false;
      const cooldownPassed =
        !prev ||
        now - prev.emittedAt >= COOLDOWN_MS * (STRATEGY_PERSONALITY_PROFILES[strategyPersonalityModeRef.current]?.cooldownMultiplier ?? 1);
      if (!(cooldownPassed || scoreImproved || priceMoved)) {
        userAdaptationRef.current = registerSignalIgnore(userAdaptationRef.current, {
          confidence: signal.signal.confidence ?? signal.signal.setupScore,
        });
        persistUserAdaptationStore(userAdaptationRef.current);
        return;
      }
      userAdaptationRef.current = registerSignalImpression(userAdaptationRef.current, {
        setupType: signal.signal.setupType,
        riskLevel: signal.signal.riskLevel ?? 'moderate',
        confidence: signal.signal.confidence ?? signal.signal.setupScore,
        counterTrend: signal.signal.facts?.counterTrend === 'yes',
      });
      persistUserAdaptationStore(userAdaptationRef.current);
      lastSignalRef.current[key] = { emittedAt: now, setupScore: signal.signal.setupScore, refPrice: priceNow, atr: atrNow };
      signalBookRef.current[key] = signal.signal;
      lifecycleRef.current[key] = signal.lifecycle;
      signalLifecycleStoreRef.current = registerSignalLifecycleEvent({
        store: signalLifecycleStoreRef.current,
        signal: signal.signal,
        symbol,
        atrNow,
        now,
        strategyPersonalityMode: strategyPersonalityModeRef.current,
      });
      persistSignalLifecycleStore(signalLifecycleStoreRef.current);
      flushAiSnapshot(nextMemory, signal.signal, nextRegimePredictor.output);
      recordScannerDiagnostic({
        symbol,
        setupScore: signal.signal.setupScore,
        ...{
          setupType: signal.signal.setupType,
          timingScore: signal.signal.timingScore ?? 0,
          entryFreshnessScore: signal.signal.entryFreshnessScore ?? 0,
          roomToTargetScore: signal.signal.roomToTargetScore ?? 0,
          actionabilityScore: signal.signal.actionabilityScore ?? 0,
          state: signal.signal.timingState ?? 'developing',
          triggerType: signal.signal.triggerType ?? 'unknown',
          idealEntryPrice: signal.signal.idealEntryPrice ?? null,
          currentPrice: ticker.lastPrice,
          atrExtensionFromIdeal:
            signal.signal.idealEntryPrice && atrNow > 0
              ? Math.abs(ticker.lastPrice - signal.signal.idealEntryPrice) / atrNow
              : 0,
          candlesSinceTrigger: signal.signal.candlesSinceTrigger ?? null,
          candlesSincePeakTiming: signal.signal.candlesSincePeakTiming ?? null,
          penalties: signal.signal.penaltyBreakdown ?? {
            candlesLatePenalty: 0,
            atrExtensionPenalty: 0,
            percentExtensionPenalty: 0,
            postTriggerImpulsePenalty: 0,
            crowdedLevelPenalty: 0,
            rrCompressionPenalty: 0,
          },
          positiveFactors: signal.signal.positiveTimingFactors ?? [],
        },
        ts: now,
      });
      console.log(
        `[Sigflo][Engine] detector triggered ${symbol} ${signal.signal.setupType} ${signal.signal.setupScore} state=${signal.signal.timingState ?? 'n/a'}`
      );
      pushState(mode, wsConnectedRef.current ? 'connected' : 'disconnected');
    }

    function recomputeAllFromStore(mode: SignalEngineState['mode']) {
      for (const symbol of STREAM_SYMBOLS) recomputeForSymbol(symbol, mode);
    }

    // WS stream:
    // - keep tickers fresh
    // - process closed candles only
    // - feed 15m closed bars through detector pipeline
    const ws = new BybitWsClient({
      klineSymbols: STREAM_SYMBOLS,
      tickerSymbols: STREAM_SYMBOLS,
      includeTickers: true,
      onLog: (msg) => console.log(`[Sigflo][Engine] ${msg}`),
      onConnectionChange: (connection) => {
        wsConnectedRef.current = connection === 'connected';
        if (connection === 'connected') {
          void backfillFromRest('reconnect');
          pushState('WS', 'connected');
          return;
        }
        pushState(streamReadyRef.current ? 'REST' : 'OFFLINE', connection);
      },
      onTicker: (ticker) => {
        const mapped = wsTickerToSymbolTicker(ticker);
        tickersRef.current[ticker.symbol] = mapped;
        if (tickerFlushRafRef.current != null) return;
        tickerFlushRafRef.current = window.requestAnimationFrame(() => {
          tickerFlushRafRef.current = null;
          setLiveTickersBySymbol({ ...tickersRef.current });
        });
      },
      onKline: (kline) => {
        const interval = kline.interval as KlineInterval;
        const symbol = kline.symbol;
        if (!candlesRef.current[symbol]) candlesRef.current[symbol] = emptyIntervalCandles();
        candlesRef.current[symbol][interval] = upsertCandle(candlesRef.current[symbol][interval], {
          ts: kline.start,
          open: kline.open,
          high: kline.high,
          low: kline.low,
          close: kline.close,
          volume: kline.volume,
          isClosed: kline.confirm,
        });
        // Closed-candle event is the only trigger input for signal generation.
        if (!kline.confirm) return;
        console.log(`[Sigflo][Engine] closed candle received ${symbol} ${interval}`);
        if (!streamReadyRef.current) return;
        if (interval === '15') recomputeForSymbol(symbol, 'WS');
      },
    });
    wsClientRef.current = ws;

    void backfillFromRest('startup').then(() => {
      ws.connect();
    });

    return () => {
      cancelled = true;
      if (tickerFlushRafRef.current != null) {
        window.cancelAnimationFrame(tickerFlushRafRef.current);
        tickerFlushRafRef.current = null;
      }
      ws.disconnect();
      wsClientRef.current = null;
    };
  }, []);

  useEffect(() => {
    wsClientRef.current?.updateTickerSymbols(mergedTickerSymbols);
  }, [mergedTickerSymbols]);

  return useMemo(
    () => ({
      ...state,
      liveTickersBySymbol,
      setScannerTickerExtras: setScannerTickerExtrasStable,
      strategyPersonalityMode,
      setStrategyPersonalityMode,
      proIntelligenceMode,
      setProIntelligenceMode,
      advancedLayout,
      setAdvancedLayout,
      isAdvancedPanelExpanded,
      setAdvancedPanelExpanded,
      userAdaptation: userAdaptationRef.current,
      registerSignalFollowed,
    }),
    [
      state,
      liveTickersBySymbol,
      setScannerTickerExtrasStable,
      strategyPersonalityMode,
      setStrategyPersonalityMode,
      proIntelligenceMode,
      setProIntelligenceMode,
      advancedLayout,
      setAdvancedLayout,
      isAdvancedPanelExpanded,
      setAdvancedPanelExpanded,
      registerSignalFollowed,
    ],
  );
}

export function SignalEngineProvider({ children }: { children: ReactNode }) {
  const value = useSignalEngineValue();
  return <SignalEngineContext.Provider value={value}>{children}</SignalEngineContext.Provider>;
}

export function useSignalEngine(): SignalEngineState {
  const ctx = useContext(SignalEngineContext);
  if (ctx == null) {
    throw new Error('useSignalEngine must be used within SignalEngineProvider.');
  }
  return ctx;
}
