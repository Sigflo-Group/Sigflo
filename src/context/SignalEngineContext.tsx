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
import { exchangeManager } from '@/core/exchange-manager';
import {
  DEFAULT_STRATEGY_PERSONALITY_MODE,
  type StrategyPersonalityMode,
} from '@/lib/strategyPersonality';
import {
  createEmptySignalLifecycleTracker,
  type SignalLifecycleTrackerStore,
} from '@/lib/signalLifecycleTracker';
import {
  logScannerHealthSummary,
} from '@/lib/scannerPipelineHealth';
import {
  registerSignalFollow,
  type UserAdaptationStore,
} from '@/lib/userAdaptation';
import { type MarketMemorySnapshot } from '@/lib/marketMemory';
import { TRACKED_SYMBOLS, mergeScannerKlineSymbols } from '@/lib/marketScannerRows';
import type { CandidateLifecycle } from '@/lib/timingLifecycle';
import type { NormalizedKline } from '@/core/market-data-interface';
import type { Candle, SymbolTicker } from '@/types/market';
import type { AiSnapshotStore } from '@/types/aiSnapshot';
import type { CryptoSignal } from '@/types/signal';
import type { RegimePredictorOutput, RegimePredictorState } from '@/types/regimePredictor';
import {
  loadMarketMemoryStore,
  persistMarketMemoryStore,
  loadSignalLifecycleStore,
  persistSignalLifecycleStore,
  loadUserAdaptationStore,
  persistUserAdaptationStore,
  loadProIntelligencePrefs,
  persistProIntelligencePrefs,
  loadLifecycleRef,
  persistLifecycleRef,
  loadRegimePredictorStore,
  persistRegimePredictorStore,
  loadAiSnapshotStore,
  persistAiSnapshotStore,
} from '@/lib/engineStorage';
import {
  emptyIntervalCandles,
  upsertCandle,
} from '@/lib/engineUtils';
import {
  recomputeForSymbol,
  pushEngineState,
  type EngineStores,
  type PipelineCallbacks,
} from '@/lib/enginePipeline';
import {
  backfillFromRest,
  backfillNewSymbols,
  type BootstrapContext,
} from '@/lib/engineBootstrap';

const DEBUG = import.meta.env.DEV || !!(globalThis as Record<string, unknown>).__SIGFLO_DEBUG__;

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

type CandleStore = Record<string, Record<string, Candle[]>>;
/** Same as Markets Tracked list — WS klines + tickers for live scanner + detectors. */
const STREAM_SYMBOLS: string[] = [...TRACKED_SYMBOLS];

const SignalEngineContext = createContext<SignalEngineState | null>(null);

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
  const aiSnapshotStoreRef = useRef<AiSnapshotStore>(undefined as unknown as AiSnapshotStore);
  const [state, setState] = useState<EngineSnapshotState>(() => {
    const initialAiLog = loadAiSnapshotStore();
    aiSnapshotStoreRef.current = initialAiLog;
    return {
      signals: [],
      loading: true,
      mode: 'REST',
      connection: 'disconnected',
      outcomeFeedbackSummary: [],
      lifecycleAnalytics: createEmptySignalLifecycleTracker(),
      regimePredictorBySymbol: {},
      aiSnapshotLog: initialAiLog,
    };
  });
  const [liveTickersBySymbol, setLiveTickersBySymbol] = useState<Record<string, SymbolTicker>>({});
  const [scannerTickerExtras, setScannerTickerExtras] = useState<string[]>([]);
  const [proIntelligenceMode, setProIntelligenceModeState] = useState<boolean>(
    () => loadProIntelligencePrefs().enabled,
  );
  const [advancedLayout, setAdvancedLayoutState] = useState<'compact' | 'expanded'>(
    () => loadProIntelligencePrefs().layout,
  );
  const [advancedPanelsExpanded, setAdvancedPanelsExpanded] = useState<Record<string, boolean>>(
    () => loadProIntelligencePrefs().panelExpanded,
  );
  const proIntelligenceModeRef = useRef(proIntelligenceMode);
  const advancedLayoutRef = useRef(advancedLayout);
  const advancedPanelsExpandedRef = useRef(advancedPanelsExpanded);
  proIntelligenceModeRef.current = proIntelligenceMode;
  advancedLayoutRef.current = advancedLayout;
  advancedPanelsExpandedRef.current = advancedPanelsExpanded;
  const strategyPersonalityMode: StrategyPersonalityMode = DEFAULT_STRATEGY_PERSONALITY_MODE;
  const mergedTickerSymbols = useMemo(
    () => [...new Set([...STREAM_SYMBOLS, ...scannerTickerExtras])],
    [scannerTickerExtras],
  );
  const setScannerTickerExtrasStable = useCallback((symbols: string[]) => {
    setScannerTickerExtras(symbols);
  }, []);
  const setStrategyPersonalityMode = useCallback((mode: StrategyPersonalityMode) => {
    // Personality mode selection has been removed from the product UI.
    void mode;
  }, []);
  const setProIntelligenceMode = useCallback(
    (enabled: boolean) => {
      setProIntelligenceModeState(enabled);
      persistProIntelligencePrefs({
        enabled,
        layout: advancedLayoutRef.current,
        panelExpanded: advancedPanelsExpandedRef.current,
      });
    },
    [],
  );
  const setAdvancedLayout = useCallback(
    (layout: 'compact' | 'expanded') => {
      setAdvancedLayoutState(layout);
      persistProIntelligencePrefs({
        enabled: proIntelligenceModeRef.current,
        layout,
        panelExpanded: advancedPanelsExpandedRef.current,
      });
    },
    [],
  );
  const setAdvancedPanelExpanded = useCallback(
    (panelId: string, expanded: boolean) => {
      setAdvancedPanelsExpanded((prev) => {
        const next = { ...prev, [panelId]: expanded };
        persistProIntelligencePrefs({
          enabled: proIntelligenceModeRef.current,
          layout: advancedLayoutRef.current,
          panelExpanded: next,
        });
        return next;
      });
    },
    [],
  );
  const isAdvancedPanelExpanded = useCallback((panelId: string) => {
    const v = advancedPanelsExpanded[panelId];
    if (v !== undefined) return v;
    // Market conditions panel: start collapsed until the user opens it (preference persists once toggled).
    if (panelId === 'early-regime-warning') return false;
    return true;
  }, [advancedPanelsExpanded]);
  const lastSignalRef = useRef<Record<string, { emittedAt: number; setupScore: number; refPrice: number; atr: number }>>({});
  const lastEmittedCandleTsRef = useRef<Record<string, number>>({});
  const signalBookRef = useRef<Record<string, CryptoSignal>>({});
  const lifecycleRef = useRef<Record<string, CandidateLifecycle>>(loadLifecycleRef());
  const marketMemoryRef = useRef<Record<string, MarketMemorySnapshot>>(loadMarketMemoryStore());
  const signalLifecycleStoreRef = useRef<SignalLifecycleTrackerStore>(loadSignalLifecycleStore());
  const regimePredictorStoreRef = useRef<Record<string, RegimePredictorState>>(loadRegimePredictorStore());
  const candlesRef = useRef<CandleStore>({});
  const tickersRef = useRef<Record<string, SymbolTicker>>({});
  const wsConnectedRef = useRef(false);
  const streamReadyRef = useRef(false);
  const didPrintDeterminismRef = useRef(false);
  const tickerFlushRafRef = useRef<number | null>(null);
  const pendingWSCandlesRef = useRef<NormalizedKline[]>([]);
  const biasSideBySymbolRef = useRef<Record<string, 'long' | 'short'>>({});
  const userAdaptationRef = useRef<UserAdaptationStore>(loadUserAdaptationStore());
  const [adaptationTick, setAdaptationTick] = useState(0);
  const strategyPersonalityModeRef = useRef<StrategyPersonalityMode>(strategyPersonalityMode);
  strategyPersonalityModeRef.current = strategyPersonalityMode;
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const engineBridgeRef = useRef<{ backfillNewSymbols: (symbols: string[]) => Promise<void> } | null>(null);
  const scannedTickerExtrasRef = useRef<string[]>([]);
  const pendingKlineBackfillRef = useRef<string[]>([]);
  const prevKlineSymbolsRef = useRef<string[]>([...STREAM_SYMBOLS]);
  const dirtyPersistRef = useRef({
    signalLifecycle: false,
    marketMemory: false,
    regimePredictor: false,
    lifecycle: false,
    userAdaptation: false,
    aiSnapshot: false,
  });

  const schedulePersistRef = useRef(() => {});
  schedulePersistRef.current = () => {
    if (persistTimerRef.current != null) return;
    persistTimerRef.current = setTimeout(() => {
      persistTimerRef.current = null;
      const d = dirtyPersistRef.current;
      if (d.signalLifecycle) { persistSignalLifecycleStore(signalLifecycleStoreRef.current); d.signalLifecycle = false; }
      if (d.marketMemory) { persistMarketMemoryStore(marketMemoryRef.current); d.marketMemory = false; }
      if (d.regimePredictor) { persistRegimePredictorStore(regimePredictorStoreRef.current); d.regimePredictor = false; }
      if (d.lifecycle) { persistLifecycleRef(lifecycleRef.current); d.lifecycle = false; }
      if (d.userAdaptation) { persistUserAdaptationStore(userAdaptationRef.current); d.userAdaptation = false; }
      if (d.aiSnapshot) { persistAiSnapshotStore(aiSnapshotStoreRef.current); d.aiSnapshot = false; }
    }, 5_000);
  };

  const registerSignalFollowed = useCallback((signal: CryptoSignal) => {
    userAdaptationRef.current = registerSignalFollow(userAdaptationRef.current, {
      setupType: signal.setupType,
      riskLevel: signal.riskLevel ?? 'moderate',
      counterTrend: signal.facts?.counterTrend === 'yes',
    });
    dirtyPersistRef.current.userAdaptation = true;
    schedulePersistRef.current();
    // adaptationTick increment already triggers a re-render for userAdaptation consumers.
    setAdaptationTick((n) => n + 1);
  }, []);

  useEffect(() => {
    scannedTickerExtrasRef.current = scannerTickerExtras;
  }, [scannerTickerExtras]);

  useEffect(() => {
    let cancelled = false;
    const cancelledRef = { current: false };
    const backfillGenRef = { current: 0 };

    function getKlineSymbols(): string[] {
      return mergeScannerKlineSymbols(scannedTickerExtrasRef.current);
    }

    if (import.meta.env.DEV && !didPrintDeterminismRef.current) {
      didPrintDeterminismRef.current = true;
      const check = runScannerDeterminismCheck();
      // Dev-only visibility: verifies deterministic first pass and cooldown/dedup on second pass.
      console.log('[Sigflo][Engine] determinism pass 1', check.firstPass);
      console.log('[Sigflo][Engine] determinism pass 2', check.secondPass);
    }

    // Build the shared stores/callbacks bags that enginePipeline and engineBootstrap use.
    const engineStores: EngineStores = {
      candlesRef,
      tickersRef,
      signalBookRef,
      lifecycleRef,
      marketMemoryRef,
      signalLifecycleStoreRef,
      regimePredictorStoreRef,
      aiSnapshotStoreRef,
      userAdaptationRef,
      lastSignalRef,
      lastEmittedCandleTsRef,
      biasSideBySymbolRef,
      streamReadyRef,
      wsConnectedRef,
      strategyPersonalityModeRef,
      dirtyPersistRef,
      schedulePersistRef,
    };
    const engineCallbacks: PipelineCallbacks = {
      setEngineState: setState,
      setLiveTickersBySymbol,
      setAdaptationTick,
      getKlineSymbols,
      streamSymbols: STREAM_SYMBOLS,
    };
    const bootstrapCtx: BootstrapContext = {
      stores: engineStores,
      callbacks: engineCallbacks,
      cancelledRef,
      backfillGenRef,
      pendingWSCandlesRef,
    };

    // Convenience wrappers that keep WS callbacks concise.
    function pushState(
      mode: SignalEngineState['mode'],
      connection: SignalEngineState['connection'],
      error?: string,
    ) {
      pushEngineState(engineStores, engineCallbacks, mode, connection, error);
    }
    function recompute(symbol: string, mode: SignalEngineState['mode']) {
      recomputeForSymbol(engineStores, engineCallbacks, symbol, mode);
    }


    // ---------------------------------------------------------------------------
    // Bootstrap + WS
    // ---------------------------------------------------------------------------



    engineBridgeRef.current = {
      backfillNewSymbols: (symbols) => backfillNewSymbols(bootstrapCtx, symbols),
    };
    const pending = pendingKlineBackfillRef.current;
    if (pending.length > 0) {
      pendingKlineBackfillRef.current = [];
      void backfillNewSymbols(bootstrapCtx, pending);
    }



    // WS stream:
    // - keep tickers fresh
    // - process closed candles only
    // - feed 15m closed bars through detector pipeline
    let startupDone = false;

    void backfillFromRest(bootstrapCtx, 'startup').then(() => {
      if (cancelled) return;
      const klineSymbols = getKlineSymbols();
      const missing = klineSymbols.filter((s) => (candlesRef.current[s]?.['15']?.length ?? 0) < 60);
      if (missing.length > 0) void backfillNewSymbols(bootstrapCtx, missing);
      if (cancelledRef.current) return;
      startupDone = true;
      exchangeManager.current.connectWebSocket({
        klineSymbols: getKlineSymbols(),
        tickerSymbols: getKlineSymbols(),
        includeTickers: true,
        onLog: DEBUG ? (msg: string) => console.log(`[Sigflo][Engine] ${msg}`) : undefined,
        onConnectionChange: (connection) => {
          wsConnectedRef.current = connection === 'connected';
          if (connection === 'connected') {
            if (startupDone) {
              void backfillFromRest(bootstrapCtx, 'reconnect').then(() => {
                pushState('WS', 'connected');
              });
            }
            return;
          }
          pushState(streamReadyRef.current ? 'REST' : 'OFFLINE', connection);
        },
        onTicker: (ticker) => {
          tickersRef.current[ticker.symbol] = ticker;
          if (tickerFlushRafRef.current != null) return;
          tickerFlushRafRef.current = window.requestAnimationFrame(() => {
            tickerFlushRafRef.current = null;
            setLiveTickersBySymbol({ ...tickersRef.current });
          });
        },
        onKline: (kline) => {
          const interval = kline.interval;
          const symbol = kline.symbol;
          if (!candlesRef.current[symbol]) candlesRef.current[symbol] = emptyIntervalCandles();
          candlesRef.current[symbol][interval] = upsertCandle(candlesRef.current[symbol][interval], {
            ts: kline.ts,
            open: kline.open,
            high: kline.high,
            low: kline.low,
            close: kline.close,
            volume: kline.volume,
            isClosed: kline.confirmed,
          });
          // Closed-candle event is the only trigger input for signal generation.
          if (!kline.confirmed) return;
          if (DEBUG) console.log(`[Sigflo][Engine] closed candle received ${symbol} ${interval}`);
          if (!streamReadyRef.current) {
            if (interval === '15') pendingWSCandlesRef.current.push(kline);
            return;
          }
          if (interval === '15') recompute(symbol, 'WS');
        },
      });
    });

    const healthSummaryTimer =
      import.meta.env.DEV
        ? window.setInterval(() => logScannerHealthSummary(), 60_000)
        : undefined;
    // REST polling fallback when WS stays disconnected.
    const restPollTimer = window.setInterval(() => {
      if (wsConnectedRef.current) return;
      if (streamReadyRef.current) void backfillFromRest(bootstrapCtx, 'reconnect');
    }, 60_000);

    return () => {
      if (healthSummaryTimer != null) window.clearInterval(healthSummaryTimer);
      window.clearInterval(restPollTimer);
      cancelled = true;
      cancelledRef.current = true;
      pendingWSCandlesRef.current = [];
      if (tickerFlushRafRef.current != null) {
        window.cancelAnimationFrame(tickerFlushRafRef.current);
        tickerFlushRafRef.current = null;
      }
      if (persistTimerRef.current != null) {
        clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
      }
      /* eslint-disable react-hooks/exhaustive-deps */
      const d = dirtyPersistRef.current;
      const marketMemory = marketMemoryRef.current;
      const regimePredictor = regimePredictorStoreRef.current;
      const lifecycle = lifecycleRef.current;
      const userAdaptation = userAdaptationRef.current;
      const aiSnapshot = aiSnapshotStoreRef.current;
      /* eslint-enable react-hooks/exhaustive-deps */
      if (d.signalLifecycle) persistSignalLifecycleStore(signalLifecycleStoreRef.current);
      if (d.marketMemory) persistMarketMemoryStore(marketMemory);
      if (d.regimePredictor) persistRegimePredictorStore(regimePredictor);
      if (d.lifecycle) persistLifecycleRef(lifecycle);
      if (d.userAdaptation) persistUserAdaptationStore(userAdaptation);
      if (d.aiSnapshot) persistAiSnapshotStore(aiSnapshot);
      exchangeManager.current.disconnectWebSocket();
      engineBridgeRef.current = null;
    };
  }, []);

  useEffect(() => {
    const klineSymbols = mergeScannerKlineSymbols(scannerTickerExtras);
    exchangeManager.current.updateTickerSymbols(mergedTickerSymbols);
    exchangeManager.current.updateKlineSymbols(klineSymbols);

    const prev = new Set(prevKlineSymbolsRef.current);
    const added = klineSymbols.filter((s) => !prev.has(s));
    prevKlineSymbolsRef.current = klineSymbols;

    if (added.length > 0) {
      if (engineBridgeRef.current) {
        void engineBridgeRef.current.backfillNewSymbols(added);
      } else {
        pendingKlineBackfillRef.current = [...new Set([...pendingKlineBackfillRef.current, ...added])];
      }
    }
  }, [mergedTickerSymbols, scannerTickerExtras]);

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
      adaptationTick,
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
