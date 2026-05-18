"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pickBestDirectionalPair = pickBestDirectionalPair;
exports.detectBreakoutPressure = detectBreakoutPressure;
exports.detectPullbackContinuation = detectPullbackContinuation;
exports.detectOverextendedWarning = detectOverextendedWarning;
exports.detectBreakdownPressure = detectBreakdownPressure;
exports.detectPullbackContinuationShort = detectPullbackContinuationShort;
exports.detectOverextendedShort = detectOverextendedShort;
var setupScore_1 = require("@/lib/setupScore");
function bestCandidate(a, b) {
    if (!a)
        return b;
    if (!b)
        return a;
    return a.setupScore >= b.setupScore ? a : b;
}
function pickBestDirectionalPair(longCandidate, shortCandidate) {
    return bestCandidate(longCandidate, shortCandidate);
}
function trendLabel(ema20, ema50) {
    if (ema20 > ema50)
        return 'bullish';
    if (ema20 < ema50)
        return 'bearish';
    return 'neutral';
}
function volumeRatio(lastVolume, avgVolume20) {
    return avgVolume20 <= 0 ? 0 : lastVolume / avgVolume20;
}
function detectBreakoutPressure(input) {
    if (input.candles.length < 60 || !input.lastCandleClosed)
        return null;
    var last = input.candles.at(-1);
    if (!last)
        return null;
    var indicators = input.indicators;
    var volRatio = volumeRatio(last.volume, indicators.avgVolume20);
    var bullishTrend = indicators.ema20 > indicators.ema50 && indicators.ema20Slope > 0;
    var nearBreakout = indicators.breakoutDistanceAtr <= 0.45;
    var rsiHealthy = indicators.rsi14 >= 55 && indicators.rsi14 <= 72;
    var momentumPositive = indicators.rsi14Slope >= -0.5;
    var passes = [bullishTrend, nearBreakout, rsiHealthy, momentumPositive, volRatio >= 1.15].filter(Boolean).length;
    if (passes < 4)
        return null;
    var scoreBreakdown = {
        trendAlignment: bullishTrend ? 23 : 12,
        momentumQuality: rsiHealthy ? 16 : 10,
        structureQuality: nearBreakout ? 21 : 12,
        volumeConfirmation: volRatio >= 1.25 ? 14 : 10,
        riskConditions: indicators.breakoutDistanceAtr <= 0.25 ? 13 : 10,
    };
    return {
        symbol: input.symbol,
        setupType: 'breakout',
        directionBias: 'long',
        biasLabel: 'Breakout pressure building',
        tags: ['Breakout'],
        scoreBreakdown: scoreBreakdown,
        setupScore: (0, setupScore_1.calculateSetupScore)(scoreBreakdown),
        explanationFacts: {
            emaTrend: trendLabel(indicators.ema20, indicators.ema50),
            rsi: indicators.rsi14,
            rsiSlope: indicators.rsi14Slope,
            volumeRatio: volRatio,
            breakoutDistanceAtr: indicators.breakoutDistanceAtr,
            pullbackDepthAtr: indicators.pullbackDepthAtr,
            extensionAtr: Math.abs((last.close - indicators.ema20) / indicators.atr14),
        },
        confirmedOnClosedCandle: true,
        timestamp: last.ts,
    };
}
function detectPullbackContinuation(input) {
    if (input.candles.length < 60 || !input.lastCandleClosed)
        return null;
    var last = input.candles.at(-1);
    if (!last)
        return null;
    var indicators = input.indicators;
    var volRatio = volumeRatio(last.volume, indicators.avgVolume20);
    var trendUp = indicators.ema20 > indicators.ema50;
    var inPullbackZone = indicators.pullbackDepthAtr >= -0.2 && indicators.pullbackDepthAtr <= 1.5;
    var momentumRecovering = indicators.rsi14 >= 45 && indicators.rsi14 <= 62 && indicators.rsi14Slope > 0;
    var pullbackVolumeCooled = volRatio <= 1.05;
    var passes = [trendUp, inPullbackZone, momentumRecovering, pullbackVolumeCooled].filter(Boolean).length;
    if (passes < 3)
        return null;
    var scoreBreakdown = {
        trendAlignment: trendUp ? 22 : 10,
        momentumQuality: momentumRecovering ? 15 : 9,
        structureQuality: inPullbackZone ? 22 : 12,
        volumeConfirmation: pullbackVolumeCooled ? 12 : 7,
        riskConditions: indicators.pullbackDepthAtr <= 1.1 ? 12 : 8,
    };
    return {
        symbol: input.symbol,
        setupType: 'pullback',
        directionBias: 'long',
        biasLabel: 'Pullback continuation setup',
        tags: ['Pullback'],
        scoreBreakdown: scoreBreakdown,
        setupScore: (0, setupScore_1.calculateSetupScore)(scoreBreakdown),
        explanationFacts: {
            emaTrend: trendLabel(indicators.ema20, indicators.ema50),
            rsi: indicators.rsi14,
            rsiSlope: indicators.rsi14Slope,
            volumeRatio: volRatio,
            breakoutDistanceAtr: indicators.breakoutDistanceAtr,
            pullbackDepthAtr: indicators.pullbackDepthAtr,
            extensionAtr: Math.abs((last.close - indicators.ema20) / indicators.atr14),
        },
        confirmedOnClosedCandle: true,
        timestamp: last.ts,
    };
}
function detectOverextendedWarning(input) {
    if (input.candles.length < 60 || !input.lastCandleClosed)
        return null;
    var last = input.candles.at(-1);
    if (!last)
        return null;
    var indicators = input.indicators;
    var extensionAtr = Math.abs((last.close - indicators.ema20) / indicators.atr14);
    var volRatio = volumeRatio(last.volume, indicators.avgVolume20);
    var overextended = extensionAtr >= 1.8;
    var hotRsi = indicators.rsi14 >= 74;
    var nearResistance = indicators.breakoutDistanceAtr <= 0.4;
    var passes = [overextended, hotRsi, nearResistance || volRatio > 1.4].filter(Boolean).length;
    if (passes < 2)
        return null;
    var scoreBreakdown = {
        trendAlignment: 8,
        momentumQuality: hotRsi ? 5 : 8,
        structureQuality: nearResistance ? 7 : 10,
        volumeConfirmation: volRatio > 1.2 ? 7 : 10,
        riskConditions: 2,
    };
    return {
        symbol: input.symbol,
        setupType: 'overextended',
        directionBias: 'long',
        biasLabel: 'Overextended long — late chase risk',
        tags: ['Overextended'],
        scoreBreakdown: scoreBreakdown,
        setupScore: (0, setupScore_1.calculateSetupScore)(scoreBreakdown),
        explanationFacts: {
            emaTrend: trendLabel(indicators.ema20, indicators.ema50),
            rsi: indicators.rsi14,
            rsiSlope: indicators.rsi14Slope,
            volumeRatio: volRatio,
            breakoutDistanceAtr: indicators.breakoutDistanceAtr,
            pullbackDepthAtr: indicators.pullbackDepthAtr,
            extensionAtr: extensionAtr,
        },
        confirmedOnClosedCandle: true,
        timestamp: last.ts,
    };
}
function detectBreakdownPressure(input) {
    if (input.candles.length < 60 || !input.lastCandleClosed)
        return null;
    var last = input.candles.at(-1);
    if (!last)
        return null;
    var indicators = input.indicators;
    var volRatio = volumeRatio(last.volume, indicators.avgVolume20);
    var bearishTrend = indicators.ema20 < indicators.ema50 && indicators.ema20Slope < 0;
    var nearBreakdown = indicators.breakdownDistanceAtr >= 0 && indicators.breakdownDistanceAtr <= 0.45;
    var rsiWeak = indicators.rsi14 >= 28 && indicators.rsi14 <= 45;
    var momentumNegative = indicators.rsi14Slope <= 0;
    var passes = [bearishTrend, nearBreakdown, rsiWeak, momentumNegative, volRatio >= 1.15].filter(Boolean).length;
    if (passes < 4)
        return null;
    var scoreBreakdown = {
        trendAlignment: bearishTrend ? 23 : 12,
        momentumQuality: rsiWeak ? 16 : 10,
        structureQuality: nearBreakdown ? 21 : 12,
        volumeConfirmation: volRatio >= 1.25 ? 14 : 10,
        riskConditions: indicators.breakdownDistanceAtr <= 0.25 ? 13 : 10,
    };
    return {
        symbol: input.symbol,
        setupType: 'breakout',
        directionBias: 'short',
        biasLabel: 'Breakdown pressure building',
        tags: ['Breakout'],
        scoreBreakdown: scoreBreakdown,
        setupScore: (0, setupScore_1.calculateSetupScore)(scoreBreakdown),
        explanationFacts: {
            emaTrend: trendLabel(indicators.ema20, indicators.ema50),
            rsi: indicators.rsi14,
            rsiSlope: indicators.rsi14Slope,
            volumeRatio: volRatio,
            breakoutDistanceAtr: indicators.breakdownDistanceAtr,
            pullbackDepthAtr: indicators.bounceDepthAtr,
            extensionAtr: Math.abs((last.close - indicators.ema20) / indicators.atr14),
        },
        confirmedOnClosedCandle: true,
        timestamp: last.ts,
    };
}
function detectPullbackContinuationShort(input) {
    if (input.candles.length < 60 || !input.lastCandleClosed)
        return null;
    var last = input.candles.at(-1);
    if (!last)
        return null;
    var indicators = input.indicators;
    var volRatio = volumeRatio(last.volume, indicators.avgVolume20);
    var trendDown = indicators.ema20 < indicators.ema50;
    var inBounceZone = indicators.bounceDepthAtr >= -0.3 && indicators.bounceDepthAtr <= 1.5;
    var momentumFading = indicators.rsi14 >= 40 && indicators.rsi14 <= 58 && indicators.rsi14Slope <= 0;
    var bounceVolumeCooled = volRatio <= 1.05;
    var passes = [trendDown, inBounceZone, momentumFading, bounceVolumeCooled].filter(Boolean).length;
    if (passes < 3)
        return null;
    var scoreBreakdown = {
        trendAlignment: trendDown ? 22 : 10,
        momentumQuality: momentumFading ? 15 : 9,
        structureQuality: inBounceZone ? 22 : 12,
        volumeConfirmation: bounceVolumeCooled ? 12 : 7,
        riskConditions: indicators.bounceDepthAtr <= 1.1 ? 12 : 8,
    };
    return {
        symbol: input.symbol,
        setupType: 'pullback',
        directionBias: 'short',
        biasLabel: 'Pullback short — bounce fading',
        tags: ['Pullback'],
        scoreBreakdown: scoreBreakdown,
        setupScore: (0, setupScore_1.calculateSetupScore)(scoreBreakdown),
        explanationFacts: {
            emaTrend: trendLabel(indicators.ema20, indicators.ema50),
            rsi: indicators.rsi14,
            rsiSlope: indicators.rsi14Slope,
            volumeRatio: volRatio,
            breakoutDistanceAtr: indicators.breakdownDistanceAtr,
            pullbackDepthAtr: indicators.bounceDepthAtr,
            extensionAtr: Math.abs((last.close - indicators.ema20) / indicators.atr14),
        },
        confirmedOnClosedCandle: true,
        timestamp: last.ts,
    };
}
function detectOverextendedShort(input) {
    if (input.candles.length < 60 || !input.lastCandleClosed)
        return null;
    var last = input.candles.at(-1);
    if (!last)
        return null;
    var indicators = input.indicators;
    var extensionAtr = Math.abs((last.close - indicators.ema20) / indicators.atr14);
    var volRatio = volumeRatio(last.volume, indicators.avgVolume20);
    var belowMean = last.close < indicators.ema20;
    var overextended = extensionAtr >= 1.8 && belowMean;
    var coldRsi = indicators.rsi14 < 26;
    var nearSupport = indicators.breakdownDistanceAtr <= 0.4;
    var c3 = input.candles.slice(-3);
    var drop3 = c3.length >= 3 ? c3[0].open - c3[2].close : 0;
    var expansionOk = indicators.atr14 > 0 && drop3 / indicators.atr14 > 1.5;
    var passes = [overextended, coldRsi, nearSupport || volRatio > 1.4, expansionOk].filter(Boolean).length;
    if (passes < 3)
        return null;
    var scoreBreakdown = {
        trendAlignment: 8,
        momentumQuality: coldRsi ? 5 : 8,
        structureQuality: nearSupport ? 7 : 10,
        volumeConfirmation: volRatio > 1.2 ? 7 : 10,
        riskConditions: 2,
    };
    return {
        symbol: input.symbol,
        setupType: 'overextended',
        directionBias: 'short',
        biasLabel: 'Overextended short — squeeze risk',
        tags: ['Overextended'],
        scoreBreakdown: scoreBreakdown,
        setupScore: (0, setupScore_1.calculateSetupScore)(scoreBreakdown),
        explanationFacts: {
            emaTrend: trendLabel(indicators.ema20, indicators.ema50),
            rsi: indicators.rsi14,
            rsiSlope: indicators.rsi14Slope,
            volumeRatio: volRatio,
            breakoutDistanceAtr: indicators.breakdownDistanceAtr,
            pullbackDepthAtr: indicators.pullbackDepthAtr,
            extensionAtr: extensionAtr,
        },
        confirmedOnClosedCandle: true,
        timestamp: last.ts,
    };
}
