"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ema = ema;
exports.rsi = rsi;
exports.atr = atr;
exports.rollingAvg = rollingAvg;
exports.recentSwingHigh = recentSwingHigh;
exports.recentSwingLow = recentSwingLow;
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
    var s = candles.slice(-lookback);
    if (s.length === 0)
        return 0;
    return s.reduce(function (m, c) { return Math.max(m, c.high); }, s[0].high);
}
function recentSwingLow(candles, lookback) {
    var s = candles.slice(-lookback);
    if (s.length === 0)
        return 0;
    return s.reduce(function (m, c) { return Math.min(m, c.low); }, s[0].low);
}
