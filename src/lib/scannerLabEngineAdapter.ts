import { calculateSetupScore } from '@/lib/setupScore';
import {
  runAllDetectorsForLab,
  type DetectorOutput,
  type LabDetectorResults,
  type MarketRegime,
} from '@/lib/signalDetectors';
import { deriveIndicatorSnapshot } from '@/engine/indicators';
import type { Candle as EngineCandle, IndicatorSnapshot } from '@/engine/types';
import type { PlaybackCandle } from '@/types/market';
import type { SetupScoreBreakdown, SignalSide } from '@/types/signal';

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
  triggered: boolean;
  setupType: SetupType;
  reasons: string[];
  scoreBreakdown?: SetupScoreBreakdown;
  explanationFacts?: Record<string, number | string | boolean>;
  candidate?: SignalCandidate;
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

function evaluationFromOutput(
  setupType: SetupType,
  output: DetectorOutput | null,
  lastClosed: boolean,
  barCount: number,
): DetectorEvaluation {
  if (barCount < MIN_ENGINE_BARS) {
    return {
      triggered: false,
      setupType,
      reasons: [`Need at least ${MIN_ENGINE_BARS} candles in window (engine parity)`],
    };
  }
  if (!lastClosed) {
    return { triggered: false, setupType, reasons: ['Last candle is not closed'] };
  }
  if (!output) {
    return {
      triggered: false,
      setupType,
      reasons: ['Engine: long/short pair did not qualify on this bar'],
    };
  }
  const candidate = productionOutputToCandidate(output);
  return {
    triggered: true,
    setupType,
    reasons: [`${output.biasLabel} — closed bar (engine)`],
    scoreBreakdown: output.breakdown,
    explanationFacts: candidate.explanationFacts,
    candidate,
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
  symbol: string,
  visible: PlaybackCandle[],
  regime: MarketRegime = 'neutral',
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

  // Run all six production detectors in one call — no separate stub file needed.
  const results: LabDetectorResults = lastClosed && n >= MIN_ENGINE_BARS
    ? runAllDetectorsForLab(engineCandles, regime)
    : { breakoutLong: null, breakdownShort: null, pullbackLong: null, pullbackShort: null, overextendedLong: null, overextendedShort: null };

  const breakout = bestOutput(results.breakoutLong, results.breakdownShort);
  const pullback = bestOutput(results.pullbackLong, results.pullbackShort);
  const overextended = bestOutput(results.overextendedLong, results.overextendedShort);

  return {
    indicators,
    evaluations: [
      evaluationFromOutput('breakout', breakout, lastClosed, n),
      evaluationFromOutput('pullback', pullback, lastClosed, n),
      evaluationFromOutput('overextended', overextended, lastClosed, n),
    ],
  };
}

/** Snapshot for any window length (charts / seed panel). */
export function deriveIndicators(candles: PlaybackCandle[]): DerivedIndicators {
  return engineSnapshotToDerivedIndicators(deriveIndicatorSnapshot(playbackCandlesToEngine(candles)));
}
