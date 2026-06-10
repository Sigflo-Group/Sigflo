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
import { buildSignalFromMarket, inferMarketRegime } from '@/lib/signalDetectors';
import { atr } from '@/lib/indicators';
import { updateMarketMemory, type MarketMemorySnapshot } from '@/lib/marketMemory';
import {
  DEFAULT_STRATEGY_PERSONALITY_MODE,
  STRATEGY_PERSONALITY_PROFILES,
  type StrategyPersonalityMode,
} from '@/lib/strategyPersonality';
import {
  appendAiSnapshotIfTriggered,
  findActiveLifecycleEvent,
} from '@/lib/aiSnapshotLog';
import {
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
import { SCANNER_LIFECYCLE_CONFIG } from '@/lib/scannerConfig';
import { deriveMarketStatus } from '@/lib/marketScannerRows';
import {
  explainNotTriggered,
  logScannerHealthSummary,
  recordScannerPipelineReport,
} from '@/lib/scannerPipelineHealth';
import {
  adaptationConfidenceAdjustment,
  registerSignalFollow,
  registerSignalImpression,
  type UserAdaptationStore,
} from '@/lib/userAdaptation';
import { TRACKED_SYMBOLS } from '@/lib/marketScannerRows';
import type { CandidateLifecycle } from '@/lib/timingLifecycle';
import type { NormalizedKline } from '@/core/market-data-interface';
import type { Candle, SymbolTicker } from '@/types/market';
import type { AiSnapshotStore } from '@/types/aiSnapshot';
import type { CryptoSignal } from '@/types/signal';
import type { RegimePredictorOutput, RegimePredictorState } from '@/types/regimePredictor';
import { shouldAnnounceScannerBiasFlip } from '@/lib/biasFlipNotifyGate';
import { emitGlobalAnnouncement } from '@/lib/globalAnnouncements';
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
  signalPairToLinearKey,
  signalEmitKey,
  emptyIntervalCandles,
  upsertCandle,
} from '@/lib/engineUtils';

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

const COOLDOWN_MS = 20 * 60 * 1000;
const SCORE_IMPROVE_BYPASS = 6;
const ATR_MOVE_BYPASS = 0.6;
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
    setAdaptationTick((n) => n + 1);
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
      setState((prev) => ({ ...prev,
        signals: ranked,
        loading: false,
        mode,
        connection,
        error,
        outcomeFeedbackSummary: signalLifecycleStoreRef.current.generatedInsights.slice(-4).map((x) => x.insight),
        lifecycleAnalytics: signalLifecycleStoreRef.current,
        regimePredictorBySymbol: Object.fromEntries(
          Object.entries(regimePredictorStoreRef.current).map(([sym, row]) => [sym, row.output]),
        ),
        aiSnapshotLog: aiSnapshotStoreRef.current,
      }));
      schedulePersistRef.current();
    }

    // REST bootstrap / reconnect catch-up:
    // - backfill candles and tickers
    // - refresh in-memory stores
    // - run detector pipeline against fresh snapshots
    let backfillGen = 0;
    async function backfillFromRest(reason: 'startup' | 'reconnect') {
      const gen = ++backfillGen;
      if (DEBUG) console.log(`[Sigflo][Engine] REST bootstrap (${reason})`);
      streamReadyRef.current = false;
      try {
        const [tickers, ...symbolResults] = await Promise.all([
          exchangeManager.current.fetchTickers(STREAM_SYMBOLS),
          ...STREAM_SYMBOLS.map(async (symbol) => {
            const [candles5m, candles15m] = await Promise.all([
              exchangeManager.current.fetchKlines(symbol, '5', 240),
              exchangeManager.current.fetchKlines(symbol, '15', 240),
            ]);
            return { symbol, candles5m, candles15m };
          }),
        ]);
        if (gen !== backfillGen || cancelled) return;
        for (const ticker of tickers) tickersRef.current[ticker.symbol] = ticker;
        for (const { symbol, candles5m, candles15m } of symbolResults) {
          candlesRef.current[symbol] = {
            ...emptyIntervalCandles(),
            ...candlesRef.current[symbol],
            '5': candles5m,
            '15': candles15m,
          };
        }
        // Re-apply any WS confirmed 15m candles that arrived during backfill
        for (const pending of pendingWSCandlesRef.current) {
          if (pending.interval !== '15') continue;
          const symbol = pending.symbol;
          if (!candlesRef.current[symbol]) candlesRef.current[symbol] = emptyIntervalCandles();
          candlesRef.current[symbol]['15'] = upsertCandle(candlesRef.current[symbol]['15'], {
            ts: pending.ts,
            open: pending.open,
            high: pending.high,
            low: pending.low,
            close: pending.close,
            volume: pending.volume,
            isClosed: pending.confirmed,
          });
        }
        recomputeAllFromStore('REST');
        if (gen !== backfillGen || cancelled) return;
        streamReadyRef.current = true;
        // Flush buffered WS recomputation now that store is ready.
        // Deduplicate by (symbol, ts) first — the same confirmed candle can
        // arrive more than once across a reconnect, and calling
        // recomputeForSymbol twice for the same bar bypasses the cooldown
        // check (the first call resets lastSignalRef so the second fires again).
        const seenPending = new Set<string>();
        for (const pending of pendingWSCandlesRef.current) {
          if (pending.interval !== '15') continue;
          const key = `${pending.symbol}:${pending.ts}`;
          if (seenPending.has(key)) continue;
          seenPending.add(key);
          recomputeForSymbol(pending.symbol, 'WS');
        }
        pendingWSCandlesRef.current = [];
        setLiveTickersBySymbol({ ...tickersRef.current });
        pushState('REST', wsConnectedRef.current ? 'connected' : 'disconnected');
      } catch (err) {
        if (gen !== backfillGen || cancelled) return;
        pushState('OFFLINE', wsConnectedRef.current ? 'reconnecting' : 'disconnected', err instanceof Error ? err.message : 'Signal engine failed');
      }
    }

    function pipelineHealthCtx(mode: SignalEngineState['mode'], connection: SignalEngineState['connection']) {
      const triggeredPairs = Object.values(signalBookRef.current)
        .filter((s) => deriveMarketStatus(s) === 'triggered')
        .map((s) => s.pair);
      return {
        engineMode: mode,
        connection,
        streamReady: streamReadyRef.current,
        wsConnected: wsConnectedRef.current,
        triggeredPairs,
      };
    }

    function clearStaleSignalsForSymbol(symbol: string) {
      const prefix = `${symbol}:`;
      for (const key of Object.keys(signalBookRef.current)) {
        if (key.startsWith(prefix)) delete signalBookRef.current[key];
      }
    }

    function recomputeForSymbol(symbol: string, mode: SignalEngineState['mode']) {
      const connection = wsConnectedRef.current ? 'connected' : 'disconnected';
      const healthCtx = () => pipelineHealthCtx(mode, connection);
      const symbolCandles = candlesRef.current[symbol];
      const ticker = tickersRef.current[symbol];
      if (!symbolCandles || !ticker) {
        recordScannerPipelineReport(
          { symbol, stage: 'skip_no_ticker', ts: Date.now() },
          healthCtx(),
        );
        return;
      }
      // Strip the currently forming (open) candle so detectors always run on closed bars.
      // REST backfill marks the last candle isClosed:false; WS marks confirmed candles isClosed:true.
      const raw15m = symbolCandles['15'];
      const openCandleStripped = raw15m.at(-1)?.isClosed === false;
      const candles15m = openCandleStripped ? raw15m.slice(0, -1) : raw15m;
      if (candles15m.length < 60) {
        recordScannerPipelineReport(
          { symbol, stage: 'skip_insufficient_candles', ts: Date.now() },
          healthCtx(),
        );
        if (import.meta.env.DEV && openCandleStripped) {
          console.log(`[Sigflo][Engine] ${symbol} open candle stripped → only ${candles15m.length} closed bars available`);
        }
        return;
      }
      const btc15raw = candlesRef.current.BTCUSDT?.['15'] ?? [];
      const eth15raw = candlesRef.current.ETHUSDT?.['15'] ?? [];
      const btc15 = btc15raw.at(-1)?.isClosed === false ? btc15raw.slice(0, -1) : btc15raw;
      const eth15 = eth15raw.at(-1)?.isClosed === false ? eth15raw.slice(0, -1) : eth15raw;
      if (btc15.length < 60 || eth15.length < 60) {
        recordScannerPipelineReport({ symbol, stage: 'skip_btc_eth_warmup', ts: Date.now() }, healthCtx());
        return;
      }
      if (import.meta.env.DEV && openCandleStripped) {
        console.log(`[Sigflo][Engine] ${symbol} stripped open 15m candle ts=${raw15m.at(-1)?.ts}, running on ${candles15m.length} closed bars`);
      }
      const raw5m = symbolCandles['5'] ?? [];
      const candles5m = raw5m.at(-1)?.isClosed === false ? raw5m.slice(0, -1) : raw5m;
      const rejectCounters: Record<string, number> = {};
      const regime = inferMarketRegime({ btc15m: btc15, eth15m: eth15 });
      const signal = buildSignalFromMarket({
        symbol,
        exchange: 'Bybit',
        ticker,
        candles15m,
        candles5m,
        regime,
        previousLifecycleForSetupSide: (setupType, side) =>
          lifecycleRef.current[signalEmitKey(symbol, setupType, side)],
        previousMarketMemory: marketMemoryRef.current[symbol],
        strategyPersonalityMode: strategyPersonalityModeRef.current,
        strategyPersonalityProfile: STRATEGY_PERSONALITY_PROFILES[strategyPersonalityModeRef.current],
        adaptationConfidenceAdjustmentForSetup: (setupType) =>
          adaptationConfidenceAdjustment(userAdaptationRef.current, setupType),
        adaptiveFeedbackForSetup: (setupType, side) =>
          deriveAdaptiveFeedback(signalLifecycleStoreRef.current, symbol, setupType, side),
        onReject: (detectorName, reason, meta) => {
          const key = `${detectorName}:${reason}`;
          rejectCounters[key] = (rejectCounters[key] ?? 0) + 1;
          if (import.meta.env.DEV) {
            console.log(`[Sigflo][Engine] ${symbol} detector rejected`, { detectorName, reason, ...meta });
          }
        },
      });
      if (import.meta.env.DEV && Object.keys(rejectCounters).length > 0 && !signal) {
        console.log(`[Sigflo][Engine] ${symbol} ALL detectors rejected`, rejectCounters);
      }
      signalLifecycleStoreRef.current = updateSignalLifecycleOutcomes({
        store: signalLifecycleStoreRef.current,
        symbol,
        price: ticker.lastPrice,
        now: Date.now(),
        candleTs: candles15m.at(-1)?.ts ?? Date.now(),
      });
      dirtyPersistRef.current.signalLifecycle = true;
      const nextMemory = updateMarketMemory({
        symbol,
        previous: marketMemoryRef.current[symbol],
        candles15m,
        signal: signal?.signal ?? null,
        now: Date.now(),
      });
      marketMemoryRef.current[symbol] = nextMemory;
      dirtyPersistRef.current.marketMemory = true;
      const nextRegimePredictor = updateRegimePredictor({
        previous: regimePredictorStoreRef.current[symbol] ?? null,
        symbol,
        memory: nextMemory,
        candles15m,
        lifecycleEvents: signalLifecycleStoreRef.current.events,
        now: Date.now(),
      });
      regimePredictorStoreRef.current[symbol] = nextRegimePredictor;
      dirtyPersistRef.current.regimePredictor = true;

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
          dirtyPersistRef.current.aiSnapshot = true;
          dirtyPersistRef.current.regimePredictor = true;
        }
      }

      flushAiSnapshot(
        nextMemory,
        signal?.signal ?? pickCryptoSignalForSymbol(symbol),
        nextRegimePredictor.output,
      );

      if (!signal) {
        clearStaleSignalsForSymbol(symbol);
        recordScannerPipelineReport({ symbol, stage: 'skip_no_detector', ts: Date.now() }, healthCtx());
        return;
      }
      const key = signalEmitKey(symbol, signal.signal.setupType, signal.signal.side);
      const now = Date.now();
      const prev = lastSignalRef.current[key];
      const lastClosedTs = candles15m.at(-1)?.ts ?? 0;
      const prevCandleTs = lastEmittedCandleTsRef.current[symbol];
      const newClosedBar = prevCandleTs == null || lastClosedTs > prevCandleTs;
      const atrNow = Math.max(0.000001, atr(candles15m, 14).at(-1) ?? 1);
      const priceNow = ticker.lastPrice;
      const scoreImproved =
        newClosedBar && prev ? signal.signal.setupScore - prev.setupScore >= SCORE_IMPROVE_BYPASS : false;
      const priceMoved =
        newClosedBar && prev
          ? Math.abs(priceNow - prev.refPrice) / Math.max(atrNow, 0.000001) >= ATR_MOVE_BYPASS
          : false;
      const cooldownPassed =
        !prev ||
        now - prev.emittedAt >= COOLDOWN_MS * (STRATEGY_PERSONALITY_PROFILES[strategyPersonalityModeRef.current]?.cooldownMultiplier ?? 1);
      if (import.meta.env.DEV) {
        console.log(`[Sigflo][Engine] ${symbol} emit gate`, {
          key,
          timingState: signal.signal.timingState,
          triggerType: signal.signal.triggerType,
          confidence: signal.signal.confidence,
          actionabilityScore: signal.signal.actionabilityScore,
          entryFreshnessScore: signal.signal.entryFreshnessScore,
          candlesSinceTrigger: signal.signal.candlesSinceTrigger,
          cooldownPassed,
          scoreImproved,
          priceMoved,
          msSincePrevEmit: prev ? now - prev.emittedAt : null,
          cooldownMs: COOLDOWN_MS * (STRATEGY_PERSONALITY_PROFILES[strategyPersonalityModeRef.current]?.cooldownMultiplier ?? 1),
        });
      }
      if (!(cooldownPassed || scoreImproved || priceMoved)) {
        // Suppress duplicate emit events, but keep live lifecycle/timing state current in UI.
        const prevLifecycleState = lifecycleRef.current[key]?.state;
        const nextLifecycleState = signal.lifecycle.state;
        const lifecycleTransition =
          prevLifecycleState === undefined
            ? 'created'
            : nextLifecycleState === 'expired'
              ? 'expired'
              : prevLifecycleState !== nextLifecycleState
                ? `${prevLifecycleState}→${nextLifecycleState}`
                : 'cached';
        if (DEBUG) console.log('[DETECTOR LIFECYCLE]', {
          symbol,
          key,
          transition: lifecycleTransition,
          prevState: prevLifecycleState ?? null,
          nextState: nextLifecycleState,
          setupType: signal.signal.setupType,
          side: signal.signal.side,
          timingState: signal.signal.timingState,
          confidence: signal.signal.confidence,
          candlesSinceTrigger: signal.signal.candlesSinceTrigger ?? null,
          triggerType: signal.signal.triggerType,
          suppressReason: 'cooldown',
        });
        clearStaleSignalsForSymbol(symbol);
        signalBookRef.current[key] = signal.signal;
        lifecycleRef.current[key] = signal.lifecycle;
        dirtyPersistRef.current.lifecycle = true;
        flushAiSnapshot(nextMemory, signal.signal, nextRegimePredictor.output);
        recordScannerPipelineReport(
          {
            symbol,
            stage: 'emitted_cooldown_suppressed',
            setupType: signal.signal.setupType,
            side: signal.signal.side,
            timingState: signal.signal.timingState,
            setupScore: signal.signal.setupScore,
            actionabilityScore: signal.signal.actionabilityScore,
            entryFreshnessScore: signal.signal.entryFreshnessScore,
            timingScore: signal.signal.timingScore,
            triggerHit: signal.signal.triggerType != null && signal.signal.triggerType !== 'unknown',
            triggerType: signal.signal.triggerType,
            emitThreshold:
              STRATEGY_PERSONALITY_PROFILES[strategyPersonalityModeRef.current]?.minConfidenceToEmit ?? 45,
            notTriggeredReasons: explainNotTriggered({
              timingState: signal.signal.timingState,
              triggerHit: signal.signal.triggerType != null && signal.signal.triggerType !== 'unknown',
              actionabilityScore: signal.signal.actionabilityScore,
              entryFreshnessScore: signal.signal.entryFreshnessScore,
              triggeredActionabilityMin: SCANNER_LIFECYCLE_CONFIG.triggeredActionabilityMin,
              triggeredFreshnessMin: SCANNER_LIFECYCLE_CONFIG.triggeredFreshnessMin,
            }),
            ts: Date.now(),
          },
          healthCtx(),
        );
      pushState(mode, wsConnectedRef.current ? 'connected' : 'disconnected');
      return;
    }
    userAdaptationRef.current = registerSignalImpression(userAdaptationRef.current, {
        setupType: signal.signal.setupType,
        riskLevel: signal.signal.riskLevel ?? 'moderate',
        confidence: signal.signal.confidence ?? signal.signal.setupScore,
        counterTrend: signal.signal.facts?.counterTrend === 'yes',
      });
      dirtyPersistRef.current.userAdaptation = true;
      setAdaptationTick((n) => n + 1);
      const prevLifecycleStateOnEmit = lifecycleRef.current[key]?.state;
      const nextLifecycleStateOnEmit = signal.lifecycle.state;
      const lifecycleTransitionOnEmit =
        prevLifecycleStateOnEmit === undefined
          ? 'created'
          : nextLifecycleStateOnEmit === 'expired'
            ? 'expired'
            : prevLifecycleStateOnEmit !== nextLifecycleStateOnEmit
              ? `${prevLifecycleStateOnEmit}→${nextLifecycleStateOnEmit}`
              : 'updated';
      if (DEBUG) console.log('[DETECTOR LIFECYCLE]', {
        symbol,
        key,
        transition: lifecycleTransitionOnEmit,
        prevState: prevLifecycleStateOnEmit ?? null,
        nextState: nextLifecycleStateOnEmit,
        setupType: signal.signal.setupType,
        side: signal.signal.side,
        timingState: signal.signal.timingState,
        confidence: signal.signal.confidence,
        candlesSinceTrigger: signal.signal.candlesSinceTrigger ?? null,
        triggerType: signal.signal.triggerType,
        suppressReason: null,
      });
      lastSignalRef.current[key] = { emittedAt: now, setupScore: signal.signal.setupScore, refPrice: priceNow, atr: atrNow };
      clearStaleSignalsForSymbol(symbol);
      signalBookRef.current[key] = signal.signal;
      lifecycleRef.current[key] = signal.lifecycle;
      dirtyPersistRef.current.lifecycle = true;
      signalLifecycleStoreRef.current = registerSignalLifecycleEvent({
        store: signalLifecycleStoreRef.current,
        signal: signal.signal,
        symbol,
        atrNow,
        now,
        strategyPersonalityMode: strategyPersonalityModeRef.current,
      });
      dirtyPersistRef.current.signalLifecycle = true;
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
      if (DEBUG) console.log(
        `[Sigflo][Engine] detector triggered ${symbol} ${signal.signal.setupType} ${signal.signal.setupScore} state=${signal.signal.timingState ?? 'n/a'}`
      );
      recordScannerPipelineReport(
        {
          symbol,
          stage: 'emitted',
          setupType: signal.signal.setupType,
          side: signal.signal.side,
          timingState: signal.signal.timingState,
          setupScore: signal.signal.setupScore,
          actionabilityScore: signal.signal.actionabilityScore,
          entryFreshnessScore: signal.signal.entryFreshnessScore,
          timingScore: signal.signal.timingScore,
          triggerHit: signal.signal.triggerType != null && signal.signal.triggerType !== 'unknown',
          triggerType: signal.signal.triggerType,
          emitThreshold:
            STRATEGY_PERSONALITY_PROFILES[strategyPersonalityModeRef.current]?.minConfidenceToEmit ?? 45,
          notTriggeredReasons: explainNotTriggered({
            timingState: signal.signal.timingState,
            triggerHit: signal.signal.triggerType != null && signal.signal.triggerType !== 'unknown',
            actionabilityScore: signal.signal.actionabilityScore,
            entryFreshnessScore: signal.signal.entryFreshnessScore,
            triggeredActionabilityMin: SCANNER_LIFECYCLE_CONFIG.triggeredActionabilityMin,
            triggeredFreshnessMin: SCANNER_LIFECYCLE_CONFIG.triggeredFreshnessMin,
          }),
          ts: now,
        },
        healthCtx(),
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
    let startupDone = false;

    function connectStream() {
      startupDone = true;
      exchangeManager.current.connectWebSocket({
        klineSymbols: STREAM_SYMBOLS,
        tickerSymbols: STREAM_SYMBOLS,
        includeTickers: true,
        onLog: DEBUG ? (msg: string) => console.log(`[Sigflo][Engine] ${msg}`) : undefined,
        onConnectionChange: (connection) => {
          wsConnectedRef.current = connection === 'connected';
          if (connection === 'connected') {
            if (startupDone) {
              void backfillFromRest('reconnect').then(() => {
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
          if (interval === '15') recomputeForSymbol(symbol, 'WS');
        },
      });
    }

    function rebootMarketData(reason: 'startup' | 'reconnect') {
      exchangeManager.current.disconnectWebSocket();
      pendingWSCandlesRef.current = [];
      wsConnectedRef.current = false;
      return backfillFromRest(reason).then(() => {
        if (cancelled) return;
        connectStream();
      });
    }

    exchangeManager.setReconnectHook(() => {
      if (cancelled) return;
      void rebootMarketData('reconnect');
    });

    void rebootMarketData('startup');

    const healthSummaryTimer =
      import.meta.env.DEV
        ? window.setInterval(() => logScannerHealthSummary(), 60_000)
        : undefined;
    // REST polling fallback when WS stays disconnected.
    // Must call backfillFromRest (not recomputeAllFromStore) so we fetch
    // fresh candle data before re-running the pipeline — otherwise signals
    // keep updating their timestamps while replaying the same stale snapshot.
    const restPollTimer = window.setInterval(() => {
      if (wsConnectedRef.current) return;
      if (streamReadyRef.current) void backfillFromRest('reconnect');
    }, 60_000);

    return () => {
      if (healthSummaryTimer != null) window.clearInterval(healthSummaryTimer);
      window.clearInterval(restPollTimer);
      cancelled = true;
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
      exchangeManager.setReconnectHook(null);
      exchangeManager.current.disconnectWebSocket();
    };
  }, []);

  useEffect(() => {
    exchangeManager.current.updateTickerSymbols(mergedTickerSymbols);
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
