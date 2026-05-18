"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeScenarioProbabilities = computeScenarioProbabilities;
exports.TradeChartScenarioStrip = TradeChartScenarioStrip;
var react_1 = require("react");
var aiExitAutomation_1 = require("@/lib/aiExitAutomation");
var formatQuote_1 = require("@/lib/formatQuote");
var tradeExitGuidanceFlow_1 = require("@/lib/tradeExitGuidanceFlow");
var tradeEntryGuidance_1 = require("@/lib/tradeEntryGuidance");
var ACCENT = '#00ffc8';
var CONF_HIGH = '#00ffc8';
var CONF_MED = '#fbbf24';
var CONF_LOW = '#f87171';
function clamp(n, lo, hi) {
    return Math.min(hi, Math.max(lo, n));
}
function exitStateColor(s) {
    if (s === 'hold')
        return ACCENT;
    if (s === 'trim')
        return CONF_MED;
    return CONF_LOW;
}
/** Blend setup quality, live trade score, trend, and momentum — updates as inputs change. */
function computeStripConfidence(args) {
    var setup01 = clamp(args.setupScore / 100, 0, 1);
    var trade01 = clamp(args.tradeScore / 100, 0, 1);
    var trend01 = clamp(args.trendAlignment / 25, 0, 1);
    var mom01 = clamp(args.momentumQuality / 20, 0, 1);
    var score = (0.3 * setup01 + 0.34 * trade01 + 0.22 * trend01 + 0.14 * mom01) * 100;
    var dots = clamp(Math.round((score / 100) * 5), 1, 5);
    var tier = score >= 58 ? 'high' : score >= 38 ? 'medium' : 'low';
    return { tier: tier, dots: dots };
}
function StripConfidenceIndicator(props) {
    var tier = props.tier, dots = props.dots;
    var color = tier === 'high' ? CONF_HIGH : tier === 'medium' ? CONF_MED : CONF_LOW;
    var label = tier === 'high' ? 'High' : tier === 'medium' ? 'Medium' : 'Low';
    var chipGlow = tier === 'high' ? 'shadow-[0_0_12px_-3px_rgba(0,255,200,0.45)]' : '';
    return (<div className={"flex flex-col items-end gap-px ".concat(chipGlow, " transition-opacity duration-300")} aria-label={"Confidence ".concat(label, ", ").concat(dots, " of 5")}>
      <span className="text-[6px] font-bold uppercase leading-none tracking-[0.14em]" style={{ color: color }}>
        {label}
      </span>
      <div className="flex items-center gap-px" role="presentation">
        {Array.from({ length: 5 }, function (_, i) {
            var on = i < dots;
            return (<span key={i} className="h-[3px] w-[3px] shrink-0 rounded-full transition-colors duration-200" style={{
                    backgroundColor: on ? color : 'rgba(255,255,255,0.12)',
                    opacity: on ? 1 : 0.35,
                    boxShadow: on && tier === 'high' ? "0 0 4px ".concat(color, "66") : undefined,
                }}/>);
        })}
      </div>
    </div>);
}
/** Heuristic scenario probabilities from trade quality + setup (not market odds). */
function computeScenarioProbabilities(args) {
    var tradeScore = args.tradeScore, setupScore = args.setupScore, side = args.side;
    var momentum = 28 + tradeScore * 0.38;
    var setupBias = (setupScore - 55) * 0.2;
    var probUp = Math.round(clamp(side === 'long' ? momentum + setupBias * 0.6 : momentum - setupBias * 0.35, 18, 84));
    var probDown = Math.round(clamp(24 + (100 - tradeScore) * 0.3 + (side === 'short' ? setupBias * 0.45 : -setupBias * 0.25), 16, 76));
    return { probUp: probUp, probDown: probDown };
}
function fmtUsdSigned(n, compact) {
    if (compact === void 0) { compact = false; }
    var sign = n >= 0 ? '+' : '−';
    var v = Math.round(Math.abs(n));
    var s = compact
        ? v >= 1000
            ? "".concat((v / 1000).toFixed(1), "k")
            : String(v)
        : v.toLocaleString('en-US');
    return "".concat(sign, "$").concat(s);
}
function TradeChartScenarioStrip(props) {
    var _a, _b, _c, _d, _e;
    var _f = (0, react_1.useState)(false), open = _f[0], setOpen = _f[1];
    var isTrade = props.mode === 'trade';
    var confidence = (0, react_1.useMemo)(function () {
        if (props.mode !== 'trade')
            return null;
        return computeStripConfidence({
            setupScore: props.setupScore,
            tradeScore: props.tradeScore,
            trendAlignment: props.trendAlignment,
            momentumQuality: props.momentumQuality,
        });
    }, [
        props.mode,
        props.mode === 'trade' ? props.setupScore : 0,
        props.mode === 'trade' ? props.tradeScore : 0,
        props.mode === 'trade' ? props.trendAlignment : 0,
        props.mode === 'trade' ? props.momentumQuality : 0,
    ]);
    var exitAiMode = (_a = props.exitAiMode) !== null && _a !== void 0 ? _a : 'manual';
    var strategyPreset = (_b = props.exitStrategyPreset) !== null && _b !== void 0 ? _b : 'custom';
    var safeguards = (_c = props.automationSafeguards) !== null && _c !== void 0 ? _c : aiExitAutomation_1.DEFAULT_AUTOMATION_SAFEGUARDS;
    var customStrategyThresholds = (_d = props.customStrategyThresholds) !== null && _d !== void 0 ? _d : null;
    var _g = (0, react_1.useMemo)(function () {
        if (props.mode === 'trade') {
            return (0, tradeExitGuidanceFlow_1.resolveExitGuidanceFlow)({
                variant: 'trade',
                side: props.side,
                entry: props.entry,
                estimatedPnlPct: props.estimatedPnlPct,
                stop: props.stop,
                target: props.target,
                trendAlignment: props.trendAlignment,
                momentumQuality: props.momentumQuality,
                strategyPreset: strategyPreset,
                customStrategyThresholds: customStrategyThresholds,
                safeguards: safeguards,
                exitAiMode: exitAiMode,
            });
        }
        return (0, tradeExitGuidanceFlow_1.resolveExitGuidanceFlow)({
            variant: 'manage',
            side: props.side,
            entry: props.entry,
            mark: props.mark,
            stop: props.stop,
            target: props.target,
            trendAlignment: props.trendAlignment,
            momentumQuality: props.momentumQuality,
            pnlPct: props.pnlPct,
            strategyPreset: strategyPreset,
            customStrategyThresholds: customStrategyThresholds,
            safeguards: safeguards,
            exitAiMode: exitAiMode,
        });
    }, [
        props.mode,
        props.mode === 'trade'
            ? "".concat(props.side, "|").concat(props.entry, "|").concat(props.estimatedPnlPct, "|").concat(props.stop, "|").concat(props.target, "|").concat(props.trendAlignment, "|").concat(props.momentumQuality, "|").concat(strategyPreset, "|").concat(exitAiMode, "|").concat(JSON.stringify(safeguards), "|").concat(JSON.stringify(customStrategyThresholds))
            : "".concat(props.side, "|").concat(props.entry, "|").concat(props.mark, "|").concat(props.stop, "|").concat(props.target, "|").concat(props.trendAlignment, "|").concat(props.momentumQuality, "|").concat(props.pnlPct, "|").concat(strategyPreset, "|").concat(exitAiMode, "|").concat(JSON.stringify(safeguards), "|").concat(JSON.stringify(customStrategyThresholds)),
    ]), exitGuidance = _g.effective, nextPlannedAutomation = _g.nextPlanned;
    var entryGuidance = (0, react_1.useMemo)(function () {
        var _a;
        if (props.mode === 'trade') {
            return (0, tradeEntryGuidance_1.computeTradeEntryGuidance)({
                marketStatus: props.scannerStatus,
                tradeScore: props.tradeScore,
                setupScore: props.setupScore,
                side: props.side,
                lastPrice: props.lastPrice,
                planEntry: props.entry,
                hasOpenPosition: props.hasOpenPosition,
                executionQuality: (_a = props.executionQuality) !== null && _a !== void 0 ? _a : null,
            });
        }
        return (0, tradeEntryGuidance_1.computeTradeEntryGuidance)({
            marketStatus: props.scannerStatus,
            tradeScore: props.tradeScore,
            setupScore: props.setupScore,
            side: props.side,
            lastPrice: props.mark,
            planEntry: props.entry,
            hasOpenPosition: true,
        });
    }, [
        props.mode,
        props.scannerStatus,
        props.tradeScore,
        props.setupScore,
        props.side,
        props.entry,
        props.mode === 'trade' ? props.lastPrice : props.mark,
        props.mode === 'trade' ? props.hasOpenPosition : true,
        props.mode === 'trade' ? (_e = props.executionQuality) !== null && _e !== void 0 ? _e : null : null,
    ]);
    var prevExitRef = (0, react_1.useRef)(undefined);
    var _h = (0, react_1.useState)(false), exitFlash = _h[0], setExitFlash = _h[1];
    (0, react_1.useEffect)(function () {
        if (!exitGuidance)
            return;
        var s = exitGuidance.state;
        if (prevExitRef.current !== undefined && prevExitRef.current !== s) {
            setExitFlash(true);
            var id_1 = window.setTimeout(function () { return setExitFlash(false); }, 700);
            prevExitRef.current = s;
            return function () { return window.clearTimeout(id_1); };
        }
        prevExitRef.current = s;
    }, [exitGuidance]);
    var confidenceLowDim = isTrade && (confidence === null || confidence === void 0 ? void 0 : confidence.tier) === 'low' ? 'opacity-[0.97]' : '';
    return (<div className="mx-auto w-full max-w-lg px-0 pb-0 pt-0">
      <div className={"overflow-visible rounded-xl border border-white/[0.1] bg-gradient-to-b from-white/[0.05] to-black/55 transition-all duration-500 ease-out ring-1 ring-white/[0.06] ".concat(confidenceLowDim)}>
        <button type="button" onClick={function () { return setOpen(function (o) { return !o; }); }} className={"grid w-full grid-cols-1 items-start gap-x-2 gap-y-1.5 px-2 py-1.5 text-left transition active:scale-[0.995] min-[380px]:grid-cols-[minmax(0,1fr)_auto] md:gap-x-2 md:px-2 md:py-1.5 ".concat(open ? 'rounded-t-xl' : 'rounded-xl')} aria-expanded={open}>
          <div className="grid min-w-0 grid-cols-1 gap-y-1">
            {isTrade ? (<TradeStripTradeHero {...props} exitGuidance={exitGuidance} exitFlash={exitFlash}/>) : (<TradeStripManageHero {...props} exitGuidance={exitGuidance} exitFlash={exitFlash}/>)}
            <ExitAutomationMicroSummary exitAiMode={exitAiMode} strategyPreset={strategyPreset} guidance={exitGuidance} nextPlanned={nextPlannedAutomation}/>
          </div>
          <div className="grid shrink-0 justify-items-end gap-1 justify-self-end min-[380px]:justify-self-stretch sm:gap-1.5">
            <span className="text-[9px] font-extrabold uppercase leading-none tracking-[0.18em] text-blue-400 sm:text-[10px]" style={{ textShadow: '0 0 14px rgba(96,165,250,0.55), 0 0 28px rgba(96,165,250,0.28)' }}>
              Scenario
            </span>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="text-right text-[8px] font-semibold leading-none tabular-nums sm:text-[9px]">
                {isTrade ? (<span>
                    <span className="text-emerald-300">{props.probUp}%↑</span>
                    <span className="mx-0.5 text-white/30">/</span>
                    <span className="text-rose-300">{props.probDown}%↓</span>
                  </span>) : (<span className="uppercase tracking-wider text-sigflo-muted">Live</span>)}
              </div>
              {isTrade && confidence ? (<StripConfidenceIndicator tier={confidence.tier} dots={confidence.dots}/>) : null}
              <span className={open ? 'sigflo-scenario-chevron-pulse-open' : 'sigflo-scenario-chevron-pulse'}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={"shrink-0 text-blue-400 transition-transform duration-300 ".concat(open ? 'rotate-180' : '')} aria-hidden>
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </div>
          </div>
        </button>

        <div className={"grid transition-[grid-template-rows] duration-300 ease-out ".concat(open ? 'grid-rows-[1fr] overflow-hidden rounded-b-xl' : 'grid-rows-[0fr]')}>
          <div className="min-h-0 overflow-hidden">
            <div className="border-t border-white/[0.08] bg-black/40 px-2 py-1.5 text-sigflo-muted">
              {isTrade ? (<TradeScenarioPanelTrade {...props} exitGuidance={exitGuidance} entryGuidance={entryGuidance}/>) : (<TradeScenarioPanelManage {...props} exitGuidance={exitGuidance} entryGuidance={entryGuidance}/>)}
              <p className="mt-1 border-t border-white/[0.06] pt-1 text-[7px] leading-snug text-sigflo-muted/80 sm:text-[8px]">
                {isTrade
            ? 'Probabilities are scenario heuristics from setup + score (not exchange odds). Updates with size, leverage, and SL/TP.'
            : 'Open position view — executes on your exchange.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
/** Bordered cell for scenario strip — collapsed hero + expanded grid (terminal-style metrics). */
function ScenarioMetricCell(_a) {
    var label = _a.label, children = _a.children, _b = _a.className, className = _b === void 0 ? '' : _b, _c = _a.valueClassName, valueClassName = _c === void 0 ? '' : _c, style = _a.style, _d = _a.density, density = _d === void 0 ? 'default' : _d;
    var pad = density === 'compact'
        ? 'px-1 py-1 sm:px-1.5 sm:py-1.5'
        : 'px-2 py-1.5';
    var radius = density === 'compact' ? 'rounded sm:rounded-md' : 'rounded-md';
    var labelCls = density === 'compact'
        ? 'text-[6px] font-semibold uppercase tracking-wide text-sigflo-muted sm:text-[7px] sm:tracking-wider'
        : 'text-[8px] font-semibold uppercase tracking-wider text-sigflo-muted';
    var valueGap = density === 'compact' ? 'mt-px' : 'mt-0.5';
    var valueSize = density === 'compact' ? 'text-[9px] leading-tight sm:text-[10px]' : 'text-[11px] leading-tight';
    return (<div className={"min-w-0 border border-white/[0.08] bg-black/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)] ".concat(radius, " ").concat(pad, " ").concat(className)} style={style}>
      <p className={labelCls}>{label}</p>
      <div className={"".concat(valueGap, " ").concat(valueSize, " text-white ").concat(valueClassName)}>{children}</div>
    </div>);
}
function TradeStripTradeHero(props) {
    var roiPct = props.isFutures
        ? props.estimatedPnlPct * props.leverage
        : props.estimatedPnlPct;
    var pnlClass = props.estimatedPnlUsd >= 0 ? 'text-[#00ffc8]' : 'text-rose-300';
    var eg = props.exitGuidance;
    var exitColor = eg ? exitStateColor(eg.state) : ACCENT;
    return (<div className="grid min-w-0 grid-cols-1 gap-1">
      <ScenarioMetricCell label="Est. PnL">
        <div className={"flex flex-wrap items-baseline gap-x-1.5 leading-none ".concat(pnlClass)}>
          <span className={"text-base font-bold tabular-nums tracking-tight sm:text-lg ".concat(pnlClass)}>
            {fmtUsdSigned(props.estimatedPnlUsd)}
          </span>
          <span className={"text-xs font-semibold tabular-nums sm:text-sm ".concat(pnlClass)}>
            ({props.estimatedPnlPct >= 0 ? '+' : ''}
            {props.estimatedPnlPct.toFixed(1)}%)
          </span>
        </div>
      </ScenarioMetricCell>
      <div className={"grid min-w-0 gap-0.5 sm:gap-1 ".concat(eg ? 'grid-cols-4' : 'grid-cols-3')}>
        {eg ? (<ScenarioMetricCell label="State" density="compact" className="transition-all duration-300" style={props.exitFlash
                ? {
                    backgroundColor: "".concat(exitColor, "14"),
                    boxShadow: "inset 0 0 0 1px ".concat(exitColor, "40"),
                }
                : undefined}>
            <span className="truncate font-bold uppercase tracking-tight sm:tracking-[0.08em]" style={{
                color: exitColor,
                textShadow: props.exitFlash ? "0 0 8px ".concat(exitColor, "66") : undefined,
            }}>
              {eg.headline || '—'}
            </span>
          </ScenarioMetricCell>) : null}
        <ScenarioMetricCell label="Entry" density="compact">
          <span className="truncate font-semibold tabular-nums">${(0, formatQuote_1.formatQuoteNumber)(props.entry)}</span>
        </ScenarioMetricCell>
        <ScenarioMetricCell label="Liq" density="compact" valueClassName="text-amber-200/95">
          <span className="truncate font-semibold tabular-nums">
            {props.liqPrice != null ? "$".concat((0, formatQuote_1.formatQuoteNumber)(props.liqPrice)) : '—'}
          </span>
        </ScenarioMetricCell>
        <ScenarioMetricCell label="ROI" density="compact" valueClassName={roiPct >= 0 ? 'text-[#00ffc8]' : 'text-rose-300'}>
          <span className="truncate font-bold tabular-nums">
            {roiPct >= 0 ? '+' : ''}
            {Math.round(roiPct)}%
          </span>
        </ScenarioMetricCell>
      </div>
    </div>);
}
function TradeStripManageHero(props) {
    var pnlClass = props.pnlUsd >= 0 ? 'text-[#00ffc8]' : 'text-rose-300';
    var eg = props.exitGuidance;
    var exitColor = eg ? exitStateColor(eg.state) : ACCENT;
    return (<div className="grid min-w-0 grid-cols-1 gap-1">
      <ScenarioMetricCell label="Open PnL">
        <div className={"flex flex-wrap items-baseline gap-x-1.5 leading-none ".concat(pnlClass)}>
          <span className={"text-base font-bold tabular-nums sm:text-lg ".concat(pnlClass)}>
            {fmtUsdSigned(props.pnlUsd)}
          </span>
          <span className={"text-xs font-semibold tabular-nums sm:text-sm ".concat(pnlClass)}>
            ({props.pnlPct >= 0 ? '+' : ''}
            {props.pnlPct.toFixed(1)}%)
          </span>
        </div>
      </ScenarioMetricCell>
      <div className={"grid min-w-0 gap-0.5 sm:gap-1 ".concat(eg ? 'grid-cols-4' : 'grid-cols-3')}>
        {eg ? (<ScenarioMetricCell label="State" density="compact" className="transition-all duration-300" style={props.exitFlash
                ? {
                    backgroundColor: "".concat(exitColor, "14"),
                    boxShadow: "inset 0 0 0 1px ".concat(exitColor, "40"),
                }
                : undefined}>
            <span className="truncate font-bold uppercase tracking-tight sm:tracking-[0.08em]" style={{
                color: exitColor,
                textShadow: props.exitFlash ? "0 0 8px ".concat(exitColor, "66") : undefined,
            }}>
              {eg.headline || '—'}
            </span>
          </ScenarioMetricCell>) : null}
        <ScenarioMetricCell label="Pair" density="compact">
          <span className="truncate font-semibold">{props.pair}</span>
        </ScenarioMetricCell>
        <ScenarioMetricCell label="Entry" density="compact">
          <span className="truncate font-semibold tabular-nums">${(0, formatQuote_1.formatQuoteNumber)(props.entry)}</span>
        </ScenarioMetricCell>
        <ScenarioMetricCell label="Mark" density="compact">
          <span className="truncate font-semibold tabular-nums">${(0, formatQuote_1.formatQuoteNumber)(props.mark)}</span>
        </ScenarioMetricCell>
      </div>
    </div>);
}
function exitConfidenceColor(label) {
    if (label === 'High')
        return CONF_HIGH;
    if (label === 'Medium')
        return CONF_MED;
    return CONF_LOW;
}
function entryTimingStroke(state) {
    if (state === 'ready')
        return ACCENT;
    if (state === 'developing')
        return CONF_MED;
    if (state === 'early')
        return '#7dd3fc';
    return CONF_LOW;
}
function ExitAutomationMicroSummary(props) {
    var strat = props.exitAiMode === 'manual' ? '—' : aiExitAutomation_1.EXIT_STRATEGY_LABEL[props.strategyPreset];
    var confColor = exitConfidenceColor(props.guidance.confidenceLabel);
    var stateColor = exitStateColor(props.guidance.state);
    var modeLabel = aiExitAutomation_1.EXIT_AI_MODE_LABEL[props.exitAiMode];
    var showHeadlinePrefix = props.guidance.state !== 'trim' &&
        props.guidance.state !== 'exit' &&
        props.guidance.headline.length > 0;
    var ariaSummary = "Exit automation: ".concat(modeLabel, ", strategy ").concat(strat, ". ").concat(showHeadlinePrefix ? "".concat(props.guidance.headline, ". ") : '', "Next: ").concat(props.nextPlanned, ". Confidence ").concat(props.guidance.confidenceLabel, ".");
    return (<div role="status" aria-label={ariaSummary} className="rounded border border-white/[0.06] bg-white/[0.02] px-1 py-[3px] sm:py-0.5">
      <p className="truncate text-[6px] font-medium leading-none text-sigflo-muted sm:text-[7px]">
        <span className="font-semibold uppercase tracking-[0.12em]">Mode</span>{' '}
        <span className="normal-case tracking-tight text-sigflo-text/95">{modeLabel}</span>
        <span className="mx-0.5 text-white/18">·</span>
        <span className="font-semibold uppercase tracking-[0.12em]">Strat</span>{' '}
        <span className="normal-case tracking-tight text-sigflo-text/88">{strat}</span>
      </p>
      <p className="mt-0.5 truncate text-[9px] leading-snug text-sigflo-muted sm:text-[10px]">
        {showHeadlinePrefix ? (<>
            <span className="font-bold uppercase tracking-[0.08em]" style={{ color: stateColor }}>
              {props.guidance.headline}
            </span>
            <span className="mx-0.5 text-white/15">·</span>
          </>) : null}
        <span className="font-medium normal-case tracking-tight text-sigflo-text/88">{props.nextPlanned}</span>
        <span className="mx-0.5 text-white/15">·</span>
        <span className="font-semibold uppercase tracking-[0.1em]" style={{ color: confColor }}>
          {props.guidance.confidenceLabel}
        </span>
      </p>
    </div>);
}
function ExitGuidanceExpandedBlock(_a) {
    var eg = _a.eg;
    if (!eg)
        return null;
    var stroke = exitStateColor(eg.state);
    var confColor = exitConfidenceColor(eg.confidenceLabel);
    return (<div className="min-h-0 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 transition-colors duration-300" style={{ boxShadow: "inset 0 0 0 1px ".concat(stroke, "22") }}>
      <p className="mb-1 text-[8px] font-bold uppercase tracking-[0.12em]" style={{ color: stroke }}>
        Exit guidance
      </p>
      <dl className="space-y-1 text-[10px] leading-snug text-white">
        <div>
          <dt className="text-[8px] uppercase tracking-wider text-sigflo-muted">Suggested action</dt>
          <dd className="font-semibold text-white/95">{eg.action}</dd>
        </div>
        <div>
          <dt className="text-[8px] uppercase tracking-wider text-sigflo-muted">Reason</dt>
          <dd className="text-white/85">{eg.reason}</dd>
        </div>
        <div>
          <dt className="text-[8px] uppercase tracking-wider text-sigflo-muted">Confidence</dt>
          <dd className="font-semibold" style={{ color: confColor }}>
            {eg.confidenceLabel}
          </dd>
        </div>
      </dl>
    </div>);
}
function EntryGuidanceExpandedBlock(_a) {
    var g = _a.g;
    var stroke = entryTimingStroke(g.timingState);
    var confColor = exitConfidenceColor(g.confidenceLabel);
    return (<div className="min-h-0 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 transition-colors duration-300" style={{ boxShadow: "inset 0 0 0 1px ".concat(stroke, "22") }}>
      <p className="mb-1 text-[8px] font-bold uppercase tracking-[0.12em]" style={{ color: stroke }}>
        Entry guidance
      </p>
      <p className="mb-1 text-[9px] font-semibold leading-tight" style={{ color: stroke }}>
        Timing: {g.timingLabel}
      </p>
      {g.timingHelperText ? (<p className="mb-1 text-[9px] leading-snug text-sigflo-muted/90">{g.timingHelperText}</p>) : null}
      {g.executionSummary ? (<p className="mb-1 text-[9px] leading-snug text-white/80">{g.executionSummary}</p>) : null}
      <dl className="space-y-1 text-[10px] leading-snug text-white">
        <div>
          <dt className="text-[8px] uppercase tracking-wider text-sigflo-muted">Suggested action</dt>
          <dd className="font-semibold text-white/95">{g.action}</dd>
        </div>
        <div>
          <dt className="text-[8px] uppercase tracking-wider text-sigflo-muted">Reason</dt>
          <dd className="text-white/85">{g.reason}</dd>
        </div>
        <div>
          <dt className="text-[8px] uppercase tracking-wider text-sigflo-muted">Confidence</dt>
          <dd className="font-semibold" style={{ color: confColor }}>
            {g.confidenceLabel}
          </dd>
        </div>
      </dl>
    </div>);
}
function TradeScenarioPanelTrade(props) {
    return (<div className="flex flex-col gap-1.5 text-white">
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        <ExitGuidanceExpandedBlock eg={props.exitGuidance}/>
        <EntryGuidanceExpandedBlock g={props.entryGuidance}/>
      </div>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
      <ScenarioMetricCell label="Size">
        <span className="tabular-nums">${Math.round(props.positionSizeUsd).toLocaleString('en-US')}</span>
      </ScenarioMetricCell>
      <ScenarioMetricCell label="Leverage">
        <span className="tabular-nums">{props.isFutures ? "".concat(props.leverage, "x") : '1× spot'}</span>
      </ScenarioMetricCell>
      <ScenarioMetricCell label="Margin">
        <span className="tabular-nums">${Math.round(props.marginUsd).toLocaleString('en-US')}</span>
      </ScenarioMetricCell>
      <ScenarioMetricCell label="Est. fee (rt)">
        <span className="tabular-nums">${props.estFeeUsd.toFixed(2)}</span>
      </ScenarioMetricCell>
      <ScenarioMetricCell label="Entry">
        <span className="font-semibold tabular-nums">
          <span className="text-sigflo-muted/80">$</span>
          {(0, formatQuote_1.formatQuoteNumber)(props.entry)}
        </span>
      </ScenarioMetricCell>
      <ScenarioMetricCell label="Stop" valueClassName="text-rose-200/95">
        <span className="font-semibold tabular-nums">
          <span className="text-sigflo-muted/80">$</span>
          {(0, formatQuote_1.formatQuoteNumber)(props.stop)}
        </span>
      </ScenarioMetricCell>
      <ScenarioMetricCell label="Target" className="col-span-2 sm:col-span-3" valueClassName="text-emerald-200/95">
        <span className="font-semibold tabular-nums">
          <span className="text-sigflo-muted/80">$</span>
          {(0, formatQuote_1.formatQuoteNumber)(props.target)}
        </span>
      </ScenarioMetricCell>
      {props.liqPrice != null ? (<div className="col-span-2 rounded-md border border-amber-500/25 bg-amber-500/[0.08] px-2 py-1.5 shadow-[inset_0_1px_0_0_rgba(251,191,36,0.06)] sm:col-span-3">
          <p className="text-[8px] font-semibold uppercase tracking-wider text-amber-200/85">Est. liquidation</p>
          <p className="mt-0.5 font-bold tabular-nums text-amber-100">
            <span className="text-amber-200/70">$</span>
            {(0, formatQuote_1.formatQuoteNumber)(props.liqPrice)}
          </p>
        </div>) : null}
      <div className="col-span-2 grid grid-cols-2 gap-1.5 sm:col-span-3 sm:grid-cols-4">
        <ScenarioMetricCell label="PnL @ target" valueClassName="text-emerald-300">
          <span className="tabular-nums">{fmtUsdSigned(props.targetProfitUsd)}</span>
        </ScenarioMetricCell>
        <ScenarioMetricCell label="PnL @ stop" valueClassName="text-rose-300">
          <span className="tabular-nums">{fmtUsdSigned(props.stopLossUsd)}</span>
        </ScenarioMetricCell>
        <ScenarioMetricCell label="R:R" valueClassName="font-semibold tabular-nums text-[#00ffc8]">
          1:{props.riskReward >= 10 ? props.riskReward.toFixed(0) : props.riskReward.toFixed(1)}
        </ScenarioMetricCell>
        <ScenarioMetricCell label="Scores">
          <span className="tabular-nums text-white">
            {props.tradeScore} <span className="text-sigflo-muted">/</span> {props.setupScore}
          </span>
        </ScenarioMetricCell>
      </div>
    </div>
    </div>);
}
function TradeScenarioPanelManage(props) {
    return (<div className="flex flex-col gap-1.5 text-white">
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        <ExitGuidanceExpandedBlock eg={props.exitGuidance}/>
        <EntryGuidanceExpandedBlock g={props.entryGuidance}/>
      </div>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
      <ScenarioMetricCell label="Pair">
        <span className="truncate font-semibold">{props.pair}</span>
      </ScenarioMetricCell>
      <ScenarioMetricCell label="Side">
        <span className={"font-bold uppercase ".concat(props.side === 'long' ? 'text-emerald-300' : 'text-rose-300')}>
          {props.side}
        </span>
      </ScenarioMetricCell>
      <ScenarioMetricCell label="Leverage">
        <span className="tabular-nums">{props.isFutures ? "".concat(props.leverage, "\u00D7") : '1× spot'}</span>
      </ScenarioMetricCell>
      <ScenarioMetricCell label="Entry">
        <span className="font-semibold tabular-nums">
          <span className="text-sigflo-muted/80">$</span>
          {(0, formatQuote_1.formatQuoteNumber)(props.entry)}
        </span>
      </ScenarioMetricCell>
      <ScenarioMetricCell label="Mark">
        <span className="font-semibold tabular-nums">
          <span className="text-sigflo-muted/80">$</span>
          {(0, formatQuote_1.formatQuoteNumber)(props.mark)}
        </span>
      </ScenarioMetricCell>
      <ScenarioMetricCell label="Size" className="col-span-2">
        <span className="font-semibold">{props.sizeLabel}</span>
      </ScenarioMetricCell>
    </div>
    </div>);
}
