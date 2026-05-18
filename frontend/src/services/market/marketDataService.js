"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKlines = getKlines;
exports.getMarketSnapshot = getMarketSnapshot;
var indicators_1 = require("@/lib/indicators");
var client_1 = require("@/services/bybit/client");
function pairToLinearSymbol(pair) {
    var p = pair.trim().toUpperCase().replace(/\s+/g, '');
    if (!p)
        return '';
    if (p.includes('/'))
        return p.replace('/', '');
    if (/USDT$/i.test(p) || /USDC$/i.test(p))
        return p;
    return "".concat(p, "USDT");
}
function displayPairFromSymbol(symbol, originalPair) {
    var o = originalPair.trim();
    if (o.includes('/'))
        return o;
    var sym = symbol.toUpperCase();
    var base = sym.replace(/USDT$/i, '').replace(/USDC$/i, '');
    if (base && base !== sym)
        return "".concat(base, " / USDT");
    return sym;
}
function uiIntervalToBybit(interval) {
    switch (interval) {
        case '5m':
            return '5';
        case '15m':
            return '15';
        case '1h':
            return '60';
    }
}
function snapshotTimeframeToBybit(tf) {
    switch (tf) {
        case '5m':
            return '5';
        case '15m':
            return '15';
        case '1h':
            return '60';
        case '4h':
            return '240';
    }
}
function candlesToEngineCandles(candles) {
    return candles.map(function (c) { return ({
        timestamp: new Date(c.ts).toISOString(),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
    }); });
}
/**
 * Linear USDT perp klines from Bybit public REST (`/v5/market/kline`, category=linear).
 */
function getKlines(pair, interval, limit) {
    return __awaiter(this, void 0, void 0, function () {
        var symbol, capped;
        return __generator(this, function (_a) {
            symbol = pairToLinearSymbol(pair);
            if (!symbol)
                return [2 /*return*/, []];
            capped = Math.max(1, Math.min(1000, Math.floor(limit)));
            return [2 /*return*/, (0, client_1.fetchKlines)(symbol, uiIntervalToBybit(interval), capped)];
        });
    });
}
/**
 * Latest market snapshot: klines, last price as last close, and lightweight indicators.
 */
function getMarketSnapshot(pair_1, timeframe_1) {
    return __awaiter(this, arguments, void 0, function (pair, timeframe, limit) {
        var symbol, capped, candles, displayPair, closes, volumes, lastClose, lastVol, volAvg, ema20Series, ema50Series, rsiSeries, ema20, ema50, rsiLast, volumeRatio;
        var _a, _b;
        if (limit === void 0) { limit = 50; }
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    symbol = pairToLinearSymbol(pair);
                    if (!symbol) {
                        return [2 /*return*/, {
                                pair: pair.trim() || '—',
                                timeframe: timeframe,
                                price: 0,
                                candles: [],
                                indicators: {},
                            }];
                    }
                    capped = Math.max(1, Math.min(1000, Math.floor(limit)));
                    return [4 /*yield*/, (0, client_1.fetchKlines)(symbol, snapshotTimeframeToBybit(timeframe), capped)];
                case 1:
                    candles = _c.sent();
                    displayPair = displayPairFromSymbol(symbol, pair);
                    if (candles.length === 0) {
                        return [2 /*return*/, {
                                pair: displayPair,
                                timeframe: timeframe,
                                price: 0,
                                candles: [],
                                indicators: {},
                            }];
                    }
                    closes = candles.map(function (c) { return c.close; });
                    volumes = candles.map(function (c) { return c.volume; });
                    lastClose = (_a = closes[closes.length - 1]) !== null && _a !== void 0 ? _a : 0;
                    lastVol = (_b = volumes[volumes.length - 1]) !== null && _b !== void 0 ? _b : 0;
                    volAvg = volumes.length > 0 ? volumes.reduce(function (a, b) { return a + b; }, 0) / volumes.length : 0;
                    ema20Series = (0, indicators_1.ema)(closes, 20);
                    ema50Series = (0, indicators_1.ema)(closes, 50);
                    rsiSeries = (0, indicators_1.rsi)(closes, 14);
                    ema20 = ema20Series[ema20Series.length - 1];
                    ema50 = ema50Series[ema50Series.length - 1];
                    rsiLast = rsiSeries[rsiSeries.length - 1];
                    volumeRatio = volAvg > 0 && Number.isFinite(lastVol) ? lastVol / volAvg : undefined;
                    return [2 /*return*/, {
                            pair: displayPair,
                            timeframe: timeframe,
                            price: lastClose,
                            candles: candlesToEngineCandles(candles),
                            indicators: {
                                ema20: Number.isFinite(ema20) ? ema20 : undefined,
                                ema50: Number.isFinite(ema50) ? ema50 : undefined,
                                rsi: Number.isFinite(rsiLast) ? rsiLast : undefined,
                                volumeRatio: volumeRatio !== undefined && Number.isFinite(volumeRatio) ? volumeRatio : undefined,
                            },
                        }];
            }
        });
    });
}
