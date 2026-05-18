"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REVERSAL_READY_MIN_SCORE = void 0;
exports.clampScore = clampScore;
exports.getOpportunityStateFromScore = getOpportunityStateFromScore;
exports.timeframeAlignmentForStrategy = timeframeAlignmentForStrategy;
exports.formatAdaptivePrice = formatAdaptivePrice;
exports.buildAtrLevels = buildAtrLevels;
exports.getRiskLabel = getRiskLabel;
exports.capReversalReady = capReversalReady;
function clampScore(score) {
    return Math.max(0, Math.min(100, Math.round(score)));
}
/**
 * Map score + trigger to workflow state. Returns null if below publish threshold (hidden).
 * - Triggered: score ≥ 82 and hasTrigger
 * - Ready: score ≥ 75 (caller may cap reversal)
 * - Building: ≥ 65
 * - Watching: ≥ 55
 */
function getOpportunityStateFromScore(score, hasTrigger) {
    var s = clampScore(score);
    if (s < 55)
        return null;
    if (s >= 82 && hasTrigger)
        return 'Triggered';
    if (s >= 75)
        return 'Ready';
    if (s >= 65)
        return 'Building';
    return 'Watching';
}
/** Per-strategy timeframe labels for the Bots UI. */
function timeframeAlignmentForStrategy(strategy) {
    switch (strategy) {
        case 'Breakout':
            return ['15m', '1h'];
        case 'Momentum':
            return ['5m', '15m'];
        case 'TrendPullback':
            return ['15m', '1h'];
        case 'Reversal':
            return ['5m', '15m'];
    }
}
function formatAdaptivePrice(pair, n) {
    var u = pair.toUpperCase();
    var isBtcEth = u.includes('BTC') || u.includes('ETH');
    if (isBtcEth) {
        var digits = n >= 10000 ? 0 : 1;
        return n.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits });
    }
    return n.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}
function buildAtrLevels(pair, price, atr, direction) {
    var a = atr;
    if (direction === 'LONG') {
        var eLo_1 = price;
        var eHi_1 = price + 0.25 * a;
        var inv_1 = price - 1.0 * a;
        var t1_1 = price + 1.5 * a;
        var t2_1 = price + 2.5 * a;
        return {
            entryZone: "".concat(formatAdaptivePrice(pair, eLo_1), " - ").concat(formatAdaptivePrice(pair, eHi_1)),
            invalidation: formatAdaptivePrice(pair, inv_1),
            targets: [formatAdaptivePrice(pair, t1_1), formatAdaptivePrice(pair, t2_1)],
        };
    }
    var eLo = price - 0.25 * a;
    var eHi = price;
    var inv = price + 1.0 * a;
    var t1 = price - 1.5 * a;
    var t2 = price - 2.5 * a;
    return {
        entryZone: "".concat(formatAdaptivePrice(pair, eLo), " - ").concat(formatAdaptivePrice(pair, eHi)),
        invalidation: formatAdaptivePrice(pair, inv),
        targets: [formatAdaptivePrice(pair, t1), formatAdaptivePrice(pair, t2)],
    };
}
function getRiskLabel(params) {
    var score = params.score, strategyType = params.strategyType, _a = params.rsi, rsi = _a === void 0 ? 50 : _a, _b = params.volumeRatio, volumeRatio = _b === void 0 ? 1 : _b, cleanTrendAlignment = params.cleanTrendAlignment, invalidationTight = params.invalidationTight;
    if (strategyType === 'Reversal')
        return 'High';
    if (score < 68)
        return 'High';
    if (rsi < 32 || rsi > 72)
        return 'High';
    if (volumeRatio < 1.05)
        return 'High';
    if (score >= 80 && cleanTrendAlignment && invalidationTight)
        return 'Low';
    if (score >= 65 && score <= 79)
        return 'Medium';
    return 'Medium';
}
/** Reversal setups never earn Ready below this score (earned selectivity). */
exports.REVERSAL_READY_MIN_SCORE = 78;
function capReversalReady(state, score) {
    if (state == null)
        return null;
    if (state === 'Ready' && score < exports.REVERSAL_READY_MIN_SCORE)
        return 'Building';
    if (state === 'Triggered' && score < 82)
        return 'Building';
    return state;
}
