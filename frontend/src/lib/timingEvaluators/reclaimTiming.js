"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateReclaimTiming = evaluateReclaimTiming;
function clamp(n, lo, hi) {
    return Math.min(hi, Math.max(lo, n));
}
function evaluateReclaimTiming(args) {
    var crossed = args.side === 'long'
        ? args.close > args.reclaimLevel && args.prevClose <= args.reclaimLevel
        : args.close < args.reclaimLevel && args.prevClose >= args.reclaimLevel;
    var defended = args.hasPreviousTrigger &&
        Math.abs(args.close - args.reclaimLevel) <= Math.max(args.atrNow * 0.3, 1e-8) &&
        (args.side === 'long' ? args.close >= args.reclaimLevel : args.close <= args.reclaimLevel);
    var triggerHit = crossed || defended;
    var triggerType = triggerHit ? 'reclaim_first_close' : 'unknown';
    var triggerReason = triggerHit
        ? 'Reclaim level crossed and held.'
        : 'Waiting for reclaim confirmation.';
    var room = clamp(args.roomToTargetAtr / 2.2, 0, 1);
    var momentum = clamp((args.side === 'long' ? args.rsiSlope : -args.rsiSlope) / 6 + 0.5, 0, 1);
    var base = triggerHit ? 64 : 48;
    var timingScore = clamp(Math.round(base + room * 14 + momentum * 10), 8, 99);
    var positiveFactors = [];
    if (crossed)
        positiveFactors.push('reclaim_first_close');
    if (defended)
        positiveFactors.push('reclaim_level_defended');
    if (room > 0.6)
        positiveFactors.push('room_to_target_open');
    return { timingScore: timingScore, triggerHit: triggerHit, triggerType: triggerType, triggerReason: triggerReason, positiveFactors: positiveFactors };
}
