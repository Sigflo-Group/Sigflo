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
exports.default = MarketsScreen;
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var appRoutes_1 = require("@/config/appRoutes");
var MarketCard_1 = require("@/components/markets/MarketCard");
var MarketNewsScanSheet_1 = require("@/components/news/MarketNewsScanSheet");
var useFeedMiniCharts_1 = require("@/hooks/useFeedMiniCharts");
var useSyncedTradeChartInterval_1 = require("@/hooks/useSyncedTradeChartInterval");
var useMarketsScanner_1 = require("@/hooks/useMarketsScanner");
var tradeNavigation_1 = require("@/lib/tradeNavigation");
var tabs = [
    { id: 'tracked', label: 'Tracked' },
    { id: 'movers', label: 'Movers' },
    { id: 'watchlist', label: 'Watchlist' },
];
function MarketsScreen() {
    var navigate = (0, react_router_dom_1.useNavigate)();
    var _a = (0, react_1.useState)('tracked'), tab = _a[0], setTab = _a[1];
    var _b = (0, react_1.useState)(false), newsScanOpen = _b[0], setNewsScanOpen = _b[1];
    var _c = (0, useMarketsScanner_1.useMarketsScanner)(), trackedRows = _c.trackedRows, moverRows = _c.moverRows, watchlistRows = _c.watchlistRows, mode = _c.mode, connection = _c.connection, tickersLoading = _c.tickersLoading;
    var navigateWithTransition = function (to) {
        var w = window;
        if (typeof w.startViewTransition === 'function') {
            w.startViewTransition(function () { return navigate(to); });
            return;
        }
        navigate(to);
    };
    var openRow = function (row) {
        var query = (0, tradeNavigation_1.buildTradeQueryString)(row.signal, { marketStatus: row.status });
        navigateWithTransition("/trade?".concat(query));
    };
    var rows = tab === 'tracked' ? trackedRows : tab === 'movers' ? moverRows : watchlistRows;
    var primaryTriggeredSymbol = (0, react_1.useMemo)(function () {
        var _a, _b;
        var triggered = rows.filter(function (r) { return r.status === 'triggered'; });
        if (triggered.length === 0)
            return null;
        var sorted = __spreadArray([], triggered, true).sort(function (a, b) { var _a, _b; return ((_a = b.triggeredAtMs) !== null && _a !== void 0 ? _a : 0) - ((_b = a.triggeredAtMs) !== null && _b !== void 0 ? _b : 0); });
        return (_b = (_a = sorted[0]) === null || _a === void 0 ? void 0 : _a.symbol) !== null && _b !== void 0 ? _b : null;
    }, [rows]);
    var triggeredNowCount = (0, react_1.useMemo)(function () {
        var seen = new Set();
        for (var _i = 0, _a = __spreadArray(__spreadArray(__spreadArray([], trackedRows, true), moverRows, true), watchlistRows, true); _i < _a.length; _i++) {
            var row = _a[_i];
            if (row.status !== 'triggered')
                continue;
            seen.add(row.symbol);
        }
        return seen.size;
    }, [moverRows, trackedRows, watchlistRows]);
    var fastPairs = (0, react_1.useMemo)(function () {
        var out = [];
        for (var _i = 0, _a = __spreadArray(__spreadArray(__spreadArray([], trackedRows, true), moverRows, true), watchlistRows, true); _i < _a.length; _i++) {
            var r = _a[_i];
            if (r.status === 'triggered')
                out.push(r.pair);
        }
        return out;
    }, [trackedRows, moverRows, watchlistRows]);
    var marketsChartInterval = (0, useSyncedTradeChartInterval_1.useSyncedTradeChartInterval)();
    var miniChartPairs = (0, react_1.useMemo)(function () {
        var s = new Set();
        for (var _i = 0, _a = __spreadArray(__spreadArray(__spreadArray([], trackedRows, true), moverRows, true), watchlistRows, true); _i < _a.length; _i++) {
            var r = _a[_i];
            s.add(r.pair.toUpperCase());
        }
        return __spreadArray([], s, true);
    }, [trackedRows, moverRows, watchlistRows]);
    var miniCharts = (0, useFeedMiniCharts_1.useFeedMiniCharts)(miniChartPairs, {
        interval: marketsChartInterval,
        fastPairs: fastPairs,
        fastRefreshMs: 8000,
    });
    var statusDot = connection === 'connected'
        ? 'bg-sigflo-accent'
        : connection === 'reconnecting'
            ? 'bg-amber-400 animate-pulse'
            : 'bg-slate-500';
    return (<div className="sigflo-markets-screen-root relative min-h-0 overflow-hidden pt-[max(0.4rem,env(safe-area-inset-top))] sm:overflow-visible sm:pt-[max(0.5rem,env(safe-area-inset-top))]">
      <div className="relative z-10 mx-auto h-[calc(100dvh-9.75rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] min-h-0 w-full max-w-none overflow-y-auto overflow-x-hidden overscroll-y-contain touch-pan-y px-0 sm:h-auto sm:max-w-md sm:overflow-visible sm:px-3">
        {/* Header — base sizes ~10% up for mobile; sm+ unchanged */}
        <header className="mb-3.5 px-3 sm:mb-4 sm:px-0">
          <h1 className="text-[1.35rem] font-bold tracking-tight text-white sm:text-xl">Markets</h1>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-sigflo-muted sm:mt-0.5 sm:gap-1.5 sm:text-[11px]">
            <span className={"h-2 w-2 shrink-0 rounded-full sm:h-1.5 sm:w-1.5 ".concat(statusDot)}/>
            <span>
              {mode} · {rows.length} pair{rows.length === 1 ? '' : 's'}
              {tickersLoading ? ' · loading…' : ''}
            </span>
          </div>
          <div className="mt-1 inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-medium text-sigflo-muted sm:mt-0.5 sm:gap-x-1.5 sm:gap-y-0.5 sm:text-[10px]">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-slate-500 sm:h-1.5 sm:w-1.5"/>
              Forming
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-cyan-300/95 sm:h-1.5 sm:w-1.5"/>
              In Play
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1 text-[#b2fff0] drop-shadow-[0_0_8px_rgba(0,255,200,0.35)]">
              <span className="h-2 w-2 rounded-full bg-[#00ffc8] shadow-[0_0_8px_rgba(0,255,200,0.75)] sm:h-1.5 sm:w-1.5"/>
              Triggered
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center justify-end gap-1.5 sm:mt-1.5 sm:gap-1.5">
            <button type="button" onClick={function () { return setNewsScanOpen(true); }} className="inline-flex items-center rounded-md border border-white/[0.1] bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-semibold text-sigflo-text transition hover:border-cyan-400/25 hover:bg-white/[0.07] sm:rounded-lg sm:px-2 sm:py-1.5 sm:text-[11px]">
              Today&apos;s brief
            </button>
            <button type="button" onClick={function () { return navigate((0, appRoutes_1.getFeedRoute)()); }} className="inline-flex items-center gap-1.5 rounded-md border border-sigflo-accent/26 bg-sigflo-accent/10 px-2.5 py-1.5 text-[11px] font-semibold text-sigflo-accent transition hover:border-sigflo-accent/40 hover:bg-sigflo-accent/14 sm:gap-1.5 sm:rounded-lg sm:px-2 sm:py-1.5 sm:text-[11px]">
              <span className="relative flex h-2 w-2 sm:h-1.5 sm:w-1.5">
                <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-sigflo-accent [animation-duration:1.8s]"/>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sigflo-accent sm:h-1.5 sm:w-1.5"/>
              </span>
              <span className="sm:hidden">{triggeredNowCount} triggered</span>
              <span className="hidden sm:inline">
                {triggeredNowCount} signal{triggeredNowCount === 1 ? '' : 's'} triggered now
              </span>
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="mb-3.5 mx-3 flex gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1.5 sm:mb-4 sm:mx-0 sm:gap-1 sm:rounded-xl sm:p-0.5" role="tablist">
          {tabs.map(function (_a) {
            var id = _a.id, label = _a.label;
            var active = tab === id;
            return (<button key={id} type="button" role="tab" aria-selected={active ? 'true' : 'false'} onClick={function () { return setTab(id); }} className={"min-w-0 flex-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition sm:rounded-lg sm:px-2.5 sm:py-1.5 sm:text-xs ".concat(active
                    ? 'bg-sigflo-accent/12 text-sigflo-accent ring-1 ring-sigflo-accent/25'
                    : 'text-sigflo-muted hover:text-sigflo-text')}>
                {label}
              </button>);
        })}
        </div>

        {/* Market rows */}
        <div className="space-y-2.5 px-3 pb-3 sm:space-y-2 sm:px-0 sm:pb-2">
          {tab === 'movers' && !tickersLoading && moverRows.length === 0 ? (<p className="rounded-xl border border-white/[0.06] bg-sigflo-surface sigflo-panel-texture px-3.5 py-8 text-center text-[14px] leading-snug text-sigflo-muted sm:rounded-2xl sm:px-4 sm:py-8 sm:text-sm">
              No movers yet — check back later.
            </p>) : null}
          {tab === 'watchlist' && watchlistRows.length === 0 ? (<p className="rounded-xl border border-white/[0.06] bg-sigflo-surface sigflo-panel-texture px-3.5 py-8 text-center text-[14px] leading-snug text-sigflo-muted sm:rounded-2xl sm:px-4 sm:py-8 sm:text-sm">
              No starred pairs yet. Open a chart on Trade and tap the star in the header to save markets here.
            </p>) : null}
          {rows.map(function (row) { return (<MarketCard_1.MarketCard key={"".concat(tab, "-").concat(row.symbol)} row={row} isPrimaryTriggered={row.symbol === primaryTriggeredSymbol} miniCandles={miniCharts[row.pair.toUpperCase()]} onOpen={function () { return openRow(row); }}/>); })}
        </div>
      </div>

      <MarketNewsScanSheet_1.MarketNewsScanSheet open={newsScanOpen} onClose={function () { return setNewsScanOpen(false); }}/>
    </div>);
}
