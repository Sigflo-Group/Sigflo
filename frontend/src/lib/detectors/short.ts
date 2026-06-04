import { coreMetrics, rangeCompressionScore, clamp, type DetectorOutput, type DetectorThresholds } from './shared';
import type { Candle } from '@/types/market';

export function breakdownPressureDetector(candles: Candle[], thresholds: DetectorThresholds): DetectorOutput | null {
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
  const conditions = { trend, compression: compression > thresholds.breakoutCompression, nearBreakdown, rsiOk, breakoutValid };
  const passCount = Object.values(conditions).filter(Boolean).length;

  if (m.rsiNow < 24) return null;
  if (passCount < 4 || !breakoutValid) return null;

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

export function pullbackContinuationShortDetector(candles: Candle[], thresholds: DetectorThresholds): DetectorOutput | null {
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
  if (passCount < 4) return null;

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

export function overextendedShortDetector(candles: Candle[], thresholds: DetectorThresholds): DetectorOutput | null {
  if (candles.length < 60) return null;
  const m = coreMetrics(candles);
  const stretch = m.atrNow > 0 ? Math.abs(m.close - m.ema20) / m.atrNow : 0;
  const stretchOk = stretch > thresholds.overextendedStretchAtr;
  const rsiCold = m.rsiNow < 26;
  const c3 = candles.slice(-3);
  const drop3 = c3.length > 0 ? c3[0].open - c3[c3.length - 1].close : 0;
  const expansion = m.atrNow > 0 ? drop3 / m.atrNow : 0;
  const expansionOk = expansion > 1.5;
  const nearSupport = m.atrNow > 0 && m.close > m.swingLow && m.close - m.swingLow < 0.4 * m.atrNow;
  const conditions = { stretchOk, rsiCold, expansionOk, nearSupport };
  const passCount = Object.values(conditions).filter(Boolean).length;
  if (passCount < 3) return null;

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
