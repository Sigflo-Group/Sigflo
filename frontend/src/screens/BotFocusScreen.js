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
exports.default = BotFocusScreen;
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var tradingControlMode_1 = require("@/lib/tradingControlMode");
var framer_motion_1 = require("framer-motion");
var BotFocusFullChartChrome_1 = require("@/components/bots/BotFocusFullChartChrome");
var BotExecutionSheet_1 = require("@/components/bots/BotExecutionSheet");
var AdjustRiskSheet_1 = require("@/components/trade/AdjustRiskSheet");
var TradeChartPanel_1 = require("@/components/trade/TradeChartPanel");
var tradeChartHeights_1 = require("@/config/tradeChartHeights");
var botFocusLayoutContext_1 = require("@/context/botFocusLayoutContext");
var TradingControlModeContext_1 = require("@/context/TradingControlModeContext");
var useCanGoBack_1 = require("@/hooks/useCanGoBack");
var useLiveTradeMarket_1 = require("@/hooks/useLiveTradeMarket");
var useSyncedTradeChartInterval_1 = require("@/hooks/useSyncedTradeChartInterval");
var ExitAiCoPilotBlock_1 = require("@/components/trade/exit/ExitAiCoPilotBlock");
var useAccountSnapshot_1 = require("@/hooks/useAccountSnapshot");
var useExitAutomation_1 = require("@/hooks/useExitAutomation");
var useBotStatuses_1 = require("@/hooks/useBotStatuses");
var useSignalEngine_1 = require("@/hooks/useSignalEngine");
var chartSetupFocus_1 = require("@/lib/chartSetupFocus");
var bots_1 = require("@/lib/bots");
var marketScannerRows_1 = require("@/lib/marketScannerRows");
var tradeChartIntervalPreference_1 = require("@/lib/tradeChartIntervalPreference");
var signalState_1 = require("@/lib/signalState");
var bybitUserFacingError_1 = require("@/lib/bybitUserFacingError");
var bybitLinearTpSl_1 = require("@/lib/bybitLinearTpSl");
var bybitTpSlTrigger_1 = require("@/lib/bybitTpSlTrigger");
var linearOrderQty_1 = require("@/lib/linearOrderQty");
var exitAiCoPilot_1 = require("@/lib/exitAiCoPilot");
var tradeExitGuidanceFlow_1 = require("@/lib/tradeExitGuidanceFlow");
var buildGroundedMarketContext_1 = require("@/lib/buildGroundedMarketContext");
var tradeNavigation_1 = require("@/lib/tradeNavigation");
var botSetupLevelCopy_1 = require("@/lib/botSetupLevelCopy");
var tradeRisk_1 = require("@/lib/tradeRisk");
var tradeViewFromSignal_1 = require("@/lib/tradeViewFromSignal");
var client_1 = require("@/services/ai/client");
var tradeClient_1 = require("@/services/api/tradeClient");
var client_2 = require("@/services/bybit/client");
var BETA_FALLBACK_MIN_ORDER_USD = 5;
var SYMBOL_MIN_NOTIONAL_USD = {
    BTCUSDT: 5,
    ETHUSDT: 5,
};
function resolveMinOrderUsd(symbol) {
    var _a;
    var s = symbol.toUpperCase();
    return (_a = SYMBOL_MIN_NOTIONAL_USD[s]) !== null && _a !== void 0 ? _a : BETA_FALLBACK_MIN_ORDER_USD;
}
function roundUsdAmount(n) {
    return Math.round(n * 100) / 100;
}
function coerceUsdField(value) {
    if (value == null)
        return null;
    if (typeof value === 'string' && value.trim() === '')
        return null;
    var num = Number(value);
    return Number.isFinite(num) ? num : null;
}
function utaSizingCapUsd(o) {
    var av = o.availableToTrade;
    var tw = o.totalWalletBalance;
    if (av != null && Number.isFinite(av) && av > 0)
        return av;
    if (tw != null && Number.isFinite(tw) && tw > 0)
        return tw;
    return 0;
}
function utaBalanceDisplayUsd(o) {
    var cap = utaSizingCapUsd(o);
    if (cap > 0)
        return cap;
    var av = o.availableToTrade;
    if (av != null && Number.isFinite(av))
        return Math.max(0, av);
    var tw = o.totalWalletBalance;
    if (tw != null && Number.isFinite(tw))
        return Math.max(0, tw);
    return 0;
}
function findBybitLinearOpenLeg(snapshots, orderSymbol, legSide) {
    var _a, _b;
    var bybit = snapshots.find(function (s) { return s.exchange === 'bybit' && s.status === 'connected'; });
    if (!((_a = bybit === null || bybit === void 0 ? void 0 : bybit.positions) === null || _a === void 0 ? void 0 : _a.length))
        return null;
    var open = bybit.positions.filter(function (x) { return x.symbol === orderSymbol && x.size > 0; });
    if (open.length === 0)
        return null;
    return (_b = open.find(function (x) { return x.side === legSide; })) !== null && _b !== void 0 ? _b : open[0];
}
var FOCUS_INTERVAL_OPTIONS = [
    { value: '1', label: '1m' },
    { value: '5', label: '5m' },
    { value: '15', label: '15m' },
    { value: '60', label: '1H' },
    { value: '240', label: '4H' },
    { value: 'D', label: '1D' },
    { value: 'W', label: '1W' },
];
function pairToLinearSymbol(raw) {
    var t = raw.trim().toUpperCase();
    if (!t)
        return 'BTCUSDT';
    if (t.endsWith('USDT') && t.length > 4)
        return t;
    var base = t.replace(/[^A-Z0-9]/g, '').replace(/USDT$/i, '') || 'BTC';
    return "".concat(base, "USDT");
}
function pairFromWatched(raw) {
    var _a;
    var t = raw.trim().toUpperCase();
    if (t.includes('/'))
        return ((_a = t.split('/')[0]) === null || _a === void 0 ? void 0 : _a.trim()) || 'BTC';
    return t.replace(/USDT$/i, '').replace(/[^A-Z0-9]/g, '') || 'BTC';
}
function levelsValid(e, s, t) {
    return (e != null &&
        s != null &&
        t != null &&
        Number.isFinite(e) &&
        Number.isFinite(s) &&
        Number.isFinite(t) &&
        e > 0 &&
        s > 0 &&
        t > 0);
}
function rrFromLevels(side, entry, stop, target) {
    var risk = side === 'long' ? entry - stop : stop - entry;
    var reward = side === 'long' ? target - entry : entry - target;
    if (!Number.isFinite(risk) || risk <= 0)
        return 0;
    return reward / risk;
}
function biasToSide(bias) {
    return bias.trim().toLowerCase() === 'short' ? 'short' : 'long';
}
function focusStateLabel(args) {
    if (args.paused)
        return 'Watching';
    if (args.pending || !args.hasSignal)
        return 'Waiting';
    if (args.marketStatus === 'triggered')
        return 'Triggered';
    if (args.actionable)
        return 'Ready';
    if (args.marketStatus === 'developing' || args.marketStatus === 'overextended')
        return 'Waiting';
    return 'Watching';
}
/**
 * Bot card detail can carry a stale seed setup while the chart shows live spot. Merging far-off levels (e.g. ~94k
 * entry vs ~72k BTC) makes the scale look broken. Still allow large but plausible drift for real open trades.
 */
function botDetailMatchesChartScale(botEntry, chartAnchor) {
    if (!(botEntry > 0) || !(chartAnchor > 0))
        return false;
    var r = botEntry / chartAnchor;
    return r >= 0.8 && r <= 1.25;
}
function mergeModelWithBotLevels(base, bot, applyMergedBotSeed) {
    if (!applyMergedBotSeed || !levelsValid(bot.detail.entry, bot.detail.stop, bot.detail.target)) {
        return base;
    }
    var side = biasToSide(bot.detail.bias);
    var entry = bot.detail.entry;
    var stop = bot.detail.stop;
    var target = bot.detail.target;
    var stopMovePct = Math.abs((stop - entry) / entry);
    var targetMovePct = Math.abs((target - entry) / entry);
    var riskReward = rrFromLevels(side, entry, stop, target);
    var positionSizeUsd = base.positionSizeUsd;
    var targetProfitUsd = positionSizeUsd * targetMovePct;
    var stopLossUsd = -(positionSizeUsd * stopMovePct);
    return __assign(__assign({}, base), { side: side, entry: entry, stop: stop, target: target, riskReward: Number.isFinite(riskReward) && riskReward > 0 ? riskReward : base.riskReward, targetProfitUsd: targetProfitUsd, stopLossUsd: stopLossUsd });
}
function BotFocusHeader(_a) {
    var bot = _a.bot, cardStatus = _a.cardStatus, onBack = _a.onBack;
    var personality = (0, bots_1.botPersonality)(bot.personalityId);
    var meta = (0, bots_1.botCardStatusMeta)(cardStatus);
    var glow = cardStatus === 'active' || cardStatus === 'in_trade'
        ? 'shadow-[0_0_20px_-6px_rgba(0,200,120,0.45)]'
        : '';
    return (<header className="landing-panel-texture relative overflow-hidden border-b border-landing-border/80 bg-landing-bg px-3 py-2.5">
      <div className="relative z-[1] flex w-full min-w-0 items-center gap-3">
        {onBack ? (<button type="button" onClick={onBack} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-landing-border bg-landing-surface/80 text-landing-text transition active:scale-[0.96]" aria-label="Back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>) : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h1 className="truncate text-base font-bold tracking-tight text-landing-text">{bot.name}</h1>
            <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-landing-muted">
              {bot.strategy}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className={"inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-landing-surface/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ".concat(meta.textClass, " ").concat(glow)}>
              <span className={"h-1.5 w-1.5 rounded-full ".concat(meta.dotClass)}/>
              {meta.label}
            </span>
            <span className="inline-flex max-w-full rounded-full border border-landing-accent/30 bg-landing-accent-dim/50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-landing-accent-hi">
              {personality.label}
            </span>
          </div>
        </div>
      </div>
    </header>);
}
function MarketContextTags(_a) {
    var volatility = _a.volatility, structure = _a.structure, volume = _a.volume;
    var items = [
        { k: 'Volatility', v: volatility },
        { k: 'Structure', v: structure },
        { k: 'Volume', v: volume },
    ];
    return (<div className="flex flex-wrap gap-2">
      {items.map(function (_a) {
            var k = _a.k, v = _a.v;
            return (<span key={k} className="inline-flex items-center rounded-full border border-white/[0.08] bg-black/30 px-2.5 py-1 text-[10px] font-medium text-landing-muted">
          <span className="text-landing-text/75">{k}:</span>
          <span className="ml-1 text-landing-accent-hi">{v}</span>
        </span>);
        })}
    </div>);
}
function BotFocusScreen() {
    var _this = this;
    var _a, _b, _c, _d, _e, _f, _g;
    var botId = (0, react_router_dom_1.useParams)().botId;
    var navigate = (0, react_router_dom_1.useNavigate)();
    var canGoBack = (0, useCanGoBack_1.useCanGoBack)();
    var _h = (0, react_router_dom_1.useSearchParams)(), searchParams = _h[0], setSearchParams = _h[1];
    var signals = (0, useSignalEngine_1.useSignalEngine)().signals;
    var _j = (0, useBotStatuses_1.useBotStatuses)(), statusMap = _j.statusMap, togglePause = _j.togglePause;
    var chartInterval = (0, useSyncedTradeChartInterval_1.useSyncedTradeChartInterval)();
    var _k = (0, react_1.useState)(null), selectedPairRaw = _k[0], setSelectedPairRaw = _k[1];
    var _l = (0, react_1.useState)(false), whyOpen = _l[0], setWhyOpen = _l[1];
    var _m = (0, react_1.useState)(null), tapFlash = _m[0], setTapFlash = _m[1];
    var _o = (0, react_1.useState)(false), executionOpen = _o[0], setExecutionOpen = _o[1];
    var _p = (0, react_1.useState)(false), adjustRiskOpen = _p[0], setAdjustRiskOpen = _p[1];
    var _q = (0, react_1.useState)(false), execLive = _q[0], setExecLive = _q[1];
    var _r = (0, react_1.useState)(null), execFillEntry = _r[0], setExecFillEntry = _r[1];
    var _s = (0, react_1.useState)(0), execNotionalUsd = _s[0], setExecNotionalUsd = _s[1];
    var _t = (0, react_1.useState)(null), execSideOverride = _t[0], setExecSideOverride = _t[1];
    var _u = (0, botFocusLayoutContext_1.useBotFocusLayout)(), fullChartMode = _u.fullChartMode, setFullChartMode = _u.setFullChartMode;
    var _v = (0, TradingControlModeContext_1.useTradingControlMode)(), tradingControlMode = _v.mode, tradingModeMeta = _v.meta;
    var _w = (0, react_1.useState)(false), insightDrawerOpen = _w[0], setInsightDrawerOpen = _w[1];
    /** Clean vs Setup overlays on the focus chart (same control as Trade dock; left of live time / PERP cluster). */
    var _x = (0, react_1.useState)(true), chartSetupMode = _x[0], setChartSetupMode = _x[1];
    var onChartSetupModeToggle = (0, react_1.useCallback)(function () {
        setChartSetupMode(function (v) { return !v; });
    }, []);
    var _y = (0, react_1.useState)(null), setupFocusBanner = _y[0], setSetupFocusBanner = _y[1];
    var setupFocusBannerTimerRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(function () {
        return function () {
            if (setupFocusBannerTimerRef.current != null)
                window.clearTimeout(setupFocusBannerTimerRef.current);
        };
    }, []);
    var onSetupFocusBannerCb = (0, react_1.useCallback)(function (label) {
        if (setupFocusBannerTimerRef.current != null)
            window.clearTimeout(setupFocusBannerTimerRef.current);
        setSetupFocusBanner(label);
        setupFocusBannerTimerRef.current = window.setTimeout(function () {
            setSetupFocusBanner(null);
            setupFocusBannerTimerRef.current = null;
        }, 4200);
    }, []);
    var chartSlotRef = (0, react_1.useRef)(null);
    var _z = (0, react_1.useState)(tradeChartHeights_1.BOT_FOCUS_CHART_PLOT_PX), fullChartPlotPx = _z[0], setFullChartPlotPx = _z[1];
    (0, react_1.useLayoutEffect)(function () {
        var fc = searchParams.get('fullChart');
        if (fc !== '1' && fc !== 'true')
            return;
        setFullChartMode(true);
        setSearchParams(function (prev) {
            var next = new URLSearchParams(prev);
            next.delete('fullChart');
            return next;
        }, { replace: true });
    }, [botId, searchParams, setFullChartMode, setSearchParams]);
    var _0 = (0, useAccountSnapshot_1.useAccountSnapshot)({ pollMs: 12000 }), accountSnapshots = _0.items, refreshAccountSnapshots = _0.refresh;
    var _1 = (0, react_1.useState)(null), symbolMaxLeverage = _1[0], setSymbolMaxLeverage = _1[1];
    var bot = (0, react_1.useMemo)(function () { var _a; return (_a = bots_1.baseBots.find(function (b) { return b.id === botId; })) !== null && _a !== void 0 ? _a : null; }, [botId]);
    var selectedWatched = (_a = selectedPairRaw !== null && selectedPairRaw !== void 0 ? selectedPairRaw : bot === null || bot === void 0 ? void 0 : bot.watchedPairs[0]) !== null && _a !== void 0 ? _a : 'BTC';
    var linearSymbol = pairToLinearSymbol(selectedWatched);
    var focusSignal = (0, react_1.useMemo)(function () {
        if (!bot)
            return null;
        var watchBase = pairFromWatched(selectedWatched);
        var sym = pairToLinearSymbol(selectedWatched);
        var byId = signals.find(function (s) { return s.id === bot.signalId; });
        var forPair = signals.find(function (s) { return pairFromWatched(s.pair) === watchBase; });
        if (byId && pairFromWatched(byId.pair) === watchBase)
            return byId;
        if (forPair)
            return forPair;
        return (0, marketScannerRows_1.buildTrackedFallbackSignal)(watchBase, sym);
    }, [bot, signals, selectedWatched]);
    var live = (0, useLiveTradeMarket_1.useLiveTradeMarket)(linearSymbol, chartInterval);
    (0, react_1.useEffect)(function () {
        setChartSetupMode(true);
    }, [linearSymbol]);
    (0, react_1.useLayoutEffect)(function () {
        var el = chartSlotRef.current;
        if (!el || !fullChartMode || tradeChartHeights_1.BOT_FOCUS_FULL_CHART_PLOT_FLEX_FILL)
            return;
        var apply = function () {
            var cs = getComputedStyle(el);
            var padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
            var inner = el.clientHeight - padY;
            var liveStrip = execLive ? 34 : 0;
            setFullChartPlotPx(Math.max(200, Math.floor(inner - tradeChartHeights_1.BOT_FOCUS_FULL_CHART_OUTSIDE_PLOT_RESERVE_PX - liveStrip)));
        };
        apply();
        var ro = new ResizeObserver(apply);
        ro.observe(el);
        return function () { return ro.disconnect(); };
    }, [fullChartMode, execLive]);
    (0, react_1.useEffect)(function () {
        if (!fullChartMode)
            setInsightDrawerOpen(false);
    }, [fullChartMode]);
    (0, react_1.useEffect)(function () {
        if (!fullChartMode)
            return;
        var prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return function () {
            document.body.style.overflow = prev;
        };
    }, [fullChartMode]);
    (0, react_1.useEffect)(function () {
        var cancelled = false;
        void (0, client_2.fetchLinearMaxLeverage)(linearSymbol).then(function (m) {
            if (!cancelled)
                setSymbolMaxLeverage(m);
        });
        return function () {
            cancelled = true;
        };
    }, [linearSymbol]);
    var tradeBalance = (0, react_1.useMemo)(function () {
        var _a;
        var bybit = accountSnapshots.find(function (s) { return s.exchange === 'bybit' && s.status === 'connected'; });
        var overview = (_a = bybit === null || bybit === void 0 ? void 0 : bybit.accountBreakdown) === null || _a === void 0 ? void 0 : _a.overview;
        if (!overview)
            return null;
        return {
            availableToTrade: coerceUsdField(overview.availableToTrade),
            totalWalletBalance: coerceUsdField(overview.totalWalletBalance),
        };
    }, [accountSnapshots]);
    var linkedUtaRawMaxUsd = (0, react_1.useMemo)(function () {
        if (!tradeBalance)
            return null;
        var raw = Math.max(utaSizingCapUsd(tradeBalance), utaBalanceDisplayUsd(tradeBalance));
        if (!Number.isFinite(raw))
            return null;
        return Math.max(0, raw);
    }, [tradeBalance]);
    var balanceForSizing = (0, react_1.useMemo)(function () {
        if (linkedUtaRawMaxUsd != null && linkedUtaRawMaxUsd > 0) {
            return roundUsdAmount(linkedUtaRawMaxUsd);
        }
        return 0;
    }, [linkedUtaRawMaxUsd]);
    var bybitSnap = (0, react_1.useMemo)(function () { return accountSnapshots.find(function (s) { return s.exchange === 'bybit' && s.status === 'connected'; }); }, [accountSnapshots]);
    var storedStatus = bot ? (_b = statusMap[bot.id]) !== null && _b !== void 0 ? _b : bot.status : 'active';
    var marketStatus = focusSignal ? (0, marketScannerRows_1.deriveMarketStatus)(focusSignal) : 'idle';
    var uiState = focusSignal ? (0, signalState_1.uiSignalStateFromMarketStatus)(marketStatus) : null;
    var cardStatus = (0, bots_1.resolveBotCardStatus)(storedStatus, uiState);
    /** Static card seed levels (may be wrong scale vs pair picker — never use alone for SETUP readout). */
    var botSeededLevels = Boolean(bot && !bot.expandedSetupPending && levelsValid(bot.detail.entry, bot.detail.stop, bot.detail.target));
    var baseModel = (0, react_1.useMemo)(function () {
        if (!focusSignal)
            return null;
        var anchorPx = (0, tradeViewFromSignal_1.resolveTradeAnchorPrice)(null, live.lastPrice, focusSignal.pair);
        return (0, tradeViewFromSignal_1.buildTradeViewModelFromSignal)(focusSignal, {
            lastPrice: live.lastPrice,
            change24hPct: live.change24hPct,
            high24h: live.high24h,
            low24h: live.low24h,
            volume24h: live.volume24h,
            priceSeries: live.priceSeries,
            chartCandles: live.chartCandles,
        }, {
            anchorPrice: anchorPx,
            balanceUsd: 0,
            tradeSide: bot ? biasToSide(bot.detail.bias) : undefined,
        });
    }, [focusSignal, live, bot]);
    var chartModel = (0, react_1.useMemo)(function () {
        if (!baseModel || !bot)
            return baseModel;
        var levelsValidForBot = botSeededLevels && levelsValid(bot.detail.entry, bot.detail.stop, bot.detail.target);
        var hasLiveSignalForPair = Boolean(focusSignal && !focusSignal.id.startsWith('tracked-'));
        var anchor = Number.isFinite(baseModel.lastPrice) && baseModel.lastPrice > 0
            ? baseModel.lastPrice
            : Number.isFinite(baseModel.entry) && baseModel.entry > 0
                ? baseModel.entry
                : 0;
        /**
         * Seeded bot levels are fallback-only. When a live signal exists for the selected pair, keep
         * plan levels tied to live-derived chart context instead of static bot defaults.
         */
        var applyBotLevels = levelsValidForBot &&
            !hasLiveSignalForPair &&
            bot.detail.entry != null &&
            anchor > 0 &&
            botDetailMatchesChartScale(bot.detail.entry, anchor);
        return mergeModelWithBotLevels(baseModel, bot, applyBotLevels);
    }, [baseModel, bot, botSeededLevels, focusSignal]);
    /** Levels actually driving the chart / orders for the selected pair (live signal + anchor). */
    var hasDisplayableSetup = Boolean(chartModel && levelsValid(chartModel.entry, chartModel.stop, chartModel.target));
    /** Live swing-derived intent copy for this symbol + active chart interval (never uses stale seed prices). */
    var liveSetupCopy = (0, react_1.useMemo)(function () {
        if (!bot || !chartModel)
            return null;
        var currentPrice = live.lastPrice != null && live.lastPrice > 0
            ? live.lastPrice
            : chartModel.lastPrice > 0
                ? chartModel.lastPrice
                : 0;
        return (0, botSetupLevelCopy_1.buildLiveBotSetupCopy)({
            bias: bot.detail.bias,
            candles: chartModel.chartCandles,
            currentPrice: currentPrice,
            intervalLabel: (0, tradeChartIntervalPreference_1.tradeChartIntervalShortLabel)(chartInterval),
        });
    }, [bot, chartModel, chartInterval, live.lastPrice]);
    var setupSideForExec = bot ? biasToSide(bot.detail.bias) : 'long';
    var effectiveExecSide = execSideOverride !== null && execSideOverride !== void 0 ? execSideOverride : setupSideForExec;
    (0, react_1.useEffect)(function () {
        var _a, _b, _c;
        var open = (_b = (_a = bybitSnap === null || bybitSnap === void 0 ? void 0 : bybitSnap.positions) === null || _a === void 0 ? void 0 : _a.filter(function (p) { return p.symbol === linearSymbol && p.size > 0; })) !== null && _b !== void 0 ? _b : [];
        if (open.length === 0) {
            setExecLive(false);
            setExecFillEntry(null);
            setExecNotionalUsd(0);
            setExecSideOverride(null);
            return;
        }
        var pos = (_c = open.find(function (p) { return p.side === setupSideForExec; })) !== null && _c !== void 0 ? _c : open[0];
        var entry = Number.isFinite(pos.entryPrice) && pos.entryPrice > 0 ? pos.entryPrice : null;
        var refPrice = Number.isFinite(pos.markPrice) && pos.markPrice > 0
            ? pos.markPrice
            : entry !== null && entry !== void 0 ? entry : 0;
        var notional = refPrice > 0 ? Math.max(0, pos.size * refPrice) : 0;
        setExecFillEntry(entry);
        setExecNotionalUsd(notional);
        setExecSideOverride(pos.side);
        setExecLive(true);
    }, [bybitSnap, linearSymbol, setupSideForExec]);
    var chartModelForPlot = (0, react_1.useMemo)(function () {
        if (!chartModel)
            return null;
        if (execFillEntry != null) {
            var last = live.lastPrice != null && live.lastPrice > 0 ? live.lastPrice : execFillEntry;
            return __assign(__assign({}, chartModel), { entry: execFillEntry, lastPrice: last });
        }
        return chartModel;
    }, [chartModel, execFillEntry, live.lastPrice]);
    var headerSecondaryPnl = (0, react_1.useMemo)(function () {
        if (!execLive || execNotionalUsd <= 0 || !chartModelForPlot)
            return null;
        var markPx = live.lastPrice != null && live.lastPrice > 0 ? live.lastPrice : chartModelForPlot.entry;
        var entryPx = execFillEntry !== null && execFillEntry !== void 0 ? execFillEntry : chartModelForPlot.entry;
        if (!(markPx > 0) || !(entryPx > 0))
            return null;
        var frac = effectiveExecSide === 'long'
            ? (markPx - entryPx) / entryPx
            : (entryPx - markPx) / entryPx;
        var u = execNotionalUsd * frac;
        var tone = u > 0 ? 'positive' : u < 0 ? 'negative' : 'neutral';
        var label = "".concat(u >= 0 ? '+' : '−').concat(Math.abs(u).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }), " uPnL");
        return { label: label, tone: tone };
    }, [effectiveExecSide, execLive, execNotionalUsd, chartModelForPlot, live.lastPrice, execFillEntry]);
    var exitAutomationScopeKey = bot ? "botFocus:".concat(bot.id, ":").concat(linearSymbol) : 'botFocus:none';
    var exitAuto = (0, useExitAutomation_1.useExitAutomation)(exitAutomationScopeKey);
    var adjustRiskExitApi = (0, react_1.useMemo)(function () { return ({
        mode: exitAuto.mode,
        strategy: exitAuto.strategy,
        setStrategy: exitAuto.setStrategy,
        setSafeguards: exitAuto.setSafeguards,
        pushActivity: exitAuto.pushActivity,
    }); }, [exitAuto.mode, exitAuto.strategy, exitAuto.setStrategy, exitAuto.setSafeguards, exitAuto.pushActivity]);
    var adjustRiskFocusSnapshot = (0, react_1.useMemo)(function () {
        var _a;
        if (!execLive || execNotionalUsd <= 0 || !chartModelForPlot)
            return null;
        var entryPx = execFillEntry !== null && execFillEntry !== void 0 ? execFillEntry : chartModelForPlot.entry;
        var markPx = live.lastPrice != null && live.lastPrice > 0 ? live.lastPrice : (_a = chartModelForPlot.lastPrice) !== null && _a !== void 0 ? _a : entryPx;
        if (!(entryPx > 0) || !(markPx > 0))
            return null;
        var frac = effectiveExecSide === 'long' ? (markPx - entryPx) / entryPx : (entryPx - markPx) / entryPx;
        var pnlUsd = execNotionalUsd * frac;
        var stop = chartModelForPlot.stop;
        var target = chartModelForPlot.target;
        if (!(stop > 0) || !(target > 0))
            return null;
        return {
            pairLabel: chartModelForPlot.pair,
            side: effectiveExecSide,
            positionNotionalUsd: execNotionalUsd,
            entryPrice: entryPx,
            markPrice: markPx,
            pnlUsd: pnlUsd,
            stopPrice: stop,
            targetPrice: target,
        };
    }, [
        chartModelForPlot,
        execFillEntry,
        execLive,
        execNotionalUsd,
        live.lastPrice,
        effectiveExecSide,
    ]);
    var botExitFlow = (0, react_1.useMemo)(function () {
        var _a;
        if (!execLive || !chartModelForPlot || !focusSignal)
            return null;
        var entry = execFillEntry !== null && execFillEntry !== void 0 ? execFillEntry : chartModelForPlot.entry;
        var mark = live.lastPrice != null && live.lastPrice > 0 ? live.lastPrice : (_a = chartModelForPlot.lastPrice) !== null && _a !== void 0 ? _a : entry;
        if (!(entry > 0) || !(mark > 0))
            return null;
        var pnlPct = effectiveExecSide === 'long' ? ((mark - entry) / entry) * 100 : ((entry - mark) / entry) * 100;
        return (0, tradeExitGuidanceFlow_1.resolveExitGuidanceFlow)({
            variant: 'manage',
            side: effectiveExecSide,
            entry: entry,
            mark: mark,
            stop: chartModelForPlot.stop,
            target: chartModelForPlot.target,
            trendAlignment: focusSignal.scoreBreakdown.trendAlignment,
            momentumQuality: focusSignal.scoreBreakdown.momentumQuality,
            pnlPct: pnlPct,
            strategyPreset: exitAuto.strategy,
            customStrategyThresholds: exitAuto.customStrategyThresholds,
            safeguards: exitAuto.safeguards,
            exitAiMode: exitAuto.mode,
        });
    }, [
        chartModelForPlot,
        execFillEntry,
        execLive,
        exitAuto.customStrategyThresholds,
        exitAuto.mode,
        exitAuto.safeguards,
        exitAuto.strategy,
        focusSignal,
        live.lastPrice,
        effectiveExecSide,
    ]);
    var botExitChartAux = (0, react_1.useMemo)(function () {
        var _a;
        if (!execLive || !chartModelForPlot)
            return undefined;
        var entry = execFillEntry !== null && execFillEntry !== void 0 ? execFillEntry : chartModelForPlot.entry;
        var mark = live.lastPrice != null && live.lastPrice > 0 ? live.lastPrice : (_a = chartModelForPlot.lastPrice) !== null && _a !== void 0 ? _a : entry;
        return (0, exitAiCoPilot_1.buildManageAiExitZoneAuxLines)({
            mode: exitAuto.mode,
            side: effectiveExecSide,
            entry: entry,
            target: chartModelForPlot.target,
            stop: chartModelForPlot.stop,
            mark: mark,
            referencePrice: botExitFlow === null || botExitFlow === void 0 ? void 0 : botExitFlow.effective.referencePrice,
        });
    }, [
        botExitFlow === null || botExitFlow === void 0 ? void 0 : botExitFlow.effective.referencePrice,
        chartModelForPlot,
        execFillEntry,
        execLive,
        exitAuto.mode,
        live.lastPrice,
        effectiveExecSide,
    ]);
    var botExitAiModel = (0, react_1.useMemo)(function () {
        var _a, _b, _c, _d, _e;
        return (0, exitAiCoPilot_1.buildExitAiCoPilotModel)({
            mode: exitAuto.mode,
            side: effectiveExecSide,
            flow: botExitFlow,
            nextPlanned: (_a = botExitFlow === null || botExitFlow === void 0 ? void 0 : botExitFlow.nextPlanned) !== null && _a !== void 0 ? _a : 'Automation watching trend and risk.',
            safeguards: exitAuto.safeguards,
            assistedPromptVisible: false,
            orderExitInFlight: false,
            stop: (_b = chartModelForPlot === null || chartModelForPlot === void 0 ? void 0 : chartModelForPlot.stop) !== null && _b !== void 0 ? _b : 0,
            target: (_c = chartModelForPlot === null || chartModelForPlot === void 0 ? void 0 : chartModelForPlot.target) !== null && _c !== void 0 ? _c : 0,
            contextLine: (_e = (_d = liveSetupCopy === null || liveSetupCopy === void 0 ? void 0 : liveSetupCopy.commentaryShort) !== null && _d !== void 0 ? _d : bot === null || bot === void 0 ? void 0 : bot.intentLine) !== null && _e !== void 0 ? _e : null,
            personalityExitNote: bot ? (0, bots_1.botPersonality)(bot.personalityId).exitAiNote : null,
        });
    }, [
        bot,
        botExitFlow,
        chartModelForPlot === null || chartModelForPlot === void 0 ? void 0 : chartModelForPlot.stop,
        chartModelForPlot === null || chartModelForPlot === void 0 ? void 0 : chartModelForPlot.target,
        exitAuto.mode,
        exitAuto.safeguards,
        liveSetupCopy === null || liveSetupCopy === void 0 ? void 0 : liveSetupCopy.commentaryShort,
        effectiveExecSide,
    ]);
    var navigateToTradeForExit = (0, react_1.useCallback)(function () {
        var _a, _b;
        var connected = accountSnapshots.find(function (s) { return s.exchange === 'bybit' && s.status === 'connected'; });
        var pos = connected ? findBybitLinearOpenLeg([connected], linearSymbol, effectiveExecSide) : null;
        var mark = live.lastPrice != null && live.lastPrice > 0 ? live.lastPrice : (_a = chartModelForPlot === null || chartModelForPlot === void 0 ? void 0 : chartModelForPlot.lastPrice) !== null && _a !== void 0 ? _a : 0;
        if (pos && mark > 0) {
            navigate("/trade?".concat((0, tradeNavigation_1.buildManageTradeQueryFromLinearPosition)(pos, {
                markPrice: mark,
                leverageFallback: (_b = pos.leverage) !== null && _b !== void 0 ? _b : 1,
            })));
            return;
        }
        if (focusSignal) {
            navigate("/trade?".concat((0, tradeNavigation_1.buildTradeQueryString)(focusSignal, { marketStatus: marketStatus })));
        }
    }, [
        accountSnapshots,
        chartModelForPlot === null || chartModelForPlot === void 0 ? void 0 : chartModelForPlot.lastPrice,
        focusSignal,
        linearSymbol,
        live.lastPrice,
        marketStatus,
        navigate,
        effectiveExecSide,
    ]);
    var executeTradeFromFocus = (0, react_1.useCallback)(function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var useReal, entryMark, amt, lev, riskModel, metrics, minOrder, orderNotionalUsd, qtyStr, sideBybit, tpSl, tpslBot, snapshotsAfter, pos, synced, _c, e_1, tradeErr;
        var _d, _e, _f;
        var amountUsd = _b.amountUsd, leverage = _b.leverage;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    if (!chartModel || !focusSignal) {
                        return [2 /*return*/, { ok: false, message: 'Chart or signal not ready.' }];
                    }
                    useReal = Boolean(bybitSnap);
                    entryMark = NaN;
                    if (Number.isFinite(chartModel.lastPrice) && chartModel.lastPrice > 0) {
                        entryMark = chartModel.lastPrice;
                    }
                    else if (live.lastPrice != null && live.lastPrice > 0) {
                        entryMark = live.lastPrice;
                    }
                    else if (Number.isFinite(chartModel.entry) && chartModel.entry > 0) {
                        entryMark = chartModel.entry;
                    }
                    if (!Number.isFinite(entryMark) || entryMark <= 0) {
                        return [2 /*return*/, { ok: false, message: 'No price yet — wait for the chart to load.' }];
                    }
                    if (!useReal) {
                        return [2 /*return*/, { ok: false, message: 'Connect Bybit in Account to execute.' }];
                    }
                    amt = roundUsdAmount(amountUsd);
                    lev = Math.min(leverage, symbolMaxLeverage !== null && symbolMaxLeverage !== void 0 ? symbolMaxLeverage : 200);
                    riskModel = __assign(__assign({}, chartModel), { balanceUsd: Math.max(0, balanceForSizing) });
                    metrics = (0, tradeRisk_1.deriveTradeMetrics)(riskModel, {
                        amountUsd: amt,
                        leverage: lev,
                        side: setupSideForExec,
                        market: 'futures',
                        setupScore: focusSignal.setupScore,
                    });
                    minOrder = resolveMinOrderUsd(linearSymbol);
                    if (amt < minOrder) {
                        return [2 /*return*/, { ok: false, message: "Minimum margin is about $".concat(minOrder, ".") }];
                    }
                    orderNotionalUsd = (0, linearOrderQty_1.applyOpenOrderNotionalBuffer)(metrics.positionSizeUsd, {
                        minNotionalUsd: minOrder,
                    });
                    qtyStr = (0, linearOrderQty_1.linearQtyFromNotionalUsd)(orderNotionalUsd, entryMark);
                    sideBybit = setupSideForExec === 'long' ? 'Buy' : 'Sell';
                    tpSl = (0, bybitLinearTpSl_1.linearTpSlStringsForOpen)(setupSideForExec, entryMark, chartModel.target, chartModel.stop).tpSl;
                    _g.label = 1;
                case 1:
                    _g.trys.push([1, 9, , 10]);
                    tpslBot = tpSl.takeProfit || tpSl.stopLoss
                        ? __assign(__assign(__assign({}, (tpSl.takeProfit ? { takeProfit: tpSl.takeProfit } : {})), (tpSl.stopLoss ? { stopLoss: tpSl.stopLoss } : {})), { tpTriggerBy: bybitTpSlTrigger_1.DEFAULT_BYBIT_TPSL_TRIGGER, slTriggerBy: bybitTpSlTrigger_1.DEFAULT_BYBIT_TPSL_TRIGGER }) : {};
                    return [4 /*yield*/, (0, tradeClient_1.postBybitLinearOrder)(__assign({ symbol: linearSymbol, side: sideBybit, qty: qtyStr, orderType: 'Market', leverage: lev, positionIdx: 0 }, tpslBot))];
                case 2:
                    _g.sent();
                    return [4 /*yield*/, refreshAccountSnapshots({ silent: false })];
                case 3:
                    snapshotsAfter = _g.sent();
                    if (!(tpSl.takeProfit || tpSl.stopLoss)) return [3 /*break*/, 7];
                    pos = findBybitLinearOpenLeg(snapshotsAfter, linearSymbol, setupSideForExec);
                    if (!(pos && Number.isFinite(pos.entryPrice) && pos.entryPrice > 0)) return [3 /*break*/, 7];
                    synced = (0, bybitLinearTpSl_1.linearTpSlStringsForOpen)(setupSideForExec, pos.entryPrice, chartModel.target, chartModel.stop);
                    if (!(synced.tpSl.takeProfit || synced.tpSl.stopLoss)) return [3 /*break*/, 7];
                    _g.label = 4;
                case 4:
                    _g.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, (0, tradeClient_1.postBybitLinearTradingStop)({
                            symbol: linearSymbol,
                            positionIdx: (_d = pos.positionIdx) !== null && _d !== void 0 ? _d : 0,
                            takeProfit: (_e = synced.tpSl.takeProfit) !== null && _e !== void 0 ? _e : '0',
                            stopLoss: (_f = synced.tpSl.stopLoss) !== null && _f !== void 0 ? _f : '0',
                            tpTriggerBy: bybitTpSlTrigger_1.DEFAULT_BYBIT_TPSL_TRIGGER,
                            slTriggerBy: bybitTpSlTrigger_1.DEFAULT_BYBIT_TPSL_TRIGGER,
                        })];
                case 5:
                    _g.sent();
                    return [3 /*break*/, 7];
                case 6:
                    _c = _g.sent();
                    return [3 /*break*/, 7];
                case 7: return [4 /*yield*/, refreshAccountSnapshots({ silent: true })];
                case 8:
                    _g.sent();
                    setExecFillEntry(entryMark);
                    setExecNotionalUsd(orderNotionalUsd);
                    setExecSideOverride(setupSideForExec);
                    setExecLive(true);
                    return [2 /*return*/, { ok: true }];
                case 9:
                    e_1 = _g.sent();
                    tradeErr = (0, bybitUserFacingError_1.resolveBybitTradeError)(e_1, 'Order failed — retry');
                    return [2 /*return*/, __assign({ ok: false, message: tradeErr.message }, (tradeErr.cta ? { cta: tradeErr.cta } : {}))];
                case 10: return [2 /*return*/];
            }
        });
    }); }, [
        balanceForSizing,
        bybitSnap,
        chartModel,
        focusSignal,
        linearSymbol,
        live.lastPrice,
        refreshAccountSnapshots,
        setupSideForExec,
        symbolMaxLeverage,
    ]);
    var actionable = Boolean(focusSignal && (0, marketScannerRows_1.isFeedActionableOpportunity)(focusSignal));
    var canExecute = Boolean(bot &&
        focusSignal &&
        hasDisplayableSetup &&
        storedStatus !== 'paused' &&
        (actionable || bot.detail.confidencePct >= 62));
    /** Shown beside Trade when execution is disabled — matches `canExecute` guardrails. */
    var tradeDisabledNote = (0, react_1.useMemo)(function () {
        if (canExecute || !bot)
            return null;
        if (!focusSignal)
            return 'No signal for this pair';
        if (storedStatus === 'paused')
            return 'Resume bot to trade';
        if (!hasDisplayableSetup)
            return 'No active setup';
        if (!actionable && bot.detail.confidencePct < 62)
            return 'Need score 65+ or 62% confidence';
        return null;
    }, [actionable, bot, canExecute, focusSignal, hasDisplayableSetup, storedStatus]);
    var confidencePct = bot
        ? Math.round((bot.detail.confidencePct + ((_c = focusSignal === null || focusSignal === void 0 ? void 0 : focusSignal.setupScore) !== null && _c !== void 0 ? _c : bot.detail.confidencePct)) / 2)
        : 0;
    var stateLabel = bot
        ? focusStateLabel({
            paused: storedStatus === 'paused',
            pending: Boolean(bot.expandedSetupPending),
            hasSignal: focusSignal != null && !focusSignal.id.startsWith('tracked-'),
            actionable: actionable,
            marketStatus: marketStatus,
        })
        : 'Watching';
    var activityLines = (0, react_1.useMemo)(function () {
        var _a, _b, _c;
        if (!bot || !focusSignal)
            return [];
        var p0 = pairFromWatched((_a = bot.watchedPairs[0]) !== null && _a !== void 0 ? _a : 'BTC');
        var p1 = pairFromWatched((_b = bot.watchedPairs[1]) !== null && _b !== void 0 ? _b : p0);
        var p2 = pairFromWatched((_c = bot.watchedPairs[2]) !== null && _c !== void 0 ? _c : p1);
        var lines = [
            "Scanned ".concat(p0, " \u2014 ").concat(hasDisplayableSetup ? 'structure mapped' : 'no valid setup'),
            "Monitoring ".concat(p1, " after ").concat(marketStatus === 'developing' ? 'impulse' : 'pullback'),
        ];
        if (!hasDisplayableSetup) {
            lines.push("Rejected ".concat(p2, " \u2014 ").concat(bot.detail.marketContext.volume === 'Weak' ? 'low volume' : 'timing'));
        }
        else {
            lines.push("".concat(p2, " momentum check complete"));
        }
        if (marketStatus === 'triggered') {
            lines.push("Trigger watch on ".concat(focusSignal.pair));
        }
        return lines.slice(0, 5);
    }, [bot, focusSignal, hasDisplayableSetup, marketStatus]);
    var whyExplainKey = (0, react_1.useMemo)(function () {
        return bot && focusSignal && chartModel
            ? "".concat(bot.id, ":").concat(focusSignal.id, ":").concat(linearSymbol, ":").concat(chartInterval)
            : '';
    }, [bot, focusSignal, chartModel, linearSymbol, chartInterval]);
    var tradeScoreForWhy = (0, react_1.useMemo)(function () {
        if (!focusSignal)
            return 55;
        if (bot && hasDisplayableSetup)
            return Math.round((bot.detail.confidencePct + focusSignal.setupScore) / 2);
        return focusSignal.setupScore;
    }, [bot, focusSignal, hasDisplayableSetup]);
    var _2 = (0, react_1.useState)(null), whyAiCache = _2[0], setWhyAiCache = _2[1];
    var _3 = (0, react_1.useState)(false), whyAiLoading = _3[0], setWhyAiLoading = _3[1];
    var whyDisplay = (whyAiCache === null || whyAiCache === void 0 ? void 0 : whyAiCache.key) === whyExplainKey ? whyAiCache : null;
    (0, react_1.useEffect)(function () {
        if (!whyOpen || !whyExplainKey || !bot || !focusSignal || !chartModel)
            return;
        if ((whyAiCache === null || whyAiCache === void 0 ? void 0 : whyAiCache.key) === whyExplainKey)
            return;
        var cancelled = false;
        setWhyAiLoading(true);
        void (function () { return __awaiter(_this, void 0, void 0, function () {
            var status, ctx, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        status = (0, marketScannerRows_1.deriveMarketStatus)(focusSignal);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, , 3, 4]);
                        ctx = (0, buildGroundedMarketContext_1.buildGroundedMarketContext)({
                            signal: focusSignal,
                            status: status,
                            tradeScore: tradeScoreForWhy,
                            market: 'futures',
                            chartInterval: String(chartInterval),
                            model: chartModel,
                            recentCandles: chartModel.chartCandles,
                        });
                        return [4 /*yield*/, (0, client_1.requestAssistantSuggestion)({
                                action: 'explain',
                                signal: focusSignal,
                                status: status,
                                tradeScore: tradeScoreForWhy,
                                context: ctx,
                            })];
                    case 2:
                        res = _a.sent();
                        if (!cancelled) {
                            setWhyAiCache({
                                key: whyExplainKey,
                                headline: res.headline,
                                body: res.body,
                                source: res.source,
                            });
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        if (!cancelled)
                            setWhyAiLoading(false);
                        return [7 /*endfinally*/];
                    case 4: return [2 /*return*/];
                }
            });
        }); })();
        return function () {
            cancelled = true;
        };
    }, [
        whyOpen,
        whyExplainKey,
        whyAiCache === null || whyAiCache === void 0 ? void 0 : whyAiCache.key,
        bot,
        focusSignal,
        chartModel,
        chartInterval,
        tradeScoreForWhy,
    ]);
    var onIntervalChange = function (v) {
        try {
            window.localStorage.setItem(tradeChartIntervalPreference_1.TRADE_CHART_INTERVAL_STORAGE_KEY, v);
            window.dispatchEvent(new CustomEvent(tradeChartIntervalPreference_1.SIGFLO_CHART_INTERVAL_EVENT, { detail: v }));
        }
        catch (_a) {
            /* ignore */
        }
    };
    var tapFlashTimerRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(function () {
        return function () {
            if (tapFlashTimerRef.current != null)
                window.clearTimeout(tapFlashTimerRef.current);
        };
    }, []);
    var flash = function (id) {
        if (tapFlashTimerRef.current != null)
            window.clearTimeout(tapFlashTimerRef.current);
        setTapFlash(id);
        tapFlashTimerRef.current = window.setTimeout(function () {
            setTapFlash(null);
            tapFlashTimerRef.current = null;
        }, 160);
    };
    (0, react_1.useEffect)(function () {
        var fs = searchParams.get('focusSetup');
        if (fs !== '1' && fs !== 'true')
            return;
        if (!bot || !chartModelForPlot)
            return;
        var t = window.setTimeout(function () {
            (0, chartSetupFocus_1.requestChartSetupFocus)({ pairFilter: chartModelForPlot.pair, botName: bot.name });
            setSearchParams(function (prev) {
                var n = new URLSearchParams(prev);
                n.delete('focusSetup');
                return n;
            }, { replace: true });
        }, 160);
        return function () { return clearTimeout(t); };
    }, [bot, chartModelForPlot, searchParams, setSearchParams]);
    if (!bot) {
        return (<div className="space-y-3 pt-4 text-landing-text">
        <p className="text-sm text-landing-muted">Bot not found.</p>
        <react_router_dom_1.Link to="/bots" className="text-sm font-semibold text-landing-accent-hi">
          Back to Bots
        </react_router_dom_1.Link>
      </div>);
    }
    if (!chartModel || !chartModelForPlot) {
        return (<div className="flex min-h-[40vh] items-center justify-center text-sm text-landing-muted">
        Preparing chart…
      </div>);
    }
    var setupSide = setupSideForExec;
    var rrDisplay = hasDisplayableSetup
        ? rrFromLevels(chartModel.side, chartModel.entry, chartModel.stop, chartModel.target)
        : chartModel.riskReward;
    var stickyTone = hasDisplayableSetup && cardStatus !== 'paused'
        ? 'shadow-[0_12px_40px_-12px_rgba(0,200,120,0.25)] ring-1 ring-landing-accent/15'
        : 'shadow-[0_8px_32px_rgba(0,0,0,0.35)]';
    var plotHeightPx = fullChartMode ? fullChartPlotPx : tradeChartHeights_1.BOT_FOCUS_CHART_PLOT_PX;
    var chartPanelProps = {
        collapsed: false,
        plotExpandedPx: plotHeightPx,
        plotCollapsedPx: plotHeightPx,
        chartPlotFlexFill: fullChartMode && tradeChartHeights_1.BOT_FOCUS_FULL_CHART_PLOT_FLEX_FILL,
        chartWrapClassName: fullChartMode && tradeChartHeights_1.BOT_FOCUS_FULL_CHART_PLOT_FLEX_FILL
            ? 'mx-auto flex h-full min-h-0 min-w-0 w-full max-w-full flex-1 flex-col px-1 sm:px-2'
            : fullChartMode
                ? 'mx-auto h-full w-full max-w-full px-1 sm:px-2'
                : 'mx-auto w-full max-w-full px-1.5',
        timeScaleMaxBarSpacingPx: tradeChartHeights_1.CHART_TIMESCALE_MAX_BAR_SPACING_PX,
        model: chartModelForPlot,
        market: 'futures',
        intervalLabel: (0, tradeChartIntervalPreference_1.tradeChartIntervalShortLabel)(chartInterval),
        loadingInterval: live.loadingInterval,
        liveUpdatedAt: live.lastUpdateTs,
        change24hPct: chartModelForPlot.change24hPct,
        timeframeOptions: FOCUS_INTERVAL_OPTIONS,
        chartInterval: chartInterval,
        onChartIntervalChange: onIntervalChange,
        exchangeStyleHero: true,
        metaCaption: (execLive ? 'PERP · Live position' : fullChartMode ? 'PERP · Full chart' : 'PERP · Bot focus'),
        setupMode: chartSetupMode,
        onSetupModeToggle: onChartSetupModeToggle,
        liveTradeMode: execLive,
        liveTradeOverlayPreset: execLive,
        suppressExchangeHeroLivePrice: execLive,
        liveActivePositionTitle: 'Live position',
        auxiliaryPriceLines: botExitChartAux,
        liveTradeRefitKey: execLive && execFillEntry != null ? "bot-focus-".concat(execFillEntry) : undefined,
        /** Snap time scale to the live candle when opening focus / switching pair (see PriceChartCard). */
        chartViewportSnapKey: whyExplainKey || undefined,
        liveHeaderMetrics: __assign({ riskPercent: chartModelForPlot.entry > 0
                ? Math.abs(((chartModelForPlot.stop - chartModelForPlot.entry) / chartModelForPlot.entry) * 100)
                : 0, rewardPercent: chartModelForPlot.entry > 0
                ? Math.abs(((chartModelForPlot.target - chartModelForPlot.entry) / chartModelForPlot.entry) * 100)
                : 0, rrRatio: Number.isFinite(rrDisplay) && rrDisplay > 0 ? rrDisplay : chartModelForPlot.riskReward, badge: "".concat(confidencePct, "%") }, (headerSecondaryPnl
            ? {
                secondaryLine: headerSecondaryPnl.label,
                secondaryLineTone: headerSecondaryPnl.tone,
            }
            : {})),
        pnlHeaderLabel: execLive ? headerSecondaryPnl === null || headerSecondaryPnl === void 0 ? void 0 : headerSecondaryPnl.label : undefined,
        pnlHeaderTone: execLive ? headerSecondaryPnl === null || headerSecondaryPnl === void 0 ? void 0 : headerSecondaryPnl.tone : undefined,
        className: fullChartMode && tradeChartHeights_1.BOT_FOCUS_FULL_CHART_PLOT_FLEX_FILL
            ? 'flex min-h-0 min-w-0 flex-1 flex-col pb-0'
            : fullChartMode
                ? 'min-h-0 flex-1 pb-0'
                : 'pb-1',
        chartInnerChromeToggle: {
            expanded: fullChartMode,
            onToggle: function () {
                flash('expand');
                setFullChartMode(!fullChartMode);
            },
            variant: 'immersive',
        },
        onSetupFocusBanner: onSetupFocusBannerCb,
        tradePlanExitLabel: (execLive ? 'ai' : 'exit'),
    };
    var biasOverlay = (<div className="pointer-events-none absolute left-0 top-[3.5rem] z-[5] max-w-[min(100%,18rem)] px-3">
      <span className={"inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase leading-none tracking-wide backdrop-blur-sm shadow-[0_0_20px_rgba(0,200,120,0.2)] ".concat(setupSide === 'short'
            ? 'border-rose-400/40 bg-rose-500/18 text-rose-100 shadow-[0_0_20px_rgba(248,113,113,0.2)]'
            : 'border-landing-accent/40 bg-landing-accent-dim text-landing-accent-hi')}>
        {setupSide === 'short' ? 'Short' : 'Long'} · {confidencePct}%
      </span>
    </div>);
    var pairPicker = bot.watchedPairs.length > 1 ? (<div className="relative z-[6] shrink-0 bg-landing-bg/95 px-3 py-2">
        <div className="flex min-h-[2rem] items-center gap-1.5 overflow-x-auto overflow-y-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {bot.watchedPairs.map(function (p) {
            var active = pairFromWatched(p) === pairFromWatched(selectedWatched);
            return (<button key={p} type="button" onClick={function () {
                    flash("pair-".concat(p));
                    setSelectedPairRaw(p);
                }} className={"shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition active:scale-[0.97] ".concat(active
                    ? 'border-landing-accent/40 bg-landing-accent-dim text-landing-accent-hi'
                    : 'border-white/[0.08] bg-landing-surface/80 text-landing-muted', " ").concat(tapFlash === "pair-".concat(p) ? 'brightness-110' : '')}>
                {pairFromWatched(p)}
              </button>);
        })}
        </div>
      </div>) : null;
    return (<framer_motion_1.motion.div layout={fullChartMode} className={fullChartMode
            ? 'sigflo-bot-focus-root fixed inset-0 z-[95] flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-landing-bg text-landing-text motion-reduce:transition-none'
            : 'sigflo-bot-focus-root relative -mx-4 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-landing-bg text-landing-text'} transition={{ layout: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}>
      {setupFocusBanner ? (<div className="pointer-events-none fixed left-0 right-0 z-[98] flex justify-center px-4" style={{
                top: fullChartMode
                    ? 'calc(env(safe-area-inset-top, 0px) + 3.25rem)'
                    : 'calc(env(safe-area-inset-top, 0px) + 4.25rem)',
            }} role="status">
          <p className="max-w-sm rounded-full border border-landing-accent/35 bg-landing-bg/95 px-4 py-2 text-center text-[11px] font-semibold text-landing-accent-hi shadow-lg backdrop-blur-md">
            {setupFocusBanner}
          </p>
        </div>) : null}
      {fullChartMode ? (<>
          <BotFocusFullChartChrome_1.BotFocusFullChartTopBar bot={bot} onBack={function () { return setFullChartMode(false); }} pairLabel={chartModel.pair} onOpenTradeWorkspace={function () {
                if (focusSignal)
                    navigate("/trade?".concat((0, tradeNavigation_1.buildTradeQueryString)(focusSignal, { marketStatus: marketStatus })));
            }}/>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain px-1 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] [-webkit-overflow-scrolling:touch] touch-pan-y">
            <div className="pointer-events-none shrink-0 px-2 pt-1 text-center">
              <p className="text-[10px] font-medium tracking-tight text-landing-muted/80">
                {bot.detail.setupStateLabel}
              </p>
            </div>
            {pairPicker}
            <div className="relative flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden">
              <framer_motion_1.motion.div layout={false} ref={chartSlotRef} className={"relative min-h-0 w-full min-w-0 overflow-hidden motion-reduce:transition-none ".concat(tradeChartHeights_1.BOT_FOCUS_FULL_CHART_PLOT_FLEX_FILL ? 'flex min-h-0 flex-1 flex-col' : '')} style={{
                flex: "1 1 ".concat(tradeChartHeights_1.BOT_FOCUS_FULL_CHART_FLEX_BASIS),
                minHeight: tradeChartHeights_1.BOT_FOCUS_FULL_CHART_PLOT_FLEX_FILL ? 220 : 0,
                paddingBottom: tradeChartHeights_1.BOT_FOCUS_FULL_CHART_DOCK_GAP_PX,
            }}>
                <TradeChartPanel_1.TradeChartPanel {...chartPanelProps}/>
                {biasOverlay}
              </framer_motion_1.motion.div>
            </div>
            <BotFocusFullChartChrome_1.BotFocusChartToolsDock chartInterval={chartInterval} onIntervalChange={onIntervalChange} options={FOCUS_INTERVAL_OPTIONS} onFocusSetup={function () {
                return (0, chartSetupFocus_1.requestChartSetupFocus)({ pairFilter: chartModelForPlot.pair, botName: bot.name });
            }}/>
            {execLive && chartModelForPlot && focusSignal ? (<div className="shrink-0 border-t border-landing-border/40 bg-landing-bg/90 px-2 py-2">
                <ExitAiCoPilotBlock_1.ExitAiCoPilotBlock model={botExitAiModel} exitMode={exitAuto.mode} onExitModeChange={exitAuto.setMode} onCloseNow={navigateToTradeForExit} compact/>
              </div>) : null}
            <BotFocusFullChartChrome_1.BotFocusInsightDrawer open={insightDrawerOpen} onToggle={function () { return setInsightDrawerOpen(function (v) { return !v; }); }} bot={bot} hasActiveSetup={hasDisplayableSetup} rrDisplay={Number.isFinite(rrDisplay) ? rrDisplay : chartModel.riskReward} toggleClassName="pr-[4.75rem] sm:pr-[5.25rem]" intentDisplay={liveSetupCopy === null || liveSetupCopy === void 0 ? void 0 : liveSetupCopy.intentLine} commentaryDisplay={liveSetupCopy === null || liveSetupCopy === void 0 ? void 0 : liveSetupCopy.commentaryShort} structureNote={liveSetupCopy === null || liveSetupCopy === void 0 ? void 0 : liveSetupCopy.structureFootnote}/>
          </div>
        </>) : (<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain [-webkit-overflow-scrolling:touch] touch-pan-y">
          {/*
              Sticky only the compact chrome — not the chart. A tall sticky block + chart touch handling
              made the cockpit feel non-scrollable on many phones.
            */}
          <div className={"sticky top-0 z-20 -mx-0 border-b border-landing-border/60 bg-landing-bg/95 backdrop-blur-xl ".concat(stickyTone)}>
            <BotFocusHeader bot={bot} cardStatus={cardStatus} onBack={canGoBack ? function () { return navigate(-1); } : undefined}/>
            <div className="border-t border-landing-border/50 bg-black/20 px-3 py-1.5">
              <p className="text-[9px] leading-snug text-landing-muted">
                <span className="font-semibold text-landing-accent-hi">{tradingModeMeta.shortLabel}</span>
                <span className="text-landing-muted/80"> · </span>
                {tradingModeMeta.focusHint}
                {tradingControlMode === 'auto' && !tradingControlMode_1.TRADING_AUTO_EXECUTION_ACTIVE ? (<span className="text-amber-200/90"> Change mode on Bots.</span>) : null}
              </p>
            </div>
          </div>
          {pairPicker}
          <div className="relative w-full shrink-0">
            <framer_motion_1.motion.div layout={false} ref={chartSlotRef} className="relative w-full shrink-0" transition={{ layout: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}>
              <TradeChartPanel_1.TradeChartPanel {...chartPanelProps}/>
              {biasOverlay}
            </framer_motion_1.motion.div>
          </div>
          <div className="space-y-4 px-4 pb-[calc(12.5rem+env(safe-area-inset-bottom))] pt-4 md:pb-[calc(13rem+env(safe-area-inset-bottom))]">
        <section className="rounded-2xl border border-landing-border bg-landing-surface landing-panel-texture p-4 shadow-landing-card">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-landing-muted">Intent</p>
          <p className="mt-1.5 text-sm font-medium leading-snug text-landing-text">
            {(_d = liveSetupCopy === null || liveSetupCopy === void 0 ? void 0 : liveSetupCopy.intentLine) !== null && _d !== void 0 ? _d : bot.intentLine}
          </p>
          {(liveSetupCopy === null || liveSetupCopy === void 0 ? void 0 : liveSetupCopy.structureFootnote) ? (<p className="mt-1 text-[10px] leading-snug text-landing-muted">{liveSetupCopy.structureFootnote}</p>) : null}
          <p className="mt-2 text-xs leading-relaxed text-landing-muted">
            {(_f = (_e = liveSetupCopy === null || liveSetupCopy === void 0 ? void 0 : liveSetupCopy.commentaryShort) !== null && _e !== void 0 ? _e : bot.detail.commentaryShort) !== null && _f !== void 0 ? _f : bot.detail.aiNote}
          </p>
          <div className="mt-3 inline-flex items-center rounded-full border border-white/[0.08] bg-black/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-landing-accent-hi">
            {stateLabel}
          </div>
        </section>

        {execLive && chartModelForPlot && focusSignal ? (<ExitAiCoPilotBlock_1.ExitAiCoPilotBlock model={botExitAiModel} exitMode={exitAuto.mode} onExitModeChange={exitAuto.setMode} onCloseNow={navigateToTradeForExit} compact/>) : null}

        <section className={"rounded-2xl border bg-landing-surface landing-panel-texture p-4 ".concat(hasDisplayableSetup ? 'border-landing-accent/25 shadow-landing-glow-sm' : 'border-landing-border')}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-landing-muted">Setup</p>
          {hasDisplayableSetup ? (<dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
              <div>
                <dt className="text-landing-muted">Bias</dt>
                <dd className="mt-0.5 font-semibold text-landing-text">
                  {chartModel.side === 'long' ? 'Long' : 'Short'}
                </dd>
              </div>
              <div>
                <dt className="text-landing-muted">Confidence</dt>
                <dd className="mt-0.5 font-semibold text-landing-accent-hi">{bot.detail.confidencePct}%</dd>
              </div>
              <div>
                <dt className="text-landing-muted">Entry</dt>
                <dd className="mt-0.5 font-mono text-landing-text">{(0, bots_1.formatBotPrice)(chartModel.entry)}</dd>
              </div>
              <div>
                <dt className="text-landing-muted">Stop</dt>
                <dd className="mt-0.5 font-mono text-rose-200/90">{(0, bots_1.formatBotPrice)(chartModel.stop)}</dd>
              </div>
              <div>
                <dt className="text-landing-muted">Target</dt>
                <dd className="mt-0.5 font-mono text-emerald-200/90">{(0, bots_1.formatBotPrice)(chartModel.target)}</dd>
              </div>
              <div>
                <dt className="text-landing-muted">R:R</dt>
                <dd className="mt-0.5 font-mono font-semibold text-landing-text">
                  {Number.isFinite(rrDisplay) && rrDisplay > 0 ? "".concat(rrDisplay.toFixed(2), " : 1") : '—'}
                </dd>
              </div>
            </dl>) : (<div className="mt-2">
              <p className="text-sm font-semibold text-landing-text">No active setup</p>
              <p className="mt-1 text-xs text-landing-muted">Bot is monitoring market conditions</p>
            </div>)}
        </section>

        <section>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-landing-muted">
            Market context
          </p>
          <MarketContextTags volatility={bot.detail.marketContext.volatility} structure={bot.detail.marketContext.structure} volume={bot.detail.marketContext.volume}/>
        </section>

        <section>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-landing-muted">Activity</p>
          <ul className="space-y-2">
            {activityLines.map(function (line) { return (<li key={line} className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#12171f] py-2.5 pl-3 pr-2 text-xs text-landing-text/90">
                <span className="pointer-events-none absolute left-0 top-0 z-[1] h-full w-0.5 rounded-full bg-landing-accent/50" aria-hidden/>
                <span className="relative z-[1] block">{line}</span>
              </li>); })}
          </ul>
        </section>

        <section className="rounded-2xl border border-landing-accent/20 bg-landing-surface landing-panel-texture p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-landing-muted">Agent personality</p>
          <p className="mt-2 text-sm font-medium leading-snug text-landing-text">{(0, bots_1.botPersonality)(bot.personalityId).tagline}</p>
          <ul className="mt-3 space-y-1.5">
            {(0, bots_1.botPersonality)(bot.personalityId).traits.map(function (t) { return (<li key={t} className="flex gap-2 text-[11px] leading-snug text-landing-muted">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-landing-accent/70" aria-hidden/>
                <span>{t}</span>
              </li>); })}
          </ul>
          <p className="mt-3 rounded-xl border border-white/[0.06] bg-black/25 px-3 py-2 text-[10px] leading-relaxed text-landing-muted">
            Exit AI readouts respect this style in <span className="font-semibold text-landing-accent-hi/95">suggestion</span>{' '}
            mode — you stay in control; auto-exit is off unless you enable it later.
          </p>
        </section>

        <section className="rounded-2xl border border-landing-border bg-[#12171f]">
          <button type="button" onClick={function () { return setWhyOpen(function (v) { return !v; }); }} className="flex w-full items-center justify-between px-3 py-2.5 text-left text-xs font-semibold text-landing-text transition active:bg-white/[0.04]">
            Why this setup?
            <span className="text-landing-muted">{whyOpen ? '−' : '+'}</span>
          </button>
          {whyOpen ? (<div className="border-t border-landing-border px-3 py-2.5">
              {whyAiLoading && !whyDisplay ? (<div className="space-y-2" aria-busy="true" aria-live="polite">
                  <div className="h-3 w-[85%] animate-pulse rounded bg-white/[0.08]"/>
                  <div className="h-3 w-full animate-pulse rounded bg-white/[0.06]"/>
                  <div className="h-3 w-[92%] animate-pulse rounded bg-white/[0.06]"/>
                  <p className="text-[10px] font-medium text-landing-muted">Generating explanation…</p>
                </div>) : whyDisplay ? (<div className="space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 text-xs font-semibold leading-snug text-landing-text">
                      {whyDisplay.headline}
                    </p>
                    <span className={"shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ".concat(whyDisplay.source === 'remote'
                        ? 'border-emerald-400/35 bg-emerald-500/15 text-emerald-200'
                        : 'border-amber-400/35 bg-amber-500/15 text-amber-200')}>
                      {whyDisplay.source === 'remote' ? 'AI live' : 'Offline'}
                    </span>
                  </div>
                  <p className="whitespace-pre-line text-xs leading-relaxed text-landing-muted">{whyDisplay.body}</p>
                  <p className="border-t border-landing-border pt-2 text-[10px] leading-relaxed text-landing-muted/90">
                    <span className="font-semibold text-landing-muted">Agent note: </span>
                    {bot.detail.aiNote}
                  </p>
                </div>) : (<p className="text-xs leading-relaxed text-landing-muted">
                  {whyExplainKey
                        ? 'Could not load chart context for AI. Showing the static agent note below.'
                        : 'Open a market on this bot to generate an explanation.'}
                  {bot.detail.aiNote ? (<>
                      {' '}
                      <span className="block pt-2">{bot.detail.aiNote}</span>
                    </>) : null}
                </p>)}
            </div>) : null}
        </section>
          </div>
        </div>)}

      {!fullChartMode && !executionOpen ? (<div className={"fixed left-0 right-0 z-[35] border-t border-landing-border bg-landing-surface landing-panel-texture px-4 py-2.5 backdrop-blur-xl transition ".concat(tapFlash === 'trade' ? 'brightness-105' : '')} style={{ bottom: 'calc(5.35rem + env(safe-area-inset-bottom, 0px))' }}>
        <button type="button" disabled={!canExecute} onClick={function () {
                flash('trade');
                setExecutionOpen(true);
            }} className={"w-full rounded-xl bg-landing-accent py-2.5 text-sm font-bold text-landing-bg transition enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-landing-muted disabled:shadow-none ".concat(canExecute ? 'sigflo-bot-focus-trade-fab-tradable' : 'shadow-landing-glow-sm')}>
          Execute trade
        </button>
        {tradeDisabledNote ? (<p className="mt-1.5 text-center text-[10px] leading-snug text-landing-muted/90">{tradeDisabledNote}</p>) : null}
        <div className="mt-2 grid grid-cols-3 gap-2">
          <button type="button" onClick={function () {
                flash('pause');
                togglePause(bot.id);
            }} className={"rounded-xl border border-landing-border bg-landing-bg/80 py-2 text-[11px] font-semibold transition active:scale-[0.98] ".concat(storedStatus === 'paused' ? 'text-landing-accent-hi' : 'text-landing-text')}>
            {storedStatus === 'paused' ? 'Resume' : 'Pause bot'}
          </button>
          <button type="button" onClick={function () {
                flash('risk');
                if (adjustRiskFocusSnapshot)
                    setAdjustRiskOpen(true);
                else
                    navigate("/bots/".concat(bot.id, "/settings"));
            }} className="rounded-xl border border-landing-border bg-landing-bg/80 py-2 text-[11px] font-semibold text-landing-text transition active:scale-[0.98]">
            Adjust risk
          </button>
          <button type="button" onClick={function () {
                flash('chart');
                setFullChartMode(true);
            }} className="rounded-xl border border-landing-border bg-landing-bg/80 py-2 text-[11px] font-semibold text-landing-text transition active:scale-[0.98]">
            Full chart
          </button>
        </div>
      </div>) : null}

      {fullChartMode && !executionOpen ? (<div className="pointer-events-none fixed inset-x-0 z-[100] flex justify-end pr-[max(0.5rem,env(safe-area-inset-right,0px))] pl-2" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 3.5rem)' }}>
          {/*
              Column stays pointer-events-none so only the compact control clusters capture taps.
              A single pointer-events-auto wrapper was as wide as note+FAB and blocked the Insights Hide row underneath.
            */}
          <div className="pointer-events-none flex w-fit flex-col items-end gap-2">
            <div className="pointer-events-auto flex w-fit flex-col gap-1.5 rounded-2xl border border-landing-border/80 bg-landing-surface landing-panel-texture p-1.5 shadow-landing-card backdrop-blur-md">
              <button type="button" onClick={function () {
                flash('pause');
                togglePause(bot.id);
            }} className={"rounded-xl border border-white/[0.06] bg-landing-bg/80 px-3 py-2 text-[10px] font-semibold transition active:scale-[0.98] ".concat(storedStatus === 'paused' ? 'text-landing-accent-hi' : 'text-landing-text')}>
                {storedStatus === 'paused' ? 'Resume' : 'Pause'}
              </button>
              <button type="button" onClick={function () {
                if (adjustRiskFocusSnapshot)
                    setAdjustRiskOpen(true);
                else
                    navigate("/bots/".concat(bot.id, "/settings"));
            }} className="rounded-xl border border-white/[0.06] bg-landing-bg/80 px-3 py-2 text-[10px] font-semibold text-landing-text transition active:scale-[0.98]">
                Risk
              </button>
            </div>
            <div className="pointer-events-auto flex w-fit max-w-[min(100vw-1rem,14rem)] items-center justify-end gap-2">
              {tradeDisabledNote ? (<p className="max-w-[6.75rem] text-right text-[9px] font-medium leading-tight text-landing-muted/90">
                  {tradeDisabledNote}
                </p>) : null}
              <button type="button" disabled={!canExecute} onClick={function () {
                flash('trade');
                setExecutionOpen(true);
            }} className={"shrink-0 flex h-14 w-14 items-center justify-center rounded-full bg-landing-accent text-xs font-bold leading-tight text-landing-bg transition enabled:active:scale-[0.96] disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-landing-muted disabled:shadow-none ".concat(canExecute
                ? 'sigflo-bot-focus-trade-fab-tradable'
                : 'shadow-[0_8px_28px_-6px_rgba(0,255,200,0.45)]')} aria-label="Execute trade">
                Trade
              </button>
            </div>
          </div>
        </div>) : null}

      <BotExecutionSheet_1.BotExecutionSheet open={executionOpen} onClose={function () { return setExecutionOpen(false); }} pairLabel={chartModel.pair} chartModel={chartModel} side={setupSideForExec} setupScore={(_g = focusSignal === null || focusSignal === void 0 ? void 0 : focusSignal.setupScore) !== null && _g !== void 0 ? _g : 55} balanceUsd={balanceForSizing} minOrderUsd={resolveMinOrderUsd(linearSymbol)} maxLeverage={symbolMaxLeverage !== null && symbolMaxLeverage !== void 0 ? symbolMaxLeverage : 200} onExecute={executeTradeFromFocus} onViewPosition={function () {
            if (focusSignal) {
                navigate("/trade?".concat((0, tradeNavigation_1.buildTradeQueryString)(focusSignal, { marketStatus: marketStatus })));
            }
        }} tabBarInsetPx={fullChartMode ? 16 : 74}/>

      <AdjustRiskSheet_1.AdjustRiskSheet open={adjustRiskOpen} onClose={function () { return setAdjustRiskOpen(false); }} tabBarInsetPx={fullChartMode ? 16 : 74} snapshot={adjustRiskFocusSnapshot} exitAuto={adjustRiskExitApi}/>
    </framer_motion_1.motion.div>);
}
