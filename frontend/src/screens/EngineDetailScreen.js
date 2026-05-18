"use strict";
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
exports.default = EngineDetailScreen;
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var EngineDetailControls_1 = require("@/components/engines/EngineDetailControls");
var EngineFocusCard_1 = require("@/components/engines/EngineFocusCard");
var EngineHeaderCard_1 = require("@/components/engines/EngineHeaderCard");
var EngineJournal_1 = require("@/components/engines/EngineJournal");
var EngineOpportunityList_1 = require("@/components/engines/EngineOpportunityList");
var mockEngines_1 = require("@/data/mockEngines");
var mockSystemEvents_1 = require("@/data/mockSystemEvents");
var tradeReviewCockpit_1 = require("@/lib/tradeReviewCockpit");
var alertPreferences_1 = require("@/services/alerts/alertPreferences");
var sound_1 = require("@/utils/sound");
var opportunities_1 = require("@/services/opportunities");
var botSystem_1 = require("@/types/botSystem");
function EngineDetailScreen() {
    var _this = this;
    var engineId = (0, react_router_dom_1.useParams)().engineId;
    var navigate = (0, react_router_dom_1.useNavigate)();
    var _a = (0, react_1.useState)([]), opportunities = _a[0], setOpportunities = _a[1];
    var _b = (0, react_1.useState)(true), oppLoading = _b[0], setOppLoading = _b[1];
    var _c = (0, react_1.useState)(false), isPausedLocally = _c[0], setIsPausedLocally = _c[1];
    var _d = (0, react_1.useState)([]), localJournalEvents = _d[0], setLocalJournalEvents = _d[1];
    var _e = (0, react_1.useState)(function () { return (0, alertPreferences_1.getAlertPreferences)(); }), alertPrefs = _e[0], setAlertPrefs = _e[1];
    var engine = (0, react_1.useMemo)(function () { var _a; return (engineId ? (_a = mockEngines_1.mockEngines.find(function (e) { return e.engineId === engineId; })) !== null && _a !== void 0 ? _a : null : null); }, [engineId]);
    (0, react_1.useEffect)(function () {
        var cancelled = false;
        var run = function () { return __awaiter(_this, void 0, void 0, function () {
            var list, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        setOppLoading(true);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, (0, opportunities_1.listOpportunities)()];
                    case 2:
                        list = _b.sent();
                        if (!cancelled)
                            setOpportunities(list);
                        return [3 /*break*/, 5];
                    case 3:
                        _a = _b.sent();
                        if (!cancelled)
                            setOpportunities([]);
                        return [3 /*break*/, 5];
                    case 4:
                        if (!cancelled)
                            setOppLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        void run();
        return function () {
            cancelled = true;
        };
    }, []);
    var formingForEngine = (0, react_1.useMemo)(function () {
        if (!engine)
            return [];
        return (0, botSystem_1.sortOpportunities)(opportunities.filter(function (o) {
            return (o.state === 'Building' || o.state === 'Watching') &&
                (0, tradeReviewCockpit_1.parseSourceEngineFromOpportunityId)(o.id) === engine.engineName;
        }));
    }, [opportunities, engine]);
    var scopedJournalEvents = (0, react_1.useMemo)(function () {
        if (!engineId)
            return [];
        return mockSystemEvents_1.mockSystemEvents.filter(function (e) { return e.relatedEngineId === engineId; });
    }, [engineId]);
    var navigateToTradeReview = (0, react_1.useCallback)(function (opportunity) {
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
    }, [navigate]);
    var onSelectOpportunity = (0, react_1.useCallback)(function (id) {
        var o = formingForEngine.find(function (x) { return x.id === id; });
        if (o)
            navigateToTradeReview(o);
    }, [formingForEngine, navigateToTradeReview]);
    var toggleLocalPause = (0, react_1.useCallback)(function () {
        if (!engineId)
            return;
        setIsPausedLocally(function (prev) {
            var next = !prev;
            var row = {
                id: "local-j-".concat(Date.now()),
                timestamp: new Date().toISOString(),
                eventType: 'engine',
                severity: 'info',
                message: next
                    ? 'Engine paused on this device (UI only — no server or exchange change).'
                    : 'Engine resumed on this device (UI only).',
                relatedEngineId: engineId,
            };
            setLocalJournalEvents(function (j) { return __spreadArray([row], j, true); });
            return next;
        });
    }, [engineId]);
    (0, react_1.useEffect)(function () {
        var sync = function () { return setAlertPrefs((0, alertPreferences_1.getAlertPreferences)()); };
        window.addEventListener('pageshow', sync);
        window.addEventListener('focus', sync);
        return function () {
            window.removeEventListener('pageshow', sync);
            window.removeEventListener('focus', sync);
        };
    }, []);
    var alertSummaryLine = (0, react_1.useMemo)(function () {
        if (!alertPrefs.enabled)
            return 'Ready setup alerts are off on this device.';
        if (alertPrefs.states.includes('Ready'))
            return 'Alerts active for Ready setups';
        if (alertPrefs.states.includes('Triggered'))
            return 'Alerts active for Triggered setups';
        return 'Setup alerts on — worth reviewing when conditions match your rules';
    }, [alertPrefs.enabled, alertPrefs.states]);
    if (!engineId || !engine) {
        return (<div className="min-h-[100dvh] bg-[#050505] pb-24 pt-3">
        <div className="mx-auto w-full max-w-md space-y-3 px-3">
          <p className="text-[13px] text-zinc-400">Engine not found.</p>
          <react_router_dom_1.Link to="/bots" className="inline-flex text-[13px] font-semibold text-[#9fe8d6]">
            Back to Bots
          </react_router_dom_1.Link>
        </div>
      </div>);
    }
    return (<div className="min-h-[100dvh] bg-[#050505] pb-28 pt-3">
      <div className="mx-auto w-full max-w-md space-y-3 px-3">
        <p className="text-[10px] font-medium text-zinc-600">Engine intelligence · demo</p>

        <EngineHeaderCard_1.EngineHeaderCard engine={engine} isPausedLocally={isPausedLocally}/>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5 backdrop-blur-sm">
          <p className="text-[12px] leading-snug text-zinc-300">{alertSummaryLine}</p>
          <button type="button" onClick={function () {
            (0, sound_1.playUiTapSound)();
            navigate('/bots?alerts=1');
        }} className="mt-2 text-[11px] font-semibold text-[#9fe8d6] underline-offset-2 transition hover:text-[#c5f5e8]">
            Edit alerts
          </button>
        </section>

        <EngineFocusCard_1.EngineFocusCard engineId={engine.engineId}/>

        <EngineOpportunityList_1.EngineOpportunityList loading={oppLoading} opportunities={formingForEngine} onSelect={onSelectOpportunity}/>

        <EngineJournal_1.EngineJournal events={scopedJournalEvents} localEvents={localJournalEvents}/>

        <EngineDetailControls_1.EngineDetailControls isPausedLocally={isPausedLocally} onPauseToggle={toggleLocalPause} onViewForming={function () { return navigate('/bots?forming=1'); }} onBackToBots={function () { return navigate('/bots'); }}/>

        <p className="px-0.5 text-[10px] leading-snug text-zinc-600">
          No trade execution here. Signals stay read-only until you open a setup on Trade.
        </p>
      </div>
    </div>);
}
