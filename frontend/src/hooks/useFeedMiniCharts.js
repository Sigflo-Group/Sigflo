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
exports.useFeedMiniCharts = useFeedMiniCharts;
var react_1 = require("react");
var client_1 = require("@/services/bybit/client");
var CACHE_TTL_MS = 90000;
var cache = new Map();
function pairToLinearSymbol(pair) {
    return "".concat(pair.replace(/USDT$/i, '').toUpperCase(), "USDT");
}
function miniCacheKey(pair, interval) {
    return "".concat(pair, "|").concat(interval);
}
function useFeedMiniCharts(pairs, options) {
    var _a, _b;
    var _c = (0, react_1.useState)({}), rows = _c[0], setRows = _c[1];
    var interval = options.interval;
    var activePairs = (0, react_1.useMemo)(function () { return __spreadArray([], new Set(pairs.map(function (p) { return p.toUpperCase(); })), true); }, [pairs]);
    var fastPairSet = (0, react_1.useMemo)(function () { var _a; return new Set(((_a = options.fastPairs) !== null && _a !== void 0 ? _a : []).map(function (p) { return p.toUpperCase(); })); }, [options.fastPairs]);
    var activeKey = (0, react_1.useMemo)(function () { return activePairs.join('|'); }, [activePairs]);
    var fastKey = (0, react_1.useMemo)(function () { return __spreadArray([], fastPairSet, true).sort().join('|'); }, [fastPairSet]);
    var refreshMs = (_a = options.refreshMs) !== null && _a !== void 0 ? _a : 30000;
    var fastRefreshMs = (_b = options.fastRefreshMs) !== null && _b !== void 0 ? _b : 10000;
    var requestRef = (0, react_1.useRef)(0);
    (0, react_1.useEffect)(function () {
        setRows({});
    }, [interval]);
    (0, react_1.useEffect)(function () {
        if (activePairs.length === 0) {
            setRows({});
            return;
        }
        var cancelled = false;
        requestRef.current += 1;
        var rid = requestRef.current;
        function load() {
            return __awaiter(this, void 0, void 0, function () {
                var now, next, misses, _i, activePairs_1, pair, key, hit, ttl, fetched, merged, _a, fetched_1, row;
                var _this = this;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            now = Date.now();
                            next = {};
                            misses = [];
                            for (_i = 0, activePairs_1 = activePairs; _i < activePairs_1.length; _i++) {
                                pair = activePairs_1[_i];
                                key = miniCacheKey(pair, interval);
                                hit = cache.get(key);
                                ttl = fastPairSet.has(pair) ? Math.min(CACHE_TTL_MS, fastRefreshMs + 1500) : CACHE_TTL_MS;
                                if (hit && now - hit.fetchedAt <= ttl)
                                    next[pair] = hit.candles;
                                else
                                    misses.push(pair);
                            }
                            if (Object.keys(next).length > 0 && !cancelled && rid === requestRef.current) {
                                setRows(function (prev) { return (__assign(__assign({}, prev), next)); });
                            }
                            if (misses.length === 0)
                                return [2 /*return*/];
                            return [4 /*yield*/, Promise.all(misses.map(function (pair) { return __awaiter(_this, void 0, void 0, function () {
                                    var candles, _a;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                _b.trys.push([0, 2, , 3]);
                                                return [4 /*yield*/, (0, client_1.fetchKlines)(pairToLinearSymbol(pair), interval, 34)];
                                            case 1:
                                                candles = _b.sent();
                                                return [2 /*return*/, { pair: pair, candles: candles }];
                                            case 2:
                                                _a = _b.sent();
                                                return [2 /*return*/, { pair: pair, candles: [] }];
                                            case 3: return [2 /*return*/];
                                        }
                                    });
                                }); }))];
                        case 1:
                            fetched = _b.sent();
                            if (cancelled || rid !== requestRef.current)
                                return [2 /*return*/];
                            merged = {};
                            for (_a = 0, fetched_1 = fetched; _a < fetched_1.length; _a++) {
                                row = fetched_1[_a];
                                if (row.candles.length > 0) {
                                    cache.set(miniCacheKey(row.pair, interval), { candles: row.candles, fetchedAt: Date.now() });
                                    merged[row.pair] = row.candles;
                                }
                            }
                            if (Object.keys(merged).length > 0)
                                setRows(function (prev) { return (__assign(__assign({}, prev), merged)); });
                            return [2 /*return*/];
                    }
                });
            });
        }
        void load();
        var pollEveryMs = fastPairSet.size > 0 ? Math.min(refreshMs, fastRefreshMs) : refreshMs;
        var t = window.setInterval(function () {
            void load();
        }, pollEveryMs);
        return function () {
            cancelled = true;
            window.clearInterval(t);
        };
    }, [activeKey, fastKey, interval, refreshMs, fastRefreshMs]);
    return rows;
}
