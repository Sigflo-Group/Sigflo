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
exports.evaluateTimingLifecycle = evaluateTimingLifecycle;
var actionabilityScore_1 = require("@/lib/actionabilityScore");
var entryFreshness_1 = require("@/lib/entryFreshness");
var scannerConfig_1 = require("@/lib/scannerConfig");
var breakoutTiming_1 = require("@/lib/timingEvaluators/breakoutTiming");
var pullbackTiming_1 = require("@/lib/timingEvaluators/pullbackTiming");
var reclaimTiming_1 = require("@/lib/timingEvaluators/reclaimTiming");
var indicators_1 = require("@/lib/indicators");
function clamp(n, lo, hi) {
    return Math.min(hi, Math.max(lo, n));
}
function computeRoomToTargetScore(args) {
    var target = args.side === 'long' ? args.swingHigh + args.atrNow * 0.7 : args.swingLow - args.atrNow * 0.7;
    var roomRaw = args.side === 'long' ? target - args.close : args.close - target;
    var roomAtr = args.atrNow > 0 ? roomRaw / args.atrNow : 0;
    var score = clamp(Math.round((roomAtr / Math.max(0.1, args.config.minRoomToTargetAtr * 2.4)) * 100), 0, 100);
    return { score: score, roomToTargetAtr: roomAtr };
}
function computeState(args) {
    var _a, _b, _c, _d;
    var config = args.config;
    var trailing = args.history.slice(-config.expiredAfterCandles);
    var belowFloorStreak = trailing.length >= config.expiredAfterCandles &&
        trailing.every(function (x) { return x.timingScore < config.expiredViabilityFloor && x.actionabilityScore < config.expiredViabilityFloor; });
    if (belowFloorStreak)
        return 'expired';
    if (!args.triggerSeen) {
        if (args.timingScore >= config.readyTimingMin)
            return 'ready';
        return 'developing';
    }
    if (args.actionabilityScore >= config.triggeredActionabilityMin &&
        args.freshnessScore >= config.triggeredFreshnessMin &&
        ((_a = args.candlesSinceTrigger) !== null && _a !== void 0 ? _a : 0) <= config.extendedAfterCandles) {
        return 'triggered';
    }
    var timingDroppedFromPeak = args.peakTimingScore - args.timingScore >= config.timingDropFromPeakToExtend;
    if (timingDroppedFromPeak ||
        ((_b = args.candlesSincePeakTiming) !== null && _b !== void 0 ? _b : 0) >= config.extendedAfterCandles ||
        ((_c = args.candlesSinceTrigger) !== null && _c !== void 0 ? _c : 0) >= config.extendedAfterCandles) {
        if (((_d = args.candlesSinceTrigger) !== null && _d !== void 0 ? _d : 0) >= config.expiredAfterCandles && args.freshnessScore < config.expiredViabilityFloor) {
            return 'expired';
        }
        return 'extended';
    }
    return 'triggered';
}
function evaluateTimingLifecycle(args) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3;
    var config = (_a = args.config) !== null && _a !== void 0 ? _a : scannerConfig_1.SCANNER_LIFECYCLE_CONFIG;
    var candles = args.candles;
    var close = (_c = (_b = candles.at(-1)) === null || _b === void 0 ? void 0 : _b.close) !== null && _c !== void 0 ? _c : 0;
    var prevClose = (_e = (_d = candles.at(-2)) === null || _d === void 0 ? void 0 : _d.close) !== null && _e !== void 0 ? _e : close;
    var atrNow = Math.max(1e-8, (_f = (0, indicators_1.atr)(candles, 14).at(-1)) !== null && _f !== void 0 ? _f : 0);
    var rsiSeries = (0, indicators_1.rsi)(candles.map(function (c) { return c.close; }), 14);
    var rsiNow = (_g = rsiSeries.at(-1)) !== null && _g !== void 0 ? _g : 50;
    var rsiPrev = (_h = rsiSeries.at(-2)) !== null && _h !== void 0 ? _h : rsiNow;
    var rsiSlope = rsiNow - rsiPrev;
    var ema20Series = (0, indicators_1.ema)(candles.map(function (c) { return c.close; }), 20);
    var ema20 = (_j = ema20Series.at(-1)) !== null && _j !== void 0 ? _j : close;
    var swingHigh = (0, indicators_1.recentSwingHigh)(candles, 40);
    var swingLow = (0, indicators_1.recentSwingLow)(candles, 40);
    var candleRange = ((_l = (_k = candles.at(-1)) === null || _k === void 0 ? void 0 : _k.high) !== null && _l !== void 0 ? _l : close) - ((_o = (_m = candles.at(-1)) === null || _m === void 0 ? void 0 : _m.low) !== null && _o !== void 0 ? _o : close);
    var volume = (_q = (_p = candles.at(-1)) === null || _p === void 0 ? void 0 : _p.volume) !== null && _q !== void 0 ? _q : 0;
    var volumeAvg = candles.slice(-20).reduce(function (sum, c) { return sum + c.volume; }, 0) / Math.max(1, Math.min(20, candles.length));
    var volumeRatio = volumeAvg > 0 ? volume / volumeAvg : 1;
    var pullbackDepthAtr = atrNow > 0 ? (args.side === 'long' ? (ema20 - close) / atrNow : (close - ema20) / atrNow) : 0;
    var bounceStrengthAtr = atrNow > 0 ? Math.abs(close - prevClose) / atrNow : 0;
    var _4 = computeRoomToTargetScore({
        side: args.side,
        close: close,
        swingHigh: swingHigh,
        swingLow: swingLow,
        atrNow: atrNow,
        config: config,
    }), roomToTargetScore = _4.score, roomToTargetAtr = _4.roomToTargetAtr;
    var existingTrigger = ((_s = (_r = args.previous) === null || _r === void 0 ? void 0 : _r.trigger) === null || _s === void 0 ? void 0 : _s.firstValidEntryCandleIndex) != null;
    var breakout = (0, breakoutTiming_1.evaluateBreakoutTiming)({
        side: args.side,
        close: close,
        prevClose: prevClose,
        triggerLevel: args.side === 'long' ? swingHigh : swingLow,
        atrNow: atrNow,
        candleRange: candleRange,
        roomToTargetAtr: roomToTargetAtr,
        volumeRatio: volumeRatio,
        rsiNow: rsiNow,
        rsiSlope: rsiSlope,
        hasPreviousTrigger: existingTrigger,
    });
    var pullback = (0, pullbackTiming_1.evaluatePullbackTiming)({
        side: args.side,
        close: close,
        prevClose: prevClose,
        ema20: ema20,
        atrNow: atrNow,
        pullbackDepthAtr: pullbackDepthAtr,
        bounceCandleStrengthAtr: bounceStrengthAtr,
        roomToTargetAtr: roomToTargetAtr,
        rsiNow: rsiNow,
        rsiSlope: rsiSlope,
    });
    var reclaim = (0, reclaimTiming_1.evaluateReclaimTiming)({
        side: args.side,
        close: close,
        prevClose: prevClose,
        reclaimLevel: ema20,
        atrNow: atrNow,
        roomToTargetAtr: roomToTargetAtr,
        rsiSlope: rsiSlope,
        hasPreviousTrigger: existingTrigger,
    });
    var selected = args.setupType === 'pullback' ? pullback : args.setupType === 'breakout' ? breakout : reclaim;
    var candleIndex = Math.max(0, candles.length - 1);
    var previousTrigger = (_t = args.previous) === null || _t === void 0 ? void 0 : _t.trigger;
    var firstValidEntryCandleIndex = (previousTrigger === null || previousTrigger === void 0 ? void 0 : previousTrigger.firstValidEntryCandleIndex) != null
        ? previousTrigger.firstValidEntryCandleIndex
        : selected.triggerHit
            ? candleIndex
            : null;
    var idealEntryPrice = (previousTrigger === null || previousTrigger === void 0 ? void 0 : previousTrigger.idealEntryPrice) != null
        ? previousTrigger.idealEntryPrice
        : selected.triggerHit
            ? close
            : null;
    var candlesSinceTrigger = firstValidEntryCandleIndex != null ? Math.max(0, candleIndex - firstValidEntryCandleIndex) : null;
    var atrExtensionFromIdeal = idealEntryPrice != null ? Math.abs(close - idealEntryPrice) / Math.max(atrNow, 1e-8) : 0;
    var pctExtensionFromIdeal = idealEntryPrice != null ? (Math.abs(close - idealEntryPrice) / Math.max(idealEntryPrice, 1e-8)) * 100 : 0;
    var postTriggerImpulseCandles = candlesSinceTrigger != null
        ? candles.slice(-(candlesSinceTrigger + 1)).filter(function (c) { return (args.side === 'long' ? c.close > c.open : c.close < c.open); }).length
        : 0;
    var penalties = firstValidEntryCandleIndex == null
        ? (0, entryFreshness_1.emptyPenaltyBreakdown)()
        : (0, entryFreshness_1.buildPenaltyBreakdown)({
            candlesSinceTrigger: candlesSinceTrigger,
            atrExtensionFromIdeal: atrExtensionFromIdeal,
            pctExtensionFromIdeal: pctExtensionFromIdeal,
            postTriggerImpulseCandles: postTriggerImpulseCandles,
            roomToTargetScore: roomToTargetScore,
            config: config,
        });
    var weightedPenalty = penalties.candlesLatePenalty * config.penaltyWeights.candlesLatePenalty +
        penalties.atrExtensionPenalty * config.penaltyWeights.atrExtensionPenalty +
        penalties.percentExtensionPenalty * config.penaltyWeights.percentExtensionPenalty +
        penalties.postTriggerImpulsePenalty * config.penaltyWeights.postTriggerImpulsePenalty +
        penalties.crowdedLevelPenalty * config.penaltyWeights.crowdedLevelPenalty +
        penalties.rrCompressionPenalty * config.penaltyWeights.rrCompressionPenalty;
    var safeWeightedPenalty = Number.isFinite(weightedPenalty) ? weightedPenalty : 0;
    var timingScore = clamp(Math.round(selected.timingScore - safeWeightedPenalty), 0, 100);
    var entryFreshnessScore = (0, entryFreshness_1.computeEntryFreshnessScore)(penalties);
    var actionabilityScore = (0, actionabilityScore_1.computeActionabilityScore)({
        setupScore: args.setupScore,
        timingScore: timingScore,
        entryFreshnessScore: entryFreshnessScore,
        roomToTargetScore: roomToTargetScore,
    }, config.actionabilityWeights);
    var previousHistory = (_v = (_u = args.previous) === null || _u === void 0 ? void 0 : _u.timingHistory) !== null && _v !== void 0 ? _v : [];
    var historyWithoutNewest = __spreadArray([], previousHistory, true).slice(-Math.max(0, config.historyLimit - 1));
    var peakTimingScore = Math.max((_x = (_w = args.previous) === null || _w === void 0 ? void 0 : _w.peakTimingScore) !== null && _x !== void 0 ? _x : 0, timingScore);
    var peakTimingCandleIndex = peakTimingScore === timingScore ? candleIndex : ((_z = (_y = args.previous) === null || _y === void 0 ? void 0 : _y.peakTimingCandleIndex) !== null && _z !== void 0 ? _z : candleIndex);
    var peakActionabilityScore = Math.max((_1 = (_0 = args.previous) === null || _0 === void 0 ? void 0 : _0.peakActionabilityScore) !== null && _1 !== void 0 ? _1 : 0, actionabilityScore);
    var peakActionabilityCandleIndex = peakActionabilityScore === actionabilityScore
        ? candleIndex
        : ((_3 = (_2 = args.previous) === null || _2 === void 0 ? void 0 : _2.peakActionabilityCandleIndex) !== null && _3 !== void 0 ? _3 : candleIndex);
    var candlesSincePeakTiming = peakTimingCandleIndex != null ? Math.max(0, candleIndex - peakTimingCandleIndex) : null;
    var candlesSincePeakActionability = peakActionabilityCandleIndex != null
        ? Math.max(0, candleIndex - peakActionabilityCandleIndex)
        : null;
    var provisionalHistory = __spreadArray(__spreadArray([], historyWithoutNewest, true), [
        {
            candleIndex: candleIndex,
            timingScore: timingScore,
            entryFreshnessScore: entryFreshnessScore,
            roomToTargetScore: roomToTargetScore,
            actionabilityScore: actionabilityScore,
            state: 'developing',
        },
    ], false);
    var state = computeState({
        triggerSeen: firstValidEntryCandleIndex != null,
        timingScore: timingScore,
        freshnessScore: entryFreshnessScore,
        actionabilityScore: actionabilityScore,
        candlesSinceTrigger: candlesSinceTrigger,
        candlesSincePeakTiming: candlesSincePeakTiming,
        peakTimingScore: peakTimingScore,
        config: config,
        history: provisionalHistory,
    });
    var timingHistory = __spreadArray(__spreadArray([], historyWithoutNewest, true), [__assign(__assign({}, provisionalHistory.at(-1)), { state: state })], false);
    var lifecycle = {
        state: state,
        trigger: {
            triggerType: (previousTrigger === null || previousTrigger === void 0 ? void 0 : previousTrigger.triggerType) && previousTrigger.triggerType !== 'unknown'
                ? previousTrigger.triggerType
                : selected.triggerType,
            triggerReason: selected.triggerReason,
            firstValidEntryCandleIndex: firstValidEntryCandleIndex,
            idealEntryPrice: idealEntryPrice,
        },
        timingHistory: timingHistory,
        peakTimingScore: peakTimingScore,
        peakTimingCandleIndex: peakTimingCandleIndex,
        peakActionabilityScore: peakActionabilityScore,
        peakActionabilityCandleIndex: peakActionabilityCandleIndex,
        candlesSinceTrigger: candlesSinceTrigger,
        candlesSincePeakTiming: candlesSincePeakTiming,
        candlesSincePeakActionability: candlesSincePeakActionability,
        penalties: penalties,
        positiveFactors: selected.positiveFactors,
    };
    return {
        lifecycle: lifecycle,
        diagnostics: {
            setupType: args.setupType,
            timingScore: timingScore,
            entryFreshnessScore: entryFreshnessScore,
            roomToTargetScore: roomToTargetScore,
            actionabilityScore: actionabilityScore,
            state: state,
            triggerType: lifecycle.trigger.triggerType,
            idealEntryPrice: idealEntryPrice,
            currentPrice: close,
            atrExtensionFromIdeal: Number(atrExtensionFromIdeal.toFixed(3)),
            candlesSinceTrigger: candlesSinceTrigger,
            candlesSincePeakTiming: candlesSincePeakTiming,
            penalties: penalties,
            positiveFactors: selected.positiveFactors,
        },
    };
}
