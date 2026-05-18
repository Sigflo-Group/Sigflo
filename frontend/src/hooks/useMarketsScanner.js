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
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMarketsScanner = useMarketsScanner;
var react_1 = require("react");
var useSignalEngine_1 = require("@/hooks/useSignalEngine");
var marketScannerRows_1 = require("@/lib/marketScannerRows");
var tradePairFavorites_1 = require("@/lib/tradePairFavorites");
var client_1 = require("@/services/bybit/client");
var REST_POLL_CONNECTED_MS = 5000;
var REST_POLL_IDLE_MS = 15000;
function useMarketsScanner() {
    var _this = this;
    var engine = (0, useSignalEngine_1.useSignalEngine)();
    var _a = (0, react_1.useState)({}), tickersBySymbol = _a[0], setTickersBySymbol = _a[1];
    var _b = (0, react_1.useState)(true), tickersLoading = _b[0], setTickersLoading = _b[1];
    var _c = (0, react_1.useState)(0), tradeFavoritesRevision = _c[0], setTradeFavoritesRevision = _c[1];
    var scoreSnapshotRef = (0, react_1.useRef)({});
    var triggerTimingRef = (0, react_1.useRef)({
        prevStatusBySymbol: {},
        triggeredAtBySymbol: {},
    });
    (0, react_1.useEffect)(function () {
        var onStorage = function (e) {
            if (e.key === tradePairFavorites_1.TRADE_PAIR_FAVORITES_STORAGE_KEY)
                setTradeFavoritesRevision(function (v) { return v + 1; });
        };
        var onCustom = function () { return setTradeFavoritesRevision(function (v) { return v + 1; }); };
        window.addEventListener('storage', onStorage);
        window.addEventListener(tradePairFavorites_1.TRADE_FAVORITES_CHANGED_EVENT, onCustom);
        return function () {
            window.removeEventListener('storage', onStorage);
            window.removeEventListener(tradePairFavorites_1.TRADE_FAVORITES_CHANGED_EVENT, onCustom);
        };
    }, []);
    var mergedTickersBySymbol = (0, react_1.useMemo)(function () {
        var out = __assign({}, tickersBySymbol);
        for (var _i = 0, _a = Object.entries(engine.liveTickersBySymbol); _i < _a.length; _i++) {
            var _b = _a[_i], sym = _b[0], t = _b[1];
            out[sym] = t;
        }
        return out;
    }, [tickersBySymbol, engine.liveTickersBySymbol]);
    var trackedSet = (0, react_1.useMemo)(function () { return new Set(marketScannerRows_1.TRACKED_SYMBOLS); }, []);
    /** Movers not on Tracked — subscribe live tickers so cards update off WS, not only REST poll. */
    (0, react_1.useEffect)(function () {
        var list = Object.values(tickersBySymbol);
        if (list.length === 0) {
            engine.setScannerTickerExtras([]);
            return;
        }
        var ranked = (0, marketScannerRows_1.rankMoversUniverse)(list);
        var extras = ranked.map(function (t) { return t.symbol; }).filter(function (s) { return !trackedSet.has(s); });
        engine.setScannerTickerExtras(extras);
    }, [tickersBySymbol, engine.setScannerTickerExtras, trackedSet]);
    (0, react_1.useEffect)(function () {
        var cancelled = false;
        var load = function () { return __awaiter(_this, void 0, void 0, function () {
            var list, next, _i, list_1, t, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, 3, 4]);
                        return [4 /*yield*/, (0, client_1.fetchTickers)()];
                    case 1:
                        list = _b.sent();
                        if (cancelled)
                            return [2 /*return*/];
                        next = {};
                        for (_i = 0, list_1 = list; _i < list_1.length; _i++) {
                            t = list_1[_i];
                            next[t.symbol] = t;
                        }
                        setTickersBySymbol(next);
                        return [3 /*break*/, 4];
                    case 2:
                        _a = _b.sent();
                        if (!cancelled)
                            setTickersBySymbol({});
                        return [3 /*break*/, 4];
                    case 3:
                        if (!cancelled)
                            setTickersLoading(false);
                        return [7 /*endfinally*/];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        void load();
        var pollMs = engine.connection === 'connected' || engine.connection === 'reconnecting'
            ? REST_POLL_CONNECTED_MS
            : REST_POLL_IDLE_MS;
        var id = window.setInterval(load, pollMs);
        return function () {
            cancelled = true;
            window.clearInterval(id);
        };
    }, [engine.connection]);
    var trackedRowsBare = (0, react_1.useMemo)(function () { return (0, marketScannerRows_1.buildTrackedScannerRows)(engine.signals, mergedTickersBySymbol); }, [engine.signals, mergedTickersBySymbol]);
    var moverRowsBare = (0, react_1.useMemo)(function () { return (0, marketScannerRows_1.buildMarketScannerRows)(engine.signals, mergedTickersBySymbol); }, [engine.signals, mergedTickersBySymbol]);
    var trackedRows = (0, react_1.useMemo)(function () {
        var timed = (0, marketScannerRows_1.attachTriggerTimestamps)(trackedRowsBare, triggerTimingRef.current, 'tracked');
        var sorted = (0, marketScannerRows_1.sortScannerRowsForTapPriority)(timed);
        return (0, marketScannerRows_1.attachScoreTrends)(sorted, scoreSnapshotRef.current);
    }, [trackedRowsBare]);
    var moverRows = (0, react_1.useMemo)(function () {
        var timed = (0, marketScannerRows_1.attachTriggerTimestamps)(moverRowsBare, triggerTimingRef.current, 'movers');
        var sorted = (0, marketScannerRows_1.sortScannerRowsForTapPriority)(timed);
        return (0, marketScannerRows_1.attachScoreTrends)(sorted, scoreSnapshotRef.current);
    }, [moverRowsBare]);
    var watchlistRows = (0, react_1.useMemo)(function () {
        var bases = (0, tradePairFavorites_1.readTradePairFavorites)();
        return (0, marketScannerRows_1.buildWatchlistMarketRows)(bases, engine.signals, mergedTickersBySymbol);
    }, [engine.signals, mergedTickersBySymbol, tradeFavoritesRevision]);
    (0, react_1.useEffect)(function () {
        var next = __assign({}, scoreSnapshotRef.current);
        for (var _i = 0, trackedRowsBare_1 = trackedRowsBare; _i < trackedRowsBare_1.length; _i++) {
            var r = trackedRowsBare_1[_i];
            next[r.symbol] = r.setupScore;
        }
        for (var _a = 0, moverRowsBare_1 = moverRowsBare; _a < moverRowsBare_1.length; _a++) {
            var r = moverRowsBare_1[_a];
            next[r.symbol] = r.setupScore;
        }
        scoreSnapshotRef.current = next;
    }, [trackedRowsBare, moverRowsBare]);
    return (0, react_1.useMemo)(function () { return ({
        trackedRows: trackedRows,
        watchlistRows: watchlistRows,
        moverRows: moverRows,
        activeSetupsTracked: (0, marketScannerRows_1.countActiveSetups)(trackedRows, 70),
        activeSetupsMovers: (0, marketScannerRows_1.countActiveSetups)(moverRows, 70),
        moversCount: moverRows.length,
        mode: engine.mode,
        connection: engine.connection,
        tickersLoading: tickersLoading,
    }); }, [engine.connection, engine.mode, trackedRows, watchlistRows, moverRows, tickersLoading]);
}
