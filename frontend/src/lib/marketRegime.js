"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REGIME_TONE_GUIDE = void 0;
exports.regimeToneGuideFor = regimeToneGuideFor;
exports.deriveMarketRegimeFromContext = deriveMarketRegimeFromContext;
/** Human-readable tone instructions for the model (grounding rules still apply). */
exports.REGIME_TONE_GUIDE = {
    trending: 'Tone: confident, continuation-focused desk trader. Stress trend alignment and what would extend vs stall the move. Prefer decisive phrasing when subscores support it — never fabricate catalysts or levels.',
    range: 'Tone: cautious and two-sided. Emphasize range edges, chop risk, and what would confirm a breakout either way. Avoid false certainty; balance bull/bear mechanics from the package only.',
    risk_off: 'Tone: defensive and alert. Lead with risk flags (scanner status, risk tag, riskConditions). Short, clear warnings; prioritize what invalidates or stretches the setup. No fear-mongering beyond the data.',
    transition: 'Tone: observational; wait for confirmation. Call out mixed or evolving structure, developing status, and concrete triggers that would clarify direction. No strong directional hype the scores do not support.',
};
function regimeToneGuideFor(regime) {
    return exports.REGIME_TONE_GUIDE[regime];
}
/**
 * Classify regime from Sigflo score breakdown, scanner status, risk tag, setup type,
 * and optional recent OHLC (volatility proxy).
 */
function deriveMarketRegimeFromContext(ctx) {
    var b = ctx.signal.scoreBreakdown;
    var ta = b.trendAlignment;
    var sq = b.structureQuality;
    var mq = b.momentumQuality;
    var rc = b.riskConditions;
    var status = ctx.scannerStatus;
    var _a = ctx.signal, riskTag = _a.riskTag, setupType = _a.setupType;
    var highRisk = riskTag === 'High Risk';
    var volProxy = 0;
    var candles = ctx.recentCandles;
    if (candles && candles.length >= 6) {
        var slice = candles.slice(-8);
        var sum = 0;
        var n = 0;
        for (var _i = 0, slice_1 = slice; _i < slice_1.length; _i++) {
            var c = slice_1[_i];
            if (c.c > 0 && c.h >= c.l) {
                sum += (c.h - c.l) / c.c;
                n += 1;
            }
        }
        if (n > 0)
            volProxy = sum / n;
    }
    var riskOff = rc >= 11 ||
        (highRisk && rc >= 8) ||
        (status === 'overextended' && (highRisk || rc >= 9)) ||
        (volProxy >= 0.038 && rc >= 8);
    if (riskOff)
        return 'risk_off';
    var trending = ta >= 17 &&
        sq >= 12 &&
        (mq >= 9 || status === 'triggered' || setupType === 'breakout');
    if (trending)
        return 'trending';
    var rangeLike = (ta <= 13 && sq <= 14 && mq <= 15) ||
        (setupType === 'pullback' && ta <= 15 && sq <= 16);
    if (rangeLike)
        return 'range';
    if (status === 'developing' || (ta >= 13 && ta <= 17 && sq >= 10 && sq <= 16)) {
        return 'transition';
    }
    return 'transition';
}
