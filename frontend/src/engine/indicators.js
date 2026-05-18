"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ema = ema;
exports.rsi = rsi;
exports.atr = atr;
exports.rollingAvg = rollingAvg;
exports.deriveIndicatorSnapshot = deriveIndicatorSnapshot;
function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
}
function ema(values, period) {
    if (values.length === 0)
        return [];
    var k = 2 / (period + 1);
    var out = [values[0]];
    for (var i = 1; i < values.length; i += 1)
        out.push(values[i] * k + out[i - 1] * (1 - k));
    return out;
}
function rsi(values, period) {
    if (values.length <= period)
        return values.map(function () { return 50; });
    var out = values.map(function () { return 50; });
    var gain = 0;
    var loss = 0;
    for (var i = 1; i <= period; i += 1) {
        var d = values[i] - values[i - 1];
        if (d >= 0)
            gain += d;
        else
            loss += -d;
    }
    var avgGain = gain / period;
    var avgLoss = loss / period;
    out[period] = avgLoss === 0 ? (avgGain === 0 ? 50 : 100) : 100 - 100 / (1 + avgGain / avgLoss);
    for (var i = period + 1; i < values.length; i += 1) {
        var d = values[i] - values[i - 1];
        var up = d > 0 ? d : 0;
        var dn = d < 0 ? -d : 0;
        avgGain = (avgGain * (period - 1) + up) / period;
        avgLoss = (avgLoss * (period - 1) + dn) / period;
        out[i] = avgLoss === 0 ? (avgGain === 0 ? 50 : 100) : 100 - 100 / (1 + avgGain / avgLoss);
    }
    return out;
}
function atr(candles, period) {
    if (candles.length === 0)
        return [];
    var tr = [candles[0].high - candles[0].low];
    for (var i = 1; i < candles.length; i += 1) {
        var c = candles[i];
        var p = candles[i - 1];
        var v = Math.max(c.high - c.low, Math.abs(c.high - p.close), Math.abs(c.low - p.close));
        tr.push(v);
    }
    return ema(tr, period);
}
function rollingAvg(values, period) {
    if (values.length === 0)
        return [];
    var out = [];
    var sum = 0;
    for (var i = 0; i < values.length; i += 1) {
        sum += values[i];
        if (i >= period)
            sum -= values[i - period];
        out.push(i < period - 1 ? sum / (i + 1) : sum / period);
    }
    return out;
}
function recentSwingHigh(candles, lookback) {
    var _a, _b;
    var s = candles.slice(-lookback);
    return s.reduce(function (m, c) { return Math.max(m, c.high); }, (_b = (_a = s[0]) === null || _a === void 0 ? void 0 : _a.high) !== null && _b !== void 0 ? _b : 0);
}
function recentSwingLow(candles, lookback) {
    var _a, _b;
    var s = candles.slice(-lookback);
    return s.reduce(function (m, c) { return Math.min(m, c.low); }, (_b = (_a = s[0]) === null || _a === void 0 ? void 0 : _a.low) !== null && _b !== void 0 ? _b : 0);
}
function deriveIndicatorSnapshot(candles) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    var closes = candles.map(function (c) { return c.close; });
    var vols = candles.map(function (c) { return c.volume; });
    var ema20 = ema(closes, 20);
    var ema50 = ema(closes, 50);
    var rsi14 = rsi(closes, 14);
    var atr14 = atr(candles, 14);
    var vol20 = rollingAvg(vols, 20);
    var close = (_a = closes.at(-1)) !== null && _a !== void 0 ? _a : 0;
    var lastEma20 = (_b = ema20.at(-1)) !== null && _b !== void 0 ? _b : close;
    var lastEma50 = (_c = ema50.at(-1)) !== null && _c !== void 0 ? _c : close;
    var lastAtr = Math.max((_d = atr14.at(-1)) !== null && _d !== void 0 ? _d : 0, 0.000001);
    var swingHigh = recentSwingHigh(candles, 40);
    var swingLow = recentSwingLow(candles, 40);
    return {
        ema20: lastEma20,
        ema50: lastEma50,
        ema20Slope: lastEma20 - ((_e = ema20.at(-2)) !== null && _e !== void 0 ? _e : lastEma20),
        ema50Slope: lastEma50 - ((_f = ema50.at(-2)) !== null && _f !== void 0 ? _f : lastEma50),
        rsi14: (_g = rsi14.at(-1)) !== null && _g !== void 0 ? _g : 50,
        rsi14Slope: ((_h = rsi14.at(-1)) !== null && _h !== void 0 ? _h : 50) - ((_j = rsi14.at(-2)) !== null && _j !== void 0 ? _j : 50),
        atr14: lastAtr,
        avgVolume20: (_k = vol20.at(-1)) !== null && _k !== void 0 ? _k : 0,
        localSwingHigh: swingHigh,
        localSwingLow: swingLow,
        breakoutDistanceAtr: clamp((swingHigh - close) / lastAtr, -10, 10),
        breakdownDistanceAtr: clamp((close - swingLow) / lastAtr, -10, 10),
        pullbackDepthAtr: clamp((lastEma20 - close) / lastAtr, -10, 10),
        bounceDepthAtr: clamp((close - lastEma20) / lastAtr, -10, 10),
    };
}
