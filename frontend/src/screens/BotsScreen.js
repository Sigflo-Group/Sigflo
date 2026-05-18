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
exports.default = BotsScreen;
var react_1 = require("react");
var useSetupAlerts_1 = require("@/hooks/useSetupAlerts");
var framer_motion_1 = require("framer-motion");
var react_router_dom_1 = require("react-router-dom");
var AutomationCommandBar_1 = require("@/components/bots/AutomationCommandBar");
var EngineStatusCard_1 = require("@/components/bots/EngineStatusCard");
var OpportunityDecisionCard_1 = require("@/components/bots/OpportunityDecisionCard");
var ActivePositionsStrip_1 = require("@/components/bots/ActivePositionsStrip");
var PriorityOpportunityCard_1 = require("@/components/bots/PriorityOpportunityCard");
var ReadyAlertSettings_1 = require("@/components/bots/ReadyAlertSettings");
var ScanningStateCard_1 = require("@/components/bots/ScanningStateCard");
var SystemEventRow_1 = require("@/components/bots/SystemEventRow");
var mockCommandBar_1 = require("@/data/mockCommandBar");
var mockEngines_1 = require("@/data/mockEngines");
var mockSystemEvents_1 = require("@/data/mockSystemEvents");
var botsOpportunityIntel_1 = require("@/lib/botsOpportunityIntel");
var alertPreferences_1 = require("@/services/alerts/alertPreferences");
var opportunities_1 = require("@/services/opportunities");
var positions_1 = require("@/services/positions");
var demoPositionRepository_1 = require("@/services/positions/demoPositionRepository");
var DailyRiskGuardBanner_1 = require("@/components/risk/DailyRiskGuardBanner");
var dailyRiskGuard_1 = require("@/services/risk/dailyRiskGuard");
var riskSettings_1 = require("@/services/risk/riskSettings");
var useAccountSnapshot_1 = require("@/hooks/useAccountSnapshot");
var botSystem_1 = require("@/types/botSystem");
var sound_1 = require("@/utils/sound");
function alertStatusSummary(prefs) {
    if (!prefs.enabled)
        return 'Alerts off';
    return "Alerts on \u00B7 ".concat(prefs.minScore, "+");
}
/** Deep link `?alerts=1` — read once for initial state (Strict Mode–safe vs stripping the param immediately). */
function readOpenAlertsFromUrl() {
    if (typeof window === 'undefined')
        return false;
    try {
        return new URLSearchParams(window.location.search).get('alerts') === '1';
    }
    catch (_a) {
        return false;
    }
}
function OpportunitiesSkeleton() {
    return (<div className="space-y-3" aria-busy="true" aria-label="Loading opportunities">
      <div className="h-36 animate-pulse rounded-2xl border border-white/10 bg-white/[0.06]"/>
      <div className="space-y-2">
        <div className="h-20 animate-pulse rounded-xl border border-white/10 bg-white/[0.05]"/>
        <div className="h-20 animate-pulse rounded-xl border border-white/10 bg-white/[0.05]"/>
      </div>
    </div>);
}
function extractNumericValues(text) {
    if (!text)
        return [];
    var matches = text.match(/-?\d+(?:\.\d+)?/g);
    if (!matches)
        return [];
    return matches.map(function (m) { return Number(m); }).filter(function (n) { return Number.isFinite(n); });
}
function decisionPlanFromOpportunity(o) {
    var _a, _b;
    var entryVals = extractNumericValues((_a = o.entryZone) !== null && _a !== void 0 ? _a : o.entryStatus);
    var stopVals = extractNumericValues(o.invalidation);
    var targetVals = ((_b = o.targets) !== null && _b !== void 0 ? _b : []).flatMap(function (t) { return extractNumericValues(t); });
    return {
        entryZone: entryVals.length >= 2 ? { min: entryVals[0], max: entryVals[1] } : entryVals.length === 1 ? { min: entryVals[0], max: entryVals[0] } : undefined,
        invalidation: stopVals.length ? stopVals[0] : undefined,
        targets: targetVals.length ? targetVals : undefined,
    };
}
function isFormingOpportunity(o) {
    return o.state === 'Building' || o.state === 'Watching';
}
function isDbHydratedOpportunity(o) {
    var _a;
    if (!o.id.trim())
        return false;
    if (!Number.isFinite(o.score) || o.score <= 0)
        return false;
    if (!o.thesis.trim() || !o.rationale.trim())
        return false;
    if (!o.entryZone || !o.invalidation || !((_a = o.targets) === null || _a === void 0 ? void 0 : _a.length))
        return false;
    return true;
}
function symbolToDisplayPair(symbol) {
    var s = symbol.trim().toUpperCase();
    if (s.endsWith('USDT'))
        return "".concat(s.slice(0, -4), " / USDT");
    if (s.endsWith('USDC'))
        return "".concat(s.slice(0, -4), " / USDC");
    return s;
}
function BotsScreen() {
    var _this = this;
    var navigate = (0, react_router_dom_1.useNavigate)();
    var _a = (0, react_router_dom_1.useSearchParams)(), searchParams = _a[0], setSearchParams = _a[1];
    var liveSectionRef = (0, react_1.useRef)(null);
    var formingSectionRef = (0, react_1.useRef)(null);
    var alertSettingsPanelRef = (0, react_1.useRef)(null);
    var pendingAlertsScrollRef = (0, react_1.useRef)(false);
    var _b = (0, react_1.useState)([]), opportunities = _b[0], setOpportunities = _b[1];
    var _c = (0, react_1.useState)(true), isLoading = _c[0], setIsLoading = _c[1];
    var _d = (0, react_1.useState)(null), error = _d[0], setError = _d[1];
    var _e = (0, react_1.useState)(false), isDemoSource = _e[0], setIsDemoSource = _e[1];
    var _f = (0, react_1.useState)('all'), opportunityFilter = _f[0], setOpportunityFilter = _f[1];
    var _g = (0, react_1.useState)(function () { return new Set(); }), locallyPausedEngineIds = _g[0], setLocallyPausedEngineIds = _g[1];
    var _h = (0, react_1.useState)(null), lastSyncedAt = _h[0], setLastSyncedAt = _h[1];
    var _j = (0, react_1.useState)(false), isSyncing = _j[0], setIsSyncing = _j[1];
    var _k = (0, react_1.useState)(null), lastSyncErrorAt = _k[0], setLastSyncErrorAt = _k[1];
    var _l = (0, react_1.useState)(0), scanLineTick = _l[0], setScanLineTick = _l[1];
    var _m = (0, react_1.useState)(function () { return (0, alertPreferences_1.getAlertPreferences)(); }), alertPrefs = _m[0], setAlertPrefs = _m[1];
    var _o = (0, react_1.useState)(readOpenAlertsFromUrl), showAlertSettings = _o[0], setShowAlertSettings = _o[1];
    var _p = (0, react_1.useState)(null), expandedOpportunityId = _p[0], setExpandedOpportunityId = _p[1];
    var _q = (0, react_1.useState)(0), positionRevision = _q[0], setPositionRevision = _q[1];
    var _r = (0, react_1.useState)(null), paperTradeToast = _r[0], setPaperTradeToast = _r[1];
    var _s = (0, useSetupAlerts_1.useSetupAlerts)(opportunities), highlightIds = _s.highlightIds, commandBarFlashKey = _s.commandBarFlashKey, setupReadyBanner = _s.setupReadyBanner;
    var accountSnapshots = (0, useAccountSnapshot_1.useAccountSnapshot)().items;
    var riskSettings = (0, riskSettings_1.useRiskSettings)();
    var dailyRiskGuard = (0, dailyRiskGuard_1.useDailyRiskGuard)();
    var reviewLocked = dailyRiskGuard.status === 'locked';
    var commandBarModel = (0, react_1.useMemo)(function () { return (__assign(__assign({}, mockCommandBar_1.mockCommandBar), { riskMode: riskSettings.riskMode, liveExecutionLine: riskSettings.allowLiveExecution ? 'Live ready' : 'Live locked', riskGuardLine: (0, dailyRiskGuard_1.riskGuardStatusLine)(dailyRiskGuard.status) })); }, [riskSettings.riskMode, riskSettings.allowLiveExecution, dailyRiskGuard.status]);
    (0, react_1.useEffect)(function () {
        var id = window.setInterval(function () { return setScanLineTick(function (t) { return t + 1; }); }, 1000);
        return function () { return window.clearInterval(id); };
    }, []);
    (0, react_1.useEffect)(function () {
        if (searchParams.get('forming') !== '1')
            return;
        setOpportunityFilter('forming');
        var next = new URLSearchParams(searchParams);
        next.delete('forming');
        setSearchParams(next, { replace: true });
        window.requestAnimationFrame(function () {
            var _a;
            (_a = formingSectionRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    }, [searchParams, setSearchParams]);
    (0, react_1.useEffect)(function () {
        if (searchParams.get('alerts') !== '1')
            return;
        setShowAlertSettings(true);
        setAlertPrefs((0, alertPreferences_1.getAlertPreferences)());
        pendingAlertsScrollRef.current = true;
    }, [searchParams]);
    (0, react_1.useEffect)(function () {
        if (!showAlertSettings || !pendingAlertsScrollRef.current)
            return;
        pendingAlertsScrollRef.current = false;
        var id = window.requestAnimationFrame(function () {
            var _a;
            (_a = alertSettingsPanelRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        return function () { return window.cancelAnimationFrame(id); };
    }, [showAlertSettings]);
    /** Remove `alerts=1` from the URL once the panel is dismissed so bookmarks and engine deep links stay consistent. */
    (0, react_1.useEffect)(function () {
        if (showAlertSettings)
            return;
        if (searchParams.get('alerts') !== '1')
            return;
        var next = new URLSearchParams(searchParams);
        next.delete('alerts');
        setSearchParams(next, { replace: true });
    }, [showAlertSettings, searchParams, setSearchParams]);
    var refreshOpportunities = (0, react_1.useCallback)(function (opts) { return __awaiter(_this, void 0, void 0, function () {
        var silent, list, e_1, message;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    silent = (_a = opts === null || opts === void 0 ? void 0 : opts.silent) !== null && _a !== void 0 ? _a : false;
                    if (!silent)
                        setIsLoading(true);
                    setIsSyncing(true);
                    setError(null);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, (0, opportunities_1.listOpportunities)()];
                case 2:
                    list = _b.sent();
                    setOpportunities(list);
                    setLastSyncedAt(Date.now());
                    setLastSyncErrorAt(null);
                    return [3 /*break*/, 5];
                case 3:
                    e_1 = _b.sent();
                    message = e_1 instanceof Error && e_1.message ? e_1.message : 'Could not load opportunities';
                    setError(message);
                    if (!silent)
                        setOpportunities([]);
                    setLastSyncErrorAt(Date.now());
                    return [3 /*break*/, 5];
                case 4:
                    setIsSyncing(false);
                    if (!silent)
                        setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, []);
    (0, react_1.useEffect)(function () {
        var repo = (0, opportunities_1.getOpportunityRepository)();
        setIsDemoSource(repo.source === 'demo');
        void refreshOpportunities();
    }, [refreshOpportunities]);
    (0, react_1.useEffect)(function () {
        var id = window.setInterval(function () {
            void refreshOpportunities({ silent: true });
        }, 10000);
        return function () { return window.clearInterval(id); };
    }, [refreshOpportunities]);
    (0, react_1.useEffect)(function () {
        var onPositionsChanged = function () { return setPositionRevision(function (v) { return v + 1; }); };
        window.addEventListener(demoPositionRepository_1.DEMO_POSITIONS_CHANGED_EVENT, onPositionsChanged);
        return function () { return window.removeEventListener(demoPositionRepository_1.DEMO_POSITIONS_CHANGED_EVENT, onPositionsChanged); };
    }, []);
    (0, react_1.useEffect)(function () {
        if (!paperTradeToast)
            return;
        var id = window.setTimeout(function () { return setPaperTradeToast(null); }, 1800);
        return function () { return window.clearTimeout(id); };
    }, [paperTradeToast]);
    var ranked = opportunities;
    var activeSectionRef = (0, react_1.useRef)(null);
    var exchangeActivePositions = (0, react_1.useMemo)(function () {
        var out = [];
        for (var _i = 0, accountSnapshots_1 = accountSnapshots; _i < accountSnapshots_1.length; _i++) {
            var snap = accountSnapshots_1[_i];
            if (snap.status !== 'connected')
                continue;
            for (var _a = 0, _b = snap.positions; _a < _b.length; _a++) {
                var p = _b[_a];
                if (!(Number.isFinite(p.size) && p.size > 0))
                    continue;
                var mark = p.markPrice != null && Number.isFinite(p.markPrice) && p.markPrice > 0 ? p.markPrice : p.entryPrice;
                out.push((0, positions_1.sigfloActivePositionFromExchange)(p, symbolToDisplayPair(p.symbol), mark));
            }
        }
        return out;
    }, [accountSnapshots]);
    var localActivePositions = (0, react_1.useMemo)(function () { return (0, positions_1.getPositionRepository)().listActivePositions(); }, [positionRevision]);
    var activeStripPositions = (0, react_1.useMemo)(function () {
        var byPairKey = new Map();
        for (var _i = 0, exchangeActivePositions_1 = exchangeActivePositions; _i < exchangeActivePositions_1.length; _i++) {
            var p = exchangeActivePositions_1[_i];
            var mapped = (0, positions_1.sigfloActiveToStripPosition)(p);
            byPairKey.set(mapped.pairKey, mapped);
        }
        for (var _a = 0, localActivePositions_1 = localActivePositions; _a < localActivePositions_1.length; _a++) {
            var p = localActivePositions_1[_a];
            var mapped = (0, positions_1.sigfloActiveToStripPosition)(p);
            if (!byPairKey.has(mapped.pairKey))
                byPairKey.set(mapped.pairKey, mapped);
        }
        return __spreadArray([], byPairKey.values(), true);
    }, [exchangeActivePositions, localActivePositions]);
    var hero = (0, react_1.useMemo)(function () {
        var _a;
        var bestByState = ranked.find(function (o) { return o.state === 'Triggered' || o.state === 'Ready'; });
        if (bestByState)
            return bestByState;
        return (_a = ranked.find(function (o) { return o.score > 65; })) !== null && _a !== void 0 ? _a : null;
    }, [ranked]);
    var formingBand = (0, react_1.useMemo)(function () {
        return ranked
            .filter(function (o) {
            return isFormingOpportunity(o) &&
                (!hero || o.id !== hero.id);
        })
            .sort(function (a, b) { return b.score - a.score; });
    }, [ranked, hero]);
    var formingDisplay = (0, react_1.useMemo)(function () { return formingBand.slice(0, 3); }, [formingBand]);
    var primaryLiveRows = (0, react_1.useMemo)(function () {
        return (0, botSystem_1.sortOpportunities)(ranked.filter(function (o) {
            if (hero && o.id === hero.id)
                return false;
            if (o.score < 55)
                return false;
            if (isFormingOpportunity(o))
                return false;
            return true;
        }));
    }, [ranked, hero]);
    var filteredLiveRows = (0, react_1.useMemo)(function () {
        if (opportunityFilter !== 'forming')
            return primaryLiveRows;
        return (0, botSystem_1.sortOpportunities)(ranked.filter(function (o) { return o.state === 'Building' || o.state === 'Watching'; }));
    }, [opportunityFilter, primaryLiveRows, ranked]);
    var allFormingRows = (0, react_1.useMemo)(function () { return (0, botSystem_1.sortOpportunities)(ranked.filter(function (o) { return o.state === 'Building' || o.state === 'Watching'; })); }, [ranked]);
    var formingSectionRows = (0, react_1.useMemo)(function () {
        if (opportunityFilter === 'forming')
            return allFormingRows;
        return formingDisplay;
    }, [allFormingRows, formingDisplay, opportunityFilter]);
    var scanFreshSec = ranked.length ? Math.min.apply(Math, ranked.map(function (o) { return o.freshnessSec; })) : null;
    var scanAgeSec = (0, react_1.useMemo)(function () {
        void scanLineTick;
        if (scanFreshSec != null)
            return scanFreshSec;
        if (lastSyncedAt == null)
            return null;
        return Math.max(1, Math.floor((Date.now() - lastSyncedAt) / 1000));
    }, [scanFreshSec, lastSyncedAt, scanLineTick]);
    var scanningLabel = scanAgeSec != null ? "Engines scanning \u00B7 ".concat((0, botSystem_1.formatFreshness)(scanAgeSec)) : 'Engines scanning';
    var liveReadout = (0, react_1.useMemo)(function () {
        void scanLineTick;
        var total = ranked.length;
        var ready = ranked.filter(function (o) { return o.state === 'Ready' || o.state === 'Triggered'; }).length;
        var forming = ranked.filter(function (o) { return isFormingOpportunity(o); }).length;
        var age = lastSyncedAt != null ? Math.max(1, Math.floor((Date.now() - lastSyncedAt) / 1000)) : null;
        var ageLabel = age != null ? (0, botSystem_1.formatFreshness)(age) : 'no sync yet';
        if (isSyncing) {
            return "Live readout: syncing now \u00B7 ".concat(total, " tracked \u00B7 ").concat(forming, " forming \u00B7 ").concat(ready, " ready");
        }
        if (lastSyncErrorAt != null && (lastSyncedAt == null || lastSyncErrorAt > lastSyncedAt)) {
            return "Live readout: reconnecting \u00B7 last successful update ".concat(ageLabel);
        }
        if (!isDemoSource && total === 0) {
            return 'Live readout: 0 tracked · no opportunities rows returned yet';
        }
        return "Live readout: live \u00B7 ".concat(total, " tracked \u00B7 ").concat(forming, " forming \u00B7 ").concat(ready, " ready \u00B7 updated ").concat(ageLabel);
    }, [ranked, lastSyncedAt, isSyncing, lastSyncErrorAt, scanLineTick, isDemoSource]);
    var engineIntel = (0, react_1.useMemo)(function () { return ({
        setupsForming: formingBand.length,
        formingTopSetups: formingBand.slice(0, 2).map(function (o) {
            var raw = o.pair.trim();
            var pair = raw.includes('/') ? raw : raw.replace(/USDT$/i, ' / USDT').replace(/USDC$/i, ' / USDC');
            var explanation = o.rationale.trim().replace(/\s+/g, ' ');
            return {
                pair: pair,
                explanation: explanation.length > 84 ? "".concat(explanation.slice(0, 81), "\u2026") : explanation,
            };
        }),
        latestActivityLine: (0, botsOpportunityIntel_1.buildLatestActivityLine)(ranked),
    }); }, [formingBand, ranked]);
    var navigateToTradeReview = function (opportunity) {
        var _a, _b;
        var pair = opportunity.pair.replace('/', '');
        var q = new URLSearchParams({
            pair: pair,
            source: 'bots',
            setup: opportunity.setupType,
            state: opportunity.state,
            direction: opportunity.direction,
            opportunityId: opportunity.id,
            score: String(opportunity.score),
            thesis: opportunity.thesis,
            rationale: opportunity.rationale,
        });
        if (opportunity.entryZone)
            q.set('entryZone', opportunity.entryZone);
        if (opportunity.invalidation)
            q.set('invalidation', opportunity.invalidation);
        if ((_a = opportunity.targets) === null || _a === void 0 ? void 0 : _a.length)
            q.set('targets', opportunity.targets.join('|'));
        if ((_b = opportunity.timeframeAlignment) === null || _b === void 0 ? void 0 : _b.length)
            q.set('timeframeAlignment', opportunity.timeframeAlignment.join('|'));
        navigate("/trade?".concat(q.toString()));
    };
    var onReview = function (id) {
        var opp = ranked.find(function (o) { return o.id === id; });
        if (!opp)
            return;
        navigateToTradeReview(opp);
    };
    var onExplain = function (id) { return console.log('Why this setup', id); };
    var onToggleOpportunityExpand = function (id) {
        (0, sound_1.playUiTapSound)();
        setExpandedOpportunityId(function (prev) { return (prev === id ? null : id); });
    };
    var onSelectActivePosition = function (pairKey) {
        (0, sound_1.playUiTapSound)();
        navigate("/trade?pair=".concat(encodeURIComponent(pairKey), "&source=position"));
    };
    var onQuickPaperTrade = function (opportunity) {
        var _a;
        var plan = decisionPlanFromOpportunity(opportunity);
        if (!plan.entryZone || plan.invalidation == null)
            return;
        var entryPrice = (plan.entryZone.min + plan.entryZone.max) / 2;
        var pair = opportunity.pair.includes('/') ? opportunity.pair : "".concat(opportunity.pair, " / USDT");
        var id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : "bots-paper-".concat(Date.now());
        var next = {
            id: id,
            pair: pair,
            direction: opportunity.direction === 'SHORT' ? 'short' : 'long',
            entryPrice: entryPrice,
            markPrice: entryPrice,
            size: 1000,
            leverage: 1,
            marginMode: 'cross',
            unrealizedPnl: 0,
            unrealizedPnlPct: 0,
            stopPrice: plan.invalidation,
            liquidationPrice: null,
            targets: (_a = plan.targets) !== null && _a !== void 0 ? _a : [],
            openedAt: Date.now(),
            source: 'bots-paper',
        };
        var repo = (0, positions_1.getPositionRepository)();
        if (repo instanceof demoPositionRepository_1.DemoPositionRepository) {
            repo.addPosition(next);
        }
        setPaperTradeToast('Paper trade opened');
        setExpandedOpportunityId(null);
        window.requestAnimationFrame(function () {
            var _a;
            (_a = activeSectionRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    };
    var onViewEngine = function (id) {
        (0, sound_1.playUiTapSound)();
        navigate("/engines/".concat(encodeURIComponent(id)));
    };
    var onPauseToggleEngine = function (engineId) {
        (0, sound_1.playUiTapSound)();
        setLocallyPausedEngineIds(function (prev) {
            var next = new Set(prev);
            if (next.has(engineId))
                next.delete(engineId);
            else
                next.add(engineId);
            return next;
        });
    };
    var onViewFormingSetups = function () {
        setOpportunityFilter('forming');
        window.requestAnimationFrame(function () {
            var _a;
            (_a = formingSectionRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    };
    var sectionVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: function (i) { return ({
            opacity: 1,
            y: 0,
            transition: { duration: 0.28, delay: i * 0.05 },
        }); },
    };
    return (<div className="min-h-[100dvh] bg-[#050505] pb-24 pt-4">
      <div className="mx-auto w-full max-w-lg space-y-4 px-4">
        <framer_motion_1.motion.div custom={0} initial="hidden" animate="visible" variants={sectionVariants}>
          <AutomationCommandBar_1.default model={commandBarModel} setupReadyFlashKey={commandBarFlashKey} setupReadyBanner={setupReadyBanner}/>
        </framer_motion_1.motion.div>

        <DailyRiskGuardBanner_1.DailyRiskGuardBanner model={dailyRiskGuard}/>

        {isDemoSource ? (<div className="flex justify-end">
            <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-zinc-500">
              Demo engine output
            </span>
          </div>) : null}

        {error ? (<p className="rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90">{error}</p>) : null}

        {activeStripPositions.length > 0 ? (<framer_motion_1.motion.section ref={activeSectionRef} custom={1} initial="hidden" animate="visible" variants={sectionVariants}>
            <ActivePositionsStrip_1.default positions={activeStripPositions} onSelectPosition={onSelectActivePosition}/>
          </framer_motion_1.motion.section>) : null}
        {paperTradeToast ? (<div className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-lg border border-[#00ffc8]/30 bg-[#0b1512] px-3 py-1.5 text-xs font-medium text-[#bafef1] shadow-lg">
            {paperTradeToast}
          </div>) : null}

        <framer_motion_1.motion.section custom={2} initial="hidden" animate="visible" variants={sectionVariants}>
          {isLoading ? (<OpportunitiesSkeleton />) : hero ? (<PriorityOpportunityCard_1.default opportunity={hero} onReview={onReview} onExplain={onExplain} alertHighlight={highlightIds.has(hero.id)} reviewLocked={reviewLocked}/>) : (<ScanningStateCard_1.default />)}
        </framer_motion_1.motion.section>

        <framer_motion_1.motion.section ref={liveSectionRef} custom={3} initial="hidden" animate="visible" variants={sectionVariants}>
          <div id="sigflo-bots-alert-settings" ref={alertSettingsPanelRef} className="mb-2 space-y-2 scroll-mt-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <p className="flex min-w-0 flex-1 items-center gap-2 text-xs text-zinc-500">
                <span className="sigflo-engine-scan-dot shrink-0 rounded-full bg-[#00ffc8]/80" aria-hidden/>
                <span>{scanningLabel}</span>
              </p>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <span className={"rounded-full border px-2 py-0.5 text-[10px] font-medium ".concat(alertPrefs.enabled
            ? 'border-[#00ffc8]/25 bg-[rgba(0,255,200,0.07)] text-[#b8ece0]'
            : 'border-white/10 bg-white/[0.04] text-zinc-500')}>
                  {alertStatusSummary(alertPrefs)}
                </span>
                <button type="button" onClick={function () {
            (0, sound_1.playUiTapSound)();
            setShowAlertSettings(function (open) {
                var next = !open;
                if (next)
                    setAlertPrefs((0, alertPreferences_1.getAlertPreferences)());
                return next;
            });
        }} className="text-[10px] font-semibold text-[#9fe8d6] underline-offset-2 transition hover:text-[#c5f5e8]">
                  Alert settings
                </button>
              </div>
            </div>
            <p className="text-[10px] text-zinc-500">{liveReadout}</p>
            {showAlertSettings ? (<ReadyAlertSettings_1.default value={alertPrefs} onChange={function (next) {
                (0, alertPreferences_1.saveAlertPreferences)(next);
                setAlertPrefs(next);
            }}/>) : null}
          </div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">Live opportunities</h3>
            {opportunityFilter === 'forming' ? (<div className="flex items-center gap-2 rounded-full border border-[#00ffc8]/22 bg-[rgba(0,255,200,0.08)] px-2.5 py-1">
                <span className="text-[10px] font-medium text-zinc-300">Showing forming setups</span>
                <button type="button" onClick={function () {
                (0, sound_1.playUiTapSound)();
                setOpportunityFilter('all');
            }} className="text-[10px] font-semibold text-[#9fe8d6] underline-offset-2 transition hover:text-[#c5f5e8]">
                  Clear
                </button>
              </div>) : null}
          </div>
          {isLoading ? null : filteredLiveRows.length > 0 ? (<div className="space-y-2">
              {filteredLiveRows.map(function (row) { return (<OpportunityDecisionCard_1.default key={row.id} id={row.id} pair={row.pair} strategy={row.setupType} direction={row.direction} state={row.state === 'Ready' || row.state === 'Triggered' || row.state === 'Building' || row.state === 'Watching' ? row.state : 'Watching'} score={row.score} explanation={row.rationale || row.thesis} {...decisionPlanFromOpportunity(row)} isExpanded={expandedOpportunityId === row.id} onToggleExpand={onToggleOpportunityExpand} onQuickPaperTrade={function () { return onQuickPaperTrade(row); }} quickPaperTradeDisabled={!decisionPlanFromOpportunity(row).entryZone || decisionPlanFromOpportunity(row).invalidation == null} debugHydration={{ isDbHydrated: isDbHydratedOpportunity(row), opportunityId: row.id }}/>); })}
            </div>) : (<div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm leading-6 text-zinc-400">
              {opportunityFilter === 'forming' ? (<p>No forming setups in the list right now.</p>) : (<>
                  <p className="font-medium text-zinc-200">No setups meet our threshold right now</p>
                  <p className="mt-2">
                    Engines keep scanning for compression, pullbacks, and momentum. Near-ready ideas show under{' '}
                    <span className="text-zinc-300">Forming setups</span> below.
                  </p>
                </>)}
            </div>)}
        </framer_motion_1.motion.section>

        {!isLoading && (formingBand.length > 0 || opportunityFilter === 'forming') ? (<framer_motion_1.motion.section ref={formingSectionRef} custom={4} initial="hidden" animate="visible" variants={sectionVariants}>
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">Forming setups</h3>
            {formingSectionRows.length > 0 ? (<div className="space-y-2">
                {formingSectionRows.map(function (row) { return (<OpportunityDecisionCard_1.default key={row.id} id={row.id} pair={row.pair} strategy={row.setupType} direction={row.direction} state={row.state === 'Ready' || row.state === 'Triggered' || row.state === 'Building' || row.state === 'Watching' ? row.state : 'Watching'} score={row.score} explanation={row.rationale || row.thesis} {...decisionPlanFromOpportunity(row)} isExpanded={expandedOpportunityId === row.id} onToggleExpand={onToggleOpportunityExpand} onQuickPaperTrade={function () { return onQuickPaperTrade(row); }} quickPaperTradeDisabled={!decisionPlanFromOpportunity(row).entryZone || decisionPlanFromOpportunity(row).invalidation == null} debugHydration={{ isDbHydrated: isDbHydratedOpportunity(row), opportunityId: row.id }}/>); })}
              </div>) : (<p className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-zinc-400">
                No forming setups in the list right now.
              </p>)}
          </framer_motion_1.motion.section>) : null}

        <framer_motion_1.motion.section custom={5} initial="hidden" animate="visible" variants={sectionVariants}>
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">Engine status</h3>
          <div className="grid grid-cols-1 gap-2">
            {mockEngines_1.mockEngines.map(function (engine) { return (<EngineStatusCard_1.default key={engine.engineId} engine={engine} intel={engineIntel} isPausedLocally={locallyPausedEngineIds.has(engine.engineId)} onView={onViewEngine} onPauseToggle={onPauseToggleEngine} onViewForming={onViewFormingSetups}/>); })}
          </div>
        </framer_motion_1.motion.section>

        <framer_motion_1.motion.section custom={6} initial="hidden" animate="visible" variants={sectionVariants}>
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">System journal</h3>
          <div className="space-y-2">
            {mockSystemEvents_1.mockSystemEvents.map(function (event) { return (<SystemEventRow_1.default key={event.id} event={event}/>); })}
          </div>
        </framer_motion_1.motion.section>
      </div>
    </div>);
}
