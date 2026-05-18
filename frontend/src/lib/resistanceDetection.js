"use strict";
/**
 * Short-term structure levels from recent OHLC (v1).
 *
 * Sanity bands (min/max distance + final 5% guard) prevent showing stale or seed levels
 * that are nowhere near live price — a common trust break when mock data drifts from the tape.
 */
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
exports.toStructureCandles = toStructureCandles;
exports.findSwingHighs = findSwingHighs;
exports.findSwingLows = findSwingLows;
exports.clusterLevels = clusterLevels;
exports.isLevelSane = isLevelSane;
exports.detectNearestResistance = detectNearestResistance;
exports.detectNearestSupport = detectNearestSupport;
exports.detectNearestResistanceFromChartCandles = detectNearestResistanceFromChartCandles;
exports.detectNearestSupportFromChartCandles = detectNearestSupportFromChartCandles;
var DEFAULT_MAX_CANDLES = 100;
/** Map app chart candles (ts + optional volume) into the detector shape; keep last N only. */
function toStructureCandles(raw, maxCount) {
    if (maxCount === void 0) { maxCount = DEFAULT_MAX_CANDLES; }
    var slice = raw.length <= maxCount ? raw : raw.slice(-maxCount);
    return slice.map(function (c) {
        var _a;
        return ({
            time: c.ts,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
            volume: (_a = c.volume) !== null && _a !== void 0 ? _a : 0,
        });
    });
}
function findSwingHighs(candles, lookback) {
    if (lookback === void 0) { lookback = 2; }
    var swings = [];
    if (candles.length < lookback * 2 + 1)
        return swings;
    for (var i = lookback; i < candles.length - lookback; i++) {
        var currentHigh = candles[i].high;
        var isSwingHigh = true;
        for (var j = 1; j <= lookback; j++) {
            if (currentHigh <= candles[i - j].high || currentHigh <= candles[i + j].high) {
                isSwingHigh = false;
                break;
            }
        }
        if (isSwingHigh)
            swings.push(currentHigh);
    }
    return swings;
}
function findSwingLows(candles, lookback) {
    if (lookback === void 0) { lookback = 2; }
    var swings = [];
    if (candles.length < lookback * 2 + 1)
        return swings;
    for (var i = lookback; i < candles.length - lookback; i++) {
        var currentLow = candles[i].low;
        var isSwingLow = true;
        for (var j = 1; j <= lookback; j++) {
            if (currentLow >= candles[i - j].low || currentLow >= candles[i + j].low) {
                isSwingLow = false;
                break;
            }
        }
        if (isSwingLow)
            swings.push(currentLow);
    }
    return swings;
}
/**
 * Merge prices that sit within thresholdPct of the running cluster mean (reduces duplicate triggers from noisy swings).
 */
function clusterLevels(levels, thresholdPct) {
    if (thresholdPct === void 0) { thresholdPct = 0.0025; }
    if (!levels.length)
        return [];
    var sorted = __spreadArray([], levels, true).sort(function (a, b) { return a - b; });
    var clusters = [[sorted[0]]];
    for (var i = 1; i < sorted.length; i++) {
        var current = sorted[i];
        var lastCluster = clusters[clusters.length - 1];
        var avg = lastCluster.reduce(function (sum, n) { return sum + n; }, 0) / lastCluster.length;
        var pctDiff = Math.abs(current - avg) / avg;
        if (pctDiff <= thresholdPct) {
            lastCluster.push(current);
        }
        else {
            clusters.push([current]);
        }
    }
    return clusters.map(function (cluster) { return cluster.reduce(function (sum, n) { return sum + n; }, 0) / cluster.length; });
}
/** Last-line-of-defense: never surface a level the UI could read as “actionable” if it’s wildly off last. */
function isLevelSane(currentPrice, level, maxPct) {
    if (maxPct === void 0) { maxPct = 0.05; }
    if (!(currentPrice > 0) || !(level > 0))
        return false;
    return Math.abs(level - currentPrice) / currentPrice <= maxPct;
}
function detectNearestResistance(candles, currentPrice, minDistancePct, maxDistancePct) {
    if (minDistancePct === void 0) { minDistancePct = 0.002; }
    if (maxDistancePct === void 0) { maxDistancePct = 0.03; }
    if (!(currentPrice > 0) || candles.length < 5)
        return null;
    var swingHighs = findSwingHighs(candles, 2);
    var filtered = swingHighs.filter(function (level) {
        var distancePct = (level - currentPrice) / currentPrice;
        return distancePct >= minDistancePct && distancePct <= maxDistancePct;
    });
    var clustered = clusterLevels(filtered, 0.0025);
    if (!clustered.length)
        return null;
    var nearest = __spreadArray([], clustered, true).sort(function (a, b) { return a - b; })[0];
    return isLevelSane(currentPrice, nearest) ? nearest : null;
}
/** Nearest valid swing low below price (short-bias confirmation zone), symmetric rules to resistance. */
function detectNearestSupport(candles, currentPrice, minDistancePct, maxDistancePct) {
    if (minDistancePct === void 0) { minDistancePct = 0.002; }
    if (maxDistancePct === void 0) { maxDistancePct = 0.03; }
    if (!(currentPrice > 0) || candles.length < 5)
        return null;
    var swingLows = findSwingLows(candles, 2);
    var filtered = swingLows.filter(function (level) {
        var distancePct = (currentPrice - level) / currentPrice;
        return distancePct >= minDistancePct && distancePct <= maxDistancePct;
    });
    var clustered = clusterLevels(filtered, 0.0025);
    if (!clustered.length)
        return null;
    var nearest = __spreadArray([], clustered, true).sort(function (a, b) { return b - a; })[0];
    return isLevelSane(currentPrice, nearest) ? nearest : null;
}
/**
 * Convenience: slice last candles, convert shape, run resistance detection.
 */
function detectNearestResistanceFromChartCandles(raw, currentPrice, maxCandles) {
    if (maxCandles === void 0) { maxCandles = DEFAULT_MAX_CANDLES; }
    var candles = toStructureCandles(raw, maxCandles);
    return detectNearestResistance(candles, currentPrice);
}
function detectNearestSupportFromChartCandles(raw, currentPrice, maxCandles) {
    if (maxCandles === void 0) { maxCandles = DEFAULT_MAX_CANDLES; }
    var candles = toStructureCandles(raw, maxCandles);
    return detectNearestSupport(candles, currentPrice);
}
