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
exports.buildScannerLabFixtureInput = buildScannerLabFixtureInput;
var types_1 = require("@/engine/types");
function mkTs(minutesAgo) {
    return Date.now() - minutesAgo * 60000;
}
function makeCandle(ts, open, close, spread, volume) {
    var high = Math.max(open, close) + spread;
    var low = Math.min(open, close) - spread;
    return { ts: ts, open: open, high: high, low: low, close: close, volume: volume, isClosed: true };
}
function buildTrendSeries(basePrice, drift, volatility, volumeBase, volumeSpikeEvery) {
    if (volumeSpikeEvery === void 0) { volumeSpikeEvery = 0; }
    var candles = [];
    var price = basePrice;
    for (var i = 120; i >= 1; i -= 1) {
        var ts = mkTs(i * 15);
        var wobble = Math.sin(i / 5) * volatility;
        var move = drift + wobble;
        var open_1 = price;
        var close_1 = Math.max(0.0001, open_1 + move);
        var spread = Math.max(0.0001, Math.abs(move) * 0.4 + volatility * 0.6);
        var spike = volumeSpikeEvery > 0 && i % volumeSpikeEvery === 0 ? 1.35 : 1;
        var volume = volumeBase * (0.92 + (i % 7) * 0.02) * spike;
        candles.push(makeCandle(ts, open_1, close_1, spread, volume));
        price = close_1;
    }
    return candles;
}
function compressTo5m(candles15m) {
    // Derive 5m timestamps from 15m bars for fixture parity tests.
    return candles15m.map(function (c) { return (__assign(__assign({}, c), { ts: c.ts - 10 * 60000 })); });
}
function compressTo1m(candles15m) {
    return candles15m.map(function (c) { return (__assign(__assign({}, c), { ts: c.ts - 14 * 60000 })); });
}
function makeSeriesForSymbol(symbol) {
    switch (symbol) {
        case 'BTCUSDT': {
            var c15 = buildTrendSeries(66000, 18, 35, 1200, 8);
            return { '1m': compressTo1m(c15), '5m': compressTo5m(c15), '15m': c15 };
        }
        case 'ETHUSDT': {
            var c15 = buildTrendSeries(3400, 0.9, 3.2, 1600, 9);
            return { '1m': compressTo1m(c15), '5m': compressTo5m(c15), '15m': c15 };
        }
        case 'SOLUSDT': {
            var c15 = buildTrendSeries(155, 0.11, 0.6, 2500, 7);
            return { '1m': compressTo1m(c15), '5m': compressTo5m(c15), '15m': c15 };
        }
        case 'AVAXUSDT': {
            var c15 = buildTrendSeries(42, 0.03, 0.25, 1800, 0);
            return { '1m': compressTo1m(c15), '5m': compressTo5m(c15), '15m': c15 };
        }
        case 'LINKUSDT': {
            var c15 = buildTrendSeries(18, 0.015, 0.11, 1400, 10);
            return { '1m': compressTo1m(c15), '5m': compressTo5m(c15), '15m': c15 };
        }
        case 'XRPUSDT': {
            var c15 = buildTrendSeries(0.62, 0.0004, 0.006, 3600, 6);
            return { '1m': compressTo1m(c15), '5m': compressTo5m(c15), '15m': c15 };
        }
        case 'DOGEUSDT': {
            var c15 = buildTrendSeries(0.19, 0.00025, 0.0032, 4200, 5);
            return { '1m': compressTo1m(c15), '5m': compressTo5m(c15), '15m': c15 };
        }
        default: {
            var c15 = buildTrendSeries(100, 0.01, 0.15, 1000, 0);
            return { '1m': compressTo1m(c15), '5m': compressTo5m(c15), '15m': c15 };
        }
    }
}
/** Deterministic candle sets for scanner lab / dev determinism checks (not live Bybit data). */
function buildScannerLabFixtureInput() {
    var out = {};
    for (var _i = 0, SCANNER_UNIVERSE_1 = types_1.SCANNER_UNIVERSE; _i < SCANNER_UNIVERSE_1.length; _i++) {
        var symbol = SCANNER_UNIVERSE_1[_i];
        out[symbol] = makeSeriesForSymbol(symbol);
    }
    return out;
}
