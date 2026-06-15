import { coreMetrics, rangeCompressionScore, clamp, type DetectorOutput, type DetectorThresholds } from './shared';
import type { Candle } from '@/types/market';

export function breakoutPressureDetector(candles: Candle[], thresholds: DetectorThresholds): DetectorOutput | null {
  if (candles.length < 60) return null;
  const m = coreMetrics(candles);
  const trend = m.close > m.ema20 && m.ema20 > m.ema50 && m.ema20 > m.ema20Prev && m.ema50 > m.ema50Prev;
  const compression = rangeCompressionScore(candles, m.atrNow);
  const distToHigh = m.swingHigh - m.close;
  const distanceToBreakoutAtr = m.atrNow > 0 ? distToHigh / m.atrNow : 99;
  const nearBreakout = m.atrNow > 0 && distToHigh >= 0 && distToHigh < thresholds.breakoutDistAtr * m.atrNow;
  const brokenOut = distToHigh < 0;
  const volBoost = m.volAvg > 0 ? m.volNow / m.volAvg : 1;
  const volOk = volBoost > thresholds.breakoutVolRatio;
  const rsiSlope = m.rsiNow - m.rsiPrev;
  const rsiOk = brokenOut
    ? m.rsiNow >= 50 && m.rsiNow <= 78 && rsiSlope >= -1
    : m.rsiNow >= 55 && m.rsiNow <= 72 && rsiSlope >= -0.5;
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
    nearBreakout: nearBreakout || brokenOut,
    rsiOk,
    breakoutValid,
  };
  const passCount = Object.values(conditions).filter(Boolean).length;

  if (m.rsiNow > 76 && !brokenOut) return null;
  if (passCount < 4 || !breakoutValid) return null;

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

export function pullbackContinuationDetector(candles: Candle[], thresholds: DetectorThresholds): DetectorOutput | null {
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
  if (passCount < 4) return null;

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

export function overextendedDetector(candles: Candle[], thresholds: DetectorThresholds): DetectorOutput | null {
  if (candles.length < 60) return null;
  const m = coreMetrics(candles);
  const stretch = m.atrNow > 0 ? Math.abs(m.close - m.ema20) / m.atrNow : 0;
  const stretchOk = stretch > thresholds.overextendedStretchAtr;
  const rsiHot = m.rsiNow > 74;
  const c3 = candles.slice(-3);
  const gain3 = c3.length > 0 ? c3[c3.length - 1].close - c3[0].open : 0;
  const expansion = m.atrNow > 0 ? gain3 / m.atrNow : 0;
  const expansionOk = expansion > 1.5;
  const nearResistance = m.atrNow > 0 && m.close < m.swingHigh && m.swingHigh - m.close < 0.4 * m.atrNow;
  const conditions = { stretchOk, rsiHot, expansionOk, nearResistance };
  const passCount = Object.values(conditions).filter(Boolean).length;
  if (passCount < 3) return null;

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
