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
exports.DEFAULT_CUSTOM_STRATEGY_THRESHOLDS = void 0;
exports.sanitizeExitStrategyThresholds = sanitizeExitStrategyThresholds;
exports.resolveStrategyThresholds = resolveStrategyThresholds;
exports.computeExitGuidance = computeExitGuidance;
var formatQuote_1 = require("@/lib/formatQuote");
function clamp(n, lo, hi) {
    return Math.min(hi, Math.max(lo, n));
}
function stopPressure(side, entry, stop, last) {
    if (!(entry > 0) || !(last > 0))
        return 0;
    if (side === 'long') {
        var span_1 = entry - stop;
        if (span_1 <= 0)
            return 0;
        var buf_1 = last - stop;
        if (buf_1 <= 0)
            return 1;
        return 1 - clamp(buf_1 / span_1, 0, 1);
    }
    var span = stop - entry;
    if (span <= 0)
        return 0;
    var buf = stop - last;
    if (buf <= 0)
        return 1;
    return 1 - clamp(buf / span, 0, 1);
}
function targetProximity(side, entry, target, last) {
    if (!(entry > 0) || !(last > 0))
        return 0;
    if (side === 'long') {
        var span_2 = target - entry;
        if (span_2 <= 0)
            return 0;
        return clamp((last - entry) / span_2, 0, 1);
    }
    var span = entry - target;
    if (span <= 0)
        return 0;
    return clamp((entry - last) / span, 0, 1);
}
function trendMomentum01(trendAlignment, momentumQuality) {
    return (clamp(trendAlignment / 25, 0, 1) + clamp(momentumQuality / 20, 0, 1)) / 2;
}
/** Default weights for the `custom` exit strategy (editable in Exit AI when Custom is selected). */
exports.DEFAULT_CUSTOM_STRATEGY_THRESHOLDS = {
    stopMain: 0.74,
    stopMid: 0.48,
    stopPnl: -0.8,
    stopPnlSp: 0.38,
    trimMain: 0.7,
    trimMid: 0.42,
    trimMom: 0.44,
    trimLo: 0.36,
    trimPnl: 0.4,
};
function clampTh(n, lo, hi, fallback) {
    if (!Number.isFinite(n))
        return fallback;
    return Math.min(hi, Math.max(lo, n));
}
/** Merge partial user values with defaults and safe bounds (used for persisted JSON). */
function sanitizeExitStrategyThresholds(partial) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    var d = exports.DEFAULT_CUSTOM_STRATEGY_THRESHOLDS;
    if (!partial)
        return __assign({}, d);
    return {
        stopMain: clampTh((_a = partial.stopMain) !== null && _a !== void 0 ? _a : d.stopMain, 0.45, 0.95, d.stopMain),
        stopMid: clampTh((_b = partial.stopMid) !== null && _b !== void 0 ? _b : d.stopMid, 0.2, 0.8, d.stopMid),
        stopPnl: clampTh((_c = partial.stopPnl) !== null && _c !== void 0 ? _c : d.stopPnl, -1.5, -0.2, d.stopPnl),
        stopPnlSp: clampTh((_d = partial.stopPnlSp) !== null && _d !== void 0 ? _d : d.stopPnlSp, 0.12, 0.6, d.stopPnlSp),
        trimMain: clampTh((_e = partial.trimMain) !== null && _e !== void 0 ? _e : d.trimMain, 0.45, 0.95, d.trimMain),
        trimMid: clampTh((_f = partial.trimMid) !== null && _f !== void 0 ? _f : d.trimMid, 0.2, 0.8, d.trimMid),
        trimMom: clampTh((_g = partial.trimMom) !== null && _g !== void 0 ? _g : d.trimMom, 0.15, 0.7, d.trimMom),
        trimLo: clampTh((_h = partial.trimLo) !== null && _h !== void 0 ? _h : d.trimLo, 0.15, 0.7, d.trimLo),
        trimPnl: clampTh((_j = partial.trimPnl) !== null && _j !== void 0 ? _j : d.trimPnl, 0.1, 0.85, d.trimPnl),
    };
}
function presetThresholdsNonCustom(preset) {
    if (preset === 'protect_profit') {
        return {
            stopMain: 0.66,
            stopMid: 0.42,
            stopPnl: -0.65,
            stopPnlSp: 0.34,
            trimMain: 0.58,
            trimMid: 0.36,
            trimMom: 0.48,
            trimLo: 0.3,
            trimPnl: 0.28,
        };
    }
    if (preset === 'trend_follow') {
        return {
            stopMain: 0.82,
            stopMid: 0.54,
            stopPnl: -0.95,
            stopPnlSp: 0.42,
            trimMain: 0.8,
            trimMid: 0.5,
            trimMom: 0.38,
            trimLo: 0.42,
            trimPnl: 0.52,
        };
    }
    if (preset === 'tight_risk') {
        return {
            stopMain: 0.62,
            stopMid: 0.4,
            stopPnl: -0.55,
            stopPnlSp: 0.32,
            trimMain: 0.64,
            trimMid: 0.38,
            trimMom: 0.48,
            trimLo: 0.34,
            trimPnl: 0.35,
        };
    }
    return __assign({}, exports.DEFAULT_CUSTOM_STRATEGY_THRESHOLDS);
}
function resolveStrategyThresholds(preset, customPartial) {
    var p = preset !== null && preset !== void 0 ? preset : 'custom';
    if (p === 'custom') {
        return sanitizeExitStrategyThresholds(customPartial);
    }
    return presetThresholdsNonCustom(p);
}
/**
 * Heuristic exit guidance from price vs plan, trend, and momentum.
 * Updates whenever inputs change (live price, SL/TP, scores).
 */
function computeExitGuidance(args) {
    var side = args.side, entry = args.entry, lastPrice = args.lastPrice, stop = args.stop, target = args.target, trendAlignment = args.trendAlignment, momentumQuality = args.momentumQuality, pnlPct = args.pnlPct, strategyPreset = args.strategyPreset, customStrategyThresholds = args.customStrategyThresholds;
    var sp = stopPressure(side, entry, stop, lastPrice);
    var tp = targetProximity(side, entry, target, lastPrice);
    var th = resolveStrategyThresholds(strategyPreset, strategyPreset === 'custom' ? customStrategyThresholds : null);
    var tm = trendMomentum01(trendAlignment, momentumQuality);
    var state;
    var reason;
    var confidenceLabel;
    var referencePrice;
    var nearStop = sp > th.stopMain || (sp > th.stopMid && tm < 0.32) || (pnlPct < th.stopPnl && sp > th.stopPnlSp);
    var nearTarget = tp > th.trimMain || (tp > th.trimMid && tm < th.trimMom) || (tp > th.trimLo && pnlPct > th.trimPnl);
    if (nearStop) {
        state = 'exit';
        reason =
            sp >= 0.9
                ? 'Price is pressing the invalidation zone — setup at risk.'
                : tm < 0.35
                    ? 'Momentum fading while price drifts toward stop.'
                    : 'Room to stop is thin — protect capital.';
        confidenceLabel = sp > 0.82 || tm < 0.28 ? 'High' : 'Medium';
        referencePrice = stop;
    }
    else if (nearTarget) {
        state = 'trim';
        var dynamicTrim = side === 'long'
            ? target * (1 - 0.0012 * (1 - tm))
            : target * (1 + 0.0012 * (1 - tm));
        referencePrice = dynamicTrim;
        reason =
            tp > 0.78
                ? 'Planned target zone is close — extension may mean-revert.'
                : tm < 0.45
                    ? 'Tape softening into resistance — partial de-risk is reasonable.'
                    : 'Favorable move — lock in some profit into liquidity.';
        confidenceLabel = tp > 0.75 ? 'High' : 'Medium';
    }
    else {
        state = 'hold';
        var nudge = side === 'long'
            ? target * (1 + 0.0025 * tm)
            : target * (1 - 0.0025 * tm);
        referencePrice = nudge;
        reason =
            tm > 0.55
                ? 'Trend alignment and momentum still support the thesis.'
                : 'No immediate threat to plan — watch for structure breaks.';
        confidenceLabel = tm > 0.5 ? 'High' : tm > 0.35 ? 'Medium' : 'Low';
    }
    /** Hold is a neutral state — no shouty prefix in UI (strip / micro-row skip it). */
    var headline = state === 'hold' ? '' : state === 'trim' ? 'TRIM' : 'EXIT';
    var action;
    if (state === 'exit') {
        action = "Cut or tighten \u2014 watch ~$".concat((0, formatQuote_1.formatQuoteGuidance)(stop));
    }
    else if (state === 'trim') {
        action = "Take profit near ~$".concat((0, formatQuote_1.formatQuoteGuidance)(referencePrice));
    }
    else {
        action = "Let it work toward take-profit ~$".concat((0, formatQuote_1.formatQuoteGuidance)(target));
    }
    return {
        state: state,
        headline: headline,
        action: action,
        reason: reason,
        confidenceLabel: confidenceLabel,
        referencePrice: referencePrice,
    };
}
