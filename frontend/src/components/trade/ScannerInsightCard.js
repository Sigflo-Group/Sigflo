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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScannerInsightCard = ScannerInsightCard;
var react_1 = require("react");
var MarketDeepAnalysisSheet_1 = require("@/components/trade/MarketDeepAnalysisSheet");
var MarketNewsScanSheet_1 = require("@/components/news/MarketNewsScanSheet");
var StatusChip_1 = require("@/components/trade/StatusChip");
var client_1 = require("@/services/ai/client");
var spotSymbol_1 = require("@/lib/spotSymbol");
var tradeSetupExecutionModel_1 = require("@/lib/tradeSetupExecutionModel");
/** Scanner “action” line when already in a trade — descriptive feedback only, not instructions. */
function inPositionFeedbackLine(executionQuality) {
    if (executionQuality === 'strong')
        return 'Fill is close to plan entry — execution reads strong.';
    if (executionQuality === 'okay')
        return 'Fill is within an acceptable range vs plan entry.';
    if (executionQuality === 'weak')
        return 'Fill is wider vs optimal entry — the score reflects that execution cost.';
    return 'Position is open — scores blend the setup with how entry matched the plan.';
}
function setupTone(score) {
    if (score >= 80)
        return 'Strong';
    if (score >= 65)
        return 'Developing';
    if (score >= 50)
        return 'Mixed';
    return 'Weak';
}
function trendCue(signal) {
    var t = signal.scoreBreakdown.trendAlignment;
    if (t >= 17)
        return 'Trend holding';
    if (t <= 10)
        return 'Weak trend';
    return 'Trend mixed';
}
function momentumCue(signal) {
    var m = signal.scoreBreakdown.momentumQuality;
    if (m >= 14)
        return 'Momentum building';
    if (m <= 8)
        return 'Momentum fading';
    return 'Momentum steady';
}
function readFor(signal, status) {
    var trendAligned = signal.scoreBreakdown.trendAlignment >= 14;
    if (signal.setupType === 'breakout') {
        if (status === 'triggered')
            return 'Breakout active';
        if (status === 'developing')
            return 'Breakout forming';
        if (status === 'overextended')
            return 'Breakout stretched';
        return 'Breakout coiling';
    }
    if (signal.setupType === 'pullback') {
        if (status === 'triggered')
            return trendAligned ? 'Pullback holding' : 'Trend uncertain';
        if (status === 'developing')
            return 'Pullback forming';
        if (status === 'overextended')
            return 'Bounce stretched';
        return 'Weak bounce';
    }
    if (status === 'overextended')
        return 'Exhaustion risk';
    return signal.side === 'long' ? 'Rejection forming' : 'Relief forming';
}
function watchFor(signal) {
    if (signal.setupType === 'breakout')
        return 'breakout or rejection';
    if (signal.setupType === 'pullback')
        return signal.side === 'long' ? 'hold or fade' : 'reclaim or fail';
    return 'continuation or rollover';
}
function actionFor(signal, status, tradeScore, hasOpenPosition, executionQuality) {
    if (hasOpenPosition)
        return inPositionFeedbackLine(executionQuality);
    var highSetupRisk = signal.riskTag === 'High Risk';
    var weakTiming = tradeScore < 45;
    if (highSetupRisk && weakTiming)
        return 'High setup risk and weak readiness — reduce size';
    if (highSetupRisk)
        return 'High setup risk — reduce size';
    if (weakTiming)
        return 'Readiness is soft — wait for trigger or reduce size';
    if (status === 'overextended')
        return 'Avoid chasing';
    if (status === 'developing')
        return 'Wait for confirmation';
    if (status === 'triggered' && tradeScore >= 65)
        return 'Entry active';
    if (signal.setupType === 'breakout') {
        return signal.side === 'long' ? 'Confirmation above level needed' : 'Confirmation below level needed';
    }
    return 'Keep size controlled';
}
/** Up to 4 short lines: prefer sentences from AI copy, then structural cues. */
function previewBullets(signal, status) {
    var raw = signal.aiExplanation.trim();
    var sentences = raw
        .split(/(?<=[.!?])\s+|\n+/)
        .map(function (s) { return s.replace(/\s+/g, ' ').trim(); })
        .filter(function (s) { return s.length > 8; });
    var out = [];
    var _loop_1 = function (s) {
        if (out.length >= 4)
            return "break";
        if (!out.some(function (o) { return o.toLowerCase() === s.toLowerCase(); }))
            out.push(s);
    };
    for (var _i = 0, sentences_1 = sentences; _i < sentences_1.length; _i++) {
        var s = sentences_1[_i];
        var state_1 = _loop_1(s);
        if (state_1 === "break")
            break;
    }
    if (out.length < 2)
        out.push(readFor(signal, status));
    if (out.length < 3)
        out.push(trendCue(signal));
    if (out.length < 4)
        out.push("Watch: ".concat(watchFor(signal)));
    if (out.length < 4)
        out.push(momentumCue(signal));
    return out.slice(0, 4);
}
function ScannerInsightCard(_a) {
    var _this = this;
    var signal = _a.signal, status = _a.status, tradeScore = _a.tradeScore, groundedContext = _a.groundedContext, _b = _a.hasOpenPosition, hasOpenPosition = _b === void 0 ? false : _b, _c = _a.executionQuality, executionQuality = _c === void 0 ? null : _c;
    var _d = (0, react_1.useState)(null), aiResult = _d[0], setAiResult = _d[1];
    var _e = (0, react_1.useState)(false), aiLoading = _e[0], setAiLoading = _e[1];
    var _f = (0, react_1.useState)(false), readOpen = _f[0], setReadOpen = _f[1];
    var _g = (0, react_1.useState)(false), deepSheetOpen = _g[0], setDeepSheetOpen = _g[1];
    var _h = (0, react_1.useState)(false), newsScanOpen = _h[0], setNewsScanOpen = _h[1];
    var baseAsset = (0, react_1.useMemo)(function () { return (0, spotSymbol_1.spotBaseAssetFromOrderSymbol)(signal.pair); }, [signal.pair]);
    (0, react_1.useEffect)(function () {
        setDeepSheetOpen(false);
        setNewsScanOpen(false);
    }, [signal.id]);
    var bullets = (0, react_1.useMemo)(function () { return previewBullets(signal, status); }, [signal, status]);
    var timingUi = (0, tradeSetupExecutionModel_1.buildTradeTimingUiModel)({
        inPosition: hasOpenPosition,
        marketStatus: status,
        executionQuality: executionQuality !== null && executionQuality !== void 0 ? executionQuality : null,
    });
    var action = actionFor(signal, status, tradeScore, hasOpenPosition, executionQuality !== null && executionQuality !== void 0 ? executionQuality : null);
    var sideChipClass = signal.side === 'long'
        ? 'border-emerald-400/30 bg-emerald-500/12 text-emerald-300'
        : 'border-rose-400/30 bg-rose-500/12 text-rose-300';
    var runExplain = function () { return __awaiter(_this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setAiLoading(true);
                    return [4 /*yield*/, (0, client_1.requestAssistantSuggestion)({
                            action: 'explain',
                            signal: signal,
                            status: status,
                            tradeScore: tradeScore,
                            context: groundedContext,
                        })];
                case 1:
                    result = _a.sent();
                    setAiResult({
                        headline: result.headline,
                        body: result.body,
                        source: result.source,
                        structured: result.structured,
                    });
                    setAiLoading(false);
                    return [2 /*return*/];
            }
        });
    }); };
    var runWatch = function () { return __awaiter(_this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setAiLoading(true);
                    return [4 /*yield*/, (0, client_1.requestAssistantSuggestion)({
                            action: 'watch',
                            signal: signal,
                            status: status,
                            tradeScore: tradeScore,
                            context: groundedContext,
                        })];
                case 1:
                    result = _a.sent();
                    setAiResult({
                        headline: result.headline,
                        body: result.body,
                        source: result.source,
                        structured: result.structured,
                    });
                    setAiLoading(false);
                    return [2 /*return*/];
            }
        });
    }); };
    var runEntry = function () { return __awaiter(_this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setAiLoading(true);
                    return [4 /*yield*/, (0, client_1.requestAssistantSuggestion)({
                            action: 'entry',
                            signal: signal,
                            status: status,
                            tradeScore: tradeScore,
                            context: groundedContext,
                        })];
                case 1:
                    result = _a.sent();
                    setAiResult({
                        headline: result.headline,
                        body: result.body,
                        source: result.source,
                        structured: result.structured,
                    });
                    setAiLoading(false);
                    return [2 /*return*/];
            }
        });
    }); };
    return (<div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/[0.08] via-sigflo-surface/95 to-emerald-500/[0.06] px-2.5 py-2.5 shadow-[0_0_30px_-16px_rgba(34,211,238,0.55)] ring-1 ring-cyan-400/10">
      <div className="flex items-center justify-between gap-2">
        <span className={"inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ".concat(sideChipClass)}>
          {signal.side}
        </span>
        <div className="flex items-center gap-1.5 text-right">
          <span className="relative h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300/90 shadow-[0_0_10px_-2px_rgba(34,211,238,0.5)] ring-1 ring-cyan-400/25" aria-hidden/>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200/90">AI Scanner</p>
        </div>
      </div>
      <p className="mt-1.5 text-[9px] leading-snug text-sigflo-muted/90">
        Interprets the Sigflo signal engine and on-screen plan data only — not independent research.
      </p>

      <ul className="mt-2.5 list-none space-y-1.5">
        {bullets.map(function (line, i) { return (<li key={"".concat(i, "-").concat(line.slice(0, 24))} className="flex gap-2 text-[12px] font-medium leading-snug text-white/92">
            <span className="shrink-0 font-bold text-cyan-300/75" aria-hidden>
              •
            </span>
            <span className="min-w-0">{line}</span>
          </li>); })}
      </ul>

      <div className="mt-2.5 rounded-lg border border-white/[0.08] bg-black/35 px-2 py-1.5 ring-1 ring-white/[0.04]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-sigflo-muted" title="Entry timing vs trigger — not the same as setup risk tag (Low/Medium/High)">
            Entry timing
          </span>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:flex-initial">
            <StatusChip_1.StatusChip label={timingUi.chipLabel} state={timingUi.chipState} compact/>
            <span className="shrink-0 font-mono text-[9px] font-semibold tabular-nums text-cyan-200/75" title="Trade readiness score (timing/quality for pressing the button — separate from risk tag)">
              {Math.round(tradeScore)}
            </span>
          </div>
        </div>
        {timingUi.helperText ? (<p className="mt-1 text-[9px] leading-snug text-sigflo-muted/90">{timingUi.helperText}</p>) : null}
        {timingUi.executionLabel ? (<p className="mt-0.5 text-[9px] leading-snug text-white/70">{timingUi.executionLabel}</p>) : null}
      </div>

      <button type="button" onClick={function () { return setReadOpen(function (o) { return !o; }); }} className="mt-2 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-200/75 transition hover:text-cyan-100" aria-expanded={readOpen}>
        {readOpen ? 'Hide full explanation' : 'Full explanation'}
      </button>
      {readOpen ? (<p className="mt-1.5 rounded-lg border border-white/[0.06] bg-black/25 p-2 text-[11px] leading-relaxed text-sigflo-muted">
          {signal.aiExplanation}
        </p>) : null}

      <div className="mt-2.5 text-[11px] text-sigflo-muted">
        Setup: <span className="font-semibold text-white">{signal.setupScore}</span>
        <span className="text-sigflo-muted"> · </span>
        <span className="text-sigflo-text/85">{setupTone(signal.setupScore)}</span>
      </div>

      <p className="mt-1.5 text-[11px] font-semibold leading-snug text-emerald-300/95">{action}</p>

      <div className="mt-3 rounded-lg border border-white/[0.06] bg-black/20 p-2">
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-sigflo-muted">Quick read</span>
          <div className="flex flex-wrap justify-end gap-1.5">
            <button type="button" onClick={function () { return setNewsScanOpen(true); }} className="rounded-md border border-white/[0.08] bg-white/[0.05] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-sigflo-text/95 transition hover:bg-white/[0.09]">
              {baseAsset} news
            </button>
            <button type="button" onClick={function () { return setDeepSheetOpen(true); }} className="rounded-md border border-cyan-400/20 bg-cyan-500/[0.08] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-cyan-100/95 transition hover:bg-cyan-500/14">
              Full thesis
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={runExplain} disabled={aiLoading} className="rounded-md border border-white/[0.06] bg-white/[0.04] px-2 py-1 text-[10px] font-medium leading-tight text-sigflo-text/95 transition hover:bg-white/[0.08]">
            Explain setup
          </button>
          <button type="button" onClick={runWatch} disabled={aiLoading} className="rounded-md border border-white/[0.06] bg-white/[0.04] px-2 py-1 text-[10px] font-medium leading-tight text-sigflo-text/95 transition hover:bg-white/[0.08]">
            What to watch
          </button>
          <button type="button" onClick={runEntry} disabled={aiLoading} className="rounded-md border border-white/[0.06] bg-white/[0.04] px-2 py-1 text-[10px] font-medium leading-tight text-sigflo-text/95 transition hover:bg-white/[0.08]">
            Improve entry
          </button>
        </div>
        {aiLoading ? (<p className="mt-2 text-[10px] text-sigflo-muted">Assistant is thinking...</p>) : aiResult ? (<div className="mt-2 rounded-md border border-white/[0.05] bg-black/30 p-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold leading-snug text-white/95">{aiResult.headline}</p>
              <span className={"rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ".concat(aiResult.source === 'remote'
                ? 'border-emerald-400/35 bg-emerald-500/15 text-emerald-200'
                : 'border-amber-400/35 bg-amber-500/15 text-amber-200')}>
                {aiResult.source === 'remote' ? 'AI live' : 'Fallback'}
              </span>
            </div>
            <p className="mt-1 whitespace-pre-line text-[10px] leading-relaxed text-sigflo-muted">{aiResult.body}</p>
            {aiResult.structured ? (<div className="mt-2 space-y-1 rounded border border-white/[0.05] bg-black/20 px-2 py-1.5 text-[9px] text-sigflo-muted">
                <p className="font-bold uppercase tracking-[0.12em] text-cyan-200/70">Grounded summary</p>
                <p>
                  Bias <span className="font-semibold text-white/90">{aiResult.structured.bias}</span> · Confidence{' '}
                  <span className="font-mono tabular-nums text-white/85">{aiResult.structured.confidence}</span> · Valid{' '}
                  <span className="text-white/85">{aiResult.structured.trade_valid ? 'yes' : 'no'}</span>
                </p>
                {aiResult.structured.levels_used.length > 0 ? (<p className="font-mono text-[8px] text-white/70">
                    Levels used:{' '}
                    {aiResult.structured.levels_used
                        .map(function (n) { return n.toLocaleString('en-US', { maximumFractionDigits: 8 }); })
                        .join(', ')}
                  </p>) : (<p className="text-[8px] text-sigflo-muted/90">Levels used: none (package-only)</p>)}
              </div>) : null}
          </div>) : (<p className="mt-2 text-[10px] text-sigflo-muted">Assistant is ready for this setup.</p>)}
      </div>

      <MarketDeepAnalysisSheet_1.MarketDeepAnalysisSheet open={deepSheetOpen} onClose={function () { return setDeepSheetOpen(false); }} signal={signal} status={status} tradeScore={tradeScore} groundedContext={groundedContext} quickRead={aiResult ? { headline: aiResult.headline, body: aiResult.body } : null}/>

      <MarketNewsScanSheet_1.MarketNewsScanSheet open={newsScanOpen} onClose={function () { return setNewsScanOpen(false); }} focusAsset={baseAsset} marketRegime={groundedContext.marketRegime}/>
    </div>);
}
