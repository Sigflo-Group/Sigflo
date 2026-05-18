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
exports.default = PortfolioScreen;
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var appRoutes_1 = require("@/config/appRoutes");
var useAccountSnapshot_1 = require("@/hooks/useAccountSnapshot");
var useBotStatuses_1 = require("@/hooks/useBotStatuses");
var useBotUserConfig_1 = require("@/hooks/useBotUserConfig");
var useFeedMiniCharts_1 = require("@/hooks/useFeedMiniCharts");
var useSignalEngine_1 = require("@/hooks/useSignalEngine");
var formatQuote_1 = require("@/lib/formatQuote");
var portfolioBotAttribution_1 = require("@/lib/portfolioBotAttribution");
var portfolioPositionAi_1 = require("@/lib/portfolioPositionAi");
var positionBiasStat_1 = require("@/lib/positionBiasStat");
var positionMicroInsight_1 = require("@/lib/positionMicroInsight");
var marketScannerRows_1 = require("@/lib/marketScannerRows");
var tradeNavigation_1 = require("@/lib/tradeNavigation");
var bots_1 = require("@/lib/bots");
var exchangeTransferUrls_1 = require("@/lib/exchangeTransferUrls");
var PORTFOLIO_MINI_INTERVAL = '15';
var ACCENT = '#00C878';
var PAGE_BG = '#0F1115';
var SURFACE = '#171A20';
var STABLE_ASSETS = new Set(['USDT', 'USDC', 'USD', 'BUSD', 'DAI', 'TUSD', 'FDUSD', 'USDE']);
function aggregateStablesAndPnl(snapshots) {
    var _a;
    var unrealized = 0;
    var connected = false;
    for (var _i = 0, snapshots_1 = snapshots; _i < snapshots_1.length; _i++) {
        var s = snapshots_1[_i];
        if (s.status !== 'connected')
            continue;
        connected = true;
        for (var _b = 0, _c = s.positions; _b < _c.length; _b++) {
            var p = _c[_b];
            unrealized += (_a = p.unrealizedPnl) !== null && _a !== void 0 ? _a : 0;
        }
    }
    return { unrealized: unrealized, connected: connected };
}
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
function totalPortfolioEquityUsd(snapshots) {
    var sum = 0;
    for (var _i = 0, snapshots_2 = snapshots; _i < snapshots_2.length; _i++) {
        var s = snapshots_2[_i];
        sum += equityUsdForSnapshot(s);
    }
    return sum;
}
function flattenPositions(snapshots) {
    var out = [];
    for (var _i = 0, snapshots_3 = snapshots; _i < snapshots_3.length; _i++) {
        var s = snapshots_3[_i];
        if (s.status !== 'connected')
            continue;
        for (var _a = 0, _b = s.positions; _a < _b.length; _a++) {
            var p = _b[_a];
            out.push(__assign(__assign({}, p), { exchange: s.exchange }));
        }
    }
    return out;
}
function positionNotionalUsd(p) {
    return Math.abs(p.size * p.entryPrice);
}
function formatUsd2(n) {
    return Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtSignedUsd(n) {
    var sign = n >= 0 ? '+' : '−';
    return "".concat(sign, "$").concat(formatUsd2(n));
}
function fmtSignedPct(n) {
    var sign = n >= 0 ? '+' : '−';
    return "".concat(sign).concat(Math.abs(n).toFixed(1), "%");
}
function pairLabel(symbol) {
    if (symbol.endsWith('USDT'))
        return "".concat((0, marketScannerRows_1.symbolToPair)(symbol), " / USDT");
    return symbol;
}
function candleCloses(candles) {
    if (!(candles === null || candles === void 0 ? void 0 : candles.length))
        return [];
    return candles.map(function (k) { return k.close; }).filter(function (n) { return Number.isFinite(n); });
}
function sparkPositiveFromCloses(closes) {
    if (closes.length < 2)
        return true;
    var a = closes[0];
    var b = closes[closes.length - 1];
    return b >= a;
}
function sparklinePath(values, w, h) {
    if (values.length < 2)
        return { line: '', area: '' };
    var min = Math.min.apply(Math, values);
    var max = Math.max.apply(Math, values);
    var span = max - min || 1;
    var pts = values.map(function (v, i) {
        var x = (i / (values.length - 1)) * w;
        var y = h - ((v - min) / span) * (h * 0.72) - h * 0.14;
        return [x, y];
    });
    var line = pts.map(function (_a, i) {
        var x = _a[0], y = _a[1];
        return "".concat(i === 0 ? 'M' : 'L').concat(x.toFixed(1), ",").concat(y.toFixed(1));
    }).join(' ');
    var area = "".concat(line, " L").concat(w, ",").concat(h, " L0,").concat(h, " Z");
    return { line: line, area: area };
}
function buildSparklineSeries(netWorth, up) {
    var n = 36;
    var out = [];
    var v = netWorth * (up ? 0.94 : 1.04);
    for (var i = 0; i < n; i++) {
        var pull = (netWorth - v) * 0.11;
        v += pull + Math.sin(i * 0.55) * netWorth * 0.0015;
        out.push(v);
    }
    out[n - 1] = netWorth;
    return out;
}
/** Synthetic mark path from entry → current for a position mini chart. */
function buildPositionMarkSeries(entryPrice, markPrice, points) {
    if (points === void 0) { points = 26; }
    if (!Number.isFinite(entryPrice) || entryPrice <= 0 || !Number.isFinite(markPrice) || markPrice <= 0) {
        return Array.from({ length: points }, function (_, i) { return 1 + i * 0.02; });
    }
    var out = [];
    for (var i = 0; i < points; i++) {
        var t = i / (points - 1);
        var base = entryPrice + (markPrice - entryPrice) * t;
        var wobble = Math.sin(i * 0.75) * entryPrice * 0.0028;
        out.push(base + wobble);
    }
    out[points - 1] = markPrice;
    return out;
}
function MiniPortfolioSpark(_a) {
    var series = _a.series, positive = _a.positive, _b = _a.w, w = _b === void 0 ? 124 : _b, _c = _a.h, h = _c === void 0 ? 42 : _c, _d = _a.className, className = _d === void 0 ? '' : _d;
    var uid = (0, react_1.useId)().replace(/[^a-zA-Z0-9]/g, '');
    var gradId = "pf-ms-".concat(uid);
    var stroke = positive ? ACCENT : '#f87171';
    var _e = (0, react_1.useMemo)(function () { return sparklinePath(series, w, h); }, [series, w, h]), line = _e.line, area = _e.area;
    if (!line)
        return <div className={"shrink-0 ".concat(className)} style={{ width: w, height: h }} aria-hidden/>;
    return (<div className={"shrink-0 overflow-hidden rounded-lg bg-[#08090d] ring-1 ring-white/[0.05] ".concat(className)} style={{ width: w, height: h }} aria-hidden>
      <svg viewBox={"0 0 ".concat(w, " ").concat(h)} width={w} height={h} className="block h-full w-full">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.2"/>
            <stop offset="100%" stopColor={stroke} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {area ? <path d={area} fill={"url(#".concat(gradId, ")")}/> : null}
        <path d={line} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
      </svg>
    </div>);
}
function SectionTitle(_a) {
    var children = _a.children;
    return (<h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">{children}</h2>);
}
function CardShell(_a) {
    var children = _a.children, _b = _a.className, className = _b === void 0 ? '' : _b, _c = _a.glow, glow = _c === void 0 ? false : _c;
    return (<div className={"landing-panel-texture rounded-2xl border border-white/[0.06] p-4 transition-shadow duration-300 ".concat(className)} style={{
            backgroundColor: SURFACE,
            boxShadow: glow
                ? "0 0 0 1px rgba(0,200,120,0.12), 0 12px 40px -16px rgba(0,200,120,0.18)"
                : '0 8px 32px -20px rgba(0,0,0,0.5)',
        }}>
      {children}
    </div>);
}
function PortfolioScreen() {
    var navigate = (0, react_router_dom_1.useNavigate)();
    var _a = (0, useAccountSnapshot_1.useAccountSnapshot)({ pollMs: 12000 }), snapshots = _a.items, closedTrades = _a.closedTrades, loading = _a.loading;
    var _b = (0, useSignalEngine_1.useSignalEngine)(), liveTickersBySymbol = _b.liveTickersBySymbol, scannerSignals = _b.signals;
    var mergeBot = (0, useBotUserConfig_1.useBotUserConfig)().mergeBot;
    var statusMap = (0, useBotStatuses_1.useBotStatuses)().statusMap;
    var mergedBots = (0, react_1.useMemo)(function () { return bots_1.baseBots.map(mergeBot); }, [mergeBot]);
    var _c = (0, react_1.useMemo)(function () { return aggregateStablesAndPnl(snapshots); }, [snapshots]), unrealized = _c.unrealized, connected = _c.connected;
    var positions = (0, react_1.useMemo)(function () { return flattenPositions(snapshots); }, [snapshots]);
    var positionPairKeys = (0, react_1.useMemo)(function () { return __spreadArray([], new Set(positions.map(function (p) { return (0, marketScannerRows_1.symbolToPair)(p.symbol).toUpperCase(); })), true); }, [positions]);
    var botChartPairs = (0, react_1.useMemo)(function () { return mergedBots.map(function (b) { var _a; return ((_a = b.watchedPairs[0]) !== null && _a !== void 0 ? _a : 'BTC').toUpperCase(); }); }, [mergedBots]);
    var miniChartPairs = (0, react_1.useMemo)(function () { return __spreadArray([], new Set(__spreadArray(__spreadArray(['BTC'], positionPairKeys, true), botChartPairs, true)), true); }, [positionPairKeys, botChartPairs]);
    var miniCandles = (0, useFeedMiniCharts_1.useFeedMiniCharts)(miniChartPairs, {
        interval: PORTFOLIO_MINI_INTERVAL,
        fastPairs: positionPairKeys,
        refreshMs: 45000,
        fastRefreshMs: 12000,
    });
    var netWorth = (0, react_1.useMemo)(function () { return (connected ? totalPortfolioEquityUsd(snapshots) : 0); }, [connected, snapshots]);
    var dayStartMs = (0, react_1.useMemo)(function () { return (0, portfolioBotAttribution_1.utcDayStartMs)(); }, []);
    var closedToday = (0, react_1.useMemo)(function () { return (0, portfolioBotAttribution_1.closedTradesSinceUtc)(closedTrades, dayStartMs); }, [closedTrades, dayStartMs]);
    var todayPnl = (0, react_1.useMemo)(function () { return (connected ? closedToday.reduce(function (s, t) { return s + t.closedPnl; }, 0) : 0); }, [connected, closedToday]);
    var todayPct = (0, react_1.useMemo)(function () {
        if (!connected)
            return 0;
        var denom = Math.max(Math.abs(netWorth - todayPnl), Math.max(Math.abs(netWorth), 1));
        return (todayPnl / denom) * 100;
    }, [connected, netWorth, todayPnl]);
    var managingBotsCount = (0, react_1.useMemo)(function () {
        return bots_1.baseBots.filter(function (b) {
            var _a;
            var s = (_a = statusMap[b.id]) !== null && _a !== void 0 ? _a : b.status;
            return s === 'active' || s === 'scanning';
        }).length;
    }, [statusMap]);
    var botDayStats = (0, react_1.useMemo)(function () { return (0, portfolioBotAttribution_1.buildBotDayStats)(mergedBots, closedToday); }, [mergedBots, closedToday]);
    var overviewSparkSeries = (0, react_1.useMemo)(function () {
        var btc = candleCloses(miniCandles['BTC']);
        if (btc.length >= 2)
            return btc;
        var nw = connected ? netWorth : 2500;
        var up = connected ? todayPnl >= 0 : true;
        return buildSparklineSeries(Math.max(nw, 0.01), up);
    }, [miniCandles, connected, netWorth, todayPnl]);
    var _d = (0, react_1.useMemo)(function () { return sparklinePath(overviewSparkSeries, 320, 72); }, [overviewSparkSeries]), sparkPath = _d.line, sparkArea = _d.area;
    var overviewSparkStroke = (0, react_1.useMemo)(function () {
        if (overviewSparkSeries.length < 2)
            return ACCENT;
        return sparkPositiveFromCloses(overviewSparkSeries) ? ACCENT : '#fb7185';
    }, [overviewSparkSeries]);
    var historyRows = (0, react_1.useMemo)(function () {
        var sorted = __spreadArray([], closedTrades, true).sort(function (a, b) { return new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime(); });
        return sorted.slice(0, 10);
    }, [closedTrades]);
    var realizedPnlByExchangeSymbol = (0, react_1.useMemo)(function () {
        var _a;
        var map = new Map();
        for (var _i = 0, closedTrades_1 = closedTrades; _i < closedTrades_1.length; _i++) {
            var t = closedTrades_1[_i];
            var key = "".concat(t.exchange, ":").concat(t.symbol);
            map.set(key, ((_a = map.get(key)) !== null && _a !== void 0 ? _a : 0) + t.closedPnl);
        }
        return map;
    }, [closedTrades]);
    var displayNet = connected ? netWorth : null;
    var displayToday = connected ? todayPnl : null;
    var displayTodayPct = connected ? todayPct : null;
    return (<div className="min-h-[100dvh] scroll-smooth pb-28 pt-4" style={{ backgroundColor: PAGE_BG }}>
      <div className="mx-auto w-full max-w-lg space-y-6 px-4">
        {/* 1. Overview */}
        <CardShell glow className="relative overflow-hidden">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Total balance</p>
          {loading && connected ? (<p className="mt-2 font-mono text-3xl font-bold text-white/40">…</p>) : displayNet != null ? (<p className="mt-2 font-mono text-3xl font-bold tracking-tight text-white">${formatUsd2(displayNet)}</p>) : (<p className="mt-2 font-mono text-3xl font-bold tracking-tight text-white/50">$—</p>)}

          {displayToday != null && displayTodayPct != null ? (<div className="mt-3 flex flex-wrap items-baseline gap-2">
              <p className={"text-lg font-bold tabular-nums ".concat(displayToday >= 0 ? '' : 'text-rose-300')} style={{ color: displayToday >= 0 ? ACCENT : undefined }}>
                {fmtSignedUsd(displayToday)}
              </p>
              <p className={"text-sm font-semibold tabular-nums ".concat(displayToday >= 0 ? 'text-emerald-200/90' : 'text-rose-200/90')}>
                {fmtSignedPct(displayTodayPct)} today
              </p>
            </div>) : (<p className="mt-3 text-sm text-white/45">Connect your exchange to track daily PnL.</p>)}

          <div className="mt-4 overflow-hidden rounded-xl bg-[#08090d] px-1 py-1 ring-1 ring-white/[0.04]">
            <svg viewBox="0 0 320 72" className="h-[72px] w-full" aria-hidden>
              <defs>
                <linearGradient id="pf-spark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={overviewSparkStroke} stopOpacity="0.22"/>
                  <stop offset="100%" stopColor={overviewSparkStroke} stopOpacity="0"/>
                </linearGradient>
              </defs>
              {sparkArea ? <path d={sparkArea} fill="url(#pf-spark)"/> : null}
              {sparkPath ? (<path d={sparkPath} fill="none" stroke={overviewSparkStroke} strokeWidth="1.75" strokeLinecap="round" className={overviewSparkStroke === ACCENT
                ? 'drop-shadow-[0_0_10px_rgba(0,200,120,0.35)]'
                : 'drop-shadow-[0_0_10px_rgba(248,113,113,0.28)]'}/>) : null}
            </svg>
          </div>

          <p className="mt-4 text-center text-[12px] font-medium text-white/55">
            {positions.length} active position{positions.length === 1 ? '' : 's'} · {managingBotsCount} bot
            {managingBotsCount === 1 ? '' : 's'} managing trades
          </p>
          {!connected ? (<p className="mt-2 text-center text-[11px] text-white/40">
              <react_router_dom_1.Link to="/profile" className="font-semibold underline decoration-white/25 underline-offset-2" style={{ color: ACCENT }}>
                Link account
              </react_router_dom_1.Link>{' '}
              for live balances.
            </p>) : null}
        </CardShell>

        {/* 2. Active positions */}
        <section className="space-y-3">
          <SectionTitle>Active positions</SectionTitle>
          {!connected ? (<CardShell>
              <p className="text-sm text-white/55">
                No exchange linked — connect in{' '}
                <react_router_dom_1.Link to="/profile" className="font-semibold" style={{ color: ACCENT }}>
                  Account
                </react_router_dom_1.Link>
                .
              </p>
            </CardShell>) : null}
          {connected && loading ? <p className="text-sm text-white/45">Syncing positions…</p> : null}
          {connected && !loading && positions.length === 0 ? (<CardShell>
              <p className="text-base font-semibold text-white">Flat book</p>
              <p className="mt-1 text-sm text-white/50">No open risk — scan Feed when you are ready.</p>
              <react_router_dom_1.Link to={(0, appRoutes_1.feedActionablePath)()} className="mt-4 inline-flex w-full items-center justify-center rounded-xl py-3 text-sm font-bold text-[#0a1614]" style={{ backgroundColor: ACCENT, boxShadow: "0 0 24px -8px ".concat(ACCENT) }}>
                View setups
              </react_router_dom_1.Link>
            </CardShell>) : null}

          {connected && !loading && positions.length > 0 ? (<div className="space-y-4">
              {positions.map(function (p) {
                var _a, _b, _c, _d;
                var current = (_a = p.markPrice) !== null && _a !== void 0 ? _a : p.entryPrice;
                var pnl = (_b = p.unrealizedPnl) !== null && _b !== void 0 ? _b : 0;
                var pnlPct = p.entryPrice > 0
                    ? ((p.side === 'long' ? current - p.entryPrice : p.entryPrice - current) / p.entryPrice) * 100
                    : 0;
                var up = pnl >= 0;
                var realizedPnl = (_c = realizedPnlByExchangeSymbol.get("".concat(p.exchange, ":").concat(p.symbol))) !== null && _c !== void 0 ? _c : 0;
                var realizedUp = realizedPnl >= 0;
                var ticker = liveTickersBySymbol[p.symbol];
                var insight = (0, positionMicroInsight_1.positionMicroInsight)({ side: p.side }, current, pnlPct, ticker);
                var notional = positionNotionalUsd(p);
                var aiStatus = (0, portfolioPositionAi_1.derivePositionAiExitStatus)({
                    pnlPct: pnlPct,
                    unrealizedUsd: pnl,
                    position: p,
                });
                var aiMeta = (0, portfolioPositionAi_1.positionAiExitMeta)(aiStatus);
                var tradeExtras = p.entryPrice > 0
                    ? __assign({ positionUsd: Math.max(1, Math.round(notional)), entryPrice: p.entryPrice, posSize: p.size, markPrice: current }, (p.leverage != null && p.leverage > 0 ? { leverage: p.leverage } : {})) : undefined;
                var baseQuery = (0, tradeNavigation_1.buildPortfolioPositionTradeQuery)(p.symbol, p.side, tradeExtras);
                var adjustQuery = (0, tradeNavigation_1.buildPortfolioPositionTradeQuery)(p.symbol, p.side, __assign(__assign({}, tradeExtras), { focusAdjust: true }));
                var closeQuery = (0, tradeNavigation_1.buildPortfolioPositionTradeQuery)(p.symbol, p.side, __assign(__assign({}, tradeExtras), { ticketIntent: 'close' }));
                var pairKey = (0, marketScannerRows_1.symbolToPair)(p.symbol).toUpperCase();
                var positionBiasStat = (0, positionBiasStat_1.positionBiasForLinearSymbol)(p.symbol, p.side, scannerSignals);
                var liveCloses = candleCloses(miniCandles[pairKey]);
                var hasLiveMini = liveCloses.length >= 2;
                var positionSparkSeries = hasLiveMini
                    ? liveCloses
                    : buildPositionMarkSeries(p.entryPrice, current);
                var positionSparkPositive = hasLiveMini
                    ? sparkPositiveFromCloses(liveCloses)
                    : up;
                return (<CardShell key={"".concat(p.exchange, "-").concat(p.symbol, "-").concat(p.side, "-").concat((_d = p.positionIdx) !== null && _d !== void 0 ? _d : 0)} glow={up && pnlPct >= 0.5} className={"!p-3 border-white/[0.07] ".concat(up ? 'ring-1 ring-[#00C878]/15' : 'ring-1 ring-rose-500/10')}>
                    <button type="button" onClick={function () { return navigate("/trade?".concat(baseQuery)); }} className="w-full text-left">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-bold tracking-tight text-white">{pairLabel(p.symbol)}</p>
                          <p className="mt-0 text-[10px] font-medium uppercase tracking-wider text-white/35">
                            {p.exchange}
                          </p>
                          {notional >= 1 ? (<p className="mt-1 text-[11px] text-white/50">
                              Size{' '}
                              <span className="font-semibold text-white/85">
                                ${Math.round(notional).toLocaleString('en-US')}
                              </span>
                            </p>) : null}
                          <div className="mt-1">
                            <p className={"font-mono text-2xl font-bold tabular-nums tracking-tight ".concat(up ? '' : 'text-rose-300')} style={{ color: up ? ACCENT : undefined }}>
                              {fmtSignedUsd(pnl)}
                            </p>
                            <p className={"mt-0.5 font-mono text-base font-semibold tabular-nums text-white/70"}>
                              {fmtSignedPct(pnlPct)} live
                            </p>
                            <p className={"mt-0.5 font-mono text-[11px] font-semibold tabular-nums ".concat(realizedUp ? 'text-emerald-200/90' : 'text-rose-200/90')}>
                              {fmtSignedUsd(realizedPnl)} realized
                            </p>
                          </div>
                          <p className="mt-1 text-[11px] text-white/45">
                            {(0, formatQuote_1.formatQuoteNumber)(p.entryPrice)} → {(0, formatQuote_1.formatQuoteNumber)(current)}
                          </p>
                        </div>
                        {positionBiasStat ? (<div className="ml-auto flex w-fit max-w-[min(100%,15rem)] shrink-0 flex-col items-stretch gap-1.5 rounded-lg border border-white/[0.06] bg-black/25 px-2 py-1.5">
                            <div className="flex items-center justify-end gap-1.5">
                              <MiniPortfolioSpark series={positionSparkSeries} positive={positionSparkPositive} w={120} h={40}/>
                              <span className={"shrink-0 self-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ".concat(p.side === 'long'
                            ? 'bg-emerald-500/20 text-emerald-200'
                            : 'bg-rose-500/20 text-rose-200')}>
                                {p.side === 'long' ? 'Long' : 'Short'}
                              </span>
                            </div>
                            <div className="flex flex-col items-end border-t border-white/[0.08] pt-1.5 text-right">
                              <div className="flex items-baseline justify-end gap-1.5">
                                <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-white/35">
                                  Bias
                                </span>
                                <p className={"min-w-0 text-[11px] font-bold leading-none ".concat(positionBiasStat.variant === 'aligned'
                            ? 'text-emerald-200/95'
                            : positionBiasStat.variant === 'counter'
                                ? 'text-amber-200/95'
                                : 'text-white/75')}>
                                  {positionBiasStat.title}
                                </p>
                              </div>
                              <p className="mt-0.5 max-w-full text-[10px] leading-snug text-white/45">
                                {positionBiasStat.subtitle}
                              </p>
                            </div>
                          </div>) : (<div className="flex shrink-0 items-start gap-1.5">
                            <MiniPortfolioSpark series={positionSparkSeries} positive={positionSparkPositive} w={120} h={40}/>
                            <span className={"shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ".concat(p.side === 'long'
                            ? 'bg-emerald-500/20 text-emerald-200'
                            : 'bg-rose-500/20 text-rose-200')}>
                              {p.side === 'long' ? 'Long' : 'Short'}
                            </span>
                          </div>)}
                      </div>
                    </button>

                    <div className="mt-1.5 rounded-xl border px-2.5 py-2" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                      <div className="flex items-center justify-between gap-2">
                        <span className={"rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ".concat(aiMeta.className)}>
                          {aiMeta.label}
                        </span>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-white/35">AI read</span>
                      </div>
                      <p className="mt-1.5 text-[11px] font-medium leading-snug text-cyan-100/90">{insight}</p>
                      <p className="mt-0.5 text-[10px] leading-snug text-white/40">{aiMeta.short}</p>
                    </div>

                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                      <button type="button" onClick={function () { return navigate("/trade?".concat(baseQuery)); }} className="rounded-xl border border-white/[0.1] bg-white/[0.04] py-2 text-[11px] font-bold text-white transition hover:bg-white/[0.07]">
                        View
                      </button>
                      <button type="button" onClick={function () { return navigate("/trade?".concat(adjustQuery)); }} className="rounded-xl border py-2 text-[11px] font-bold transition" style={{
                        borderColor: "".concat(ACCENT, "55"),
                        color: ACCENT,
                        boxShadow: "inset 0 0 0 1px rgba(0,200,120,0.12)",
                    }}>
                        Adjust risk
                      </button>
                      <button type="button" onClick={function () { return navigate("/trade?".concat(closeQuery)); }} className="rounded-xl border border-rose-400/25 bg-rose-500/10 py-2 text-[11px] font-bold text-rose-200 transition hover:bg-rose-500/15">
                        Close
                      </button>
                    </div>
                  </CardShell>);
            })}
            </div>) : null}
        </section>

        {/* 3. Bot performance */}
        <section className="space-y-3">
          <SectionTitle>Bot performance</SectionTitle>
          <div className="space-y-2.5">
            {botDayStats.map(function (row) {
            var _a, _b;
            var win = (_a = row.winRatePct) !== null && _a !== void 0 ? _a : row.seedWinRatePct;
            var botAgent = mergedBots.find(function (b) { return b.id === row.botId; });
            var botPairKey = ((_b = botAgent === null || botAgent === void 0 ? void 0 : botAgent.watchedPairs[0]) !== null && _b !== void 0 ? _b : 'BTC').toUpperCase();
            var botLiveCloses = candleCloses(miniCandles[botPairKey]);
            var botHasLiveMini = botLiveCloses.length >= 2;
            var botSparkSeries = botHasLiveMini
                ? botLiveCloses
                : buildSparklineSeries(Math.max(12, Math.abs(row.dailyPnl) * 8 + 48), row.dailyPnl >= 0);
            var botSparkPositive = botHasLiveMini
                ? sparkPositiveFromCloses(botLiveCloses)
                : row.dailyPnl >= 0;
            return (<CardShell key={row.botId} className="py-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 flex-1 truncate text-base font-bold text-white">{row.name}</p>
                    <MiniPortfolioSpark series={botSparkSeries} positive={botSparkPositive} w={124} h={42}/>
                    <p className={"shrink-0 font-mono text-sm font-bold tabular-nums ".concat(row.dailyPnl >= 0 ? '' : 'text-rose-300')} style={{ color: row.dailyPnl >= 0 ? ACCENT : undefined }}>
                      {fmtSignedUsd(row.dailyPnl)}
                    </p>
                  </div>
                  <div className="mt-3 flex justify-between text-[11px] text-white/45">
                    <span>
                      Trades today:{' '}
                      <span className="font-semibold text-white/75">{row.tradesToday}</span>
                    </span>
                    <span>
                      Win rate:{' '}
                      <span className="font-semibold text-white/75">{win}%</span>
                      {row.winRatePct == null ? (<span className="text-white/35"> · model</span>) : null}
                    </span>
                  </div>
                </CardShell>);
        })}
          </div>
        </section>

        {/* 4. History */}
        <section className="space-y-3">
          <SectionTitle>History</SectionTitle>
          <CardShell className="p-0 overflow-hidden">
            {!connected ? (<p className="p-4 text-sm text-white/45">Connect an exchange to see realized trades.</p>) : loading ? (<p className="p-4 text-sm text-white/45">Loading history…</p>) : historyRows.length === 0 ? (<p className="p-4 text-sm text-white/45">No closed fills in the current window.</p>) : (<ul className="divide-y divide-white/[0.05]">
                {historyRows.map(function (t, i) {
                var _a;
                var botName = (0, portfolioBotAttribution_1.attributeBotNameForSymbol)(t.symbol, mergedBots);
                var eqPct = (0, portfolioBotAttribution_1.closedPnlAsEquityPct)(t.closedPnl, Math.max(netWorth, 1));
                var up = t.closedPnl >= 0;
                return (<li key={"".concat(t.exchange, "-").concat((_a = t.orderId) !== null && _a !== void 0 ? _a : i, "-").concat(t.closedAt)} className="px-4 py-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-white">{pairLabel(t.symbol)}</p>
                          <p className="mt-0.5 text-[11px] text-white/40">
                            Realized ·{' '}
                            <span style={{ color: ACCENT }}>{botName}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={"font-mono text-sm font-bold ".concat(up ? '' : 'text-rose-300')} style={{ color: up ? ACCENT : undefined }}>
                            {fmtSignedPct(eqPct)}
                          </p>
                          <p className="text-[10px] text-white/40">{fmtSignedUsd(t.closedPnl)}</p>
                        </div>
                      </div>
                    </li>);
            })}
              </ul>)}
            <div className="border-t border-white/[0.06] p-3">
              <a href={exchangeTransferUrls_1.BYBIT_APP_ASSETS_HOME_HREF} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center rounded-xl py-2.5 text-[11px] font-semibold transition hover:bg-white/[0.04]" style={{ color: ACCENT }}>
                Full ledger on Bybit →
              </a>
            </div>
          </CardShell>
        </section>

        {connected && positions.length > 0 ? (<p className="pb-4 text-center text-[11px] leading-relaxed text-white/35">
            Open PnL: {fmtSignedUsd(unrealized)} unrealized across book.
          </p>) : null}
      </div>
    </div>);
}
