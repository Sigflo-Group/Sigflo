import { calculateSetupScore, getSetupScoreLabel } from '@/lib/setupScore';
import {
  evaluateTimingLifecycle,
  type CandidateLifecycle,
  type TimingDiagnostics,
} from '@/lib/timingLifecycle';
import { atr, ema, recentSwingHigh, recentSwingLow, rollingAvg, rsi } from '@/lib/indicators';
import type { MarketMemorySnapshot } from '@/lib/marketMemory';
import type { OutcomeAdaptiveFeedback } from '@/lib/signalLifecycleTracker';
import type { StrategyPersonalityMode, StrategyPersonalityProfile } from '@/lib/strategyPersonality';
import type { Candle, SymbolTicker } from '@/types/market';
import type {
  CryptoSignal,
  DirectionalBias,
  DirectionalRiskLevel,
  SetupScoreBreakdown,
  SignalRiskTag,
  SignalSetupTag,
  SignalSetupType,
  SignalSide,
} from '@/types/signal';

// Enable verbose detector/confidence logging in dev, or at runtime via `window.__SIGFLO_DEBUG__ = true`.
const DEBUG: boolean =
  (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV === true ||
  !!(globalThis as Record<string, unknown>).__SIGFLO_DEBUG__;

type DetectorOutput = {
  setupType: 'breakout' | 'pullback' | 'overextended';
  side: SignalSide;
  biasLabel: string;
  setupTags: SignalSetupTag[];
  riskTag: SignalRiskTag;
  aiExplanation: string;
  whyThisMatters: string;
  breakdown: SetupScoreBreakdown;
  facts: NonNullable<CryptoSignal['facts']>;
};

type StructureState = 'bullish' | 'bearish' | 'neutral';

type BiasAssessment = {
  side: SignalSide;
  confidence: number;
  counterTrend: boolean;
  structure: StructureState;
  structureStrength: number;
  setupQuality: number;
  riskTag: SignalRiskTag;
  riskLevel: DirectionalRiskLevel;
  directionalBias: DirectionalBias;
  biasLabel: string;
  higherTimeframeBias: 'bullish' | 'bearish' | 'neutral';
  reasons: string[];
  warnings: string[];
  lifecycleStage: CryptoSignal['signalLifecycleStage'];
  marketState: NonNullable<CryptoSignal['marketState']>;
  aiExplanation: string;
  whyThisMatters: string;
};

export type MarketRegime = 'risk_on' | 'neutral' | 'risk_off';

type DetectorThresholds = {
  breakoutVolRatio: number;
  breakoutDistAtr: number;
  breakoutCompression: number;
  pullbackMaxDistAtr: number;
  overextendedStretchAtr: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function coreMetrics(candles: Candle[]) {
  const closes = candles.map((c) => c.close);
  const volumes = candles.map((c) => c.volume);
  const ema20 = ema(closes, 20);
  const ema50 = ema(closes, 50);
  const rsi14 = rsi(closes, 14);
  const atr14 = atr(candles, 14);
  const volAvg20 = rollingAvg(volumes, 20);
  const close = closes.at(-1) ?? 0;
  const atrNow = atr14.at(-1) ?? 0;
  const rsiNow = rsi14.at(-1) ?? 50;
  return {
    close,
    closePrev: closes.at(-2) ?? close,
    ema20: ema20.at(-1) ?? close,
    ema20Prev: ema20.at(-2) ?? (ema20.at(-1) ?? close),
    ema50: ema50.at(-1) ?? close,
    ema50Prev: ema50.at(-2) ?? (ema50.at(-1) ?? close),
    rsiNow,
    rsiPrev: rsi14.at(-2) ?? rsiNow,
    atrNow,
    volNow: volumes.at(-1) ?? 0,
    volAvg: volAvg20.at(-1) ?? 1,
    swingHigh: recentSwingHigh(candles, 40),
    swingLow: recentSwingLow(candles, 40),
  };
}

function structureFromMetrics(m: ReturnType<typeof coreMetrics>): { structure: StructureState; strength: number } {
  const emaSpreadAtr = m.atrNow > 0 ? Math.abs(m.ema20 - m.ema50) / m.atrNow : 0;
  const slopeAtr = m.atrNow > 0 ? Math.abs(m.ema20 - m.ema20Prev) / m.atrNow : 0;
  const distanceAtr = m.atrNow > 0 ? Math.abs(m.close - m.ema20) / m.atrNow : 0;
  let structure: StructureState = 'neutral';
  if (m.close > m.ema20 && m.ema20 > m.ema50) structure = 'bullish';
  else if (m.close < m.ema20 && m.ema20 < m.ema50) structure = 'bearish';
  const rawStrength = emaSpreadAtr * 34 + slopeAtr * 26 + distanceAtr * 12;
  const bounded = clamp(Math.round(rawStrength), 0, 100);
  const strength = structure === 'neutral' ? Math.min(45, bounded) : Math.max(35, bounded);
  return { structure, strength };
}

function directionLabelFromBias(bias: DirectionalBias): string {
  if (bias === 'strong_long') return 'Strong Bullish Setup';
  if (bias === 'long') return 'Moderate Bullish Setup';
  if (bias === 'weak_long') return 'Developing Bullish Setup';
  if (bias === 'strong_short') return 'Strong Bearish Setup';
  if (bias === 'short') return 'Moderate Bearish Setup';
  if (bias === 'weak_short') return 'Developing Bearish Setup';
  return 'No Trade / Unclear';
}

function riskTagFromLevel(level: DirectionalRiskLevel): SignalRiskTag {
  if (level === 'low') return 'Low Risk';
  if (level === 'moderate') return 'Medium Risk';
  return 'High Risk';
}

function structureSwingSignals(candles: Candle[]): {
  higherHighs: boolean;
  higherLows: boolean;
  lowerHighs: boolean;
  lowerLows: boolean;
} {
  const recent = candles.slice(-20);
  const prior = candles.slice(-40, -20);
  if (recent.length < 10 || prior.length < 10) {
    return { higherHighs: false, higherLows: false, lowerHighs: false, lowerLows: false };
  }
  const recentHigh = Math.max(...recent.map((c) => c.high));
  const priorHigh = Math.max(...prior.map((c) => c.high));
  const recentLow = Math.min(...recent.map((c) => c.low));
  const priorLow = Math.min(...prior.map((c) => c.low));
  return {
    higherHighs: recentHigh > priorHigh,
    higherLows: recentLow > priorLow,
    lowerHighs: recentHigh < priorHigh,
    lowerLows: recentLow < priorLow,
  };
}

function directionalEfficiency(candles: Candle[]): number {
  const recent = candles.slice(-20);
  if (recent.length < 6) return 0;
  const net = Math.abs((recent.at(-1)?.close ?? 0) - (recent[0]?.open ?? 0));
  const travel = recent.reduce((sum, c) => sum + Math.abs(c.close - c.open), 0);
  if (travel <= 0) return 0;
  return clamp(net / travel, 0, 1);
}

function overlapRatio(candles: Candle[]): number {
  const recent = candles.slice(-12);
  if (recent.length < 5) return 0;
  let overlaps = 0;
  for (let i = 1; i < recent.length; i += 1) {
    const prev = recent[i - 1]!;
    const curr = recent[i]!;
    const overlapHigh = Math.min(prev.high, curr.high);
    const overlapLow = Math.max(prev.low, curr.low);
    if (overlapHigh > overlapLow) overlaps += 1;
  }
  return overlaps / (recent.length - 1);
}

function fakeBreakoutCount(candles: Candle[], m15: ReturnType<typeof coreMetrics>): number {
  const recent = candles.slice(-8);
  let count = 0;
  const atrNow = Math.max(m15.atrNow, 0.000001);
  for (const c of recent) {
    const upperWick = c.high - Math.max(c.open, c.close);
    const lowerWick = Math.min(c.open, c.close) - c.low;
    const body = Math.abs(c.close - c.open);
    const wickHeavy = (upperWick + lowerWick) > body * 1.4;
    const closeInside = c.close < m15.swingHigh && c.close > m15.swingLow;
    if (wickHeavy && closeInside && (c.high - c.low) / atrNow > 0.45) count += 1;
  }
  return count;
}

function breakoutQuality(candles: Candle[], side: SignalSide, m15: ReturnType<typeof coreMetrics>): {
  quality: number;
  weak: boolean;
  retestLike: boolean;
} {
  const recent = candles.slice(-4);
  if (recent.length < 4) return { quality: 0, weak: true, retestLike: false };
  const prev = recent.slice(0, 3);
  const last = recent.at(-1)!;
  const avgBody = prev.reduce((s, c) => s + Math.abs(c.close - c.open), 0) / prev.length;
  const body = Math.abs(last.close - last.open);
  const range = Math.max(0.000001, last.high - last.low);
  const bodyStrength = body / range;
  const closesProgressive =
    side === 'long'
      ? recent[1]!.close >= recent[0]!.close && recent[2]!.close >= recent[1]!.close
      : recent[1]!.close <= recent[0]!.close && recent[2]!.close <= recent[1]!.close;
  const followThrough =
    side === 'long' ? last.close >= recent[2]!.close : last.close <= recent[2]!.close;
  const retestLike =
    side === 'long'
      ? last.low <= m15.swingHigh && last.close > m15.swingHigh * 0.998
      : last.high >= m15.swingLow && last.close < m15.swingLow * 1.002;
  let quality = 50;
  if (bodyStrength >= 0.58) quality += 16;
  if (body >= avgBody * 1.1) quality += 12;
  if (closesProgressive) quality += 10;
  if (followThrough) quality += 8;
  if (retestLike) quality += 8;
  const weak = bodyStrength < 0.45 || !followThrough;
  return { quality: clamp(Math.round(quality), 0, 100), weak, retestLike };
}

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
    if (swings.higherHighs) {
      score += 14;
      reasons.push('Recent swing highs are stepping up.');
    }
    if (swings.higherLows) {
      score += 13;
      reasons.push('Higher lows support trend continuation structure.');
    }
    if (m15.close > m15.ema20 && m15.ema20 > m15.ema50) {
      score += 16;
      reasons.push('Price remains above key trend EMAs.');
    }
    if (swings.lowerHighs || swings.lowerLows) score -= 14;
  } else {
    if (swings.lowerHighs) {
      score += 14;
      reasons.push('Recent swing highs are stepping down.');
    }
    if (swings.lowerLows) {
      score += 13;
      reasons.push('Lower lows support bearish continuation structure.');
    }
    if (m15.close < m15.ema20 && m15.ema20 < m15.ema50) {
      score += 16;
      reasons.push('Price remains below key trend EMAs.');
    }
    if (swings.higherHighs || swings.higherLows) score -= 14;
  }
  if (swings.higherHighs && swings.lowerLows) {
    score -= 16;
    warnings.push('Inconsistent swings suggest unstable structure.');
  }
  if (choppy) {
    score -= deepChop ? 28 : 20;
    warnings.push('Choppy or tight-range structure reduces signal quality.');
  }
  if (fakeBreakoutPressure) {
    score -= 12;
    warnings.push('Repeated fake breakouts are making momentum less reliable.');
  }
  if (higher.structure === 'neutral') {
    score -= 10;
    warnings.push('Higher timeframe structure is neutral.');
  }
  return { score: clamp(Math.round(score), 0, 100), reasons, warnings, choppy, deepChop, fakeBreakoutPressure };
}

function scoreMomentumTrend(params: {
  side: SignalSide;
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
  const { side, m15, m5, candles15m } = params;
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
  const distanceBreakoutAtr = (side === 'long' ? m15.swingHigh - m15.close : m15.close - m15.swingLow) / Math.max(m15.atrNow, 0.000001);
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
    if (m15.ema20 > m15.ema50) {
      score += 14;
      reasons.push('EMA alignment supports bullish momentum.');
    }
    if (m15.rsiNow >= 50 && m15.rsiNow <= 72 && momentumRising) score += 12;
    if (candleStrengthRatio >= 0.42) {
      score += 8;
      reasons.push('Recent candles show directional body strength.');
    }
    if (distanceBreakoutAtr <= 0.45 && volRatio >= 0.98) {
      score += 8;
      reasons.push('Breakout pressure is building with participation.');
    }
    if (breakout.retestLike) reasons.push('Breakout retest behavior is holding so far.');
    if (m15.rsiNow > 75) score -= 10;
  } else {
    if (m15.ema20 < m15.ema50) {
      score += 14;
      reasons.push('EMA alignment supports bearish momentum.');
    }
    if (m15.rsiNow <= 50 && m15.rsiNow >= 28 && !momentumRising) score += 12;
    if (candleStrengthRatio >= 0.42) {
      score += 8;
      reasons.push('Recent candles show directional body strength.');
    }
    if (distanceBreakoutAtr <= 0.45 && volRatio >= 0.98) {
      score += 8;
      reasons.push('Breakdown pressure is building with participation.');
    }
    if (breakout.retestLike) reasons.push('Breakdown retest behavior is holding so far.');
    if (m15.rsiNow < 25) score -= 10;
  }

  score += Math.round((breakout.quality - 50) * 0.24);

  if (weakVolume) {
    score -= 14;
    warnings.push('Volume is weak relative to recent baseline.');
  }
  if (fakeBreakoutRisk) {
    score -= 10;
    warnings.push('Breakout behavior looks vulnerable to failure without volume support.');
  }
  if (breakout.weak) {
    score -= 12;
    warnings.push('Breakout candles are wick-heavy or lacking follow-through.');
  }
  if (momentumStall) {
    score -= 10;
    warnings.push('Momentum is weakening despite price pressure near the trigger zone.');
  }
  if (conflictingMomentum) {
    score -= 12;
    warnings.push('Conflicting momentum across timeframes reduces conviction.');
  }
  return {
    score: clamp(Math.round(score), 0, 100),
    reasons,
    warnings,
    weakVolume,
    conflict: conflictingMomentum,
    momentumStall,
    breakoutWeak: breakout.weak,
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
  const distToResistanceAtr = (m15.swingHigh - m15.close) / atrNow;
  const distToSupportAtr = (m15.close - m15.swingLow) / atrNow;
  const extensionAtr = Math.abs(m15.close - m15.ema20) / atrNow;
  const compression = rangeCompressionScore(candles15m, m15.atrNow);
  const avgRange = candles15m.slice(-20).reduce((sum, c) => sum + (c.high - c.low), 0) / Math.max(1, Math.min(20, candles15m.length));
  const lowVolatility = avgRange < atrNow * 0.7;
  let poorLocation = false;
  let heavyNearbyLevel = false;

  if (side === 'long' && distToResistanceAtr < 0.36) {
    score -= distToResistanceAtr < 0.24 ? 20 : 14;
    poorLocation = true;
    heavyNearbyLevel = distToResistanceAtr < 0.24;
    warnings.push('Long setup is too close to resistance overhead.');
  }
  if (side === 'short' && distToSupportAtr < 0.36) {
    score -= distToSupportAtr < 0.24 ? 20 : 14;
    poorLocation = true;
    heavyNearbyLevel = distToSupportAtr < 0.24;
    warnings.push('Short setup is too close to support below.');
  }
  if (compression >= 0.72) {
    score -= 14;
    warnings.push('Trade is developing in a choppy, tight range.');
  }
  if (lowVolatility) {
    score -= 10;
    warnings.push('Price movement is quiet, reducing follow-through odds.');
  }
  const breakoutHasRoom =
    side === 'long' ? distToResistanceAtr > 0.15 : distToSupportAtr > 0.15;
  if (setupType === 'breakout' && breakoutHasRoom) {
    score += 10;
    reasons.push('Breakout location has room if confirmation holds.');
  }
  if (setupType === 'pullback' && extensionAtr <= 0.9) {
    score += 8;
    reasons.push('Pullback location remains close to trend support/resistance.');
  }
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

  if (alignedWithHigher) {
    score += 24;
    reasons.push('Higher timeframe trend alignment supports continuation bias.');
  } else if (counterTrend) {
    score -= 26;
    warnings.push('Setup is counter to the higher timeframe trend.');
  } else {
    score -= 6;
    warnings.push('Higher timeframe trend is neutral.');
  }
  if (heavyConflict) {
    score -= 16;
    warnings.push('Conflicting signals detected across timeframes.');
  } else if (lower.structure !== 'neutral' && higher.structure !== 'neutral') {
    score += 8;
  }

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

function assessDirectionalBias(params: {
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
  const m5 = params.candles5m && params.candles5m.length >= 60 ? coreMetrics(params.candles5m) : null;
  const higher = structureFromMetrics(m15);
  const lower = m5 ? structureFromMetrics(m5) : { structure: 'neutral' as StructureState, strength: 0 };

  const structure = scoreMarketStructure({ side: params.side, m15, candles15m: params.candles15m, higher });
  const momentum = scoreMomentumTrend({ side: params.side, m15, m5, candles15m: params.candles15m });
  const context = scoreContextLocation({
    side: params.side,
    m15,
    candles15m: params.candles15m,
    setupType: params.setupType,
  });
  const mtf = scoreMtfAlignment({ side: params.side, higher, lower });
  const atrWindow = atr(params.candles15m, 14);
  const atrNow = Math.max(m15.atrNow, 0.000001);
  const atrAvg = rollingAvg(atrWindow, 20).at(-1) ?? atrNow;
  const atrRatio = atrAvg > 0 ? atrNow / atrAvg : 1;
  const volatilityCompression = atrRatio < 0.86;
  const volatilitySpike = atrRatio > 1.35;

  const rawConfidence = clamp(
    Math.round(structure.score * 0.35 + momentum.score * 0.25 + context.score * 0.2 + mtf.score * 0.2),
    0,
    100,
  );
  let confidence = rawConfidence;

  const antiSpamReasons: string[] = [];
  if (momentum.weakVolume) {
    confidence = Math.min(confidence, 72);
    antiSpamReasons.push('Confidence capped due to weak volume.');
  }
  if (context.heavyNearbyLevel) {
    confidence = Math.max(0, confidence - 10);
    antiSpamReasons.push('Confidence reduced due to nearby opposing level risk.');
  }
  if (structure.deepChop || structure.fakeBreakoutPressure) {
    confidence = Math.min(confidence, 55);
    antiSpamReasons.push('Hard cap active in range-bound / fake-breakout conditions.');
  } else if (structure.choppy || context.lowVolatility || volatilityCompression) {
    confidence = Math.min(confidence, 62);
    antiSpamReasons.push('Confidence capped in choppy or quiet market conditions.');
  }
  if (mtf.heavyConflict) {
    confidence = Math.min(confidence, 64);
    antiSpamReasons.push('Confidence capped due to timeframe disagreement.');
  } else if (mtf.counterTrend) {
    confidence = Math.min(confidence, 68);
    antiSpamReasons.push('Counter-trend setup capped to pullback confidence range.');
  }
  if (momentum.momentumStall || momentum.breakoutWeak) confidence = Math.min(confidence, 72);
  if (params.setupType === 'overextended') confidence = Math.min(confidence, 64);
  const premiumAligned =
    structure.score >= 72 &&
    momentum.score >= 72 &&
    context.score >= 68 &&
    mtf.score >= 72 &&
    !momentum.weakVolume &&
    !structure.choppy &&
    !mtf.counterTrend &&
    !mtf.heavyConflict &&
    !context.poorLocation &&
    !volatilityCompression;
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
    if (params.adaptiveFeedback.tightenConfirmation && params.setupType === 'breakout') {
      confidence = Math.min(confidence, 68);
    }
    if (params.adaptiveFeedback.allowEarlierRecognition && params.setupType !== 'overextended') {
      confidence = Math.min(100, confidence + 2);
    }
  }
  if (params.strategyPersonalityProfile) {
    confidence = clamp(confidence + params.strategyPersonalityProfile.confidenceAdjustment, 0, 100);
    if (params.setupType === 'breakout') confidence = clamp(confidence + params.strategyPersonalityProfile.breakoutBoost, 0, 100);
    if (params.setupType === 'pullback') confidence = clamp(confidence + params.strategyPersonalityProfile.pullbackBoost, 0, 100);
    if (params.setupType === 'overextended') {
      confidence = clamp(confidence + params.strategyPersonalityProfile.overextendedPenalty, 0, 100);
    }
    if (mtf.counterTrend) confidence = Math.max(0, confidence - params.strategyPersonalityProfile.counterTrendPenalty);
    if (structure.choppy) confidence = Math.max(0, confidence - params.strategyPersonalityProfile.chopPenalty);
    if (momentum.weakVolume) confidence = Math.max(0, confidence - params.strategyPersonalityProfile.weakVolumePenalty);
  }
  if (params.adaptationConfidenceAdjustment) {
    confidence = clamp(confidence + params.adaptationConfidenceAdjustment, 0, 100);
  }

  if (DEBUG) {
    console.log(`[Sigflo][Bias] ${params.setupType}/${params.side} confidence`, {
      raw: rawConfidence,
      final: confidence,
      cappedBy: antiSpamReasons,
      structureScore: structure.score,
      momentumScore: momentum.score,
      contextScore: context.score,
      mtfScore: mtf.score,
      flags: {
        weakVolume: momentum.weakVolume,
        deepChop: structure.deepChop,
        fakeBreakoutPressure: structure.fakeBreakoutPressure,
        choppy: structure.choppy,
        lowVolatility: context.lowVolatility,
        volatilityCompression,
        heavyConflict: mtf.heavyConflict,
        counterTrend: mtf.counterTrend,
        momentumStall: momentum.momentumStall,
        breakoutWeak: momentum.breakoutWeak,
        poorLocation: context.poorLocation,
      },
      rsiNow: m15.rsiNow,
      atrNow: m15.atrNow,
      close: m15.close,
      ema20: m15.ema20,
      ema50: m15.ema50,
    });
  }

  const volatilityQuality = volatilityCompression ? 36 : volatilitySpike ? 48 : 72;
  const invalidationClarity = params.setupType === 'pullback' ? 76 : params.setupType === 'breakout' ? 64 : 44;
  const rrPotential = clamp(Math.round((context.score * 0.5 + (100 - Math.abs(m15.close - m15.ema20) / Math.max(0.000001, m15.atrNow) * 22) * 0.5)), 0, 100);
  const setupQuality = clamp(
    Math.round(
      params.setupScore * 0.4 +
        structure.score * 0.2 +
        context.score * 0.2 +
        rrPotential * 0.1 +
        invalidationClarity * 0.05 +
        volatilityQuality * 0.05,
    ),
    0,
    100,
  );

  const forceNeutral = mtf.heavyConflict || structure.deepChop || confidence < 45;
  const blockStrong =
    confidence < 65 ||
    mtf.heavyConflict ||
    mtf.counterTrend ||
    structure.choppy ||
    momentum.weakVolume ||
    momentum.momentumStall;
  const directionalBias = directionalBiasFromScore(params.side, confidence, { forceNeutral, blockStrong });
  const riskLevel = riskLevelFromContext({
    confidence,
    counterTrend: mtf.counterTrend,
    heavyConflict: mtf.heavyConflict,
    weakVolume: momentum.weakVolume,
    choppy: structure.choppy,
    volatilitySpike,
  });
  const riskTag = riskTagFromLevel(riskLevel);
  const biasLabel = directionLabelFromBias(directionalBias);

  const reasons = [...structure.reasons, ...momentum.reasons, ...context.reasons, ...mtf.reasons].slice(0, 5);
  const memoryWarnings =
    params.marketMemory && params.marketMemory.failedBreakoutsRecent >= 2
      ? ['Recent breakout attempts have repeatedly failed.']
      : [];
  const warnings = [
    ...structure.warnings,
    ...momentum.warnings,
    ...context.warnings,
    ...mtf.warnings,
    ...memoryWarnings,
    ...antiSpamReasons,
    ...(params.adaptiveFeedback?.notes ?? []),
  ].slice(0, 5);

  const trendSentence =
    mtf.counterTrend
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
  const memorySentence =
    params.marketMemory == null
      ? ''
      : params.marketMemory.breakoutStatus === 'failed'
        ? 'Recent fakeouts keep continuation confidence restrained.'
        : params.marketMemory.breakoutStatus === 'building'
          ? 'Breakout pressure is rebuilding after recent consolidation.'
          : '';
  const adaptiveSentence =
    params.adaptiveFeedback && params.adaptiveFeedback.notes.length > 0
      ? params.adaptiveFeedback.notes[0]
      : '';
  const personalitySentence =
    params.strategyPersonalityProfile?.tone === 'cautious'
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

  const lifecycleStage: CryptoSignal['signalLifecycleStage'] =
    confidence < 45
      ? params.marketMemory?.failedBreakoutsRecent && params.marketMemory.failedBreakoutsRecent >= 3
        ? 'invalidated'
        : 'emerging'
      : confidence < 60
        ? 'developing'
        : confidence < 75
          ? 'confirmed'
          : momentum.momentumStall || params.marketMemory?.momentumState === 'weakening'
            ? 'weakening'
            : 'active';
  const marketState: NonNullable<CryptoSignal['marketState']> = {
    regime: params.marketMemory?.regime ?? (structure.choppy ? 'range' : 'trend'),
    dominantBias:
      params.marketMemory?.dominantBias ??
      (higher.structure === 'bullish' ? 'bullish' : higher.structure === 'bearish' ? 'bearish' : 'neutral'),
    momentumState: params.marketMemory?.momentumState ?? (momentum.momentumStall ? 'weakening' : 'flat'),
    volatilityState: params.marketMemory?.volatilityState ?? (volatilitySpike ? 'expanding' : 'contracting'),
    breakoutStatus: params.marketMemory?.breakoutStatus ?? (params.setupType === 'breakout' ? 'building' : 'failed'),
  };

  return {
    side: params.side,
    confidence,
    counterTrend: mtf.counterTrend,
    structure: higher.structure,
    structureStrength: higher.strength,
    setupQuality,
    riskTag,
    riskLevel,
    directionalBias,
    biasLabel,
    higherTimeframeBias: mtf.higherTimeframeBias,
    reasons,
    warnings,
    lifecycleStage,
    marketState,
    aiExplanation: `${trendSentence} ${momentumSentence}${memorySentence ? ` ${memorySentence}` : ''}${adaptiveSentence ? ` ${adaptiveSentence}` : ''}${personalitySentence ? ` ${personalitySentence}` : ''}`,
    whyThisMatters:
      warnings.length > 0
        ? `${contextSentence} ${warnings[0]}`
        : `${contextSentence} Confidence reflects weighted structure, momentum, context, and timeframe alignment.`,
  };
}

function rangeCompressionScore(candles: Candle[], atrNow: number): number {
  const recent = candles.slice(-8);
  const sumRange = recent.reduce((s, c) => s + (c.high - c.low), 0);
  const ratio = atrNow > 0 ? sumRange / atrNow : 99;
  return clamp((2.6 - ratio) / 1.6, 0, 1);
}

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

function breakoutPressureDetector(candles: Candle[], thresholds: DetectorThresholds): DetectorOutput | null {
  if (candles.length < 60) return null;
  const m = coreMetrics(candles);
  const trend = m.close > m.ema20 && m.ema20 > m.ema50 && m.ema20 > m.ema20Prev && m.ema50 > m.ema50Prev;
  const compression = rangeCompressionScore(candles, m.atrNow);
  const distToHigh = m.swingHigh - m.close;
  const distanceToBreakoutAtr = m.atrNow > 0 ? distToHigh / m.atrNow : 99;
  const nearBreakout = m.atrNow > 0 && distToHigh >= 0 && distToHigh < thresholds.breakoutDistAtr * m.atrNow;
  const volBoost = m.volAvg > 0 ? m.volNow / m.volAvg : 1;
  const volOk = volBoost > thresholds.breakoutVolRatio;
  const rsiSlope = m.rsiNow - m.rsiPrev;
  const rsiOk = m.rsiNow >= 55 && m.rsiNow <= 72 && rsiSlope >= -0.5;
  const last = candles.at(-1);
  const prev = candles.at(-2);
  const bodyNow = last ? Math.abs(last.close - last.open) : 0;
  const rangeNow = last ? Math.max(0.000001, last.high - last.low) : 1;
  const bodyStrength = bodyNow / rangeNow;
  const followThrough = last && prev ? last.close >= prev.close : false;
  const breakoutValid = volOk && bodyStrength >= 0.5 && followThrough;
  const conditions = {
    trend,
    compression: compression > thresholds.breakoutCompression,
    nearBreakout,
    rsiOk,
    breakoutValid,
  };
  const passCount = Object.values(conditions).filter(Boolean).length;
  // Hard guard: RSI > 76 means the setup is already overextended, not pre-breakout.
  // This also prevents the breakout detector from co-activating with overextended when
  // rsiOk=false is the only failing condition (letting passCount reach 4 via the 4/5 rule).
  if (m.rsiNow > 76 || passCount < 4 || !breakoutValid) {
    if (DEBUG) {
      console.log('[Sigflo][Detector] breakoutPressure REJECT', {
        passCount, conditions, rsiNow: m.rsiNow, rsiOk, volBoost, bodyStrength, followThrough,
        distanceToBreakoutAtr: Number(distanceToBreakoutAtr.toFixed(3)),
        compression: Number(compression.toFixed(3)),
        close: m.close, ema20: m.ema20, ema50: m.ema50,
      });
    }
    return null;
  }
  if (DEBUG) {
    console.log('[Sigflo][Detector] breakoutPressure PASS', {
      passCount, conditions, rsiNow: m.rsiNow, volBoost, bodyStrength, compression,
      distanceToBreakoutAtr: Number(distanceToBreakoutAtr.toFixed(3)),
    });
  }
  return {
    setupType: 'breakout',
    side: 'long',
    biasLabel: 'Potential Long',
    setupTags: ['Breakout'],
    riskTag: 'Medium Risk',
    aiExplanation: 'Range is tightening and pressure is building into local highs.',
    whyThisMatters: 'A clean break can move quickly when resistance overhead is thin.',
    breakdown: {
      trendAlignment: trend ? 22 : 14,
      momentumQuality: clamp(Math.round(((m.rsiNow - 50) / 22) * 20), 8, 18),
      structureQuality: clamp(Math.round((compression * 0.6 + (nearBreakout ? 0.4 : 0.2)) * 25), 10, 22),
      volumeConfirmation: clamp(Math.round(Math.min(volBoost, 2) / 2 * 15), 6, 14),
      riskConditions: 8,
    },
    facts: {
      emaTrend: trend ? 'bullish' : 'neutral',
      volumeRatio: Number(volBoost.toFixed(2)),
      rsi: Number(m.rsiNow.toFixed(1)),
      distanceToBreakoutAtr: Number(distanceToBreakoutAtr.toFixed(2)),
    },
  };
}

function pullbackContinuationDetector(candles: Candle[], thresholds: DetectorThresholds): DetectorOutput | null {
  if (candles.length < 60) return null;
  const m = coreMetrics(candles);
  const trendUp = m.ema20 > m.ema50;
  const nearEma = m.atrNow > 0 && Math.abs(m.close - m.ema20) <= thresholds.pullbackMaxDistAtr * m.atrNow;
  const pullbackDepth = m.atrNow > 0 ? (m.ema20 - m.close) / m.atrNow : 0;
  const depthOk = pullbackDepth >= -0.3 && pullbackDepth <= 1.5;
  const rsiOk = m.rsiNow >= 45 && m.rsiNow <= 60 && m.rsiNow >= m.rsiPrev;
  const recent = candles.slice(-8);
  const redVol = recent.filter((c) => c.close < c.open).reduce((s, c) => s + c.volume, 0);
  const greenVol = recent.filter((c) => c.close >= c.open).reduce((s, c) => s + c.volume, 0);
  const volCool = redVol < greenVol * 1.05;
  const conditions = { trendUp, nearEma, depthOk, rsiOk, volCool };
  const passCount = Object.values(conditions).filter(Boolean).length;
  if (passCount < 4) {
    if (DEBUG) console.log('[Sigflo][Detector] pullbackContinuation REJECT', { passCount, conditions, rsiNow: m.rsiNow, pullbackDepth: Number(pullbackDepth.toFixed(3)), close: m.close, ema20: m.ema20 });
    return null;
  }
  if (DEBUG) console.log('[Sigflo][Detector] pullbackContinuation PASS', { passCount, conditions, rsiNow: m.rsiNow });
  return {
    setupType: 'pullback',
    side: 'long',
    biasLabel: 'Potential Long',
    setupTags: ['Pullback'],
    riskTag: 'Low Risk',
    aiExplanation: 'Pullback remains orderly while trend structure stays intact.',
    whyThisMatters: 'If buyers hold this zone, continuation entries often get cleaner risk.',
    breakdown: {
      trendAlignment: trendUp ? 21 : 14,
      momentumQuality: clamp(Math.round((1 - Math.abs(52 - m.rsiNow) / 16) * 20), 9, 17),
      structureQuality: clamp(Math.round(((nearEma ? 0.5 : 0.2) + (depthOk ? 0.5 : 0.2)) * 25), 12, 22),
      volumeConfirmation: volCool ? 11 : 8,
      riskConditions: 10,
    },
    facts: {
      emaTrend: trendUp ? 'bullish' : 'neutral',
      volumeRatio: Number((m.volNow / Math.max(1, m.volAvg)).toFixed(2)),
      rsi: Number(m.rsiNow.toFixed(1)),
      pullbackDepthAtr: Number(pullbackDepth.toFixed(2)),
    },
  };
}

function overextendedDetector(candles: Candle[], thresholds: DetectorThresholds): DetectorOutput | null {
  if (candles.length < 60) return null;
  const m = coreMetrics(candles);
  const stretch = m.atrNow > 0 ? Math.abs(m.close - m.ema20) / m.atrNow : 0;
  const stretchOk = stretch > thresholds.overextendedStretchAtr;
  const rsiHot = m.rsiNow > 74;
  const c3 = candles.slice(-3);
  const gain3 = c3.length > 0 ? c3[c3.length - 1].close - c3[0].open : 0;
  const expansion = m.atrNow > 0 ? gain3 / m.atrNow : 0;
  const expansionOk = expansion > 1.5;
  const nearResistance = m.atrNow > 0 && m.swingHigh - m.close < 0.4 * m.atrNow;
  const conditions = { stretchOk, rsiHot, expansionOk, nearResistance };
  const passCount = Object.values(conditions).filter(Boolean).length;
  if (passCount < 3) {
    if (DEBUG) console.log('[Sigflo][Detector] overextended REJECT', { passCount, conditions, rsiNow: m.rsiNow, stretch: Number(stretch.toFixed(3)), expansion: Number(expansion.toFixed(3)) });
    return null;
  }
  if (DEBUG) console.log('[Sigflo][Detector] overextended PASS', { passCount, conditions, rsiNow: m.rsiNow, stretch: Number(stretch.toFixed(3)) });
  return {
    setupType: 'overextended',
    side: 'long',
    biasLabel: 'Overextended',
    setupTags: ['Overextended'],
    riskTag: 'High Risk',
    aiExplanation: 'Price is extended away from trend support and momentum is overheated.',
    whyThisMatters: 'Late entries here are vulnerable if price reverts toward trend mean.',
    breakdown: {
      trendAlignment: 15,
      momentumQuality: 12,
      structureQuality: 10,
      volumeConfirmation: 8,
      riskConditions: 4,
    },
    facts: {
      emaTrend: m.close > m.ema20 ? 'bullish' : 'neutral',
      volumeRatio: Number((m.volNow / Math.max(1, m.volAvg)).toFixed(2)),
      rsi: Number(m.rsiNow.toFixed(1)),
      extensionAtr: Number(stretch.toFixed(2)),
      distanceToBreakoutAtr: Number(((m.swingHigh - m.close) / Math.max(0.000001, m.atrNow)).toFixed(2)),
    },
  };
}

/** Bearish mirror of `breakoutPressureDetector`: downtrend, compression into local lows, sell-volume pressure. */
function breakdownPressureDetector(candles: Candle[], thresholds: DetectorThresholds): DetectorOutput | null {
  if (candles.length < 60) return null;
  const m = coreMetrics(candles);
  const trend =
    m.close < m.ema20 && m.ema20 < m.ema50 && m.ema20 < m.ema20Prev && m.ema50 < m.ema50Prev;
  const compression = rangeCompressionScore(candles, m.atrNow);
  const distToLow = m.close - m.swingLow;
  const distanceToBreakdownAtr = m.atrNow > 0 ? distToLow / m.atrNow : 99;
  const nearBreakdown = m.atrNow > 0 && distToLow >= 0 && distToLow < thresholds.breakoutDistAtr * m.atrNow;
  const volBoost = m.volAvg > 0 ? m.volNow / m.volAvg : 1;
  const volOk = volBoost > thresholds.breakoutVolRatio;
  const rsiSlope = m.rsiNow - m.rsiPrev;
  const rsiOk = m.rsiNow >= 28 && m.rsiNow <= 45 && rsiSlope <= 0.5;
  const last = candles.at(-1);
  const prev = candles.at(-2);
  const bodyNow = last ? Math.abs(last.close - last.open) : 0;
  const rangeNow = last ? Math.max(0.000001, last.high - last.low) : 1;
  const bodyStrength = bodyNow / rangeNow;
  const followThrough = last && prev ? last.close <= prev.close : false;
  const breakoutValid = volOk && bodyStrength >= 0.5 && followThrough;
  const conditions = {
    trend,
    compression: compression > thresholds.breakoutCompression,
    nearBreakdown,
    rsiOk,
    breakoutValid,
  };
  const passCount = Object.values(conditions).filter(Boolean).length;
  // Hard guard: RSI < 24 means the setup is already overextended short, not pre-breakdown.
  if (m.rsiNow < 24 || passCount < 4 || !breakoutValid) {
    if (DEBUG) {
      console.log('[Sigflo][Detector] breakdownPressure REJECT', {
        passCount, conditions, rsiNow: m.rsiNow, rsiOk, volBoost, bodyStrength, followThrough,
        distanceToBreakdownAtr: Number(distanceToBreakdownAtr.toFixed(3)),
        compression: Number(compression.toFixed(3)),
        close: m.close, ema20: m.ema20, ema50: m.ema50,
      });
    }
    return null;
  }
  if (DEBUG) {
    console.log('[Sigflo][Detector] breakdownPressure PASS', {
      passCount, conditions, rsiNow: m.rsiNow, volBoost, bodyStrength, compression,
      distanceToBreakdownAtr: Number(distanceToBreakdownAtr.toFixed(3)),
    });
  }
  return {
    setupType: 'breakout',
    side: 'short',
    biasLabel: 'Potential Short',
    setupTags: ['Breakout'],
    riskTag: 'Medium Risk',
    aiExplanation: 'Range is tightening and supply is pressing into local lows.',
    whyThisMatters: 'A clean break lower can accelerate when bids thin under the shelf.',
    breakdown: {
      trendAlignment: trend ? 22 : 14,
      momentumQuality: clamp(Math.round(((50 - m.rsiNow) / 22) * 20), 8, 18),
      structureQuality: clamp(Math.round((compression * 0.6 + (nearBreakdown ? 0.4 : 0.2)) * 25), 10, 22),
      volumeConfirmation: clamp(Math.round(Math.min(volBoost, 2) / 2 * 15), 6, 14),
      riskConditions: 8,
    },
    facts: {
      emaTrend: trend ? 'bearish' : 'neutral',
      volumeRatio: Number(volBoost.toFixed(2)),
      rsi: Number(m.rsiNow.toFixed(1)),
      distanceToBreakoutAtr: Number(distanceToBreakdownAtr.toFixed(2)),
    },
  };
}

/** Bearish mirror of `pullbackContinuationDetector`: downtrend bounce into EMA, fading buying. */
function pullbackContinuationShortDetector(candles: Candle[], thresholds: DetectorThresholds): DetectorOutput | null {
  if (candles.length < 60) return null;
  const m = coreMetrics(candles);
  const trendDown = m.ema20 < m.ema50;
  const nearEma = m.atrNow > 0 && Math.abs(m.close - m.ema20) <= thresholds.pullbackMaxDistAtr * m.atrNow;
  const bounceDepth = m.atrNow > 0 ? (m.close - m.ema20) / m.atrNow : 0;
  const depthOk = bounceDepth >= -0.3 && bounceDepth <= 1.5;
  const rsiOk = m.rsiNow >= 40 && m.rsiNow <= 58 && m.rsiNow <= m.rsiPrev;
  const recent = candles.slice(-8);
  const redVol = recent.filter((c) => c.close < c.open).reduce((s, c) => s + c.volume, 0);
  const greenVol = recent.filter((c) => c.close >= c.open).reduce((s, c) => s + c.volume, 0);
  const volCool = greenVol < redVol * 1.05;
  const conditions = { trendDown, nearEma, depthOk, rsiOk, volCool };
  const passCount = Object.values(conditions).filter(Boolean).length;
  if (passCount < 4) {
    if (DEBUG) console.log('[Sigflo][Detector] pullbackContinuationShort REJECT', { passCount, conditions, rsiNow: m.rsiNow, bounceDepth: Number(bounceDepth.toFixed(3)), close: m.close, ema20: m.ema20 });
    return null;
  }
  if (DEBUG) console.log('[Sigflo][Detector] pullbackContinuationShort PASS', { passCount, conditions, rsiNow: m.rsiNow });
  return {
    setupType: 'pullback',
    side: 'short',
    biasLabel: 'Potential Short',
    setupTags: ['Pullback'],
    riskTag: 'Low Risk',
    aiExplanation: 'Bounce into the mean is losing participation while the broader trend stays down.',
    whyThisMatters: 'If sellers reassert here, continuation shorts often get cleaner invalidation above the bounce.',
    breakdown: {
      trendAlignment: trendDown ? 21 : 14,
      momentumQuality: clamp(Math.round((1 - Math.abs(48 - m.rsiNow) / 16) * 20), 9, 17),
      structureQuality: clamp(Math.round(((nearEma ? 0.5 : 0.2) + (depthOk ? 0.5 : 0.2)) * 25), 12, 22),
      volumeConfirmation: volCool ? 11 : 8,
      riskConditions: 10,
    },
    facts: {
      emaTrend: trendDown ? 'bearish' : 'neutral',
      volumeRatio: Number((m.volNow / Math.max(1, m.volAvg)).toFixed(2)),
      rsi: Number(m.rsiNow.toFixed(1)),
      pullbackDepthAtr: Number(bounceDepth.toFixed(2)),
    },
  };
}

/** Bearish mirror of `overextendedDetector`: stretched below the mean, oversold heat, near local support. */
function overextendedShortDetector(candles: Candle[], thresholds: DetectorThresholds): DetectorOutput | null {
  if (candles.length < 60) return null;
  const m = coreMetrics(candles);
  const stretch = m.atrNow > 0 ? Math.abs(m.close - m.ema20) / m.atrNow : 0;
  const stretchOk = stretch > thresholds.overextendedStretchAtr;
  const rsiCold = m.rsiNow < 26;
  const c3 = candles.slice(-3);
  const drop3 = c3.length > 0 ? c3[0].open - c3[c3.length - 1].close : 0;
  const expansion = m.atrNow > 0 ? drop3 / m.atrNow : 0;
  const expansionOk = expansion > 1.5;
  const nearSupport = m.atrNow > 0 && m.close - m.swingLow < 0.4 * m.atrNow;
  const conditions = { stretchOk, rsiCold, expansionOk, nearSupport };
  const passCount = Object.values(conditions).filter(Boolean).length;
  if (passCount < 3) {
    if (DEBUG) console.log('[Sigflo][Detector] overextendedShort REJECT', { passCount, conditions, rsiNow: m.rsiNow, stretch: Number(stretch.toFixed(3)), expansion: Number(expansion.toFixed(3)) });
    return null;
  }
  if (DEBUG) console.log('[Sigflo][Detector] overextendedShort PASS', { passCount, conditions, rsiNow: m.rsiNow, stretch: Number(stretch.toFixed(3)) });
  return {
    setupType: 'overextended',
    side: 'short',
    biasLabel: 'Overextended',
    setupTags: ['Overextended'],
    riskTag: 'High Risk',
    aiExplanation: 'Price is extended below trend resistance and momentum is washed out.',
    whyThisMatters: 'Late shorts into a flush can face sharp squeezes if mean reversion kicks in.',
    breakdown: {
      trendAlignment: 15,
      momentumQuality: 12,
      structureQuality: 10,
      volumeConfirmation: 8,
      riskConditions: 4,
    },
    facts: {
      emaTrend: m.close < m.ema20 ? 'bearish' : 'neutral',
      volumeRatio: Number((m.volNow / Math.max(1, m.volAvg)).toFixed(2)),
      rsi: Number(m.rsiNow.toFixed(1)),
      extensionAtr: Number(stretch.toFixed(2)),
      distanceToBreakoutAtr: Number(((m.close - m.swingLow) / Math.max(0.000001, m.atrNow)).toFixed(2)),
    },
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

function mapRiskTag(score: number, detectorRisk: SignalRiskTag): SignalRiskTag {
  if (detectorRisk === 'High Risk') return 'High Risk';
  if (score >= 75) return 'Low Risk';
  if (score >= 60) return 'Medium Risk';
  return 'High Risk';
}

function timingStatePriority(state: CandidateLifecycle['state'] | undefined): number {
  if (state === 'triggered') return 5;
  if (state === 'ready') return 4;
  if (state === 'developing') return 3;
  if (state === 'extended') return 2;
  if (state === 'expired') return 1;
  return 0;
}

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
  const lastCandleTs = input.candles15m.at(-1)?.ts;
  const lastCandleClosed = input.candles15m.at(-1)?.isClosed;
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
      lastCandleTs: lastCandleTs ? new Date(lastCandleTs).toISOString() : null,
      lastCandleClosed,
      rejected: debugRejectLog,
      accepted: debugAcceptLog,
      selected: best ? { detector: `${best.out.setupType}/${best.out.side}`, confidence: best.bias.confidence, timingState: best.lifecycle.state } : null,
    });
  }
  if (!best) return null;
  const { out, bias, lifecycle, diagnostics } = best;
  const signal: CryptoSignal = {
    id: `live-${input.symbol}-${Date.now()}`,
    pair: input.symbol.replace('USDT', ''),
    side: out.side,
    biasLabel: bias.biasLabel,
    directionalBias: bias.directionalBias,
    setupType: out.setupType,
    setupScore: bias.confidence,
    setupScoreLabel: getSetupScoreLabel(bias.confidence),
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
