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
exports.useLiveTradeMarket = useLiveTradeMarket;
var react_1 = require("react");
var bybitWsClient_1 = require("@/lib/bybitWsClient");
var liveMarketTickConstants_1 = require("@/lib/liveMarketTickConstants");
var client_1 = require("@/services/bybit/client");
var SUPPORTED_INTERVALS = ['1', '5', '15', '60', '240', 'D', 'W'];
function upsertCandle(store, next) {
    var out = __spreadArray([], store, true);
    var last = out.at(-1);
    if (!last || next.ts > last.ts)
        out.push(next);
    else if (next.ts === last.ts)
        out[out.length - 1] = next;
    return out.slice(-140);
}
function toBillions(v) {
    if (v >= 1000000000)
        return "$".concat((v / 1000000000).toFixed(2), "B");
    if (v >= 1000000)
        return "$".concat((v / 1000000).toFixed(2), "M");
    return "$".concat(v.toLocaleString('en-US', { maximumFractionDigits: 0 }));
}
function normalizeSeries(candles) {
    if (candles.length === 0)
        return [];
    var closes = candles.map(function (c) { return c.close; });
    var min = Math.min.apply(Math, closes);
    var max = Math.max.apply(Math, closes);
    var span = Math.max(0.000001, max - min);
    return closes.map(function (v) { return (v - min) / span; });
}
function toTradeCandles(candles) {
    return candles.map(function (c) { return ({
        ts: c.ts,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
    }); });
}
function useLiveTradeMarket(symbol, interval) {
    var _a = (0, react_1.useState)({
        loadingInterval: true,
        mode: 'OFFLINE',
        connection: 'disconnected',
    }), state = _a[0], setState = _a[1];
    var lastPriceRef = (0, react_1.useRef)(undefined);
    var tickSnapshotRef = (0, react_1.useRef)(null);
    var pendingUiRef = (0, react_1.useRef)(false);
    var pendingChartRef = (0, react_1.useRef)(false);
    var chartImmediateRef = (0, react_1.useRef)(false);
    var candlesRef = (0, react_1.useRef)({
        '1': [],
        '5': [],
        '15': [],
        '60': [],
        '240': [],
        D: [],
        W: [],
    });
    var readyRef = (0, react_1.useRef)(false);
    /** Drop tick refs as soon as `symbol` changes so nothing reads the prior pair’s price before the main effect runs. */
    (0, react_1.useLayoutEffect)(function () {
        lastPriceRef.current = undefined;
        tickSnapshotRef.current = null;
    }, [symbol]);
    /** RAF loop: refs → React state at throttled rates. */
    (0, react_1.useEffect)(function () {
        var stopped = false;
        var raf = 0;
        var lastUiPush = -Infinity;
        var lastChartPush = -Infinity;
        var tick = function () {
            if (stopped)
                return;
            raf = window.requestAnimationFrame(tick);
            var snap = tickSnapshotRef.current;
            if (!snap)
                return;
            var now = performance.now();
            var uiDue = pendingUiRef.current && now - lastUiPush >= liveMarketTickConstants_1.LIVE_MARKET_UI_THROTTLE_MS;
            var chartImmediate = chartImmediateRef.current;
            chartImmediateRef.current = false;
            var chartDue = pendingChartRef.current &&
                (chartImmediate || now - lastChartPush >= liveMarketTickConstants_1.LIVE_MARKET_CHART_THROTTLE_MS);
            if (!uiDue && !chartDue)
                return;
            var active = candlesRef.current[interval];
            if (uiDue) {
                pendingUiRef.current = false;
                lastUiPush = now;
            }
            if (chartDue) {
                pendingChartRef.current = false;
                lastChartPush = now;
            }
            setState(function (prev) {
                var next = __assign({}, prev);
                if (uiDue) {
                    next.lastPrice = snap.lastPrice;
                    if (snap.markPrice != null && Number.isFinite(snap.markPrice) && snap.markPrice > 0) {
                        next.markPrice = snap.markPrice;
                    }
                    if (snap.indexPrice != null && Number.isFinite(snap.indexPrice) && snap.indexPrice > 0) {
                        next.indexPrice = snap.indexPrice;
                    }
                    next.change24hPct = snap.change24hPct;
                    next.high24h = snap.high24h;
                    next.low24h = snap.low24h;
                    next.volume24h = snap.volume24h;
                    next.lastUpdateTs = snap.lastUpdateTs;
                    next.mode = readyRef.current ? 'WS' : prev.mode;
                    next.dataSymbol = symbol;
                }
                if (chartDue && active.length > 0) {
                    next.priceSeries = normalizeSeries(active);
                    next.chartCandles = toTradeCandles(active);
                    next.loadingInterval = false;
                    next.mode = readyRef.current ? 'WS' : prev.mode;
                    next.dataSymbol = symbol;
                }
                return next;
            });
        };
        raf = window.requestAnimationFrame(tick);
        return function () {
            stopped = true;
            window.cancelAnimationFrame(raf);
        };
    }, [symbol, interval]);
    (0, react_1.useEffect)(function () {
        var cancelled = false;
        readyRef.current = false;
        candlesRef.current = { '1': [], '5': [], '15': [], '60': [], '240': [], D: [], W: [] };
        tickSnapshotRef.current = null;
        lastPriceRef.current = undefined;
        pendingUiRef.current = false;
        pendingChartRef.current = false;
        chartImmediateRef.current = false;
        /** Drop prior symbol/interval OHLC from React state immediately — avoids painting the wrong asset after pair change (e.g. BTC candles under LINK). */
        setState(function (prev) { return (__assign(__assign({}, prev), { loadingInterval: true, chartCandles: undefined, priceSeries: undefined, lastPrice: undefined, markPrice: undefined, indexPrice: undefined, change24hPct: undefined, high24h: undefined, low24h: undefined, volume24h: undefined, lastUpdateTs: undefined, dataSymbol: symbol })); });
        function bootstrap(reason) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, c1, c5, c15, c60, c240, cD, cW, tickers, active_1, t, markPx_1, indexPx_1, snap_1, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _c.trys.push([0, 2, , 3]);
                            console.log("[Sigflo][Trade] REST bootstrap (".concat(reason, ") ").concat(symbol));
                            return [4 /*yield*/, Promise.all([
                                    (0, client_1.fetchKlines)(symbol, '1', 200),
                                    (0, client_1.fetchKlines)(symbol, '5', 140),
                                    (0, client_1.fetchKlines)(symbol, '15', 140),
                                    (0, client_1.fetchKlines)(symbol, '60', 140),
                                    (0, client_1.fetchKlines)(symbol, '240', 140),
                                    (0, client_1.fetchKlines)(symbol, 'D', 140),
                                    (0, client_1.fetchKlines)(symbol, 'W', 140),
                                    (0, client_1.fetchTickers)([symbol]),
                                ])];
                        case 1:
                            _a = _c.sent(), c1 = _a[0], c5 = _a[1], c15 = _a[2], c60 = _a[3], c240 = _a[4], cD = _a[5], cW = _a[6], tickers = _a[7];
                            candlesRef.current = {
                                '1': c1,
                                '5': c5,
                                '15': c15,
                                '60': c60,
                                '240': c240,
                                D: cD,
                                W: cW,
                            };
                            active_1 = candlesRef.current[interval];
                            t = tickers[0];
                            if (!t || cancelled) {
                                if (!cancelled) {
                                    setState(function (prev) { return (__assign(__assign({}, prev), { loadingInterval: false, dataSymbol: symbol, mode: 'OFFLINE', connection: 'disconnected' })); });
                                }
                                return [2 /*return*/];
                            }
                            readyRef.current = true;
                            markPx_1 = t.markPrice != null && Number.isFinite(t.markPrice) && t.markPrice > 0 ? t.markPrice : undefined;
                            indexPx_1 = t.indexPrice != null && Number.isFinite(t.indexPrice) && t.indexPrice > 0 ? t.indexPrice : undefined;
                            snap_1 = __assign(__assign(__assign({ lastPrice: t.lastPrice }, (markPx_1 != null ? { markPrice: markPx_1 } : {})), (indexPx_1 != null ? { indexPrice: indexPx_1 } : {})), { change24hPct: t.price24hPcnt * 100, high24h: t.high24h, low24h: t.low24h, volume24h: toBillions(t.turnover24h), lastUpdateTs: Date.now() });
                            tickSnapshotRef.current = snap_1;
                            lastPriceRef.current = t.lastPrice;
                            setState(function (prev) { return (__assign(__assign(__assign(__assign(__assign({}, prev), { dataSymbol: symbol, lastPrice: snap_1.lastPrice }), (markPx_1 != null ? { markPrice: markPx_1 } : {})), (indexPx_1 != null ? { indexPrice: indexPx_1 } : {})), { change24hPct: snap_1.change24hPct, high24h: snap_1.high24h, low24h: snap_1.low24h, volume24h: snap_1.volume24h, priceSeries: normalizeSeries(active_1), chartCandles: toTradeCandles(active_1), loadingInterval: false, lastUpdateTs: snap_1.lastUpdateTs, mode: prev.connection === 'connected' ? 'WS' : 'REST' })); });
                            return [3 /*break*/, 3];
                        case 2:
                            _b = _c.sent();
                            if (cancelled)
                                return [2 /*return*/];
                            tickSnapshotRef.current = null;
                            lastPriceRef.current = undefined;
                            setState(function (prev) { return (__assign(__assign({}, prev), { loadingInterval: false, dataSymbol: symbol, mode: 'OFFLINE', connection: 'disconnected' })); });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        }
        var applyTickerToCandles = function (price) {
            var active = candlesRef.current[interval];
            if (active.length > 0) {
                var last = active[active.length - 1];
                active[active.length - 1] = __assign(__assign({}, last), { close: price, high: Math.max(last.high, price), low: Math.min(last.low, price) });
            }
        };
        var ws = new bybitWsClient_1.BybitWsClient({
            klineSymbols: [symbol],
            klineIntervals: SUPPORTED_INTERVALS,
            includeTickers: true,
            includePublicTrades: true,
            onLog: function (msg) { return console.log("[Sigflo][Trade] ".concat(msg)); },
            onConnectionChange: function (connection) {
                setState(function (prev) { return (__assign(__assign({}, prev), { connection: connection, mode: prev.mode === 'OFFLINE'
                        ? 'OFFLINE'
                        : connection === 'connected'
                            ? 'WS'
                            : connection === 'reconnecting'
                                ? 'REST'
                                : 'REST' })); });
                if (connection === 'connected')
                    void bootstrap('reconnect');
            },
            onTicker: function (t) {
                if (t.symbol !== symbol)
                    return;
                var price = t.lastPrice;
                var prev = tickSnapshotRef.current;
                var markPx = t.markPrice > 0
                    ? t.markPrice
                    : (prev === null || prev === void 0 ? void 0 : prev.markPrice) != null && prev.markPrice > 0
                        ? prev.markPrice
                        : undefined;
                var indexPx = t.indexPrice != null && t.indexPrice > 0
                    ? t.indexPrice
                    : (prev === null || prev === void 0 ? void 0 : prev.indexPrice) != null && prev.indexPrice > 0
                        ? prev.indexPrice
                        : undefined;
                var snap = __assign(__assign(__assign({ lastPrice: price }, (markPx != null ? { markPrice: markPx } : {})), (indexPx != null ? { indexPrice: indexPx } : {})), { change24hPct: t.price24hPcnt * 100, high24h: t.high24h, low24h: t.low24h, volume24h: toBillions(t.turnover24h), lastUpdateTs: Date.now() });
                tickSnapshotRef.current = snap;
                lastPriceRef.current = price;
                applyTickerToCandles(price);
                pendingUiRef.current = true;
                pendingChartRef.current = true;
            },
            onPublicTrade: function (tr) {
                if (tr.symbol !== symbol)
                    return;
                var price = tr.price;
                var prevSnap = tickSnapshotRef.current;
                if (!prevSnap)
                    return;
                tickSnapshotRef.current = __assign(__assign({}, prevSnap), { lastPrice: price, lastUpdateTs: Date.now() });
                lastPriceRef.current = price;
                applyTickerToCandles(price);
                pendingUiRef.current = true;
                pendingChartRef.current = true;
            },
            onKline: function (k) {
                if (k.symbol !== symbol)
                    return;
                if (!SUPPORTED_INTERVALS.includes(k.interval))
                    return;
                var key = k.interval;
                candlesRef.current[key] = upsertCandle(candlesRef.current[key], {
                    ts: k.start,
                    open: k.open,
                    high: k.high,
                    low: k.low,
                    close: k.close,
                    volume: k.volume,
                    isClosed: k.confirm,
                });
                if (k.confirm) {
                    chartImmediateRef.current = true;
                }
                var active = candlesRef.current[interval];
                if (active.length > 0) {
                    var c = active[active.length - 1];
                    var base = tickSnapshotRef.current;
                    if (base) {
                        tickSnapshotRef.current = __assign(__assign({}, base), { lastPrice: c.close, lastUpdateTs: Date.now() });
                        lastPriceRef.current = c.close;
                    }
                }
                pendingUiRef.current = true;
                pendingChartRef.current = true;
            },
        });
        void bootstrap('startup').then(function () { return ws.connect(); });
        return function () {
            cancelled = true;
            ws.disconnect();
        };
    }, [symbol, interval]);
    (0, react_1.useEffect)(function () {
        var active = candlesRef.current[interval];
        if (!active || active.length === 0)
            return;
        chartImmediateRef.current = true;
        pendingChartRef.current = true;
        setState(function (prev) { return (__assign(__assign({}, prev), { priceSeries: normalizeSeries(active), chartCandles: toTradeCandles(active) })); });
    }, [interval]);
    return (0, react_1.useMemo)(function () {
        var mismatched = state.dataSymbol != null && state.dataSymbol !== symbol;
        var core = mismatched
            ? {
                loadingInterval: true,
                mode: state.mode,
                connection: state.connection,
                dataSymbol: state.dataSymbol,
            }
            : state;
        return __assign(__assign({}, core), { lastPriceRef: lastPriceRef, tickSnapshotRef: tickSnapshotRef });
    }, [state, symbol]);
}
