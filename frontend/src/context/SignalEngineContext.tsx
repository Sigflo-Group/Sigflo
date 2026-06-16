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
import { buildAllSignalsFromMarket, inferMarketRegime } from '@/lib/signalDetectors';
import { timingStatePriority } from '@/lib/detectors/shared';
import { deriveMarketStatus, isSignalTimingTriggered } from '@/lib/marketScannerRows';
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
import { TRACKED_SYMBOLS, mergeScannerKlineSymbols } from '@/lib/marketScannerRows';
import type { CandidateLifecycle } from '@/lib/timingLifecycle';
import type { NormalizedKline } from '@/core/market-data-interface';
import type { Candle, SymbolTicker } from '@/types/market';
import type { AiSnapshotStore } from '@/types/aiSnapshot';
import type { CryptoSignal, SignalSetupType, SignalSide } from '@/types/signal';
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

import {
  ENGINE_EMIT_CONFIG,
  evaluateEmitGate,
} from '@/lib/scannerEngineConfig';
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
    setAdaptationTick((n) => n + 1);
    setState((prev) => ({ ...prev }));
  }, []);

  useEffect(() => {
    scannedTickerExtrasRef.current = scannerTickerExtras;
  }, [scannerTickerExtras]);

  useEffect(() => {
    let cancelled = false;

    function getKlineSymbols(): string[] {
      return mergeScannerKlineSymbols(scannedTickerExtrasRef.current);
    }

    async function fetchKlinesSafe(symbols: string[]) {
      const settled = await Promise.allSettled(
        symbols.map(async (symbol) => {
          const [candles5m, candles15m] = await Promise.all([
            exchangeManager.current.fetchKlines(symbol, '5', 240),
            exchangeManager.current.fetchKlines(symbol, '15', 240),
          ]);
          return { symbol, candles5m, candles15m };
        }),
      );
      const ok: Array<{ symbol: string; candles5m: Candle[]; candles15m: Candle[] }> = [];
      for (const row of settled) {
        if (row.status === 'fulfilled') {
          ok.push(row.value);
          continue;
        }
        if (DEBUG) console.warn('[Sigflo][Engine] skipped symbol kline backfill', row.reason);
      }
      return ok;
    }

    if (import.meta.env.DEV && !didPrintDeterminismRef.current) {
      didPrintDeterminismRef.current = true;
      const check = runScannerDeterminismCheck();
      // Dev-only visibility: verifies deterministic first pass and cooldown/dedup on second pass.
      console.log('[Sigflo][Engine] determinism pass 1', check.firstPass);
      console.log('[Sigflo][Engine] determinism pass 2', check.secondPass);
    }

    function rankCryptoSignals(signals: CryptoSignal[]): CryptoSignal[] {
      return [...signals].sort((a, b) => {
        const triggeredDelta =
          (isSignalTimingTriggered(b) ? 1 : 0) - (isSignalTimingTriggered(a) ? 1 : 0);
        if (triggeredDelta !== 0) return triggeredDelta;
        const timingDelta = timingStatePriority(b.timingState) - timingStatePriority(a.timingState);
        if (timingDelta !== 0) return timingDelta;
        return b.setupScore - a.setupScore;
      });
    }

    function pickCryptoSignalForSymbol(sym: string): CryptoSignal | null {
      const matches = Object.values(signalBookRef.current).filter(
        (s) => signalPairToLinearKey(s.pair) === sym,
      );
      return rankCryptoSignals(matches)[0] ?? null;
    }

    function pushState(mode: SignalEngineState['mode'], connection: SignalEngineState['connection'], error?: string) {
      const ranked = rankCryptoSignals(Object.values(signalBookRef.current));
      for (const sym of STREAM_SYMBOLS) {
        const best = pickCryptoSignalForSymbol(sym);
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
    async function ingestSymbolBackfill(symbols: string[]) {
      if (symbols.length === 0) return;
      const [tickers, symbolResults] = await Promise.all([
        exchangeManager.current.fetchTickers(symbols),
        fetchKlinesSafe(symbols),
      ]);
      for (const ticker of tickers) tickersRef.current[ticker.symbol] = ticker;
      for (const { symbol, candles5m, candles15m } of symbolResults) {
        candlesRef.current[symbol] = {
          ...emptyIntervalCandles(),
          ...candlesRef.current[symbol],
          '5': candles5m,
          '15': candles15m,
        };
      }
    }

    async function backfillFromRest(reason: 'startup' | 'reconnect') {
      const gen = ++backfillGen;
      if (DEBUG) console.log(`[Sigflo][Engine] REST bootstrap (${reason})`);
      streamReadyRef.current = false;
      const finishBootstrap = (mode: SignalEngineState['mode']) => {
        if (gen !== backfillGen || cancelled) return;
        streamReadyRef.current = true;
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
        pushState(mode, wsConnectedRef.current ? 'connected' : 'disconnected');
      };

      try {
        const tracked = [...TRACKED_SYMBOLS];
        await ingestSymbolBackfill(tracked);
        if (gen !== backfillGen || cancelled) return;
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
        for (const symbol of tracked) recomputeForSymbol(symbol, 'REST');
        const extras = getKlineSymbols().filter((s) => !tracked.includes(s));
        if (extras.length > 0) {
          await ingestSymbolBackfill(extras);
          if (gen !== backfillGen || cancelled) return;
          for (const symbol of extras) recomputeForSymbol(symbol, 'REST');
        }
        recomputeAllFromStore('REST');
        finishBootstrap('REST');
      } catch (err) {
        if (gen !== backfillGen || cancelled) return;
        if (DEBUG) console.warn('[Sigflo][Engine] full bootstrap failed, retrying tracked only', err);
        try {
          await ingestSymbolBackfill([...TRACKED_SYMBOLS]);
          if (gen !== backfillGen || cancelled) return;
          for (const symbol of TRACKED_SYMBOLS) recomputeForSymbol(symbol, 'REST');
          recomputeAllFromStore('REST');
          finishBootstrap('REST');
        } catch (fallbackErr) {
          if (gen !== backfillGen || cancelled) return;
          pushState(
            'OFFLINE',
            wsConnectedRef.current ? 'reconnecting' : 'disconnected',
            fallbackErr instanceof Error ? fallbackErr.message : 'Signal engine failed',
          );
        }
      }
    }

    function pipelineHealthCtx(mode: SignalEngineState['mode'], connection: SignalEngineState['connection']) {
      const triggeredPairs = [
        ...new Set(
          Object.values(signalBookRef.current)
            .filter((s) => isSignalTimingTriggered(s))
            .map((s) => s.pair),
        ),
      ];
      return {
        engineMode: mode,
        connection,
        streamReady: streamReadyRef.current,
        wsConnected: wsConnectedRef.current,
        triggeredPairs,
      };
    }

    function pruneSignalBookForSymbol(symbol: string) {
      const prefix = `${symbol}:`;
      for (const key of Object.keys(signalBookRef.current)) {
        if (key.startsWith(prefix)) delete signalBookRef.current[key];
      }
      for (const key of Object.keys(lifecycleRef.current)) {
        if (key.startsWith(prefix)) delete lifecycleRef.current[key];
      }
    }

    function pruneStaleSetupKeysForSymbol(symbol: string, activeKeys: Set<string>) {
      const prefix = `${symbol}:`;
      for (const key of Object.keys(signalBookRef.current)) {
        if (key.startsWith(prefix) && !activeKeys.has(key)) delete signalBookRef.current[key];
      }
      for (const key of Object.keys(lifecycleRef.current)) {
        if (key.startsWith(prefix) && !activeKeys.has(key)) delete lifecycleRef.current[key];
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
        pushState(mode, connection);
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
        pushState(mode, connection);
        return;
      }
      const btc15raw = candlesRef.current.BTCUSDT?.['15'] ?? [];
      const eth15raw = candlesRef.current.ETHUSDT?.['15'] ?? [];
      const btc15 = btc15raw.at(-1)?.isClosed === false ? btc15raw.slice(0, -1) : btc15raw;
      const eth15 = eth15raw.at(-1)?.isClosed === false ? eth15raw.slice(0, -1) : eth15raw;
      if (btc15.length < 60 || eth15.length < 60) {
        recordScannerPipelineReport({ symbol, stage: 'skip_btc_eth_warmup', ts: Date.now() }, healthCtx());
        pushState(mode, connection);
        return;
      }
      if (import.meta.env.DEV && openCandleStripped) {
        console.log(`[Sigflo][Engine] ${symbol} stripped open 15m candle ts=${raw15m.at(-1)?.ts}, running on ${candles15m.length} closed bars`);
      }
      const raw5m = symbolCandles['5'] ?? [];
      const candles5m = raw5m.at(-1)?.isClosed === false ? raw5m.slice(0, -1) : raw5m;
      const rejectCounters: Record<string, number> = {};
      const regime = inferMarketRegime({ btc15m: btc15, eth15m: eth15 });
      const marketInput = {
        symbol,
        exchange: 'Bybit' as const,
        ticker,
        candles15m,
        candles5m,
        regime,
        previousLifecycleForSetupSide: (setupType: SignalSetupType, side: SignalSide) =>
          lifecycleRef.current[signalEmitKey(symbol, setupType, side)],
        previousMarketMemory: marketMemoryRef.current[symbol],
        strategyPersonalityMode: strategyPersonalityModeRef.current,
        strategyPersonalityProfile: STRATEGY_PERSONALITY_PROFILES[strategyPersonalityModeRef.current],
        adaptationConfidenceAdjustmentForSetup: (setupType: SignalSetupType) =>
          adaptationConfidenceAdjustment(userAdaptationRef.current, setupType),
        adaptiveFeedbackForSetup: (setupType: SignalSetupType, side: SignalSide) =>
          deriveAdaptiveFeedback(signalLifecycleStoreRef.current, symbol, setupType, side),
        onReject: (detectorName: string, reason: 'no_signal' | 'confidence_below_threshold', meta?: { confidence?: number; threshold?: number }) => {
          const rejectKey = `${detectorName}:${reason}`;
          rejectCounters[rejectKey] = (rejectCounters[rejectKey] ?? 0) + 1;
          if (import.meta.env.DEV) {
            console.log(`[Sigflo][Engine] ${symbol} detector rejected`, { detectorName, reason, ...meta });
          }
        },
      };
      const builtSignals = buildAllSignalsFromMarket(marketInput);
      const primaryBuilt =
        builtSignals.length === 0
          ? null
          : (() => {
              const topId = rankCryptoSignals(builtSignals.map((b) => b.signal))[0]?.id;
              return builtSignals.find((b) => b.signal.id === topId) ?? builtSignals[0]!;
            })();
      if (import.meta.env.DEV && Object.keys(rejectCounters).length > 0 && builtSignals.length === 0) {
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
        signal: primaryBuilt?.signal ?? null,
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
        primaryBuilt?.signal ?? pickCryptoSignalForSymbol(symbol),
        nextRegimePredictor.output,
      );

      if (builtSignals.length === 0) {
        pruneSignalBookForSymbol(symbol);
        recordScannerPipelineReport({ symbol, stage: 'skip_no_detector', ts: Date.now() }, healthCtx());
        pushState(mode, connection);
        return;
      }

      const activeKeys = new Set(
        builtSignals.map((entry) => signalEmitKey(symbol, entry.signal.setupType, entry.signal.side)),
      );
      pruneStaleSetupKeysForSymbol(symbol, activeKeys);

      const now = Date.now();
      const lastClosedTs = candles15m.at(-1)?.ts ?? 0;
      const prevCandleTs = lastEmittedCandleTsRef.current[symbol];
      const atrNow = Math.max(0.000001, atr(candles15m, 14).at(-1) ?? 1);
      const priceNow = ticker.lastPrice;
      const personalityCooldown =
        ENGINE_EMIT_CONFIG.cooldownMs *
        (STRATEGY_PERSONALITY_PROFILES[strategyPersonalityModeRef.current]?.cooldownMultiplier ?? 1);

      let anyEmitted = false;
      for (const entry of builtSignals) {
        const key = signalEmitKey(symbol, entry.signal.setupType, entry.signal.side);
        const prev = lastSignalRef.current[key];
        const emitGate = evaluateEmitGate({
          now,
          prev,
          signalSetupScore: entry.signal.setupScore,
          priceNow,
          atrNow,
          lastClosedTs,
          prevCandleTs,
          cooldownMs: personalityCooldown,
        });
        const { emit: shouldEmit } = emitGate;

        signalBookRef.current[key] = entry.signal;
        lifecycleRef.current[key] = entry.lifecycle;

        if (!shouldEmit) {
          if (DEBUG) {
            console.log('[DETECTOR LIFECYCLE]', {
              symbol,
              key,
              setupType: entry.signal.setupType,
              side: entry.signal.side,
              timingState: entry.signal.timingState,
              suppressReason: 'cooldown',
            });
          }
          continue;
        }

        anyEmitted = true;
        userAdaptationRef.current = registerSignalImpression(userAdaptationRef.current, {
          setupType: entry.signal.setupType,
          riskLevel: entry.signal.riskLevel ?? 'moderate',
          confidence: entry.signal.confidence ?? entry.signal.setupScore,
          counterTrend: entry.signal.facts?.counterTrend === 'yes',
        });
        lastSignalRef.current[key] = {
          emittedAt: now,
          setupScore: entry.signal.setupScore,
          refPrice: priceNow,
          atr: atrNow,
        };
        signalLifecycleStoreRef.current = registerSignalLifecycleEvent({
          store: signalLifecycleStoreRef.current,
          signal: entry.signal,
          symbol,
          atrNow,
          now,
          strategyPersonalityMode: strategyPersonalityModeRef.current,
        });
        recordScannerDiagnostic({
          symbol,
          setupScore: entry.signal.setupScore,
          setupType: entry.signal.setupType,
          timingScore: entry.signal.timingScore ?? 0,
          entryFreshnessScore: entry.signal.entryFreshnessScore ?? 0,
          roomToTargetScore: entry.signal.roomToTargetScore ?? 0,
          actionabilityScore: entry.signal.actionabilityScore ?? 0,
          state: entry.signal.timingState ?? 'developing',
          triggerType: entry.signal.triggerType ?? 'unknown',
          idealEntryPrice: entry.signal.idealEntryPrice ?? null,
          currentPrice: ticker.lastPrice,
          atrExtensionFromIdeal:
            entry.signal.idealEntryPrice && atrNow > 0
              ? Math.abs(ticker.lastPrice - entry.signal.idealEntryPrice) / atrNow
              : 0,
          candlesSinceTrigger: entry.signal.candlesSinceTrigger ?? null,
          candlesSincePeakTiming: entry.signal.candlesSincePeakTiming ?? null,
          penalties: entry.signal.penaltyBreakdown ?? {
            candlesLatePenalty: 0,
            atrExtensionPenalty: 0,
            percentExtensionPenalty: 0,
            postTriggerImpulsePenalty: 0,
            crowdedLevelPenalty: 0,
            rrCompressionPenalty: 0,
          },
          positiveFactors: entry.signal.positiveTimingFactors ?? [],
          ts: now,
        });
      }

      if (anyEmitted) {
        lastEmittedCandleTsRef.current[symbol] = lastClosedTs;
        dirtyPersistRef.current.userAdaptation = true;
        dirtyPersistRef.current.signalLifecycle = true;
        setAdaptationTick((n) => n + 1);
      }
      dirtyPersistRef.current.lifecycle = true;

      const reportSignal = primaryBuilt!.signal;
      recordScannerPipelineReport(
        {
          symbol,
          stage: anyEmitted ? 'emitted' : 'emitted_cooldown_suppressed',
          setupType: reportSignal.setupType,
          side: reportSignal.side,
          timingState: reportSignal.timingState,
          setupScore: reportSignal.setupScore,
          actionabilityScore: reportSignal.actionabilityScore,
          entryFreshnessScore: reportSignal.entryFreshnessScore,
          timingScore: reportSignal.timingScore,
          triggerHit: reportSignal.triggerType != null && reportSignal.triggerType !== 'unknown',
          triggerType: reportSignal.triggerType,
          emitThreshold:
            STRATEGY_PERSONALITY_PROFILES[strategyPersonalityModeRef.current]?.minConfidenceToEmit ?? 45,
          notTriggeredReasons: explainNotTriggered({
            timingState: reportSignal.timingState,
            triggerHit: reportSignal.triggerType != null && reportSignal.triggerType !== 'unknown',
            actionabilityScore: reportSignal.actionabilityScore,
            entryFreshnessScore: reportSignal.entryFreshnessScore,
            triggeredActionabilityMin: SCANNER_LIFECYCLE_CONFIG.triggeredActionabilityMin,
            triggeredFreshnessMin: SCANNER_LIFECYCLE_CONFIG.triggeredFreshnessMin,
          }),
          ts: now,
        },
        healthCtx(),
      );
      flushAiSnapshot(nextMemory, reportSignal, nextRegimePredictor.output);
      pushState(mode, connection);
    }

    function recomputeAllFromStore(mode: SignalEngineState['mode']) {
      for (const symbol of getKlineSymbols()) recomputeForSymbol(symbol, mode);
    }

    async function backfillNewSymbols(symbols: string[]) {
      if (symbols.length === 0) return;
      if (DEBUG) console.log(`[Sigflo][Engine] backfill new kline symbols`, symbols);
      try {
        const [tickers, symbolResults] = await Promise.all([
          exchangeManager.current.fetchTickers(symbols),
          fetchKlinesSafe(symbols),
        ]);
        if (cancelled) return;
        for (const ticker of tickers) tickersRef.current[ticker.symbol] = ticker;
        for (const { symbol, candles5m, candles15m } of symbolResults) {
          candlesRef.current[symbol] = {
            ...emptyIntervalCandles(),
            ...candlesRef.current[symbol],
            '5': candles5m,
            '15': candles15m,
          };
        }
        const mode: SignalEngineState['mode'] = streamReadyRef.current ? 'WS' : 'REST';
        for (const symbol of symbols) recomputeForSymbol(symbol, mode);
        setLiveTickersBySymbol({ ...tickersRef.current });
        pushState(mode, wsConnectedRef.current ? 'connected' : 'disconnected');
      } catch (err) {
        if (cancelled) return;
        if (DEBUG) console.warn('[Sigflo][Engine] backfill new symbols failed', err);
      }
    }

    engineBridgeRef.current = { backfillNewSymbols };
    const pending = pendingKlineBackfillRef.current;
    if (pending.length > 0) {
      pendingKlineBackfillRef.current = [];
      void backfillNewSymbols(pending);
    }

    // WS stream:
    // - keep tickers fresh
    // - process closed candles only
    // - feed 15m closed bars through detector pipeline
    let startupDone = false;

    void backfillFromRest('startup').then(() => {
      if (cancelled) return;
      const klineSymbols = getKlineSymbols();
      const missing = klineSymbols.filter((s) => (candlesRef.current[s]?.['15']?.length ?? 0) < 60);
      if (missing.length > 0) void backfillNewSymbols(missing);
      if (cancelled) return;
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
    });

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
