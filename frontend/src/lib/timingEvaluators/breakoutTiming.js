"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateBreakoutTiming = evaluateBreakoutTiming;
function clamp(n, lo, hi) {
    return Math.min(hi, Math.max(lo, n));
}
function evaluateBreakoutTiming(args) {
    var dir = args.side === 'long' ? 1 : -1;
    var crossedNow = dir > 0 ? args.close > args.triggerLevel && args.prevClose <= args.triggerLevel : args.close < args.triggerLevel && args.prevClose >= args.triggerLevel;
    var nearRetest = Math.abs(args.close - args.triggerLevel) <= Math.max(args.atrNow * 0.35, 1e-8);
    var retestHold = args.hasPreviousTrigger &&
        nearRetest &&
        (dir > 0 ? args.close >= args.triggerLevel : args.close <= args.triggerLevel);
    var triggerHit = crossedNow || retestHold;
    var triggerType = crossedNow
        ? 'breakout_first_close'
        : retestHold
            ? 'breakout_retest_hold'
            : 'unknown';
    var triggerReason = crossedNow
        ? 'First close through the breakout level.'
        : retestHold
            ? 'Retest held around the breakout level.'
            : 'Breakout pressure building but trigger not confirmed.';
    var sizedCandleAtr = args.atrNow > 0 ? args.candleRange / args.atrNow : 0;
    var sizePenalty = sizedCandleAtr > 1.6 ? (sizedCandleAtr - 1.6) * 10 : 0;
    var rsiCenter = args.side === 'long' ? 63 : 37;
    var rsiFit = clamp(1 - Math.abs(args.rsiNow - rsiCenter) / 22, 0, 1);
    var momentum = clamp(rsiFit + (args.side === 'long' ? args.rsiSlope : -args.rsiSlope) / 8, 0, 1);
    var room = clamp(args.roomToTargetAtr / 2.2, 0, 1);
    var volume = clamp(args.volumeRatio / 1.8, 0.35, 1);
    var base = triggerHit ? 68 : 52;
    var timingScore = clamp(Math.round(base + momentum * 16 + room * 10 + volume * 6 - sizePenalty), 8, 99);
    var positiveFactors = [];
    if (crossedNow)
        positiveFactors.push('first_breakout_close');
    if (retestHold)
        positiveFactors.push('clean_retest_hold');
    if (room > 0.6)
        positiveFactors.push('room_to_target_open');
    if (volume > 0.62)
        positiveFactors.push('volume_supportive');
    return { timingScore: timingScore, triggerHit: triggerHit, triggerType: triggerType, triggerReason: triggerReason, positiveFactors: positiveFactors };
}
