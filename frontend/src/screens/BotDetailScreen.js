"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = BotDetailScreen;
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var useBotStatuses_1 = require("@/hooks/useBotStatuses");
var useSignalEngine_1 = require("@/hooks/useSignalEngine");
var bots_1 = require("@/lib/bots");
var marketScannerRows_1 = require("@/lib/marketScannerRows");
var signalState_1 = require("@/lib/signalState");
var appRoutes_1 = require("@/config/appRoutes");
var tradeNavigation_1 = require("@/lib/tradeNavigation");
function BotDetailScreen() {
    var _a, _b, _c, _d, _e, _f, _g;
    var botId = (0, react_router_dom_1.useParams)().botId;
    var navigate = (0, react_router_dom_1.useNavigate)();
    var signals = (0, useSignalEngine_1.useSignalEngine)().signals;
    var _h = (0, useBotStatuses_1.useBotStatuses)(), statusMap = _h.statusMap, togglePause = _h.togglePause, setBotStatus = _h.setBotStatus;
    var bot = (0, react_1.useMemo)(function () { var _a; return (_a = bots_1.baseBots.find(function (b) { return b.id === botId; })) !== null && _a !== void 0 ? _a : null; }, [botId]);
    var signal = (0, react_1.useMemo)(function () {
        var _a, _b;
        if (!bot)
            return null;
        return (_b = (_a = signals.find(function (s) { return s.id === bot.signalId; })) !== null && _a !== void 0 ? _a : signals[0]) !== null && _b !== void 0 ? _b : null;
    }, [bot, signals]);
    if (!bot) {
        return (<div className="space-y-3 pt-4">
        <div className="rounded-2xl border border-white/[0.06] bg-sigflo-surface sigflo-panel-texture p-4">
          <p className="text-sm text-sigflo-muted">Bot not found.</p>
          <react_router_dom_1.Link to="/bots" className="mt-2 inline-flex text-sm font-semibold text-cyan-200">
            Back to Bots
          </react_router_dom_1.Link>
        </div>
      </div>);
    }
    var hasSignal = signal != null;
    var status = (_a = statusMap[bot.id]) !== null && _a !== void 0 ? _a : bot.status;
    var tone = (0, bots_1.statusTone)(status);
    var marketStatus = hasSignal ? (0, marketScannerRows_1.deriveMarketStatus)(signal) : null;
    var uiState = marketStatus != null ? (0, signalState_1.uiSignalStateFromMarketStatus)(marketStatus) : 'setup_forming';
    var stateStyle = (0, signalState_1.uiSignalStateClasses)(uiState);
    var focusPair = (_c = (_b = bot.watchedPairs[0]) !== null && _b !== void 0 ? _b : signal === null || signal === void 0 ? void 0 : signal.pair) !== null && _c !== void 0 ? _c : '—';
    var recent = hasSignal
        ? [
            "".concat(signal.pair, " ").concat((0, signalState_1.uiSignalStateLabel)(uiState).toLowerCase()),
            "".concat((_d = bot.watchedPairs[1]) !== null && _d !== void 0 ? _d : signal.pair, " setup scan refreshed"),
            "".concat((_e = bot.watchedPairs[2]) !== null && _e !== void 0 ? _e : signal.pair, " momentum check complete"),
        ]
        : [
            "".concat(focusPair, " waiting for market data"),
            "".concat((_f = bot.watchedPairs[1]) !== null && _f !== void 0 ? _f : focusPair, " scan idle"),
            "".concat((_g = bot.watchedPairs[2]) !== null && _g !== void 0 ? _g : focusPair, " momentum check pending"),
        ];
    return (<div className="min-h-[100dvh] bg-sigflo-bg pb-6 pt-4">
      <div className="mx-auto w-full max-w-lg space-y-3 px-4">
        <header className="rounded-2xl border border-white/[0.06] bg-sigflo-surface sigflo-panel-texture p-4">
          <p className="text-[11px] uppercase tracking-[0.14em] text-sigflo-muted">Agent</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">{bot.name}</h1>
          <p className="text-xs uppercase tracking-[0.12em] text-sigflo-muted">{bot.strategy}</p>
          <p className={"mt-2 inline-flex items-center gap-1 text-xs font-semibold ".concat(tone.className)}>
            <span className={"h-1.5 w-1.5 rounded-full ".concat(status === 'paused' ? 'bg-slate-500' : stateStyle.dot)}/>
            {tone.label}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <react_router_dom_1.Link to={"/bots/".concat(bot.id, "/focus")} className="inline-flex items-center justify-center rounded-xl border border-[rgba(0,200,120,0.35)] bg-[rgba(0,200,120,0.08)] py-2.5 text-sm font-semibold text-[#00E08A] transition hover:border-[rgba(0,200,120,0.5)] hover:bg-[rgba(0,200,120,0.12)] active:scale-[0.99]">
              Focus
            </react_router_dom_1.Link>
            <react_router_dom_1.Link to={"/bots/".concat(bot.id, "/settings")} className="inline-flex items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.04] py-2.5 text-sm font-semibold text-cyan-100/95 transition hover:border-white/[0.18] active:scale-[0.99]">
              Settings
            </react_router_dom_1.Link>
          </div>
        </header>

        <section className="rounded-2xl border border-white/[0.06] bg-sigflo-surface sigflo-panel-texture p-3 text-xs text-sigflo-muted">
          <p>Markets watched: {bot.watchedPairs.join(', ')}</p>
          <p className="mt-1">Last action: {hasSignal ? (0, bots_1.shortActionLabel)(signal) : 'Waiting for live signals'}</p>
          <p className="mt-1">Current focus: {focusPair}</p>
          <p className="mt-1">Risk mode: {bot.riskMode}</p>
        </section>

        <section className="rounded-2xl border border-white/[0.06] bg-sigflo-surface sigflo-panel-texture p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sigflo-muted">Recent activity</p>
          <div className="mt-2 space-y-1.5">
            {recent.map(function (item) { return (<div key={item} className="rounded-lg bg-black/20 px-2.5 py-2 text-xs text-sigflo-text">
                {item}
              </div>); })}
          </div>
        </section>

        <section className={"rounded-2xl border bg-sigflo-surface sigflo-panel-texture p-3 ".concat(hasSignal ? stateStyle.card : 'border-white/[0.06]')}>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sigflo-muted">Current setup</p>
          {hasSignal ? (<>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-base font-bold text-white">{signal.pair} / USDT</p>
                <p className={"inline-flex items-center gap-1 text-xs font-semibold ".concat(stateStyle.text)}>
                  <span className={"h-1.5 w-1.5 rounded-full ".concat(stateStyle.dot)}/>
                  {(0, signalState_1.uiSignalStateLabel)(uiState)}
                </p>
              </div>
              <p className="mt-1 text-xs text-sigflo-muted">{signal.biasLabel}</p>
            </>) : (<p className="mt-2 text-xs text-sigflo-muted">
              No live setup yet. Open Markets when data is available, or check your connection if the feed is offline.
            </p>)}
        </section>

        <section className="rounded-2xl border border-white/[0.06] bg-sigflo-surface sigflo-panel-texture p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sigflo-muted">Controls</p>
          <div className="mt-2 flex items-center gap-2">
            <button type="button" onClick={function () { return togglePause(bot.id); }} className={"rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider ".concat(status === 'paused'
            ? 'border-cyan-300/35 bg-cyan-300/10 text-cyan-100'
            : 'border-white/20 bg-white/[0.03] text-sigflo-text')}>
              {status === 'paused' ? 'Resume' : 'Pause'}
            </button>
            <button type="button" onClick={function () { return setBotStatus(bot.id, status === 'scanning' ? 'active' : 'scanning'); }} className="rounded-full border border-white/20 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-sigflo-text">
              {status === 'scanning' ? 'Set Active' : 'Set Scan'}
            </button>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2">
          <button type="button" onClick={function () { return navigate((0, appRoutes_1.feedActionablePath)()); }} className="rounded-2xl border border-white/15 bg-sigflo-surface sigflo-panel-texture px-3 py-2 text-sm font-semibold text-sigflo-text">
            View active setup
          </button>
          <button type="button" disabled={!hasSignal} onClick={function () {
            if (!hasSignal || !signal || !marketStatus)
                return;
            navigate("/trade?".concat((0, tradeNavigation_1.buildTradeQueryString)(signal, { marketStatus: marketStatus })));
        }} className={"rounded-2xl border px-3 py-2 text-sm font-semibold ".concat(hasSignal
            ? 'border-sigflo-accent/30 bg-sigflo-accentDim text-sigflo-accent'
            : 'cursor-not-allowed border-white/[0.08] bg-white/[0.02] text-sigflo-muted')}>
            Open trade
          </button>
        </section>
      </div>
    </div>);
}
