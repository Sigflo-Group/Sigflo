"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDeepAnalysisFallback = buildDeepAnalysisFallback;
function trendCue(signal) {
    var t = signal.scoreBreakdown.trendAlignment;
    if (t >= 17)
        return 'Trend holding';
    if (t <= 10)
        return 'Weak trend';
    return 'Trend mixed';
}
function momentumCue(signal) {
    var m = signal.scoreBreakdown.momentumQuality;
    if (m >= 14)
        return 'Momentum building';
    if (m <= 8)
        return 'Momentum fading';
    return 'Momentum steady';
}
function levelHint(signal) {
    var facts = signal.facts;
    if (typeof (facts === null || facts === void 0 ? void 0 : facts.distanceToBreakoutAtr) === 'number') {
        if (facts.distanceToBreakoutAtr <= 0.2)
            return 'near trigger';
        if (facts.distanceToBreakoutAtr >= 0.8)
            return 'far from trigger';
    }
    if (typeof (facts === null || facts === void 0 ? void 0 : facts.pullbackDepthAtr) === 'number') {
        if (facts.pullbackDepthAtr >= 1.2)
            return 'deep pullback';
        if (facts.pullbackDepthAtr <= 0.5)
            return 'shallow pullback';
    }
    if (typeof (facts === null || facts === void 0 ? void 0 : facts.extensionAtr) === 'number' && facts.extensionAtr >= 1.4)
        return 'extended from base';
    return 'at a key level';
}
function entryState(status, tradeScore) {
    if (status === 'overextended' || tradeScore < 45)
        return 'Weak timing';
    if (status === 'triggered' && tradeScore >= 65)
        return 'Ready';
    if (status === 'triggered' && tradeScore < 55)
        return 'Too late';
    if (status === 'idle')
        return 'Too early';
    return 'Too early';
}
function formatLevelList(levels) {
    return levels.map(function (n) { return n.toLocaleString('en-US', { maximumFractionDigits: 8 }); }).join(', ');
}
/** Local long-form markdown when the deep-analysis API is unavailable (matches server fallback intent). */
function buildDeepAnalysisFallback(signal, status, tradeScore, ctx) {
    var _a, _b, _c;
    var bias = signal.side === 'long' ? 'Long' : 'Short';
    var timing = entryState(status, tradeScore);
    var b = signal.scoreBreakdown;
    var excerpt = ((_a = signal.aiExplanation) !== null && _a !== void 0 ? _a : '').slice(0, 320).trim();
    var why = ((_b = signal.whyThisMatters) !== null && _b !== void 0 ? _b : '').slice(0, 220).trim();
    var tf = (ctx === null || ctx === void 0 ? void 0 : ctx.timeframe) ? "Chart timeframe in package: **".concat(ctx.timeframe, "**. ") : '';
    var mkt = (ctx === null || ctx === void 0 ? void 0 : ctx.market) ? "Market mode: **".concat(ctx.market, "**. ") : '';
    var regime = (ctx === null || ctx === void 0 ? void 0 : ctx.marketRegime) != null
        ? "Regime (engine tone context): **".concat(ctx.marketRegime.replace(/_/g, ' '), "**. ")
        : '';
    var gaps = ((_c = ctx === null || ctx === void 0 ? void 0 : ctx.dataGaps) === null || _c === void 0 ? void 0 : _c.length) ? "Insufficient data in package for: ".concat(ctx.dataGaps.join(', '), ". ") : '';
    var keyLevelsBlock = ctx && ctx.allowedPriceLevels.length > 0
        ? "Only these numeric plan prices are in the data package \u2014 cite no others: ".concat(formatLevelList(ctx.allowedPriceLevels), ".")
        : 'No discrete plan prices were included in the data package; use the live chart and Sigflo overlays for levels.';
    var body = "## Overview\n".concat(tf).concat(mkt).concat(regime).concat(gaps).concat(bias, " ").concat(signal.setupType, " on **").concat(signal.pair, "**: setup score ").concat(signal.setupScore, "/100, scanner status **").concat(status, "**, trade readiness ~").concat(Math.round(tradeScore), ". ").concat(excerpt ? "Scanner context: ".concat(excerpt) : 'Use the live chart and plan levels as primary context.', "\n\n## Market structure\nInternal score mix \u2014 trend ").concat(b.trendAlignment, "/25, structure ").concat(b.structureQuality, "/25, momentum ").concat(b.momentumQuality, "/20, volume ").concat(b.volumeConfirmation, "/15, risk ").concat(b.riskConditions, "/15. Price is ").concat(levelHint(signal), " relative to the active setup type.\n\n## Bullish case\nA constructive resolution favors continuation: ").concat(signal.setupType === 'breakout' ? 'acceptance beyond the trigger zone with follow-through' : signal.setupType === 'pullback' ? 'defense of the pullback structure and resumption toward trend' : 'orderly digestion without breaking major swing support', ". ").concat(signal.side === 'long' ? 'Long-bias signals need sustained bids and higher lows on relevant timeframes.' : 'Short-bias signals need supply to remain in control after tests.', "\n\n## Bearish case\nThe trade thesis weakens if the market rejects the key structure: ").concat(signal.setupType === 'breakout' ? 'false breakout / immediate reclaim into the range' : 'failed reclaim — rotation the other way', ". Choppy two-way trade inside the setup zone argues for standing aside.\n\n## Key levels\n").concat(keyLevelsBlock, "\n\n## Momentum and trend\n").concat(trendCue(signal), "; ").concat(momentumCue(signal), ". If momentum is fading into a trigger, require cleaner confirmation before sizing.\n\n## Invalidation\nInvalidate when price proves the setup wrong: break and hold beyond the structural level that defines this ").concat(signal.setupType, ". Timing label **").concat(timing, "** \u2014 if you are early or late relative to the trigger, reduce size or wait for a fresh structure.\n\n## Risk factors\nSetup risk: **").concat(signal.riskTag, "**. ").concat(status === 'overextended' ? 'Status is overextended — chasing hurts expectancy.' : '', " ").concat(why ? "Framing: ".concat(why) : 'Keep risk per trade modest versus account.', "\n\n## Trade approach\nWork the plan in stages: define trigger, size for invalidation distance, add only if follow-through confirms. ").concat(timing === 'Ready' ? 'Readiness is elevated; execution discipline still matters.' : 'Patience: let the scenario prove itself before full commitment.');
    return {
        headline: "".concat(signal.pair, " \u2014 ").concat(bias, " ").concat(signal.setupType, " (setup ").concat(signal.setupScore, ")"),
        body: body,
    };
}
