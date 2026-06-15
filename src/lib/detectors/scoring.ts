import { ENGINE_EMIT_CONFIG } from '@/lib/scannerEngineConfig';
import { atr, rollingAvg } from '@/lib/indicators';
import type { MarketMemorySnapshot } from '@/lib/marketMemory';
import type { OutcomeAdaptiveFeedback } from '@/lib/signalLifecycleTracker';
import type { StrategyPersonalityMode, StrategyPersonalityProfile } from '@/lib/strategyPersonality';
import type { Candle } from '@/types/market';
import type { DirectionalBias, DirectionalRiskLevel, SignalSide } from '@/types/signal';
import {
  clamp,
  coreMetrics,
  structureFromMetrics,
  structureSwingSignals,
  directionalEfficiency,
  overlapRatio,
  fakeBreakoutCount,
  breakoutQuality,
  rangeCompressionScore,
  directionLabelFromBias,
  riskTagFromLevel,
  type DetectorOutput,
  type StructureState,
} from './shared';

export type BiasAssessment = {
  side: SignalSide;
  confidence: number;
  counterTrend: boolean;
  structure: StructureState;
  structureStrength: number;
  setupQuality: number;
  riskTag: 'Low Risk' | 'Medium Risk' | 'High Risk';
  riskLevel: DirectionalRiskLevel;
  directionalBias: DirectionalBias;
  biasLabel: string;
  higherTimeframeBias: 'bullish' | 'bearish' | 'neutral';
  reasons: string[];
  warnings: string[];
  lifecycleStage: 'emerging' | 'developing' | 'confirmed' | 'active' | 'weakening' | 'invalidated';
  marketState: {
    regime: 'trend' | 'range' | 'volatile' | 'compression';
    dominantBias: 'neutral' | 'bullish' | 'bearish';
    momentumState: 'flat' | 'weakening' | 'strengthening';
    volatilityState: 'expanding' | 'contracting';
    breakoutStatus: 'confirmed' | 'building' | 'failed' | 'none';
  };
  aiExplanation: string;
  whyThisMatters: string;
};

function scoreMarketStructure(params: {
  side: SignalSide;
  m15: ReturnType<typeof coreMetrics>;
  candles15m: Candle[];
  higher: ReturnType<typeof structureFromMetrics>;
}): {
  score: number;
  reasons: string[];
  warnings: string[];
  choppy: boolean;
  deepChop: boolean;
  fakeBreakoutPressure: boolean;
} {
  const { side, m15, candles15m, higher } = params;
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 50;
  const swings = structureSwingSignals(candles15m);
  const compression = rangeCompressionScore(candles15m, m15.atrNow);
  const emaSpreadAtr = m15.atrNow > 0 ? Math.abs(m15.ema20 - m15.ema50) / m15.atrNow : 0;
  const eff = directionalEfficiency(candles15m);
  const overlap = overlapRatio(candles15m);
  const fakeBreakouts = fakeBreakoutCount(candles15m, m15);
  const fakeBreakoutPressure = fakeBreakouts >= 2;
  const choppy = compression >= 0.66 || emaSpreadAtr < 0.24 || overlap >= 0.72 || eff < 0.34;
  const deepChop = choppy && (compression >= 0.76 || overlap >= 0.82 || eff < 0.24 || fakeBreakoutPressure);

  if (side === 'long') {
    if (swings.higherHighs) { score += 14; reasons.push('Recent swing highs are stepping up.'); }
    if (swings.higherLows) { score += 13; reasons.push('Higher lows support trend continuation structure.'); }
    if (m15.close > m15.ema20 && m15.ema20 > m15.ema50) { score += 16; reasons.push('Price remains above key trend EMAs.'); }
    if (swings.lowerHighs || swings.lowerLows) score -= 14;
  } else {
    if (swings.lowerHighs) { score += 14; reasons.push('Recent swing highs are stepping down.'); }
    if (swings.lowerLows) { score += 13; reasons.push('Lower lows support bearish continuation structure.'); }
    if (m15.close < m15.ema20 && m15.ema20 < m15.ema50) { score += 16; reasons.push('Price remains below key trend EMAs.'); }
    if (swings.higherHighs || swings.higherLows) score -= 14;
  }
  if (swings.higherHighs && swings.lowerLows) { score -= 16; warnings.push('Inconsistent swings suggest unstable structure.'); }
  if (choppy) { score -= deepChop ? 28 : 20; warnings.push('Choppy or tight-range structure reduces signal quality.'); }
  if (fakeBreakoutPressure) { score -= 12; warnings.push('Repeated fake breakouts are making momentum less reliable.'); }
  if (higher.structure === 'neutral') { score -= 10; warnings.push('Higher timeframe structure is neutral.'); }
  return { score: clamp(Math.round(score), 0, 100), reasons, warnings, choppy, deepChop, fakeBreakoutPressure };
}

function scoreMomentumTrend(params: {
  side: SignalSide;
  setupType: DetectorOutput['setupType'];
  m15: ReturnType<typeof coreMetrics>;
  m5: ReturnType<typeof coreMetrics> | null;
  candles15m: Candle[];
}): {
  score: number;
  reasons: string[];
  warnings: string[];
  weakVolume: boolean;
  conflict: boolean;
  momentumStall: boolean;
  breakoutWeak: boolean;
} {
  const { side, setupType, m15, m5, candles15m } = params;
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 50;
  const volRatio = m15.volNow / Math.max(1, m15.volAvg);
  const weakVolume = volRatio < 0.9;
  const momentumRising = m15.rsiNow >= m15.rsiPrev;
  const last5 = candles15m.slice(-5);
  const bodyStrength = last5.reduce((sum, c) => sum + Math.abs(c.close - c.open), 0);
  const wickNoise = last5.reduce((sum, c) => sum + (c.high - c.low), 0);
  const candleStrengthRatio = wickNoise > 0 ? bodyStrength / wickNoise : 0;
  const distanceBreakoutAtrRaw =
    (side === 'long' ? m15.swingHigh - m15.close : m15.close - m15.swingLow) / Math.max(m15.atrNow, 0.000001);
  const distanceBreakoutAtr = Math.max(0, distanceBreakoutAtrRaw);
  const fakeBreakoutRisk = distanceBreakoutAtr < 0.2 && volRatio < 1;
  const breakout = breakoutQuality(candles15m, side, m15);
  const conflictingMomentum =
    m5 != null &&
    ((side === 'long' && m5.rsiNow < 45 && momentumRising === false) ||
      (side === 'short' && m5.rsiNow > 55 && momentumRising === true));
  const momentumStall =
    side === 'long'
      ? m15.rsiNow > 58 && m15.rsiNow <= m15.rsiPrev && distanceBreakoutAtr < 0.45
      : m15.rsiNow < 42 && m15.rsiNow >= m15.rsiPrev && distanceBreakoutAtr < 0.45;

  if (side === 'long') {
    if (m15.ema20 > m15.ema50) { score += 14; reasons.push('EMA alignment supports bullish momentum.'); }
    if (m15.rsiNow >= 50 && m15.rsiNow <= 72 && momentumRising) score += 12;
    if (candleStrengthRatio >= 0.42) { score += 8; reasons.push('Recent candles show directional body strength.'); }
    if (distanceBreakoutAtr <= 0.45 && volRatio >= 0.98) { score += 8; reasons.push('Breakout pressure is building with participation.'); }
    if (breakout.retestLike) reasons.push('Breakout retest behavior is holding so far.');
    if (m15.rsiNow > 75) score -= 10;
  } else {
    if (m15.ema20 < m15.ema50) { score += 14; reasons.push('EMA alignment supports bearish momentum.'); }
    if (m15.rsiNow <= 50 && m15.rsiNow >= 28 && !momentumRising) score += 12;
    if (candleStrengthRatio >= 0.42) { score += 8; reasons.push('Recent candles show directional body strength.'); }
    if (distanceBreakoutAtr <= 0.45 && volRatio >= 0.98) { score += 8; reasons.push('Breakdown pressure is building with participation.'); }
    if (breakout.retestLike) reasons.push('Breakdown retest behavior is holding so far.');
    if (m15.rsiNow < 25) score -= 10;
  }

  score += Math.round((breakout.quality - 50) * 0.24);

  if (weakVolume) { score -= 14; warnings.push('Volume is weak relative to recent baseline.'); }
  if (fakeBreakoutRisk) { score -= 10; warnings.push('Breakout behavior looks vulnerable to failure without volume support.'); }
  if (breakout.weak) { score -= 12; warnings.push('Breakout candles are wick-heavy or lacking follow-through.'); }
  if (momentumStall) { score -= 10; warnings.push('Momentum is weakening despite price pressure near the trigger zone.'); }
  if (conflictingMomentum) { score -= 12; warnings.push('Conflicting momentum across timeframes reduces conviction.'); }
  const m5ConfirmsDirection =
    m5 != null &&
    (side === 'long'
      ? m5.rsiNow >= 48 && m5.rsiNow <= 70 && m5.close >= m5.ema20
      : m5.rsiNow <= 52 && m5.rsiNow >= 30 && m5.close <= m5.ema20);
  if (m5ConfirmsDirection && (setupType === 'breakout' || setupType === 'pullback')) {
    score += 10;
    reasons.push('5m timeframe confirms the setup direction.');
  } else if (m5 != null && setupType === 'breakout' && !m5ConfirmsDirection) {
    score -= 6;
    warnings.push('5m momentum has not confirmed the breakout yet.');
  }
  return {
    score: clamp(Math.round(score), 0, 100), reasons, warnings, weakVolume,
    conflict: conflictingMomentum, momentumStall, breakoutWeak: breakout.weak,
  };
}

function scoreContextLocation(params: {
  side: SignalSide;
  m15: ReturnType<typeof coreMetrics>;
  candles15m: Candle[];
  setupType: DetectorOutput['setupType'];
}): {
  score: number;
  reasons: string[];
  warnings: string[];
  poorLocation: boolean;
  lowVolatility: boolean;
  heavyNearbyLevel: boolean;
} {
  const { side, m15, candles15m, setupType } = params;
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 52;
  const atrNow = Math.max(m15.atrNow, 0.000001);
  const distToResistanceAtrRaw = (m15.swingHigh - m15.close) / atrNow;
  const distToSupportAtrRaw = (m15.close - m15.swingLow) / atrNow;
  const distToResistanceAtr = Math.max(0, distToResistanceAtrRaw);
  const distToSupportAtr = Math.max(0, distToSupportAtrRaw);
  const extensionAtr = Math.abs(m15.close - m15.ema20) / atrNow;
  const compression = rangeCompressionScore(candles15m, m15.atrNow);
  const avgRange = candles15m.slice(-20).reduce((sum, c) => sum + (c.high - c.low), 0) / Math.max(1, Math.min(20, candles15m.length));
  const lowVolatility = avgRange < atrNow * 0.7;
  let poorLocation = false;
  let heavyNearbyLevel = false;

  if (side === 'long' && distToResistanceAtr >= 0 && distToResistanceAtr < 0.36) {
    score -= distToResistanceAtr < 0.24 ? 20 : 14;
    poorLocation = true;
    heavyNearbyLevel = distToResistanceAtr < 0.24;
    warnings.push('Long setup is too close to resistance overhead.');
  }
  if (side === 'short' && distToSupportAtr >= 0 && distToSupportAtr < 0.36) {
    score -= distToSupportAtr < 0.24 ? 20 : 14;
    poorLocation = true;
    heavyNearbyLevel = distToSupportAtr < 0.24;
    warnings.push('Short setup is too close to support below.');
  }
  if (compression >= 0.72) { score -= 14; warnings.push('Trade is developing in a choppy, tight range.'); }
  if (lowVolatility) { score -= 10; warnings.push('Price movement is quiet, reducing follow-through odds.'); }
  const breakoutHasRoom = side === 'long' ? distToResistanceAtr > 0.15 : distToSupportAtr > 0.15;
  if (setupType === 'breakout' && breakoutHasRoom) { score += 10; reasons.push('Breakout location has room if confirmation holds.'); }
  if (setupType === 'pullback' && extensionAtr <= 0.9) { score += 8; reasons.push('Pullback location remains close to trend support/resistance.'); }
  if (setupType !== 'overextended' && extensionAtr <= 1.25) score += 6;
  if (setupType === 'overextended') score -= 12;
  return { score: clamp(Math.round(score), 0, 100), reasons, warnings, poorLocation, lowVolatility, heavyNearbyLevel };
}

function scoreMtfAlignment(params: {
  side: SignalSide;
  higher: ReturnType<typeof structureFromMetrics>;
  lower: ReturnType<typeof structureFromMetrics>;
}): {
  score: number;
  reasons: string[];
  warnings: string[];
  counterTrend: boolean;
  heavyConflict: boolean;
  higherTimeframeBias: 'bullish' | 'bearish' | 'neutral';
} {
  const { side, higher, lower } = params;
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 50;
  const higherTimeframeBias: 'bullish' | 'bearish' | 'neutral' =
    higher.structure === 'bullish' ? 'bullish' : higher.structure === 'bearish' ? 'bearish' : 'neutral';
  const alignedWithHigher =
    (higher.structure === 'bullish' && side === 'long') || (higher.structure === 'bearish' && side === 'short');
  const counterTrend =
    (higher.structure === 'bullish' && side === 'short') || (higher.structure === 'bearish' && side === 'long');
  const heavyConflict =
    higher.structure !== 'neutral' && lower.structure !== 'neutral' && higher.structure !== lower.structure;

  if (alignedWithHigher) { score += 24; reasons.push('Higher timeframe trend alignment supports continuation bias.'); }
  else if (counterTrend) { score -= 26; warnings.push('Setup is counter to the higher timeframe trend.'); }
  else { score -= 6; warnings.push('Higher timeframe trend is neutral.'); }
  if (heavyConflict) { score -= 16; warnings.push('Conflicting signals detected across timeframes.'); }
  else if (lower.structure !== 'neutral' && higher.structure !== 'neutral') { score += 8; }

  return { score: clamp(Math.round(score), 0, 100), reasons, warnings, counterTrend, heavyConflict, higherTimeframeBias };
}

function directionalBiasFromScore(side: SignalSide, confidence: number, antiSpam: { forceNeutral: boolean; blockStrong: boolean }): DirectionalBias {
  if (antiSpam.forceNeutral) return 'neutral';
  if (side === 'long') {
    if (confidence >= 80 && !antiSpam.blockStrong) return 'strong_long';
    if (confidence >= 65) return 'long';
    if (confidence >= 45) return 'weak_long';
    return 'neutral';
  }
  if (confidence >= 80 && !antiSpam.blockStrong) return 'strong_short';
  if (confidence >= 65) return 'short';
  if (confidence >= 45) return 'weak_short';
  return 'neutral';
}

function riskLevelFromContext(params: {
  confidence: number;
  counterTrend: boolean;
  heavyConflict: boolean;
  weakVolume: boolean;
  choppy: boolean;
  volatilitySpike: boolean;
}): DirectionalRiskLevel {
  const { confidence, counterTrend, heavyConflict, weakVolume, choppy, volatilitySpike } = params;
  if (counterTrend || heavyConflict || choppy || volatilitySpike) return 'high';
  if (weakVolume || confidence < 65) return 'moderate';
  return confidence >= 80 ? 'low' : 'moderate';
}

export function assessDirectionalBias(params: {
  side: SignalSide;
  setupScore: number;
  setupType: DetectorOutput['setupType'];
  candles15m: Candle[];
  candles5m?: Candle[];
  marketMemory?: MarketMemorySnapshot;
  adaptiveFeedback?: OutcomeAdaptiveFeedback;
  strategyPersonalityMode?: StrategyPersonalityMode;
  strategyPersonalityProfile?: StrategyPersonalityProfile;
  adaptationConfidenceAdjustment?: number;
}): BiasAssessment {
  const m15 = coreMetrics(params.candles15m);
  const m5 = params.candles5m && params.candles5m.length >= ENGINE_EMIT_CONFIG.minClosedCandles5m
    ? coreMetrics(params.candles5m)
    : null;
  const higher = structureFromMetrics(m15);
  const lower = m5 ? structureFromMetrics(m5) : { structure: 'neutral' as StructureState, strength: 0 };

  const structure = scoreMarketStructure({ side: params.side, m15, candles15m: params.candles15m, higher });
  const momentum = scoreMomentumTrend({ side: params.side, setupType: params.setupType, m15, m5, candles15m: params.candles15m });
  const context = scoreContextLocation({ side: params.side, m15, candles15m: params.candles15m, setupType: params.setupType });
  const mtf = scoreMtfAlignment({ side: params.side, higher, lower });
  const atrWindow = atr(params.candles15m, 14);
  const atrNow = Math.max(m15.atrNow, 0.000001);
  const atrAvg = rollingAvg(atrWindow, 20).at(-1) ?? atrNow;
  const atrRatio = atrAvg > 0 ? atrNow / atrAvg : 1;
  const volatilityCompression = atrRatio < 0.86;
  const volatilitySpike = atrRatio > 1.35;

  const rawConfidence = clamp(
    Math.round(structure.score * 0.35 + momentum.score * 0.25 + context.score * 0.2 + mtf.score * 0.2),
    0, 100,
  );
  let confidence = rawConfidence;

  const antiSpamReasons: string[] = [];
  if (momentum.weakVolume) { confidence = Math.min(confidence, 72); antiSpamReasons.push('Confidence capped due to weak volume.'); }
  if (context.heavyNearbyLevel) { confidence = Math.max(0, confidence - 10); antiSpamReasons.push('Confidence reduced due to nearby opposing level risk.'); }
  if (structure.deepChop || structure.fakeBreakoutPressure) {
    confidence = Math.min(confidence, 55);
    antiSpamReasons.push('Hard cap active in range-bound / fake-breakout conditions.');
  } else if (structure.choppy || context.lowVolatility || volatilityCompression) {
    confidence = Math.min(confidence, 62);
    antiSpamReasons.push('Confidence capped in choppy or quiet market conditions.');
  }
  if (mtf.heavyConflict) { confidence = Math.min(confidence, 64); antiSpamReasons.push('Confidence capped due to timeframe disagreement.'); }
  else if (mtf.counterTrend) { confidence = Math.min(confidence, 68); antiSpamReasons.push('Counter-trend setup capped to pullback confidence range.'); }
  if (momentum.momentumStall || momentum.breakoutWeak) confidence = Math.min(confidence, 72);
  if (params.setupType === 'overextended') confidence = Math.min(confidence, 64);
  const premiumAligned =
    structure.score >= 72 && momentum.score >= 72 && context.score >= 68 && mtf.score >= 72 &&
    !momentum.weakVolume && !structure.choppy && !mtf.counterTrend && !mtf.heavyConflict &&
    !context.poorLocation && !volatilityCompression;
  if (!premiumAligned) confidence = Math.min(confidence, 82);
  if (params.marketMemory) {
    if (params.marketMemory.failedBreakoutsRecent >= 2) confidence = Math.max(0, confidence - 6);
    if (params.marketMemory.failedContinuationAttempts >= 2) confidence = Math.max(0, confidence - 4);
    if (params.marketMemory.momentumState === 'strengthening' && params.marketMemory.breakoutStatus === 'building') {
      confidence = Math.min(100, confidence + 3);
    }
    if (params.marketMemory.momentumState === 'weakening') confidence = Math.max(0, confidence - 4);
    if (params.marketMemory.regime === 'compression') confidence = Math.min(confidence, 58);
    if (params.marketMemory.regime === 'range') confidence = Math.min(confidence, 60);
    if (params.marketMemory.regime === 'volatile' && params.marketMemory.breakoutStatus === 'failed') {
      confidence = Math.min(confidence, 62);
    }
  }
  if (params.adaptiveFeedback) {
    confidence = clamp(confidence + params.adaptiveFeedback.confidenceAdjustment, 0, 100);
    if (params.adaptiveFeedback.tightenConfirmation && params.setupType === 'breakout') confidence = Math.min(confidence, 68);
    if (params.adaptiveFeedback.allowEarlierRecognition && params.setupType !== 'overextended') confidence = Math.min(100, confidence + 2);
  }
  if (params.strategyPersonalityProfile) {
    confidence = clamp(confidence + params.strategyPersonalityProfile.confidenceAdjustment, 0, 100);
    if (params.setupType === 'breakout') confidence = clamp(confidence + params.strategyPersonalityProfile.breakoutBoost, 0, 100);
    if (params.setupType === 'pullback') confidence = clamp(confidence + params.strategyPersonalityProfile.pullbackBoost, 0, 100);
    if (params.setupType === 'overextended') confidence = clamp(confidence + params.strategyPersonalityProfile.overextendedPenalty, 0, 100);
    if (mtf.counterTrend) confidence = Math.max(0, confidence - params.strategyPersonalityProfile.counterTrendPenalty);
    const choppyCapFired = antiSpamReasons.some(
      (r) => r.includes('choppy') || r.includes('quiet') || r.includes('range-bound') || r.includes('fake-breakout'),
    );
    const weakVolumeCapFired = antiSpamReasons.some((r) => r.includes('volume'));
    const chopScale = structure.choppy && choppyCapFired ? 0.5 : 1;
    const volScale = momentum.weakVolume && weakVolumeCapFired ? 0.5 : 1;
    if (structure.choppy) confidence = Math.max(0, confidence - Math.round(params.strategyPersonalityProfile.chopPenalty * chopScale));
    if (momentum.weakVolume) confidence = Math.max(0, confidence - Math.round(params.strategyPersonalityProfile.weakVolumePenalty * volScale));
  }
  if (params.adaptationConfidenceAdjustment) {
    confidence = clamp(confidence + params.adaptationConfidenceAdjustment, 0, 100);
  }

  const volatilityQuality = volatilityCompression ? 36 : volatilitySpike ? 48 : 72;
  const invalidationClarity = params.setupType === 'pullback' ? 76 : params.setupType === 'breakout' ? 64 : 44;
  const rrPotential = clamp(Math.round((params.setupScore * 0.5 + (100 - Math.abs(m15.close - m15.ema20) / Math.max(0.000001, m15.atrNow) * 22) * 0.5)), 0, 100);
  const setupQuality = clamp(
    Math.round(params.setupScore * 0.4 + structure.score * 0.2 + context.score * 0.2 + rrPotential * 0.1 + invalidationClarity * 0.05 + volatilityQuality * 0.05),
    0, 100,
  );

  const forceNeutral = mtf.heavyConflict || structure.deepChop || confidence < 45;
  const blockStrong = confidence < 65 || mtf.heavyConflict || mtf.counterTrend || structure.choppy || momentum.weakVolume || momentum.momentumStall;
  const directionalBias = directionalBiasFromScore(params.side, confidence, { forceNeutral, blockStrong });
  const riskLevel = riskLevelFromContext({ confidence, counterTrend: mtf.counterTrend, heavyConflict: mtf.heavyConflict, weakVolume: momentum.weakVolume, choppy: structure.choppy, volatilitySpike });
  const riskTag = riskTagFromLevel(riskLevel);
  const biasLabel = directionLabelFromBias(directionalBias);

  const reasons = [...structure.reasons, ...momentum.reasons, ...context.reasons, ...mtf.reasons].slice(0, 5);
  const memoryWarnings = params.marketMemory && params.marketMemory.failedBreakoutsRecent >= 2
    ? ['Recent breakout attempts have repeatedly failed.'] : [];
  const warnings = [...structure.warnings, ...momentum.warnings, ...context.warnings, ...mtf.warnings, ...memoryWarnings, ...antiSpamReasons, ...(params.adaptiveFeedback?.notes ?? [])].slice(0, 5);

  const trendSentence = mtf.counterTrend
    ? `Higher timeframe trend remains ${mtf.higherTimeframeBias}, so this reads as a pullback rather than a primary reversal.`
    : mtf.higherTimeframeBias === 'neutral'
      ? 'Higher timeframe trend is neutral, so follow-through needs extra confirmation.'
      : `Higher timeframe trend remains ${mtf.higherTimeframeBias}, supporting continuation conditions.`;
  const momentumSentence = momentum.momentumStall
    ? 'Momentum is weakening despite continuation pressure.'
    : momentum.weakVolume
      ? 'Breakout pressure exists, though volume confirmation remains limited.'
      : confidence < 60
        ? 'Momentum is improving from consolidation and early continuation pressure is emerging.'
        : 'Momentum participation is supportive without extreme exhaustion.';
  const memorySentence = params.marketMemory == null
    ? ''
    : params.marketMemory.breakoutStatus === 'failed'
      ? 'Recent fakeouts keep continuation confidence restrained.'
      : params.marketMemory.breakoutStatus === 'building'
        ? 'Breakout pressure is rebuilding after recent consolidation.'
        : '';
  const adaptiveSentence = params.adaptiveFeedback && params.adaptiveFeedback.notes.length > 0
    ? params.adaptiveFeedback.notes[0] : '';
  const personalitySentence = params.strategyPersonalityProfile?.tone === 'cautious'
    ? 'Risk discipline is prioritized while waiting for stronger structural confirmation.'
    : params.strategyPersonalityProfile?.tone === 'opportunity'
      ? 'Momentum opportunities are weighted earlier, with higher acceptance of fast-moving conditions.'
      : params.strategyPersonalityProfile?.tone === 'breakout'
        ? 'Breakout pressure and follow-through are emphasized over minor pullback noise.'
        : params.strategyPersonalityProfile?.tone === 'macro'
          ? 'Higher timeframe structure is prioritized over intraday fluctuations.'
          : '';
  const contextSentence = context.poorLocation
    ? 'Location is crowded near opposing liquidity, reducing entry quality.'
    : 'Market structure favors continuation, with manageable nearby invalidation zones.';

  const lifecycleStage =
    confidence < 45
      ? params.marketMemory?.failedBreakoutsRecent && params.marketMemory.failedBreakoutsRecent >= 3 ? 'invalidated' : 'emerging'
      : confidence < 60 ? 'developing'
        : confidence < 75 ? 'confirmed'
          : momentum.momentumStall || params.marketMemory?.momentumState === 'weakening' ? 'weakening' : 'active';
  const marketState = {
    regime: params.marketMemory?.regime ?? (structure.choppy ? 'range' : 'trend'),
    dominantBias: params.marketMemory?.dominantBias ?? (higher.structure === 'bullish' ? 'bullish' : higher.structure === 'bearish' ? 'bearish' : 'neutral'),
    momentumState: params.marketMemory?.momentumState ?? (momentum.momentumStall ? 'weakening' : 'flat'),
    volatilityState: params.marketMemory?.volatilityState ?? (volatilitySpike ? 'expanding' : 'contracting'),
    breakoutStatus: params.marketMemory?.breakoutStatus ?? (params.setupType === 'breakout' ? 'building' : 'none'),
  };

  return {
    side: params.side, confidence, counterTrend: mtf.counterTrend,
    structure: higher.structure, structureStrength: higher.strength,
    setupQuality, riskTag, riskLevel, directionalBias, biasLabel,
    higherTimeframeBias: mtf.higherTimeframeBias,
    reasons, warnings, lifecycleStage, marketState,
    aiExplanation: `${trendSentence} ${momentumSentence}${memorySentence ? ` ${memorySentence}` : ''}${adaptiveSentence ? ` ${adaptiveSentence}` : ''}${personalitySentence ? ` ${personalitySentence}` : ''}`,
    whyThisMatters: warnings.length > 0
      ? `${contextSentence} ${warnings[0]}`
      : `${contextSentence} Confidence reflects weighted structure, momentum, context, and timeframe alignment.`,
  };
}
