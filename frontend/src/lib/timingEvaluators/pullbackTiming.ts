import type { ScannerTriggerType } from '@/lib/scannerConfig';

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function evaluatePullbackTiming(args: {
  side: 'long' | 'short';
  close: number;
  prevClose: number;
  ema20: number;
  atrNow: number;
  pullbackDepthAtr: number;
  bounceCandleStrengthAtr: number;
  roomToTargetAtr: number;
  rsiNow: number;
  rsiSlope: number;
}): {
  timingScore: number;
  triggerHit: boolean;
  triggerType: ScannerTriggerType;
  triggerReason: string;
  positiveFactors: string[];
} {
  const depthFit = clamp(1 - Math.abs(args.pullbackDepthAtr - 0.45) / 1.2, 0, 1);
  const bounceConfirm = args.bounceCandleStrengthAtr > 0.25;
  const reclaimEma =
    args.side === 'long'
      ? args.close >= args.ema20 && args.prevClose <= args.ema20
      : args.close <= args.ema20 && args.prevClose >= args.ema20;
  const triggerHit = bounceConfirm && (reclaimEma || depthFit > 0.5);
  const triggerType: ScannerTriggerType = triggerHit
    ? 'pullback_bounce_confirmed'
    : 'unknown';
  const triggerReason = triggerHit
    ? 'Pullback reached support zone and bounce confirmed.'
    : 'Pullback still forming; bounce confirmation not complete.';

  const room = clamp(args.roomToTargetAtr / 2.0, 0, 1);
  const rsiFitMid = args.side === 'long' ? 50 : 50;
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
