/**
 * enginePipeline.ts
 *
 * Pure computation helpers extracted from SignalEngineContext.
 * None of these functions access React refs or call React hooks.
 * They accept the current snapshot of mutable stores as plain values
 * and return new values — easy to unit-test without React.
 */

import { buildAllSignalsFromMarket, inferMarketRegime } from '@/lib/signalDetectors';
import { timingStatePriority, coreMetrics } from '@/lib/detectors/shared';
import { isSignalTimingTriggered } from '@/lib/marketScannerRows';
import { atr } from '@/lib/indicators';
import { updateMarketMemory, type MarketMemorySnapshot } from '@/lib/marketMemory';
import {
  STRATEGY_PERSONALITY_PROFILES,
  type StrategyPersonalityMode,
} from '@/lib/strategyPersonality';
import { appendAiSnapshotIfTriggered, findActiveLifecycleEvent } from '@/lib/aiSnapshotLog';
import { updateRegimePredictor } from '@/lib/regimePredictor';
import {
  deriveAdaptiveFeedback,
  registerSignalLifecycleEvent,
  updateSignalLifecycleOutcomes,
  type SignalLifecycleTrackerStore,
} from '@/lib/signalLifecycleTracker';
import { recordScannerDiagnostic } from '@/lib/scannerDiagnostics';
import { SCANNER_LIFECYCLE_CONFIG } from '@/lib/scannerConfig';
import {
  explainNotTriggered,
  recordScannerPipelineReport,
} from '@/lib/scannerPipelineHealth';
import {
  adaptationConfidenceAdjustment,
  registerSignalImpression,
  type UserAdaptationStore,
} from '@/lib/userAdaptation';
import { signalEmitKey, signalPairToLinearKey } from '@/lib/engineUtils';
import {
  ENGINE_EMIT_CONFIG,
  evaluateEmitGate,
} from '@/lib/scannerEngineConfig';
import { shouldAnnounceScannerBiasFlip } from '@/lib/biasFlipNotifyGate';
import { emitGlobalAnnouncement } from '@/lib/globalAnnouncements';
import type { CandidateLifecycle } from '@/lib/timingLifecycle';
import type { Candle, SymbolTicker } from '@/types/market';
import type { AiSnapshotStore } from '@/types/aiSnapshot';
import type { CryptoSignal, SignalSetupType, SignalSide } from '@/types/signal';
import type { RegimePredictorOutput, RegimePredictorState } from '@/types/regimePredictor';

const DEBUG = import.meta.env.DEV || !!(globalThis as Record<string, unknown>).__SIGFLO_DEBUG__;

export type EngineMode = 'REST' | 'WS' | 'OFFLINE';
export type EngineConnection = 'connected' | 'reconnecting' | 'disconnected';
export type CandleStore = Record<string, Record<string, Candle[]>>;

export type DirtyFlags = {
  signalLifecycle: boolean;
  marketMemory: boolean;
  regimePredictor: boolean;
  lifecycle: boolean;
  userAdaptation: boolean;
  aiSnapshot: boolean;
};

/** Mutable snapshot of all engine stores — passed by-reference so mutations are reflected. */
export type EngineStores = {
  candlesRef: { current: CandleStore };
  tickersRef: { current: Record<string, SymbolTicker> };
  signalBookRef: { current: Record<string, CryptoSignal> };
  lifecycleRef: { current: Record<string, CandidateLifecycle> };
  marketMemoryRef: { current: Record<string, MarketMemorySnapshot> };
  signalLifecycleStoreRef: { current: SignalLifecycleTrackerStore };
  regimePredictorStoreRef: { current: Record<string, RegimePredictorState> };
  aiSnapshotStoreRef: { current: AiSnapshotStore };
  userAdaptationRef: { current: UserAdaptationStore };
  lastSignalRef: { current: Record<string, { emittedAt: number; setupScore: number; refPrice: number; atr: number }> };
  lastEmittedCandleTsRef: { current: Record<string, number> };
  biasSideBySymbolRef: { current: Record<string, 'long' | 'short'> };
  streamReadyRef: { current: boolean };
  wsConnectedRef: { current: boolean };
  strategyPersonalityModeRef: { current: StrategyPersonalityMode };
  dirtyPersistRef: { current: DirtyFlags };
  schedulePersistRef: { current: () => void };
};

export type PipelineCallbacks = {
  /** React setState dispatcher — schedules a re-render with the new engine snapshot. */
  setEngineState: (updater: (prev: {
    signals: CryptoSignal[];
    loading: boolean;
    mode: EngineMode;
    connection: EngineConnection;
    error?: string;
    outcomeFeedbackSummary: string[];
    lifecycleAnalytics: SignalLifecycleTrackerStore;
    regimePredictorBySymbol: Record<string, RegimePredictorOutput>;
    aiSnapshotLog: AiSnapshotStore;
  }) => typeof prev) => void;
  setLiveTickersBySymbol: (t: Record<string, SymbolTicker>) => void;
  setAdaptationTick: (updater: (n: number) => number) => void;
  /** Returns all symbols currently being tracked (core + extras). */
  getKlineSymbols: () => string[];
  /** Tracked symbols for the bias-flip announcement loop. */
  streamSymbols: string[];
};

// ---------------------------------------------------------------------------
// Ranking
// ---------------------------------------------------------------------------

export function rankCryptoSignals(signals: CryptoSignal[]): CryptoSignal[] {
  return [...signals].sort((a, b) => {
    const triggeredDelta =
      (isSignalTimingTriggered(b) ? 1 : 0) - (isSignalTimingTriggered(a) ? 1 : 0);
    if (triggeredDelta !== 0) return triggeredDelta;
    const timingDelta = timingStatePriority(b.timingState) - timingStatePriority(a.timingState);
    if (timingDelta !== 0) return timingDelta;
    return b.setupScore - a.setupScore;
  });
}

export function pickCryptoSignalForSymbol(
  signalBook: Record<string, CryptoSignal>,
  sym: string,
): CryptoSignal | null {
  const matches = Object.values(signalBook).filter(
    (s) => signalPairToLinearKey(s.pair) === sym,
  );
  return rankCryptoSignals(matches)[0] ?? null;
}

// ---------------------------------------------------------------------------
// State push
// ---------------------------------------------------------------------------

export function pushEngineState(
  stores: EngineStores,
  callbacks: PipelineCallbacks,
  mode: EngineMode,
  connection: EngineConnection,
  error?: string,
) {
  const ranked = rankCryptoSignals(Object.values(stores.signalBookRef.current));
  for (const sym of callbacks.streamSymbols) {
    const best = pickCryptoSignalForSymbol(stores.signalBookRef.current, sym);
    if (!best) {
      delete stores.biasSideBySymbolRef.current[sym];
      continue;
    }
    const next = best.side;
    const prev = stores.biasSideBySymbolRef.current[sym];
    if (prev !== undefined && prev !== next && shouldAnnounceScannerBiasFlip(sym)) {
      const shortLabel = sym.replace(/USDT$/i, '');
      emitGlobalAnnouncement({
        id: `bias-${sym}-${Date.now()}`,
        kind: 'bias_flip',
        title: 'Bias changed',
        subtitle: `${shortLabel} ${prev === 'long' ? 'LONG' : 'SHORT'} → ${next === 'long' ? 'LONG' : 'SHORT'}`,
      });
    }
    stores.biasSideBySymbolRef.current[sym] = next;
  }
  callbacks.setEngineState((prev) => ({
    ...prev,
    signals: ranked,
    loading: false,
    mode,
    connection,
    error,
    outcomeFeedbackSummary: stores.signalLifecycleStoreRef.current.generatedInsights.slice(-4).map((x) => x.insight),
    lifecycleAnalytics: stores.signalLifecycleStoreRef.current,
    regimePredictorBySymbol: Object.fromEntries(
      Object.entries(stores.regimePredictorStoreRef.current).map(([sym, row]) => [sym, row.output]),
    ),
    aiSnapshotLog: stores.aiSnapshotStoreRef.current,
  }));
  stores.schedulePersistRef.current();
}

// ---------------------------------------------------------------------------
// Signal book pruning
// ---------------------------------------------------------------------------

function pruneSignalBookForSymbol(stores: EngineStores, symbol: string) {
  const prefix = `${symbol}:`;
  for (const key of Object.keys(stores.signalBookRef.current)) {
    if (key.startsWith(prefix)) delete stores.signalBookRef.current[key];
  }
  for (const key of Object.keys(stores.lifecycleRef.current)) {
    if (key.startsWith(prefix)) delete stores.lifecycleRef.current[key];
  }
}

function pruneStaleSetupKeysForSymbol(stores: EngineStores, symbol: string, activeKeys: Set<string>) {
  const prefix = `${symbol}:`;
  for (const key of Object.keys(stores.signalBookRef.current)) {
    if (key.startsWith(prefix) && !activeKeys.has(key)) delete stores.signalBookRef.current[key];
  }
  for (const key of Object.keys(stores.lifecycleRef.current)) {
    if (key.startsWith(prefix) && !activeKeys.has(key)) delete stores.lifecycleRef.current[key];
  }
}

// ---------------------------------------------------------------------------
// Pipeline health context
// ---------------------------------------------------------------------------

export function pipelineHealthCtx(
  stores: EngineStores,
  mode: EngineMode,
  connection: EngineConnection,
) {
  const triggeredPairs = [
    ...new Set(
      Object.values(stores.signalBookRef.current)
        .filter((s) => isSignalTimingTriggered(s))
        .map((s) => s.pair),
    ),
  ];
  return {
    engineMode: mode,
    connection,
    streamReady: stores.streamReadyRef.current,
    wsConnected: stores.wsConnectedRef.current,
    triggeredPairs,
  };
}

// ---------------------------------------------------------------------------
// Per-symbol recompute
// ---------------------------------------------------------------------------

export function recomputeForSymbol(
  stores: EngineStores,
  callbacks: PipelineCallbacks,
  symbol: string,
  mode: EngineMode,
) {
  const connection: EngineConnection = stores.wsConnectedRef.current ? 'connected' : 'disconnected';
  const healthCtx = () => pipelineHealthCtx(stores, mode, connection);
  const symbolCandles = stores.candlesRef.current[symbol];
  const ticker = stores.tickersRef.current[symbol];
  if (!symbolCandles || !ticker) {
    recordScannerPipelineReport(
      { symbol, stage: 'skip_no_ticker', ts: Date.now() },
      healthCtx(),
    );
    pushEngineState(stores, callbacks, mode, connection);
    return;
  }
  // Strip the currently forming (open) candle so detectors always run on closed bars.
  const raw15m = symbolCandles['15'];
  const openCandleStripped = raw15m.at(-1)?.isClosed === false;
  const candles15m = openCandleStripped ? raw15m.slice(0, -1) : raw15m;
  if (candles15m.length < 60) {
    recordScannerPipelineReport(
      { symbol, stage: 'skip_insufficient_candles', ts: Date.now() },
      healthCtx(),
    );
    if (DEBUG && openCandleStripped) {
      console.log(`[Sigflo][Engine] ${symbol} open candle stripped → only ${candles15m.length} closed bars available`);
    }
    pushEngineState(stores, callbacks, mode, connection);
    return;
  }
  const btc15raw = stores.candlesRef.current.BTCUSDT?.['15'] ?? [];
  const eth15raw = stores.candlesRef.current.ETHUSDT?.['15'] ?? [];
  const btc15 = btc15raw.at(-1)?.isClosed === false ? btc15raw.slice(0, -1) : btc15raw;
  const eth15 = eth15raw.at(-1)?.isClosed === false ? eth15raw.slice(0, -1) : eth15raw;
  if (btc15.length < 60 || eth15.length < 60) {
    recordScannerPipelineReport({ symbol, stage: 'skip_btc_eth_warmup', ts: Date.now() }, healthCtx());
    pushEngineState(stores, callbacks, mode, connection);
    return;
  }
  if (DEBUG && openCandleStripped) {
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
      stores.lifecycleRef.current[signalEmitKey(symbol, setupType, side)],
    previousMarketMemory: stores.marketMemoryRef.current[symbol],
    strategyPersonalityMode: stores.strategyPersonalityModeRef.current,
    strategyPersonalityProfile: STRATEGY_PERSONALITY_PROFILES[stores.strategyPersonalityModeRef.current],
    adaptationConfidenceAdjustmentForSetup: (setupType: SignalSetupType) =>
      adaptationConfidenceAdjustment(stores.userAdaptationRef.current, setupType),
    adaptiveFeedbackForSetup: (setupType: SignalSetupType, side: SignalSide) =>
      deriveAdaptiveFeedback(stores.signalLifecycleStoreRef.current, symbol, setupType, side),
    onReject: (detectorName: string, reason: 'no_signal' | 'confidence_below_threshold', meta?: { confidence?: number; threshold?: number }) => {
      const rejectKey = `${detectorName}:${reason}`;
      rejectCounters[rejectKey] = (rejectCounters[rejectKey] ?? 0) + 1;
      if (DEBUG) {
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
  if (Object.keys(rejectCounters).length > 0 && builtSignals.length === 0) {
    const cm = coreMetrics(candles15m);
    console.log(`[Sigflo][Engine] ${symbol} ALL detectors rejected`, {
      rejectCounters,
      close: cm.close,
      ema20: cm.ema20,
      ema50: cm.ema50,
      rsi: cm.rsiNow,
      atr: cm.atrNow,
      volNow: cm.volNow,
      volAvg: cm.volAvg,
      swingHigh: cm.swingHigh,
      swingLow: cm.swingLow,
    });
  }
  stores.signalLifecycleStoreRef.current = updateSignalLifecycleOutcomes({
    store: stores.signalLifecycleStoreRef.current,
    symbol,
    price: ticker.lastPrice,
    now: Date.now(),
    candleTs: candles15m.at(-1)?.ts ?? Date.now(),
  });
  stores.dirtyPersistRef.current.signalLifecycle = true;
  const nextMemory = updateMarketMemory({
    symbol,
    previous: stores.marketMemoryRef.current[symbol],
    candles15m,
    signal: primaryBuilt?.signal ?? null,
    now: Date.now(),
  });
  stores.marketMemoryRef.current[symbol] = nextMemory;
  stores.dirtyPersistRef.current.marketMemory = true;
  const nextRegimePredictor = updateRegimePredictor({
    previous: stores.regimePredictorStoreRef.current[symbol] ?? null,
    symbol,
    memory: nextMemory,
    candles15m,
    lifecycleEvents: stores.signalLifecycleStoreRef.current.events,
    now: Date.now(),
  });
  stores.regimePredictorStoreRef.current[symbol] = nextRegimePredictor;
  stores.dirtyPersistRef.current.regimePredictor = true;

  function flushAiSnapshot(
    memory: MarketMemorySnapshot,
    crypto: CryptoSignal | null,
    regimePredictorOutput: RegimePredictorOutput,
  ) {
    const activeLifecycle = findActiveLifecycleEvent(stores.signalLifecycleStoreRef.current.events, symbol);
    const snapResult = appendAiSnapshotIfTriggered({
      store: stores.aiSnapshotStoreRef.current,
      symbol,
      price: ticker.lastPrice,
      memory,
      cryptoSignal: crypto,
      activeLifecycle,
      regimePredictor: regimePredictorOutput,
      now: Date.now(),
    });
    if (snapResult.appended) {
      stores.aiSnapshotStoreRef.current = snapResult.store;
      stores.dirtyPersistRef.current.aiSnapshot = true;
      stores.dirtyPersistRef.current.regimePredictor = true;
    }
  }

  flushAiSnapshot(
    nextMemory,
    primaryBuilt?.signal ?? pickCryptoSignalForSymbol(stores.signalBookRef.current, symbol),
    nextRegimePredictor.output,
  );

  if (builtSignals.length === 0) {
    pruneSignalBookForSymbol(stores, symbol);
    recordScannerPipelineReport({ symbol, stage: 'skip_no_detector', ts: Date.now() }, healthCtx());
    pushEngineState(stores, callbacks, mode, connection);
    return;
  }

  const activeKeys = new Set(
    builtSignals.map((entry) => signalEmitKey(symbol, entry.signal.setupType, entry.signal.side)),
  );
  pruneStaleSetupKeysForSymbol(stores, symbol, activeKeys);

  const now = Date.now();
  const lastClosedTs = candles15m.at(-1)?.ts ?? 0;
  const prevCandleTs = stores.lastEmittedCandleTsRef.current[symbol];
  const atrNow = Math.max(0.000001, atr(candles15m, 14).at(-1) ?? 1);
  const priceNow = ticker.lastPrice;
  const personalityCooldown =
    ENGINE_EMIT_CONFIG.cooldownMs *
    (STRATEGY_PERSONALITY_PROFILES[stores.strategyPersonalityModeRef.current]?.cooldownMultiplier ?? 1);

  let anyEmitted = false;
  for (const entry of builtSignals) {
    const key = signalEmitKey(symbol, entry.signal.setupType, entry.signal.side);
    const prev = stores.lastSignalRef.current[key];
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

    stores.signalBookRef.current[key] = entry.signal;
    stores.lifecycleRef.current[key] = entry.lifecycle;

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
    stores.userAdaptationRef.current = registerSignalImpression(stores.userAdaptationRef.current, {
      setupType: entry.signal.setupType,
      riskLevel: entry.signal.riskLevel ?? 'moderate',
      confidence: entry.signal.confidence ?? entry.signal.setupScore,
      counterTrend: entry.signal.facts?.counterTrend === 'yes',
    });
    stores.lastSignalRef.current[key] = {
      emittedAt: now,
      setupScore: entry.signal.setupScore,
      refPrice: priceNow,
      atr: atrNow,
    };
    stores.signalLifecycleStoreRef.current = registerSignalLifecycleEvent({
      store: stores.signalLifecycleStoreRef.current,
      signal: entry.signal,
      symbol,
      atrNow,
      now,
      strategyPersonalityMode: stores.strategyPersonalityModeRef.current,
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
    stores.lastEmittedCandleTsRef.current[symbol] = lastClosedTs;
    stores.dirtyPersistRef.current.userAdaptation = true;
    stores.dirtyPersistRef.current.signalLifecycle = true;
    callbacks.setAdaptationTick((n) => n + 1);
  }
  stores.dirtyPersistRef.current.lifecycle = true;

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
        STRATEGY_PERSONALITY_PROFILES[stores.strategyPersonalityModeRef.current]?.minConfidenceToEmit ?? 45,
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
  pushEngineState(stores, callbacks, mode, connection);
}

export function recomputeAllFromStore(
  stores: EngineStores,
  callbacks: PipelineCallbacks,
  mode: EngineMode,
) {
  for (const symbol of callbacks.getKlineSymbols()) {
    recomputeForSymbol(stores, callbacks, symbol, mode);
  }
}
