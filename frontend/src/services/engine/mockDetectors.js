"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runBreakoutDetector = runBreakoutDetector;
exports.runReversalDetector = runReversalDetector;
exports.runMomentumDetector = runMomentumDetector;
exports.runTrendPullbackDetector = runTrendPullbackDetector;
var scoring_1 = require("@/services/engine/scoring");
function lastClose(snapshot) {
    var _a;
    var last = snapshot.candles[snapshot.candles.length - 1];
    return (_a = last === null || last === void 0 ? void 0 : last.close) !== null && _a !== void 0 ? _a : snapshot.price;
}
function lastCandle(snapshot) {
    var n = snapshot.candles.length;
    return n > 0 ? snapshot.candles[n - 1] : null;
}
function slugPair(pair) {
    return pair.replace(/\//g, '-').toLowerCase();
}
function buildId(pair, strategy, engine) {
    return "demo-".concat(slugPair(pair), "-").concat(strategy.toLowerCase(), "-").concat(engine.toLowerCase());
}
function freshnessFor(pair, strategy) {
    var h = 0;
    for (var i = 0; i < pair.length; i++)
        h = (h + pair.charCodeAt(i) * (i + 7)) % 997;
    var s = strategy.length * 13;
    return 12 + (h + s) % 180;
}
function requireSnapshot(snapshot) {
    if (snapshot.candles.length < 5)
        return false;
    var _a = snapshot.indicators, ema20 = _a.ema20, ema50 = _a.ema50, rsi = _a.rsi, atr = _a.atr;
    return [ema20, ema50, rsi, atr].every(function (x) { return x != null && Number.isFinite(x); });
}
function recentHigh(candles, bars) {
    var slice = candles.slice(-bars);
    return slice.reduce(function (m, c) { return Math.max(m, c.high); }, 0);
}
/** Lower wick rejection (bullish bias). */
function rejectionCandleLong(c) {
    var body = Math.abs(c.close - c.open);
    var lowerWick = Math.min(c.open, c.close) - c.low;
    return body > 0 && lowerWick >= body * 0.55 && c.close >= c.open;
}
function rejectionCandleShort(c) {
    var body = Math.abs(c.close - c.open);
    var upperWick = c.high - Math.max(c.open, c.close);
    return body > 0 && upperWick >= body * 0.55 && c.close <= c.open;
}
function bodyRangeRatio(c) {
    var range = c.high - c.low;
    if (range <= 0)
        return 0;
    return Math.abs(c.close - c.open) / range;
}
function finishOutput(p) {
    var score = (0, scoring_1.clampScore)(p.scoreRaw);
    var state = (0, scoring_1.getOpportunityStateFromScore)(score, p.hasTrigger);
    if (p.strategyType === 'Reversal') {
        state = (0, scoring_1.capReversalReady)(state, score);
    }
    if (state == null)
        return null;
    var riskLabel = (0, scoring_1.getRiskLabel)({
        score: score,
        strategyType: p.strategyType,
        rsi: p.rsi,
        volumeRatio: p.volumeRatio,
        cleanTrendAlignment: p.cleanTrendAlignment,
        invalidationTight: p.invalidationTight,
    });
    return {
        id: p.id,
        pair: p.pair,
        direction: p.direction,
        strategyType: p.strategyType,
        setupType: p.setupType,
        hasTrigger: p.hasTrigger,
        score: score,
        state: state,
        thesis: p.thesis,
        rationale: p.rationale,
        entryZone: p.entryZone,
        invalidation: p.invalidation,
        targets: p.targets,
        timeframeAlignment: (0, scoring_1.timeframeAlignmentForStrategy)(p.strategyType),
        freshnessSec: p.freshnessSec,
        riskLabel: riskLabel,
        sourceEngine: p.sourceEngine,
    };
}
function runBreakoutDetector(snapshot) {
    if (!requireSnapshot(snapshot))
        return null;
    var indicators = snapshot.indicators, pair = snapshot.pair;
    var ema20 = indicators.ema20;
    var ema50 = indicators.ema50;
    var rsi = indicators.rsi;
    var atr = indicators.atr;
    var vol = indicators.volumeRatio;
    var close = lastClose(snapshot);
    var last = lastCandle(snapshot);
    if (!last)
        return null;
    if (close <= ema20 || ema20 <= ema50)
        return null;
    if (vol < 1.25)
        return null;
    if (rsi < 52 || rsi > 72)
        return null;
    var rh5 = recentHigh(snapshot.candles, 5);
    /** Allow modest wick room so synthetic OHLC still qualifies as “pressing the high”. */
    if (close < rh5 * 0.995)
        return null;
    var s = 50;
    s += 10;
    s += vol >= 1.35 ? 10 : 6;
    s += 8;
    s += 8;
    s += bodyRangeRatio(last) >= 0.35 ? 6 : 3;
    var hasTrigger = close >= rh5 * 0.998 && vol >= 1.35;
    var levels = (0, scoring_1.buildAtrLevels)(pair, close, atr, 'LONG');
    return finishOutput({
        id: buildId(pair, 'Breakout', 'Nova'),
        pair: pair,
        direction: 'LONG',
        strategyType: 'Breakout',
        setupType: 'Range expansion / breakout',
        scoreRaw: s,
        hasTrigger: hasTrigger,
        thesis: 'Volume expansion confirms breakout pressure while trend alignment stays constructive.',
        rationale: 'Price is pressing the recent swing high with participation above baseline — monitor for follow-through without chasing.',
        entryZone: levels.entryZone,
        invalidation: levels.invalidation,
        targets: levels.targets,
        freshnessSec: freshnessFor(pair, 'Breakout'),
        sourceEngine: 'Nova',
        cleanTrendAlignment: ema20 > ema50 && close > ema20,
        invalidationTight: atr > 0 && close - (close - 1.0 * atr) < 2.5 * atr,
        rsi: rsi,
        volumeRatio: vol,
    });
}
function runReversalDetector(snapshot) {
    if (!requireSnapshot(snapshot))
        return null;
    var indicators = snapshot.indicators, pair = snapshot.pair;
    var ema20 = indicators.ema20;
    var ema50 = indicators.ema50;
    var rsi = indicators.rsi;
    var atr = indicators.atr;
    var vol = indicators.volumeRatio;
    var close = lastClose(snapshot);
    var last = lastCandle(snapshot);
    if (!last)
        return null;
    var direction = null;
    if (rsi < 35)
        direction = 'LONG';
    else if (rsi > 65)
        direction = 'SHORT';
    else
        return null;
    if (vol < 1.1)
        return null;
    var extLong = direction === 'LONG' && close < ema20;
    var extShort = direction === 'SHORT' && close > ema20;
    if (!extLong && !extShort)
        return null;
    var reject = direction === 'LONG' ? rejectionCandleLong(last) : rejectionCandleShort(last);
    var deepExtreme = direction === 'LONG' ? rsi < 30 : rsi > 70;
    if (!reject && !deepExtreme)
        return null;
    var s = 48;
    s += rsi < 35 ? 12 + (35 - rsi) * 0.4 : 12 + (rsi - 65) * 0.4;
    s += 10;
    s += 8;
    var extPct = Math.abs(close - ema20) / ema20;
    s += Math.min(8, extPct * 400);
    s += 6;
    var trendAgainst = direction === 'LONG' ? ema20 < ema50 && ema50 < close * 1.002 : ema20 > ema50 && ema50 > close * 0.998;
    if (trendAgainst)
        s -= 12;
    if (vol < 1.15)
        s -= 8;
    var hasTrigger = reject && vol >= 1.25;
    var levels = (0, scoring_1.buildAtrLevels)(pair, close, atr, direction);
    return finishOutput({
        id: buildId(pair, 'Reversal', 'Rio'),
        pair: pair,
        direction: direction,
        strategyType: 'Reversal',
        setupType: direction === 'LONG' ? 'Oversold mean reversion' : 'Overbought mean reversion',
        scoreRaw: s,
        hasTrigger: hasTrigger,
        thesis: direction === 'LONG'
            ? 'Reversal candidate needs confirmation candle before entry — structure is stretched but not confirmed.'
            : 'Stretch above the short-term mean with signs of sell-side rejection; confirmation still matters.',
        rationale: "RSI ".concat(rsi.toFixed(0), " and a rejection-style print argue for a measured fade \u2014 invalidation should stay tight."),
        entryZone: levels.entryZone,
        invalidation: levels.invalidation,
        targets: levels.targets,
        freshnessSec: freshnessFor(pair, 'Reversal'),
        sourceEngine: 'Rio',
        cleanTrendAlignment: false,
        invalidationTight: atr > 0,
        rsi: rsi,
        volumeRatio: vol,
    });
}
function runMomentumDetector(snapshot) {
    if (!requireSnapshot(snapshot))
        return null;
    var indicators = snapshot.indicators, pair = snapshot.pair;
    var ema20 = indicators.ema20;
    var ema50 = indicators.ema50;
    var rsi = indicators.rsi;
    var atr = indicators.atr;
    var vol = indicators.volumeRatio;
    var close = lastClose(snapshot);
    var last = lastCandle(snapshot);
    if (!last)
        return null;
    var direction = null;
    if (close > ema20 && ema20 > ema50)
        direction = 'LONG';
    else if (close < ema20 && ema20 < ema50)
        direction = 'SHORT';
    else
        return null;
    if (vol < 1.2)
        return null;
    if (direction === 'LONG' && (rsi < 55 || rsi > 70))
        return null;
    if (direction === 'SHORT' && (rsi < 30 || rsi > 45))
        return null;
    var continuation = direction === 'LONG' ? close >= last.open && close >= (last.high + last.low) / 2 : close <= last.open && close <= (last.high + last.low) / 2;
    if (!continuation)
        return null;
    var s = 52;
    s += 12;
    s += 8;
    s += 8;
    s += 8;
    s += bodyRangeRatio(last) >= 0.25 ? 6 : 2;
    var overheated = direction === 'LONG' ? rsi > 72 : rsi < 28;
    if (overheated)
        s -= 10;
    var extended = direction === 'LONG'
        ? (close - ema20) / ema20 > 0.025
        : (ema20 - close) / ema20 > 0.025;
    if (extended)
        s -= 8;
    if (vol < 1.15)
        s -= 10;
    var hasTrigger = continuation && vol >= 1.35 && !extended;
    var levels = (0, scoring_1.buildAtrLevels)(pair, close, atr, direction);
    return finishOutput({
        id: buildId(pair, 'Momentum', 'Pulse'),
        pair: pair,
        direction: direction,
        strategyType: 'Momentum',
        setupType: direction === 'LONG' ? 'Trend impulse (long)' : 'Trend impulse (short)',
        scoreRaw: s,
        hasTrigger: hasTrigger,
        thesis: direction === 'LONG'
            ? 'Trend remains intact while participation supports the directional push.'
            : 'Downward stack holds with sellers still leaning on intraday structure.',
        rationale: 'EMA stack and momentum band line up — continuation quality matters more than chasing the last tick.',
        entryZone: levels.entryZone,
        invalidation: levels.invalidation,
        targets: levels.targets,
        freshnessSec: freshnessFor(pair, 'Momentum'),
        sourceEngine: 'Pulse',
        cleanTrendAlignment: true,
        invalidationTight: atr > 0,
        rsi: rsi,
        volumeRatio: vol,
    });
}
function runTrendPullbackDetector(snapshot) {
    if (!requireSnapshot(snapshot))
        return null;
    var indicators = snapshot.indicators, pair = snapshot.pair;
    var ema20 = indicators.ema20;
    var ema50 = indicators.ema50;
    var rsi = indicators.rsi;
    var atr = indicators.atr;
    var vol = indicators.volumeRatio;
    var close = lastClose(snapshot);
    var last = lastCandle(snapshot);
    if (!last)
        return null;
    var dist = Math.abs(close - ema20) / ema20;
    if (dist > 0.012)
        return null;
    var direction = null;
    if (ema20 > ema50 && close > ema50 && rsi >= 38 && rsi <= 58)
        direction = 'LONG';
    else if (ema20 < ema50 && close < ema50 && rsi >= 42 && rsi <= 62)
        direction = 'SHORT';
    else
        return null;
    var trendIntact = direction === 'LONG' ? ema20 > ema50 * 1.002 : ema20 < ema50 * 0.998;
    if (!trendIntact)
        return null;
    var invLevel = direction === 'LONG' ? ema50 - 0.35 * atr : ema50 + 0.35 * atr;
    var t1 = direction === 'LONG' ? close + 1.2 * atr : close - 1.2 * atr;
    var risk = Math.abs(close - invLevel);
    var reward = Math.abs(t1 - close);
    var rrOk = risk > 0 && reward / risk >= 0.9;
    var s = 50;
    s += 12;
    s += dist < 0.008 ? 10 : 6;
    s += 8;
    s += rrOk ? 8 : 2;
    s += 6;
    if (dist > 0.01)
        s -= 10;
    if (direction === 'LONG' && (rsi < 35 || rsi > 62))
        s -= 8;
    if (direction === 'SHORT' && (rsi < 40 || rsi > 65))
        s -= 8;
    if (!rrOk)
        s -= 8;
    var hasTrigger = dist < 0.007 && rrOk && vol >= 1.15;
    var levels = (0, scoring_1.buildAtrLevels)(pair, close, atr, direction);
    return finishOutput({
        id: buildId(pair, 'TrendPullback', 'Guard'),
        pair: pair,
        direction: direction,
        strategyType: 'TrendPullback',
        setupType: 'Trend pullback',
        scoreRaw: s,
        hasTrigger: hasTrigger,
        thesis: direction === 'LONG'
            ? 'Trend remains intact while price resets near EMA20 — RSI is cooling without breaking the broader trend.'
            : 'Down trend holds as price revisits the mean — watch for a clean rollover rather than forcing size.',
        rationale: 'Pullback depth is shallow versus structure; invalidation is defined so risk stays explicit if the trend fails.',
        entryZone: levels.entryZone,
        invalidation: levels.invalidation,
        targets: levels.targets,
        freshnessSec: freshnessFor(pair, 'TrendPullback'),
        sourceEngine: 'Guard',
        cleanTrendAlignment: trendIntact,
        invalidationTight: rrOk && atr > 0,
        rsi: rsi,
        volumeRatio: vol,
    });
}
