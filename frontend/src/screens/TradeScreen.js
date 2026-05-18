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
exports.TradeScreen = TradeScreen;
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var AssistedExitConfirmBar_1 = require("@/components/trade/AssistedExitConfirmBar");
var ExitAutomationControls_1 = require("@/components/trade/ExitAutomationControls");
var TradeChartScenarioStrip_1 = require("@/components/trade/TradeChartScenarioStrip");
var MarketToggle_1 = require("@/components/trade/MarketToggle");
var ActivePositionsPanel_1 = require("@/components/trade/ActivePositionsPanel");
var CloseAllPositionsModal_1 = require("@/components/trade/CloseAllPositionsModal");
var ClosedPositionSummaryModal_1 = require("@/components/trade/ClosedPositionSummaryModal");
var ExitModePanel_1 = require("@/components/trade/ExitModePanel");
var LiveMarketStrip_1 = require("@/components/trade/LiveMarketStrip");
var PositionActionsBar_1 = require("@/components/trade/PositionActionsBar");
var TradeChartPanel_1 = require("@/components/trade/TradeChartPanel");
var TradeActionBar_1 = require("@/components/trade/TradeActionBar");
var StatusChip_1 = require("@/components/trade/StatusChip");
var ScannerInsightCard_1 = require("@/components/trade/ScannerInsightCard");
var EntryPlanCard_1 = require("@/components/trade/EntryPlanCard");
var ExecutionLockCard_1 = require("@/components/trade/ExecutionLockCard");
var PaperTradePreview_1 = require("@/components/trade/PaperTradePreview");
var RiskReviewCard_1 = require("@/components/trade/RiskReviewCard");
var SetupThesisCard_1 = require("@/components/trade/SetupThesisCard");
var TradeReasoningTimeline_1 = require("@/components/trade/TradeReasoningTimeline");
var TradeMiniChart_1 = require("@/components/trade/TradeMiniChart");
var TradeReviewHeader_1 = require("@/components/trade/TradeReviewHeader");
var TradingControlExitBridge_1 = require("@/components/trade/TradingControlExitBridge");
var TradingControlTradeHint_1 = require("@/components/trade/TradingControlTradeHint");
var TradeControls_1 = require("@/components/trade/TradeControls");
var GuidedExecutionPanel_1 = require("@/components/trade/GuidedExecutionPanel");
var LiveIndicator_1 = require("@/components/trade/LiveIndicator");
var AdjustRiskSheet_1 = require("@/components/trade/AdjustRiskSheet");
var ManagePartialCloseSheet_1 = require("@/components/trade/position/ManagePartialCloseSheet");
var ManagePositionControlPanel_1 = require("@/components/trade/position/ManagePositionControlPanel");
var TradeStats_1 = require("@/components/trade/TradeStats");
var appRoutes_1 = require("@/config/appRoutes");
var tradeChartHeights_1 = require("@/config/tradeChartHeights");
var chartSetupFocus_1 = require("@/lib/chartSetupFocus");
var tradeReviewCockpit_1 = require("@/lib/tradeReviewCockpit");
var formatQuote_1 = require("@/lib/formatQuote");
var useCanGoBack_1 = require("@/hooks/useCanGoBack");
var useExitAutomation_1 = require("@/hooks/useExitAutomation");
var useAppAnnouncementsEnabled_1 = require("@/hooks/useAppAnnouncementsEnabled");
var globalAnnouncements_1 = require("@/lib/globalAnnouncements");
var useAccountSnapshot_1 = require("@/hooks/useAccountSnapshot");
var useSignalEngine_1 = require("@/hooks/useSignalEngine");
var useLiveTradeMarket_1 = require("@/hooks/useLiveTradeMarket");
var useThrottledLiveUnrealized_1 = require("@/hooks/useThrottledLiveUnrealized");
var manageTradeContext_1 = require("@/lib/manageTradeContext");
var tradeNavigation_1 = require("@/lib/tradeNavigation");
var tradePairFavorites_1 = require("@/lib/tradePairFavorites");
var appAnnouncementsPreference_1 = require("@/lib/appAnnouncementsPreference");
var biasFlipNotifyGate_1 = require("@/lib/biasFlipNotifyGate");
var positionBiasStat_1 = require("@/lib/positionBiasStat");
var positionHealth_1 = require("@/lib/positionHealth");
var positionMicroInsight_1 = require("@/lib/positionMicroInsight");
var marketScannerRows_1 = require("@/lib/marketScannerRows");
var signalState_1 = require("@/lib/signalState");
var aiExitAutomation_1 = require("@/lib/aiExitAutomation");
var tradeChartLevels_1 = require("@/lib/tradeChartLevels");
var tradeChartIntervalPreference_1 = require("@/lib/tradeChartIntervalPreference");
var exitFlowDisplayStabilize_1 = require("@/lib/exitFlowDisplayStabilize");
var exitAiCoPilot_1 = require("@/lib/exitAiCoPilot");
var tradeExitGuidanceFlow_1 = require("@/lib/tradeExitGuidanceFlow");
var tradeSetupExecutionModel_1 = require("@/lib/tradeSetupExecutionModel");
var setupScore_1 = require("@/lib/setupScore");
var closedPositionSummary_1 = require("@/lib/closedPositionSummary");
var buildGroundedMarketContext_1 = require("@/lib/buildGroundedMarketContext");
var exchangeTransferUrls_1 = require("@/lib/exchangeTransferUrls");
var tradeViewFromSignal_1 = require("@/lib/tradeViewFromSignal");
var exchangePositionSynthetic_1 = require("@/lib/exchangePositionSynthetic");
var bybitUserFacingError_1 = require("@/lib/bybitUserFacingError");
var bybitLinearTpSl_1 = require("@/lib/bybitLinearTpSl");
var bybitTpSlTrigger_1 = require("@/lib/bybitTpSlTrigger");
var linearOrderQty_1 = require("@/lib/linearOrderQty");
var spotSymbol_1 = require("@/lib/spotSymbol");
var tradeRisk_1 = require("@/lib/tradeRisk");
var tradeClient_1 = require("@/services/api/tradeClient");
var client_1 = require("@/services/bybit/client");
var opportunities_1 = require("@/services/opportunities");
var positions_1 = require("@/services/positions");
var DailyRiskGuardBanner_1 = require("@/components/risk/DailyRiskGuardBanner");
var dailyRiskGuard_1 = require("@/services/risk/dailyRiskGuard");
var riskSettings_1 = require("@/services/risk/riskSettings");
var tradeMath_1 = require("@/utils/tradeMath");
var PAPER_REAL_ACCOUNT_NUDGE_DISMISS_KEY = 'sigflo_paper_real_account_nudge_dismissed';
var TRADE_PAIR_PICKER_FALLBACKS = [
    (0, marketScannerRows_1.buildTrackedFallbackSignal)('BTC', 'BTCUSDT'),
    (0, marketScannerRows_1.buildTrackedFallbackSignal)('ETH', 'ETHUSDT'),
    (0, marketScannerRows_1.buildTrackedFallbackSignal)('SOL', 'SOLUSDT'),
    (0, marketScannerRows_1.buildTrackedFallbackSignal)('PAXG', 'PAXGUSDT'),
    (0, marketScannerRows_1.buildTrackedFallbackSignal)('XAG', 'XAGUSDT'),
];
/** Recent `auto_close` activity with an order submit — used to label sync feedback after the position drops off the account. */
function recentExitAiAutoCloseSubmit(activity, withinMs) {
    var cutoff = Date.now() - withinMs;
    for (var i = activity.length - 1; i >= 0; i--) {
        var e = activity[i];
        if (e.ts < cutoff)
            break;
        if (e.kind === 'auto_close' && /submitting/i.test(e.message))
            return true;
    }
    return false;
}
function roundUsdAmount(n) {
    return Math.round(n * 100) / 100;
}
/** Fresh snapshot after an order — pick the open leg for TP/SL sync (hedge-safe `positionIdx`). */
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
/** Bybit linear hedge: idx 1 = long leg, 2 = short; one-way uses 0. */
function bybitLinearPositionIdxForOpenSide(side, hedgeHintIdx) {
    if (hedgeHintIdx === 1 || hedgeHintIdx === 2) {
        return side === 'long' ? 1 : 2;
    }
    return 0;
}
function bybitLinearLegStillOpen(snapshots, orderSymbol, legSide, positionIdx) {
    var _a;
    var bybit = snapshots.find(function (s) { return s.exchange === 'bybit' && s.status === 'connected'; });
    return Boolean((_a = bybit === null || bybit === void 0 ? void 0 : bybit.positions) === null || _a === void 0 ? void 0 : _a.some(function (x) {
        var _a;
        return x.symbol === orderSymbol &&
            x.size > 0 &&
            x.side === legSide &&
            ((_a = x.positionIdx) !== null && _a !== void 0 ? _a : 0) === positionIdx;
    }));
}
/**
 * Trade screen layout map (refinement anchor):
 * - Signal / scanner state: sticky header (pair, `uiSignalState` + LiveIndicator, live connection meta).
 * - Timing / readiness: `ScannerInsightCard`, `ChartHeader` subtitle, chart dock strip (`dockDecisionMeta`).
 * - LONG / SHORT: flat dock uses full-width `DockSplitEntryButtons` (Sell/Buy two-up); sheet uses `TradeControls` when expanded.
 * - Chart, intervals, Clean vs Setup: `TradeChartPanel` → `PriceChartCard` (`SetupToggle`).
 * - Entry / stop / target overlays: `PriceChartCard`, gated by `setupMode` (default false).
 * - AI explanation: `ScannerInsightCard` (scroll stack, above scenario strip).
 */
var TRADE_CHART_INTERVAL_OPTIONS = [
    { value: '1', label: '1m' },
    { value: '5', label: '5m' },
    { value: '15', label: '15m' },
    { value: '60', label: '1H' },
    { value: '240', label: '4H' },
    { value: 'D', label: '1D' },
    { value: 'W', label: '1W' },
];
/**
 * Beta fallback minimum notional when per-symbol exchange rules are not wired yet.
 * Keep this low so small-balance users can still validate flows.
 */
var BETA_FALLBACK_MIN_ORDER_USD = 5;
/**
 * Optional symbol-specific overrides (USD notional). Add real exchange metadata when available.
 */
var SYMBOL_MIN_NOTIONAL_USD = {
    BTCUSDT: 5,
    ETHUSDT: 5,
};
function resolveMinOrderUsd(symbol, _market) {
    var _a;
    var s = symbol.toUpperCase();
    return (_a = SYMBOL_MIN_NOTIONAL_USD[s]) !== null && _a !== void 0 ? _a : BETA_FALLBACK_MIN_ORDER_USD;
}
function pairBaseToLinearSymbol(pair) {
    var raw = pair.trim().toUpperCase();
    var base = raw.includes('/') ? raw.split('/')[0].trim() : raw.replace(/USDT$/i, '').trim();
    var clean = base.replace(/[^A-Z0-9]/g, '');
    return "".concat(clean || 'BTC', "USDT");
}
/**
 * Cap for amount slider / validation when the exchange is linked. Bybit often reports
 * `availableToTrade === 0` while `totalWalletBalance` still reflects equity you see in the app;
 * using only the former makes `amountMax` 0 and triggers "Insufficient available balance".
 */
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
/** API JSON sometimes returns numeric strings; `Number.isFinite("16.91")` is false and breaks sizing. */
function coerceUsdField(value) {
    if (value == null)
        return null;
    if (typeof value === 'string' && value.trim() === '')
        return null;
    var n = Number(value);
    return Number.isFinite(n) ? n : null;
}
/** Display label for signal `pair` in the live strip ticker (matches chart pair style when possible). */
function formatSignalPairForTicker(pair) {
    var p = pair.trim();
    if (p.includes('/'))
        return p;
    var base = p.replace(/USDT$/i, '').replace(/[^a-zA-Z0-9]/g, '');
    return "".concat(base || '—', " / USDT");
}
/** Pretty pair for Bots → Trade query params (often `BTCUSDT` without slash). */
function formatBotsQueryPair(pairParam) {
    var p = pairParam.trim().toUpperCase();
    if (!p)
        return '—';
    if (p.includes('/'))
        return p;
    var base = p.replace(/USDT$/i, '').replace(/USDC$/i, '');
    if (base && base !== p)
        return "".concat(base, " / USDT");
    return p;
}
function TradeScreen() {
    var _this = this;
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
    var navigate = (0, react_router_dom_1.useNavigate)();
    var location = (0, react_router_dom_1.useLocation)();
    var canGoBack = (0, useCanGoBack_1.useCanGoBack)();
    var _v = (0, react_router_dom_1.useSearchParams)(), params = _v[0], setSearchParams = _v[1];
    var botsReviewContext = (0, react_1.useMemo)(function () {
        var _a, _b, _c, _d, _e, _f;
        var source = ((_a = params.get('source')) !== null && _a !== void 0 ? _a : '').trim().toLowerCase();
        if (source !== 'bots')
            return null;
        var pair = ((_b = params.get('pair')) !== null && _b !== void 0 ? _b : '').trim();
        var setup = ((_c = params.get('setup')) !== null && _c !== void 0 ? _c : '').trim();
        var state = ((_d = params.get('state')) !== null && _d !== void 0 ? _d : '').trim();
        var opportunityId = ((_e = params.get('opportunityId')) !== null && _e !== void 0 ? _e : '').trim();
        var dirRaw = ((_f = params.get('direction')) !== null && _f !== void 0 ? _f : '').trim().toUpperCase();
        var directionFromQuery = dirRaw === 'LONG' || dirRaw === 'SHORT' ? dirRaw : null;
        return { pair: pair, setup: setup, state: state, opportunityId: opportunityId, directionFromQuery: directionFromQuery };
    }, [params]);
    var _w = (0, react_1.useState)(undefined), botsTradeOpp = _w[0], setBotsTradeOpp = _w[1];
    var _x = (0, react_1.useState)(false), botsTradeOppLoading = _x[0], setBotsTradeOppLoading = _x[1];
    var _y = (0, react_1.useState)(null), botsPlannedStop = _y[0], setBotsPlannedStop = _y[1];
    var _z = (0, react_1.useState)(null), botsPlannedTargets = _z[0], setBotsPlannedTargets = _z[1];
    var _0 = (0, react_1.useState)(0), botsPaperPulseToken = _0[0], setBotsPaperPulseToken = _0[1];
    (0, react_1.useEffect)(function () {
        var _a;
        var id = (_a = botsReviewContext === null || botsReviewContext === void 0 ? void 0 : botsReviewContext.opportunityId) === null || _a === void 0 ? void 0 : _a.trim();
        if (!id) {
            setBotsTradeOpp(undefined);
            setBotsTradeOppLoading(false);
            return;
        }
        var cancelled = false;
        setBotsTradeOpp(undefined);
        setBotsTradeOppLoading(true);
        void (function () { return __awaiter(_this, void 0, void 0, function () {
            var opp, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, 3, 4]);
                        return [4 /*yield*/, (0, opportunities_1.getOpportunityById)(id)];
                    case 1:
                        opp = _b.sent();
                        if (!cancelled)
                            setBotsTradeOpp(opp !== null && opp !== void 0 ? opp : null);
                        return [3 /*break*/, 4];
                    case 2:
                        _a = _b.sent();
                        if (!cancelled)
                            setBotsTradeOpp(null);
                        return [3 /*break*/, 4];
                    case 3:
                        if (!cancelled)
                            setBotsTradeOppLoading(false);
                        return [7 /*endfinally*/];
                    case 4: return [2 /*return*/];
                }
            });
        }); })();
        return function () {
            cancelled = true;
        };
    }, [botsReviewContext === null || botsReviewContext === void 0 ? void 0 : botsReviewContext.opportunityId]);
    /** Deep link from Bots active strip: `/trade?pair=BTCUSDT&source=position` */
    var positionReviewFromQuery = (0, react_1.useMemo)(function () {
        var _a, _b;
        var src = ((_a = params.get('source')) !== null && _a !== void 0 ? _a : '').trim().toLowerCase();
        if (src !== 'position')
            return null;
        var raw = ((_b = params.get('pair')) !== null && _b !== void 0 ? _b : '').trim();
        if (!raw)
            return null;
        return { pairRaw: raw };
    }, [params]);
    var opportunityIdFromQuery = (0, react_1.useMemo)(function () { var _a; return ((_a = params.get('opportunityId')) !== null && _a !== void 0 ? _a : '').trim(); }, [params]);
    /** When reviewing an open Sigflo row without an engine opportunity, skip workspace setup hints. */
    var hideFreshSetupTradeHint = Boolean(positionReviewFromQuery && !opportunityIdFromQuery);
    (0, react_1.useEffect)(function () {
        if (!botsTradeOpp)
            return;
        setSide(botsTradeOpp.direction === 'LONG' ? 'long' : 'short');
    }, [botsTradeOpp]);
    /** Any `source=bots` review path stays off live exchange entry; paper preview only. */
    var liveExecutionLocked = Boolean(botsReviewContext);
    var signalId = (_a = params.get('signal')) !== null && _a !== void 0 ? _a : 'sig-1';
    var _1 = (0, react_1.useState)('futures'), market = _1[0], setMarket = _1[1];
    var _2 = (0, react_1.useState)(tradeChartIntervalPreference_1.readPersistedTradeChartInterval), chartInterval = _2[0], setChartInterval = _2[1];
    var _3 = (0, react_1.useState)(0), amountUsd = _3[0], setAmountUsd = _3[1];
    var _4 = (0, react_1.useState)(8), leverage = _4[0], setLeverage = _4[1];
    /** Bybit linear `instruments-info` max leverage for the active symbol (futures only). */
    var _5 = (0, react_1.useState)(null), symbolMaxLeverage = _5[0], setSymbolMaxLeverage = _5[1];
    var _6 = (0, react_1.useState)('long'), side = _6[0], setSide = _6[1];
    var _7 = (0, react_1.useState)(''), stopStr = _7[0], setStopStr = _7[1];
    var _8 = (0, react_1.useState)(''), targetStr = _8[0], setTargetStr = _8[1];
    /** Futures: Bybit TP/SL trigger (mark / last / index) for new orders + manage TP/SL apply. */
    var _9 = (0, react_1.useState)(bybitTpSlTrigger_1.DEFAULT_BYBIT_TPSL_TRIGGER), futuresTpSlTriggerBy = _9[0], setFuturesTpSlTriggerBy = _9[1];
    var _10 = (0, react_1.useState)(null), tradeToast = _10[0], setTradeToast = _10[1];
    var _11 = (0, react_1.useState)(null), tradeToastCta = _11[0], setTradeToastCta = _11[1];
    /** Bumps after `Notification.requestPermission()` so header/menu re-reads `Notification.permission`. */
    var _12 = (0, react_1.useState)(0), biasNotifyPermTick = _12[0], setBiasNotifyPermTick = _12[1];
    var _13 = (0, react_1.useState)(null), termsRetrySide = _13[0], setTermsRetrySide = _13[1];
    var toastClearRef = (0, react_1.useRef)(0);
    /** After an in-app close, polling will drop the leg — skip duplicate “external close” toasts. */
    var suppressExternalPositionCloseFeedbackUntilRef = (0, react_1.useRef)(0);
    /** Close-then-open reverse: snapshot can briefly show flat — do not auto-leave manage mid-flight. */
    var reverseOrderInProgressRef = (0, react_1.useRef)(false);
    var _14 = (0, react_1.useState)(null), execFlash = _14[0], setExecFlash = _14[1];
    var execFlashClearRef = (0, react_1.useRef)(0);
    /** Price chart dock always mounts collapsed; manage mode forces it open. */
    var _15 = (0, react_1.useState)(false), chartDockOpen = _15[0], setChartDockOpen = _15[1];
    /** Trade dock chart-only full-height mode (triggered by in-chart maximize control). */
    var _16 = (0, react_1.useState)(false), chartDockMaximized = _16[0], setChartDockMaximized = _16[1];
    /** Manage-position chart expand/collapse from in-chart maximize button. */
    var _17 = (0, react_1.useState)(false), manageChartMaximized = _17[0], setManageChartMaximized = _17[1];
    var _18 = (0, react_1.useState)(false), managePartialSheetOpen = _18[0], setManagePartialSheetOpen = _18[1];
    var _19 = (0, react_1.useState)(false), adjustRiskOpen = _19[0], setAdjustRiskOpen = _19[1];
    var _20 = (0, react_1.useState)(0.25), managePartialFraction = _20[0], setManagePartialFraction = _20[1];
    var _21 = (0, react_1.useState)(100), dockPartialPct = _21[0], setDockPartialPct = _21[1];
    var _22 = (0, react_1.useState)(false), dockPartialOpen = _22[0], setDockPartialOpen = _22[1];
    /** After user toggles the chart dock (title or chevron), drop the chevron glow/pulse. */
    var _23 = (0, react_1.useState)(false), chartDockChevronIdle = _23[0], setChartDockChevronIdle = _23[1];
    /** Header pair chevron: pick another tracked setup / watchlist symbol. */
    var _24 = (0, react_1.useState)(false), tradePairMenuOpen = _24[0], setTradePairMenuOpen = _24[1];
    var _25 = (0, react_1.useState)(false), tradeHeaderMoreOpen = _25[0], setTradeHeaderMoreOpen = _25[1];
    /** Bumps when watchlist toggles so `isTradePairFavorite` re-reads localStorage. */
    var _26 = (0, react_1.useState)(0), tradeFavRevision = _26[0], setTradeFavRevision = _26[1];
    var tradePairMenuRef = (0, react_1.useRef)(null);
    var tradeHeaderMoreRef = (0, react_1.useRef)(null);
    /** Tracks manual partial-close confirms so Exit AI can log success/failure follow-up. */
    var pendingManualPartialClosePctRef = (0, react_1.useRef)(null);
    /** Clean = no trade overlays; Setup = entry / stop / target (and liq on perps). */
    var _27 = (0, react_1.useState)(false), setupMode = _27[0], setSetupMode = _27[1];
    var _28 = (0, react_1.useState)(null), orderPending = _28[0], setOrderPending = _28[1];
    var _29 = (0, react_1.useState)(false), manageTpSlDirty = _29[0], setManageTpSlDirty = _29[1];
    var _30 = (0, react_1.useState)(false), manageOrderDraftDirty = _30[0], setManageOrderDraftDirty = _30[1];
    var _31 = (0, react_1.useState)(false), closeAllModalOpen = _31[0], setCloseAllModalOpen = _31[1];
    var _32 = (0, react_1.useState)(null), closedPositionSummary = _32[0], setClosedPositionSummary = _32[1];
    var _33 = (0, react_1.useState)(false), guidedExecutionOpen = _33[0], setGuidedExecutionOpen = _33[1];
    var _34 = (0, react_1.useState)('long'), guidedExecutionSide = _34[0], setGuidedExecutionSide = _34[1];
    var _35 = (0, react_1.useState)(0), tick = _35[0], setTick = _35[1];
    var appliedPortfolioDefaults = (0, react_1.useRef)(null);
    /** One-time seed for amount from balance cap (avoid default $1200 → 100% on small UTA). */
    var amountFromCapSeededRef = (0, react_1.useRef)(false);
    (0, react_1.useEffect)(function () {
        var id = window.setInterval(function () { return setTick(function (v) { return v + 1; }); }, 1000);
        return function () { return window.clearInterval(id); };
    }, []);
    var pairFromQuery = params.get('pair');
    var ticketIntent = params.get('ticketIntent');
    var modeRaw = params.get('mode');
    var manageCtx = (0, react_1.useMemo)(function () { return (0, manageTradeContext_1.parseManageTradeContext)(params); }, [params]);
    var requestedManage = modeRaw === 'manage';
    var isManageMode = Boolean(requestedManage && manageCtx);
    var manageDataInvalid = requestedManage && manageCtx === null;
    var isBotsReviewCockpit = Boolean(botsReviewContext && !isManageMode);
    var botsReviewCockpitModel = (0, react_1.useMemo)(function () {
        var _a, _b, _c, _d, _e, _f;
        if (!botsReviewContext)
            return null;
        var opp = botsTradeOpp !== null && botsTradeOpp !== void 0 ? botsTradeOpp : null;
        var pair = (opp === null || opp === void 0 ? void 0 : opp.pair) || formatBotsQueryPair(botsReviewContext.pair);
        var direction = (_b = (_a = opp === null || opp === void 0 ? void 0 : opp.direction) !== null && _a !== void 0 ? _a : botsReviewContext.directionFromQuery) !== null && _b !== void 0 ? _b : 'LONG';
        var setupType = (opp === null || opp === void 0 ? void 0 : opp.setupType) || botsReviewContext.setup || '';
        var score = (_c = opp === null || opp === void 0 ? void 0 : opp.score) !== null && _c !== void 0 ? _c : null;
        var state = (opp === null || opp === void 0 ? void 0 : opp.state) || botsReviewContext.state || '—';
        var sourceEngine = (_d = (opp ? (0, tradeReviewCockpit_1.parseSourceEngineFromOpportunityId)(opp.id) : undefined)) !== null && _d !== void 0 ? _d : (botsReviewContext.opportunityId
            ? (0, tradeReviewCockpit_1.parseSourceEngineFromOpportunityId)(botsReviewContext.opportunityId)
            : undefined);
        var riskLabel = opp ? (0, tradeReviewCockpit_1.deriveRiskLabelForReview)(opp) : 'Medium';
        var thesis = (_e = opp === null || opp === void 0 ? void 0 : opp.thesis) !== null && _e !== void 0 ? _e : 'Setup context unavailable';
        var rationale = (_f = opp === null || opp === void 0 ? void 0 : opp.rationale) !== null && _f !== void 0 ? _f : 'Pair loaded from route, but full engine context was not found.';
        var timeframeAlignment = opp === null || opp === void 0 ? void 0 : opp.timeframeAlignment;
        var timelineItems = botsTradeOppLoading && botsReviewContext.opportunityId
            ? []
            : (0, tradeReviewCockpit_1.buildReasoningTimelineItems)(opp, Boolean(opp));
        return {
            pair: pair,
            direction: direction,
            setupType: setupType,
            score: score,
            state: state,
            sourceEngine: sourceEngine,
            riskLabel: riskLabel,
            thesis: thesis,
            rationale: rationale,
            timeframeAlignment: timeframeAlignment,
            timelineItems: timelineItems,
            entryZone: opp === null || opp === void 0 ? void 0 : opp.entryZone,
            invalidation: opp === null || opp === void 0 ? void 0 : opp.invalidation,
            targets: opp === null || opp === void 0 ? void 0 : opp.targets,
        };
    }, [botsReviewContext, botsTradeOpp, botsTradeOppLoading]);
    var botsEnginePlanLevels = (0, react_1.useMemo)(function () {
        if (!isBotsReviewCockpit || !botsReviewCockpitModel)
            return null;
        if ((botsReviewContext === null || botsReviewContext === void 0 ? void 0 : botsReviewContext.opportunityId) && botsTradeOppLoading)
            return null;
        var entryPrice = (0, tradeMath_1.parseEntryZoneMidpoint)(botsReviewCockpitModel.entryZone);
        var stopPrice = (0, tradeMath_1.parsePriceFromString)(botsReviewCockpitModel.invalidation);
        var targets = (0, tradeMath_1.parseTargetPrices)(botsReviewCockpitModel.targets);
        if (entryPrice == null || stopPrice == null)
            return null;
        return {
            entryPrice: entryPrice,
            stopPrice: stopPrice,
            targets: targets,
            direction: botsReviewCockpitModel.direction,
            pair: botsReviewCockpitModel.pair,
        };
    }, [isBotsReviewCockpit, botsReviewCockpitModel, botsReviewContext === null || botsReviewContext === void 0 ? void 0 : botsReviewContext.opportunityId, botsTradeOppLoading]);
    (0, react_1.useEffect)(function () {
        if (!botsEnginePlanLevels) {
            setBotsPlannedStop(null);
            setBotsPlannedTargets(null);
            return;
        }
        setBotsPlannedStop(botsEnginePlanLevels.stopPrice);
        setBotsPlannedTargets(__spreadArray([], botsEnginePlanLevels.targets, true));
    }, [
        botsReviewContext === null || botsReviewContext === void 0 ? void 0 : botsReviewContext.opportunityId,
        botsEnginePlanLevels === null || botsEnginePlanLevels === void 0 ? void 0 : botsEnginePlanLevels.entryPrice,
        botsEnginePlanLevels === null || botsEnginePlanLevels === void 0 ? void 0 : botsEnginePlanLevels.stopPrice,
        botsEnginePlanLevels === null || botsEnginePlanLevels === void 0 ? void 0 : botsEnginePlanLevels.targets.join(','),
    ]);
    var botsPaperPreviewModel = (0, react_1.useMemo)(function () {
        var _a;
        if (!isBotsReviewCockpit || !botsReviewCockpitModel || !botsEnginePlanLevels)
            return null;
        if ((botsReviewContext === null || botsReviewContext === void 0 ? void 0 : botsReviewContext.opportunityId) && botsTradeOppLoading)
            return null;
        var entryPrice = botsEnginePlanLevels.entryPrice;
        var stopPrice = botsPlannedStop !== null && botsPlannedStop !== void 0 ? botsPlannedStop : botsEnginePlanLevels.stopPrice;
        var targets = botsPlannedTargets !== null && botsPlannedTargets !== void 0 ? botsPlannedTargets : botsEnginePlanLevels.targets;
        var direction = botsEnginePlanLevels.direction;
        var validation = (0, tradeMath_1.validateBotsPaperPlan)(entryPrice, stopPrice, targets, direction);
        return {
            entryPrice: entryPrice,
            stopPrice: stopPrice,
            targets: targets,
            direction: direction,
            previewEnabled: validation.ok,
            previewDisabledReason: validation.ok ? null : ((_a = validation.stopWarning) !== null && _a !== void 0 ? _a : validation.targetsWarning),
            planGeometryWarning: !validation.ok,
        };
    }, [
        isBotsReviewCockpit,
        botsReviewCockpitModel,
        botsEnginePlanLevels,
        botsReviewContext === null || botsReviewContext === void 0 ? void 0 : botsReviewContext.opportunityId,
        botsTradeOppLoading,
        botsPlannedStop,
        botsPlannedTargets,
    ]);
    var botsPlanDirty = (0, react_1.useMemo)(function () {
        if (!botsEnginePlanLevels)
            return false;
        var stop = botsPlannedStop !== null && botsPlannedStop !== void 0 ? botsPlannedStop : botsEnginePlanLevels.stopPrice;
        var tg = botsPlannedTargets !== null && botsPlannedTargets !== void 0 ? botsPlannedTargets : botsEnginePlanLevels.targets;
        if (stop !== botsEnginePlanLevels.stopPrice)
            return true;
        if (tg.length !== botsEnginePlanLevels.targets.length)
            return true;
        return tg.some(function (t, i) { return t !== botsEnginePlanLevels.targets[i]; });
    }, [botsEnginePlanLevels, botsPlannedStop, botsPlannedTargets]);
    var resetBotsPlanToEngine = (0, react_1.useCallback)(function () {
        if (!botsEnginePlanLevels)
            return;
        setBotsPlannedStop(botsEnginePlanLevels.stopPrice);
        setBotsPlannedTargets(__spreadArray([], botsEnginePlanLevels.targets, true));
    }, [botsEnginePlanLevels]);
    var bumpBotsPaperPreviewPulse = (0, react_1.useCallback)(function () {
        setBotsPaperPulseToken(function (t) { return t + 1; });
    }, []);
    (0, react_1.useEffect)(function () {
        if (isManageMode)
            setChartDockOpen(true);
    }, [isManageMode]);
    (0, react_1.useEffect)(function () {
        if (!isManageMode)
            setManageChartMaximized(false);
    }, [isManageMode]);
    var _36 = (0, useSignalEngine_1.useSignalEngine)(), liveSignals = _36.signals, liveTickersBySymbol = _36.liveTickersBySymbol;
    var selectedSignal = (0, react_1.useMemo)(function () {
        var _a, _b, _c, _d, _e;
        var fromQuery = buildSignalContextFromQuery(params, signalId);
        if (fromQuery) {
            var qPair_1 = fromQuery.pair.trim().toUpperCase().replace(/\s*\/\s*/g, '');
            var liveMatch = liveSignals.find(function (s) {
                var lp = s.pair.trim().toUpperCase().replace(/\s*\/\s*/g, '');
                return lp === qPair_1 || lp === qPair_1.replace(/USDT$/i, '');
            });
            if (liveMatch) {
                return __assign(__assign({}, fromQuery), { setupScore: liveMatch.setupScore, setupScoreLabel: liveMatch.setupScoreLabel, scoreBreakdown: liveMatch.scoreBreakdown, setupType: liveMatch.setupType, setupTags: liveMatch.setupTags, riskTag: liveMatch.riskTag, side: liveMatch.side, biasLabel: liveMatch.biasLabel, aiExplanation: liveMatch.aiExplanation, timingState: liveMatch.timingState, timingScore: liveMatch.timingScore, entryFreshnessScore: liveMatch.entryFreshnessScore, roomToTargetScore: liveMatch.roomToTargetScore, actionabilityScore: liveMatch.actionabilityScore, triggerType: liveMatch.triggerType, triggerReason: liveMatch.triggerReason, idealEntryPrice: liveMatch.idealEntryPrice, candlesSinceTrigger: liveMatch.candlesSinceTrigger, candlesSincePeakTiming: liveMatch.candlesSincePeakTiming, penaltyBreakdown: liveMatch.penaltyBreakdown, positiveTimingFactors: liveMatch.positiveTimingFactors, watchCue: (_a = liveMatch.watchCue) !== null && _a !== void 0 ? _a : fromQuery.watchCue, watchNext: (_b = liveMatch.watchNext) !== null && _b !== void 0 ? _b : fromQuery.watchNext, plannedEntry: (_c = liveMatch.plannedEntry) !== null && _c !== void 0 ? _c : fromQuery.plannedEntry, plannedStop: (_d = liveMatch.plannedStop) !== null && _d !== void 0 ? _d : fromQuery.plannedStop, plannedTarget: (_e = liveMatch.plannedTarget) !== null && _e !== void 0 ? _e : fromQuery.plannedTarget });
            }
            return fromQuery;
        }
        var direct = liveSignals.find(function (s) { return s.id === signalId; });
        if (direct)
            return direct;
        var legacy = resolveShellSignalForLegacyId(signalId, liveSignals);
        if (legacy)
            return legacy;
        if (liveSignals.length > 0)
            return liveSignals[0];
        return (0, marketScannerRows_1.buildTrackedFallbackSignal)('BTC', 'BTCUSDT');
    }, [params, signalId, liveSignals]);
    /** Prefer live engine signal that matches `?pair=` so levels align with that asset. */
    var signalForTrade = (0, react_1.useMemo)(function () {
        var raw = pairFromQuery === null || pairFromQuery === void 0 ? void 0 : pairFromQuery.trim();
        if (raw) {
            var sym = pairBaseToLinearSymbol(raw);
            var pair_1 = (0, marketScannerRows_1.symbolToPair)(sym);
            var fromLive = liveSignals.find(function (s) { return s.pair.trim().toUpperCase() === pair_1 || s.pair.trim().toUpperCase() === raw.toUpperCase().replace(/\s+/g, ''); });
            if (fromLive)
                return fromLive;
            return (0, marketScannerRows_1.buildTrackedFallbackSignal)(pair_1, sym);
        }
        return selectedSignal;
    }, [pairFromQuery, selectedSignal, liveSignals]);
    (0, react_1.useEffect)(function () {
        if (isManageMode || signalId.startsWith('pf-'))
            return;
        if (positionReviewFromQuery) {
            var sym = pairBaseToLinearSymbol(positionReviewFromQuery.pairRaw);
            var row = (0, positions_1.getPositionRepository)().getActivePositionByPair(sym);
            if (row) {
                setMarket('futures');
                setSide(row.direction);
                return;
            }
        }
        setSide(selectedSignal.side === 'short' ? 'short' : 'long');
    }, [isManageMode, signalId, selectedSignal.side, positionReviewFromQuery]);
    var manageSideParam = params.get('side');
    (0, react_1.useEffect)(function () {
        if (!isManageMode)
            return;
        if (manageSideParam === 'long' || manageSideParam === 'short')
            setSide(manageSideParam);
    }, [isManageMode, manageSideParam]);
    (0, react_1.useEffect)(function () {
        var fromPf = signalId.startsWith('pf-');
        if (!fromPf) {
            appliedPortfolioDefaults.current = null;
            return;
        }
        var key = "".concat(signalId, "|").concat(params.toString());
        if (appliedPortfolioDefaults.current === key)
            return;
        appliedPortfolioDefaults.current = key;
        var pu = Number(params.get('positionUsd'));
        if (Number.isFinite(pu) && pu > 0) {
            setAmountUsd(roundUsdAmount(Math.min(Math.max(pu, 0.01), 1000000)));
        }
        var s = params.get('side');
        if (s === 'long' || s === 'short')
            setSide(s);
    }, [params, signalId]);
    var scannerStatus = (0, react_1.useMemo)(function () {
        var derived = (0, marketScannerRows_1.deriveMarketStatus)(selectedSignal);
        var queryStatus = (0, marketScannerRows_1.parseMarketStatusQuery)(params.get('marketStatus'));
        if (queryStatus == null)
            return derived;
        var selectedSym = pairBaseToLinearSymbol(selectedSignal.pair);
        var hasLiveMatchForSelected = liveSignals.some(function (s) { return pairBaseToLinearSymbol(s.pair) === selectedSym; });
        // Prevent stale URL `marketStatus` from pinning timing chips after live score/status updates.
        return hasLiveMatchForSelected ? derived : queryStatus;
    }, [liveSignals, params, selectedSignal]);
    var uiState = (0, signalState_1.uiSignalStateFromMarketStatus)(scannerStatus);
    var uiStateStyle = (0, signalState_1.uiSignalStateClasses)(uiState);
    var isTriggered = uiState === 'triggered';
    var stateAgeLabel = (0, react_1.useMemo)(function () { return (0, signalState_1.formatElapsedAgo)((0, signalState_1.postedAgoToSeconds)(selectedSignal.postedAgo) + tick); }, [selectedSignal.postedAgo, tick]);
    var liveSymbol = (0, react_1.useMemo)(function () {
        if (pairFromQuery === null || pairFromQuery === void 0 ? void 0 : pairFromQuery.trim())
            return pairBaseToLinearSymbol(pairFromQuery);
        return pairBaseToLinearSymbol(selectedSignal.pair);
    }, [pairFromQuery, selectedSignal.pair]);
    (0, react_1.useEffect)(function () {
        (0, biasFlipNotifyGate_1.setBiasFlipNotifyTradeFocusLinearSymbol)(liveSymbol.trim() ? liveSymbol.trim().toUpperCase() : null);
    }, [liveSymbol]);
    var tradePairPickerSignals = (0, react_1.useMemo)(function () {
        var source = liveSignals.length > 0 ? liveSignals : TRADE_PAIR_PICKER_FALLBACKS;
        var bySym = new Map();
        for (var _i = 0, source_1 = source; _i < source_1.length; _i++) {
            var s = source_1[_i];
            var sym = pairBaseToLinearSymbol(s.pair);
            var prev = bySym.get(sym);
            if (!prev || s.setupScore > prev.setupScore)
                bySym.set(sym, s);
        }
        return __spreadArray([], bySym.values(), true).sort(function (a, b) {
            return b.setupScore - a.setupScore ||
                formatSignalPairForTicker(a.pair).localeCompare(formatSignalPairForTicker(b.pair));
        });
    }, [liveSignals]);
    var live = (0, useLiveTradeMarket_1.useLiveTradeMarket)(liveSymbol, chartInterval);
    var _37 = (0, useAccountSnapshot_1.useAccountSnapshot)({ pollMs: 12000 }), accountSnapshots = _37.items, refreshAccountSnapshots = _37.refresh;
    var liveMarketTickerItems = (0, react_1.useMemo)(function () {
        return liveSignals.map(function (s) {
            var sym = pairBaseToLinearSymbol(s.pair);
            var t = liveTickersBySymbol[sym];
            return {
                pair: formatSignalPairForTicker(s.pair),
                lastPrice: t != null && Number.isFinite(t.lastPrice) ? t.lastPrice : null,
                movePct: t != null && Number.isFinite(t.price24hPcnt) ? t.price24hPcnt * 100 : null,
            };
        });
    }, [liveSignals, liveTickersBySymbol]);
    var tradeBalance = (0, react_1.useMemo)(function () {
        var _a, _b, _c, _d, _e, _f, _g;
        var bybit = accountSnapshots.find(function (s) { return s.exchange === 'bybit' && s.status === 'connected'; });
        var overview = (_a = bybit === null || bybit === void 0 ? void 0 : bybit.accountBreakdown) === null || _a === void 0 ? void 0 : _a.overview;
        if (!overview)
            return null;
        var unifiedBucket = (_c = (_b = bybit.accountBreakdown) === null || _b === void 0 ? void 0 : _b.buckets) === null || _c === void 0 ? void 0 : _c.find(function (b) { return b.kind === 'unified'; });
        var utaUnrealizedPnl = (_d = unifiedBucket === null || unifiedBucket === void 0 ? void 0 : unifiedBucket.metrics) === null || _d === void 0 ? void 0 : _d.unrealizedPnl;
        return {
            availableToTrade: coerceUsdField(overview.availableToTrade),
            totalWalletBalance: coerceUsdField(overview.totalWalletBalance),
            totalEquity: coerceUsdField(overview.totalEquity),
            marginInUseUsd: coerceUsdField((_e = overview.unifiedMarginInUseUsd) !== null && _e !== void 0 ? _e : null),
            utaUnrealizedPnl: utaUnrealizedPnl != null ? coerceUsdField(utaUnrealizedPnl) : null,
            fundingWalletBalance: coerceUsdField((_f = overview.fundingWalletBalance) !== null && _f !== void 0 ? _f : null),
            fundingPrimaryAsset: (_g = overview.fundingPrimaryAsset) !== null && _g !== void 0 ? _g : null,
        };
    }, [accountSnapshots]);
    var tradeBalanceHelper = (0, react_1.useMemo)(function () {
        if (!tradeBalance)
            return undefined;
        if (market === 'futures') {
            return 'Bybit UTA metrics above sync from your account. With perps + Bybit connected, Long/Short and Close send real orders; read-only API keys cannot trade.';
        }
        return 'Bybit UTA metrics sync from your account. With spot + Bybit connected, Buy/Sell and Close send real spot orders; read-only API keys cannot trade.';
    }, [tradeBalance, market]);
    /**
     * Single raw cap for linked UTA: max of sizing + display paths (they can diverge on edge API shapes).
     * Rounded to cents everywhere so 100% === validation cap (avoids float / rounding mismatches).
     */
    var linkedUtaRawMaxUsd = (0, react_1.useMemo)(function () {
        if (!tradeBalance)
            return null;
        var raw = Math.max(utaSizingCapUsd(tradeBalance), utaBalanceDisplayUsd(tradeBalance));
        if (!Number.isFinite(raw))
            return null;
        return Math.max(0, raw);
    }, [tradeBalance]);
    var displayBalanceUsd = (0, react_1.useMemo)(function () {
        if (linkedUtaRawMaxUsd == null)
            return null;
        return roundUsdAmount(linkedUtaRawMaxUsd);
    }, [linkedUtaRawMaxUsd]);
    var balanceForModel = (0, react_1.useMemo)(function () {
        if (!tradeBalance)
            return 0;
        if (linkedUtaRawMaxUsd != null && linkedUtaRawMaxUsd > 0) {
            return roundUsdAmount(linkedUtaRawMaxUsd);
        }
        return 0;
    }, [tradeBalance, linkedUtaRawMaxUsd]);
    var _38 = (0, react_1.useState)(null), tradePriceAnchor = _38[0], setTradePriceAnchor = _38[1];
    (0, react_1.useEffect)(function () {
        setTradePriceAnchor(null);
    }, [signalId, pairFromQuery, liveSymbol]);
    (0, react_1.useEffect)(function () {
        if (tradePriceAnchor != null)
            return;
        if (live.lastPrice != null && Number.isFinite(live.lastPrice) && live.lastPrice > 0) {
            setTradePriceAnchor(live.lastPrice);
        }
    }, [live.lastPrice, tradePriceAnchor]);
    var model = (0, react_1.useMemo)(function () {
        var anchorPx = (0, tradeViewFromSignal_1.resolveTradeAnchorPrice)(tradePriceAnchor, live.lastPrice, signalForTrade.pair);
        return (0, tradeViewFromSignal_1.buildTradeViewModelFromSignal)(signalForTrade, {
            lastPrice: live.lastPrice,
            change24hPct: live.change24hPct,
            high24h: live.high24h,
            low24h: live.low24h,
            volume24h: live.volume24h,
            priceSeries: live.priceSeries,
            chartCandles: live.chartCandles,
        }, { anchorPrice: anchorPx, balanceUsd: balanceForModel, tradeSide: side });
    }, [
        balanceForModel,
        signalForTrade,
        side,
        tradePriceAnchor,
        live.change24hPct,
        live.high24h,
        live.low24h,
        live.volume24h,
        live.priceSeries,
        live.chartCandles,
        live.lastPrice,
    ]);
    /**
     * Guided sheet opens before `setSide(nextSide)` runs — `guidedExecutionSide` is the button intent.
     * Levels must follow that direction (and `signalForTrade` / chart pair), not only the pre-click ticket `side`.
     */
    var guidedPlanModel = (0, react_1.useMemo)(function () {
        var anchorPx = (0, tradeViewFromSignal_1.resolveTradeAnchorPrice)(tradePriceAnchor, live.lastPrice, signalForTrade.pair);
        return (0, tradeViewFromSignal_1.buildTradeViewModelFromSignal)(signalForTrade, {
            lastPrice: live.lastPrice,
            change24hPct: live.change24hPct,
            high24h: live.high24h,
            low24h: live.low24h,
            volume24h: live.volume24h,
            priceSeries: live.priceSeries,
            chartCandles: live.chartCandles,
        }, { anchorPrice: anchorPx, balanceUsd: balanceForModel, tradeSide: guidedExecutionSide });
    }, [
        balanceForModel,
        guidedExecutionSide,
        signalForTrade,
        tradePriceAnchor,
        live.change24hPct,
        live.high24h,
        live.low24h,
        live.volume24h,
        live.priceSeries,
        live.chartCandles,
        live.lastPrice,
    ]);
    var assetTransferHref = (0, react_1.useMemo)(function () {
        var bybit = accountSnapshots.find(function (s) { return s.exchange === 'bybit' && s.status === 'connected'; });
        return bybit ? exchangeTransferUrls_1.BYBIT_ASSET_TRANSFER_HREF : null;
    }, [accountSnapshots]);
    var portfolioEntryRaw = params.get('portfolioEntry');
    var portfolioEntry = portfolioEntryRaw ? Number(portfolioEntryRaw) : NaN;
    var mergedModel = (0, react_1.useMemo)(function () {
        var next = __assign({}, model);
        if (live.lastPrice != null)
            next.lastPrice = live.lastPrice;
        if (live.change24hPct != null)
            next.change24hPct = live.change24hPct;
        if (live.high24h != null)
            next.high24h = live.high24h;
        if (live.low24h != null)
            next.low24h = live.low24h;
        if (live.volume24h != null)
            next.volume24h = live.volume24h;
        if (live.priceSeries && live.priceSeries.length > 20)
            next.priceSeries = live.priceSeries;
        if (live.chartCandles && live.chartCandles.length > 20)
            next.chartCandles = live.chartCandles;
        if (Number.isFinite(portfolioEntry) && portfolioEntry > 0)
            next.entry = portfolioEntry;
        if (isManageMode && manageCtx) {
            next.entry = manageCtx.entryPrice;
            if (manageCtx.pair)
                next.pair = manageCtx.pair;
        }
        return next;
    }, [
        model,
        live.lastPrice,
        live.change24hPct,
        live.high24h,
        live.low24h,
        live.volume24h,
        live.priceSeries,
        live.chartCandles,
        portfolioEntry,
        isManageMode,
        manageCtx,
    ]);
    var tradePairFavoriteBase = (0, react_1.useMemo)(function () { return (0, tradePairFavorites_1.normalizeTradePairBase)(mergedModel.pair); }, [mergedModel.pair]);
    var isPairInWatchlist = (0, react_1.useMemo)(function () { return (0, tradePairFavorites_1.isTradePairFavorite)(tradePairFavoriteBase); }, [tradePairFavoriteBase, tradeFavRevision]);
    (0, react_1.useEffect)(function () {
        if (market !== 'futures') {
            setSymbolMaxLeverage(null);
            return;
        }
        var sym = pairBaseToLinearSymbol(mergedModel.pair);
        var cancelled = false;
        void (0, client_1.fetchLinearMaxLeverage)(sym).then(function (m) {
            if (!cancelled)
                setSymbolMaxLeverage(m);
        });
        return function () {
            cancelled = true;
        };
    }, [market, mergedModel.pair]);
    var bybitSnap = (0, react_1.useMemo)(function () { return accountSnapshots.find(function (s) { return s.exchange === 'bybit' && s.status === 'connected'; }); }, [accountSnapshots]);
    var riskSettings = (0, riskSettings_1.useRiskSettings)();
    var dailyRiskGuard = (0, dailyRiskGuard_1.useDailyRiskGuard)();
    var dailyReviewLocked = Boolean(isBotsReviewCockpit && dailyRiskGuard.status === 'locked');
    var exchangeOpenLegCount = (0, react_1.useMemo)(function () { return (0, riskSettings_1.countExchangeOpenLegs)(bybitSnap === null || bybitSnap === void 0 ? void 0 : bybitSnap.positions); }, [bybitSnap === null || bybitSnap === void 0 ? void 0 : bybitSnap.positions]);
    var riskMonitoredOpenCount = (0, react_1.useMemo)(function () { return (0, riskSettings_1.activePositionCountForRisk)(exchangeOpenLegCount); }, [exchangeOpenLegCount]);
    var maxOpenPositionsReached = riskMonitoredOpenCount >= riskSettings.maxOpenPositions;
    /** Manage mode still posts closes/adds via `/trade/bybit/*` when Bybit is linked — only entry-mode chart shell differed before. */
    var useRealExecution = Boolean(bybitSnap && (market === 'futures' || market === 'spot'));
    /** User opt-in from Risk controls — when false, Sigflo does not submit opens or TP/SL updates (closes use their own path). */
    var liveOrderSubmitEnabled = useRealExecution && riskSettings.allowLiveExecution;
    var exchangePositionForSymbol = (0, react_1.useMemo)(function () {
        var _a, _b;
        if (!((_a = bybitSnap === null || bybitSnap === void 0 ? void 0 : bybitSnap.positions) === null || _a === void 0 ? void 0 : _a.length))
            return null;
        var sym = pairBaseToLinearSymbol(mergedModel.pair);
        var open = bybitSnap.positions.filter(function (x) { return x.symbol === sym && x.size > 0; });
        if (open.length === 0)
            return null;
        /** Hedge mode: same symbol can have long + short; managing uses URL leg, else UI `side`. */
        var legSide = isManageMode && manageCtx ? manageCtx.side : side;
        return (_b = open.find(function (x) { return x.side === legSide; })) !== null && _b !== void 0 ? _b : open[0];
    }, [bybitSnap, isManageMode, manageCtx, mergedModel.pair, side]);
    var spotBaseAsset = (0, react_1.useMemo)(function () { return (0, spotSymbol_1.spotBaseAssetFromOrderSymbol)(pairBaseToLinearSymbol(mergedModel.pair)); }, [mergedModel.pair]);
    var exchangeSpotFreeBaseQty = (0, react_1.useMemo)(function () {
        var _a;
        if (!((_a = bybitSnap === null || bybitSnap === void 0 ? void 0 : bybitSnap.balances) === null || _a === void 0 ? void 0 : _a.length))
            return null;
        var want = spotBaseAsset.toUpperCase();
        var row = bybitSnap.balances.find(function (b) { return b.asset.toUpperCase() === want; });
        if (!row || !Number.isFinite(row.free) || row.free <= 0)
            return null;
        return row.free;
    }, [bybitSnap, spotBaseAsset]);
    /** Manage-mode PnL UI only while the exchange still shows an open leg (perps or spot balance). */
    var hasManageOpenExposure = (0, react_1.useMemo)(function () {
        if (!isManageMode)
            return false;
        if (market === 'futures')
            return exchangePositionForSymbol != null;
        return exchangeSpotFreeBaseQty != null && exchangeSpotFreeBaseQty > 0;
    }, [exchangePositionForSymbol, exchangeSpotFreeBaseQty, isManageMode, market]);
    var hadFuturesManagePositionRef = (0, react_1.useRef)(false);
    var hadSpotManageBalanceRef = (0, react_1.useRef)(false);
    var leverageExchangeSyncTimerRef = (0, react_1.useRef)(0);
    var hasOpenLinearForOrderSymbolRef = (0, react_1.useRef)(false);
    (0, react_1.useEffect)(function () {
        hasOpenLinearForOrderSymbolRef.current = Boolean(exchangePositionForSymbol &&
            exchangePositionForSymbol.size > 0 &&
            exchangePositionForSymbol.symbol.trim().toUpperCase() === pairBaseToLinearSymbol(mergedModel.pair).trim().toUpperCase());
    }, [exchangePositionForSymbol, mergedModel.pair]);
    (0, react_1.useEffect)(function () {
        return function () { return window.clearTimeout(leverageExchangeSyncTimerRef.current); };
    }, []);
    (0, react_1.useEffect)(function () {
        if (!isManageMode) {
            hadFuturesManagePositionRef.current = false;
            hadSpotManageBalanceRef.current = false;
            return;
        }
        if (!bybitSnap)
            return;
        if (market === 'futures') {
            hadSpotManageBalanceRef.current = false;
            if (exchangePositionForSymbol) {
                hadFuturesManagePositionRef.current = true;
                return;
            }
            if (!hadFuturesManagePositionRef.current)
                return;
            if (reverseOrderInProgressRef.current)
                return;
            hadFuturesManagePositionRef.current = false;
            navigate("/trade?".concat((0, tradeNavigation_1.buildTradeQueryString)(selectedSignal, { marketStatus: scannerStatus })), { replace: true });
            return;
        }
        hadFuturesManagePositionRef.current = false;
        var hasSpot = exchangeSpotFreeBaseQty != null && exchangeSpotFreeBaseQty > 0;
        if (hasSpot) {
            hadSpotManageBalanceRef.current = true;
            return;
        }
        if (!hadSpotManageBalanceRef.current)
            return;
        hadSpotManageBalanceRef.current = false;
        navigate("/trade?".concat((0, tradeNavigation_1.buildTradeQueryString)(selectedSignal, { marketStatus: scannerStatus })), { replace: true });
    }, [
        bybitSnap,
        exchangePositionForSymbol,
        exchangeSpotFreeBaseQty,
        isManageMode,
        market,
        navigate,
        scannerStatus,
        selectedSignal,
    ]);
    /** Sync SL/TP fields when computed plan changes, not only on pair (avoids stale stop after anchor moves from fallback to live). */
    (0, react_1.useEffect)(function () {
        if (isManageMode)
            return;
        setStopStr(Number.isFinite(mergedModel.stop) && mergedModel.stop > 0 ? (0, formatQuote_1.formatQuoteNumber)(mergedModel.stop) : '');
        setTargetStr(Number.isFinite(mergedModel.target) && mergedModel.target > 0 ? (0, formatQuote_1.formatQuoteNumber)(mergedModel.target) : '');
    }, [isManageMode, mergedModel.pair, mergedModel.stop, mergedModel.target]);
    (0, react_1.useEffect)(function () {
        if (!isManageMode)
            setManageTpSlDirty(false);
    }, [isManageMode]);
    (0, react_1.useEffect)(function () {
        if (!isManageMode)
            setManageOrderDraftDirty(false);
    }, [isManageMode]);
    (0, react_1.useEffect)(function () {
        if (!isManageMode || !manageCtx)
            return;
        setManageOrderDraftDirty(false);
    }, [isManageMode, manageCtx === null || manageCtx === void 0 ? void 0 : manageCtx.pair, manageCtx === null || manageCtx === void 0 ? void 0 : manageCtx.side, manageCtx === null || manageCtx === void 0 ? void 0 : manageCtx.entryPrice, manageCtx === null || manageCtx === void 0 ? void 0 : manageCtx.positionUsd]);
    var stopParsed = parseFloat(stopStr.replace(/,/g, ''));
    var targetParsed = parseFloat(targetStr.replace(/,/g, ''));
    /** Manage + linear: keep SL/TP inputs aligned with the exchange until the user edits (then sync again after a successful apply). */
    (0, react_1.useEffect)(function () {
        if (!isManageMode || market !== 'futures' || manageTpSlDirty)
            return;
        var pos = exchangePositionForSymbol;
        if (!pos)
            return;
        setStopStr(pos.stopLossPrice != null && Number.isFinite(pos.stopLossPrice) && pos.stopLossPrice > 0
            ? (0, formatQuote_1.formatQuoteNumber)(pos.stopLossPrice)
            : '');
        setTargetStr(pos.takeProfitPrice != null && Number.isFinite(pos.takeProfitPrice) && pos.takeProfitPrice > 0
            ? (0, formatQuote_1.formatQuoteNumber)(pos.takeProfitPrice)
            : '');
    }, [
        exchangePositionForSymbol,
        isManageMode,
        manageTpSlDirty,
        market,
    ]);
    var modelForMetrics = (0, react_1.useMemo)(function () {
        var next = __assign({}, mergedModel);
        if (Number.isFinite(stopParsed) && stopParsed > 0)
            next.stop = stopParsed;
        if (Number.isFinite(targetParsed) && targetParsed > 0)
            next.target = targetParsed;
        if (tradeBalance && linkedUtaRawMaxUsd != null && linkedUtaRawMaxUsd > 0) {
            next.balanceUsd = roundUsdAmount(linkedUtaRawMaxUsd);
        }
        if (!Number.isFinite(next.balanceUsd) || next.balanceUsd < 0) {
            var fb = mergedModel.balanceUsd;
            next.balanceUsd = Number.isFinite(fb) && fb > 0 ? fb : 0;
        }
        return next;
    }, [mergedModel, stopParsed, targetParsed, tradeBalance, linkedUtaRawMaxUsd]);
    var markForManage = (_c = (_b = live.lastPrice) !== null && _b !== void 0 ? _b : manageCtx === null || manageCtx === void 0 ? void 0 : manageCtx.markPrice) !== null && _c !== void 0 ? _c : mergedModel.lastPrice;
    var insightTicker = (0, react_1.useMemo)(function () {
        var _a;
        if (live.lastPrice == null || live.high24h == null || live.low24h == null)
            return undefined;
        return {
            symbol: liveSymbol,
            lastPrice: live.lastPrice,
            high24h: live.high24h,
            low24h: live.low24h,
            volume24h: 0,
            turnover24h: 0,
            price24hPcnt: ((_a = live.change24hPct) !== null && _a !== void 0 ? _a : 0) / 100,
        };
    }, [liveSymbol, live.lastPrice, live.high24h, live.low24h, live.change24hPct]);
    var managePnlDisplay = (0, react_1.useMemo)(function () {
        if (!isManageMode || !manageCtx)
            return null;
        if (market === 'futures' && exchangePositionForSymbol) {
            var pos = exchangePositionForSymbol;
            var entry = pos.entryPrice > 0 ? pos.entryPrice : manageCtx.entryPrice;
            var markPx = typeof markForManage === 'number' && Number.isFinite(markForManage) && markForManage > 0
                ? markForManage
                : pos.markPrice != null && pos.markPrice > 0
                    ? pos.markPrice
                    : entry;
            var mkt = pos.markPrice != null && pos.markPrice > 0 ? pos.markPrice : pos.entryPrice;
            var notional = Math.abs(pos.size) * (Number.isFinite(mkt) && mkt > 0 ? mkt : entry);
            var usd = notional > 0 ? notional : manageCtx.positionUsd;
            return (0, manageTradeContext_1.managePnlFromPrices)(pos.side, entry, markPx, usd);
        }
        return (0, manageTradeContext_1.managePnlFromPrices)(manageCtx.side, manageCtx.entryPrice, markForManage, manageCtx.positionUsd);
    }, [exchangePositionForSymbol, isManageMode, manageCtx, markForManage, market]);
    var manageInsightLine = (0, react_1.useMemo)(function () {
        if (!isManageMode || !manageCtx || !managePnlDisplay || !hasManageOpenExposure)
            return null;
        var insightSide = market === 'futures' && exchangePositionForSymbol ? exchangePositionForSymbol.side : manageCtx.side;
        return (0, positionMicroInsight_1.positionMicroInsight)({ side: insightSide }, markForManage, managePnlDisplay.pnlPct, insightTicker);
    }, [
        exchangePositionForSymbol,
        hasManageOpenExposure,
        isManageMode,
        manageCtx,
        managePnlDisplay,
        markForManage,
        insightTicker,
        market,
    ]);
    var futuresLevCap = market === 'futures' ? (symbolMaxLeverage !== null && symbolMaxLeverage !== void 0 ? symbolMaxLeverage : 200) : 200;
    var effectiveFuturesLeverage = Math.min(leverage, futuresLevCap);
    var levForMetrics = market === 'spot' ? 1 : effectiveFuturesLeverage;
    (0, react_1.useEffect)(function () {
        if (market !== 'futures')
            return;
        if (leverage > futuresLevCap)
            setLeverage(futuresLevCap);
    }, [futuresLevCap, leverage, market]);
    var primaryOpenPosition = (0, react_1.useMemo)(function () {
        if (isManageMode)
            return null;
        var linearSym = pairBaseToLinearSymbol(mergedModel.pair);
        var mark = Number.isFinite(mergedModel.lastPrice) && mergedModel.lastPrice > 0
            ? mergedModel.lastPrice
            : live.lastPrice != null && Number.isFinite(live.lastPrice) && live.lastPrice > 0
                ? live.lastPrice
                : NaN;
        if (useRealExecution && market === 'futures' && exchangePositionForSymbol) {
            return (0, exchangePositionSynthetic_1.syntheticFromExchangePosition)(exchangePositionForSymbol, mergedModel.pair, market, effectiveFuturesLeverage);
        }
        if (useRealExecution &&
            market === 'spot' &&
            exchangeSpotFreeBaseQty != null &&
            exchangeSpotFreeBaseQty > 0 &&
            Number.isFinite(mark) &&
            mark > 0) {
            return (0, exchangePositionSynthetic_1.syntheticFromSpotHolding)(exchangeSpotFreeBaseQty, linearSym, mergedModel.pair, mark);
        }
        return null;
    }, [
        exchangePositionForSymbol,
        exchangeSpotFreeBaseQty,
        isManageMode,
        effectiveFuturesLeverage,
        live.lastPrice,
        market,
        mergedModel.lastPrice,
        mergedModel.pair,
        useRealExecution,
    ]);
    var sigfloRepoPosition = (0, react_1.useMemo)(function () {
        if (isManageMode)
            return null;
        if (market !== 'futures')
            return null;
        if (primaryOpenPosition != null)
            return null;
        return (0, positions_1.getPositionRepository)().getActivePositionByPair(pairBaseToLinearSymbol(mergedModel.pair));
    }, [isManageMode, market, mergedModel.pair, primaryOpenPosition]);
    var primaryChartOpenPosition = (0, react_1.useMemo)(function () {
        if (primaryOpenPosition != null)
            return primaryOpenPosition;
        if (sigfloRepoPosition != null)
            return (0, positions_1.simulatedFromSigfloActive)(sigfloRepoPosition, market);
        return null;
    }, [market, primaryOpenPosition, sigfloRepoPosition]);
    var sigfloManagedLayer = (0, react_1.useMemo)(function () {
        if (isManageMode || market !== 'futures')
            return null;
        var liveMark = Number.isFinite(mergedModel.lastPrice) && mergedModel.lastPrice > 0
            ? mergedModel.lastPrice
            : live.lastPrice != null && Number.isFinite(live.lastPrice) && live.lastPrice > 0
                ? live.lastPrice
                : NaN;
        if (useRealExecution && exchangePositionForSymbol) {
            var m = Number.isFinite(liveMark) && liveMark > 0 ? liveMark : exchangePositionForSymbol.entryPrice;
            return (0, positions_1.sigfloActivePositionFromExchange)(exchangePositionForSymbol, mergedModel.pair, m);
        }
        return sigfloRepoPosition;
    }, [
        exchangePositionForSymbol,
        isManageMode,
        live.lastPrice,
        market,
        mergedModel.lastPrice,
        mergedModel.pair,
        sigfloRepoPosition,
        useRealExecution,
    ]);
    /** SL/TP "% from entry" anchor: exchange average fill when a leg exists, else plan/anchor `mergedModel.entry`. */
    var slTpPercentEntryAnchor = (0, react_1.useMemo)(function () {
        if (market === 'futures' && exchangePositionForSymbol) {
            var e = exchangePositionForSymbol.entryPrice;
            if (Number.isFinite(e) && e > 0)
                return e;
        }
        if (!isManageMode && market === 'spot' && (primaryOpenPosition === null || primaryOpenPosition === void 0 ? void 0 : primaryOpenPosition.entryPrice) != null) {
            var e = primaryOpenPosition.entryPrice;
            if (Number.isFinite(e) && e > 0)
                return e;
        }
        return null;
    }, [exchangePositionForSymbol, isManageMode, market, primaryOpenPosition]);
    /**
     * `primaryOpenPosition` is null in `mode=manage`, but the chart should still show the same
     * exchange-backed entry / SL / TP / liq lines as the live trade view when Bybit is connected.
     */
    var exchangeSyntheticForManageChart = (0, react_1.useMemo)(function () {
        if (!isManageMode || market !== 'futures' || !exchangePositionForSymbol)
            return null;
        if (!bybitSnap || bybitSnap.status !== 'connected')
            return null;
        return (0, exchangePositionSynthetic_1.syntheticFromExchangePosition)(exchangePositionForSymbol, mergedModel.pair, market, effectiveFuturesLeverage);
    }, [
        bybitSnap,
        effectiveFuturesLeverage,
        exchangePositionForSymbol,
        isManageMode,
        market,
        mergedModel.pair,
    ]);
    /** Manage screen: show exchange leverage when synced, else URL (portfolio link), else trade slider. */
    var manageLeverageForUi = (0, react_1.useMemo)(function () {
        if (!isManageMode)
            return 1;
        if (market !== 'futures')
            return 1;
        if (exchangeSyntheticForManageChart != null)
            return exchangeSyntheticForManageChart.leverage;
        var fromUrl = manageCtx === null || manageCtx === void 0 ? void 0 : manageCtx.leverage;
        if (fromUrl != null && fromUrl > 0)
            return fromUrl;
        return effectiveFuturesLeverage;
    }, [
        effectiveFuturesLeverage,
        exchangeSyntheticForManageChart,
        isManageMode,
        manageCtx === null || manageCtx === void 0 ? void 0 : manageCtx.leverage,
        market,
    ]);
    var exchangeSpotPanelModel = (0, react_1.useMemo)(function () {
        if (!useRealExecution || market !== 'spot')
            return null;
        var p = primaryOpenPosition;
        return p != null && p.id.startsWith('bybit-spot:') ? p : null;
    }, [useRealExecution, market, primaryOpenPosition]);
    var hasActiveTradePosition = !isManageMode && primaryChartOpenPosition != null;
    var isExchangeBackedOpenLeg = primaryOpenPosition != null;
    /** Exchange-backed open leg for setup vs execution model (includes manage view when synced). */
    var exchangeOpenLegForTiming = (0, react_1.useMemo)(function () {
        if (isManageMode) {
            return market === 'futures' && exchangeSyntheticForManageChart != null && hasManageOpenExposure
                ? exchangeSyntheticForManageChart
                : null;
        }
        return primaryOpenPosition;
    }, [exchangeSyntheticForManageChart, hasManageOpenExposure, isManageMode, market, primaryOpenPosition]);
    var timingInPosition = exchangeOpenLegForTiming != null;
    var tradeTimingScopeKey = "".concat(selectedSignal.id, ":").concat(mergedModel.pair);
    var _39 = (0, react_1.useState)(null), triggerLock = _39[0], setTriggerLock = _39[1];
    (0, react_1.useEffect)(function () {
        setTriggerLock(null);
    }, [tradeTimingScopeKey]);
    (0, react_1.useEffect)(function () {
        if (timingInPosition || isManageMode)
            return;
        if (scannerStatus !== 'triggered')
            return;
        setTriggerLock(function (prev) {
            var _a, _b;
            if (prev)
                return prev;
            var ideal = (_b = (_a = selectedSignal.idealEntryPrice) !== null && _a !== void 0 ? _a : (Number.isFinite(mergedModel.entry) && mergedModel.entry > 0 ? mergedModel.entry : null)) !== null && _b !== void 0 ? _b : (live.lastPrice != null && live.lastPrice > 0 ? live.lastPrice : null);
            if (ideal == null || !(ideal > 0))
                return prev;
            return { lockedAtMs: Date.now(), idealEntry: ideal };
        });
    }, [
        isManageMode,
        mergedModel.entry,
        scannerStatus,
        selectedSignal.idealEntryPrice,
        live.lastPrice,
        timingInPosition,
    ]);
    var _40 = (0, react_1.useState)(null), positionOpenedAtMs = _40[0], setPositionOpenedAtMs = _40[1];
    var prevTimingOpenRef = (0, react_1.useRef)(false);
    (0, react_1.useEffect)(function () {
        if (timingInPosition && !prevTimingOpenRef.current) {
            setPositionOpenedAtMs(Date.now());
        }
        if (!timingInPosition)
            setPositionOpenedAtMs(null);
        prevTimingOpenRef.current = timingInPosition;
    }, [timingInPosition]);
    var idealEntryForExecution = (0, react_1.useMemo)(function () {
        return (0, tradeSetupExecutionModel_1.resolveIdealEntryForExecution)({
            triggerLock: triggerLock,
            signal: selectedSignal,
            planEntry: modelForMetrics.entry,
            lastPrice: live.lastPrice,
        });
    }, [live.lastPrice, modelForMetrics.entry, selectedSignal, triggerLock]);
    var executionQuality = (0, react_1.useMemo)(function () {
        if (!timingInPosition)
            return null;
        var actual = exchangeOpenLegForTiming === null || exchangeOpenLegForTiming === void 0 ? void 0 : exchangeOpenLegForTiming.entryPrice;
        if (actual == null || !(actual > 0))
            return null;
        return (0, tradeSetupExecutionModel_1.getExecutionQuality)({
            inPosition: true,
            side: exchangeOpenLegForTiming.side,
            actualEntry: actual,
            idealEntry: idealEntryForExecution,
            openedAtMs: positionOpenedAtMs,
            triggerLock: triggerLock,
        });
    }, [
        exchangeOpenLegForTiming,
        idealEntryForExecution,
        positionOpenedAtMs,
        timingInPosition,
        triggerLock,
    ]);
    var executionTradeScorePenalty = (0, tradeSetupExecutionModel_1.getExecutionTradeScorePenalty)(executionQuality);
    var setupDisplayState = (0, tradeSetupExecutionModel_1.getSetupDisplayState)({ inPosition: timingInPosition, marketStatus: scannerStatus });
    var metrics = (0, react_1.useMemo)(function () {
        return (0, tradeRisk_1.deriveTradeMetrics)(modelForMetrics, {
            amountUsd: amountUsd,
            leverage: levForMetrics,
            side: side,
            market: market,
            setupScore: selectedSignal.setupScore,
            executionTradeScorePenalty: executionTradeScorePenalty,
            executionQuality: executionQuality,
            setupDisplayState: setupDisplayState,
        });
    }, [
        amountUsd,
        executionQuality,
        executionTradeScorePenalty,
        levForMetrics,
        market,
        modelForMetrics,
        selectedSignal.setupScore,
        setupDisplayState,
        side,
    ]);
    /** Stable id for the open Bybit leg on this ticket (trade + manage), for “position vanished” detection. */
    var exchangeTrackedOpenLegId = (0, react_1.useMemo)(function () {
        var _a;
        if (!useRealExecution || !bybitSnap || bybitSnap.status !== 'connected')
            return null;
        var pos = primaryOpenPosition !== null && primaryOpenPosition !== void 0 ? primaryOpenPosition : (isManageMode ? exchangeSyntheticForManageChart : null);
        return (_a = pos === null || pos === void 0 ? void 0 : pos.id) !== null && _a !== void 0 ? _a : null;
    }, [
        bybitSnap,
        exchangeSyntheticForManageChart,
        isManageMode,
        primaryOpenPosition,
        useRealExecution,
    ]);
    /** Chart overlays: liquidation tracks sizing inputs (`deriveTradeMetrics`), not a fixed placeholder liq. */
    var chartModelForPlot = (0, react_1.useMemo)(function () {
        var next = __assign({}, modelForMetrics);
        if (market === 'futures' && Number.isFinite(metrics.liquidation) && metrics.liquidation > 0) {
            next.liquidation = metrics.liquidation;
        }
        var pos = primaryChartOpenPosition !== null && primaryChartOpenPosition !== void 0 ? primaryChartOpenPosition : exchangeSyntheticForManageChart;
        if (pos) {
            next.entry = pos.entryPrice;
            if (pos.stopLossPrice != null && Number.isFinite(pos.stopLossPrice) && pos.stopLossPrice > 0) {
                next.stop = pos.stopLossPrice;
            }
            else {
                next.stop = (0, tradeViewFromSignal_1.ensureStopForOpenPosition)(pos.side, pos.entryPrice, modelForMetrics.stop, selectedSignal.setupScore);
            }
            if (pos.takeProfitPrice != null && Number.isFinite(pos.takeProfitPrice) && pos.takeProfitPrice > 0) {
                next.target = pos.takeProfitPrice;
            }
            else {
                next.target = (0, tradeViewFromSignal_1.ensureTargetForOpenPosition)(pos.side, pos.entryPrice, modelForMetrics.target, selectedSignal.setupScore);
            }
            if (market === 'futures' &&
                pos.liquidationPrice != null &&
                Number.isFinite(pos.liquidationPrice) &&
                pos.liquidationPrice > 0) {
                next.liquidation = pos.liquidationPrice;
            }
        }
        // Open position: exchange SL/TP win when present; otherwise `ensure*` aligns plan levels to `pos.side`
        // (UI long/short can differ from the exchange leg). Do not run full `coerceStopTargetToSide` when
        // exchange sent one leg — that helper replaces both levels and could drop a valid Bybit price.
        if (!pos &&
            Number.isFinite(next.entry) &&
            next.entry > 0 &&
            Number.isFinite(next.stop) &&
            next.stop > 0 &&
            Number.isFinite(next.target) &&
            next.target > 0) {
            var c = (0, tradeViewFromSignal_1.coerceStopTargetToSide)(side, next.entry, next.stop, next.target, selectedSignal.setupScore);
            next.stop = c.stop;
            next.target = c.target;
        }
        return next;
    }, [
        exchangeSyntheticForManageChart,
        isManageMode,
        market,
        metrics.liquidation,
        modelForMetrics,
        primaryChartOpenPosition,
        selectedSignal.setupScore,
        side,
    ]);
    /** Pre-entry / plan PnL from throttled React `lastPrice` (scenario strip). */
    var liveUnrealizedPre = (0, react_1.useMemo)(function () {
        var mark = modelForMetrics.lastPrice;
        if (primaryChartOpenPosition && Number.isFinite(mark)) {
            var entry_1 = Math.max(1e-9, primaryChartOpenPosition.entryPrice);
            var dir_1 = primaryChartOpenPosition.side === 'long' ? 1 : -1;
            var movePct_1 = ((mark - entry_1) / entry_1) * 100 * dir_1;
            var pnlUsd_1 = primaryChartOpenPosition.positionNotionalUsd * (movePct_1 / 100);
            return { pnlUsd: pnlUsd_1, movePct: movePct_1 };
        }
        var entry = Math.max(0.000001, modelForMetrics.entry);
        var dir = side === 'long' ? 1 : -1;
        var movePct = ((modelForMetrics.lastPrice - entry) / entry) * 100 * dir;
        var pnlUsd = metrics.positionSizeUsd * (movePct / 100);
        return { pnlUsd: pnlUsd, movePct: movePct };
    }, [
        primaryChartOpenPosition,
        modelForMetrics.entry,
        modelForMetrics.lastPrice,
        metrics.positionSizeUsd,
        side,
    ]);
    var throttledOpenPnl = (0, useThrottledLiveUnrealized_1.useThrottledLiveUnrealized)(live.lastPriceRef, primaryChartOpenPosition, hasActiveTradePosition);
    var liveUnrealized = hasActiveTradePosition
        ? { pnlUsd: throttledOpenPnl.pnlUsd, movePct: throttledOpenPnl.movePct }
        : liveUnrealizedPre;
    var adjustRiskSnapshot = (0, react_1.useMemo)(function () {
        if (!chartModelForPlot)
            return null;
        var entry = chartModelForPlot.entry;
        var stop = chartModelForPlot.stop;
        var target = chartModelForPlot.target;
        if (!(entry > 0) || !(stop > 0) || !(target > 0))
            return null;
        if (isManageMode && manageCtx && managePnlDisplay) {
            var mark = typeof markForManage === 'number' && Number.isFinite(markForManage) && markForManage > 0
                ? markForManage
                : chartModelForPlot.lastPrice;
            return {
                pairLabel: manageCtx.pair,
                side: manageCtx.side,
                positionNotionalUsd: manageCtx.positionUsd,
                entryPrice: manageCtx.entryPrice,
                markPrice: mark,
                pnlUsd: managePnlDisplay.pnlUsd,
                stopPrice: stop,
                targetPrice: target,
            };
        }
        if (primaryChartOpenPosition && hasActiveTradePosition) {
            var mark = Number.isFinite(throttledOpenPnl.mark) && throttledOpenPnl.mark > 0
                ? throttledOpenPnl.mark
                : chartModelForPlot.lastPrice;
            return {
                pairLabel: mergedModel.pair,
                side: primaryChartOpenPosition.side,
                positionNotionalUsd: primaryChartOpenPosition.positionNotionalUsd,
                entryPrice: primaryChartOpenPosition.entryPrice,
                markPrice: mark,
                pnlUsd: throttledOpenPnl.pnlUsd,
                stopPrice: stop,
                targetPrice: target,
            };
        }
        return null;
    }, [
        chartModelForPlot,
        hasActiveTradePosition,
        isManageMode,
        manageCtx,
        managePnlDisplay,
        markForManage,
        mergedModel.pair,
        primaryChartOpenPosition,
        throttledOpenPnl.mark,
        throttledOpenPnl.pnlUsd,
    ]);
    (0, react_1.useEffect)(function () {
        if (params.get('focusAdjust') !== '1' || !adjustRiskSnapshot)
            return;
        setAdjustRiskOpen(true);
        setSearchParams(function (prev) {
            var next = new URLSearchParams(prev);
            next.delete('focusAdjust');
            return next;
        }, { replace: true });
    }, [params, adjustRiskSnapshot, setSearchParams]);
    /** Round-trip taker fee heuristic (~0.055% per side). */
    var estFeeUsd = metrics.positionSizeUsd * 0.00055 * 2;
    var orderSymbol = pairBaseToLinearSymbol(mergedModel.pair);
    (0, react_1.useEffect)(function () {
        window.clearTimeout(leverageExchangeSyncTimerRef.current);
    }, [orderSymbol]);
    var minOrderUsd = resolveMinOrderUsd(orderSymbol, market);
    var sizingValidation = (0, react_1.useMemo)(function () {
        if (orderPending) {
            return { canExecute: false, reason: 'Order in progress…' };
        }
        var available = Number.isFinite(metrics.balanceUsd) ? Math.max(0, metrics.balanceUsd) : 0;
        var availCents = Math.round(available * 100);
        var amtCents = Math.round((Number.isFinite(amountUsd) ? amountUsd : 0) * 100);
        if (available <= 0) {
            return { canExecute: false, reason: 'Insufficient available balance' };
        }
        if (available < minOrderUsd) {
            return { canExecute: false, reason: 'Insufficient available balance' };
        }
        if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
            return { canExecute: false, reason: "Minimum order for ".concat(orderSymbol, " is $").concat(minOrderUsd.toFixed(2)) };
        }
        if (amtCents > availCents) {
            return { canExecute: false, reason: 'Insufficient available balance' };
        }
        if (amountUsd < minOrderUsd) {
            return { canExecute: false, reason: "Minimum order for ".concat(orderSymbol, " is $").concat(minOrderUsd.toFixed(2)) };
        }
        if (!Number.isFinite(metrics.positionSizeUsd) || metrics.positionSizeUsd <= 0) {
            return { canExecute: false, reason: 'Insufficient available balance' };
        }
        return { canExecute: true, reason: null };
    }, [amountUsd, metrics.balanceUsd, metrics.positionSizeUsd, minOrderUsd, orderSymbol, orderPending]);
    var canExecute = (!isManageMode && liveExecutionLocked) ? false : sizingValidation.canExecute;
    var onAmountUsdChange = (0, react_1.useCallback)(function (n) {
        var cap = Number.isFinite(metrics.balanceUsd) ? Math.max(0, metrics.balanceUsd) : 0;
        setAmountUsd(roundUsdAmount(Math.max(0, Math.min(Number.isFinite(n) ? n : 0, cap))));
        if (isManageMode)
            setManageOrderDraftDirty(true);
    }, [isManageMode, metrics.balanceUsd]);
    var onStopStrForTrade = (0, react_1.useCallback)(function (s) {
        if (isManageMode && market === 'futures')
            setManageTpSlDirty(true);
        setStopStr(s);
    }, [isManageMode, market]);
    var onTargetStrForTrade = (0, react_1.useCallback)(function (s) {
        if (isManageMode && market === 'futures')
            setManageTpSlDirty(true);
        setTargetStr(s);
    }, [isManageMode, market]);
    /** Dock chart: drag stop/target strips (Setup + premium zones) update the same fields as the order card. */
    var onDockChartPlanStopDrag = (0, react_1.useCallback)(function (p) {
        if (!Number.isFinite(p) || p <= 0)
            return;
        setStopStr((0, formatQuote_1.formatQuoteNumber)(p));
    }, []);
    var onDockChartPlanTargetDrag = (0, react_1.useCallback)(function (p) {
        if (!Number.isFinite(p) || p <= 0)
            return;
        setTargetStr((0, formatQuote_1.formatQuoteNumber)(p));
    }, []);
    var linkedUta = tradeBalance != null;
    (0, react_1.useEffect)(function () {
        amountFromCapSeededRef.current = false;
    }, [signalId, pairFromQuery, linkedUta]);
    (0, react_1.useEffect)(function () {
        var cap = Number.isFinite(metrics.balanceUsd) ? Math.max(0, metrics.balanceUsd) : 0;
        var sym = pairBaseToLinearSymbol(mergedModel.pair);
        var minO = resolveMinOrderUsd(sym, market);
        var fromPortfolio = signalId.startsWith('pf-');
        if (!fromPortfolio && cap > 0 && !amountFromCapSeededRef.current) {
            amountFromCapSeededRef.current = true;
            var quarter = cap * 0.25;
            var target = linkedUta
                ? roundUsdAmount(Math.min(cap, Math.max(minO, quarter)))
                : roundUsdAmount(Math.min(1200, Math.max(minO, quarter)));
            setAmountUsd(target);
            return;
        }
        setAmountUsd(function (prev) {
            var next = roundUsdAmount(Math.max(0, Math.min(prev, cap)));
            return next === prev ? prev : next;
        });
    }, [metrics.balanceUsd, mergedModel.pair, market, signalId, linkedUta]);
    var tradeDockStats = (0, react_1.useMemo)(function () {
        var entry = chartModelForPlot.entry;
        var stop = chartModelForPlot.stop;
        var target = chartModelForPlot.target;
        var rr = mergedModel.riskReward;
        var effSide = primaryChartOpenPosition && !isManageMode ? primaryChartOpenPosition.side : side;
        if (!Number.isFinite(entry) || entry <= 0) {
            return { rewardPercent: 0, riskPercent: 0, rrRatio: Number.isFinite(rr) ? rr : 0 };
        }
        var rewardPct;
        var riskPct;
        if (effSide === 'long') {
            rewardPct = ((target - entry) / entry) * 100;
            riskPct = ((entry - stop) / entry) * 100;
        }
        else {
            rewardPct = ((entry - target) / entry) * 100;
            riskPct = ((stop - entry) / entry) * 100;
        }
        return {
            rewardPercent: Number.isFinite(rewardPct) ? rewardPct : 0,
            riskPercent: Number.isFinite(riskPct) ? Math.abs(riskPct) : 0,
            rrRatio: Number.isFinite(rr) ? rr : 0,
        };
    }, [
        chartModelForPlot.entry,
        chartModelForPlot.stop,
        chartModelForPlot.target,
        isManageMode,
        mergedModel.riskReward,
        primaryChartOpenPosition,
        side,
    ]);
    var guidedExecutionSetup = (0, react_1.useMemo)(function () {
        var sideForPanel = guidedExecutionSide;
        var sameSideAsTicket = sideForPanel === side;
        var planAnchorEntry = sameSideAsTicket
            ? Number.isFinite(mergedModel.entry) && mergedModel.entry > 0
                ? mergedModel.entry
                : Number.isFinite(mergedModel.lastPrice) && mergedModel.lastPrice > 0
                    ? mergedModel.lastPrice
                    : 0
            : Number.isFinite(guidedPlanModel.entry) && guidedPlanModel.entry > 0
                ? guidedPlanModel.entry
                : Number.isFinite(mergedModel.lastPrice) && mergedModel.lastPrice > 0
                    ? mergedModel.lastPrice
                    : 0;
        var stopCandidate = sameSideAsTicket && Number.isFinite(stopParsed) && stopParsed > 0 ? stopParsed : guidedPlanModel.stop;
        var targetCandidate = sameSideAsTicket && Number.isFinite(targetParsed) && targetParsed > 0 ? targetParsed : guidedPlanModel.target;
        var coerced = (0, tradeViewFromSignal_1.coerceStopTargetToSide)(sideForPanel, planAnchorEntry, Number.isFinite(stopCandidate) && stopCandidate > 0
            ? stopCandidate
            : planAnchorEntry * (sideForPanel === 'long' ? 0.998 : 1.002), Number.isFinite(targetCandidate) && targetCandidate > 0
            ? targetCandidate
            : planAnchorEntry * (sideForPanel === 'long' ? 1.003 : 0.997), signalForTrade.setupScore);
        var liveLast = Number.isFinite(mergedModel.lastPrice) && mergedModel.lastPrice > 0 ? mergedModel.lastPrice : 0;
        var entry = liveLast > 0 ? liveLast : planAnchorEntry;
        var planEntry = liveLast > 0 &&
            planAnchorEntry > 0 &&
            Math.abs(liveLast - planAnchorEntry) / planAnchorEntry > 1e-7
            ? planAnchorEntry
            : undefined;
        var rr = entry > 0 && Math.abs(coerced.stop - entry) > 0
            ? Math.abs(coerced.target - entry) / Math.abs(coerced.stop - entry)
            : 0;
        return {
            symbol: mergedModel.pair,
            direction: sideForPanel,
            statusLabel: (0, signalState_1.uiSignalStateLabel)((0, signalState_1.uiSignalStateFromMarketStatus)(scannerStatus)),
            setupScore: signalForTrade.setupScore,
            setupLabel: (0, setupScore_1.setupScoreBandShort)(signalForTrade),
            rationale: signalForTrade.aiExplanation,
            entry: entry,
            planEntry: planEntry,
            stop: coerced.stop,
            target: coerced.target,
            positionSizeUsd: metrics.positionSizeUsd,
            leverage: leverage,
            estimatedMarginUsd: metrics.amountUsedUsd,
            liquidationBufferPct: entry > 0 && Number.isFinite(metrics.liquidation)
                ? Math.abs((entry - metrics.liquidation) / entry) * 100
                : 0,
            riskRewardRatio: rr,
        };
    }, [
        guidedExecutionSide,
        guidedPlanModel.entry,
        guidedPlanModel.stop,
        guidedPlanModel.target,
        leverage,
        mergedModel.entry,
        mergedModel.lastPrice,
        mergedModel.pair,
        metrics.amountUsedUsd,
        metrics.liquidation,
        metrics.positionSizeUsd,
        scannerStatus,
        side,
        signalForTrade,
        stopParsed,
        targetParsed,
    ]);
    var scenarioProb = (0, react_1.useMemo)(function () {
        return (0, TradeChartScenarioStrip_1.computeScenarioProbabilities)({
            tradeScore: metrics.riskSummary.tradeScore,
            setupScore: selectedSignal.setupScore,
            side: side === 'long' ? 'long' : 'short',
        });
    }, [metrics.riskSummary.tradeScore, selectedSignal.setupScore, side]);
    var timingUi = (0, react_1.useMemo)(function () {
        return (0, tradeSetupExecutionModel_1.buildTradeTimingUiModel)({
            inPosition: timingInPosition,
            marketStatus: scannerStatus,
            executionQuality: executionQuality,
        });
    }, [executionQuality, scannerStatus, timingInPosition]);
    var dockTimingChip = (0, react_1.useMemo)(function () { return ({
        label: timingUi.chipLabel,
        state: timingUi.chipState,
        helperText: timingUi.helperText,
        executionLabel: timingUi.executionLabel,
    }); }, [timingUi]);
    var dockDecisionMeta = (0, react_1.useMemo)(function () { return ({
        confidenceLabel: String(metrics.riskSummary.tradeScore),
        setupQualityLabel: (0, setupScore_1.setupScoreBandShort)(selectedSignal),
        timing: dockTimingChip,
    }); }, [dockTimingChip, metrics.riskSummary.tradeScore, selectedSignal]);
    /**
     * When the timing chip is long (e.g. Developing, Weak timing), free horizontal space by tightening adjacent dock
     * chrome; relax again for short labels (Ready, Too early).
     */
    var chartDockTimingLayout = (0, react_1.useMemo)(function () {
        var len = dockTimingChip.label.length;
        var bulky = dockTimingChip.state === 'developing' ||
            len > 10 ||
            (dockTimingChip.executionLabel != null && dockTimingChip.executionLabel.length > 0);
        return {
            bulky: bulky,
            partialHeaderClass: bulky
                ? 'min-w-[3.5rem] max-w-[6.25rem] basis-[6.25rem]'
                : 'min-w-[4rem] max-w-[8.5rem] basis-[8.5rem]',
            setupToggleMaxClass: bulky ? 'max-w-[168px]' : 'max-w-[220px]',
        };
    }, [dockTimingChip.executionLabel, dockTimingChip.label, dockTimingChip.state]);
    var tradeAiScannerGroundedContext = (0, react_1.useMemo)(function () {
        return (0, buildGroundedMarketContext_1.buildGroundedMarketContext)({
            signal: selectedSignal,
            status: scannerStatus,
            tradeScore: metrics.riskSummary.tradeScore,
            market: market,
            chartInterval: chartInterval,
            model: mergedModel,
            recentCandles: mergedModel.chartCandles,
        });
    }, [
        chartInterval,
        market,
        mergedModel,
        metrics.riskSummary.tradeScore,
        scannerStatus,
        selectedSignal,
    ]);
    var exitAutomationScopeKey = (0, react_1.useMemo)(function () {
        if (isManageMode && manageCtx) {
            return "pos:".concat(manageCtx.pair, ":").concat(manageCtx.entryPrice, ":").concat(manageCtx.side);
        }
        return "pre:".concat(signalId, ":").concat(mergedModel.pair);
    }, [isManageMode, manageCtx, signalId, mergedModel.pair]);
    var exitAuto = (0, useExitAutomation_1.useExitAutomation)(exitAutomationScopeKey);
    var adjustRiskExitApi = (0, react_1.useMemo)(function () { return ({
        mode: exitAuto.mode,
        strategy: exitAuto.strategy,
        setStrategy: exitAuto.setStrategy,
        setSafeguards: exitAuto.setSafeguards,
        pushActivity: exitAuto.pushActivity,
    }); }, [exitAuto.mode, exitAuto.strategy, exitAuto.setStrategy, exitAuto.setSafeguards, exitAuto.pushActivity]);
    var loggedModeRef = (0, react_1.useRef)(null);
    var loggedStratRef = (0, react_1.useRef)(null);
    var prevEffStateRef = (0, react_1.useRef)(null);
    var prevAutoStateRef = (0, react_1.useRef)(null);
    var prevPnlForSafeguardRef = (0, react_1.useRef)(null);
    var exitFlowScopeRef = (0, react_1.useRef)(exitAutomationScopeKey);
    var exitFlowDisplayStashRef = (0, react_1.useRef)(null);
    var _41 = (0, react_1.useState)(0), exitFlowDisplayTick = _41[0], setExitFlowDisplayTick = _41[1];
    /** User tapped Confirm — hide assisted bar until exit guidance returns to hold (fresh prompt next cycle). */
    var _42 = (0, react_1.useState)(false), assistedExitAcknowledged = _42[0], setAssistedExitAcknowledged = _42[1];
    /** Raw state is hold but UI still shows trim/exit (stabilizer / threshold chatter) — auto-clear the bar after a beat. */
    var _43 = (0, react_1.useState)(false), assistedExitBarForceHidden = _43[0], setAssistedExitBarForceHidden = _43[1];
    var assistedPopupArmedRef = (0, react_1.useRef)(false);
    var _44 = (0, react_1.useState)(false), serverExitOvernightEnabled = _44[0], setServerExitOvernightEnabled = _44[1];
    var _45 = (0, react_1.useState)(false), serverExitOvernightHydrated = _45[0], setServerExitOvernightHydrated = _45[1];
    (0, react_1.useEffect)(function () {
        loggedModeRef.current = null;
        loggedStratRef.current = null;
        prevEffStateRef.current = null;
        prevAutoStateRef.current = null;
        prevPnlForSafeguardRef.current = null;
        exitFlowDisplayStashRef.current = null;
        setAssistedExitAcknowledged(false);
        setAssistedExitBarForceHidden(false);
    }, [exitAutomationScopeKey]);
    var exitFlowRaw = (0, react_1.useMemo)(function () {
        var _a, _b;
        if (exitFlowScopeRef.current !== exitAutomationScopeKey) {
            exitFlowDisplayStashRef.current = null;
            exitFlowScopeRef.current = exitAutomationScopeKey;
        }
        if (isManageMode) {
            if (!manageCtx || !managePnlDisplay)
                return null;
            var mark = typeof markForManage === 'number' && Number.isFinite(markForManage)
                ? markForManage
                : mergedModel.entry;
            return (0, tradeExitGuidanceFlow_1.resolveExitGuidanceFlow)({
                variant: 'manage',
                side: manageCtx.side,
                entry: manageCtx.entryPrice,
                mark: mark,
                stop: modelForMetrics.stop,
                target: modelForMetrics.target,
                trendAlignment: selectedSignal.scoreBreakdown.trendAlignment,
                momentumQuality: selectedSignal.scoreBreakdown.momentumQuality,
                pnlPct: managePnlDisplay.pnlPct,
                strategyPreset: exitAuto.strategy,
                customStrategyThresholds: exitAuto.customStrategyThresholds,
                safeguards: exitAuto.safeguards,
                exitAiMode: exitAuto.mode,
            });
        }
        return (0, tradeExitGuidanceFlow_1.resolveExitGuidanceFlow)({
            variant: 'trade',
            side: (_a = primaryChartOpenPosition === null || primaryChartOpenPosition === void 0 ? void 0 : primaryChartOpenPosition.side) !== null && _a !== void 0 ? _a : side,
            entry: (_b = primaryChartOpenPosition === null || primaryChartOpenPosition === void 0 ? void 0 : primaryChartOpenPosition.entryPrice) !== null && _b !== void 0 ? _b : modelForMetrics.entry,
            estimatedPnlPct: liveUnrealized.movePct,
            stop: chartModelForPlot.stop,
            target: chartModelForPlot.target,
            trendAlignment: selectedSignal.scoreBreakdown.trendAlignment,
            momentumQuality: selectedSignal.scoreBreakdown.momentumQuality,
            strategyPreset: exitAuto.strategy,
            customStrategyThresholds: exitAuto.customStrategyThresholds,
            safeguards: exitAuto.safeguards,
            exitAiMode: exitAuto.mode,
        });
    }, [
        exitAutomationScopeKey,
        chartModelForPlot.stop,
        chartModelForPlot.target,
        isManageMode,
        manageCtx,
        managePnlDisplay,
        markForManage,
        mergedModel.entry,
        primaryChartOpenPosition === null || primaryChartOpenPosition === void 0 ? void 0 : primaryChartOpenPosition.entryPrice,
        primaryChartOpenPosition === null || primaryChartOpenPosition === void 0 ? void 0 : primaryChartOpenPosition.side,
        side,
        liveUnrealized.movePct,
        selectedSignal.scoreBreakdown.trendAlignment,
        selectedSignal.scoreBreakdown.momentumQuality,
        exitAuto.mode,
        exitAuto.strategy,
        exitAuto.customStrategyThresholds,
        exitAuto.safeguards,
    ]);
    var exitFlow = (0, react_1.useMemo)(function () {
        if (exitFlowRaw == null) {
            exitFlowDisplayStashRef.current = null;
            return null;
        }
        var stash = (0, exitFlowDisplayStabilize_1.nextExitFlowForDisplay)(exitFlowDisplayStashRef.current, exitFlowRaw, Date.now());
        exitFlowDisplayStashRef.current = stash;
        return stash.displayed;
    }, [exitFlowRaw, exitFlowDisplayTick]);
    var serverExitEligible = (0, react_1.useMemo)(function () {
        return exitAuto.mode === 'auto' &&
            useRealExecution &&
            market === 'futures' &&
            Boolean(exchangePositionForSymbol) &&
            (bybitSnap === null || bybitSnap === void 0 ? void 0 : bybitSnap.status) === 'connected';
    }, [exitAuto.mode, useRealExecution, market, exchangePositionForSymbol, bybitSnap === null || bybitSnap === void 0 ? void 0 : bybitSnap.status]);
    (0, react_1.useEffect)(function () {
        if (!serverExitEligible || !exchangePositionForSymbol) {
            setServerExitOvernightHydrated(false);
            return;
        }
        var cancelled = false;
        setServerExitOvernightHydrated(false);
        void (0, tradeClient_1.listExitAutomationWatches)()
            .then(function (_a) {
            var watches = _a.watches;
            if (cancelled)
                return;
            var m = watches.find(function (w) {
                var _a;
                return w.enabled &&
                    w.symbol === orderSymbol &&
                    w.side === exchangePositionForSymbol.side &&
                    w.positionIdx === ((_a = exchangePositionForSymbol.positionIdx) !== null && _a !== void 0 ? _a : 0);
            });
            setServerExitOvernightEnabled(Boolean(m));
            setServerExitOvernightHydrated(true);
        })
            .catch(function () {
            if (!cancelled) {
                setServerExitOvernightEnabled(false);
                setServerExitOvernightHydrated(true);
            }
        });
        return function () {
            cancelled = true;
        };
    }, [serverExitEligible, orderSymbol, exchangePositionForSymbol === null || exchangePositionForSymbol === void 0 ? void 0 : exchangePositionForSymbol.side, exchangePositionForSymbol === null || exchangePositionForSymbol === void 0 ? void 0 : exchangePositionForSymbol.positionIdx]);
    (0, react_1.useEffect)(function () {
        var _a;
        if (serverExitEligible)
            return;
        if (!serverExitOvernightEnabled)
            return;
        if (!exchangePositionForSymbol || market !== 'futures') {
            setServerExitOvernightEnabled(false);
            return;
        }
        void (0, tradeClient_1.deleteExitAutomationWatch)({
            symbol: orderSymbol,
            side: exchangePositionForSymbol.side,
            positionIdx: (_a = exchangePositionForSymbol.positionIdx) !== null && _a !== void 0 ? _a : 0,
        }).catch(function () { });
        setServerExitOvernightEnabled(false);
    }, [serverExitEligible, serverExitOvernightEnabled, exchangePositionForSymbol, market, orderSymbol]);
    (0, react_1.useEffect)(function () {
        var _a;
        var until = (_a = exitFlowDisplayStashRef.current) === null || _a === void 0 ? void 0 : _a.pendingHoldUntil;
        if (until == null)
            return;
        var ms = Math.max(0, until - Date.now()) + 1;
        var id = window.setTimeout(function () { return setExitFlowDisplayTick(function (n) { return n + 1; }); }, ms);
        return function () { return window.clearTimeout(id); };
    }, [exitFlowRaw, exitFlowDisplayTick]);
    (0, react_1.useEffect)(function () {
        if ((exitFlow === null || exitFlow === void 0 ? void 0 : exitFlow.effective.state) === 'hold') {
            setAssistedExitAcknowledged(false);
            setAssistedExitBarForceHidden(false);
        }
    }, [exitFlow === null || exitFlow === void 0 ? void 0 : exitFlow.effective.state]);
    (0, react_1.useEffect)(function () {
        var rs = exitFlowRaw === null || exitFlowRaw === void 0 ? void 0 : exitFlowRaw.effective.state;
        if (rs === 'trim' || rs === 'exit') {
            setAssistedExitBarForceHidden(false);
        }
    }, [exitFlowRaw === null || exitFlowRaw === void 0 ? void 0 : exitFlowRaw.effective.state]);
    var exitFlowDispState = exitFlow === null || exitFlow === void 0 ? void 0 : exitFlow.effective.state;
    var exitFlowRawState = exitFlowRaw === null || exitFlowRaw === void 0 ? void 0 : exitFlowRaw.effective.state;
    (0, react_1.useEffect)(function () {
        if (exitAuto.mode !== 'assisted') {
            setAssistedExitBarForceHidden(false);
            return;
        }
        if (exitFlowDispState !== 'trim' && exitFlowDispState !== 'exit') {
            setAssistedExitBarForceHidden(false);
            return;
        }
        if (exitFlowRawState !== 'hold') {
            setAssistedExitBarForceHidden(false);
            return;
        }
        var id = window.setTimeout(function () { return setAssistedExitBarForceHidden(true); }, 12000);
        return function () { return window.clearTimeout(id); };
    }, [exitAuto.mode, exitFlowDispState, exitFlowRawState]);
    var chartAuxiliaryLines = (0, react_1.useMemo)(function () {
        if (!hasActiveTradePosition || !exitFlow)
            return undefined;
        if (exitFlow.effective.state !== 'trim')
            return undefined;
        var e = chartModelForPlot.entry;
        var t = chartModelForPlot.target;
        if (!Number.isFinite(e) || !Number.isFinite(t) || e <= 0 || t <= 0)
            return undefined;
        var mid = e + (t - e) * 0.55;
        if (!Number.isFinite(mid) || mid <= 0)
            return undefined;
        return [{ id: 'trim-sig', price: mid, color: tradeChartLevels_1.TRADE_CHART_LEVEL_COLORS.trim, title: 'Trim' }];
    }, [chartModelForPlot.entry, chartModelForPlot.target, exitFlow, hasActiveTradePosition]);
    var chartProximity = (0, react_1.useMemo)(function () {
        if (!hasActiveTradePosition)
            return null;
        var mark = mergedModel.lastPrice;
        var stop = chartModelForPlot.stop;
        var target = chartModelForPlot.target;
        if (Number.isFinite(mark) && mark > 0 && Number.isFinite(stop) && stop > 0) {
            if (Math.abs(mark - stop) / mark < 0.004)
                return 'stop';
        }
        if (Number.isFinite(mark) && mark > 0 && Number.isFinite(target) && target > 0) {
            if (Math.abs(mark - target) / mark < 0.004)
                return 'target';
        }
        return null;
    }, [chartModelForPlot.stop, chartModelForPlot.target, hasActiveTradePosition, mergedModel.lastPrice]);
    var manageAiChartAux = (0, react_1.useMemo)(function () {
        if (!isManageMode || !manageCtx)
            return undefined;
        var mark = typeof markForManage === 'number' && Number.isFinite(markForManage) ? markForManage : mergedModel.entry;
        return (0, exitAiCoPilot_1.buildManageAiExitZoneAuxLines)({
            mode: exitAuto.mode,
            side: manageCtx.side,
            entry: chartModelForPlot.entry,
            target: chartModelForPlot.target,
            stop: chartModelForPlot.stop,
            mark: mark,
            referencePrice: exitFlow === null || exitFlow === void 0 ? void 0 : exitFlow.effective.referencePrice,
        });
    }, [
        chartModelForPlot.entry,
        chartModelForPlot.target,
        chartModelForPlot.stop,
        exitAuto.mode,
        exitFlow === null || exitFlow === void 0 ? void 0 : exitFlow.effective.referencePrice,
        isManageMode,
        manageCtx,
        markForManage,
        mergedModel.entry,
    ]);
    var managePositionHealth = (0, react_1.useMemo)(function () {
        if (!isManageMode || !manageCtx || !managePnlDisplay || !hasManageOpenExposure) {
            return { status: 'healthy', label: 'Healthy' };
        }
        var m = typeof markForManage === 'number' && Number.isFinite(markForManage) && markForManage > 0
            ? markForManage
            : mergedModel.lastPrice;
        var healthSide = market === 'futures' && exchangePositionForSymbol ? exchangePositionForSymbol.side : manageCtx.side;
        return (0, positionHealth_1.computePositionHealth)({
            side: healthSide,
            mark: m,
            stop: chartModelForPlot.stop,
            pnlPct: managePnlDisplay.pnlPct,
        });
    }, [
        chartModelForPlot.stop,
        exchangePositionForSymbol,
        hasManageOpenExposure,
        isManageMode,
        manageCtx,
        managePnlDisplay,
        markForManage,
        market,
        mergedModel.lastPrice,
    ]);
    var managePositionBiasStat = (0, react_1.useMemo)(function () {
        if (!isManageMode || !manageCtx || !hasManageOpenExposure)
            return null;
        var biasSide = market === 'futures' && exchangePositionForSymbol ? exchangePositionForSymbol.side : manageCtx.side;
        return (0, positionBiasStat_1.positionBiasForSignalRow)(manageCtx.pair, biasSide, selectedSignal);
    }, [exchangePositionForSymbol, hasManageOpenExposure, isManageMode, manageCtx, market, selectedSignal]);
    var manageTimelineLines = (0, react_1.useMemo)(function () {
        if (!isManageMode || !manageCtx)
            return [];
        var lines = [];
        var tlSide = market === 'futures' && exchangePositionForSymbol ? exchangePositionForSymbol.side : manageCtx.side;
        var tlEntry = market === 'futures' && exchangePositionForSymbol && exchangePositionForSymbol.entryPrice > 0
            ? exchangePositionForSymbol.entryPrice
            : manageCtx.entryPrice;
        lines.push("Entered ".concat(tlSide, " at ").concat((0, formatQuote_1.formatQuoteNumber)(tlEntry)));
        var recent = exitAuto.activity.slice(-4);
        for (var _i = 0, recent_1 = recent; _i < recent_1.length; _i++) {
            var a = recent_1[_i];
            lines.push(a.message);
        }
        return lines.slice(0, 5);
    }, [exchangePositionForSymbol, exitAuto.activity, isManageMode, manageCtx, market]);
    /** Omit dock open/closed — refitting on layout toggle wiped pan/zoom after the user dragged the chart. */
    var liveChartRefitKey = hasActiveTradePosition && primaryChartOpenPosition
        ? "".concat(mergedModel.pair, "|").concat(primaryChartOpenPosition.id)
        : undefined;
    /** Chart dock header (under `LiveMarketStrip`): R / T / R:R + setup tier or live exit-state badge — not last price. */
    var dockChartHeaderMetrics = (0, react_1.useMemo)(function () {
        var setupBand = (0, setupScore_1.setupScoreBandShort)(selectedSignal);
        var setupBadge = setupBand === 'Developing' ? 'Building' : setupBand;
        var badge = setupBadge;
        if (hasActiveTradePosition && exitFlow) {
            var st = exitFlow.effective.state;
            badge = st === 'trim' ? 'TRIM' : st === 'exit' ? 'EXIT' : setupBadge;
        }
        var pnlOk = hasActiveTradePosition && Number.isFinite(liveUnrealized.pnlUsd);
        var pnl = pnlOk ? liveUnrealized.pnlUsd : 0;
        var secondaryLine = pnlOk
            ? "uPnL ".concat(pnl >= 0 ? '+' : '−', "$").concat((0, formatQuote_1.formatQuoteNumber)(Math.abs(pnl)))
            : undefined;
        var secondaryLineTone = pnlOk
            ? pnl > 0
                ? 'positive'
                : pnl < 0
                    ? 'negative'
                    : 'neutral'
            : undefined;
        return {
            riskPercent: tradeDockStats.riskPercent,
            rewardPercent: tradeDockStats.rewardPercent,
            rrRatio: tradeDockStats.rrRatio,
            badge: badge,
            secondaryLine: secondaryLine,
            secondaryLineTone: secondaryLineTone,
        };
    }, [
        exitFlow,
        hasActiveTradePosition,
        liveUnrealized.pnlUsd,
        selectedSignal,
        tradeDockStats.rewardPercent,
        tradeDockStats.riskPercent,
        tradeDockStats.rrRatio,
    ]);
    var scenarioSummaryLine = (0, react_1.useMemo)(function () {
        var score = metrics.riskSummary.tradeScore;
        var setup = (0, setupScore_1.setupScoreBandShort)(selectedSignal);
        var setupShown = setup === 'Developing' ? 'Building' : setup;
        var st = exitFlow === null || exitFlow === void 0 ? void 0 : exitFlow.effective.state;
        var head = st && st !== 'hold' ? "".concat(st.toUpperCase(), " \u00B7 ") : '';
        return "".concat(head, "Trade ").concat(score, " \u00B7 ").concat(setupShown);
    }, [exitFlow === null || exitFlow === void 0 ? void 0 : exitFlow.effective.state, metrics.riskSummary.tradeScore, selectedSignal]);
    var exitAiModeLabel = aiExitAutomation_1.EXIT_AI_MODE_LABEL[exitAuto.mode];
    var exitStrategyLabel = aiExitAutomation_1.EXIT_STRATEGY_LABEL[exitAuto.strategy];
    /** Assisted confirm applies to a real open leg only — not hypothetical pre-entry guidance after close/liq. */
    var showAssistedExitConfirmBar = exitAuto.mode === 'assisted' &&
        !assistedExitAcknowledged &&
        !assistedExitBarForceHidden &&
        exitFlow != null &&
        (exitFlow.effective.state === 'trim' || exitFlow.effective.state === 'exit') &&
        (isManageMode
            ? exchangePositionForSymbol != null && manageCtx != null
            : hasActiveTradePosition && isExchangeBackedOpenLeg);
    (0, react_1.useEffect)(function () {
        if (!showAssistedExitConfirmBar || !exitFlow) {
            assistedPopupArmedRef.current = false;
            return;
        }
        if (assistedPopupArmedRef.current)
            return;
        assistedPopupArmedRef.current = true;
        (0, globalAnnouncements_1.emitGlobalAnnouncement)({
            id: "assisted-exit-confirm-".concat(Date.now()),
            kind: 'ai_action',
            title: 'Assisted Exit Confirmation Required',
            subtitle: "".concat(exitFlow.effective.headline, " \u00B7 ").concat(exitFlow.nextPlanned),
        });
    }, [exitFlow, showAssistedExitConfirmBar]);
    var manageExitAiCoPilot = (0, react_1.useMemo)(function () {
        var _a, _b;
        return (0, exitAiCoPilot_1.buildExitAiCoPilotModel)({
            mode: exitAuto.mode,
            side: (_a = primaryChartOpenPosition === null || primaryChartOpenPosition === void 0 ? void 0 : primaryChartOpenPosition.side) !== null && _a !== void 0 ? _a : side,
            flow: exitFlow,
            nextPlanned: (_b = exitFlow === null || exitFlow === void 0 ? void 0 : exitFlow.nextPlanned) !== null && _b !== void 0 ? _b : 'Automation watching trend and risk.',
            safeguards: exitAuto.safeguards,
            assistedPromptVisible: showAssistedExitConfirmBar,
            orderExitInFlight: orderPending === 'close',
            stop: chartModelForPlot.stop,
            target: chartModelForPlot.target,
            contextLine: manageInsightLine,
        });
    }, [
        chartModelForPlot.stop,
        chartModelForPlot.target,
        exitAuto.mode,
        exitAuto.safeguards,
        exitFlow,
        manageInsightLine,
        orderPending,
        primaryChartOpenPosition === null || primaryChartOpenPosition === void 0 ? void 0 : primaryChartOpenPosition.side,
        side,
        showAssistedExitConfirmBar,
    ]);
    (0, react_1.useEffect)(function () {
        if (loggedModeRef.current === null) {
            loggedModeRef.current = exitAuto.mode;
            return;
        }
        if (loggedModeRef.current !== exitAuto.mode) {
            exitAuto.pushActivity({
                kind: 'mode_change',
                message: "Switched to ".concat(aiExitAutomation_1.EXIT_AI_MODE_LABEL[exitAuto.mode]),
            });
            loggedModeRef.current = exitAuto.mode;
        }
    }, [exitAuto.mode, exitAuto.pushActivity]);
    (0, react_1.useEffect)(function () {
        if (loggedStratRef.current === null) {
            loggedStratRef.current = exitAuto.strategy;
            return;
        }
        if (loggedStratRef.current !== exitAuto.strategy) {
            exitAuto.pushActivity({
                kind: 'strategy_change',
                message: "Exit behavior set to ".concat(aiExitAutomation_1.EXIT_STRATEGY_LABEL[exitAuto.strategy]),
            });
            loggedStratRef.current = exitAuto.strategy;
        }
    }, [exitAuto.strategy, exitAuto.pushActivity]);
    (0, react_1.useEffect)(function () {
        if (!exitFlow)
            return;
        var s = exitFlow.effective.state;
        if (prevEffStateRef.current === null) {
            prevEffStateRef.current = s;
            return;
        }
        if (prevEffStateRef.current !== s) {
            var message = s === 'hold'
                ? 'Held position — readout returned to neutral'
                : s === 'trim'
                    ? 'Considering partial scale-out near plan target'
                    : 'Favoring a protective exit near invalidation';
            exitAuto.pushActivity({
                kind: 'exit_state',
                message: message,
            });
            prevEffStateRef.current = s;
        }
    }, [exitFlow, exitAuto.pushActivity]);
    (0, react_1.useEffect)(function () {
        if (!exitFlow)
            return;
        var maxL = exitAuto.safeguards.maxLossPct;
        var pnl = exitFlow.pnlPct;
        var prev = prevPnlForSafeguardRef.current;
        var crossed = prev !== null && prev > -maxL && pnl <= -maxL;
        if (crossed) {
            exitAuto.pushActivity({
                kind: 'safeguard',
                message: 'Max loss safeguard crossed — favoring protective exit.',
            });
        }
        prevPnlForSafeguardRef.current = pnl;
    }, [exitFlow, exitAuto.safeguards.maxLossPct, exitAuto.pushActivity]);
    var flashTradeToast = (0, react_1.useCallback)(function (message, durationMs, cta) {
        if (durationMs === void 0) { durationMs = 2600; }
        setTradeToast(message);
        setTradeToastCta(cta !== null && cta !== void 0 ? cta : null);
        if (!cta)
            setTermsRetrySide(null);
        window.clearTimeout(toastClearRef.current);
        toastClearRef.current = window.setTimeout(function () {
            setTradeToast(null);
            setTradeToastCta(null);
            setTermsRetrySide(null);
        }, durationMs);
    }, []);
    var onLeverageChange = (0, react_1.useCallback)(function (n) {
        var cap = futuresLevCap > 0 ? futuresLevCap : 200;
        var lev = Math.round(Math.min(Math.max(1, n), cap));
        setLeverage(lev);
        if (isManageMode)
            setManageOrderDraftDirty(true);
        if (!useRealExecution || market !== 'futures')
            return;
        if (!bybitSnap || bybitSnap.status !== 'connected')
            return;
        window.clearTimeout(leverageExchangeSyncTimerRef.current);
        leverageExchangeSyncTimerRef.current = window.setTimeout(function () {
            void (function () { return __awaiter(_this, void 0, void 0, function () {
                var e_1, exLev;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!hasOpenLinearForOrderSymbolRef.current)
                                return [2 /*return*/];
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 4, , 6]);
                            return [4 /*yield*/, (0, tradeClient_1.postBybitSetLinearLeverage)({ symbol: orderSymbol, leverage: lev })];
                        case 2:
                            _a.sent();
                            flashTradeToast('Leverage updated on Bybit.');
                            return [4 /*yield*/, refreshAccountSnapshots({ silent: true })];
                        case 3:
                            _a.sent();
                            return [3 /*break*/, 6];
                        case 4:
                            e_1 = _a.sent();
                            flashTradeToast((0, bybitUserFacingError_1.formatBybitTradeErrorMessage)(e_1, 'Could not update leverage on Bybit'), 5200);
                            exLev = exchangePositionForSymbol === null || exchangePositionForSymbol === void 0 ? void 0 : exchangePositionForSymbol.leverage;
                            if (exLev != null && exLev > 0)
                                setLeverage(Math.min(Math.round(exLev), cap));
                            return [4 /*yield*/, refreshAccountSnapshots({ silent: true })];
                        case 5:
                            _a.sent();
                            return [3 /*break*/, 6];
                        case 6: return [2 /*return*/];
                    }
                });
            }); })();
        }, 450);
    }, [
        bybitSnap,
        exchangePositionForSymbol,
        flashTradeToast,
        futuresLevCap,
        isManageMode,
        market,
        orderSymbol,
        refreshAccountSnapshots,
        useRealExecution,
    ]);
    var biasNotifyPermission = (0, react_1.useMemo)(function () {
        return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
    }, [biasNotifyPermTick]);
    var appAnnouncementsEnabled = (0, useAppAnnouncementsEnabled_1.useAppAnnouncementsEnabled)();
    /**
     * Bell / menu: toggles all global announcements (banners, haptics, OS notifications).
     * When alerts are on and permission is "default", requests browser notification access.
     */
    var onBiasAlertsControl = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var r, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!(0, appAnnouncementsPreference_1.readAppAnnouncementsEnabled)()) {
                        (0, appAnnouncementsPreference_1.setAppAnnouncementsEnabled)(true);
                        flashTradeToast('All Sigflo alerts on — banners, haptics, and browser notifications (if allowed).');
                        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                            try {
                                new Notification('Sigflo', { body: 'Alerts are back on.' });
                            }
                            catch (_c) {
                                /* ignore */
                            }
                        }
                        return [2 /*return*/];
                    }
                    if (typeof Notification === 'undefined') {
                        (0, appAnnouncementsPreference_1.setAppAnnouncementsEnabled)(false);
                        flashTradeToast('All Sigflo alerts off — this browser has no Notification API.');
                        return [2 /*return*/];
                    }
                    if (Notification.permission === 'granted') {
                        (0, appAnnouncementsPreference_1.setAppAnnouncementsEnabled)(false);
                        flashTradeToast('All Sigflo alerts off.');
                        return [2 /*return*/];
                    }
                    if (Notification.permission === 'denied') {
                        (0, appAnnouncementsPreference_1.setAppAnnouncementsEnabled)(false);
                        flashTradeToast('All Sigflo alerts off. Allow this site in browser settings to use OS notifications again.');
                        return [2 /*return*/];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, Notification.requestPermission()];
                case 2:
                    r = _b.sent();
                    setBiasNotifyPermTick(function (n) { return n + 1; });
                    if (r === 'granted') {
                        flashTradeToast('Browser notifications enabled.');
                        try {
                            new Notification('Sigflo', {
                                body: 'Only your Trade chart pair (this tab). ~$5+ notionals. Switch pair on Trade to change which one alerts.',
                            });
                        }
                        catch (_d) {
                            /* ignore */
                        }
                    }
                    else {
                        flashTradeToast('OS notifications declined — you can mute in-app alerts with the bell.');
                    }
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    flashTradeToast('Could not request notifications.');
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [flashTradeToast]);
    var copyTradeLink = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var href, _a, ta, ok;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    href = window.location.href;
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 4, , 5]);
                    if (!((_b = navigator === null || navigator === void 0 ? void 0 : navigator.clipboard) === null || _b === void 0 ? void 0 : _b.writeText)) return [3 /*break*/, 3];
                    return [4 /*yield*/, navigator.clipboard.writeText(href)];
                case 2:
                    _c.sent();
                    return [2 /*return*/, true];
                case 3: return [3 /*break*/, 5];
                case 4:
                    _a = _c.sent();
                    return [3 /*break*/, 5];
                case 5:
                    try {
                        ta = document.createElement('textarea');
                        ta.value = href;
                        ta.setAttribute('readonly', '');
                        ta.style.position = 'fixed';
                        ta.style.opacity = '0';
                        document.body.appendChild(ta);
                        ta.select();
                        ok = document.execCommand('copy');
                        document.body.removeChild(ta);
                        return [2 /*return*/, ok];
                    }
                    catch (_d) {
                        return [2 /*return*/, false];
                    }
                    return [2 /*return*/];
            }
        });
    }); }, []);
    (0, react_1.useEffect)(function () {
        if (!serverExitEligible || !serverExitOvernightHydrated || !serverExitOvernightEnabled)
            return;
        if (!exitFlow || !exchangePositionForSymbol)
            return;
        var stop = isManageMode ? modelForMetrics.stop : chartModelForPlot.stop;
        var target = isManageMode ? modelForMetrics.target : chartModelForPlot.target;
        if (!Number.isFinite(stop) || stop <= 0 || !Number.isFinite(target) || target <= 0)
            return;
        var t = window.setTimeout(function () {
            var _a;
            void (0, tradeClient_1.putExitAutomationWatch)({
                enabled: true,
                symbol: orderSymbol,
                side: exchangePositionForSymbol.side,
                positionIdx: (_a = exchangePositionForSymbol.positionIdx) !== null && _a !== void 0 ? _a : 0,
                stopPrice: stop,
                targetPrice: target,
                trendAlignment: selectedSignal.scoreBreakdown.trendAlignment,
                momentumQuality: selectedSignal.scoreBreakdown.momentumQuality,
                strategyPreset: exitAuto.strategy,
                customStrategyThresholds: exitAuto.strategy === 'custom' ? exitAuto.customStrategyThresholds : null,
                safeguards: exitAuto.safeguards,
                lastGuidanceState: exitFlow.effective.state,
                exchange: 'bybit',
                market: 'linear',
            }).catch(function (err) {
                var msg = err instanceof Error ? err.message : 'Could not sync server exit automation.';
                flashTradeToast(msg);
            });
        }, 800);
        return function () { return window.clearTimeout(t); };
    }, [
        serverExitEligible,
        serverExitOvernightHydrated,
        serverExitOvernightEnabled,
        exitFlow,
        exchangePositionForSymbol === null || exchangePositionForSymbol === void 0 ? void 0 : exchangePositionForSymbol.side,
        exchangePositionForSymbol === null || exchangePositionForSymbol === void 0 ? void 0 : exchangePositionForSymbol.positionIdx,
        orderSymbol,
        isManageMode,
        modelForMetrics.stop,
        modelForMetrics.target,
        chartModelForPlot.stop,
        chartModelForPlot.target,
        selectedSignal.scoreBreakdown.trendAlignment,
        selectedSignal.scoreBreakdown.momentumQuality,
        exitAuto.strategy,
        exitAuto.customStrategyThresholds,
        exitAuto.safeguards,
        flashTradeToast,
    ]);
    var prevExchangeOpenLegIdRef = (0, react_1.useRef)(undefined);
    (0, react_1.useEffect)(function () {
        if (!useRealExecution || !bybitSnap || bybitSnap.status !== 'connected') {
            prevExchangeOpenLegIdRef.current = exchangeTrackedOpenLegId;
            return;
        }
        var cur = exchangeTrackedOpenLegId;
        var prev = prevExchangeOpenLegIdRef.current;
        if (prev === undefined) {
            prevExchangeOpenLegIdRef.current = cur;
            return;
        }
        var vanished = prev !== null && cur === null;
        if (vanished && Date.now() >= suppressExternalPositionCloseFeedbackUntilRef.current) {
            var aiLikely = exitAuto.mode === 'auto' && recentExitAiAutoCloseSubmit(exitAuto.activity, 90000);
            flashTradeToast(aiLikely
                ? 'Position closed on the exchange — AI auto-exit finished.'
                : 'Position closed on the exchange (manual, TP/SL, liquidation, or another app).', 5200);
            exitAuto.pushActivity({
                kind: 'exit_state',
                message: aiLikely
                    ? 'Open position cleared after AI auto exit; account sync matched a full close.'
                    : 'Open position no longer on the exchange — closed outside this flow or by the market.',
            });
        }
        prevExchangeOpenLegIdRef.current = cur;
    }, [
        bybitSnap,
        exchangeTrackedOpenLegId,
        exitAuto.activity,
        exitAuto.mode,
        exitAuto.pushActivity,
        flashTradeToast,
        useRealExecution,
    ]);
    var submitExchangeClose = (0, react_1.useCallback)(function (args) { return __awaiter(_this, void 0, void 0, function () {
        var fraction, qtyBase, qtyStr, pos, qtyBase, qtyStr, closeSide, mark, summaryPos, summary, pct, e_2, pct;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    setOrderPending('close');
                    fraction = args.fraction;
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 7, 8, 9]);
                    if (!(args.kind === 'spot')) return [3 /*break*/, 3];
                    qtyBase = args.freeBase * Math.min(1, Math.max(0, fraction));
                    if (!(qtyBase > 0)) {
                        flashTradeToast('No spot balance to sell for this pair.');
                        return [2 /*return*/];
                    }
                    qtyStr = (0, linearOrderQty_1.linearQtyFromBaseAmount)(qtyBase);
                    return [4 /*yield*/, (0, tradeClient_1.postBybitSpotOrder)({
                            symbol: args.symbol,
                            side: 'Sell',
                            qty: qtyStr,
                            marketUnit: 'baseCoin',
                            orderType: 'Market',
                        })];
                case 2:
                    _c.sent();
                    return [3 /*break*/, 5];
                case 3:
                    pos = args.pos;
                    qtyBase = Math.abs(pos.size) * Math.min(1, Math.max(0, fraction));
                    qtyStr = (0, linearOrderQty_1.linearQtyFromBaseAmount)(qtyBase);
                    closeSide = pos.side === 'long' ? 'Sell' : 'Buy';
                    return [4 /*yield*/, (0, tradeClient_1.postBybitLinearOrder)({
                            symbol: pos.symbol,
                            side: closeSide,
                            qty: qtyStr,
                            reduceOnly: true,
                            positionIdx: (_a = pos.positionIdx) !== null && _a !== void 0 ? _a : 0,
                            orderType: 'Market',
                        })];
                case 4:
                    _c.sent();
                    _c.label = 5;
                case 5:
                    suppressExternalPositionCloseFeedbackUntilRef.current = Date.now() + 8000;
                    mark = throttledOpenPnl.mark > 0 && Number.isFinite(throttledOpenPnl.mark)
                        ? throttledOpenPnl.mark
                        : live.lastPrice != null && live.lastPrice > 0
                            ? live.lastPrice
                            : Number.isFinite(mergedModel.lastPrice) && mergedModel.lastPrice > 0
                                ? mergedModel.lastPrice
                                : 0;
                    summaryPos = primaryOpenPosition !== null && primaryOpenPosition !== void 0 ? primaryOpenPosition : (isManageMode ? exchangeSyntheticForManageChart : null);
                    summary = summaryPos && mark > 0 ? (0, closedPositionSummary_1.buildClosedPositionSummary)(summaryPos, mark, fraction) : null;
                    if (summary) {
                        setClosedPositionSummary(summary);
                    }
                    else {
                        flashTradeToast(fraction >= 0.999 ? 'Close submitted — syncing account…' : 'Partial close submitted — syncing…');
                    }
                    pct = Math.round(fraction * 100);
                    if (fraction >= 0.995) {
                        exitAuto.pushActivity({
                            kind: 'exit_state',
                            message: 'Position fully closed on the exchange.',
                        });
                    }
                    else {
                        exitAuto.pushActivity({
                            kind: 'exit_state',
                            message: "Scaled out ".concat(pct, "% \u00B7 remaining position still active"),
                        });
                    }
                    if (pendingManualPartialClosePctRef.current != null) {
                        exitAuto.pushActivity({
                            kind: 'exit_state',
                            message: "Manual partial close ".concat(pct, "% submitted \u2014 syncing exchange fill\u2026"),
                        });
                    }
                    return [4 /*yield*/, refreshAccountSnapshots({ silent: false })];
                case 6:
                    _c.sent();
                    return [3 /*break*/, 9];
                case 7:
                    e_2 = _c.sent();
                    if (pendingManualPartialClosePctRef.current != null) {
                        pct = Math.round(((_b = pendingManualPartialClosePctRef.current) !== null && _b !== void 0 ? _b : fraction) * 100);
                        exitAuto.pushActivity({
                            kind: 'exit_state',
                            message: "Manual partial close ".concat(pct, "% failed \u2014 review order state and retry."),
                        });
                    }
                    flashTradeToast((0, bybitUserFacingError_1.formatBybitTradeErrorMessage)(e_2, 'Close failed'), 5200);
                    return [3 /*break*/, 9];
                case 8:
                    pendingManualPartialClosePctRef.current = null;
                    setOrderPending(null);
                    return [7 /*endfinally*/];
                case 9: return [2 /*return*/];
            }
        });
    }); }, [
        exchangeSyntheticForManageChart,
        exitAuto.pushActivity,
        flashTradeToast,
        isManageMode,
        live.lastPrice,
        mergedModel.lastPrice,
        primaryOpenPosition,
        refreshAccountSnapshots,
        throttledOpenPnl.mark,
    ]);
    var executeTrade = (0, react_1.useCallback)(function (nextSide, opts) { return __awaiter(_this, void 0, void 0, function () {
        var entryMark, linearReverseAwaitPostSyncClear, openedNewFuturesEntry_1, userRequestedStopLoss, orderNotionalUsd, sideBybit, qtyQuote, qtyStr, qtyStr, positionIdx, pos, closeIdx, closeQtyStr, closeSide, openIdx, deadline, snaps, _a, tpSl, skippedTarget, skippedStop, tpslAttach, snapshotsAfter, hasUserTpSl, rollbackUnprotectedEntry, pos, synced, e_3, e_4, tradeErr;
        var _this = this;
        var _b, _c, _d, _e, _f, _g;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    if (!isManageMode && isBotsReviewCockpit && dailyRiskGuard.status === 'locked') {
                        flashTradeToast('Daily risk limit reached — new entries paused for today.', 4200, {
                            label: 'Risk controls',
                            href: '/risk',
                        });
                        return [2 /*return*/, false];
                    }
                    if (!isManageMode && !(opts === null || opts === void 0 ? void 0 : opts.bypassGuidedExecution)) {
                        setGuidedExecutionSide(nextSide);
                        setGuidedExecutionOpen(true);
                        return [2 /*return*/, false];
                    }
                    if (!isManageMode && liveExecutionLocked) {
                        flashTradeToast('Live execution locked — review-only flow from Bots.');
                        return [2 /*return*/, false];
                    }
                    if (!canExecute) {
                        flashTradeToast((_b = sizingValidation.reason) !== null && _b !== void 0 ? _b : 'Set a valid position size before placing an order.');
                        return [2 /*return*/, false];
                    }
                    setSide(nextSide);
                    setExecFlash(nextSide === 'long' ? 'long' : 'short');
                    window.clearTimeout(execFlashClearRef.current);
                    execFlashClearRef.current = window.setTimeout(function () { return setExecFlash(null); }, 420);
                    entryMark = NaN;
                    if (Number.isFinite(mergedModel.lastPrice) && mergedModel.lastPrice > 0) {
                        entryMark = mergedModel.lastPrice;
                    }
                    else if (Number.isFinite(mergedModel.entry) && mergedModel.entry > 0) {
                        entryMark = mergedModel.entry;
                    }
                    else if (live.lastPrice != null && Number.isFinite(live.lastPrice) && live.lastPrice > 0) {
                        entryMark = live.lastPrice;
                    }
                    if (!Number.isFinite(entryMark) || entryMark <= 0) {
                        flashTradeToast('No price yet — wait for the chart to load, then try again.');
                        return [2 /*return*/, false];
                    }
                    // Manage: same-side adds only — reversing is an explicit opposite-side market (see `onReverseOrder`).
                    if (isManageMode && (opts === null || opts === void 0 ? void 0 : opts.manageIntent) !== 'reverse' && nextSide !== side) {
                        flashTradeToast('Adding size uses your open direction — adjust side from Portfolio if needed.');
                        return [2 /*return*/, false];
                    }
                    if (isManageMode && market === 'futures' && !exchangePositionForSymbol) {
                        flashTradeToast(bybitSnap
                            ? 'No open linear position on the exchange for this pair — confirm symbol or refresh Account.'
                            : 'Connect Bybit in Account to add size.');
                        return [2 /*return*/, false];
                    }
                    if (!liveOrderSubmitEnabled) return [3 /*break*/, 37];
                    setOrderPending('open');
                    _h.label = 1;
                case 1:
                    _h.trys.push([1, 35, 36, 37]);
                    linearReverseAwaitPostSyncClear = false;
                    openedNewFuturesEntry_1 = null;
                    userRequestedStopLoss = Number.isFinite(stopParsed) && stopParsed > 0;
                    orderNotionalUsd = (0, linearOrderQty_1.applyOpenOrderNotionalBuffer)(metrics.positionSizeUsd, {
                        minNotionalUsd: minOrderUsd,
                    });
                    sideBybit = nextSide === 'long' ? 'Buy' : 'Sell';
                    if (!(market === 'spot')) return [3 /*break*/, 6];
                    if (!(sideBybit === 'Buy')) return [3 /*break*/, 3];
                    qtyQuote = (0, linearOrderQty_1.spotQuoteQtyFromUsd)(orderNotionalUsd);
                    return [4 /*yield*/, (0, tradeClient_1.postBybitSpotOrder)({
                            symbol: orderSymbol,
                            side: 'Buy',
                            orderType: 'Market',
                            qty: qtyQuote,
                            marketUnit: 'quoteCoin',
                        })];
                case 2:
                    _h.sent();
                    return [3 /*break*/, 5];
                case 3:
                    qtyStr = (0, linearOrderQty_1.linearQtyFromNotionalUsd)(orderNotionalUsd, entryMark);
                    return [4 /*yield*/, (0, tradeClient_1.postBybitSpotOrder)({
                            symbol: orderSymbol,
                            side: 'Sell',
                            orderType: 'Market',
                            qty: qtyStr,
                            marketUnit: 'baseCoin',
                        })];
                case 4:
                    _h.sent();
                    _h.label = 5;
                case 5: return [3 /*break*/, 18];
                case 6:
                    qtyStr = (0, linearOrderQty_1.linearQtyFromNotionalUsd)(orderNotionalUsd, entryMark);
                    positionIdx = isManageMode ? ((_c = exchangePositionForSymbol === null || exchangePositionForSymbol === void 0 ? void 0 : exchangePositionForSymbol.positionIdx) !== null && _c !== void 0 ? _c : 0) : 0;
                    if (!(isManageMode && (opts === null || opts === void 0 ? void 0 : opts.manageIntent) === 'reverse' && exchangePositionForSymbol)) return [3 /*break*/, 14];
                    pos = exchangePositionForSymbol;
                    closeIdx = (_d = pos.positionIdx) !== null && _d !== void 0 ? _d : 0;
                    closeQtyStr = (0, linearOrderQty_1.linearQtyFromBaseAmount)(Math.abs(pos.size));
                    closeSide = pos.side === 'long' ? 'Sell' : 'Buy';
                    openIdx = bybitLinearPositionIdxForOpenSide(nextSide, closeIdx);
                    reverseOrderInProgressRef.current = true;
                    return [4 /*yield*/, (0, tradeClient_1.postBybitLinearOrder)({
                            symbol: orderSymbol,
                            side: closeSide,
                            qty: closeQtyStr,
                            reduceOnly: true,
                            positionIdx: closeIdx,
                            orderType: 'Market',
                        })];
                case 7:
                    _h.sent();
                    suppressExternalPositionCloseFeedbackUntilRef.current = Date.now() + 12000;
                    deadline = Date.now() + 8000;
                    return [4 /*yield*/, refreshAccountSnapshots({ silent: true })];
                case 8:
                    snaps = _h.sent();
                    _h.label = 9;
                case 9:
                    if (!(bybitLinearLegStillOpen(snaps, orderSymbol, pos.side, closeIdx) &&
                        Date.now() < deadline)) return [3 /*break*/, 12];
                    return [4 /*yield*/, new Promise(function (r) {
                            window.setTimeout(r, 250);
                        })];
                case 10:
                    _h.sent();
                    return [4 /*yield*/, refreshAccountSnapshots({ silent: true })];
                case 11:
                    snaps = _h.sent();
                    return [3 /*break*/, 9];
                case 12:
                    if (bybitLinearLegStillOpen(snaps, orderSymbol, pos.side, closeIdx)) {
                        reverseOrderInProgressRef.current = false;
                        flashTradeToast('Close leg still open on the exchange after reverse step 1 — new entry was not sent. Refresh Account or retry.', 7000);
                        return [2 /*return*/, false];
                    }
                    return [4 /*yield*/, (0, tradeClient_1.postBybitLinearOrder)({
                            symbol: orderSymbol,
                            side: sideBybit,
                            qty: qtyStr,
                            orderType: 'Market',
                            leverage: Math.min(leverage, futuresLevCap),
                            positionIdx: openIdx,
                        })];
                case 13:
                    _h.sent();
                    linearReverseAwaitPostSyncClear = true;
                    return [3 /*break*/, 18];
                case 14:
                    if (!isManageMode) return [3 /*break*/, 16];
                    return [4 /*yield*/, (0, tradeClient_1.postBybitLinearOrder)({
                            symbol: orderSymbol,
                            side: sideBybit,
                            qty: qtyStr,
                            orderType: 'Market',
                            leverage: Math.min(leverage, futuresLevCap),
                            positionIdx: positionIdx,
                        })];
                case 15:
                    _h.sent();
                    return [3 /*break*/, 18];
                case 16:
                    _a = (0, bybitLinearTpSl_1.linearTpSlStringsForOpen)(nextSide, entryMark, targetParsed, stopParsed), tpSl = _a.tpSl, skippedTarget = _a.skippedTarget, skippedStop = _a.skippedStop;
                    if (userRequestedStopLoss && skippedStop) {
                        flashTradeToast('Stop-loss is required for this entry and must be on the correct side of entry. Order was not sent.', 7000);
                        return [2 /*return*/, false];
                    }
                    if (skippedTarget || skippedStop) {
                        flashTradeToast('Target/stop must be on the correct side of entry for exchange TP/SL — invalid level(s) were not sent.', 7000);
                    }
                    tpslAttach = tpSl.takeProfit || tpSl.stopLoss
                        ? __assign(__assign(__assign({}, (tpSl.takeProfit ? { takeProfit: tpSl.takeProfit } : {})), (tpSl.stopLoss ? { stopLoss: tpSl.stopLoss } : {})), { tpTriggerBy: futuresTpSlTriggerBy, slTriggerBy: futuresTpSlTriggerBy }) : {};
                    openedNewFuturesEntry_1 = {
                        side: sideBybit,
                        qty: qtyStr,
                        positionIdx: 0,
                    };
                    return [4 /*yield*/, (0, tradeClient_1.postBybitLinearOrder)(__assign({ symbol: orderSymbol, side: sideBybit, qty: qtyStr, orderType: 'Market', leverage: Math.min(leverage, futuresLevCap), positionIdx: 0 }, tpslAttach))];
                case 17:
                    _h.sent();
                    _h.label = 18;
                case 18:
                    flashTradeToast('Order submitted — syncing account…');
                    return [4 /*yield*/, refreshAccountSnapshots({ silent: false })];
                case 19:
                    snapshotsAfter = _h.sent();
                    if (linearReverseAwaitPostSyncClear) {
                        reverseOrderInProgressRef.current = false;
                    }
                    hasUserTpSl = (Number.isFinite(targetParsed) && targetParsed > 0) ||
                        (Number.isFinite(stopParsed) && stopParsed > 0);
                    if (!(market === 'futures' && !isManageMode && hasUserTpSl)) return [3 /*break*/, 34];
                    rollbackUnprotectedEntry = function (reason, details) { return __awaiter(_this, void 0, void 0, function () {
                        var closeSide, closeErr_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!openedNewFuturesEntry_1) {
                                        flashTradeToast(reason, 7600);
                                        return [2 /*return*/];
                                    }
                                    closeSide = openedNewFuturesEntry_1.side === 'Buy' ? 'Sell' : 'Buy';
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 4, , 5]);
                                    return [4 /*yield*/, (0, tradeClient_1.postBybitLinearOrder)({
                                            symbol: orderSymbol,
                                            side: closeSide,
                                            qty: openedNewFuturesEntry_1.qty,
                                            orderType: 'Market',
                                            reduceOnly: true,
                                            positionIdx: openedNewFuturesEntry_1.positionIdx,
                                        })];
                                case 2:
                                    _a.sent();
                                    return [4 /*yield*/, refreshAccountSnapshots({ silent: true })];
                                case 3:
                                    _a.sent();
                                    flashTradeToast(details ? "".concat(reason, " ").concat(details) : reason, 7600);
                                    return [3 /*break*/, 5];
                                case 4:
                                    closeErr_1 = _a.sent();
                                    flashTradeToast((0, bybitUserFacingError_1.formatBybitTradeErrorMessage)(closeErr_1, "".concat(reason, " Auto-close also failed \u2014 close manually now.")), 9000);
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); };
                    pos = findBybitLinearOpenLeg(snapshotsAfter, orderSymbol, nextSide);
                    if (!(!pos || !Number.isFinite(pos.entryPrice) || pos.entryPrice <= 0)) return [3 /*break*/, 22];
                    if (!userRequestedStopLoss) return [3 /*break*/, 21];
                    return [4 /*yield*/, rollbackUnprotectedEntry('Stop-loss could not be verified on the new position. Entry was auto-closed.', 'Retry once account sync is stable.')];
                case 20:
                    _h.sent();
                    return [2 /*return*/, false];
                case 21: return [3 /*break*/, 34];
                case 22:
                    synced = (0, bybitLinearTpSl_1.linearTpSlStringsForOpen)(nextSide, pos.entryPrice, targetParsed, stopParsed);
                    if (synced.skippedTarget || synced.skippedStop) {
                        flashTradeToast('TP/SL vs average fill: a level is on the wrong side — adjust in the form and use Apply TP/SL on manage if needed.', 7000);
                    }
                    if (!(userRequestedStopLoss && (synced.skippedStop || !synced.tpSl.stopLoss))) return [3 /*break*/, 24];
                    return [4 /*yield*/, rollbackUnprotectedEntry('Stop-loss could not be applied against the average fill price. Entry was auto-closed.')];
                case 23:
                    _h.sent();
                    return [2 /*return*/, false];
                case 24:
                    if (!(synced.tpSl.takeProfit || synced.tpSl.stopLoss)) return [3 /*break*/, 32];
                    _h.label = 25;
                case 25:
                    _h.trys.push([25, 27, , 30]);
                    return [4 /*yield*/, (0, tradeClient_1.postBybitLinearTradingStop)({
                            symbol: orderSymbol,
                            positionIdx: (_e = pos.positionIdx) !== null && _e !== void 0 ? _e : 0,
                            takeProfit: (_f = synced.tpSl.takeProfit) !== null && _f !== void 0 ? _f : '0',
                            stopLoss: (_g = synced.tpSl.stopLoss) !== null && _g !== void 0 ? _g : '0',
                            tpTriggerBy: futuresTpSlTriggerBy,
                            slTriggerBy: futuresTpSlTriggerBy,
                        })];
                case 26:
                    _h.sent();
                    return [3 /*break*/, 30];
                case 27:
                    e_3 = _h.sent();
                    if (!userRequestedStopLoss) return [3 /*break*/, 29];
                    return [4 /*yield*/, rollbackUnprotectedEntry('Stop-loss placement failed on the exchange. Entry was auto-closed.', "Exchange error: ".concat(e_3 instanceof Error ? e_3.message : String(e_3)))];
                case 28:
                    _h.sent();
                    return [2 /*return*/, false];
                case 29:
                    flashTradeToast((0, bybitUserFacingError_1.formatBybitTradeErrorMessage)(e_3, 'TP/SL sync after fill failed'), 5200);
                    return [3 /*break*/, 30];
                case 30: return [4 /*yield*/, refreshAccountSnapshots({ silent: true })];
                case 31:
                    _h.sent();
                    return [3 /*break*/, 34];
                case 32:
                    if (!userRequestedStopLoss) return [3 /*break*/, 34];
                    return [4 /*yield*/, rollbackUnprotectedEntry('Stop-loss placement failed on the exchange. Entry was auto-closed.')];
                case 33:
                    _h.sent();
                    return [2 /*return*/, false];
                case 34: return [2 /*return*/, true];
                case 35:
                    e_4 = _h.sent();
                    reverseOrderInProgressRef.current = false;
                    tradeErr = (0, bybitUserFacingError_1.resolveBybitTradeError)(e_4, 'Order failed');
                    setTermsRetrySide(tradeErr.cta ? nextSide : null);
                    flashTradeToast(tradeErr.message, 5200, tradeErr.cta);
                    return [2 /*return*/, false];
                case 36:
                    setOrderPending(null);
                    return [7 /*endfinally*/];
                case 37:
                    if (useRealExecution && !riskSettings.allowLiveExecution) {
                        flashTradeToast('Live execution is locked — enable it in Risk controls when you are ready to send orders.', 5200, {
                            label: 'Risk controls',
                            href: '/risk',
                        });
                    }
                    else {
                        flashTradeToast('Connect Bybit in Account to place real orders.');
                    }
                    return [2 /*return*/, false];
            }
        });
    }); }, [
        amountUsd,
        bybitSnap,
        canExecute,
        exchangePositionForSymbol,
        flashTradeToast,
        futuresLevCap,
        futuresTpSlTriggerBy,
        dailyRiskGuard.status,
        isBotsReviewCockpit,
        isManageMode,
        leverage,
        liveExecutionLocked,
        live.lastPrice,
        liveOrderSubmitEnabled,
        market,
        mergedModel.entry,
        mergedModel.lastPrice,
        mergedModel.pair,
        metrics.positionSizeUsd,
        minOrderUsd,
        orderSymbol,
        refreshAccountSnapshots,
        riskSettings.allowLiveExecution,
        side,
        sizingValidation.reason,
        stopParsed,
        targetParsed,
        useRealExecution,
    ]);
    var submitManageTradingStopFromNumbers = (0, react_1.useCallback)(function (stopPrice, targetPrice) { return __awaiter(_this, void 0, void 0, function () {
        var entry, legSide, _a, tpSl, skippedTarget, skippedStop, tpExisting, slExisting, takeProfit, stopLoss, e_5;
        var _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    if (market !== 'futures')
                        return [2 /*return*/, false];
                    if (!exchangePositionForSymbol) {
                        flashTradeToast(bybitSnap
                            ? 'No open linear position on the exchange for this pair — confirm symbol or refresh Account.'
                            : 'Connect Bybit in Account to update TP/SL.');
                        return [2 /*return*/, false];
                    }
                    if (!useRealExecution) {
                        flashTradeToast('Connect Bybit in Account to update TP/SL.');
                        return [2 /*return*/, false];
                    }
                    if (!riskSettings.allowLiveExecution) {
                        flashTradeToast('Live execution is locked — enable it in Risk controls to push TP/SL changes to the exchange.', 6200, { label: 'Risk controls', href: '/risk' });
                        return [2 /*return*/, false];
                    }
                    entry = exchangePositionForSymbol.entryPrice;
                    if (!Number.isFinite(entry) || entry <= 0) {
                        flashTradeToast('Missing entry price — refresh Account sync.');
                        return [2 /*return*/, false];
                    }
                    legSide = exchangePositionForSymbol.side;
                    _a = (0, bybitLinearTpSl_1.linearTpSlStringsForOpen)(legSide, entry, targetPrice, stopPrice), tpSl = _a.tpSl, skippedTarget = _a.skippedTarget, skippedStop = _a.skippedStop;
                    if (skippedTarget || skippedStop) {
                        flashTradeToast('A level is on the wrong side of entry — that leg was left unchanged on the exchange. Other legs still update.', 7000);
                    }
                    tpExisting = exchangePositionForSymbol.takeProfitPrice;
                    slExisting = exchangePositionForSymbol.stopLossPrice;
                    takeProfit = (_b = tpSl.takeProfit) !== null && _b !== void 0 ? _b : (skippedTarget
                        ? (tpExisting != null && Number.isFinite(tpExisting) && tpExisting > 0
                            ? (0, bybitLinearTpSl_1.formatLinearPriceStringForBybit)(tpExisting)
                            : '') || '0'
                        : '0');
                    stopLoss = (_c = tpSl.stopLoss) !== null && _c !== void 0 ? _c : (skippedStop
                        ? (slExisting != null && Number.isFinite(slExisting) && slExisting > 0
                            ? (0, bybitLinearTpSl_1.formatLinearPriceStringForBybit)(slExisting)
                            : '') || '0'
                        : '0');
                    setOrderPending('tpsl');
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, (0, tradeClient_1.postBybitLinearTradingStop)({
                            symbol: orderSymbol,
                            positionIdx: (_d = exchangePositionForSymbol.positionIdx) !== null && _d !== void 0 ? _d : 0,
                            takeProfit: takeProfit,
                            stopLoss: stopLoss,
                            tpTriggerBy: futuresTpSlTriggerBy,
                            slTriggerBy: futuresTpSlTriggerBy,
                        })];
                case 2:
                    _e.sent();
                    setStopStr(Number.isFinite(stopPrice) && stopPrice > 0 ? (0, formatQuote_1.formatQuoteNumber)(stopPrice) : '');
                    setTargetStr(Number.isFinite(targetPrice) && targetPrice > 0 ? (0, formatQuote_1.formatQuoteNumber)(targetPrice) : '');
                    if (isManageMode)
                        setManageTpSlDirty(false);
                    flashTradeToast('TP/SL updated — syncing account…');
                    return [4 /*yield*/, refreshAccountSnapshots({ silent: false })];
                case 3:
                    _e.sent();
                    return [2 /*return*/, true];
                case 4:
                    e_5 = _e.sent();
                    flashTradeToast((0, bybitUserFacingError_1.formatBybitTradeErrorMessage)(e_5, 'Failed to update TP/SL'), 5200);
                    return [2 /*return*/, false];
                case 5:
                    setOrderPending(null);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); }, [
        bybitSnap,
        exchangePositionForSymbol,
        flashTradeToast,
        futuresTpSlTriggerBy,
        isManageMode,
        market,
        orderSymbol,
        refreshAccountSnapshots,
        riskSettings.allowLiveExecution,
        useRealExecution,
    ]);
    var liveChartTpSlDragEligible = (0, react_1.useMemo)(function () {
        return !isManageMode &&
            !isBotsReviewCockpit &&
            !liveExecutionLocked &&
            market === 'futures' &&
            useRealExecution &&
            riskSettings.allowLiveExecution &&
            exchangePositionForSymbol != null &&
            isExchangeBackedOpenLeg &&
            orderPending == null;
    }, [
        exchangePositionForSymbol,
        isBotsReviewCockpit,
        isExchangeBackedOpenLeg,
        isManageMode,
        liveExecutionLocked,
        market,
        orderPending,
        riskSettings.allowLiveExecution,
        useRealExecution,
    ]);
    var onDockChartLiveStopDragCommit = (0, react_1.useCallback)(function (p) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!Number.isFinite(p) || p <= 0)
                        return [2 /*return*/];
                    setStopStr((0, formatQuote_1.formatQuoteNumber)(p));
                    return [4 /*yield*/, submitManageTradingStopFromNumbers(p, targetParsed)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, [submitManageTradingStopFromNumbers, targetParsed]);
    var onDockChartLiveTargetDragCommit = (0, react_1.useCallback)(function (p) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!Number.isFinite(p) || p <= 0)
                        return [2 /*return*/];
                    setTargetStr((0, formatQuote_1.formatQuoteNumber)(p));
                    return [4 /*yield*/, submitManageTradingStopFromNumbers(stopParsed, p)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, [stopParsed, submitManageTradingStopFromNumbers]);
    var applyManageTradingStop = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, submitManageTradingStopFromNumbers(stopParsed, targetParsed)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, [submitManageTradingStopFromNumbers, stopParsed, targetParsed]);
    var applyAdjustRiskExchangeStop = (0, react_1.useCallback)(function (stopPrice) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, submitManageTradingStopFromNumbers(stopPrice, targetParsed)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, [submitManageTradingStopFromNumbers, targetParsed]);
    var moveStopToBreakeven = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var entry, leg, buf, beStop;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!isManageMode || market !== 'futures' || !exchangePositionForSymbol) {
                        flashTradeToast('Open a linear position to move stops.');
                        return [2 /*return*/];
                    }
                    entry = exchangePositionForSymbol.entryPrice;
                    leg = exchangePositionForSymbol.side;
                    if (!Number.isFinite(entry) || entry <= 0)
                        return [2 /*return*/];
                    buf = 0.00012;
                    beStop = leg === 'long' ? entry * (1 - buf) : entry * (1 + buf);
                    return [4 /*yield*/, submitManageTradingStopFromNumbers(beStop, targetParsed)];
                case 1:
                    _a.sent();
                    exitAuto.pushActivity({
                        kind: 'exit_state',
                        message: "Stop nudged toward breakeven (~".concat((0, formatQuote_1.formatQuoteNumber)(beStop), ")"),
                    });
                    return [2 /*return*/];
            }
        });
    }); }, [
        exchangePositionForSymbol,
        exitAuto,
        isManageMode,
        market,
        submitManageTradingStopFromNumbers,
        targetParsed,
    ]);
    var tightenStopManage = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var entry, leg, curSl, tightened;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!isManageMode || market !== 'futures' || !exchangePositionForSymbol) {
                        flashTradeToast('Open a linear position to tighten stops.');
                        return [2 /*return*/];
                    }
                    entry = exchangePositionForSymbol.entryPrice;
                    leg = exchangePositionForSymbol.side;
                    curSl = (_a = exchangePositionForSymbol.stopLossPrice) !== null && _a !== void 0 ? _a : stopParsed;
                    if (!Number.isFinite(entry) || entry <= 0 || !Number.isFinite(curSl) || curSl <= 0) {
                        flashTradeToast('Need a valid stop on file — set SL in the form or refresh Account.');
                        return [2 /*return*/];
                    }
                    tightened = leg === 'long' ? curSl + (entry - curSl) * 0.38 : curSl - (curSl - entry) * 0.38;
                    if (!Number.isFinite(tightened) || tightened <= 0)
                        return [2 /*return*/];
                    return [4 /*yield*/, submitManageTradingStopFromNumbers(tightened, targetParsed)];
                case 1:
                    _b.sent();
                    exitAuto.pushActivity({
                        kind: 'exit_state',
                        message: "Stop tightened toward entry (~".concat((0, formatQuote_1.formatQuoteNumber)(tightened), ")"),
                    });
                    return [2 /*return*/];
            }
        });
    }); }, [
        exchangePositionForSymbol,
        exitAuto,
        isManageMode,
        market,
        stopParsed,
        submitManageTradingStopFromNumbers,
        targetParsed,
    ]);
    var openManagePositionView = (0, react_1.useCallback)(function () {
        var pos = exchangePositionForSymbol;
        if (!pos || market !== 'futures')
            return;
        var mark = hasActiveTradePosition && Number.isFinite(throttledOpenPnl.mark) && throttledOpenPnl.mark > 0
            ? throttledOpenPnl.mark
            : live.lastPrice != null && live.lastPrice > 0
                ? live.lastPrice
                : Number.isFinite(mergedModel.lastPrice) && mergedModel.lastPrice > 0
                    ? mergedModel.lastPrice
                    : undefined;
        var q = (0, tradeNavigation_1.buildManageTradeQueryFromLinearPosition)(pos, {
            markPrice: mark,
            leverageFallback: effectiveFuturesLeverage,
        });
        navigate("/trade?".concat(q));
    }, [
        effectiveFuturesLeverage,
        exchangePositionForSymbol,
        hasActiveTradePosition,
        live.lastPrice,
        market,
        mergedModel.lastPrice,
        navigate,
        throttledOpenPnl.mark,
    ]);
    var onActivePartialClose = (0, react_1.useCallback)(function (fraction) {
        if (market === 'futures' && exchangePositionForSymbol) {
            void submitExchangeClose({ kind: 'linear', pos: exchangePositionForSymbol, fraction: fraction });
            return;
        }
        if (market === 'spot' && exchangeSpotFreeBaseQty != null && exchangeSpotFreeBaseQty > 0) {
            void submitExchangeClose({
                kind: 'spot',
                symbol: orderSymbol,
                freeBase: exchangeSpotFreeBaseQty,
                fraction: fraction,
            });
            return;
        }
        pendingManualPartialClosePctRef.current = null;
        flashTradeToast(bybitSnap
            ? 'No matching open position on the exchange for this symbol — check pair and sync.'
            : 'Connect Bybit in Account to manage positions.');
    }, [bybitSnap, exchangePositionForSymbol, exchangeSpotFreeBaseQty, flashTradeToast, market, orderSymbol, submitExchangeClose]);
    var partialScaleOutEligible = (0, react_1.useMemo)(function () {
        return useRealExecution &&
            ((market === 'futures' && exchangePositionForSymbol != null) ||
                (market === 'spot' && exchangeSpotFreeBaseQty != null && exchangeSpotFreeBaseQty > 0));
    }, [exchangePositionForSymbol, exchangeSpotFreeBaseQty, market, useRealExecution]);
    var onPartialPositionScaleOut = (0, react_1.useCallback)(function (fraction) {
        setDockPartialPct(Math.round(fraction * 100));
        onActivePartialClose(fraction);
    }, [onActivePartialClose]);
    var onExitAutomationSuggestStopMove = (0, react_1.useCallback)(function (suggestedStop) { return __awaiter(_this, void 0, void 0, function () {
        var applied;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(suggestedStop != null && Number.isFinite(suggestedStop) && suggestedStop > 0)) {
                        flashTradeToast('No valid stop suggestion right now — wait for live mark updates.');
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, submitManageTradingStopFromNumbers(suggestedStop, targetParsed)];
                case 1:
                    applied = _a.sent();
                    if (!applied) {
                        exitAuto.pushActivity({
                            kind: 'exit_state',
                            message: "Suggested stop move blocked (~".concat((0, formatQuote_1.formatQuoteNumber)(suggestedStop), ") \u2014 review toast for reason."),
                        });
                        return [2 /*return*/];
                    }
                    exitAuto.pushActivity({
                        kind: 'exit_state',
                        message: "Suggested stop move applied (~".concat((0, formatQuote_1.formatQuoteNumber)(suggestedStop), ")"),
                    });
                    return [2 /*return*/];
            }
        });
    }); }, [exitAuto, flashTradeToast, submitManageTradingStopFromNumbers, targetParsed]);
    var onExitAutomationSuggestPartialTp = (0, react_1.useCallback)(function () {
        setManagePartialFraction(0.25);
        setManagePartialSheetOpen(true);
        exitAuto.pushActivity({
            kind: 'exit_state',
            message: 'Suggested partial take-profit ready (25%) — confirm in the sheet to submit.',
        });
    }, [exitAuto]);
    var onExitAutomationDisable = (0, react_1.useCallback)(function () {
        exitAuto.setMode('manual');
        exitAuto.pushActivity({
            kind: 'mode_change',
            message: 'Exit automation disabled — switched to Manual',
        });
        flashTradeToast('Exit automation set to Manual.');
    }, [exitAuto, flashTradeToast]);
    var onActiveCloseAllConfirm = (0, react_1.useCallback)(function () {
        if (market === 'futures' && exchangePositionForSymbol) {
            void submitExchangeClose({ kind: 'linear', pos: exchangePositionForSymbol, fraction: 1 });
            return;
        }
        if (market === 'spot' && exchangeSpotFreeBaseQty != null && exchangeSpotFreeBaseQty > 0) {
            void submitExchangeClose({
                kind: 'spot',
                symbol: orderSymbol,
                freeBase: exchangeSpotFreeBaseQty,
                fraction: 1,
            });
            return;
        }
        flashTradeToast(bybitSnap
            ? 'No matching open position on the exchange for this pair.'
            : 'Connect Bybit in Account to manage positions.');
    }, [bybitSnap, exchangePositionForSymbol, exchangeSpotFreeBaseQty, flashTradeToast, market, orderSymbol, submitExchangeClose]);
    /** Exit AI Auto: submit reduce-only / spot sells when guidance crosses trim/exit (Protect Profit etc.), not log-only. */
    (0, react_1.useEffect)(function () {
        if (!exitFlow) {
            prevAutoStateRef.current = null;
            return;
        }
        if (exitAuto.mode !== 'auto') {
            prevAutoStateRef.current = null;
            return;
        }
        var curr = exitFlow.effective.state;
        var prev = prevAutoStateRef.current;
        var canAutoExit = (market === 'futures' && exchangePositionForSymbol != null) ||
            (market === 'spot' && exchangeSpotFreeBaseQty != null && exchangeSpotFreeBaseQty > 0);
        var blockedAdvancePrev = false;
        if (prev !== null && prev !== curr) {
            (0, globalAnnouncements_1.emitGlobalAnnouncement)({
                id: "auto-exit-decision-".concat(Date.now()),
                kind: 'ai_action',
                title: 'Auto Exit AI Decision',
                subtitle: "".concat(prev.toUpperCase(), " \u2192 ").concat(curr.toUpperCase(), " near $").concat((0, formatQuote_1.formatQuoteNumber)(exitFlow.lastPrice), " \u00B7 ").concat(exitFlow.nextPlanned),
            });
            var trimEdge = curr === 'trim' && prev === 'hold' && exitAuto.safeguards.allowPartialExits;
            var exitEdge = curr === 'exit' &&
                exitAuto.safeguards.allowFullAutoClose &&
                (prev === 'hold' || prev === 'trim');
            if (trimEdge || exitEdge) {
                if (orderPending) {
                    blockedAdvancePrev = true;
                }
                else if (useRealExecution && canAutoExit) {
                    if (trimEdge) {
                        exitAuto.pushActivity({
                            kind: 'auto_trim',
                            message: "Auto trim ~50% near $".concat((0, formatQuote_1.formatQuoteNumber)(exitFlow.lastPrice), " \u2014 submitting\u2026"),
                        });
                        onActivePartialClose(0.5);
                    }
                    else if (exitEdge) {
                        exitAuto.pushActivity({
                            kind: 'auto_close',
                            message: "Auto full exit near $".concat((0, formatQuote_1.formatQuoteNumber)(exitFlow.lastPrice), " \u2014 submitting\u2026"),
                        });
                        onActiveCloseAllConfirm();
                    }
                }
                else {
                    if (trimEdge) {
                        exitAuto.pushActivity({
                            kind: 'auto_trim',
                            message: useRealExecution
                                ? "Trim signal near $".concat((0, formatQuote_1.formatQuoteNumber)(exitFlow.lastPrice), " \u2014 no exchange position on this pair.")
                                : "Trim signal near $".concat((0, formatQuote_1.formatQuoteNumber)(exitFlow.lastPrice), " \u2014 connect Bybit in Account to auto-execute."),
                        });
                    }
                    else if (exitEdge) {
                        exitAuto.pushActivity({
                            kind: 'auto_close',
                            message: useRealExecution
                                ? "Exit signal near $".concat((0, formatQuote_1.formatQuoteNumber)(exitFlow.lastPrice), " \u2014 no exchange position on this pair.")
                                : "Exit signal near $".concat((0, formatQuote_1.formatQuoteNumber)(exitFlow.lastPrice), " \u2014 connect Bybit in Account to auto-execute."),
                        });
                    }
                }
            }
        }
        if (!blockedAdvancePrev) {
            prevAutoStateRef.current = curr;
        }
    }, [
        exitFlow,
        exitAuto.mode,
        exitAuto.safeguards.allowPartialExits,
        exitAuto.safeguards.allowFullAutoClose,
        exitAuto.pushActivity,
        exchangePositionForSymbol,
        exchangeSpotFreeBaseQty,
        market,
        onActiveCloseAllConfirm,
        onActivePartialClose,
        orderPending,
        useRealExecution,
    ]);
    var onClosePosition = (0, react_1.useCallback)(function () {
        onActiveCloseAllConfirm();
    }, [onActiveCloseAllConfirm]);
    var onAddToPosition = (0, react_1.useCallback)(function () {
        void executeTrade(side);
    }, [executeTrade, side]);
    var applyManageAllChanges = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var shouldApplySize, shouldApplyTpSl;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!isManageMode || market !== 'futures') {
                        flashTradeToast('Open a linear managed position to apply settings.');
                        return [2 /*return*/];
                    }
                    shouldApplySize = manageOrderDraftDirty && Number.isFinite(amountUsd) && amountUsd > 0;
                    shouldApplyTpSl = manageTpSlDirty;
                    if (!shouldApplySize && !shouldApplyTpSl) {
                        flashTradeToast('No pending manage changes to apply.');
                        return [2 /*return*/];
                    }
                    if (!shouldApplySize) return [3 /*break*/, 2];
                    return [4 /*yield*/, executeTrade(side)];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    if (!shouldApplyTpSl) return [3 /*break*/, 4];
                    return [4 /*yield*/, applyManageTradingStop()];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    setManageOrderDraftDirty(false);
                    return [2 /*return*/];
            }
        });
    }); }, [
        amountUsd,
        applyManageTradingStop,
        executeTrade,
        flashTradeToast,
        isManageMode,
        manageOrderDraftDirty,
        manageTpSlDirty,
        market,
        side,
    ]);
    var onReverseOrder = (0, react_1.useCallback)(function () {
        var _a, _b;
        var openLegSide = (_b = (_a = primaryChartOpenPosition === null || primaryChartOpenPosition === void 0 ? void 0 : primaryChartOpenPosition.side) !== null && _a !== void 0 ? _a : (isManageMode && manageCtx ? manageCtx.side : undefined)) !== null && _b !== void 0 ? _b : exchangePositionForSymbol === null || exchangePositionForSymbol === void 0 ? void 0 : exchangePositionForSymbol.side;
        if (openLegSide !== 'long' && openLegSide !== 'short') {
            flashTradeToast('No open leg to reverse — sync Account or reopen manage from Portfolio.');
            return;
        }
        var reverseSide = openLegSide === 'long' ? 'short' : 'long';
        void executeTrade(reverseSide, { manageIntent: 'reverse' });
    }, [
        executeTrade,
        exchangePositionForSymbol === null || exchangePositionForSymbol === void 0 ? void 0 : exchangePositionForSymbol.side,
        flashTradeToast,
        isManageMode,
        manageCtx,
        primaryChartOpenPosition === null || primaryChartOpenPosition === void 0 ? void 0 : primaryChartOpenPosition.side,
    ]);
    var chartPnlHeader = (0, react_1.useMemo)(function () {
        if (isManageMode && managePnlDisplay && hasManageOpenExposure) {
            var pnl = managePnlDisplay.pnlUsd;
            var pct = managePnlDisplay.pnlPct;
            if (!Number.isFinite(pnl) || !Number.isFinite(pct))
                return { label: undefined, tone: undefined };
            var sign = pnl >= 0 ? '+' : '−';
            var tone = pnl > 0 ? 'positive' : pnl < 0 ? 'negative' : 'neutral';
            return {
                label: "PnL ".concat(sign, "$").concat((0, formatQuote_1.formatQuoteNumber)(Math.abs(pnl)), " (").concat(sign).concat(Math.abs(pct).toFixed(2), "%)"),
                tone: tone,
            };
        }
        if (!isManageMode && hasActiveTradePosition && Number.isFinite(liveUnrealized.pnlUsd) && Number.isFinite(liveUnrealized.movePct)) {
            var pnl = liveUnrealized.pnlUsd;
            var pct = liveUnrealized.movePct;
            var sign = pnl >= 0 ? '+' : '−';
            var tone = pnl > 0 ? 'positive' : pnl < 0 ? 'negative' : 'neutral';
            return {
                label: "uPnL ".concat(sign, "$").concat((0, formatQuote_1.formatQuoteNumber)(Math.abs(pnl)), " (").concat(sign).concat(Math.abs(pct).toFixed(2), "%)"),
                tone: tone,
            };
        }
        return { label: undefined, tone: undefined };
    }, [
        hasActiveTradePosition,
        hasManageOpenExposure,
        isManageMode,
        liveUnrealized.movePct,
        liveUnrealized.pnlUsd,
        managePnlDisplay,
    ]);
    var manageDockChartHeaderMetrics = (0, react_1.useMemo)(function () {
        var badge = exitAuto.mode === 'manual'
            ? 'Static TP/SL'
            : (exitFlow === null || exitFlow === void 0 ? void 0 : exitFlow.effective.state) === 'trim'
                ? 'AI trim'
                : (exitFlow === null || exitFlow === void 0 ? void 0 : exitFlow.effective.state) === 'exit'
                    ? 'AI exit'
                    : 'AI exit';
        return __assign({ riskPercent: tradeDockStats.riskPercent, rewardPercent: tradeDockStats.rewardPercent, rrRatio: tradeDockStats.rrRatio, badge: badge }, (chartPnlHeader.label
            ? {
                secondaryLine: chartPnlHeader.label,
                secondaryLineTone: chartPnlHeader.tone,
            }
            : {}));
    }, [
        chartPnlHeader.label,
        chartPnlHeader.tone,
        exitAuto.mode,
        exitFlow === null || exitFlow === void 0 ? void 0 : exitFlow.effective.state,
        tradeDockStats.rewardPercent,
        tradeDockStats.riskPercent,
        tradeDockStats.rrRatio,
    ]);
    var manageChartProximity = (0, react_1.useMemo)(function () {
        if (!isManageMode)
            return null;
        var mark = mergedModel.lastPrice;
        var stop = chartModelForPlot.stop;
        var target = chartModelForPlot.target;
        if (Number.isFinite(mark) && mark > 0 && Number.isFinite(stop) && stop > 0) {
            if (Math.abs(mark - stop) / mark < 0.004)
                return 'stop';
        }
        if (Number.isFinite(mark) && mark > 0 && Number.isFinite(target) && target > 0) {
            if (Math.abs(mark - target) / mark < 0.004)
                return 'target';
        }
        return null;
    }, [chartModelForPlot.stop, chartModelForPlot.target, isManageMode, mergedModel.lastPrice]);
    var intervalLabel = chartInterval === 'D'
        ? '1D'
        : chartInterval === 'W'
            ? '1W'
            : chartInterval === '60'
                ? '1h'
                : chartInterval === '240'
                    ? '4h'
                    : chartInterval === '1'
                        ? '1m'
                        : "".concat(chartInterval, "m");
    var toggleChartDock = (0, react_1.useCallback)(function () {
        setChartDockChevronIdle(true);
        setChartDockOpen(function (o) {
            var next = !o;
            if (!next)
                setChartDockMaximized(false);
            return next;
        });
    }, []);
    var toggleChartDockMaximized = (0, react_1.useCallback)(function () {
        setChartDockChevronIdle(true);
        setChartDockOpen(true);
        setChartDockMaximized(function (v) { return !v; });
    }, []);
    var onPickTradePair = (0, react_1.useCallback)(function (s) {
        setTradePairMenuOpen(false);
        navigate("/trade?".concat((0, tradeNavigation_1.buildTradeQueryString)(s, { marketStatus: (0, marketScannerRows_1.deriveMarketStatus)(s) })));
    }, [navigate]);
    (0, react_1.useEffect)(function () {
        if (isManageMode) {
            setTradePairMenuOpen(false);
            setTradeHeaderMoreOpen(false);
        }
    }, [isManageMode]);
    (0, react_1.useEffect)(function () {
        if (!tradePairMenuOpen && !tradeHeaderMoreOpen)
            return;
        var onKey = function (e) {
            if (e.key === 'Escape') {
                setTradePairMenuOpen(false);
                setTradeHeaderMoreOpen(false);
            }
        };
        var onPointerDown = function (e) {
            var t = e.target;
            var pairEl = tradePairMenuRef.current;
            var moreEl = tradeHeaderMoreRef.current;
            if (tradePairMenuOpen && pairEl && !pairEl.contains(t))
                setTradePairMenuOpen(false);
            if (tradeHeaderMoreOpen && moreEl && !moreEl.contains(t))
                setTradeHeaderMoreOpen(false);
        };
        document.addEventListener('keydown', onKey);
        document.addEventListener('pointerdown', onPointerDown);
        return function () {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('pointerdown', onPointerDown);
        };
    }, [tradePairMenuOpen, tradeHeaderMoreOpen]);
    var tradeScrollRef = (0, react_1.useRef)(null);
    var paperPreviewRef = (0, react_1.useRef)(null);
    var scrollToPaperPreviewSection = (0, react_1.useCallback)(function () {
        window.requestAnimationFrame(function () {
            var _a;
            (_a = paperPreviewRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    }, []);
    var _46 = (0, react_1.useState)(false), paperRealAccountNudgeVisible = _46[0], setPaperRealAccountNudgeVisible = _46[1];
    var dismissPaperRealAccountNudge = (0, react_1.useCallback)(function () {
        try {
            sessionStorage.setItem(PAPER_REAL_ACCOUNT_NUDGE_DISMISS_KEY, '1');
        }
        catch (_a) {
            /* ignore */
        }
        setPaperRealAccountNudgeVisible(false);
    }, []);
    var onPaperPreviewInteraction = (0, react_1.useCallback)(function () {
        try {
            if (sessionStorage.getItem(PAPER_REAL_ACCOUNT_NUDGE_DISMISS_KEY) === '1')
                return;
        }
        catch (_a) {
            /* ignore */
        }
        setPaperRealAccountNudgeVisible(true);
    }, []);
    var _47 = (0, react_1.useState)(null), setupFocusBanner = _47[0], setSetupFocusBanner = _47[1];
    var onSetupFocusBannerCb = (0, react_1.useCallback)(function (label) {
        setSetupFocusBanner(label);
        window.setTimeout(function () { return setSetupFocusBanner(null); }, 4200);
    }, []);
    var focusTradeSetupOnChart = (0, react_1.useCallback)(function () {
        if (isManageMode) {
            setManageChartMaximized(true);
        }
        else {
            setChartDockOpen(true);
            setChartDockChevronIdle(true);
        }
        (0, chartSetupFocus_1.requestChartSetupFocus)({ pairFilter: mergedModel.pair });
    }, [isManageMode, mergedModel.pair]);
    return (<div className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-[#050505] text-white">
      {!isManageMode ? (<CloseAllPositionsModal_1.CloseAllPositionsModal open={closeAllModalOpen} exchangeExecution={useRealExecution} onCancel={function () { return setCloseAllModalOpen(false); }} onConfirm={function () {
                setCloseAllModalOpen(false);
                onActiveCloseAllConfirm();
            }}/>) : null}
      <ClosedPositionSummaryModal_1.ClosedPositionSummaryModal summary={closedPositionSummary} onDismiss={function () { return setClosedPositionSummary(null); }}/>
      {tradeToast ? (<div className="fixed left-1/2 z-[60] w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 transition-opacity duration-200" style={{ bottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))' }} role="status">
          <div className="rounded-xl border border-[#00ffc8]/35 bg-black/90 px-3 py-2.5 text-center text-sm font-semibold text-[#00ffc8] shadow-[0_12px_40px_-12px_rgba(0,255,200,0.22)] backdrop-blur-md">
            <p>{tradeToast}</p>
            {tradeToastCta ? (<>
                <button type="button" onClick={function () {
                    window.open(tradeToastCta.href, '_blank', 'noopener,noreferrer');
                }} className="mt-2 w-full rounded-lg border border-[#00ffc8]/45 bg-[#00ffc8]/10 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#8fffe5] transition hover:bg-[#00ffc8]/18">
                  {tradeToastCta.label}
                </button>
                {termsRetrySide ? (<button type="button" onClick={function () {
                        setTradeToast(null);
                        setTradeToastCta(null);
                        var retrySide = termsRetrySide;
                        setTermsRetrySide(null);
                        void executeTrade(retrySide);
                    }} className="mt-1.5 w-full rounded-lg border border-cyan-300/45 bg-cyan-500/10 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-cyan-100 transition hover:bg-cyan-500/18">
                    I accepted terms, retry now
                  </button>) : null}
              </>) : null}
          </div>
        </div>) : null}

      {setupFocusBanner ? (<div className="pointer-events-none fixed left-0 right-0 z-[55] flex justify-center px-4" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 3.75rem)' }} role="status">
          <p className="max-w-sm rounded-full border border-cyan-400/35 bg-black/90 px-4 py-2 text-center text-[11px] font-semibold text-cyan-100 shadow-lg backdrop-blur-md">
            {setupFocusBanner}
          </p>
        </div>) : null}

      <div className="sticky top-0 z-30 shrink-0 border-b border-[#00ffc8]/25 bg-black/60 backdrop-blur-md transition-[box-shadow] duration-300">
        <header className="mx-auto max-w-lg px-3 pb-1.5 pt-[max(0.35rem,env(safe-area-inset-top))]">
          <div className="flex items-center gap-2">
            {canGoBack ? (<button type="button" onClick={function () { return navigate(-1); }} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] text-sigflo-muted transition hover:text-white" aria-label="Back">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>) : null}
            {isManageMode ? (<>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-200/90">Managing position</p>
                  <p className="mt-0.5 truncate text-sm font-bold text-white">{mergedModel.pair}</p>
                </div>
                <button type="button" onClick={function () { return void onBiasAlertsControl(); }} className={"flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ".concat(!appAnnouncementsEnabled
                ? 'border-white/[0.1] text-sigflo-muted opacity-55 hover:opacity-90'
                : biasNotifyPermission === 'granted'
                    ? 'border-cyan-400/35 text-cyan-200/95 hover:text-cyan-100'
                    : 'border-white/[0.08] text-sigflo-muted hover:text-cyan-100/90')} title={!appAnnouncementsEnabled
                ? 'All Sigflo alerts off — tap to turn on'
                : biasNotifyPermission === 'granted'
                    ? 'All alerts on — tap to turn all off'
                    : biasNotifyPermission === 'denied'
                        ? 'Browser blocked OS alerts — tap to mute in-app banners too'
                        : 'Enable browser notifications or mute all alerts'} aria-label={!appAnnouncementsEnabled ? 'Turn on Sigflo alerts' : 'Sigflo alerts and notifications'}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                    <path d="M18 8A6 6 0 106 8c0 7-3 7-3 14h18c0-7-3-7-3-14" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </>) : (<>
                <div ref={tradePairMenuRef} className="relative flex min-w-0 flex-1 items-center gap-1">
                  <button type="button" id="trade-pair-menu-button" aria-expanded={tradePairMenuOpen} aria-haspopup="listbox" aria-controls="trade-pair-menu" onClick={function () {
                setTradeHeaderMoreOpen(false);
                setTradePairMenuOpen(function (o) { return !o; });
            }} className="flex min-w-0 flex-1 items-center gap-1 rounded-xl border border-transparent py-1 text-left transition hover:border-white/[0.06] hover:bg-white/[0.03]" aria-label="Choose trading pair">
                    <span className="truncate text-base font-bold tracking-tight text-white">{mergedModel.pair}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={"shrink-0 text-sigflo-muted transition-transform duration-200 ".concat(tradePairMenuOpen ? 'rotate-180' : '')} aria-hidden>
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {tradePairMenuOpen ? (<div id="trade-pair-menu" role="listbox" aria-labelledby="trade-pair-menu-button" className="absolute left-0 right-0 top-[calc(100%+4px)] z-[60] max-h-[min(18rem,calc(100dvh-7rem))] overflow-y-auto overscroll-y-contain rounded-xl border border-white/[0.12] bg-[#0a0a0a] py-1 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.85)] ring-1 ring-white/[0.06]">
                      {tradePairPickerSignals.map(function (s) {
                    var active = pairBaseToLinearSymbol(s.pair) === liveSymbol;
                    return (<button key={s.id} type="button" role="option" aria-selected={active} onClick={function () { return onPickTradePair(s); }} className={"flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-white/[0.06] active:bg-white/[0.08] ".concat(active ? 'bg-white/[0.05]' : '')}>
                            <span className="min-w-0 truncate font-semibold text-white">
                              {formatSignalPairForTicker(s.pair)}
                            </span>
                            <span className="shrink-0 tabular-nums text-[11px] font-medium text-sigflo-muted">
                              {s.setupScore}
                            </span>
                          </button>);
                })}
                    </div>) : null}
                </div>
                {isTriggered ? (<button type="button" onClick={function () { return navigate((0, appRoutes_1.getFeedRoute)()); }} className={"sigflo-trade-header-triggered flex max-w-[40%] shrink-0 flex-col items-end gap-0.5 rounded-lg py-0.5 pl-2 text-right text-[10px] font-semibold leading-tight transition hover:bg-white/[0.08] active:scale-[0.98] ".concat(uiStateStyle.text)} aria-label="Back to signals">
                    <span className="inline-flex items-center justify-end gap-1">
                      <LiveIndicator_1.LiveIndicator pulse={uiStateStyle.pulse} dotClassName={uiStateStyle.dot} size="md" pulseDurationSec={2.4}/>
                      <span className="truncate uppercase tracking-[0.11em] text-[#b2ffef]">
                        {(0, signalState_1.uiSignalStateLabel)(uiState)}
                      </span>
                      <span className="shrink-0 font-normal text-sigflo-muted">· {stateAgeLabel}</span>
                    </span>
                  </button>) : (<div className={"flex max-w-[40%] shrink-0 flex-col items-end gap-0.5 text-right text-[10px] font-semibold leading-tight ".concat(uiStateStyle.text)}>
                    <span className="inline-flex items-center justify-end gap-1">
                      <LiveIndicator_1.LiveIndicator pulse={uiStateStyle.pulse} dotClassName={uiStateStyle.dot} size="sm" pulseDurationSec={2.8}/>
                      <span className="truncate">{(0, signalState_1.uiSignalStateLabel)(uiState)}</span>
                    </span>
                    <span className="max-w-full truncate font-normal text-sigflo-muted">
                      {live.mode} · {live.connection}
                    </span>
                  </div>)}
                <button type="button" onClick={function () {
                var on = (0, tradePairFavorites_1.toggleTradePairFavorite)(tradePairFavoriteBase);
                setTradeFavRevision(function (v) { return v + 1; });
                flashTradeToast(on ? 'Saved to your watchlist' : 'Removed from watchlist');
            }} className={"flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ".concat(isPairInWatchlist
                ? 'border-amber-400/30 text-amber-300/95 hover:text-amber-200'
                : 'border-white/[0.08] text-sigflo-muted hover:text-amber-200/90')} aria-label={isPairInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'} aria-pressed={isPairInWatchlist}>
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M12 3l2.09 6.26H21l-5.45 3.96 2.09 6.26L12 15.77 6.36 19.48l2.09-6.26L3 9.26h6.91L12 3z" fill={isPairInWatchlist ? 'currentColor' : 'none'} strokeLinejoin="round"/>
                  </svg>
                </button>
                <div ref={tradeHeaderMoreRef} className="relative shrink-0">
                  <button type="button" id="trade-header-more-button" aria-expanded={tradeHeaderMoreOpen} aria-haspopup="menu" aria-controls="trade-header-more-menu" onClick={function () {
                setTradePairMenuOpen(false);
                setTradeHeaderMoreOpen(function (o) { return !o; });
            }} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] text-sigflo-muted transition hover:text-white" aria-label="More actions">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <circle cx="5" cy="12" r="1.5" fill="currentColor"/>
                      <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                      <circle cx="19" cy="12" r="1.5" fill="currentColor"/>
                    </svg>
                  </button>
                  {tradeHeaderMoreOpen ? (<div id="trade-header-more-menu" role="menu" aria-labelledby="trade-header-more-button" className="absolute right-0 top-[calc(100%+4px)] z-[60] min-w-[12.5rem] overflow-hidden rounded-xl border border-white/[0.12] bg-[#0a0a0a] py-1 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.85)] ring-1 ring-white/[0.06]">
                      <button type="button" role="menuitem" className="flex w-full px-3 py-2.5 text-left text-sm font-semibold text-white transition hover:bg-white/[0.06] active:bg-white/[0.08]" onClick={function () {
                    setTradeHeaderMoreOpen(false);
                    navigate('/markets');
                }}>
                        Markets
                      </button>
                      <button type="button" role="menuitem" className="flex w-full px-3 py-2.5 text-left text-sm font-semibold text-white transition hover:bg-white/[0.06] active:bg-white/[0.08]" onClick={function () {
                    setTradeHeaderMoreOpen(false);
                    navigate((0, appRoutes_1.getFeedRoute)());
                }}>
                        Signals
                      </button>
                      <button type="button" role="menuitem" className="flex w-full px-3 py-2.5 text-left text-sm font-semibold text-white transition hover:bg-white/[0.06] active:bg-white/[0.08]" onClick={function () {
                    setTradeHeaderMoreOpen(false);
                    navigate('/bots');
                }}>
                        Bots
                      </button>
                      <button type="button" role="menuitem" className="flex w-full px-3 py-2.5 text-left text-sm font-semibold text-white transition hover:bg-white/[0.06] active:bg-white/[0.08]" onClick={function () {
                    setTradeHeaderMoreOpen(false);
                    navigate('/portfolio');
                }}>
                        Portfolio
                      </button>
                      <button type="button" role="menuitem" className="flex w-full px-3 py-2.5 text-left text-sm font-semibold text-white transition hover:bg-white/[0.06] active:bg-white/[0.08]" onClick={function () {
                    setTradeHeaderMoreOpen(false);
                    navigate('/profile');
                }}>
                        Profile
                      </button>
                      <div className="my-1 h-px bg-white/[0.08]"/>
                      <button type="button" role="menuitem" className="flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left text-sm font-semibold text-white transition hover:bg-white/[0.06] active:bg-white/[0.08]" onClick={function () {
                    setTradeHeaderMoreOpen(false);
                    void onBiasAlertsControl();
                }}>
                        <span>
                          {!appAnnouncementsEnabled
                    ? 'Turn all alerts on'
                    : biasNotifyPermission === 'unsupported'
                        ? 'Turn all alerts off (in-app only)'
                        : biasNotifyPermission === 'denied'
                            ? 'Turn all alerts off (browser blocked OS)'
                            : biasNotifyPermission === 'granted'
                                ? 'Turn all alerts off'
                                : 'Enable browser notifications…'}
                        </span>
                        {appAnnouncementsEnabled && biasNotifyPermission === 'default' ? (<span className="text-[10px] font-medium leading-snug text-sigflo-muted">
                            Chart pair only (tab) · off = no banners, haptics, or OS pings
                          </span>) : appAnnouncementsEnabled && biasNotifyPermission === 'granted' ? (<span className="text-[10px] font-medium leading-snug text-sigflo-muted">
                            Tap to silence everything from Sigflo
                          </span>) : null}
                      </button>
                      <button type="button" role="menuitem" className="flex w-full px-3 py-2.5 text-left text-sm font-semibold text-white transition hover:bg-white/[0.06] active:bg-white/[0.08]" onClick={function () {
                    setTradeHeaderMoreOpen(false);
                    void copyTradeLink().then(function (ok) { return flashTradeToast(ok ? 'Link copied' : 'Could not copy link'); });
                }}>
                        Copy trade link
                      </button>
                    </div>) : null}
                </div>
              </>)}
          </div>
        </header>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {isManageMode ? (<div className="shrink-0 border-b border-emerald-400/40 bg-landing-bg pt-2 shadow-[0_8px_28px_-8px_rgba(0,0,0,0.45)]">
            <div className="mx-auto w-full min-w-0 max-w-lg px-1.5">
              {/* Manage chart: boolean setupMode + live preset so PriceChartCard syncs overlays (undefined = uncontrolled, levels stuck off). */}
              <TradeChartPanel_1.TradeChartPanel collapsed={false} plotExpandedPx={manageChartMaximized ? tradeChartHeights_1.TRADE_CHART_PLOT_MANAGE_MAXIMIZED_PX : tradeChartHeights_1.TRADE_CHART_PLOT_EXPANDED_PX} timeScaleMaxBarSpacingPx={tradeChartHeights_1.CHART_TIMESCALE_MAX_BAR_SPACING_PX} model={chartModelForPlot} market={market} intervalLabel={intervalLabel} loadingInterval={live.loadingInterval} liveUpdatedAt={live.lastUpdateTs} change24hPct={mergedModel.change24hPct} timeframeOptions={TRADE_CHART_INTERVAL_OPTIONS} chartInterval={chartInterval} onChartIntervalChange={function (v) {
                setChartInterval(v);
                window.localStorage.setItem(tradeChartIntervalPreference_1.TRADE_CHART_INTERVAL_STORAGE_KEY, v);
                window.dispatchEvent(new CustomEvent(tradeChartIntervalPreference_1.SIGFLO_CHART_INTERVAL_EVENT, { detail: v }));
            }} exchangeStyleHero={false} heroPairLabel={mergedModel.pair} metaCaption={exitAuto.mode === 'manual'
                ? 'PERP · Static SL/TP'
                : 'PERP · AI exit · dynamic trim when guided'} setupMode onSetupModeToggle={undefined} onRequestSetupMode={undefined} tradeTimingState={undefined} liveTradeMode suppressExchangeHeroLivePrice liveActivePositionTitle="Live position" liveTradeOverlayPreset auxiliaryPriceLines={manageAiChartAux} liveHeaderMetrics={manageDockChartHeaderMetrics} liveTradeRefitKey={manageCtx
                ? "".concat(mergedModel.pair, "|manage|").concat(manageCtx.entryPrice, "|").concat(manageCtx.side, "|").concat(chartInterval)
                : undefined} chartProximity={manageChartProximity} pnlHeaderLabel={chartPnlHeader.label} pnlHeaderTone={chartPnlHeader.tone} chartInnerChromeToggle={{
                expanded: manageChartMaximized,
                onToggle: function () { return setManageChartMaximized(function (v) { return !v; }); },
                variant: 'immersive',
            }} onSetupFocusBanner={onSetupFocusBannerCb} className="pb-2"/>
            </div>
          </div>) : null}
        <div ref={tradeScrollRef} className={"trade-scroll flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain ".concat(hasActiveTradePosition ? 'gap-0' : 'gap-1')}>
        <div className={"mx-auto flex w-full max-w-lg flex-col px-3 pb-0 ".concat(hasActiveTradePosition ? 'gap-0 pt-1.5' : 'gap-1 pt-2')}>
          <div className="flex flex-col gap-1">
            {!isManageMode && !isBotsReviewCockpit ? <MarketToggle_1.MarketToggle value={market} onChange={setMarket}/> : null}
            {!isManageMode && hideFreshSetupTradeHint && hasActiveTradePosition ? (<p className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 text-[9px] leading-snug text-zinc-400">
                Review position · Managing exits · Suggestion only · Live changes require confirmation
              </p>) : null}
            {!isManageMode ? (<ActivePositionsPanel_1.ActivePositionsPanel market={market} exchangePosition={exchangePositionForSymbol} exchangeSpotDisplay={exchangeSpotPanelModel} displayPair={mergedModel.pair} leverageFallback={leverage} markPrice={hasActiveTradePosition && Number.isFinite(throttledOpenPnl.mark) && throttledOpenPnl.mark > 0
                ? throttledOpenPnl.mark
                : Number.isFinite(mergedModel.lastPrice) && mergedModel.lastPrice > 0
                    ? mergedModel.lastPrice
                    : (_e = (_d = exchangePositionForSymbol === null || exchangePositionForSymbol === void 0 ? void 0 : exchangePositionForSymbol.entryPrice) !== null && _d !== void 0 ? _d : exchangeSpotPanelModel === null || exchangeSpotPanelModel === void 0 ? void 0 : exchangeSpotPanelModel.entryPrice) !== null && _e !== void 0 ? _e : 0} onRequestCloseAllModal={function () { return setCloseAllModalOpen(true); }} onOpenManagePosition={market === 'futures' && exchangePositionForSymbol ? openManagePositionView : undefined} exitAiModeLabel={exitAiModeLabel} exitStrategyLabel={exitStrategyLabel} scenarioSummary={scenarioSummaryLine} sigfloManagedLayer={sigfloManagedLayer} liveMarkForLayer={hasActiveTradePosition && Number.isFinite(throttledOpenPnl.mark) && throttledOpenPnl.mark > 0
                ? throttledOpenPnl.mark
                : null} onSuggestStopMove={onExitAutomationSuggestStopMove} onSuggestPartialTp={onExitAutomationSuggestPartialTp} onDisableAutomation={onExitAutomationDisable}/>) : null}
            {!isManageMode && !isBotsReviewCockpit && !hideFreshSetupTradeHint ? <TradingControlTradeHint_1.TradingControlTradeHint /> : null}
            {!isManageMode && isBotsReviewCockpit && botsReviewCockpitModel ? (<div className="space-y-3 pb-1">
                <DailyRiskGuardBanner_1.DailyRiskGuardBanner model={dailyRiskGuard}/>
                <p className="text-[10px] leading-snug text-zinc-500">
                  Engine review output for decision support. Not live exchange data. Outcomes are not guaranteed.
                </p>
                <TradeReviewHeader_1.TradeReviewHeader pair={botsReviewCockpitModel.pair} direction={botsReviewCockpitModel.direction} setupType={botsReviewCockpitModel.setupType} score={botsReviewCockpitModel.score} state={botsReviewCockpitModel.state} sourceEngine={botsReviewCockpitModel.sourceEngine}/>
                {botsEnginePlanLevels ? (<div className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[10px] leading-snug text-zinc-500">
                        {dailyReviewLocked
                    ? 'Plan levels are read-only while the daily risk guard is active.'
                    : 'Drag stop or targets to adjust your plan'}
                      </p>
                      {botsPlanDirty && !dailyReviewLocked ? (<button type="button" onClick={resetBotsPlanToEngine} className="shrink-0 rounded-md border border-white/12 bg-white/[0.04] px-2 py-1 text-[10px] font-medium text-zinc-300 transition hover:border-[#00ffc8]/30 hover:text-zinc-100">
                          Reset to engine plan
                        </button>) : null}
                    </div>
                    <TradeMiniChart_1.TradeMiniChart pair={botsEnginePlanLevels.pair} direction={botsEnginePlanLevels.direction} entryPrice={botsEnginePlanLevels.entryPrice} stopPrice={botsPlannedStop !== null && botsPlannedStop !== void 0 ? botsPlannedStop : botsEnginePlanLevels.stopPrice} targets={botsPlannedTargets !== null && botsPlannedTargets !== void 0 ? botsPlannedTargets : botsEnginePlanLevels.targets} interactiveLevels={!dailyReviewLocked} onPlannedStopChange={setBotsPlannedStop} onPlannedTargetsChange={setBotsPlannedTargets} onLevelsDragEnd={bumpBotsPaperPreviewPulse} planGeometryWarning={Boolean(botsPaperPreviewModel && !botsPaperPreviewModel.previewEnabled)} liquidationPrice={market === 'futures' &&
                    Number.isFinite(metrics.liquidation) &&
                    metrics.liquidation > 0
                    ? metrics.liquidation
                    : undefined}/>
                  </div>) : null}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-sm">
                  <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Market context</h2>
                  <p className="mt-1 text-[11px] leading-snug text-zinc-500">Spot / Perps / Paper</p>
                  <div className="mt-2">
                    <MarketToggle_1.MarketToggle value={market} onChange={setMarket} disabled={dailyReviewLocked}/>
                  </div>
                </div>
                {(botsReviewContext === null || botsReviewContext === void 0 ? void 0 : botsReviewContext.opportunityId) && botsTradeOppLoading ? (<div className="space-y-2" aria-busy="true" aria-label="Loading review">
                    <p className="text-xs text-zinc-500">Loading setup context…</p>
                    <div className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]"/>
                    <div className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]"/>
                  </div>) : (<>
                    <SetupThesisCard_1.SetupThesisCard thesis={botsReviewCockpitModel.thesis} rationale={botsReviewCockpitModel.rationale} timeframeAlignment={botsReviewCockpitModel.timeframeAlignment}/>
                    <EntryPlanCard_1.EntryPlanCard direction={botsReviewCockpitModel.direction} entryZone={botsReviewCockpitModel.entryZone} invalidation={botsReviewCockpitModel.invalidation} targets={botsReviewCockpitModel.targets}/>
                    <RiskReviewCard_1.RiskReviewCard score={botsReviewCockpitModel.score} riskLabel={botsReviewCockpitModel.riskLabel} state={botsReviewCockpitModel.state} userRiskMode={riskSettings.riskMode} maxRiskPerTradePct={riskSettings.maxRiskPerTradePct} maxOpenPositions={riskSettings.maxOpenPositions} allowLiveExecution={riskSettings.allowLiveExecution} reviewOnlyFromBotsPath={liveExecutionLocked} requireConfirmation={riskSettings.requireConfirmation} monitoredOpenCount={riskMonitoredOpenCount}/>
                    {hasActiveTradePosition ? (<div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-sm">
                        <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Exit automation</h2>
                        <p className="mt-1 text-xs font-medium text-zinc-300">Manage active position</p>
                        <p className="mt-2 text-[11px] leading-snug text-zinc-500">
                          Shown only while this pair has an open position on your account. Entry from this Bots review
                          stays locked; these controls adjust how Sigflo can assist with the position you already hold.
                        </p>
                        <ul className="mt-2 space-y-1 text-[11px] text-zinc-500">
                          <li className="flex gap-2">
                            <span className="text-[#00ffc8]/80" aria-hidden>
                              ·
                            </span>
                            <span>Suggest stop move</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="text-[#00ffc8]/80" aria-hidden>
                              ·
                            </span>
                            <span>Suggest partial take-profit</span>
                          </li>
                        </ul>
                        <div className="mt-3">
                          <ExitModePanel_1.ExitModePanel live={Boolean(hasActiveTradePosition)} showLiveBanner={false}>
                            <ExitAutomationControls_1.ExitAutomationControls mode={exitAuto.mode} onModeChange={exitAuto.setMode} strategy={exitAuto.strategy} onStrategyChange={exitAuto.setStrategy} safeguards={exitAuto.safeguards} onSafeguardsChange={exitAuto.setSafeguards} customStrategyThresholds={exitAuto.customStrategyThresholds} onCustomStrategyThresholdsMerge={exitAuto.mergeCustomStrategyThresholds} onResetCustomStrategyThresholds={exitAuto.resetCustomStrategyThresholds} activity={exitAuto.activity} onClearActivity={exitAuto.clearActivity} compactActivity hasOpenPosition={hasActiveTradePosition} exitFlowState={(_f = exitFlow === null || exitFlow === void 0 ? void 0 : exitFlow.effective.state) !== null && _f !== void 0 ? _f : null} exitFlowNextPlanned={(_g = exitFlow === null || exitFlow === void 0 ? void 0 : exitFlow.nextPlanned) !== null && _g !== void 0 ? _g : null}/>
                            {serverExitEligible ? (<div className="mt-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2.5">
                                <label className="flex cursor-pointer items-start gap-2.5">
                                  <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-black/40 text-cyan-500 focus:ring-cyan-500/30" checked={serverExitOvernightEnabled} disabled={!serverExitOvernightHydrated} onChange={function (e) {
                            var _a;
                            var on = e.target.checked;
                            if (!on && exchangePositionForSymbol) {
                                void (0, tradeClient_1.deleteExitAutomationWatch)({
                                    symbol: orderSymbol,
                                    side: exchangePositionForSymbol.side,
                                    positionIdx: (_a = exchangePositionForSymbol.positionIdx) !== null && _a !== void 0 ? _a : 0,
                                }).catch(function () { });
                            }
                            setServerExitOvernightEnabled(on);
                        }}/>
                                  <span className="text-[11px] leading-snug text-sigflo-muted">
                                    <span className="font-semibold text-sigflo-text/90">Server overnight automation</span>
                                    {' — '}
                                    Runs Exit AI Auto on the Sigflo API while this device is off or asleep. Requires a
                                    hosted backend with Postgres, migration 002, and env{' '}
                                    <span className="font-mono text-[10px] text-cyan-200/85">
                                      EXIT_AUTOMATION_WORKER_ENABLED=true
                                    </span>
                                    . If you keep this trade tab open with Auto on, leave this off to avoid duplicate
                                    orders.
                                  </span>
                                </label>
                              </div>) : null}
                          </ExitModePanel_1.ExitModePanel>
                          <TradingControlExitBridge_1.TradingControlExitBridge />
                        </div>
                      </div>) : null}
                    <ExecutionLockCard_1.ExecutionLockCard state={botsReviewCockpitModel.state} source="bots" onPaperPreview={scrollToPaperPreviewSection} allowLiveExecution={riskSettings.allowLiveExecution} reviewOnlyFromBotsPath={liveExecutionLocked} requireConfirmation={riskSettings.requireConfirmation} paperModeDefault={riskSettings.paperModeDefault} maxOpenPositionsReached={maxOpenPositionsReached}/>
                    {botsPaperPreviewModel ? (<div ref={paperPreviewRef} id="sigflo-paper-trade-preview">
                        <PaperTradePreview_1.PaperTradePreview key={(_h = botsReviewContext === null || botsReviewContext === void 0 ? void 0 : botsReviewContext.opportunityId) !== null && _h !== void 0 ? _h : 'paper-preview'} entryPrice={botsPaperPreviewModel.entryPrice} stopPrice={botsPaperPreviewModel.stopPrice} targets={botsPaperPreviewModel.targets} direction={botsPaperPreviewModel.direction} previewEnabled={botsPaperPreviewModel.previewEnabled} previewDisabledReason={botsPaperPreviewModel.previewDisabledReason} highlightPulseToken={botsPaperPulseToken} maxRiskPerTradePct={riskSettings.maxRiskPerTradePct} onInteraction={onPaperPreviewInteraction}/>
                      </div>) : null}
                    {isBotsReviewCockpit && botsPaperPreviewModel && paperRealAccountNudgeVisible ? (<div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 backdrop-blur-sm">
                        <p className="text-sm font-medium text-zinc-200">Ready to try this on your real account?</p>
                        <p className="mt-1 text-[11px] leading-snug text-zinc-500">
                          Linking is optional. You can keep using paper-style review until you are ready.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button type="button" onClick={function () {
                        dismissPaperRealAccountNudge();
                        var returnTo = "".concat(location.pathname).concat(location.search);
                        navigate("/settings/exchange?returnTo=".concat(encodeURIComponent(returnTo)));
                    }} className="rounded-lg border border-[#00ffc8]/35 bg-[#00ffc8]/10 px-3 py-2 text-xs font-semibold text-[#00ffc8] transition hover:bg-[#00ffc8]/15">
                            Connect exchange
                          </button>
                          <button type="button" onClick={dismissPaperRealAccountNudge} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-zinc-400 transition hover:bg-white/[0.04]">
                            Not now
                          </button>
                        </div>
                      </div>) : null}
                    <TradeReasoningTimeline_1.TradeReasoningTimeline items={botsReviewCockpitModel.timelineItems}/>
                  </>)}
              </div>) : null}
            {!isManageMode && !isBotsReviewCockpit ? (<ScannerInsightCard_1.ScannerInsightCard signal={selectedSignal} status={scannerStatus} tradeScore={metrics.riskSummary.tradeScore} groundedContext={tradeAiScannerGroundedContext} hasOpenPosition={hasActiveTradePosition} executionQuality={executionQuality}/>) : null}
            {!isManageMode && !isBotsReviewCockpit ? (<TradeChartScenarioStrip_1.TradeChartScenarioStrip mode="trade" side={(_j = primaryChartOpenPosition === null || primaryChartOpenPosition === void 0 ? void 0 : primaryChartOpenPosition.side) !== null && _j !== void 0 ? _j : side} estimatedPnlUsd={liveUnrealized.pnlUsd} estimatedPnlPct={liveUnrealized.movePct} targetProfitUsd={metrics.targetProfitUsd} stopLossUsd={metrics.stopLossUsd} riskReward={mergedModel.riskReward} probUp={scenarioProb.probUp} probDown={scenarioProb.probDown} marginUsd={(_k = primaryChartOpenPosition === null || primaryChartOpenPosition === void 0 ? void 0 : primaryChartOpenPosition.marginUsd) !== null && _k !== void 0 ? _k : metrics.amountUsedUsd} estFeeUsd={estFeeUsd} liqPrice={market === 'futures'
                ? ((_l = primaryChartOpenPosition === null || primaryChartOpenPosition === void 0 ? void 0 : primaryChartOpenPosition.liquidationPrice) !== null && _l !== void 0 ? _l : metrics.liquidation)
                : null} entry={(_m = primaryChartOpenPosition === null || primaryChartOpenPosition === void 0 ? void 0 : primaryChartOpenPosition.entryPrice) !== null && _m !== void 0 ? _m : modelForMetrics.entry} stop={modelForMetrics.stop} target={modelForMetrics.target} positionSizeUsd={(_o = primaryChartOpenPosition === null || primaryChartOpenPosition === void 0 ? void 0 : primaryChartOpenPosition.positionNotionalUsd) !== null && _o !== void 0 ? _o : metrics.positionSizeUsd} leverage={(_p = primaryChartOpenPosition === null || primaryChartOpenPosition === void 0 ? void 0 : primaryChartOpenPosition.leverage) !== null && _p !== void 0 ? _p : leverage} isFutures={market === 'futures'} tradeScore={metrics.riskSummary.tradeScore} setupScore={selectedSignal.setupScore} trendAlignment={selectedSignal.scoreBreakdown.trendAlignment} momentumQuality={selectedSignal.scoreBreakdown.momentumQuality} exitAiMode={exitAuto.mode} exitStrategyPreset={exitAuto.strategy} automationSafeguards={exitAuto.safeguards} customStrategyThresholds={exitAuto.customStrategyThresholds} scannerStatus={scannerStatus} lastPrice={typeof mergedModel.lastPrice === 'number' && Number.isFinite(mergedModel.lastPrice)
                ? mergedModel.lastPrice
                : modelForMetrics.entry} hasOpenPosition={hasActiveTradePosition} executionQuality={executionQuality}/>) : null}
          </div>
          {isManageMode && managePnlDisplay && manageCtx && hasManageOpenExposure ? (<ManagePositionControlPanel_1.ManagePositionControlPanel manageCtx={manageCtx} pnlUsd={managePnlDisplay.pnlUsd} pnlPct={managePnlDisplay.pnlPct} mark={typeof markForManage === 'number' && Number.isFinite(markForManage) ? markForManage : mergedModel.entry} leverageLabel={market === 'futures' ? "".concat(manageLeverageForUi !== null && manageLeverageForUi !== void 0 ? manageLeverageForUi : leverage, "\u00D7") : '1× spot'} isFutures={market === 'futures'} exchangeLegSide={market === 'futures' ? (_q = exchangePositionForSymbol === null || exchangePositionForSymbol === void 0 ? void 0 : exchangePositionForSymbol.side) !== null && _q !== void 0 ? _q : null : null} health={managePositionHealth} positionBias={managePositionBiasStat} exitAiModel={manageExitAiCoPilot} exitMode={exitAuto.mode} onExitModeChange={exitAuto.setMode} onCloseFull={onActiveCloseAllConfirm} onPartialOpen={function () { return setManagePartialSheetOpen(true); }} onMoveStopBreakeven={function () { return void moveStopToBreakeven(); }} onTightenStop={function () { return void tightenStopManage(); }} onAddToPosition={function () { return void onAddToPosition(); }} onReversePosition={market === 'futures' ? onReverseOrder : undefined} onAdjustRisk={adjustRiskSnapshot ? function () { return setAdjustRiskOpen(true); } : undefined} onViewSetupOnChart={focusTradeSetupOnChart} timeline={manageTimelineLines} actionsDisabled={!!orderPending} canMoveStops={Boolean(useRealExecution && exchangePositionForSymbol)}/>) : null}
          <div className="flex flex-col gap-1">
            {showAssistedExitConfirmBar && exitFlow ? (<AssistedExitConfirmBar_1.AssistedExitConfirmBar headline={exitFlow.effective.headline} detail={exitFlow.effective.action} onConfirm={function () {
                if (orderPending) {
                    flashTradeToast('Wait for the in-flight order to finish, then try again.');
                    return;
                }
                var st = exitFlow.effective.state;
                setAssistedExitAcknowledged(true);
                setAssistedExitBarForceHidden(false);
                if (st === 'trim') {
                    exitAuto.pushActivity({
                        kind: 'assisted_ready',
                        message: "Assisted trim ~50% near $".concat((0, formatQuote_1.formatQuoteNumber)(exitFlow.lastPrice), " \u2014 submitting\u2026"),
                    });
                    onActivePartialClose(0.5);
                    return;
                }
                if (st === 'exit') {
                    exitAuto.pushActivity({
                        kind: 'assisted_ready',
                        message: "Assisted full exit near $".concat((0, formatQuote_1.formatQuoteNumber)(exitFlow.lastPrice), " \u2014 submitting\u2026"),
                    });
                    onActiveCloseAllConfirm();
                }
            }} onDismiss={function () {
                setAssistedExitAcknowledged(false);
                setAssistedExitBarForceHidden(false);
                exitAuto.pushActivity({
                    kind: 'mode_change',
                    message: 'Switched to Manual — dismissed prepared exit prompt',
                });
                exitAuto.setMode('manual');
            }}/>) : null}
            {!isBotsReviewCockpit ? (<>
                <ExitModePanel_1.ExitModePanel live={Boolean(hasActiveTradePosition) || isManageMode}>
                  <ExitAutomationControls_1.ExitAutomationControls mode={exitAuto.mode} onModeChange={exitAuto.setMode} strategy={exitAuto.strategy} onStrategyChange={exitAuto.setStrategy} safeguards={exitAuto.safeguards} onSafeguardsChange={exitAuto.setSafeguards} customStrategyThresholds={exitAuto.customStrategyThresholds} onCustomStrategyThresholdsMerge={exitAuto.mergeCustomStrategyThresholds} onResetCustomStrategyThresholds={exitAuto.resetCustomStrategyThresholds} activity={exitAuto.activity} onClearActivity={exitAuto.clearActivity} compactActivity={!isManageMode} hasOpenPosition={hasActiveTradePosition || isManageMode} exitFlowState={(_r = exitFlow === null || exitFlow === void 0 ? void 0 : exitFlow.effective.state) !== null && _r !== void 0 ? _r : null} exitFlowNextPlanned={(_s = exitFlow === null || exitFlow === void 0 ? void 0 : exitFlow.nextPlanned) !== null && _s !== void 0 ? _s : null}/>
                  {serverExitEligible ? (<div className="mt-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2.5">
                      <label className="flex cursor-pointer items-start gap-2.5">
                        <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-black/40 text-cyan-500 focus:ring-cyan-500/30" checked={serverExitOvernightEnabled} disabled={!serverExitOvernightHydrated} onChange={function (e) {
                    var _a;
                    var on = e.target.checked;
                    if (!on && exchangePositionForSymbol) {
                        void (0, tradeClient_1.deleteExitAutomationWatch)({
                            symbol: orderSymbol,
                            side: exchangePositionForSymbol.side,
                            positionIdx: (_a = exchangePositionForSymbol.positionIdx) !== null && _a !== void 0 ? _a : 0,
                        }).catch(function () { });
                    }
                    setServerExitOvernightEnabled(on);
                }}/>
                        <span className="text-[11px] leading-snug text-sigflo-muted">
                          <span className="font-semibold text-sigflo-text/90">Server overnight automation</span>
                          {' — '}
                          Runs Exit AI Auto on the Sigflo API while this device is off or asleep. Requires a hosted
                          backend with Postgres, migration 002, and env{' '}
                          <span className="font-mono text-[10px] text-cyan-200/85">EXIT_AUTOMATION_WORKER_ENABLED=true</span>.
                          If you keep this trade tab open with Auto on, leave this off to avoid duplicate orders.
                        </span>
                      </label>
                    </div>) : null}
                </ExitModePanel_1.ExitModePanel>
                <TradingControlExitBridge_1.TradingControlExitBridge />
              </>) : null}
          </div>
        </div>

        {!isBotsReviewCockpit ? (<TradeControls_1.TradeControls manageDataInvalid={manageDataInvalid} ticketIntent={ticketIntent} market={market} quoteMarkPrice={market === 'futures' ? live.markPrice : undefined} quoteIndexPrice={market === 'futures' ? live.indexPrice : undefined} futuresTpSlTriggerBy={futuresTpSlTriggerBy} onFuturesTpSlTriggerByChange={setFuturesTpSlTriggerBy} slTpPercentEntryAnchor={slTpPercentEntryAnchor} mergedModel={mergedModel} isManageMode={isManageMode} manageCtx={manageCtx} managePnlDisplay={managePnlDisplay} markForManage={markForManage} manageInsightLine={manageInsightLine} amountUsd={amountUsd} leverage={leverage} managePositionLeverage={isManageMode ? manageLeverageForUi : undefined} maxLeverage={market === 'futures' ? futuresLevCap : null} side={side} stopStr={stopStr} targetStr={targetStr} onAmountChange={onAmountUsdChange} onLeverageChange={onLeverageChange} onStopStrChange={onStopStrForTrade} onTargetStrChange={onTargetStrForTrade} metrics={metrics} estFeeUsd={estFeeUsd} balanceLabel={(tradeBalance === null || tradeBalance === void 0 ? void 0 : tradeBalance.availableToTrade) != null
                ? 'Available (UTA)'
                : (tradeBalance === null || tradeBalance === void 0 ? void 0 : tradeBalance.totalWalletBalance) != null
                    ? 'UTA wallet balance'
                    : 'Wallet Balance'} balanceHelper={tradeBalanceHelper} displayBalanceUsd={displayBalanceUsd} fundingBalanceUsd={tradeBalance === null || tradeBalance === void 0 ? void 0 : tradeBalance.fundingWalletBalance} fundingBalanceAsset={tradeBalance === null || tradeBalance === void 0 ? void 0 : tradeBalance.fundingPrimaryAsset} minOrderUsd={minOrderUsd} orderSymbol={orderSymbol} utaMarginInUseUsd={tradeBalance === null || tradeBalance === void 0 ? void 0 : tradeBalance.marginInUseUsd} utaEquityUsd={tradeBalance === null || tradeBalance === void 0 ? void 0 : tradeBalance.totalEquity} utaUnrealizedPnlUsd={tradeBalance === null || tradeBalance === void 0 ? void 0 : tradeBalance.utaUnrealizedPnl} utaWalletBalanceUsd={tradeBalance === null || tradeBalance === void 0 ? void 0 : tradeBalance.totalWalletBalance} assetTransferHref={assetTransferHref} onClosePosition={onClosePosition} onAddToPosition={onAddToPosition} manageFuturesTpSl={isManageMode && market === 'futures'
                ? {
                    canApply: Boolean(useRealExecution && exchangePositionForSymbol),
                    pending: orderPending === 'tpsl',
                    onApply: applyManageTradingStop,
                    canApplyAll: Boolean(useRealExecution &&
                        exchangePositionForSymbol &&
                        (manageTpSlDirty || (manageOrderDraftDirty && amountUsd > 0))),
                    onApplyAll: applyManageAllChanges,
                    hasPendingChanges: manageTpSlDirty || (manageOrderDraftDirty && amountUsd > 0),
                }
                : null} suppressLegacyManageHero={isManageMode && Boolean(managePnlDisplay && manageCtx)} onPartialPositionScaleOut={partialScaleOutEligible ? onPartialPositionScaleOut : undefined} partialPositionScaleOutBusy={!!orderPending}/>) : null}
      </div>
      </div>

      {!isManageMode ? (<div className={"sticky bottom-0 z-30 shrink-0 bg-black/[0.92] backdrop-blur-xl ".concat(hasActiveTradePosition
                ? 'border-t border-[#00ffc8]/20 shadow-[0_-20px_56px_-24px_rgba(0,255,200,0.14)]'
                : 'border-t border-white/10')}>
        <div>
          <LiveMarketStrip_1.LiveMarketStrip symbol={mergedModel.pair} lastPrice={Number.isFinite(mergedModel.lastPrice) ? mergedModel.lastPrice : null} movePct={(_t = mergedModel.change24hPct) !== null && _t !== void 0 ? _t : null} moveLabel="24h" statusLabel={hasActiveTradePosition ? 'Live' : undefined} pulse={hasActiveTradePosition} tickerItems={liveMarketTickerItems}/>
          <div className="mx-auto w-full max-w-lg border-b border-[#00ffc8]/24 bg-gradient-to-b from-black/55 to-black/[0.38] backdrop-blur-sm">
              <div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-[4.8px] px-[7px] py-[3px] sm:gap-x-[7px] sm:px-[10px]">
                <div className="min-w-0 justify-self-start"/>
                <div className="flex min-w-0 w-full justify-self-stretch justify-start pl-0.5 sm:pl-1">
                  {hasActiveTradePosition && isExchangeBackedOpenLeg ? (<div className="flex w-full min-w-0 flex-col gap-1">
                      <div className="flex w-full min-w-0 flex-col gap-0.5">
                        <PositionActionsBar_1.DockManageAdjustButtons disabled={!!orderPending} onManagePosition={market === 'futures' && exchangePositionForSymbol
                    ? openManagePositionView
                    : undefined} onReverseOrder={market === 'futures' ? onReverseOrder : undefined} onAdjustRisk={adjustRiskSnapshot ? function () { return setAdjustRiskOpen(true); } : undefined}/>
                        <TradeActionBar_1.ChartDockCloseRow disabled={!!orderPending} partialClosePct={dockPartialPct} onClosePosition={function () { return onActivePartialClose(dockPartialPct / 100); }} onCloseAll={function () { return setCloseAllModalOpen(true); }}/>
                      </div>
                    </div>) : hasActiveTradePosition && !isExchangeBackedOpenLeg ? (<div className="flex w-full min-w-0 flex-col gap-1 py-0.5">
                      <p className="text-[10px] leading-snug text-zinc-500">
                        Demo active position — use Exit automation above for suggestions. Suggestion only · Live
                        changes require confirmation.
                      </p>
                    </div>) : isBotsReviewCockpit && botsReviewCockpitModel ? (<div className="flex w-full min-w-0 flex-col gap-1.5 py-0.5">
                      <p className="text-[10px] leading-snug text-zinc-500">
                        {dailyReviewLocked
                    ? 'Daily risk guard is on — new entries are paused; paper preview and your chart stay available.'
                    : 'Review-only from Bots. No live entry — use the chart for context or open paper preview.'}
                      </p>
                      <button type="button" onClick={function () {
                    scrollToPaperPreviewSection();
                }} className="w-full rounded-lg border border-[#00ffc8]/30 bg-[#00ffc8]/10 py-2 text-xs font-semibold text-[#00ffc8] transition hover:bg-[#00ffc8]/14">
                        Paper trade preview
                      </button>
                    </div>) : (<TradeActionBar_1.DockSplitEntryButtons market={market} canExecute={canExecute && !orderPending} flashSide={execFlash} onOpenShort={function () { return void executeTrade('short'); }} onOpenLong={function () { return void executeTrade('long'); }} signalBias={selectedSignal.side === 'short' ? 'short' : 'long'}/>)}
                </div>
                <button type="button" onClick={toggleChartDock} className={"justify-self-end flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[7px] transition hover:bg-white/[0.06] active:bg-white/[0.08] ".concat(chartDockChevronIdle
                ? 'text-sigflo-muted hover:text-white'
                : 'sigflo-chart-dock-chevron-btn hover:text-cyan-100')} aria-expanded={chartDockOpen} aria-label={chartDockOpen ? 'Collapse chart' : 'Expand chart'}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" className={"text-current transition-transform duration-200 ".concat(chartDockOpen ? 'rotate-180' : '')} aria-hidden>
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              <div className="flex items-start justify-between gap-2 px-[10px] pb-1 pt-0.5">
                <div className={"flex min-w-0 flex-wrap items-center transition-[gap] duration-200 ease-out ".concat(chartDockTimingLayout.bulky ? 'gap-1' : 'gap-1.5')}>
                  <button type="button" onClick={toggleChartDock} className="max-w-full truncate rounded py-[2px] pr-[6px] text-left transition hover:bg-white/[0.03] active:bg-white/[0.05]" aria-expanded={chartDockOpen} aria-label={chartDockOpen
                ? "Collapse chart (".concat(intervalLabel, ")")
                : "Expand chart (".concat(intervalLabel, ")")}>
                    <span className="whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.12em] text-sigflo-muted">
                      Price Chart
                    </span>
                  </button>
                  {/* Perps + flat: % target / risk / R:R grid after “Price chart”. Spot omits (no margin-style risk %). */}
                  {!hasActiveTradePosition && market === 'futures' ? (<>
                      <div className="h-7 w-px shrink-0 self-center bg-white/[0.1]" aria-hidden/>
                      <div className={"shrink-0 origin-left transition-transform duration-200 ease-out ".concat(chartDockTimingLayout.bulky ? 'scale-[0.92]' : 'scale-100')}>
                        <TradeStats_1.TradeStats variant="strip" compact layout="dockGrid" riskPercent={tradeDockStats.riskPercent} rewardPercent={tradeDockStats.rewardPercent} rrRatio={tradeDockStats.rrRatio}/>
                      </div>
                    </>) : null}
                  <span className="flex min-w-0 shrink-0 flex-col items-start gap-0.5">
                    <StatusChip_1.StatusChip label={dockTimingChip.label} state={dockTimingChip.state} compact/>
                    {dockTimingChip.helperText ? (<span className="max-w-[9rem] text-[7px] font-medium leading-tight text-sigflo-muted/90">
                        {dockTimingChip.helperText}
                      </span>) : null}
                    {dockTimingChip.executionLabel ? (<span className="max-w-[9rem] text-[7px] font-semibold leading-tight text-cyan-200/85" title={(_u = timingUi.executionHelperText) !== null && _u !== void 0 ? _u : undefined}>
                        {dockTimingChip.executionLabel}
                      </span>) : null}
                  </span>
                  <TradeActionBar_1.ChartDockTradeSetupPair dockMeta={dockDecisionMeta} compact reserveSpaceForLongTiming={chartDockTimingLayout.bulky}/>
                </div>
                <div className="flex min-w-0 flex-1 items-center justify-end gap-1">
                  <div className={"inline-flex min-h-[24px] w-full overflow-hidden rounded border border-white/[0.1] bg-white/[0.04] p-0.5 transition-[max-width] duration-200 ease-out ".concat(chartDockTimingLayout.setupToggleMaxClass)} role="group" aria-label="Chart overlay mode">
                    <button type="button" onClick={function () { return setSetupMode(false); }} className={"min-w-0 flex-1 rounded px-1.5 py-1 text-[7px] font-semibold uppercase tracking-[0.08em] transition ".concat(!setupMode
                ? 'bg-white/[0.12] text-white'
                : 'text-sigflo-muted hover:text-white')}>
                      Clean
                    </button>
                    <button type="button" onClick={function () { return setSetupMode(true); }} className={"min-w-0 flex-1 rounded px-1.5 py-1 text-[7px] font-semibold uppercase tracking-[0.08em] transition ".concat(setupMode
                ? 'bg-cyan-500/18 text-cyan-100 ring-1 ring-cyan-400/25'
                : 'text-sigflo-muted hover:text-cyan-100')}>
                      Setup
                    </button>
                  </div>
                  {hasActiveTradePosition ? (<div className={"shrink rounded border border-white/[0.06] bg-black/35 px-0.5 py-0.5 ring-1 ring-white/[0.02] transition-[min-width,max-width,flex-basis] duration-200 ease-out sm:px-1 ".concat(chartDockTimingLayout.partialHeaderClass)}>
                    <button type="button" disabled={!!orderPending} id="sigflo-dock-partial-toggle" aria-expanded={dockPartialOpen} aria-controls="sigflo-dock-partial-panel" onClick={function () { return setDockPartialOpen(function (o) { return !o; }); }} className="flex w-full items-center justify-between gap-1 rounded py-0.5 pl-0 pr-0.5 text-left leading-none transition hover:bg-white/[0.04] active:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent">
                      <span className="text-[6px] font-extrabold uppercase tracking-[0.12em] text-sigflo-muted">Partial</span>
                      <span className="flex shrink-0 items-center gap-0.5">
                        <span className="font-mono text-[9px] font-bold tabular-nums text-cyan-200/95">{dockPartialPct}%</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className={"text-sigflo-muted transition-transform duration-200 ".concat(dockPartialOpen ? 'rotate-180' : '')} aria-hidden>
                          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    </button>
                    <div id="sigflo-dock-partial-panel" role="region" aria-labelledby="sigflo-dock-partial-toggle" {...(dockPartialOpen ? {} : { hidden: true })}>
                      {dockPartialOpen ? (<>
                          <p id="sigflo-dock-partial-slider-hint" className="sr-only">
                            Choose what fraction of the position to close. This does not submit until you tap Close position.
                          </p>
                          <label className="mt-0.5 flex h-4 cursor-pointer items-center py-0">
                            <span className="sr-only">Percent of position to scale out</span>
                            <input type="range" min={5} max={100} step={5} value={dockPartialPct} disabled={!!orderPending} onChange={function (e) { return setDockPartialPct(Number(e.target.value)); }} className="sigflo-partial-slider sigflo-partial-slider--compact h-4 w-full min-w-0 cursor-pointer touch-manipulation disabled:cursor-not-allowed disabled:opacity-40" aria-valuemin={5} aria-valuemax={100} aria-valuenow={dockPartialPct} aria-valuetext={"".concat(dockPartialPct, " percent")} aria-describedby="sigflo-dock-partial-slider-hint"/>
                          </label>
                        </>) : null}
                    </div>
                  </div>) : null}
                </div>
              </div>
              {chartDockOpen ? (<TradeChartPanel_1.TradeChartPanel collapsed={false} plotExpandedPx={chartDockMaximized ? tradeChartHeights_1.TRADE_CHART_PLOT_MANAGE_MAXIMIZED_PX : tradeChartHeights_1.TRADE_CHART_PLOT_EXPANDED_PX} timeScaleMaxBarSpacingPx={tradeChartHeights_1.CHART_TIMESCALE_MAX_BAR_SPACING_PX} model={chartModelForPlot} market={market} intervalLabel={intervalLabel} loadingInterval={live.loadingInterval} liveUpdatedAt={live.lastUpdateTs} change24hPct={mergedModel.change24hPct} timeframeOptions={TRADE_CHART_INTERVAL_OPTIONS} chartInterval={chartInterval} onChartIntervalChange={function (v) {
                    setChartInterval(v);
                    window.localStorage.setItem(tradeChartIntervalPreference_1.TRADE_CHART_INTERVAL_STORAGE_KEY, v);
                    window.dispatchEvent(new CustomEvent(tradeChartIntervalPreference_1.SIGFLO_CHART_INTERVAL_EVENT, { detail: v }));
                }} exchangeStyleHero metaCaption={market === 'futures' ? 'PERP · Funding +0.010%' : 'Spot · No funding'} setupMode={hasActiveTradePosition || setupMode} onSetupModeToggle={!hasActiveTradePosition ? function () { return setSetupMode(function (v) { return !v; }); } : undefined} onRequestSetupMode={function () { return setSetupMode(true); }} tradeTimingState={timingUi.overlayTimingState} liveTradeMode={Boolean(chartDockOpen && hasActiveTradePosition)} suppressExchangeHeroLivePrice liveActivePositionTitle={hasActiveTradePosition ? 'Live position' : undefined} liveTradeOverlayPreset={hasActiveTradePosition} auxiliaryPriceLines={chartAuxiliaryLines} liveHeaderMetrics={chartDockOpen ? dockChartHeaderMetrics : undefined} liveTradeRefitKey={liveChartRefitKey} chartProximity={chartProximity} pnlHeaderLabel={chartPnlHeader.label} pnlHeaderTone={chartPnlHeader.tone} onSetupFocusBanner={onSetupFocusBannerCb} draggablePlanLevels={!isManageMode &&
                    !isBotsReviewCockpit &&
                    ((!hasActiveTradePosition && setupMode) || liveChartTpSlDragEligible)} onPlanStopChange={onDockChartPlanStopDrag} onPlanTargetChange={onDockChartPlanTargetDrag} onPlanStopDragEnd={liveChartTpSlDragEligible ? onDockChartLiveStopDragCommit : undefined} onPlanTargetDragEnd={liveChartTpSlDragEligible ? onDockChartLiveTargetDragCommit : undefined} chartInnerChromeToggle={{
                    expanded: chartDockMaximized,
                    onToggle: toggleChartDockMaximized,
                    variant: 'dock',
                }} className="pb-2"/>) : null}

          </div>

        </div>
      </div>) : (<div className="shrink-0 border-t border-white/[0.06] bg-[#050505] pb-[max(0.5rem,env(safe-area-inset-bottom))]" aria-hidden/>)}

      {isManageMode ? (<ManagePartialCloseSheet_1.ManagePartialCloseSheet open={managePartialSheetOpen} onClose={function () { return setManagePartialSheetOpen(false); }} fraction={managePartialFraction} onFractionChange={setManagePartialFraction} onConfirm={function (f) {
                pendingManualPartialClosePctRef.current = f;
                exitAuto.pushActivity({
                    kind: 'exit_state',
                    message: "Manual partial close confirmed (".concat(Math.round(f * 100), "%) \u2014 submitting\u2026"),
                });
                setManagePartialSheetOpen(false);
                onActivePartialClose(f);
            }} disabled={!!orderPending} busy={!!orderPending}/>) : null}

      {!isManageMode ? (<GuidedExecutionPanel_1.GuidedExecutionPanel open={guidedExecutionOpen} setup={guidedExecutionSetup} previewOnly={isBotsReviewCockpit} onClose={function () { return setGuidedExecutionOpen(false); }} onExecute={function () { return __awaiter(_this, void 0, void 0, function () {
                var ok;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, executeTrade(guidedExecutionSide, { bypassGuidedExecution: true })];
                        case 1:
                            ok = _a.sent();
                            if (!ok) {
                                throw new Error('Order was not submitted.');
                            }
                            setGuidedExecutionOpen(false);
                            return [2 /*return*/];
                    }
                });
            }); }} onViewPosition={function () {
                if (market === 'futures' && exchangePositionForSymbol) {
                    openManagePositionView();
                    setGuidedExecutionOpen(false);
                    return;
                }
                navigate('/portfolio');
                setGuidedExecutionOpen(false);
            }}/>) : null}

      <AdjustRiskSheet_1.AdjustRiskSheet open={adjustRiskOpen} onClose={function () { return setAdjustRiskOpen(false); }} tabBarInsetPx={88} snapshot={adjustRiskSnapshot} exitAuto={adjustRiskExitApi} onApplyExchangeStop={isManageMode && market === 'futures' && useRealExecution && exchangePositionForSymbol
            ? applyAdjustRiskExchangeStop
            : undefined} exchangeStopApplyDisabled={!!orderPending}/>
    </div>);
}
/** Legacy `/trade?signal=sig-1` URLs — map to tracked pairs when the feed has not emitted that id yet. */
function resolveShellSignalForLegacyId(signalId, liveSignals) {
    var _a;
    var map = {
        'sig-1': { pair: 'BTC', symbol: 'BTCUSDT' },
        'sig-2': { pair: 'ETH', symbol: 'ETHUSDT' },
        'sig-3': { pair: 'SOL', symbol: 'SOLUSDT' },
    };
    var m = map[signalId];
    if (!m)
        return null;
    return (_a = liveSignals.find(function (s) { return s.pair === m.pair; })) !== null && _a !== void 0 ? _a : (0, marketScannerRows_1.buildTrackedFallbackSignal)(m.pair, m.symbol);
}
function buildSignalContextFromQuery(params, signalId) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    var setupScore = Number(params.get('setupScore'));
    var trend = Number(params.get('trend'));
    var momentum = Number(params.get('momentum'));
    var structure = Number(params.get('structure'));
    var volume = Number(params.get('volume'));
    var risk = Number(params.get('risk'));
    var pair = params.get('pair');
    if (!Number.isFinite(setupScore) || !Number.isFinite(trend) || !Number.isFinite(momentum))
        return null;
    if (!Number.isFinite(structure) || !Number.isFinite(volume) || !Number.isFinite(risk) || !pair)
        return null;
    var tagsRaw = (_a = params.get('tags')) !== null && _a !== void 0 ? _a : '';
    var tags = tagsRaw.split(',').map(function (t) { return t.trim(); }).filter(function (t) { return t === 'Breakout' || t === 'Pullback' || t === 'Overextended'; });
    var setupScoreLabel = ((_b = params.get('setupScoreLabel')) !== null && _b !== void 0 ? _b : 'Developing');
    var riskTag = ((_c = params.get('riskTag')) !== null && _c !== void 0 ? _c : 'Medium Risk');
    var sideParam = ((_d = params.get('side')) !== null && _d !== void 0 ? _d : 'long');
    var entryQ = Number(params.get('entry'));
    var stopQ = Number(params.get('stop'));
    var targetQ = Number(params.get('target'));
    return {
        id: signalId,
        pair: pair,
        side: sideParam,
        biasLabel: (_e = params.get('biasLabel')) !== null && _e !== void 0 ? _e : (sideParam === 'long' ? 'Potential Long' : 'Potential Short'),
        setupScore: setupScore,
        setupScoreLabel: setupScoreLabel,
        setupType: (_f = params.get('setupType')) !== null && _f !== void 0 ? _f : 'breakout',
        scoreBreakdown: { trendAlignment: trend, momentumQuality: momentum, structureQuality: structure, volumeConfirmation: volume, riskConditions: risk },
        riskTag: riskTag,
        setupTags: tags,
        exchange: 'Bybit',
        postedAgo: 'Live',
        aiExplanation: (_g = params.get('explanation')) !== null && _g !== void 0 ? _g : 'Setup context loaded from feed.',
        whyThisMatters: 'Loaded from selected setup context.',
        watchCue: ((_h = params.get('watch')) === null || _h === void 0 ? void 0 : _h.trim()) || undefined,
        watchNext: ((_j = params.get('watchNext')) === null || _j === void 0 ? void 0 : _j.trim()) || undefined,
        plannedEntry: Number.isFinite(entryQ) && entryQ > 0 ? entryQ : undefined,
        plannedStop: Number.isFinite(stopQ) && stopQ > 0 ? stopQ : undefined,
        plannedTarget: Number.isFinite(targetQ) && targetQ > 0 ? targetQ : undefined,
    };
}
