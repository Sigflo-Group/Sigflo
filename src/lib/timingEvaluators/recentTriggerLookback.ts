import { atr, ema, recentSwingHigh, recentSwingLow, rsi } from '@/lib/indicators';
import type { Candle } from '@/types/market';

export function findRecentBreakoutCrossover(
  candles: Candle[],
  side: 'long' | 'short',
  lookbackBars = 12,
): { candleIndex: number; ts: number; triggerLevel: number } | null {
  if (candles.length < 2) return null;
  const start = Math.max(1, candles.length - lookbackBars);
  for (let i = candles.length - 1; i >= start; i -= 1) {
    const prior = candles.slice(0, i);
    if (prior.length < 2) continue;
    const triggerLevel =
      side === 'long' ? recentSwingHigh(prior, 40) : recentSwingLow(prior, 40);
    if (!Number.isFinite(triggerLevel) || triggerLevel <= 0) continue;
    const close = candles[i]!.close;
    const prevClose = candles[i - 1]!.close;
    const crossed =
      side === 'long'
        ? close > triggerLevel && prevClose <= triggerLevel
        : close < triggerLevel && prevClose >= triggerLevel;
    if (crossed) return { candleIndex: i, ts: candles[i]!.ts, triggerLevel };
  }
  return null;
}

export function findRecentPullbackBounce(
  candles: Candle[],
  side: 'long' | 'short',
  lookbackBars = 8,
): { candleIndex: number; ts: number } | null {
  if (candles.length < 25) return null;
  const closes = candles.map((c) => c.close);
  const ema20Series = ema(closes, 20);
  const ema50Series = ema(closes, 50);
  const atrSeries = atr(candles, 14);
  const start = Math.max(1, candles.length - lookbackBars);
  for (let i = candles.length - 1; i >= start; i -= 1) {
    const close = candles[i]!.close;
    const prevClose = candles[i - 1]!.close;
    const ema20 = ema20Series[i] ?? close;
    const ema50 = ema50Series[i] ?? close;
    const atrNow = Math.max(1e-8, atrSeries[i] ?? 0);
    const trendAligned = side === 'long' ? ema20 > ema50 : ema20 < ema50;
    if (!trendAligned) continue;

    const bounceStrength = Math.abs(close - prevClose) / atrNow;
    const depthAtr = side === 'long' ? (ema20 - close) / atrNow : (close - ema20) / atrNow;
    const depthFit = Math.min(1, Math.max(0, 1 - Math.abs(depthAtr - 0.45) / 1.2));
    const reclaimEma =
      side === 'long'
        ? close >= ema20 && prevClose <= ema20
        : close <= ema20 && prevClose >= ema20;

    const dipStart = Math.max(0, i - 4);
    const hadPullbackDip = candles.slice(dipStart, i).some((bar, offset) => {
      const idx = dipStart + offset;
      const barEma20 = ema20Series[idx] ?? bar.close;
      const barAtr = Math.max(1e-8, atrSeries[idx] ?? 0);
      const barDepth = side === 'long' ? (barEma20 - bar.close) / barAtr : (bar.close - barEma20) / barAtr;
      return barDepth >= 0.12;
    });
    if (!hadPullbackDip) continue;

    const confirmedBounce =
      bounceStrength > 0.18 && (reclaimEma || (depthFit > 0.4 && close > prevClose && side === 'long') || (depthFit > 0.4 && close < prevClose && side === 'short'));
    if (confirmedBounce) {
      return { candleIndex: i, ts: candles[i]!.ts };
    }
  }
  return null;
}

/**
 * Looks back for the candle where RSI first crossed back from an overextended reading —
 * the same "cooling" crossover `evaluateMeanReversionTiming` checks on the live candle.
 *
 * This exists because `overextendedDetector`'s own qualification gate requires RSI to still
 * be hot (>74 long / <26 short), while the cooling trigger requires RSI to have already
 * crossed back (<72 long / >28 short). A single reversal candle can satisfy the trigger
 * condition while failing the detector's gate on that same candle, which would otherwise
 * cause the setup to be pruned before its trigger is ever evaluated. Scanning recent history
 * recovers that crossover the same way breakout/pullback recover a missed confirmation bar.
 */
export function findRecentMeanReversionCooling(
  candles: Candle[],
  side: 'long' | 'short',
  lookbackBars = 8,
): { candleIndex: number; ts: number } | null {
  if (candles.length < 16) return null;
  const closes = candles.map((c) => c.close);
  const rsiSeries = rsi(closes, 14);
  const start = Math.max(1, candles.length - lookbackBars);
  for (let i = candles.length - 1; i >= start; i -= 1) {
    const rsiNow = rsiSeries[i] ?? 50;
    const rsiPrev = rsiSeries[i - 1] ?? rsiNow;
    const rsiSlope = rsiNow - rsiPrev;
    const crossedCooling =
      side === 'long'
        ? rsiNow < 72 && rsiPrev >= 72 && rsiSlope < 0
        : rsiNow > 28 && rsiPrev <= 28 && rsiSlope > 0;
    if (crossedCooling) return { candleIndex: i, ts: candles[i]!.ts };
  }
  return null;
}
