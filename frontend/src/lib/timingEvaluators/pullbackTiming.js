"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluatePullbackTiming = evaluatePullbackTiming;
function clamp(n, lo, hi) {
    return Math.min(hi, Math.max(lo, n));
}
function evaluatePullbackTiming(args) {
    var depthFit = clamp(1 - Math.abs(args.pullbackDepthAtr - 0.45) / 1.2, 0, 1);
    var bounceConfirm = args.bounceCandleStrengthAtr > 0.25;
    var reclaimEma = args.side === 'long'
        ? args.close >= args.ema20 && args.prevClose <= args.ema20
        : args.close <= args.ema20 && args.prevClose >= args.ema20;
    var triggerHit = bounceConfirm && (reclaimEma || depthFit > 0.5);
    var triggerType = triggerHit
        ? 'pullback_bounce_confirmed'
        : 'unknown';
    var triggerReason = triggerHit
        ? 'Pullback reached support zone and bounce confirmed.'
        : 'Pullback still forming; bounce confirmation not complete.';
    var room = clamp(args.roomToTargetAtr / 2.0, 0, 1);
    var rsiFitMid = args.side === 'long' ? 50 : 50;
    var rsiFit = clamp(1 - Math.abs(args.rsiNow - rsiFitMid) / 20, 0, 1);
    var slopeFit = clamp((args.side === 'long' ? args.rsiSlope : -args.rsiSlope) / 6 + 0.5, 0, 1);
    var base = triggerHit ? 66 : 50;
    var timingScore = clamp(Math.round(base + depthFit * 14 + room * 10 + rsiFit * 6 + slopeFit * 5), 8, 99);
    var positiveFactors = [];
    if (triggerHit)
        positiveFactors.push('pullback_bounce_confirmed');
    if (depthFit > 0.55)
        positiveFactors.push('pullback_depth_ideal');
    if (room > 0.6)
        positiveFactors.push('room_to_target_open');
    return { timingScore: timingScore, triggerHit: triggerHit, triggerType: triggerType, triggerReason: triggerReason, positiveFactors: positiveFactors };
}
