import type { ScannerTriggerType } from '@/lib/scannerConfig';

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function evaluatePullbackTiming(args: {
  side: 'long' | 'short';
  close: number;
  prevClose: number;
  ema20: number;
  ema50: number;
  atrNow: number;
  pullbackDepthAtr: number;
  bounceCandleStrengthAtr: number;
  roomToTargetAtr: number;
  rsiNow: number;
  rsiSlope: number;
  /** Recent bars had meaningful dip into the pullback zone (ATR-normalized). */
  hadRecentPullbackDip?: boolean;
}): {
  timingScore: number;
  triggerHit: boolean;
  triggerType: ScannerTriggerType;
  triggerReason: string;
  positiveFactors: string[];
} {
  const trendAligned = args.side === 'long' ? args.ema20 > args.ema50 : args.ema20 < args.ema50;
  const depthFit = clamp(1 - Math.abs(args.pullbackDepthAtr - 0.45) / 1.2, 0, 1);
  const bounceConfirm = args.bounceCandleStrengthAtr > 0.18;
  const reclaimEma =
    args.side === 'long'
      ? args.close >= args.ema20 && args.prevClose <= args.ema20
      : args.close <= args.ema20 && args.prevClose >= args.ema20;
  const nearEmaHold =
    args.atrNow > 0 &&
    Math.abs(args.close - args.ema20) <= args.atrNow * 0.45 &&
    (args.side === 'long' ? args.close >= args.prevClose : args.close <= args.prevClose);
  const hadDip = args.hadRecentPullbackDip !== false;
  const triggerHit =
    trendAligned &&
    hadDip &&
    bounceConfirm &&
    (reclaimEma || depthFit > 0.4 || nearEmaHold);
  const triggerType: ScannerTriggerType = triggerHit
    ? 'pullback_bounce_confirmed'
    : 'unknown';
  const triggerReason = triggerHit
    ? 'Pullback reached support zone and bounce confirmed.'
    : !trendAligned
      ? 'Pullback timing needs trend alignment (EMA20 vs EMA50).'
      : !hadDip
        ? 'No recent dip into the pullback zone yet.'
        : 'Pullback still forming; bounce confirmation not complete.';

  const room = clamp(args.roomToTargetAtr / 2.0, 0, 1);
  const rsiFitMid = 50;
  const rsiFit = clamp(1 - Math.abs(args.rsiNow - rsiFitMid) / 20, 0, 1);
  const slopeFit = clamp((args.side === 'long' ? args.rsiSlope : -args.rsiSlope) / 6 + 0.5, 0, 1);
  const base = triggerHit ? 66 : 50;
  const timingScore = clamp(Math.round(base + depthFit * 14 + room * 10 + rsiFit * 6 + slopeFit * 5), 8, 99);

  const positiveFactors: string[] = [];
  if (triggerHit) positiveFactors.push('pullback_bounce_confirmed');
  if (depthFit > 0.55) positiveFactors.push('pullback_depth_ideal');
  if (room > 0.6) positiveFactors.push('room_to_target_open');
  return { timingScore, triggerHit, triggerType, triggerReason, positiveFactors };
}
