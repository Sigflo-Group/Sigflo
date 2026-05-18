"use strict";
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
exports.MIN_ENGINE_BARS = exports.DEFAULT_DETECTOR_OPTIONS = void 0;
exports.playbackCandlesToEngine = playbackCandlesToEngine;
exports.engineSnapshotToDerivedIndicators = engineSnapshotToDerivedIndicators;
exports.runScannerLabEngineEvaluations = runScannerLabEngineEvaluations;
exports.deriveIndicators = deriveIndicators;
var detectors_1 = require("@/engine/detectors");
var indicators_1 = require("@/engine/indicators");
exports.DEFAULT_DETECTOR_OPTIONS = {
    useVolumeFilter: true,
    useRsiFilter: true,
    compressionThreshold: 1.4,
};
/** Same minimum bar count as `src/engine/detectors.ts` detectors. */
exports.MIN_ENGINE_BARS = 60;
function playbackCandlesToEngine(candles) {
    return candles.map(function (c) { return ({
        ts: c.timestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
        isClosed: c.isClosed,
    }); });
}
function engineSnapshotToDerivedIndicators(snap) {
    return {
        ema20: snap.ema20,
        ema50: snap.ema50,
        rsi14: snap.rsi14,
        atr14: snap.atr14,
        avgVolume20: snap.avgVolume20,
        swingHigh: snap.localSwingHigh,
        swingLow: snap.localSwingLow,
        breakoutDistance: snap.breakoutDistanceAtr,
        pullbackDepth: snap.pullbackDepthAtr,
    };
}
function explanationFactsToRecord(facts) {
    return {
        emaTrend: facts.emaTrend,
        rsi: facts.rsi,
        rsiSlope: facts.rsiSlope,
        volumeRatio: facts.volumeRatio,
        breakoutDistanceAtr: facts.breakoutDistanceAtr,
        pullbackDepthAtr: facts.pullbackDepthAtr,
        extensionAtr: facts.extensionAtr,
    };
}
function engineToLabCandidate(e) {
    return {
        setupType: e.setupType,
        directionBias: e.directionBias,
        scoreBreakdown: e.scoreBreakdown,
        setupScore: e.setupScore,
        tags: __spreadArray([], e.tags, true),
        explanationFacts: explanationFactsToRecord(e.explanationFacts),
    };
}
function evaluationFromEngine(setupType, engineResult, lastClosed, barCount) {
    if (barCount < exports.MIN_ENGINE_BARS) {
        return {
            triggered: false,
            setupType: setupType,
            reasons: ["Need at least ".concat(exports.MIN_ENGINE_BARS, " candles in window (engine parity)")],
        };
    }
    if (!lastClosed) {
        return {
            triggered: false,
            setupType: setupType,
            reasons: ['Last candle is not closed'],
        };
    }
    if (!engineResult) {
        return {
            triggered: false,
            setupType: setupType,
            reasons: ['Engine: long/short pair did not qualify on this bar'],
        };
    }
    var labCand = engineToLabCandidate(engineResult);
    return {
        triggered: true,
        setupType: setupType,
        reasons: ["".concat(engineResult.biasLabel, " \u2014 closed bar (engine)")],
        scoreBreakdown: labCand.scoreBreakdown,
        explanationFacts: labCand.explanationFacts,
        candidate: labCand,
    };
}
/**
 * Indicators + three detector rows using the same rules as `runScannerPipeline` / live Bybit path.
 */
function runScannerLabEngineEvaluations(symbol, visible) {
    var engineCandles = playbackCandlesToEngine(visible);
    var snap = (0, indicators_1.deriveIndicatorSnapshot)(engineCandles);
    var indicators = engineSnapshotToDerivedIndicators(snap);
    var last = visible.at(-1);
    var lastClosed = Boolean(last === null || last === void 0 ? void 0 : last.isClosed);
    var di = {
        symbol: symbol,
        candles: engineCandles,
        indicators: snap,
        lastCandleClosed: lastClosed,
    };
    var breakout = (0, detectors_1.pickBestDirectionalPair)((0, detectors_1.detectBreakoutPressure)(di), (0, detectors_1.detectBreakdownPressure)(di));
    var pullback = (0, detectors_1.pickBestDirectionalPair)((0, detectors_1.detectPullbackContinuation)(di), (0, detectors_1.detectPullbackContinuationShort)(di));
    var overextended = (0, detectors_1.pickBestDirectionalPair)((0, detectors_1.detectOverextendedWarning)(di), (0, detectors_1.detectOverextendedShort)(di));
    var n = visible.length;
    return {
        indicators: indicators,
        evaluations: [
            evaluationFromEngine('breakout', breakout, lastClosed, n),
            evaluationFromEngine('pullback', pullback, lastClosed, n),
            evaluationFromEngine('overextended', overextended, lastClosed, n),
        ],
    };
}
/** Snapshot for any window length (charts / seed panel); detectors still need {@link MIN_ENGINE_BARS}. */
function deriveIndicators(candles) {
    return engineSnapshotToDerivedIndicators((0, indicators_1.deriveIndicatorSnapshot)(playbackCandlesToEngine(candles)));
}
