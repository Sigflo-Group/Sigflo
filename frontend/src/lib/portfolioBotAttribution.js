"use strict";
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
exports.portfolioNetEquityUsd = portfolioNetEquityUsd;
exports.portfolioHasConnectedExchange = portfolioHasConnectedExchange;
exports.linearSymbolBase = linearSymbolBase;
exports.botOwnsSymbolBase = botOwnsSymbolBase;
exports.attributeBotNameForSymbol = attributeBotNameForSymbol;
exports.closedTradesSinceUtc = closedTradesSinceUtc;
exports.utcDayStartMs = utcDayStartMs;
exports.buildBotDayStats = buildBotDayStats;
exports.closedPnlAsEquityPct = closedPnlAsEquityPct;
exports.buildBotCardExchangeStats = buildBotCardExchangeStats;
var STABLE_ASSETS = new Set(['USDT', 'USDC', 'USD', 'BUSD', 'DAI', 'TUSD', 'FDUSD', 'USDE']);
function equityUsdForSnapshot(s) {
    var _a, _b, _c;
    if (s.status !== 'connected')
        return 0;
    var te = (_b = (_a = s.accountBreakdown) === null || _a === void 0 ? void 0 : _a.overview) === null || _b === void 0 ? void 0 : _b.totalEquity;
    if (te != null && Number.isFinite(te) && te > 0)
        return te;
    var st = 0;
    for (var _i = 0, _d = s.balances; _i < _d.length; _i++) {
        var b = _d[_i];
        if (STABLE_ASSETS.has(b.asset.toUpperCase()))
            st += b.total;
    }
    var up = 0;
    for (var _e = 0, _f = s.positions; _e < _f.length; _e++) {
        var p = _f[_e];
        up += (_c = p.unrealizedPnl) !== null && _c !== void 0 ? _c : 0;
    }
    return Math.max(0, st + up);
}
/** Sum of equity across connected exchange snapshots (for PnL % scaling). */
function portfolioNetEquityUsd(snapshots) {
    var sum = 0;
    for (var _i = 0, snapshots_1 = snapshots; _i < snapshots_1.length; _i++) {
        var s = snapshots_1[_i];
        sum += equityUsdForSnapshot(s);
    }
    return sum;
}
function portfolioHasConnectedExchange(snapshots) {
    return snapshots.some(function (s) { return s.status === 'connected'; });
}
/** Base asset for linear-style symbols (e.g. BTCUSDT → BTC). */
function linearSymbolBase(symbol) {
    var u = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
    var quotes = ['USDT', 'USDC', 'USD', 'BUSD', 'USDE', 'PERP'];
    for (var _i = 0, quotes_1 = quotes; _i < quotes_1.length; _i++) {
        var q = quotes_1[_i];
        if (u.endsWith(q) && u.length > q.length)
            return u.slice(0, -q.length);
    }
    return u || symbol;
}
function watchedBaseSet(bot) {
    return new Set(bot.watchedPairs.map(function (w) { return linearSymbolBase(w); }));
}
function botOwnsSymbolBase(bot, symbol) {
    return watchedBaseSet(bot).has(linearSymbolBase(symbol));
}
/** Pick a display bot for a symbol (first match in list order). */
function attributeBotNameForSymbol(symbol, bots) {
    var b = linearSymbolBase(symbol);
    for (var _i = 0, bots_1 = bots; _i < bots_1.length; _i++) {
        var bot = bots_1[_i];
        if (watchedBaseSet(bot).has(b))
            return bot.name;
    }
    return 'Portfolio';
}
function closedTradesSinceUtc(closed, sinceMs) {
    return closed.filter(function (t) { return new Date(t.closedAt).getTime() >= sinceMs; });
}
function utcDayStartMs(d) {
    if (d === void 0) { d = new Date(); }
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}
function buildBotDayStats(bots, closedToday) {
    return bots.map(function (bot) {
        var rows = closedToday.filter(function (t) { return botOwnsSymbolBase(bot, t.symbol); });
        var dailyPnl = rows.reduce(function (s, t) { return s + t.closedPnl; }, 0);
        var settled = rows.filter(function (t) { return Math.abs(t.closedPnl) >= 1e-8; });
        var wins = settled.filter(function (t) { return t.closedPnl > 0; }).length;
        var winRatePct = settled.length > 0 ? Math.round((wins / settled.length) * 100) : null;
        return {
            botId: bot.id,
            name: bot.name,
            dailyPnl: dailyPnl,
            tradesToday: rows.length,
            winRatePct: winRatePct,
            seedWinRatePct: bot.stats.winRatePct,
        };
    });
}
/** Approximate % impact vs equity for a closed PnL row (no per-trade notional in API). */
function closedPnlAsEquityPct(closedPnl, equityUsd) {
    var base = Math.max(100, Math.abs(equityUsd) * 0.004);
    return (closedPnl / base) * 100;
}
function buildBotCardExchangeStats(bot, closedTrades, equityUsd) {
    var attributed = closedTrades.filter(function (t) { return botOwnsSymbolBase(bot, t.symbol); });
    var tradesToday = closedTradesSinceUtc(attributed, utcDayStartMs()).length;
    var settled = attributed.filter(function (t) { return Math.abs(t.closedPnl) >= 1e-8; });
    var wins = settled.filter(function (t) { return t.closedPnl > 0; }).length;
    var winRatePct = settled.length > 0 ? Math.round((wins / settled.length) * 100) : null;
    var sorted = __spreadArray([], attributed, true).sort(function (a, b) { return new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime(); });
    var last = sorted[0];
    var lastResultPct = last != null ? closedPnlAsEquityPct(last.closedPnl, equityUsd) : null;
    return { tradesToday: tradesToday, winRatePct: winRatePct, lastResultPct: lastResultPct };
}
