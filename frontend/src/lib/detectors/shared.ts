import { ema, rollingAvg, rsi, atr, recentSwingHigh, recentSwingLow } from '@/lib/indicators';
import type { Candle } from '@/types/market';
import type { DirectionalRiskLevel, SignalRiskTag, SignalSetupTag, SignalSide } from '@/types/signal';

export type DetectorOutput = {
  setupType: 'breakout' | 'pullback' | 'overextended';
  side: SignalSide;
  biasLabel: string;
  setupTags: SignalSetupTag[];
  riskTag: SignalRiskTag;
  aiExplanation: string;
  whyThisMatters: string;
  breakdown: {
    trendAlignment: number;
    momentumQuality: number;
    structureQuality: number;
    volumeConfirmation: number;
    riskConditions: number;
  };
  facts: {
    emaTrend: 'neutral' | 'bullish' | 'bearish';
    volumeRatio: number;
    rsi: number;
    distanceToBreakoutAtr?: number;
    pullbackDepthAtr?: number;
    extensionAtr?: number;
    confidence?: number;
  };
};

export type StructureState = 'bullish' | 'bearish' | 'neutral';

export type DetectorThresholds = {
  breakoutVolRatio: number;
  breakoutDistAtr: number;
  breakoutCompression: number;
  pullbackMaxDistAtr: number;
  overextendedStretchAtr: number;
};

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function coreMetrics(candles: Candle[]) {
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

export function structureFromMetrics(m: ReturnType<typeof coreMetrics>): { structure: StructureState; strength: number } {
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

export function structureSwingSignals(candles: Candle[]): {
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

export function directionalEfficiency(candles: Candle[]): number {
  const recent = candles.slice(-20);
  if (recent.length < 6) return 0;
  const net = Math.abs((recent.at(-1)?.close ?? 0) - (recent[0]?.open ?? 0));
  const travel = recent.reduce((sum, c) => sum + Math.abs(c.close - c.open), 0);
  if (travel <= 0) return 0;
  return clamp(net / travel, 0, 1);
}

export function overlapRatio(candles: Candle[]): number {
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

export function fakeBreakoutCount(candles: Candle[], m15: ReturnType<typeof coreMetrics>): number {
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

export function breakoutQuality(candles: Candle[], side: SignalSide, m15: ReturnType<typeof coreMetrics>): {
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

export function rangeCompressionScore(candles: Candle[], atrNow: number): number {
  const recent = candles.slice(-8);
  const sumRange = recent.reduce((s, c) => s + (c.high - c.low), 0);
  const ratio = atrNow > 0 ? sumRange / (8 * atrNow) : 99;
  return clamp((2.6 - ratio) / 1.6, 0, 1);
}

export function directionLabelFromBias(bias: 'strong_long' | 'long' | 'weak_long' | 'strong_short' | 'short' | 'weak_short' | 'neutral'): string {
  if (bias === 'strong_long') return 'Strong Bullish Setup';
  if (bias === 'long') return 'Moderate Bullish Setup';
  if (bias === 'weak_long') return 'Developing Bullish Setup';
  if (bias === 'strong_short') return 'Strong Bearish Setup';
  if (bias === 'short') return 'Moderate Bearish Setup';
  if (bias === 'weak_short') return 'Developing Bearish Setup';
  return 'No Trade / Unclear';
}

export function riskTagFromLevel(level: DirectionalRiskLevel): SignalRiskTag {
  if (level === 'low') return 'Low Risk';
  if (level === 'moderate') return 'Medium Risk';
  return 'High Risk';
}

export function mapRiskTag(score: number, detectorRisk: SignalRiskTag): SignalRiskTag {
  if (detectorRisk === 'High Risk') return 'High Risk';
  if (score >= 75) return 'Low Risk';
  if (score >= 60) return 'Medium Risk';
  return 'High Risk';
}

export function timingStatePriority(state: string | undefined): number {
  if (state === 'triggered') return 5;
  if (state === 'ready') return 4;
  if (state === 'developing') return 3;
  if (state === 'extended') return 2;
  if (state === 'expired') return 1;
  return 0;
}
