import { calculateSetupScore, getSetupScoreLabel } from '@/lib/setupScore';
import {
  evaluateTimingLifecycle,
  type CandidateLifecycle,
  type TimingDiagnostics,
} from '@/lib/timingLifecycle';
import type { MarketMemorySnapshot } from '@/lib/marketMemory';
import type { OutcomeAdaptiveFeedback } from '@/lib/signalLifecycleTracker';
import type { StrategyPersonalityMode, StrategyPersonalityProfile } from '@/lib/strategyPersonality';
import type { Candle, SymbolTicker } from '@/types/market';
import type {
  CryptoSignal,
  SignalSetupType,
  SignalSide,
} from '@/types/signal';
import {
  breakoutPressureDetector,
  pullbackContinuationDetector,
  overextendedDetector,
} from './long';
import {
  breakdownPressureDetector,
  pullbackContinuationShortDetector,
  overextendedShortDetector,
} from './short';
import { assessDirectionalBias, type BiasAssessment } from './scoring';
import {
  coreMetrics,
  mapRiskTag,
  timingStatePriority,
  type DetectorOutput,
  type DetectorThresholds,
} from './shared';

export type { DetectorOutput };

const DEBUG: boolean =
  (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV === true ||
  !!(globalThis as Record<string, unknown>).__SIGFLO_DEBUG__;

export type MarketRegime = 'risk_on' | 'neutral' | 'risk_off';

function thresholdsForRegime(regime: MarketRegime): DetectorThresholds {
  if (regime === 'risk_off') {
    return {
      breakoutVolRatio: 1.36,
      breakoutDistAtr: 0.28,
      breakoutCompression: 0.46,
      pullbackMaxDistAtr: 0.45,
      overextendedStretchAtr: 1.7,
    };
  }
  if (regime === 'risk_on') {
    return {
      breakoutVolRatio: 1.2,
      breakoutDistAtr: 0.38,
      breakoutCompression: 0.38,
      pullbackMaxDistAtr: 0.6,
      overextendedStretchAtr: 1.9,
    };
  }
  return {
    breakoutVolRatio: 1.26,
    breakoutDistAtr: 0.32,
    breakoutCompression: 0.44,
    pullbackMaxDistAtr: 0.5,
    overextendedStretchAtr: 1.8,
  };
}

const MARKET_DETECTORS = [
  breakoutPressureDetector,
  breakdownPressureDetector,
  pullbackContinuationDetector,
  pullbackContinuationShortDetector,
  overextendedDetector,
  overextendedShortDetector,
] as const;

export function buildSignalFromMarket(input: {
  symbol: string;
  exchange: string;
  ticker: SymbolTicker;
  candles15m: Candle[];
  candles5m?: Candle[];
  regime?: MarketRegime;
  previousLifecycle?: CandidateLifecycle;
  previousLifecycleForSetupSide?: (setupType: SignalSetupType, side: SignalSide) => CandidateLifecycle | undefined;
  previousMarketMemory?: MarketMemorySnapshot;
  strategyPersonalityMode?: StrategyPersonalityMode;
  strategyPersonalityProfile?: StrategyPersonalityProfile;
  adaptationConfidenceAdjustmentForSetup?: (setupType: SignalSetupType) => number;
  adaptiveFeedbackForSetup?: (setupType: SignalSetupType, side: SignalSide) => OutcomeAdaptiveFeedback;
  onReject?: (
    detectorName: string,
    reason: 'no_signal' | 'confidence_below_threshold',
    meta?: { confidence?: number; threshold?: number },
  ) => void;
}): { signal: CryptoSignal; lifecycle: CandidateLifecycle } | null {
  const thresholds = thresholdsForRegime(input.regime ?? 'neutral');
  let best: {
    out: DetectorOutput;
    setupScore: number;
    bias: BiasAssessment;
    lifecycle: CandidateLifecycle;
    diagnostics: TimingDiagnostics;
  } | null = null;
  const debugRejectLog: Array<{ detector: string; reason: string; detail?: Record<string, unknown> }> = [];
  const debugAcceptLog: Array<{ detector: string; confidence: number; timingState: string; setupScore: number }> = [];
  for (const detector of MARKET_DETECTORS) {
    const out = detector(input.candles15m, thresholds);
    if (!out) {
      input.onReject?.(detector.name, 'no_signal');
      if (DEBUG) debugRejectLog.push({ detector: detector.name, reason: 'no_signal' });
      continue;
    }
    const setupScore = calculateSetupScore(out.breakdown);
    const bias = assessDirectionalBias({
      side: out.side,
      setupScore,
      setupType: out.setupType,
      candles15m: input.candles15m,
      candles5m: input.candles5m,
      marketMemory: input.previousMarketMemory,
      strategyPersonalityMode: input.strategyPersonalityMode,
      strategyPersonalityProfile: input.strategyPersonalityProfile,
      adaptationConfidenceAdjustment: input.adaptationConfidenceAdjustmentForSetup?.(out.setupType),
      adaptiveFeedback: input.adaptiveFeedbackForSetup?.(out.setupType, out.side),
    });
    const emitThreshold = input.strategyPersonalityProfile?.minConfidenceToEmit ?? 45;
    if (bias.confidence < emitThreshold) {
      input.onReject?.(detector.name, 'confidence_below_threshold', {
        confidence: bias.confidence,
        threshold: emitThreshold,
      });
      if (DEBUG) debugRejectLog.push({ detector: detector.name, reason: 'confidence_below_threshold', detail: { confidence: bias.confidence, threshold: emitThreshold } });
      continue;
    }
    const previousLifecycle =
      input.previousLifecycleForSetupSide?.(out.setupType, out.side) ?? input.previousLifecycle;
    const { lifecycle, diagnostics } = evaluateTimingLifecycle({
      setupType: out.setupType,
      side: out.side,
      setupScore,
      candles: input.candles15m,
      previous: previousLifecycle,
    });
    if (DEBUG) debugAcceptLog.push({ detector: detector.name, confidence: bias.confidence, timingState: lifecycle.state, setupScore });
    if (!best) {
      best = { out, setupScore, bias, lifecycle, diagnostics };
      continue;
    }
    const nextPriority = timingStatePriority(lifecycle.state);
    const bestPriority = timingStatePriority(best.lifecycle.state);
    if (
      nextPriority > bestPriority ||
      (nextPriority === bestPriority && bias.confidence > best.bias.confidence) ||
      (nextPriority === bestPriority && bias.confidence === best.bias.confidence && setupScore > best.setupScore)
    ) {
      best = { out, setupScore, bias, lifecycle, diagnostics };
    }
  }
  if (DEBUG) {
    console.log(`[Sigflo][Engine] ${input.symbol} buildSignalFromMarket`, {
      regime: input.regime ?? 'neutral',
      candleCount: input.candles15m.length,
      rejected: debugRejectLog,
      accepted: debugAcceptLog,
      selected: best ? { detector: `${best.out.setupType}/${best.out.side}`, confidence: best.bias.confidence, timingState: best.lifecycle.state } : null,
    });
  }
  if (!best) return null;
  const { out, setupScore, bias, lifecycle, diagnostics } = best;
  const signal: CryptoSignal = {
    id: `live-${input.symbol}-${out.setupType}-${out.side}`,
    pair: input.symbol.replace('USDT', ''),
    side: out.side,
    biasLabel: bias.biasLabel,
    directionalBias: bias.directionalBias,
    setupType: out.setupType,
    setupScore,
    setupScoreLabel: getSetupScoreLabel(setupScore),
    confidence: bias.confidence,
    setupQuality: bias.setupQuality,
    riskLevel: bias.riskLevel,
    higherTimeframeBias: bias.higherTimeframeBias,
    reasons: bias.reasons,
    warnings: bias.warnings,
    marketState: bias.marketState,
    signalLifecycleStage: bias.lifecycleStage,
    scoreBreakdown: out.breakdown,
    facts: {
      ...out.facts,
      confidence: bias.confidence,
      setupQuality: bias.setupQuality,
      structureStrength: bias.structureStrength,
      higherTimeframeBias: bias.higherTimeframeBias,
      counterTrend: bias.counterTrend ? 'yes' : 'no',
    },
    riskTag: mapRiskTag(bias.confidence, bias.riskTag),
    setupTags: out.setupTags,
    exchange: input.exchange,
    postedAgo: 'Live',
    aiExplanation: bias.aiExplanation,
    whyThisMatters: bias.whyThisMatters,
    timingState: lifecycle.state,
    timingScore: diagnostics.timingScore,
    entryFreshnessScore: diagnostics.entryFreshnessScore,
    roomToTargetScore: diagnostics.roomToTargetScore,
    actionabilityScore: diagnostics.actionabilityScore,
    triggerType: lifecycle.trigger.triggerType,
    triggerReason: lifecycle.trigger.triggerReason,
    idealEntryPrice: lifecycle.trigger.idealEntryPrice ?? undefined,
    candlesSinceTrigger: lifecycle.candlesSinceTrigger ?? undefined,
    candlesSincePeakTiming: lifecycle.candlesSincePeakTiming ?? undefined,
    penaltyBreakdown: lifecycle.penalties,
    positiveTimingFactors: lifecycle.positiveFactors,
    scannerDiagnosticsNote:
      'Timing now follows lifecycle memory (first trigger capture, peak tracking, and freshness decay) instead of a late static snapshot.',
  };
  return { signal, lifecycle };
}

export type LabDetectorResults = {
  breakoutLong: DetectorOutput | null;
  breakdownShort: DetectorOutput | null;
  pullbackLong: DetectorOutput | null;
  pullbackShort: DetectorOutput | null;
  overextendedLong: DetectorOutput | null;
  overextendedShort: DetectorOutput | null;
};

export function runAllDetectorsForLab(
  candles15m: Candle[],
  regime: MarketRegime = 'neutral',
): LabDetectorResults {
  const t = thresholdsForRegime(regime);
  return {
    breakoutLong: breakoutPressureDetector(candles15m, t),
    breakdownShort: breakdownPressureDetector(candles15m, t),
    pullbackLong: pullbackContinuationDetector(candles15m, t),
    pullbackShort: pullbackContinuationShortDetector(candles15m, t),
    overextendedLong: overextendedDetector(candles15m, t),
    overextendedShort: overextendedShortDetector(candles15m, t),
  };
}

export function inferMarketRegime(input: { btc15m: Candle[]; eth15m: Candle[] }): MarketRegime {
  function score(candles: Candle[]): number {
    const m = coreMetrics(candles);
    const trend = m.close > m.ema20 && m.ema20 > m.ema50 ? 1 : m.close < m.ema20 && m.ema20 < m.ema50 ? -1 : 0;
    const momentum = m.rsiNow > 56 ? 1 : m.rsiNow < 44 ? -1 : 0;
    return trend + momentum;
  }
  const combined = score(input.btc15m) + score(input.eth15m);
  if (combined >= 3) return 'risk_on';
  if (combined <= -3) return 'risk_off';
  return 'neutral';
}
