import type { ScannerTriggerType } from '@/lib/scannerConfig';

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function evaluateBreakoutTiming(args: {
  side: 'long' | 'short';
  close: number;
  prevClose: number;
  triggerLevel: number;
  atrNow: number;
  candleRange: number;
  roomToTargetAtr: number;
  volumeRatio: number;
  rsiNow: number;
  rsiSlope: number;
  hasPreviousTrigger: boolean;
}): {
  timingScore: number;
  triggerHit: boolean;
  triggerType: ScannerTriggerType;
  triggerReason: string;
  positiveFactors: string[];
} {
  const dir = args.side === 'long' ? 1 : -1;
  const crossedNow = dir > 0 ? args.close > args.triggerLevel && args.prevClose <= args.triggerLevel : args.close < args.triggerLevel && args.prevClose >= args.triggerLevel;
  const nearRetest = Math.abs(args.close - args.triggerLevel) <= Math.max(args.atrNow * 0.35, 1e-8);
  const retestHold =
    args.hasPreviousTrigger &&
    nearRetest &&
    (dir > 0 ? args.close >= args.triggerLevel : args.close <= args.triggerLevel);

  // Continuation: once an initial trigger has fired and the lifecycle has had time to
  // advance (hasPreviousTrigger implies state >= triggered), allow a re-trigger when
  // price is making continued directional progress with healthy but non-overbought RSI.
  // This prevents a one-shot trigger from decaying without re-arming in trending markets.
  const continuationMomentum =
    args.hasPreviousTrigger &&
    !nearRetest &&
    (args.side === 'long'
      ? args.close > args.prevClose &&
        args.close > args.triggerLevel &&
        args.rsiNow >= 52 && args.rsiNow <= 70 &&
        args.rsiSlope > 0
      : args.close < args.prevClose &&
        args.close < args.triggerLevel &&
        args.rsiNow <= 48 && args.rsiNow >= 30 &&
        args.rsiSlope < 0);

  const triggerHit = crossedNow || retestHold || continuationMomentum;
  const triggerType: ScannerTriggerType = crossedNow
    ? 'breakout_first_close'
    : retestHold
      ? 'breakout_retest_hold'
      : continuationMomentum
        ? 'trend_continuation_resume'
        : 'unknown';
  const triggerReason = crossedNow
    ? 'First close through the breakout level.'
    : retestHold
      ? 'Retest held around the breakout level.'
      : continuationMomentum
        ? 'Trend continuation with momentum still healthy.'
        : 'Breakout pressure building but trigger not confirmed.';

  const sizedCandleAtr = args.atrNow > 0 ? args.candleRange / args.atrNow : 0;
  const sizePenalty = sizedCandleAtr > 1.6 ? (sizedCandleAtr - 1.6) * 10 : 0;
  const rsiCenter = args.side === 'long' ? 63 : 37;
  const rsiFit = clamp(1 - Math.abs(args.rsiNow - rsiCenter) / 22, 0, 1);
  const momentum = clamp(rsiFit + (args.side === 'long' ? args.rsiSlope : -args.rsiSlope) / 8, 0, 1);
  const room = clamp(args.roomToTargetAtr / 2.2, 0, 1);
  const volume = clamp(args.volumeRatio / 1.8, 0.35, 1);

  const base = triggerHit ? 68 : 52;
  const timingScore = clamp(Math.round(base + momentum * 16 + room * 10 + volume * 6 - sizePenalty), 8, 99);
  const positiveFactors: string[] = [];
  if (crossedNow) positiveFactors.push('first_breakout_close');
  if (retestHold) positiveFactors.push('clean_retest_hold');
  if (continuationMomentum) positiveFactors.push('trend_continuation_resume');
  if (room > 0.6) positiveFactors.push('room_to_target_open');
  if (volume > 0.62) positiveFactors.push('volume_supportive');
  return { timingScore, triggerHit, triggerType, triggerReason, positiveFactors };
}
