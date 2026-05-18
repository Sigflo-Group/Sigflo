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
exports.CandlePlaybackController = void 0;
exports.createPlaybackSession = createPlaybackSession;
exports.resetPlayback = resetPlayback;
exports.setScenario = setScenario;
exports.stepForward = stepForward;
exports.startAutoplay = startAutoplay;
var detectors_1 = require("@/lib/detectors");
var setupScore_1 = require("@/lib/setupScore");
var scannerLabCandles_1 = require("@/data/scannerLabCandles");
var DEFAULT_CONFIG = {
    symbol: 'SOLUSDT',
    windowSize: 120,
    minSetupScore: 55,
    cooldownCandles: 4,
    minScoreImprovement: 8,
    detectorOptions: __assign({}, detectors_1.DEFAULT_DETECTOR_OPTIONS),
};
var SCENARIO_DATA = {
    breakout: { symbol: 'SOLUSDT', candles: scannerLabCandles_1.breakoutScenario5m },
    pullback: { symbol: 'ETHUSDT', candles: scannerLabCandles_1.pullbackScenario5m },
    overextended: { symbol: 'DOGEUSDT', candles: scannerLabCandles_1.overextendedScenario5m },
};
function candidateKey(symbol, setupType) {
    return "".concat(symbol, ":").concat(setupType);
}
function compactReason(reasons) {
    var clean = reasons
        .map(function (r) { return r.replace('confirmed on closed candle', '').trim(); })
        .filter(Boolean)
        .slice(0, 2);
    return clean.join(' + ');
}
/** Step-through controller for Scanner Lab (fixture candles, isolated from live transport). */
var CandlePlaybackController = /** @class */ (function () {
    function CandlePlaybackController(series, cfg) {
        this.series = series;
        this.currentIndex = 0;
        this.config = __assign(__assign({}, DEFAULT_CONFIG), cfg);
        this.emittedSignals = [];
        this.cooldownRegistry = {};
    }
    CandlePlaybackController.prototype.reset = function (series, cfg) {
        if (series)
            this.series = series;
        this.currentIndex = 0;
        this.config = __assign(__assign({}, this.config), cfg);
        this.emittedSignals = [];
        this.cooldownRegistry = {};
    };
    CandlePlaybackController.prototype.getState = function () {
        return {
            index: this.currentIndex,
            total: this.series.length,
            emittedSignals: __spreadArray([], this.emittedSignals, true),
        };
    };
    CandlePlaybackController.prototype.stepForward = function () {
        if (this.currentIndex >= this.series.length)
            return null;
        this.currentIndex += 1;
        var visibleCandles = this.series.slice(Math.max(0, this.currentIndex - this.config.windowSize), this.currentIndex);
        if (visibleCandles.length === 0)
            return null;
        var currentCandle = visibleCandles.at(-1);
        if (!currentCandle)
            return null;
        var _a = (0, detectors_1.runScannerLabEngineEvaluations)(this.config.symbol, visibleCandles), indicators = _a.indicators, evaluations = _a.evaluations;
        var newSignals = [];
        for (var _i = 0, evaluations_1 = evaluations; _i < evaluations_1.length; _i++) {
            var e = evaluations_1[_i];
            if (!e.triggered || !e.candidate)
                continue;
            if (e.candidate.setupScore < this.config.minSetupScore)
                continue;
            var key = candidateKey(this.config.symbol, e.candidate.setupType);
            var prior = this.cooldownRegistry[key];
            var cooldownElapsed = !prior || this.currentIndex - prior.lastIndex >= this.config.cooldownCandles;
            var improved = !prior || e.candidate.setupScore - prior.lastSetupScore >= this.config.minScoreImprovement;
            if (!(cooldownElapsed || improved))
                continue;
            var signal = __assign(__assign({}, e.candidate), { symbol: this.config.symbol, timestamp: currentCandle.timestamp, candleIndex: this.currentIndex, scoreLabel: (0, setupScore_1.getSetupScoreLabel)(e.candidate.setupScore), whyFired: compactReason(e.reasons) });
            this.cooldownRegistry[key] = {
                lastIndex: this.currentIndex,
                lastSetupScore: e.candidate.setupScore,
            };
            this.emittedSignals.push(signal);
            newSignals.push(signal);
        }
        return {
            currentCandle: currentCandle,
            visibleCandles: visibleCandles,
            indicators: indicators,
            detectorEvaluations: evaluations,
            newSignals: newSignals,
            emittedSignals: __spreadArray([], this.emittedSignals, true),
            index: this.currentIndex,
            done: this.currentIndex >= this.series.length,
        };
    };
    return CandlePlaybackController;
}());
exports.CandlePlaybackController = CandlePlaybackController;
function buildState(scenario, candles, config) {
    return {
        scenario: scenario,
        symbol: config.symbol,
        index: 0,
        total: candles.length,
        visibleCandles: [],
        emittedSignals: [],
    };
}
/**
 * Session factory for Scanner Lab playback.
 * Isolated from live transport; Bybit REST/WS can feed the same candle arrays for parity testing.
 */
function createPlaybackSession(input) {
    var _a, _b;
    var scenario = (_a = input === null || input === void 0 ? void 0 : input.scenario) !== null && _a !== void 0 ? _a : 'breakout';
    var scenarioSource = SCENARIO_DATA[scenario];
    var candles = (_b = input === null || input === void 0 ? void 0 : input.candles) !== null && _b !== void 0 ? _b : scenarioSource.candles;
    var config = __assign(__assign(__assign({}, DEFAULT_CONFIG), { symbol: scenarioSource.symbol }), input === null || input === void 0 ? void 0 : input.config);
    return {
        state: buildState(scenario, candles, config),
        config: config,
        detectorEvaluations: [],
        lastStep: null,
        cooldownRegistry: {},
    };
}
function resetPlayback(session) {
    return __assign(__assign({}, session), { state: buildState(session.state.scenario, SCENARIO_DATA[session.state.scenario].candles, session.config), detectorEvaluations: [], lastStep: null, cooldownRegistry: {} });
}
function setScenario(session, scenario) {
    var source = SCENARIO_DATA[scenario];
    var config = __assign(__assign({}, session.config), { symbol: source.symbol });
    return __assign(__assign({}, session), { config: config, state: buildState(scenario, source.candles, config), detectorEvaluations: [], lastStep: null, cooldownRegistry: {} });
}
function stepForward(session) {
    if (session.state.index >= session.state.total)
        return session;
    var sourceCandles = SCENARIO_DATA[session.state.scenario].candles;
    var nextIndex = session.state.index + 1;
    var visibleCandles = sourceCandles.slice(Math.max(0, nextIndex - session.config.windowSize), nextIndex);
    if (visibleCandles.length === 0)
        return session;
    var currentCandle = visibleCandles.at(-1);
    if (!currentCandle)
        return session;
    var _a = (0, detectors_1.runScannerLabEngineEvaluations)(session.config.symbol, visibleCandles), indicators = _a.indicators, evaluations = _a.evaluations;
    var nextCooldown = __assign({}, session.cooldownRegistry);
    var newSignals = [];
    for (var _i = 0, evaluations_2 = evaluations; _i < evaluations_2.length; _i++) {
        var e = evaluations_2[_i];
        if (!e.triggered || !e.candidate)
            continue;
        if (e.candidate.setupScore < session.config.minSetupScore)
            continue;
        if (!currentCandle.isClosed)
            continue;
        var key = candidateKey(session.config.symbol, e.candidate.setupType);
        var prior = nextCooldown[key];
        var cooldownElapsed = !prior || nextIndex - prior.lastIndex >= session.config.cooldownCandles;
        var improved = !prior || e.candidate.setupScore - prior.lastSetupScore >= session.config.minScoreImprovement;
        if (!(cooldownElapsed || improved))
            continue;
        var signal = __assign(__assign({}, e.candidate), { symbol: session.config.symbol, timestamp: currentCandle.timestamp, candleIndex: nextIndex, scoreLabel: (0, setupScore_1.getSetupScoreLabel)(e.candidate.setupScore), whyFired: compactReason(e.reasons) });
        nextCooldown[key] = { lastIndex: nextIndex, lastSetupScore: e.candidate.setupScore };
        newSignals.push(signal);
    }
    var emittedSignals = __spreadArray(__spreadArray([], session.state.emittedSignals, true), newSignals, true);
    var result = {
        currentCandle: currentCandle,
        visibleCandles: visibleCandles,
        indicators: indicators,
        detectorEvaluations: evaluations,
        newSignals: newSignals,
        emittedSignals: emittedSignals,
        index: nextIndex,
        done: nextIndex >= session.state.total,
    };
    return __assign(__assign({}, session), { detectorEvaluations: evaluations, cooldownRegistry: nextCooldown, lastStep: result, state: __assign(__assign({}, session.state), { index: nextIndex, visibleCandles: visibleCandles, emittedSignals: emittedSignals }) });
}
function startAutoplay(session, onUpdate, speedMs) {
    if (speedMs === void 0) { speedMs = 700; }
    var current = session;
    var timer = window.setInterval(function () {
        var _a;
        var next = stepForward(current);
        current = next;
        onUpdate(next);
        if ((_a = next.lastStep) === null || _a === void 0 ? void 0 : _a.done)
            window.clearInterval(timer);
    }, speedMs);
    return function () { return window.clearInterval(timer); };
}
