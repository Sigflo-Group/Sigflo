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
Object.defineProperty(exports, "__esModule", { value: true });
exports.runScannerPipeline = runScannerPipeline;
var detectors_1 = require("@/engine/detectors");
var filtering_1 = require("@/engine/filtering");
var indicators_1 = require("@/engine/indicators");
var DEFAULT_FILTER_CONFIG = {
    minSetupScore: 60,
    cooldownMs: 30 * 60 * 1000,
    minScoreImprovement: 8,
};
/**
 * Rules-first scanner pipeline (deterministic: outputs depend only on candles + thresholds).
 * Live path uses Bybit REST/WS data into the same shapes; AI consumes explanationFacts after signal creation.
 */
function runScannerPipeline(input) {
    var _a, _b, _c;
    var cfg = __assign(__assign({}, DEFAULT_FILTER_CONFIG), input.filterConfig);
    var allCandidates = [];
    for (var _i = 0, _d = Object.entries(input.marketBySymbol); _i < _d.length; _i++) {
        var _e = _d[_i], symbol = _e[0], series = _e[1];
        var candles15m = series['15m'];
        if (!candles15m || candles15m.length < 60)
            continue;
        var lastClosed = (_b = (_a = candles15m.at(-1)) === null || _a === void 0 ? void 0 : _a.isClosed) !== null && _b !== void 0 ? _b : true;
        var indicators = (0, indicators_1.deriveIndicatorSnapshot)(candles15m);
        var detectorInput = { symbol: symbol, candles: candles15m, indicators: indicators, lastCandleClosed: lastClosed };
        var candidates = [
            (0, detectors_1.pickBestDirectionalPair)((0, detectors_1.detectBreakoutPressure)(detectorInput), (0, detectors_1.detectBreakdownPressure)(detectorInput)),
            (0, detectors_1.pickBestDirectionalPair)((0, detectors_1.detectPullbackContinuation)(detectorInput), (0, detectors_1.detectPullbackContinuationShort)(detectorInput)),
            (0, detectors_1.pickBestDirectionalPair)((0, detectors_1.detectOverextendedWarning)(detectorInput), (0, detectors_1.detectOverextendedShort)(detectorInput)),
        ].filter(function (s) { return Boolean(s); });
        allCandidates.push.apply(allCandidates, candidates);
    }
    var _f = (0, filtering_1.applySignalQualityControls)(allCandidates, (_c = input.previousState) !== null && _c !== void 0 ? _c : {}, cfg), accepted = _f.accepted, nextState = _f.nextState;
    return {
        acceptedSignals: accepted.sort(function (a, b) { return b.setupScore - a.setupScore; }),
        allCandidates: allCandidates,
        nextState: nextState,
    };
}
