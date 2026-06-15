import { calculateSetupScore } from '@/lib/setupScore';
import {
  runAllDetectorsForLab,
  type DetectorOutput,
  type LabDetectorResults,
  type MarketRegime,
} from '@/lib/signalDetectors';
import {
  evaluateTimingLifecycle,
  type CandidateLifecycle,
} from '@/lib/timingLifecycle';
import { deriveIndicatorSnapshot } from '@/engine/indicators';
import type { Candle as EngineCandle, IndicatorSnapshot } from '@/engine/types';
import type { PlaybackCandle } from '@/types/market';
import type { SetupScoreBreakdown, SignalSide } from '@/types/signal';
import type { ScannerTimingState, ScannerTriggerType } from '@/lib/scannerConfig';

export type SetupType = 'breakout' | 'pullback' | 'overextended';

export type DerivedIndicators = {
  ema20: number;
  ema50: number;
  rsi14: number;
  atr14: number;
  avgVolume20: number;
  swingHigh: number;
  swingLow: number;
  breakoutDistance: number;
  pullbackDepth: number;
};

/** Lab-shaped candidate that the ScannerLabScreen renders per detector row. */
export type SignalCandidate = {
  setupType: SetupType;
  directionBias: SignalSide;
  scoreBreakdown: SetupScoreBreakdown;
  setupScore: number;
  tags: string[];
  explanationFacts: Record<string, number | string | boolean>;
};

export type DetectorEvaluation = {
  /** Production detector returned a candidate on this bar. */
  detectorQualified: boolean;
  /** Timing lifecycle reached triggered (parity with live engine). */
  timingTriggered: boolean;
  /** @deprecated Use timingTriggered — kept for callers that expect this name. */
  triggered: boolean;
  setupType: SetupType;
  timingState?: ScannerTimingState;
  triggerType?: ScannerTriggerType;
  reasons: string[];
  scoreBreakdown?: SetupScoreBreakdown;
  explanationFacts?: Record<string, number | string | boolean>;
  candidate?: SignalCandidate;
  lifecycle?: CandidateLifecycle;
};

/** Kept on playback config for API stability; ignored — engine uses fixed production thresholds. */
export type DetectorOptions = {
  useVolumeFilter: boolean;
  useRsiFilter: boolean;
  compressionThreshold: number;
};

export const DEFAULT_DETECTOR_OPTIONS: DetectorOptions = {
  useVolumeFilter: true,
  useRsiFilter: true,
  compressionThreshold: 1.4,
};

/** Same minimum bar count as production detectors. */
export const MIN_ENGINE_BARS = 60;

export function playbackCandlesToEngine(candles: PlaybackCandle[]): EngineCandle[] {
  return candles.map((c) => ({
    ts: c.timestamp,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
    isClosed: c.isClosed,
  }));
}

export function engineSnapshotToDerivedIndicators(snap: IndicatorSnapshot): DerivedIndicators {
  return {
    ema20: snap.ema20,
    ema50: snap.ema50,
    rsi14: snap.rsi14,
    atr14: snap.atr14,
    avgVolume20: snap.avgVolume20,
    swingHigh: snap.localSwingHigh,
    swingLow: snap.localSwingLow,
    breakoutDistance: snap.breakoutDistanceAtr,
    pullbackDepth: snap.pullbackDepthAtr,
  };
}

export function isLabTimingTriggered(lifecycle: CandidateLifecycle): boolean {
  if (lifecycle.state === 'triggered') return true;
  if (
    lifecycle.state === 'ready' &&
    lifecycle.trigger.triggerType != null &&
    lifecycle.trigger.triggerType !== 'unknown'
  ) {
    return true;
  }
  return false;
}

function emptyEvaluation(
  setupType: SetupType,
  reasons: string[],
): DetectorEvaluation {
  return {
    detectorQualified: false,
    timingTriggered: false,
    triggered: false,
    setupType,
    reasons,
  };
}

// ---------------------------------------------------------------------------
// Production detector → lab evaluation mapping
// ---------------------------------------------------------------------------

function productionOutputToCandidate(output: DetectorOutput): SignalCandidate {
  return {
    setupType: output.setupType,
    directionBias: output.side,
    scoreBreakdown: output.breakdown,
    setupScore: calculateSetupScore(output.breakdown),
    tags: [...output.setupTags],
    explanationFacts: {
      emaTrend: output.facts.emaTrend ?? 'neutral',
      rsi: output.facts.rsi ?? 50,
      volumeRatio: output.facts.volumeRatio ?? 1,
      breakoutDistanceAtr: output.facts.distanceToBreakoutAtr ?? 0,
      pullbackDepthAtr: output.facts.pullbackDepthAtr ?? 0,
      extensionAtr: output.facts.extensionAtr ?? 0,
      confidence: output.facts.confidence ?? 0,
    },
  };
}

/** Pick the higher-scoring of two production detector outputs. */
function bestOutput(
  a: DetectorOutput | null,
  b: DetectorOutput | null,
): DetectorOutput | null {
  if (!a) return b;
  if (!b) return a;
  return calculateSetupScore(a.breakdown) >= calculateSetupScore(b.breakdown) ? a : b;
}

function timingReason(lifecycle: CandidateLifecycle): string {
  if (isLabTimingTriggered(lifecycle)) {
    return `Timing trigger: ${lifecycle.trigger.triggerType.replaceAll('_', ' ')}`;
  }
  if (lifecycle.state === 'ready') return 'Timing ready — waiting for entry confirmation on this setup type.';
  if (lifecycle.state === 'extended') return 'Timing extended — move may be late.';
  if (lifecycle.state === 'expired') return 'Prior timing window expired.';
  return 'Timing developing — trigger conditions not met yet.';
}

function evaluationFromOutput(
  setupType: SetupType,
  output: DetectorOutput | null,
  lastClosed: boolean,
  barCount: number,
  engineCandles: EngineCandle[],
  previousLifecycle?: CandidateLifecycle,
): DetectorEvaluation {
  if (barCount < MIN_ENGINE_BARS) {
    return emptyEvaluation(setupType, [
      `Need at least ${MIN_ENGINE_BARS} candles in window (${barCount} visible, engine parity)`,
    ]);
  }
  if (!lastClosed) {
    return emptyEvaluation(setupType, ['Last candle is not closed']);
  }
  if (!output) {
    return emptyEvaluation(setupType, ['Engine: long/short pair did not qualify on this bar']);
  }

  const candidate = productionOutputToCandidate(output);
  const { lifecycle } = evaluateTimingLifecycle({
    setupType: output.setupType,
    side: output.side,
    setupScore: candidate.setupScore,
    candles: engineCandles,
    previous: previousLifecycle,
  });
  const timingTriggered = isLabTimingTriggered(lifecycle);
  const reasons = [
    `${output.biasLabel} — detector qualified`,
    timingReason(lifecycle),
  ];

  return {
    detectorQualified: true,
    timingTriggered,
    triggered: timingTriggered,
    setupType,
    timingState: lifecycle.state,
    triggerType: lifecycle.trigger.triggerType,
    reasons,
    scoreBreakdown: output.breakdown,
    explanationFacts: candidate.explanationFacts,
    candidate,
    lifecycle,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Runs the six production detectors (from src/lib/signalDetectors.ts) against
 * the visible candle window and returns per-row evaluations for the Scanner Lab.
 * Regime defaults to 'neutral' for playback context; pass a real regime to
 * match live scanner sensitivity exactly.
 */
export function runScannerLabEngineEvaluations(
  _symbol: string,
  visible: PlaybackCandle[],
  regime: MarketRegime = 'neutral',
  previousLifecycleBySetup?: Partial<Record<SetupType, CandidateLifecycle>>,
): {
  indicators: DerivedIndicators;
  evaluations: DetectorEvaluation[];
} {
  const engineCandles = playbackCandlesToEngine(visible);
  const snap = deriveIndicatorSnapshot(engineCandles);
  const indicators = engineSnapshotToDerivedIndicators(snap);
  const last = visible.at(-1);
  const lastClosed = Boolean(last?.isClosed);
  const n = visible.length;

  const results: LabDetectorResults = lastClosed && n >= MIN_ENGINE_BARS
    ? runAllDetectorsForLab(engineCandles, regime)
    : { breakoutLong: null, breakdownShort: null, pullbackLong: null, pullbackShort: null, overextendedLong: null, overextendedShort: null };

  const breakout = bestOutput(results.breakoutLong, results.breakdownShort);
  const pullback = bestOutput(results.pullbackLong, results.pullbackShort);
  const overextended = bestOutput(results.overextendedLong, results.overextendedShort);

  return {
    indicators,
    evaluations: [
      evaluationFromOutput('breakout', breakout, lastClosed, n, engineCandles, previousLifecycleBySetup?.breakout),
      evaluationFromOutput('pullback', pullback, lastClosed, n, engineCandles, previousLifecycleBySetup?.pullback),
      evaluationFromOutput('overextended', overextended, lastClosed, n, engineCandles, previousLifecycleBySetup?.overextended),
    ],
  };
}

/** Snapshot for any window length (charts / seed panel). */
export function deriveIndicators(candles: PlaybackCandle[]): DerivedIndicators {
  return engineSnapshotToDerivedIndicators(deriveIndicatorSnapshot(playbackCandlesToEngine(candles)));
}
