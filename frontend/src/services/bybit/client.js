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
exports.fetchTradablePerpSymbols = fetchTradablePerpSymbols;
exports.fetchLinearMaxLeverage = fetchLinearMaxLeverage;
exports.fetchTickers = fetchTickers;
exports.rankLiquidUniverse = rankLiquidUniverse;
exports.fetchKlines = fetchKlines;
var BASE = 'https://api.bybit.com';
function toNum(v) {
    if (v === undefined)
        return 0;
    return typeof v === 'number' ? v : Number(v);
}
function getJson(path) {
    return __awaiter(this, void 0, void 0, function () {
        var r;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("".concat(BASE).concat(path))];
                case 1:
                    r = _a.sent();
                    if (!r.ok)
                        throw new Error("Bybit HTTP ".concat(r.status));
                    return [4 /*yield*/, r.json()];
                case 2: return [2 /*return*/, (_a.sent())];
            }
        });
    });
}
function fetchTradablePerpSymbols() {
    return __awaiter(this, void 0, void 0, function () {
        var data;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, getJson('/v5/market/instruments-info?category=linear&limit=1000')];
                case 1:
                    data = _c.sent();
                    if (data.retCode !== 0)
                        throw new Error(data.retMsg || 'Bybit instruments failed');
                    return [2 /*return*/, ((_b = (_a = data.result) === null || _a === void 0 ? void 0 : _a.list) !== null && _b !== void 0 ? _b : [])
                            .filter(function (x) { return x.status === 'Trading' && x.quoteCoin === 'USDT'; })
                            .map(function (x) { return x.symbol; })];
            }
        });
    });
}
/** Max leverage allowed for the linear USDT contract (from instruments-info). Null if the request fails. */
function fetchLinearMaxLeverage(symbol) {
    return __awaiter(this, void 0, void 0, function () {
        var sym, data, raw, n, _a;
        var _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    sym = symbol.trim().toUpperCase().replace(/\s+/g, '');
                    if (!sym)
                        return [2 /*return*/, null];
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, getJson("/v5/market/instruments-info?category=linear&symbol=".concat(encodeURIComponent(sym)))];
                case 2:
                    data = _e.sent();
                    if (data.retCode !== 0)
                        return [2 /*return*/, null];
                    raw = (_d = (_c = (_b = data.result.list) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.leverageFilter) === null || _d === void 0 ? void 0 : _d.maxLeverage;
                    n = raw != null ? Number(String(raw).trim()) : NaN;
                    if (!Number.isFinite(n) || n < 1)
                        return [2 /*return*/, null];
                    return [2 /*return*/, Math.max(1, Math.min(200, Math.floor(n)))];
                case 3:
                    _a = _e.sent();
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function fetchTickers(symbols) {
    return __awaiter(this, void 0, void 0, function () {
        var data, symbolSet;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, getJson('/v5/market/tickers?category=linear')];
                case 1:
                    data = _c.sent();
                    if (data.retCode !== 0)
                        throw new Error(data.retMsg || 'Bybit tickers failed');
                    symbolSet = symbols ? new Set(symbols) : undefined;
                    return [2 /*return*/, ((_b = (_a = data.result) === null || _a === void 0 ? void 0 : _a.list) !== null && _b !== void 0 ? _b : [])
                            .filter(function (x) { var _a; return (symbolSet ? symbolSet.has(String((_a = x.symbol) !== null && _a !== void 0 ? _a : '')) : true); })
                            .map(function (x) {
                            var _a;
                            var markRaw = toNum(x.markPrice);
                            var indexRaw = toNum(x.indexPrice);
                            return __assign(__assign(__assign({ symbol: String((_a = x.symbol) !== null && _a !== void 0 ? _a : ''), lastPrice: toNum(x.lastPrice) }, (Number.isFinite(markRaw) && markRaw > 0 ? { markPrice: markRaw } : {})), (Number.isFinite(indexRaw) && indexRaw > 0 ? { indexPrice: indexRaw } : {})), { high24h: toNum(x.highPrice24h), low24h: toNum(x.lowPrice24h), volume24h: toNum(x.volume24h), turnover24h: toNum(x.turnover24h), price24hPcnt: toNum(x.price24hPcnt) });
                        })];
            }
        });
    });
}
function rankLiquidUniverse(tickers, minCount, maxCount) {
    var sorted = __spreadArray([], tickers, true).sort(function (a, b) { return b.turnover24h - a.turnover24h; });
    var take = Math.min(Math.max(minCount, 1), Math.max(maxCount, 1));
    return sorted.slice(0, take).map(function (t) { return ({
        symbol: t.symbol,
        volume24h: t.volume24h,
        turnover24h: t.turnover24h,
    }); });
}
function fetchKlines(symbol_1, interval_1) {
    return __awaiter(this, arguments, void 0, function (symbol, interval, limit) {
        var data;
        var _a, _b;
        if (limit === void 0) { limit = 200; }
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, getJson("/v5/market/kline?category=linear&symbol=".concat(encodeURIComponent(symbol), "&interval=").concat(interval, "&limit=").concat(limit))];
                case 1:
                    data = _c.sent();
                    if (data.retCode !== 0)
                        throw new Error(data.retMsg || 'Bybit kline failed');
                    // Bybit returns newest first.
                    return [2 /*return*/, ((_b = (_a = data.result) === null || _a === void 0 ? void 0 : _a.list) !== null && _b !== void 0 ? _b : [])
                            .map(function (r) { return ({
                            ts: Number(r[0]),
                            open: Number(r[1]),
                            high: Number(r[2]),
                            low: Number(r[3]),
                            close: Number(r[4]),
                            volume: Number(r[5]),
                        }); })
                            .reverse()];
            }
        });
    });
}
