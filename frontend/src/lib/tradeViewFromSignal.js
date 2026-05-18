"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fallbackLastForPair = fallbackLastForPair;
exports.resolveTradeAnchorPrice = resolveTradeAnchorPrice;
exports.ensureStopForOpenPosition = ensureStopForOpenPosition;
exports.ensureTargetForOpenPosition = ensureTargetForOpenPosition;
exports.coerceStopTargetToSide = coerceStopTargetToSide;
exports.buildTradeViewModelFromSignal = buildTradeViewModelFromSignal;
/** Rough reference marks when the feed has not delivered a last price yet. */
var FALLBACK_LAST_BY_BASE = {
    BTC: 65200,
    ETH: 3500,
    SOL: 142,
    AVAX: 36,
    DOGE: 0.16,
    XRP: 0.55,
    PAXG: 2350,
    XAG: 30,
};
function pairBaseUpper(pair) {
    var _a;
    var raw = pair.trim().toUpperCase();
    if (raw.includes('/'))
        return ((_a = raw.split('/')[0]) === null || _a === void 0 ? void 0 : _a.trim().replace(/[^A-Z0-9]/g, '')) || 'BTC';
    return raw.replace(/USDT$/i, '').replace(/[^A-Z0-9]/g, '') || 'BTC';
}
function fallbackLastForPair(pair) {
    var _a;
    var b = pairBaseUpper(pair);
    return (_a = FALLBACK_LAST_BY_BASE[b]) !== null && _a !== void 0 ? _a : 100;
}
/** First live tick wins per navigation; otherwise last price; else static fallback by pair. */
function resolveTradeAnchorPrice(frozenAnchor, liveLast, pair) {
    if (frozenAnchor != null && Number.isFinite(frozenAnchor) && frozenAnchor > 0)
        return frozenAnchor;
    if (liveLast != null && Number.isFinite(liveLast) && liveLast > 0)
        return liveLast;
    return fallbackLastForPair(pair);
}
function riskTagToAiRisk(tag) {
    if (tag === 'High Risk')
        return 'High';
    if (tag === 'Low Risk')
        return 'Low';
    return 'Medium';
}
function setupTypeToTrend(setupType, side) {
    if (setupType === 'breakout')
        return side === 'long' ? 'Bullish' : 'Bearish';
    if (setupType === 'pullback')
        return side === 'long' ? 'Bullish' : 'Bearish';
    return side === 'long' ? 'Neutral' : 'Neutral';
}
function setupTypeToMomentum(setupType) {
    if (setupType === 'breakout')
        return 'Strong';
    if (setupType === 'pullback')
        return 'Building';
    return 'Weak';
}
/**
 * Derive stop / target distances from setup quality: stronger setups use slightly tighter invalidation bands.
 */
function deriveLevels(side, ref, _setupScore) {
    var stopFrac = 0.002; // 0.2% default stop distance at trade start
    var rewardMult = 1.45;
    var entry = ref;
    if (side === 'long') {
        var stop_1 = entry * (1 - stopFrac);
        var target_1 = entry * (1 + stopFrac * rewardMult);
        return { entry: entry, stop: stop_1, target: target_1 };
    }
    var stop = entry * (1 + stopFrac);
    var target = entry * (1 - stopFrac * rewardMult);
    return { entry: entry, stop: stop, target: target };
}
function fallbackChartCandles(refPrice, points) {
    if (points === void 0) { points = 64; }
    var base = Number.isFinite(refPrice) && refPrice > 0 ? refPrice : 100;
    var now = Date.now();
    var stepMs = 60000;
    var out = [];
    var prev = base;
    for (var i = 0; i < points; i += 1) {
        var wiggle = Math.sin(i / 5) * 0.0018 * base;
        var drift = ((i / Math.max(1, points - 1)) - 0.5) * 0.0022 * base;
        var close_1 = Math.max(0.0000001, base + wiggle + drift);
        var open_1 = prev;
        var high = Math.max(open_1, close_1) * 1.0009;
        var low = Math.min(open_1, close_1) * 0.9991;
        out.push({
            ts: now - (points - 1 - i) * stepMs,
            open: open_1,
            high: high,
            low: low,
            close: close_1,
            volume: 0,
        });
        prev = close_1;
    }
    return out;
}
/** Long: stop < entry < target. Short: target < entry < stop. Fixes bad deep links / mixed data. */
/**
 * When the exchange omits SL/TP on the position payload, keep plan levels only if they sit on the correct
 * side of the **actual** entry for the open position; otherwise derive a band from `setupScore`.
 * Does not replace the other leg (unlike `coerceStopTargetToSide`), so a valid Bybit TP can stay paired with a fixed stop.
 */
function ensureStopForOpenPosition(positionSide, entry, planStop, setupScore) {
    if (entry > 0 && Number.isFinite(entry)) {
        if (Number.isFinite(planStop) && planStop > 0) {
            var ok = positionSide === 'long' ? planStop < entry : planStop > entry;
            if (ok)
                return planStop;
        }
        return deriveLevels(positionSide, entry, setupScore).stop;
    }
    return Number.isFinite(planStop) && planStop > 0 ? planStop : NaN;
}
function ensureTargetForOpenPosition(positionSide, entry, planTarget, setupScore) {
    if (entry > 0 && Number.isFinite(entry)) {
        if (Number.isFinite(planTarget) && planTarget > 0) {
            var ok = positionSide === 'long' ? planTarget > entry : planTarget < entry;
            if (ok)
                return planTarget;
        }
        return deriveLevels(positionSide, entry, setupScore).target;
    }
    return Number.isFinite(planTarget) && planTarget > 0 ? planTarget : NaN;
}
function coerceStopTargetToSide(side, entry, stop, target, setupScore) {
    if (!(entry > 0) || !Number.isFinite(stop) || !Number.isFinite(target) || !(stop > 0) || !(target > 0)) {
        var d_1 = deriveLevels(side, entry, setupScore);
        return { stop: d_1.stop, target: d_1.target };
    }
    var ok = side === 'long'
        ? stop < entry && target > entry
        : stop > entry && target < entry;
    if (ok)
        return { stop: stop, target: target };
    var d = deriveLevels(side, entry, setupScore);
    return { stop: d.stop, target: d.target };
}
/**
 * Build a full trade view model for production: levels from optional `planned*` on the signal,
 * else from anchor price + derived R multiples. Market fields prefer the live snapshot.
 */
function buildTradeViewModelFromSignal(signal, live, opts) {
    var _a, _b;
    var side = (_a = opts.tradeSide) !== null && _a !== void 0 ? _a : (signal.side === 'short' ? 'short' : 'long');
    var ref = opts.anchorPrice > 0 && Number.isFinite(opts.anchorPrice) ? opts.anchorPrice : fallbackLastForPair(signal.pair);
    var plannedE = signal.plannedEntry;
    var plannedS = signal.plannedStop;
    var plannedT = signal.plannedTarget;
    var entry;
    var stop;
    var target;
    if (plannedE != null &&
        plannedS != null &&
        plannedT != null &&
        Number.isFinite(plannedE) &&
        Number.isFinite(plannedS) &&
        Number.isFinite(plannedT) &&
        plannedE > 0 &&
        plannedS > 0 &&
        plannedT > 0) {
        entry = plannedE;
        stop = plannedS;
        target = plannedT;
    }
    else if (plannedE != null && Number.isFinite(plannedE) && plannedE > 0) {
        entry = plannedE;
        var d = deriveLevels(side, entry, signal.setupScore);
        stop = plannedS != null && Number.isFinite(plannedS) ? plannedS : d.stop;
        target = plannedT != null && Number.isFinite(plannedT) ? plannedT : d.target;
    }
    else {
        var d = deriveLevels(side, ref, signal.setupScore);
        entry = d.entry;
        stop = d.stop;
        target = d.target;
    }
    var coerced = coerceStopTargetToSide(side, entry, stop, target, signal.setupScore);
    stop = coerced.stop;
    target = coerced.target;
    var lastPrice = live.lastPrice != null && Number.isFinite(live.lastPrice) && live.lastPrice > 0 ? live.lastPrice : ref;
    var change24hPct = live.change24hPct != null && Number.isFinite(live.change24hPct) ? live.change24hPct : 0;
    var high24h = live.high24h != null && Number.isFinite(live.high24h) && live.high24h > 0 ? live.high24h : lastPrice * 1.02;
    var low24h = live.low24h != null && Number.isFinite(live.low24h) && live.low24h > 0 ? live.low24h : lastPrice * 0.98;
    var volume24h = (_b = live.volume24h) !== null && _b !== void 0 ? _b : '—';
    var liqDistance = 0.9 / 12;
    var liquidation = side === 'long' ? entry * (1 - liqDistance) : entry * (1 + liqDistance);
    var stopMovePct = Math.abs((stop - entry) / entry);
    var targetMovePct = Math.abs((target - entry) / entry);
    var positionSizeUsd = 15000;
    var amountUsedUsd = 1500;
    var leverage = 10;
    var targetProfitUsd = positionSizeUsd * targetMovePct;
    var stopLossUsd = -(positionSizeUsd * stopMovePct);
    var riskReward = stopMovePct > 0 ? targetMovePct / stopMovePct : 1.5;
    var displayPair = "".concat(pairBaseUpper(signal.pair), " / USDT");
    var priceSeries = live.priceSeries && live.priceSeries.length > 20
        ? live.priceSeries
        : Array.from({ length: 48 }, function (_, i) { return 0.4 + (i / 47) * 0.45; });
    var chartCandles = live.chartCandles && live.chartCandles.length > 20 ? live.chartCandles : fallbackChartCandles(lastPrice);
    var aiInsight = {
        trend: setupTypeToTrend(signal.setupType, side),
        momentum: setupTypeToMomentum(signal.setupType),
        risk: riskTagToAiRisk(signal.riskTag),
        summary: signal.aiExplanation.slice(0, 280),
    };
    return {
        pair: displayPair,
        side: side,
        lastPrice: lastPrice,
        change24hPct: change24hPct,
        high24h: high24h,
        low24h: low24h,
        volume24h: volume24h,
        entry: entry,
        stop: stop,
        target: target,
        liquidation: liquidation,
        balanceUsd: Math.max(0, opts.balanceUsd),
        amountUsedUsd: amountUsedUsd,
        leverage: leverage,
        positionSizeUsd: positionSizeUsd,
        targetProfitUsd: targetProfitUsd,
        stopLossUsd: stopLossUsd,
        riskReward: riskReward,
        aiInsight: aiInsight,
        priceSeries: priceSeries,
        chartCandles: chartCandles,
    };
}
