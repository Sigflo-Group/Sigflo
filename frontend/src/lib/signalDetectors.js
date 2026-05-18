"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSignalFromMarket = buildSignalFromMarket;
exports.inferMarketRegime = inferMarketRegime;
var setupScore_1 = require("@/lib/setupScore");
var timingLifecycle_1 = require("@/lib/timingLifecycle");
var indicators_1 = require("@/lib/indicators");
function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
}
function coreMetrics(candles) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    var closes = candles.map(function (c) { return c.close; });
    var volumes = candles.map(function (c) { return c.volume; });
    var ema20 = (0, indicators_1.ema)(closes, 20);
    var ema50 = (0, indicators_1.ema)(closes, 50);
    var rsi14 = (0, indicators_1.rsi)(closes, 14);
    var atr14 = (0, indicators_1.atr)(candles, 14);
    var volAvg20 = (0, indicators_1.rollingAvg)(volumes, 20);
    var close = (_a = closes.at(-1)) !== null && _a !== void 0 ? _a : 0;
    var atrNow = (_b = atr14.at(-1)) !== null && _b !== void 0 ? _b : 0;
    var rsiNow = (_c = rsi14.at(-1)) !== null && _c !== void 0 ? _c : 50;
    return {
        close: close,
        closePrev: (_d = closes.at(-2)) !== null && _d !== void 0 ? _d : close,
        ema20: (_e = ema20.at(-1)) !== null && _e !== void 0 ? _e : close,
        ema20Prev: (_f = ema20.at(-2)) !== null && _f !== void 0 ? _f : ((_g = ema20.at(-1)) !== null && _g !== void 0 ? _g : close),
        ema50: (_h = ema50.at(-1)) !== null && _h !== void 0 ? _h : close,
        ema50Prev: (_j = ema50.at(-2)) !== null && _j !== void 0 ? _j : ((_k = ema50.at(-1)) !== null && _k !== void 0 ? _k : close),
        rsiNow: rsiNow,
        rsiPrev: (_l = rsi14.at(-2)) !== null && _l !== void 0 ? _l : rsiNow,
        atrNow: atrNow,
        volNow: (_m = volumes.at(-1)) !== null && _m !== void 0 ? _m : 0,
        volAvg: (_o = volAvg20.at(-1)) !== null && _o !== void 0 ? _o : 1,
        swingHigh: (0, indicators_1.recentSwingHigh)(candles, 40),
        swingLow: (0, indicators_1.recentSwingLow)(candles, 40),
    };
}
function rangeCompressionScore(candles, atrNow) {
    var recent = candles.slice(-8);
    var sumRange = recent.reduce(function (s, c) { return s + (c.high - c.low); }, 0);
    var ratio = atrNow > 0 ? sumRange / atrNow : 99;
    return clamp((2.6 - ratio) / 1.6, 0, 1);
}
function thresholdsForRegime(regime) {
    if (regime === 'risk_off') {
        return {
            breakoutVolRatio: 1.35,
            breakoutDistAtr: 0.3,
            breakoutCompression: 0.46,
            pullbackMaxDistAtr: 0.45,
            overextendedStretchAtr: 1.7,
        };
    }
    if (regime === 'risk_on') {
        return {
            breakoutVolRatio: 1.2,
            breakoutDistAtr: 0.42,
            breakoutCompression: 0.34,
            pullbackMaxDistAtr: 0.6,
            overextendedStretchAtr: 1.9,
        };
    }
    return {
        breakoutVolRatio: 1.25,
        breakoutDistAtr: 0.35,
        breakoutCompression: 0.4,
        pullbackMaxDistAtr: 0.5,
        overextendedStretchAtr: 1.8,
    };
}
function breakoutPressureDetector(candles, thresholds) {
    if (candles.length < 60)
        return null;
    var m = coreMetrics(candles);
    var trend = m.close > m.ema20 && m.ema20 > m.ema50 && m.ema20 > m.ema20Prev && m.ema50 > m.ema50Prev;
    var compression = rangeCompressionScore(candles, m.atrNow);
    var distToHigh = m.swingHigh - m.close;
    var distanceToBreakoutAtr = m.atrNow > 0 ? distToHigh / m.atrNow : 99;
    var nearBreakout = m.atrNow > 0 && distToHigh >= 0 && distToHigh < thresholds.breakoutDistAtr * m.atrNow;
    var volBoost = m.volAvg > 0 ? m.volNow / m.volAvg : 1;
    var volOk = volBoost > thresholds.breakoutVolRatio;
    var rsiSlope = m.rsiNow - m.rsiPrev;
    var rsiOk = m.rsiNow >= 55 && m.rsiNow <= 72 && rsiSlope >= -0.5;
    var passCount = [trend, compression > thresholds.breakoutCompression, nearBreakout, volOk, rsiOk].filter(Boolean).length;
    if (passCount < 4)
        return null;
    return {
        setupType: 'breakout',
        side: 'long',
        biasLabel: 'Potential Long',
        setupTags: ['Breakout'],
        riskTag: 'Medium Risk',
        aiExplanation: 'Range is tightening and pressure is building into local highs.',
        whyThisMatters: 'A clean break can move quickly when resistance overhead is thin.',
        breakdown: {
            trendAlignment: trend ? 22 : 14,
            momentumQuality: clamp(Math.round(((m.rsiNow - 50) / 22) * 20), 8, 18),
            structureQuality: clamp(Math.round((compression * 0.6 + (nearBreakout ? 0.4 : 0.2)) * 25), 10, 22),
            volumeConfirmation: clamp(Math.round(Math.min(volBoost, 2) / 2 * 15), 6, 14),
            riskConditions: 8,
        },
        facts: {
            emaTrend: trend ? 'bullish' : 'neutral',
            volumeRatio: Number(volBoost.toFixed(2)),
            rsi: Number(m.rsiNow.toFixed(1)),
            distanceToBreakoutAtr: Number(distanceToBreakoutAtr.toFixed(2)),
        },
    };
}
function pullbackContinuationDetector(candles, thresholds) {
    if (candles.length < 60)
        return null;
    var m = coreMetrics(candles);
    var trendUp = m.ema20 > m.ema50;
    var nearEma = m.atrNow > 0 && Math.abs(m.close - m.ema20) <= thresholds.pullbackMaxDistAtr * m.atrNow;
    var pullbackDepth = m.atrNow > 0 ? (m.ema20 - m.close) / m.atrNow : 0;
    var depthOk = pullbackDepth >= -0.3 && pullbackDepth <= 1.5;
    var rsiOk = m.rsiNow >= 45 && m.rsiNow <= 60 && m.rsiNow >= m.rsiPrev;
    var recent = candles.slice(-8);
    var redVol = recent.filter(function (c) { return c.close < c.open; }).reduce(function (s, c) { return s + c.volume; }, 0);
    var greenVol = recent.filter(function (c) { return c.close >= c.open; }).reduce(function (s, c) { return s + c.volume; }, 0);
    var volCool = redVol < greenVol * 1.05;
    var passCount = [trendUp, nearEma, depthOk, rsiOk, volCool].filter(Boolean).length;
    if (passCount < 4)
        return null;
    return {
        setupType: 'pullback',
        side: 'long',
        biasLabel: 'Potential Long',
        setupTags: ['Pullback'],
        riskTag: 'Low Risk',
        aiExplanation: 'Pullback remains orderly while trend structure stays intact.',
        whyThisMatters: 'If buyers hold this zone, continuation entries often get cleaner risk.',
        breakdown: {
            trendAlignment: trendUp ? 21 : 14,
            momentumQuality: clamp(Math.round((1 - Math.abs(52 - m.rsiNow) / 16) * 20), 9, 17),
            structureQuality: clamp(Math.round(((nearEma ? 0.5 : 0.2) + (depthOk ? 0.5 : 0.2)) * 25), 12, 22),
            volumeConfirmation: volCool ? 11 : 8,
            riskConditions: 10,
        },
        facts: {
            emaTrend: trendUp ? 'bullish' : 'neutral',
            volumeRatio: Number((m.volNow / Math.max(1, m.volAvg)).toFixed(2)),
            rsi: Number(m.rsiNow.toFixed(1)),
            pullbackDepthAtr: Number(pullbackDepth.toFixed(2)),
        },
    };
}
function overextendedDetector(candles, thresholds) {
    if (candles.length < 60)
        return null;
    var m = coreMetrics(candles);
    var stretch = m.atrNow > 0 ? Math.abs(m.close - m.ema20) / m.atrNow : 0;
    var stretchOk = stretch > thresholds.overextendedStretchAtr;
    var rsiHot = m.rsiNow > 74;
    var c3 = candles.slice(-3);
    var gain3 = c3.length > 0 ? c3[c3.length - 1].close - c3[0].open : 0;
    var expansion = m.atrNow > 0 ? gain3 / m.atrNow : 0;
    var expansionOk = expansion > 1.5;
    var nearResistance = m.atrNow > 0 && m.swingHigh - m.close < 0.4 * m.atrNow;
    var passCount = [stretchOk, rsiHot, expansionOk, nearResistance].filter(Boolean).length;
    if (passCount < 3)
        return null;
    return {
        setupType: 'overextended',
        side: 'long',
        biasLabel: 'Overextended',
        setupTags: ['Overextended'],
        riskTag: 'High Risk',
        aiExplanation: 'Price is extended away from trend support and momentum is overheated.',
        whyThisMatters: 'Late entries here are vulnerable if price reverts toward trend mean.',
        breakdown: {
            trendAlignment: 15,
            momentumQuality: 12,
            structureQuality: 10,
            volumeConfirmation: 8,
            riskConditions: 4,
        },
        facts: {
            emaTrend: m.close > m.ema20 ? 'bullish' : 'neutral',
            volumeRatio: Number((m.volNow / Math.max(1, m.volAvg)).toFixed(2)),
            rsi: Number(m.rsiNow.toFixed(1)),
            extensionAtr: Number(stretch.toFixed(2)),
            distanceToBreakoutAtr: Number(((m.swingHigh - m.close) / Math.max(0.000001, m.atrNow)).toFixed(2)),
        },
    };
}
/** Bearish mirror of `breakoutPressureDetector`: downtrend, compression into local lows, sell-volume pressure. */
function breakdownPressureDetector(candles, thresholds) {
    if (candles.length < 60)
        return null;
    var m = coreMetrics(candles);
    var trend = m.close < m.ema20 && m.ema20 < m.ema50 && m.ema20 < m.ema20Prev && m.ema50 < m.ema50Prev;
    var compression = rangeCompressionScore(candles, m.atrNow);
    var distToLow = m.close - m.swingLow;
    var distanceToBreakdownAtr = m.atrNow > 0 ? distToLow / m.atrNow : 99;
    var nearBreakdown = m.atrNow > 0 && distToLow >= 0 && distToLow < thresholds.breakoutDistAtr * m.atrNow;
    var volBoost = m.volAvg > 0 ? m.volNow / m.volAvg : 1;
    var volOk = volBoost > thresholds.breakoutVolRatio;
    var rsiSlope = m.rsiNow - m.rsiPrev;
    var rsiOk = m.rsiNow >= 28 && m.rsiNow <= 45 && rsiSlope <= 0.5;
    var passCount = [trend, compression > thresholds.breakoutCompression, nearBreakdown, volOk, rsiOk].filter(Boolean).length;
    if (passCount < 4)
        return null;
    return {
        setupType: 'breakout',
        side: 'short',
        biasLabel: 'Potential Short',
        setupTags: ['Breakout'],
        riskTag: 'Medium Risk',
        aiExplanation: 'Range is tightening and supply is pressing into local lows.',
        whyThisMatters: 'A clean break lower can accelerate when bids thin under the shelf.',
        breakdown: {
            trendAlignment: trend ? 22 : 14,
            momentumQuality: clamp(Math.round(((50 - m.rsiNow) / 22) * 20), 8, 18),
            structureQuality: clamp(Math.round((compression * 0.6 + (nearBreakdown ? 0.4 : 0.2)) * 25), 10, 22),
            volumeConfirmation: clamp(Math.round(Math.min(volBoost, 2) / 2 * 15), 6, 14),
            riskConditions: 8,
        },
        facts: {
            emaTrend: trend ? 'bearish' : 'neutral',
            volumeRatio: Number(volBoost.toFixed(2)),
            rsi: Number(m.rsiNow.toFixed(1)),
            distanceToBreakoutAtr: Number(distanceToBreakdownAtr.toFixed(2)),
        },
    };
}
/** Bearish mirror of `pullbackContinuationDetector`: downtrend bounce into EMA, fading buying. */
function pullbackContinuationShortDetector(candles, thresholds) {
    if (candles.length < 60)
        return null;
    var m = coreMetrics(candles);
    var trendDown = m.ema20 < m.ema50;
    var nearEma = m.atrNow > 0 && Math.abs(m.close - m.ema20) <= thresholds.pullbackMaxDistAtr * m.atrNow;
    var bounceDepth = m.atrNow > 0 ? (m.close - m.ema20) / m.atrNow : 0;
    var depthOk = bounceDepth >= -0.3 && bounceDepth <= 1.5;
    var rsiOk = m.rsiNow >= 40 && m.rsiNow <= 58 && m.rsiNow <= m.rsiPrev;
    var recent = candles.slice(-8);
    var redVol = recent.filter(function (c) { return c.close < c.open; }).reduce(function (s, c) { return s + c.volume; }, 0);
    var greenVol = recent.filter(function (c) { return c.close >= c.open; }).reduce(function (s, c) { return s + c.volume; }, 0);
    var volCool = greenVol < redVol * 1.05;
    var passCount = [trendDown, nearEma, depthOk, rsiOk, volCool].filter(Boolean).length;
    if (passCount < 4)
        return null;
    return {
        setupType: 'pullback',
        side: 'short',
        biasLabel: 'Potential Short',
        setupTags: ['Pullback'],
        riskTag: 'Low Risk',
        aiExplanation: 'Bounce into the mean is losing participation while the broader trend stays down.',
        whyThisMatters: 'If sellers reassert here, continuation shorts often get cleaner invalidation above the bounce.',
        breakdown: {
            trendAlignment: trendDown ? 21 : 14,
            momentumQuality: clamp(Math.round((1 - Math.abs(48 - m.rsiNow) / 16) * 20), 9, 17),
            structureQuality: clamp(Math.round(((nearEma ? 0.5 : 0.2) + (depthOk ? 0.5 : 0.2)) * 25), 12, 22),
            volumeConfirmation: volCool ? 11 : 8,
            riskConditions: 10,
        },
        facts: {
            emaTrend: trendDown ? 'bearish' : 'neutral',
            volumeRatio: Number((m.volNow / Math.max(1, m.volAvg)).toFixed(2)),
            rsi: Number(m.rsiNow.toFixed(1)),
            pullbackDepthAtr: Number(bounceDepth.toFixed(2)),
        },
    };
}
/** Bearish mirror of `overextendedDetector`: stretched below the mean, oversold heat, near local support. */
function overextendedShortDetector(candles, thresholds) {
    if (candles.length < 60)
        return null;
    var m = coreMetrics(candles);
    var stretch = m.atrNow > 0 ? Math.abs(m.close - m.ema20) / m.atrNow : 0;
    var stretchOk = stretch > thresholds.overextendedStretchAtr;
    var rsiCold = m.rsiNow < 26;
    var c3 = candles.slice(-3);
    var drop3 = c3.length > 0 ? c3[0].open - c3[c3.length - 1].close : 0;
    var expansion = m.atrNow > 0 ? drop3 / m.atrNow : 0;
    var expansionOk = expansion > 1.5;
    var nearSupport = m.atrNow > 0 && m.close - m.swingLow < 0.4 * m.atrNow;
    var passCount = [stretchOk, rsiCold, expansionOk, nearSupport].filter(Boolean).length;
    if (passCount < 3)
        return null;
    return {
        setupType: 'overextended',
        side: 'short',
        biasLabel: 'Overextended',
        setupTags: ['Overextended'],
        riskTag: 'High Risk',
        aiExplanation: 'Price is extended below trend resistance and momentum is washed out.',
        whyThisMatters: 'Late shorts into a flush can face sharp squeezes if mean reversion kicks in.',
        breakdown: {
            trendAlignment: 15,
            momentumQuality: 12,
            structureQuality: 10,
            volumeConfirmation: 8,
            riskConditions: 4,
        },
        facts: {
            emaTrend: m.close < m.ema20 ? 'bearish' : 'neutral',
            volumeRatio: Number((m.volNow / Math.max(1, m.volAvg)).toFixed(2)),
            rsi: Number(m.rsiNow.toFixed(1)),
            extensionAtr: Number(stretch.toFixed(2)),
            distanceToBreakoutAtr: Number(((m.close - m.swingLow) / Math.max(0.000001, m.atrNow)).toFixed(2)),
        },
    };
}
var MARKET_DETECTORS = [
    breakoutPressureDetector,
    breakdownPressureDetector,
    pullbackContinuationDetector,
    pullbackContinuationShortDetector,
    overextendedDetector,
    overextendedShortDetector,
];
function mapRiskTag(score, detectorRisk) {
    if (detectorRisk === 'High Risk')
        return 'High Risk';
    if (score >= 75)
        return 'Low Risk';
    if (score >= 60)
        return 'Medium Risk';
    return 'High Risk';
}
function buildSignalFromMarket(input) {
    var _a, _b, _c, _d, _e;
    var thresholds = thresholdsForRegime((_a = input.regime) !== null && _a !== void 0 ? _a : 'neutral');
    var best = null;
    for (var _i = 0, MARKET_DETECTORS_1 = MARKET_DETECTORS; _i < MARKET_DETECTORS_1.length; _i++) {
        var detector = MARKET_DETECTORS_1[_i];
        var out_1 = detector(input.candles15m, thresholds);
        if (!out_1) {
            (_b = input.onReject) === null || _b === void 0 ? void 0 : _b.call(input, detector.name, 'no_signal');
            continue;
        }
        var setupScore_2 = (0, setupScore_1.calculateSetupScore)(out_1.breakdown);
        if (!best || setupScore_2 > best.setupScore) {
            best = { out: out_1, setupScore: setupScore_2 };
        }
    }
    if (!best)
        return null;
    var out = best.out, setupScore = best.setupScore;
    var _f = (0, timingLifecycle_1.evaluateTimingLifecycle)({
        setupType: out.setupType,
        side: out.side,
        setupScore: setupScore,
        candles: input.candles15m,
        previous: input.previousLifecycle,
    }), lifecycle = _f.lifecycle, diagnostics = _f.diagnostics;
    var signal = {
        id: "live-".concat(input.symbol, "-").concat(Date.now()),
        pair: input.symbol.replace('USDT', ''),
        side: out.side,
        biasLabel: out.biasLabel,
        setupType: out.setupType,
        setupScore: setupScore,
        setupScoreLabel: (0, setupScore_1.getSetupScoreLabel)(setupScore),
        scoreBreakdown: out.breakdown,
        facts: out.facts,
        riskTag: mapRiskTag(setupScore, out.riskTag),
        setupTags: out.setupTags,
        exchange: input.exchange,
        postedAgo: 'Live',
        aiExplanation: out.aiExplanation,
        whyThisMatters: out.whyThisMatters,
        timingState: lifecycle.state,
        timingScore: diagnostics.timingScore,
        entryFreshnessScore: diagnostics.entryFreshnessScore,
        roomToTargetScore: diagnostics.roomToTargetScore,
        actionabilityScore: diagnostics.actionabilityScore,
        triggerType: lifecycle.trigger.triggerType,
        triggerReason: lifecycle.trigger.triggerReason,
        idealEntryPrice: (_c = lifecycle.trigger.idealEntryPrice) !== null && _c !== void 0 ? _c : undefined,
        candlesSinceTrigger: (_d = lifecycle.candlesSinceTrigger) !== null && _d !== void 0 ? _d : undefined,
        candlesSincePeakTiming: (_e = lifecycle.candlesSincePeakTiming) !== null && _e !== void 0 ? _e : undefined,
        penaltyBreakdown: lifecycle.penalties,
        positiveTimingFactors: lifecycle.positiveFactors,
        scannerDiagnosticsNote: 'Timing now follows lifecycle memory (first trigger capture, peak tracking, and freshness decay) instead of a late static snapshot.',
    };
    return { signal: signal, lifecycle: lifecycle };
}
function inferMarketRegime(input) {
    function score(candles) {
        var m = coreMetrics(candles);
        var trend = m.close > m.ema20 && m.ema20 > m.ema50 ? 1 : m.close < m.ema20 && m.ema20 < m.ema50 ? -1 : 0;
        var momentum = m.rsiNow > 56 ? 1 : m.rsiNow < 44 ? -1 : 0;
        return trend + momentum;
    }
    var combined = score(input.btc15m) + score(input.eth15m);
    if (combined >= 3)
        return 'risk_on';
    if (combined <= -3)
        return 'risk_off';
    return 'neutral';
}
