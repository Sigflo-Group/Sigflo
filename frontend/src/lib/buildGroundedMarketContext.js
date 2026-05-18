"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildGroundedMarketContext = buildGroundedMarketContext;
var marketRegime_1 = require("@/lib/marketRegime");
function finite(n) {
    return typeof n === 'number' && Number.isFinite(n);
}
function pushLevel(set, n, tol) {
    if (tol === void 0) { tol = 1e-8; }
    for (var _i = 0, set_1 = set; _i < set_1.length; _i++) {
        var x = set_1[_i];
        if (Math.abs(x - n) <= tol)
            return;
    }
    set.add(n);
}
function buildFactsRecord(signal) {
    var f = signal.facts;
    if (!f)
        return undefined;
    var out = {};
    if (f.emaTrend != null)
        out.emaTrend = f.emaTrend;
    if (f.volumeRatio != null && Number.isFinite(f.volumeRatio))
        out.volumeRatio = f.volumeRatio;
    if (f.rsi != null && Number.isFinite(f.rsi))
        out.rsi = f.rsi;
    if (f.distanceToBreakoutAtr != null && Number.isFinite(f.distanceToBreakoutAtr)) {
        out.distanceToBreakoutAtr = f.distanceToBreakoutAtr;
    }
    if (f.pullbackDepthAtr != null && Number.isFinite(f.pullbackDepthAtr))
        out.pullbackDepthAtr = f.pullbackDepthAtr;
    if (f.extensionAtr != null && Number.isFinite(f.extensionAtr))
        out.extensionAtr = f.extensionAtr;
    return Object.keys(out).length > 0 ? out : undefined;
}
function allowedIndicatorsFromFacts(signal) {
    var terms = [];
    var f = signal.facts;
    if ((f === null || f === void 0 ? void 0 : f.rsi) != null && Number.isFinite(f.rsi))
        terms.push('RSI');
    if (f === null || f === void 0 ? void 0 : f.emaTrend)
        terms.push('EMA trend');
    if ((f === null || f === void 0 ? void 0 : f.volumeRatio) != null && Number.isFinite(f.volumeRatio))
        terms.push('relative volume');
    if ((f === null || f === void 0 ? void 0 : f.distanceToBreakoutAtr) != null ||
        (f === null || f === void 0 ? void 0 : f.pullbackDepthAtr) != null ||
        (f === null || f === void 0 ? void 0 : f.extensionAtr) != null) {
        terms.push('ATR-based structure distances');
    }
    return terms;
}
function formatTimeframe(interval) {
    if (interval === 'D')
        return '1D';
    if (interval === 'W')
        return '1W';
    if (interval === '60')
        return '1H';
    if (interval === '240')
        return '4H';
    return "".concat(interval, "m");
}
function buildGroundedMarketContext(input) {
    var _a, _b;
    var signal = input.signal, status = input.status, tradeScore = input.tradeScore, market = input.market, chartInterval = input.chartInterval, model = input.model, recentCandles = input.recentCandles;
    var gaps = [];
    var levelSet = new Set();
    if (finite(model.lastPrice))
        pushLevel(levelSet, model.lastPrice);
    if (finite(model.entry))
        pushLevel(levelSet, model.entry);
    if (finite(model.stop))
        pushLevel(levelSet, model.stop);
    if (finite(model.target))
        pushLevel(levelSet, model.target);
    if (market === 'futures' && finite(model.liquidation))
        pushLevel(levelSet, model.liquidation);
    if (signal.plannedEntry != null && finite(signal.plannedEntry))
        pushLevel(levelSet, signal.plannedEntry);
    if (signal.plannedStop != null && finite(signal.plannedStop))
        pushLevel(levelSet, signal.plannedStop);
    if (signal.plannedTarget != null && finite(signal.plannedTarget))
        pushLevel(levelSet, signal.plannedTarget);
    var allowedPriceLevels = __spreadArray([], levelSet, true).sort(function (a, b) { return a - b; });
    if (!finite(model.lastPrice))
        gaps.push('last_price');
    if (!finite(model.entry) && !finite(signal.plannedEntry))
        gaps.push('entry_level');
    if (!finite(model.stop) && !finite(signal.plannedStop))
        gaps.push('stop_level');
    if (!finite(model.target) && !finite(signal.plannedTarget))
        gaps.push('target_level');
    if (!(recentCandles === null || recentCandles === void 0 ? void 0 : recentCandles.length))
        gaps.push('recent_ohlc_series');
    var candles = recentCandles && recentCandles.length > 0
        ? recentCandles.slice(-12).map(function (c) { return ({
            o: c.open,
            h: c.high,
            l: c.low,
            c: c.close,
        }); })
        : undefined;
    var facts = buildFactsRecord(signal);
    if (!facts)
        gaps.push('computed_indicator_facts');
    var base = __assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign({ symbol: signal.pair, market: market, timeframe: formatTimeframe(chartInterval) }, (finite(model.lastPrice) ? { lastPrice: model.lastPrice } : {})), (finite(model.entry) ? { entry: model.entry } : {})), (finite(model.stop) ? { stop: model.stop } : {})), (finite(model.target) ? { target: model.target } : {})), (market === 'futures' && finite(model.liquidation) ? { liquidation: model.liquidation } : {})), (finite(model.change24hPct) ? { change24hPct: model.change24hPct } : {})), (finite(model.high24h) ? { high24h: model.high24h } : {})), (finite(model.low24h) ? { low24h: model.low24h } : {})), { allowedPriceLevels: allowedPriceLevels, scannerStatus: status, tradeReadinessScore: Math.round(tradeScore), signal: __assign(__assign(__assign(__assign(__assign(__assign({ id: signal.id, side: signal.side, setupType: signal.setupType, setupScore: signal.setupScore, setupScoreLabel: signal.setupScoreLabel, riskTag: signal.riskTag, setupTags: __spreadArray([], signal.setupTags, true), biasLabel: signal.biasLabel, scoreBreakdown: __assign({}, signal.scoreBreakdown) }, (facts ? { facts: facts } : {})), (((_a = signal.watchCue) === null || _a === void 0 ? void 0 : _a.trim()) ? { watchCue: signal.watchCue.trim() } : {})), (((_b = signal.watchNext) === null || _b === void 0 ? void 0 : _b.trim()) ? { watchNext: signal.watchNext.trim() } : {})), (signal.plannedEntry != null && finite(signal.plannedEntry) ? { plannedEntry: signal.plannedEntry } : {})), (signal.plannedStop != null && finite(signal.plannedStop) ? { plannedStop: signal.plannedStop } : {})), (signal.plannedTarget != null && finite(signal.plannedTarget) ? { plannedTarget: signal.plannedTarget } : {})), signalNarrative: {
            aiExplanation: signal.aiExplanation.trim(),
            whyThisMatters: signal.whyThisMatters.trim(),
        } }), (candles ? { recentCandles: candles } : {})), { dataGaps: gaps, allowedIndicatorTerms: allowedIndicatorsFromFacts(signal), marketRegime: 'transition', regimeToneGuide: (0, marketRegime_1.regimeToneGuideFor)('transition') });
    var marketRegime = (0, marketRegime_1.deriveMarketRegimeFromContext)(base);
    return __assign(__assign({}, base), { marketRegime: marketRegime, regimeToneGuide: (0, marketRegime_1.regimeToneGuideFor)(marketRegime) });
}
