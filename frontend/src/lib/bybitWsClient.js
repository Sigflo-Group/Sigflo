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
exports.BybitWsClient = void 0;
var WS_URL = 'wss://stream.bybit.com/v5/public/linear';
function toNum(v) {
    if (typeof v === 'number')
        return v;
    if (typeof v === 'string')
        return Number(v);
    return 0;
}
var BybitWsClient = /** @class */ (function () {
    function BybitWsClient(options) {
        var _a, _b;
        this.ws = null;
        this.reconnectTimer = null;
        this.reconnectAttempt = 0;
        this.running = false;
        this.options = options;
        var kline = (_a = options.klineSymbols) !== null && _a !== void 0 ? _a : options.symbols;
        if (!kline || kline.length === 0) {
            throw new Error('BybitWsClient: provide klineSymbols or symbols');
        }
        this.klineSymbols = __spreadArray([], kline, true);
        this.tickerSymbols = __spreadArray([], ((_b = options.tickerSymbols) !== null && _b !== void 0 ? _b : kline), true);
    }
    /** Add/remove ticker-only subscriptions while keeping kline topics unchanged. */
    BybitWsClient.prototype.updateTickerSymbols = function (next) {
        var merged = __spreadArray([], new Set(next), true);
        var prev = this.tickerSymbols;
        this.tickerSymbols = merged;
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN)
            return;
        if (!this.options.includeTickers)
            return;
        var toUnsub = prev.filter(function (s) { return !merged.includes(s); }).map(function (s) { return "ticker.".concat(s); });
        var toSub = merged.filter(function (s) { return !prev.includes(s); }).map(function (s) { return "ticker.".concat(s); });
        if (toUnsub.length) {
            this.ws.send(JSON.stringify({ op: 'unsubscribe', args: toUnsub }));
            this.log("[WS] ticker unsubscribe: ".concat(toUnsub.join(', ')));
        }
        if (toSub.length) {
            this.ws.send(JSON.stringify({ op: 'subscribe', args: toSub }));
            this.log("[WS] ticker subscribe: ".concat(toSub.join(', ')));
        }
    };
    BybitWsClient.prototype.connect = function () {
        this.running = true;
        this.openSocket();
    };
    BybitWsClient.prototype.disconnect = function () {
        var _a, _b, _c;
        this.running = false;
        if (this.reconnectTimer != null) {
            window.clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        (_b = (_a = this.options).onConnectionChange) === null || _b === void 0 ? void 0 : _b.call(_a, 'disconnected');
        (_c = this.ws) === null || _c === void 0 ? void 0 : _c.close();
        this.ws = null;
    };
    BybitWsClient.prototype.log = function (msg) {
        var _a, _b;
        (_b = (_a = this.options).onLog) === null || _b === void 0 ? void 0 : _b.call(_a, msg);
    };
    BybitWsClient.prototype.openSocket = function () {
        var _this = this;
        this.log('[WS] connecting');
        var ws = new WebSocket(WS_URL);
        this.ws = ws;
        ws.onopen = function () {
            var _a, _b;
            _this.reconnectAttempt = 0;
            (_b = (_a = _this.options).onConnectionChange) === null || _b === void 0 ? void 0 : _b.call(_a, 'connected');
            _this.log('[WS] connected');
            _this.subscribe();
        };
        ws.onmessage = function (event) {
            var _a;
            try {
                var msg = JSON.parse(String(event.data));
                var topic = String((_a = msg.topic) !== null && _a !== void 0 ? _a : '');
                var data = msg.data;
                if (!topic || !data)
                    return;
                if (topic.startsWith('kline.'))
                    _this.handleKline(topic, data);
                if (topic.startsWith('ticker.'))
                    _this.handleTicker(topic, data);
                if (topic.startsWith('publicTrade.'))
                    _this.handlePublicTrade(topic, data);
            }
            catch (_b) {
                // Ignore malformed payloads.
            }
        };
        ws.onclose = function () {
            var _a, _b;
            _this.ws = null;
            if (!_this.running)
                return;
            (_b = (_a = _this.options).onConnectionChange) === null || _b === void 0 ? void 0 : _b.call(_a, 'reconnecting');
            _this.reconnectAttempt += 1;
            var wait = Math.min(30000, 1000 * Math.pow(2, Math.min(5, _this.reconnectAttempt)));
            _this.log("[WS] reconnect attempt ".concat(_this.reconnectAttempt, " in ").concat(wait, "ms"));
            _this.reconnectTimer = window.setTimeout(function () { return _this.openSocket(); }, wait);
        };
        ws.onerror = function () {
            _this.log('[WS] error');
        };
    };
    BybitWsClient.prototype.subscribe = function () {
        var _a;
        if (!this.ws)
            return;
        var intervals = (_a = this.options.klineIntervals) !== null && _a !== void 0 ? _a : ['5', '15'];
        var klineTopics = this.klineSymbols.flatMap(function (symbol) { return intervals.map(function (i) { return "kline.".concat(i, ".").concat(symbol); }); });
        var tickerTopics = this.options.includeTickers ? this.tickerSymbols.map(function (symbol) { return "ticker.".concat(symbol); }) : [];
        var tradeTopics = this.options.includePublicTrades
            ? this.klineSymbols.map(function (symbol) { return "publicTrade.".concat(symbol); })
            : [];
        var args = __spreadArray(__spreadArray(__spreadArray([], klineTopics, true), tickerTopics, true), tradeTopics, true);
        this.ws.send(JSON.stringify({ op: 'subscribe', args: args }));
        this.log("[WS] subscriptions active: ".concat(args.length, " topics"));
    };
    BybitWsClient.prototype.handleKline = function (topic, data) {
        var _a, _b;
        var parts = topic.split('.');
        var interval = parts[1];
        var symbol = parts[2];
        var rows = Array.isArray(data) ? data : [];
        for (var _i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
            var row = rows_1[_i];
            var kline = {
                symbol: symbol,
                interval: interval,
                start: toNum(row.start),
                end: toNum(row.end),
                open: toNum(row.open),
                high: toNum(row.high),
                low: toNum(row.low),
                close: toNum(row.close),
                volume: toNum(row.volume),
                confirm: Boolean(row.confirm),
                timestamp: toNum(row.timestamp),
            };
            (_b = (_a = this.options).onKline) === null || _b === void 0 ? void 0 : _b.call(_a, kline);
        }
    };
    BybitWsClient.prototype.handleTicker = function (topic, data) {
        var _a, _b, _c;
        var symbol = (_a = topic.split('.')[1]) !== null && _a !== void 0 ? _a : '';
        var row = (Array.isArray(data) ? data[0] : data);
        if (!row)
            return;
        var markPx = toNum(row.markPrice);
        var indexPx = toNum(row.indexPrice);
        (_c = (_b = this.options).onTicker) === null || _c === void 0 ? void 0 : _c.call(_b, __assign(__assign({ symbol: symbol, lastPrice: toNum(row.lastPrice), markPrice: Number.isFinite(markPx) && markPx > 0 ? markPx : 0 }, (Number.isFinite(indexPx) && indexPx > 0 ? { indexPrice: indexPx } : {})), { high24h: toNum(row.highPrice24h), low24h: toNum(row.lowPrice24h), volume24h: toNum(row.volume24h), turnover24h: toNum(row.turnover24h), price24hPcnt: toNum(row.price24hPcnt) }));
    };
    /** One callback per WS message using the newest trade in the batch (`data` sorted ascending by time). */
    BybitWsClient.prototype.handlePublicTrade = function (topic, data) {
        var _a, _b;
        var symbol = topic.startsWith('publicTrade.') ? topic.slice('publicTrade.'.length) : '';
        if (!symbol)
            return;
        var rows = Array.isArray(data) ? data : [];
        if (rows.length === 0)
            return;
        var last = rows[rows.length - 1];
        var price = toNum(last.p);
        if (!(price > 0))
            return;
        var ts = toNum(last.T);
        (_b = (_a = this.options).onPublicTrade) === null || _b === void 0 ? void 0 : _b.call(_a, { symbol: symbol, price: price, ts: ts });
    };
    return BybitWsClient;
}());
exports.BybitWsClient = BybitWsClient;
