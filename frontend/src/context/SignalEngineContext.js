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
exports.SignalEngineProvider = SignalEngineProvider;
exports.useSignalEngine = useSignalEngine;
var react_1 = require("react");
var scannerDeterminism_1 = require("@/engine/scannerDeterminism");
var bybitWsClient_1 = require("@/lib/bybitWsClient");
var signalDetectors_1 = require("@/lib/signalDetectors");
var indicators_1 = require("@/lib/indicators");
var scannerDiagnostics_1 = require("@/lib/scannerDiagnostics");
var client_1 = require("@/services/bybit/client");
var marketScannerRows_1 = require("@/lib/marketScannerRows");
var biasFlipNotifyGate_1 = require("@/lib/biasFlipNotifyGate");
var globalAnnouncements_1 = require("@/lib/globalAnnouncements");
var COOLDOWN_MS = 45 * 60 * 1000;
var SCORE_IMPROVE_BYPASS = 8;
var ATR_MOVE_BYPASS = 0.8;
/** Same as Markets Tracked list — WS klines + tickers for live scanner + detectors. */
var STREAM_SYMBOLS = __spreadArray([], marketScannerRows_1.TRACKED_SYMBOLS, true);
var SignalEngineContext = (0, react_1.createContext)(null);
function signalPairToLinearKey(pair) {
    var raw = pair.trim().toUpperCase();
    var base = raw.includes('/') ? raw.split('/')[0].trim() : raw.replace(/USDT$/i, '').trim();
    var clean = base.replace(/[^A-Z0-9]/g, '');
    return "".concat(clean || 'BTC', "USDT");
}
function wsTickerToSymbolTicker(t) {
    return __assign(__assign(__assign({ symbol: t.symbol, lastPrice: t.lastPrice }, (t.markPrice > 0 ? { markPrice: t.markPrice } : {})), (t.indexPrice != null && t.indexPrice > 0 ? { indexPrice: t.indexPrice } : {})), { high24h: t.high24h, low24h: t.low24h, volume24h: t.volume24h, turnover24h: t.turnover24h, price24hPcnt: t.price24hPcnt });
}
function emptyIntervalCandles() {
    return {
        '1': [],
        '5': [],
        '15': [],
        '60': [],
        '240': [],
        D: [],
        W: [],
    };
}
function upsertCandle(store, next) {
    var out = __spreadArray([], store, true);
    var last = out.at(-1);
    if (!last || next.ts > last.ts)
        out.push(next);
    else if (next.ts === last.ts)
        out[out.length - 1] = next;
    return out.slice(-240);
}
function useSignalEngineValue() {
    var _a = (0, react_1.useState)({
        signals: [],
        loading: true,
        mode: 'REST',
        connection: 'disconnected',
    }), state = _a[0], setState = _a[1];
    var _b = (0, react_1.useState)({}), liveTickersBySymbol = _b[0], setLiveTickersBySymbol = _b[1];
    var _c = (0, react_1.useState)([]), scannerTickerExtras = _c[0], setScannerTickerExtras = _c[1];
    var mergedTickerSymbols = (0, react_1.useMemo)(function () { return __spreadArray([], new Set(__spreadArray(__spreadArray([], STREAM_SYMBOLS, true), scannerTickerExtras, true)), true); }, [scannerTickerExtras]);
    var setScannerTickerExtrasStable = (0, react_1.useCallback)(function (symbols) {
        setScannerTickerExtras(symbols);
    }, []);
    var lastSignalRef = (0, react_1.useRef)({});
    var signalBookRef = (0, react_1.useRef)({});
    var lifecycleRef = (0, react_1.useRef)({});
    var candlesRef = (0, react_1.useRef)({});
    var tickersRef = (0, react_1.useRef)({});
    var wsConnectedRef = (0, react_1.useRef)(false);
    var streamReadyRef = (0, react_1.useRef)(false);
    var didPrintDeterminismRef = (0, react_1.useRef)(false);
    var tickerFlushRafRef = (0, react_1.useRef)(null);
    var wsClientRef = (0, react_1.useRef)(null);
    var biasSideBySymbolRef = (0, react_1.useRef)({});
    (0, react_1.useEffect)(function () {
        var cancelled = false;
        if (import.meta.env.DEV && !didPrintDeterminismRef.current) {
            didPrintDeterminismRef.current = true;
            var check = (0, scannerDeterminism_1.runScannerDeterminismCheck)();
            // Dev-only visibility: verifies deterministic first pass and cooldown/dedup on second pass.
            console.log('[Sigflo][Engine] determinism pass 1', check.firstPass);
            console.log('[Sigflo][Engine] determinism pass 2', check.secondPass);
        }
        function pushState(mode, connection, error) {
            var ranked = Object.values(signalBookRef.current).sort(function (a, b) { return b.setupScore - a.setupScore; });
            for (var _i = 0, STREAM_SYMBOLS_1 = STREAM_SYMBOLS; _i < STREAM_SYMBOLS_1.length; _i++) {
                var sym = STREAM_SYMBOLS_1[_i];
                var best = null;
                for (var _a = 0, ranked_1 = ranked; _a < ranked_1.length; _a++) {
                    var s = ranked_1[_a];
                    if (signalPairToLinearKey(s.pair) !== sym)
                        continue;
                    if (!best || s.setupScore > best.setupScore)
                        best = s;
                }
                if (!best) {
                    delete biasSideBySymbolRef.current[sym];
                    continue;
                }
                var next = best.side;
                var prev = biasSideBySymbolRef.current[sym];
                if (prev !== undefined && prev !== next && (0, biasFlipNotifyGate_1.shouldAnnounceScannerBiasFlip)(sym)) {
                    var shortLabel = sym.replace(/USDT$/i, '');
                    (0, globalAnnouncements_1.emitGlobalAnnouncement)({
                        id: "bias-".concat(sym, "-").concat(Date.now()),
                        kind: 'bias_flip',
                        title: 'Bias changed',
                        subtitle: "".concat(shortLabel, " ").concat(prev === 'long' ? 'LONG' : 'SHORT', " \u2192 ").concat(next === 'long' ? 'LONG' : 'SHORT'),
                    });
                }
                biasSideBySymbolRef.current[sym] = next;
            }
            setState({
                signals: ranked,
                loading: false,
                // Reflect transport/data source truth even when no setups are currently emitted.
                mode: mode,
                connection: connection,
                error: error,
            });
        }
        // REST bootstrap / reconnect catch-up:
        // - backfill candles and tickers
        // - refresh in-memory stores
        // - run detector pipeline against fresh snapshots
        function backfillFromRest(reason) {
            return __awaiter(this, void 0, void 0, function () {
                var tickers, _i, tickers_1, ticker, _a, STREAM_SYMBOLS_2, symbol, _b, candles5m, candles15m, err_1;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            console.log("[Sigflo][Engine] REST bootstrap (".concat(reason, ")"));
                            streamReadyRef.current = false;
                            _c.label = 1;
                        case 1:
                            _c.trys.push([1, 7, , 8]);
                            return [4 /*yield*/, (0, client_1.fetchTickers)(STREAM_SYMBOLS)];
                        case 2:
                            tickers = _c.sent();
                            for (_i = 0, tickers_1 = tickers; _i < tickers_1.length; _i++) {
                                ticker = tickers_1[_i];
                                tickersRef.current[ticker.symbol] = ticker;
                            }
                            _a = 0, STREAM_SYMBOLS_2 = STREAM_SYMBOLS;
                            _c.label = 3;
                        case 3:
                            if (!(_a < STREAM_SYMBOLS_2.length)) return [3 /*break*/, 6];
                            symbol = STREAM_SYMBOLS_2[_a];
                            return [4 /*yield*/, Promise.all([
                                    (0, client_1.fetchKlines)(symbol, '5', 240),
                                    (0, client_1.fetchKlines)(symbol, '15', 240),
                                ])];
                        case 4:
                            _b = _c.sent(), candles5m = _b[0], candles15m = _b[1];
                            candlesRef.current[symbol] = __assign(__assign(__assign({}, emptyIntervalCandles()), candlesRef.current[symbol]), { '5': candles5m, '15': candles15m });
                            _c.label = 5;
                        case 5:
                            _a++;
                            return [3 /*break*/, 3];
                        case 6:
                            recomputeAllFromStore('REST');
                            if (cancelled)
                                return [2 /*return*/];
                            streamReadyRef.current = true;
                            setLiveTickersBySymbol(__assign({}, tickersRef.current));
                            pushState('REST', wsConnectedRef.current ? 'connected' : 'disconnected');
                            return [3 /*break*/, 8];
                        case 7:
                            err_1 = _c.sent();
                            if (cancelled)
                                return [2 /*return*/];
                            pushState('OFFLINE', wsConnectedRef.current ? 'reconnecting' : 'disconnected', err_1 instanceof Error ? err_1.message : 'Signal engine failed');
                            return [3 /*break*/, 8];
                        case 8: return [2 /*return*/];
                    }
                });
            });
        }
        function recomputeForSymbol(symbol, mode) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
            var symbolCandles = candlesRef.current[symbol];
            var ticker = tickersRef.current[symbol];
            if (!symbolCandles || !ticker || symbolCandles['15'].length < 60)
                return;
            var priorLifecycle = (_b = (_a = lifecycleRef.current["".concat(symbol, ":breakout")]) !== null && _a !== void 0 ? _a : lifecycleRef.current["".concat(symbol, ":pullback")]) !== null && _b !== void 0 ? _b : lifecycleRef.current["".concat(symbol, ":overextended")];
            var btc15 = (_d = (_c = candlesRef.current.BTCUSDT) === null || _c === void 0 ? void 0 : _c['15']) !== null && _d !== void 0 ? _d : [];
            var eth15 = (_f = (_e = candlesRef.current.ETHUSDT) === null || _e === void 0 ? void 0 : _e['15']) !== null && _f !== void 0 ? _f : [];
            if (btc15.length < 60 || eth15.length < 60)
                return;
            var regime = (0, signalDetectors_1.inferMarketRegime)({ btc15m: btc15, eth15m: eth15 });
            var signal = (0, signalDetectors_1.buildSignalFromMarket)({
                symbol: symbol,
                exchange: 'Bybit',
                ticker: ticker,
                candles15m: symbolCandles['15'],
                regime: regime,
                previousLifecycle: priorLifecycle,
            });
            if (!signal)
                return;
            var key = "".concat(symbol, ":").concat(signal.signal.setupType);
            var now = Date.now();
            var prev = lastSignalRef.current[key];
            var atrNow = Math.max(0.000001, (_g = (0, indicators_1.atr)(symbolCandles['15'], 14).at(-1)) !== null && _g !== void 0 ? _g : 1);
            var priceNow = ticker.lastPrice;
            var scoreImproved = prev ? signal.signal.setupScore - prev.setupScore >= SCORE_IMPROVE_BYPASS : false;
            var priceMoved = prev ? Math.abs(priceNow - prev.refPrice) / Math.max(prev.atr, 0.000001) >= ATR_MOVE_BYPASS : false;
            var cooldownPassed = !prev || now - prev.emittedAt >= COOLDOWN_MS;
            if (!(cooldownPassed || scoreImproved || priceMoved))
                return;
            lastSignalRef.current[key] = { emittedAt: now, setupScore: signal.signal.setupScore, refPrice: priceNow, atr: atrNow };
            signalBookRef.current[key] = signal.signal;
            lifecycleRef.current[key] = signal.lifecycle;
            (0, scannerDiagnostics_1.recordScannerDiagnostic)(__assign(__assign({ symbol: symbol, setupScore: signal.signal.setupScore }, {
                setupType: signal.signal.setupType,
                timingScore: (_h = signal.signal.timingScore) !== null && _h !== void 0 ? _h : 0,
                entryFreshnessScore: (_j = signal.signal.entryFreshnessScore) !== null && _j !== void 0 ? _j : 0,
                roomToTargetScore: (_k = signal.signal.roomToTargetScore) !== null && _k !== void 0 ? _k : 0,
                actionabilityScore: (_l = signal.signal.actionabilityScore) !== null && _l !== void 0 ? _l : 0,
                state: (_m = signal.signal.timingState) !== null && _m !== void 0 ? _m : 'developing',
                triggerType: (_o = signal.signal.triggerType) !== null && _o !== void 0 ? _o : 'unknown',
                idealEntryPrice: (_p = signal.signal.idealEntryPrice) !== null && _p !== void 0 ? _p : null,
                currentPrice: ticker.lastPrice,
                atrExtensionFromIdeal: signal.signal.idealEntryPrice && atrNow > 0
                    ? Math.abs(ticker.lastPrice - signal.signal.idealEntryPrice) / atrNow
                    : 0,
                candlesSinceTrigger: (_q = signal.signal.candlesSinceTrigger) !== null && _q !== void 0 ? _q : null,
                candlesSincePeakTiming: (_r = signal.signal.candlesSincePeakTiming) !== null && _r !== void 0 ? _r : null,
                penalties: (_s = signal.signal.penaltyBreakdown) !== null && _s !== void 0 ? _s : {
                    candlesLatePenalty: 0,
                    atrExtensionPenalty: 0,
                    percentExtensionPenalty: 0,
                    postTriggerImpulsePenalty: 0,
                    crowdedLevelPenalty: 0,
                    rrCompressionPenalty: 0,
                },
                positiveFactors: (_t = signal.signal.positiveTimingFactors) !== null && _t !== void 0 ? _t : [],
            }), { ts: now }));
            console.log("[Sigflo][Engine] detector triggered ".concat(symbol, " ").concat(signal.signal.setupType, " ").concat(signal.signal.setupScore, " state=").concat((_u = signal.signal.timingState) !== null && _u !== void 0 ? _u : 'n/a'));
            pushState(mode, wsConnectedRef.current ? 'connected' : 'disconnected');
        }
        function recomputeAllFromStore(mode) {
            for (var _i = 0, STREAM_SYMBOLS_3 = STREAM_SYMBOLS; _i < STREAM_SYMBOLS_3.length; _i++) {
                var symbol = STREAM_SYMBOLS_3[_i];
                recomputeForSymbol(symbol, mode);
            }
        }
        // WS stream:
        // - keep tickers fresh
        // - process closed candles only
        // - feed 15m closed bars through detector pipeline
        var ws = new bybitWsClient_1.BybitWsClient({
            klineSymbols: STREAM_SYMBOLS,
            tickerSymbols: STREAM_SYMBOLS,
            includeTickers: true,
            onLog: function (msg) { return console.log("[Sigflo][Engine] ".concat(msg)); },
            onConnectionChange: function (connection) {
                wsConnectedRef.current = connection === 'connected';
                if (connection === 'connected') {
                    void backfillFromRest('reconnect');
                    pushState('WS', 'connected');
                    return;
                }
                pushState(streamReadyRef.current ? 'REST' : 'OFFLINE', connection);
            },
            onTicker: function (ticker) {
                var mapped = wsTickerToSymbolTicker(ticker);
                tickersRef.current[ticker.symbol] = mapped;
                if (tickerFlushRafRef.current != null)
                    return;
                tickerFlushRafRef.current = window.requestAnimationFrame(function () {
                    tickerFlushRafRef.current = null;
                    setLiveTickersBySymbol(__assign({}, tickersRef.current));
                });
            },
            onKline: function (kline) {
                var interval = kline.interval;
                var symbol = kline.symbol;
                if (!candlesRef.current[symbol])
                    candlesRef.current[symbol] = emptyIntervalCandles();
                candlesRef.current[symbol][interval] = upsertCandle(candlesRef.current[symbol][interval], {
                    ts: kline.start,
                    open: kline.open,
                    high: kline.high,
                    low: kline.low,
                    close: kline.close,
                    volume: kline.volume,
                    isClosed: kline.confirm,
                });
                // Closed-candle event is the only trigger input for signal generation.
                if (!kline.confirm)
                    return;
                console.log("[Sigflo][Engine] closed candle received ".concat(symbol, " ").concat(interval));
                if (!streamReadyRef.current)
                    return;
                if (interval === '15')
                    recomputeForSymbol(symbol, 'WS');
            },
        });
        wsClientRef.current = ws;
        void backfillFromRest('startup').then(function () {
            ws.connect();
        });
        return function () {
            cancelled = true;
            if (tickerFlushRafRef.current != null) {
                window.cancelAnimationFrame(tickerFlushRafRef.current);
                tickerFlushRafRef.current = null;
            }
            ws.disconnect();
            wsClientRef.current = null;
        };
    }, []);
    (0, react_1.useEffect)(function () {
        var _a;
        (_a = wsClientRef.current) === null || _a === void 0 ? void 0 : _a.updateTickerSymbols(mergedTickerSymbols);
    }, [mergedTickerSymbols]);
    return (0, react_1.useMemo)(function () { return (__assign(__assign({}, state), { liveTickersBySymbol: liveTickersBySymbol, setScannerTickerExtras: setScannerTickerExtrasStable })); }, [state, liveTickersBySymbol, setScannerTickerExtrasStable]);
}
function SignalEngineProvider(_a) {
    var children = _a.children;
    var value = useSignalEngineValue();
    return <SignalEngineContext.Provider value={value}>{children}</SignalEngineContext.Provider>;
}
function useSignalEngine() {
    var ctx = (0, react_1.useContext)(SignalEngineContext);
    if (ctx == null) {
        throw new Error('useSignalEngine must be used within SignalEngineProvider.');
    }
    return ctx;
}
