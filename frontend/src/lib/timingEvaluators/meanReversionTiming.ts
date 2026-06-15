import type { ScannerTriggerType } from '@/lib/scannerConfig';

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/**
 * Timing evaluator for overextended setups.
 *
 * Unlike breakout/pullback, overextended signals are exhaustion warnings rather than
 * directional entries. The trigger fires when momentum shows its first meaningful
 * cooling from the extreme — RSI crossing back under the overbought / above the
 * oversold threshold, or a confirmed reversal candle. A held-reversion condition
 * keeps the trigger alive while price remains near the mean-reversion zone.
 */
export function evaluateMeanReversionTiming(args: {
  side: 'long' | 'short';
  close: number;
  prevClose: number;
  ema20: number;
  atrNow: number;
  rsiNow: number;
  rsiPrev: number;
  rsiSlope: number;
  roomToTargetAtr: number;
  hasPreviousTrigger: boolean;
}): {
  timingScore: number;
  triggerHit: boolean;
  triggerType: ScannerTriggerType;
  triggerReason: string;
  positiveFactors: string[];
} {
  // For a long-overextended setup: trigger when RSI crosses back below the overbought
  // ceiling (74→<72) — first sign of cooling. For short-overextended: RSI crosses above
  // the oversold floor (26→>28).
  const rsiCrossCooling =
    args.side === 'long'
      ? args.rsiNow < 72 && args.rsiPrev >= 72 && args.rsiSlope < 0
      : args.rsiNow > 28 && args.rsiPrev <= 28 && args.rsiSlope > 0;
  const rsiHotAndCooling =
    args.side === 'long'
      ? args.rsiNow >= 74 && args.rsiSlope <= -0.35
      : args.rsiNow <= 26 && args.rsiSlope >= 0.35;
  const rsiCooling = rsiCrossCooling || rsiHotAndCooling;

  // Reversal candle: price moved meaningfully back toward EMA20 on this bar.
  const revertingTowardEma =
    args.side === 'long'
      ? args.close < args.prevClose && args.close > args.ema20 && (args.prevClose - args.close) > args.atrNow * 0.25
      : args.close > args.prevClose && args.close < args.ema20 && (args.close - args.prevClose) > args.atrNow * 0.25;

  // Held reversion: trigger was already set and price is still in the cooling zone.
  const heldReversion =
    args.hasPreviousTrigger &&
    (args.side === 'long'
      ? args.rsiNow < 72 && args.close < args.prevClose
      : args.rsiNow > 28 && args.close > args.prevClose);

  const triggerHit = rsiCooling || revertingTowardEma || heldReversion;
  const triggerType: ScannerTriggerType = triggerHit ? 'mean_reversion_cooling' : 'unknown';
  const triggerReason = rsiCooling
    ? 'RSI cooling from extreme level — momentum exhaustion beginning.'
    : revertingTowardEma
      ? 'Price reverting toward trend mean with meaningful body.'
      : heldReversion
        ? 'Mean-reversion move continuing from prior trigger.'
        : 'Overextended but no exhaustion confirmation yet.';

  const room = clamp(args.roomToTargetAtr / 2.0, 0, 1);
  // Momentum: reward slope pointing back toward EMA20
  const slopeFit = clamp(
    (args.side === 'long' ? -args.rsiSlope : args.rsiSlope) / 6 + 0.5,
    0,
    1,
  );
  // RSI proximity to neutral: better score when closer to 50 (reverting)
  const rsiFit = clamp(1 - Math.abs(args.rsiNow - 50) / 30, 0, 1);

  // Base is lower than breakout/pullback: overextended entries are inherently riskier.
  const base = triggerHit ? 60 : 44;
  const timingScore = clamp(Math.round(base + room * 12 + slopeFit * 8 + rsiFit * 6), 8, 92);

  const positiveFactors: string[] = [];
  if (rsiCooling) positiveFactors.push('rsi_cooling_from_extreme');
  if (revertingTowardEma) positiveFactors.push('price_reverting_to_mean');
  if (heldReversion) positiveFactors.push('mean_reversion_continuing');
  if (room > 0.6) positiveFactors.push('room_to_target_open');

  return { timingScore, triggerHit, triggerType, triggerReason, positiveFactors };
}
