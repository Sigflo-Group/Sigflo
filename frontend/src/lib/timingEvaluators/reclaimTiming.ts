import type { ScannerTriggerType } from '@/lib/scannerConfig';

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function evaluateReclaimTiming(args: {
  side: 'long' | 'short';
  close: number;
  prevClose: number;
  reclaimLevel: number;
  atrNow: number;
  roomToTargetAtr: number;
  rsiSlope: number;
  hasPreviousTrigger: boolean;
}): {
  timingScore: number;
  triggerHit: boolean;
  triggerType: ScannerTriggerType;
  triggerReason: string;
  positiveFactors: string[];
} {
  const crossed =
    args.side === 'long'
      ? args.close > args.reclaimLevel && args.prevClose <= args.reclaimLevel
      : args.close < args.reclaimLevel && args.prevClose >= args.reclaimLevel;
  const defended =
    args.hasPreviousTrigger &&
    Math.abs(args.close - args.reclaimLevel) <= Math.max(args.atrNow * 0.3, 1e-8) &&
    (args.side === 'long' ? args.close >= args.reclaimLevel : args.close <= args.reclaimLevel);
  const triggerHit = crossed || defended;
  const triggerType: ScannerTriggerType = triggerHit ? 'reclaim_first_close' : 'unknown';
  const triggerReason = triggerHit
    ? 'Reclaim level crossed and held.'
    : 'Waiting for reclaim confirmation.';
  const room = clamp(args.roomToTargetAtr / 2.2, 0, 1);
  const momentum = clamp((args.side === 'long' ? args.rsiSlope : -args.rsiSlope) / 6 + 0.5, 0, 1);
  const base = triggerHit ? 64 : 48;
  const timingScore = clamp(Math.round(base + room * 14 + momentum * 10), 8, 99);
  const positiveFactors: string[] = [];
  if (crossed) positiveFactors.push('reclaim_first_close');
  if (defended) positiveFactors.push('reclaim_level_defended');
  if (room > 0.6) positiveFactors.push('room_to_target_open');
  return { timingScore, triggerHit, triggerType, triggerReason, positiveFactors };
}
