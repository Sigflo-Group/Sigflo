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
exports.FeedScreen = FeedScreen;
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var MarketNewsScanSheet_1 = require("@/components/news/MarketNewsScanSheet");
var SignalCard_1 = require("@/components/feed/SignalCard");
var useFeedMiniCharts_1 = require("@/hooks/useFeedMiniCharts");
var useSyncedTradeChartInterval_1 = require("@/hooks/useSyncedTradeChartInterval");
var tradeChartIntervalPreference_1 = require("@/lib/tradeChartIntervalPreference");
var useSignalEngine_1 = require("@/hooks/useSignalEngine");
var marketScannerRows_1 = require("@/lib/marketScannerRows");
var filterChips = [
    { id: 'all', label: 'All' },
    { id: 'strong', label: 'Strong+' },
    { id: 'actionable', label: 'Actionable' },
    { id: 'risky', label: 'Risky' },
];
function FeedScreen() {
    var searchParams = (0, react_router_dom_1.useSearchParams)()[0];
    var queryFilter = searchParams.get('filter');
    var initialFilter = queryFilter === 'strong' || queryFilter === 'actionable' || queryFilter === 'risky' || queryFilter === 'all'
        ? queryFilter
        : 'all';
    var _a = (0, react_1.useState)(initialFilter), filter = _a[0], setFilter = _a[1];
    var _b = (0, react_1.useState)(false), newsScanOpen = _b[0], setNewsScanOpen = _b[1];
    var _c = (0, useSignalEngine_1.useSignalEngine)(), liveSignals = _c.signals, loading = _c.loading, mode = _c.mode, connection = _c.connection;
    /** Tracked watchlist pairs with no engine emission yet — same shells as Markets “Tracked”. */
    var feedSignalsBase = (0, react_1.useMemo)(function () {
        var covered = new Set(liveSignals.map(function (s) { return s.pair.toUpperCase(); }));
        var forming = marketScannerRows_1.TRACKED_SYMBOLS.filter(function (sym) { return !covered.has((0, marketScannerRows_1.symbolToPair)(sym).toUpperCase()); }).map(function (sym) {
            return (0, marketScannerRows_1.buildTrackedFallbackSignal)((0, marketScannerRows_1.symbolToPair)(sym), sym);
        });
        return __spreadArray(__spreadArray([], liveSignals, true), forming, true).sort(function (a, b) { return b.setupScore - a.setupScore; });
    }, [liveSignals]);
    (0, react_1.useEffect)(function () {
        var next = searchParams.get('filter');
        if (next === 'strong' || next === 'actionable' || next === 'risky' || next === 'all') {
            setFilter(next);
        }
    }, [searchParams]);
    var signals = (0, react_1.useMemo)(function () {
        if (filter === 'strong')
            return feedSignalsBase.filter(function (s) { return s.setupScore >= 70; });
        if (filter === 'actionable')
            return feedSignalsBase.filter(marketScannerRows_1.isFeedActionableOpportunity);
        if (filter === 'risky') {
            return feedSignalsBase.filter(function (s) { return s.riskTag === 'High Risk' || (0, marketScannerRows_1.deriveMarketStatus)(s) === 'overextended'; });
        }
        return feedSignalsBase;
    }, [filter, feedSignalsBase]);
    var statusDot = loading
        ? 'bg-amber-400 animate-pulse'
        : connection === 'connected'
            ? 'bg-sigflo-accent'
            : 'bg-slate-500';
    var feedChartInterval = (0, useSyncedTradeChartInterval_1.useSyncedTradeChartInterval)();
    var miniChartsByPair = (0, useFeedMiniCharts_1.useFeedMiniCharts)(signals.map(function (s) { return s.pair; }), { interval: feedChartInterval });
    return (<div className="pb-6 pt-4">
      <section className="space-y-4">
        {/* Header */}
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Signals</h2>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-sigflo-muted">
              <span className={"h-1.5 w-1.5 rounded-full ".concat(statusDot)}/>
              <span>
                {loading ? 'Syncing' : mode === 'OFFLINE' ? 'Offline' : mode} ·{' '}
                {filter === 'all'
            ? "".concat(feedSignalsBase.length, " setups")
            : "".concat(signals.length, " of ").concat(feedSignalsBase.length, " setups")}
              </span>
            </div>
            <div className="mt-1 inline-flex items-center gap-2 text-[10px] font-medium text-sigflo-muted">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-500"/>
                Forming
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300/95"/>
                In Play
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1 text-[#b2fff0] drop-shadow-[0_0_8px_rgba(0,255,200,0.35)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00ffc8] shadow-[0_0_8px_rgba(0,255,200,0.75)]"/>
                Triggered
              </span>
            </div>
          </div>
          {import.meta.env.DEV ? (<div className="flex items-center gap-2">
              <react_router_dom_1.Link to="/engine-debug" className="inline-flex items-center rounded-lg border border-cyan-500/25 bg-cyan-500/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-200/85 transition hover:bg-cyan-500/[0.14] hover:text-cyan-100">
                Debug
              </react_router_dom_1.Link>
              <react_router_dom_1.Link to="/scanner-lab" className="inline-flex items-center rounded-lg border border-violet-500/25 bg-violet-500/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-200/85 transition hover:bg-violet-500/[0.14] hover:text-violet-100">
                Lab
              </react_router_dom_1.Link>
            </div>) : null}
        </div>

        <button type="button" onClick={function () { return setNewsScanOpen(true); }} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-sigflo-elevated px-3 py-2.5 text-left transition hover:border-cyan-400/22 hover:bg-[#1a1b22]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-200/85">Market pulse</p>
            <p className="mt-0.5 text-[13px] font-semibold text-white">What matters today</p>
            <p className="mt-0.5 text-[11px] text-sigflo-muted">AI scan of live crypto & macro headlines</p>
          </div>
          <span className="shrink-0 text-lg text-cyan-300/75" aria-hidden>
            →
          </span>
        </button>

        {/* Filter chips */}
        <div className="flex gap-2" role="tablist" aria-label="Filter signals">
          {filterChips.map(function (chip) {
            var active = filter === chip.id;
            return (<button key={chip.id} type="button" role="tab" aria-selected={active} onClick={function () { return setFilter(chip.id); }} className={"rounded-full px-4 py-1.5 text-xs font-semibold transition ".concat(active
                    ? 'bg-[#0f1f1a] text-sigflo-accent ring-1 ring-sigflo-accent/30'
                    : 'border border-white/[0.06] bg-sigflo-elevated text-sigflo-muted hover:bg-[#1a1b22] hover:text-sigflo-text')}>
                {chip.label}
              </button>);
        })}
        </div>

        {/* Signal cards */}
        <div className="space-y-4">
          {!loading && signals.length === 0 ? (<p className="rounded-xl border border-white/[0.06] bg-sigflo-elevated px-3 py-4 text-center text-[13px] text-sigflo-muted">
              No live setups yet — the scanner is running; stronger structure will appear as the market produces it.
            </p>) : null}
          {signals.map(function (s) { return (<SignalCard_1.SignalCard key={s.id} signal={s} miniCandles={miniChartsByPair[s.pair.toUpperCase()]} intervalLabel={(0, tradeChartIntervalPreference_1.tradeChartIntervalShortLabel)(feedChartInterval)}/>); })}
        </div>
      </section>

      <MarketNewsScanSheet_1.MarketNewsScanSheet open={newsScanOpen} onClose={function () { return setNewsScanOpen(false); }}/>
    </div>);
}
