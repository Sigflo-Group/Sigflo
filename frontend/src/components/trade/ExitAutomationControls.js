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
exports.ExitAutomationControls = ExitAutomationControls;
var react_1 = require("react");
var useHoldStepper_1 = require("@/hooks/useHoldStepper");
var aiExitAutomation_1 = require("@/lib/aiExitAutomation");
var MODES = ['manual', 'assisted', 'auto'];
var STRATEGIES = ['protect_profit', 'trend_follow', 'tight_risk', 'custom'];
var CUSTOM_SENSITIVITY_ROWS = [
    { key: 'stopMain', title: 'Near stop (main)', hint: '0–1 path to stop', min: 0.45, max: 0.95, step: 0.01, decimals: 2 },
    { key: 'stopMid', title: 'Near stop (mid)', hint: '0–1 mid path weight', min: 0.2, max: 0.8, step: 0.01, decimals: 2 },
    { key: 'stopPnl', title: 'Stop while PnL ≤', hint: '% (negative)', min: -1.5, max: -0.2, step: 0.05, decimals: 2 },
    { key: 'stopPnlSp', title: 'Stop PnL spread', hint: 'tightens with unrealized loss', min: 0.12, max: 0.6, step: 0.01, decimals: 2 },
    { key: 'trimMain', title: 'Near target (main)', hint: '0–1 path to target', min: 0.45, max: 0.95, step: 0.01, decimals: 2 },
    { key: 'trimMid', title: 'Near target (mid)', hint: '0–1 mid path weight', min: 0.2, max: 0.8, step: 0.01, decimals: 2 },
    { key: 'trimMom', title: 'Trim momentum', hint: 'trend/momentum blend', min: 0.15, max: 0.7, step: 0.01, decimals: 2 },
    { key: 'trimLo', title: 'Trim conservative', hint: 'lower path bias', min: 0.15, max: 0.7, step: 0.01, decimals: 2 },
    { key: 'trimPnl', title: 'Trim min profit', hint: '% gain before trims', min: 0.1, max: 0.85, step: 0.01, decimals: 2 },
];
function clampSafeguard(n, lo, hi) {
    return Math.min(hi, Math.max(lo, n));
}
function roundStep(n, decimals) {
    var p = Math.pow(10, decimals);
    return Math.round(n * p) / p;
}
/** Dark number field; spinners hidden — use paired stepper buttons instead. */
var safeguardInputInnerClass = 'min-h-[2.5rem] min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-sigflo-surface/95 px-2.5 py-2 text-left text-[12px] font-mono text-sigflo-text shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] outline-none transition placeholder:text-sigflo-muted/50 focus:border-sigflo-accent/30 focus:ring-1 focus:ring-sigflo-accent/15 [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';
/** Right-side up/down control (replaces hidden native spinners), dark-theme consistent. */
function SafeguardNumberRow(props) {
    var value = props.value, onChange = props.onChange, min = props.min, max = props.max, step = props.step, decimals = props.decimals, stepperAriaLabel = props.stepperAriaLabel;
    var atMin = value <= min + 1e-9;
    var atMax = value >= max - 1e-9;
    var valueRef = (0, react_1.useRef)(value);
    valueRef.current = value;
    var holdUp = (0, useHoldStepper_1.useHoldStepper)(function () {
        onChange(roundStep(clampSafeguard(valueRef.current + step, min, max), decimals));
    });
    var holdDown = (0, useHoldStepper_1.useHoldStepper)(function () {
        onChange(roundStep(clampSafeguard(valueRef.current - step, min, max), decimals));
    });
    return (<div className="mt-1 flex items-stretch gap-1">
      <input type="number" min={min} max={max} step={step} value={value} onChange={function (e) {
            var v = Number(e.target.value);
            if (!Number.isFinite(v))
                return;
            onChange(roundStep(clampSafeguard(v, min, max), decimals));
        }} className={safeguardInputInnerClass}/>
      <div className="flex w-9 shrink-0 flex-col overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.04] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]" role="group" aria-label={stepperAriaLabel}>
        <button type="button" aria-label="Increase value" disabled={atMax} className="flex min-h-[1.25rem] flex-1 select-none items-center justify-center border-b border-white/[0.06] text-sigflo-muted transition hover:bg-sigflo-accent/10 hover:text-sigflo-accent disabled:pointer-events-none disabled:opacity-25" {...(atMax ? {} : holdUp)}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M6 15l6-6 6 6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button type="button" aria-label="Decrease value" disabled={atMin} className="flex min-h-[1.25rem] flex-1 select-none items-center justify-center text-sigflo-muted transition hover:bg-sigflo-accent/10 hover:text-sigflo-accent disabled:pointer-events-none disabled:opacity-25" {...(atMin ? {} : holdDown)}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>);
}
function ExitAutomationControls(props) {
    var mode = props.mode, onModeChange = props.onModeChange, strategy = props.strategy, onStrategyChange = props.onStrategyChange, safeguards = props.safeguards, onSafeguardsChange = props.onSafeguardsChange, customStrategyThresholds = props.customStrategyThresholds, onCustomStrategyThresholdsMerge = props.onCustomStrategyThresholdsMerge, onResetCustomStrategyThresholds = props.onResetCustomStrategyThresholds, activity = props.activity, onClearActivity = props.onClearActivity, compactActivity = props.compactActivity, hasOpenPosition = props.hasOpenPosition, exitFlowState = props.exitFlowState, exitFlowNextPlanned = props.exitFlowNextPlanned;
    var _a = (0, react_1.useState)(false), safeguardsOpen = _a[0], setSafeguardsOpen = _a[1];
    var _b = (0, react_1.useState)(false), customSensitivityOpen = _b[0], setCustomSensitivityOpen = _b[1];
    var _c = (0, react_1.useState)(false), panelOpen = _c[0], setPanelOpen = _c[1];
    var showCustomSensitivity = mode !== 'manual' &&
        strategy === 'custom' &&
        customStrategyThresholds &&
        onCustomStrategyThresholdsMerge &&
        onResetCustomStrategyThresholds;
    return (<div className="mx-auto w-full max-w-lg rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
      <button type="button" onClick={function () { return setPanelOpen(function (o) { return !o; }); }} className="flex w-full items-start justify-between gap-1.5 text-left transition active:scale-[0.995]" aria-expanded={panelOpen} aria-controls="exit-ai-controls-body">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
            <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-sigflo-text">Exit AI</span>
            <span className="text-[7px] font-medium text-sigflo-muted">Optional</span>
          </div>
          {!panelOpen ? (<p className="mt-0.5 text-[8px] leading-tight text-sigflo-muted/95">
              <span className="font-semibold text-sigflo-text/90">{aiExitAutomation_1.EXIT_AI_MODE_LABEL[mode]}</span>
              {mode !== 'manual' ? (<>
                  <span className="text-white/25"> · </span>
                  {aiExitAutomation_1.EXIT_STRATEGY_LABEL[strategy]}
                </>) : null}
            </p>) : null}
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={"mt-0.5 shrink-0 text-sigflo-muted transition-transform duration-300 ".concat(panelOpen ? 'rotate-180' : '')} aria-hidden>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <div id="exit-ai-controls-body" className={"grid transition-[grid-template-rows] duration-300 ease-out ".concat(panelOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
        <div className="min-h-0 overflow-hidden">
          <div className="space-y-2 border-t border-white/[0.06] pt-2">
            <div className="flex rounded-lg border border-white/[0.06] bg-white/[0.02] p-px" role="tablist" aria-label="Exit mode">
              {MODES.map(function (m) {
            var on = mode === m;
            return (<button key={m} type="button" role="tab" aria-selected={on} onClick={function () { return onModeChange(m); }} className={"flex-1 rounded-md py-1 text-[9px] font-semibold uppercase tracking-wide transition sm:text-[10px] ".concat(on
                    ? 'bg-sigflo-accent/12 text-sigflo-accent ring-1 ring-sigflo-accent/25'
                    : 'text-sigflo-muted hover:text-sigflo-text')}>
                    {aiExitAutomation_1.EXIT_AI_MODE_LABEL[m]}
                  </button>);
        })}
            </div>
            <p className="text-[10px] leading-snug text-sigflo-muted/95 sm:text-[11px]">{aiExitAutomation_1.EXIT_AI_MODE_HELPER[mode]}</p>
            {mode !== 'manual' && hasOpenPosition === false ? (<p className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-2 py-1.5 text-[10px] leading-snug text-amber-200/90">
                Open a position first — exit actions activate once a trade is live.
              </p>) : null}
            {mode === 'assisted' && hasOpenPosition !== false && exitFlowState != null ? (<div className={"rounded-lg border px-2 py-1.5 text-[10px] leading-snug ".concat(exitFlowState === 'exit'
                ? 'border-rose-400/25 bg-rose-500/[0.08] text-rose-100/90'
                : exitFlowState === 'trim'
                    ? 'border-amber-400/25 bg-amber-500/[0.08] text-amber-100/90'
                    : 'border-cyan-400/20 bg-cyan-500/[0.06] text-cyan-100/90')}>
                <span className="font-semibold">
                  {exitFlowState === 'exit'
                ? '⚠ EXIT signal'
                : exitFlowState === 'trim'
                    ? '↗ TRIM signal'
                    : '● Watching'}
                </span>
                {exitFlowNextPlanned ? (<span className="ml-1 font-normal text-white/70">{exitFlowNextPlanned}</span>) : null}
                {(exitFlowState === 'trim' || exitFlowState === 'exit') ? (<p className="mt-1 text-[9px] font-medium text-white/60">
                    Confirm bar will appear above — scroll up to review and confirm.
                  </p>) : null}
              </div>) : null}

            {mode !== 'manual' ? (<div className="space-y-0.5">
                <p className="text-[7px] font-semibold uppercase tracking-wider text-sigflo-muted/90">Exit behavior</p>
                <div className="flex flex-wrap gap-0.5">
                  {STRATEGIES.map(function (s) {
                var on = strategy === s;
                return (<button key={s} type="button" onClick={function () { return onStrategyChange(s); }} title={aiExitAutomation_1.EXIT_STRATEGY_BLURB[s]} className={"rounded-md px-1.5 py-0.5 text-[7px] font-semibold transition ring-1 sm:px-2 sm:text-[8px] ".concat(on
                        ? 'bg-sigflo-accent/12 text-sigflo-accent ring-sigflo-accent/25'
                        : 'bg-white/[0.02] text-sigflo-muted ring-white/[0.06] hover:bg-white/[0.04] hover:text-sigflo-text')}>
                        {aiExitAutomation_1.EXIT_STRATEGY_LABEL[s]}
                      </button>);
            })}
                </div>
                <p className="text-[7px] leading-tight text-sigflo-muted/85 sm:text-[8px]">{aiExitAutomation_1.EXIT_STRATEGY_BLURB[strategy]}</p>
              </div>) : null}

            {showCustomSensitivity ? (<>
                <button type="button" onClick={function () { return setCustomSensitivityOpen(function (o) { return !o; }); }} className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1.5 text-left text-[8px] font-semibold text-sigflo-text transition hover:bg-white/[0.04]" aria-expanded={customSensitivityOpen}>
                  <span>Custom sensitivity</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={"shrink-0 text-sigflo-muted transition-transform duration-200 ".concat(customSensitivityOpen ? 'rotate-180' : '')} aria-hidden>
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {customSensitivityOpen ? (<div className="space-y-1.5 rounded-lg border border-white/[0.06] bg-[#13161c] px-2 py-2">
                    <p className="text-[7px] leading-tight text-sigflo-muted/90 sm:text-[8px]">
                      Tunable weights for <span className="font-semibold text-sigflo-text/90">Custom</span> exit behavior. Named presets use fixed curves.
                    </p>
                    {CUSTOM_SENSITIVITY_ROWS.map(function (row) { return (<label key={row.key} className="block text-[8px] text-sigflo-muted">
                        <span className="font-semibold uppercase tracking-wider text-sigflo-text/90">{row.title}</span>
                        <span className="mt-0.5 block text-[8px] text-sigflo-muted">{row.hint}</span>
                        <SafeguardNumberRow stepperAriaLabel={"Adjust ".concat(row.title)} value={customStrategyThresholds[row.key]} onChange={function (n) {
                    var _a;
                    return onCustomStrategyThresholdsMerge((_a = {}, _a[row.key] = n, _a));
                }} min={row.min} max={row.max} step={row.step} decimals={row.decimals}/>
                      </label>); })}
                    <button type="button" onClick={onResetCustomStrategyThresholds} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] py-1.5 text-[8px] font-semibold uppercase tracking-wider text-sigflo-muted transition hover:border-white/[0.12] hover:text-sigflo-text">
                      Reset custom sensitivity to defaults
                    </button>
                  </div>) : null}
              </>) : null}

            <button type="button" onClick={function () { return setSafeguardsOpen(function (o) { return !o; }); }} className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1.5 text-left text-[8px] font-semibold text-sigflo-text transition hover:bg-white/[0.04]" aria-expanded={safeguardsOpen}>
              <span>Safeguards</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={"shrink-0 text-sigflo-muted transition-transform duration-200 ".concat(safeguardsOpen ? 'rotate-180' : '')} aria-hidden>
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {safeguardsOpen ? (<div className="space-y-1.5 rounded-lg border border-white/[0.06] bg-[#13161c] px-2 py-2">
                <label className="block text-[8px] text-sigflo-muted">
                  <span className="font-semibold uppercase tracking-wider text-sigflo-text/90">Max loss before forced close</span>
                  <span className="mt-0.5 block text-[8px] text-sigflo-muted">% unrealized (e.g. 5 = −5%)</span>
                  <SafeguardNumberRow stepperAriaLabel="Adjust max loss percent" value={safeguards.maxLossPct} onChange={function (maxLossPct) { return onSafeguardsChange(__assign(__assign({}, safeguards), { maxLossPct: maxLossPct })); }} min={0.5} max={50} step={0.5} decimals={2}/>
                </label>
                <label className="block text-[8px] text-sigflo-muted">
                  <span className="font-semibold uppercase tracking-wider text-sigflo-text/90">Min profit before trims</span>
                  <span className="mt-0.5 block text-[8px] text-sigflo-muted">% unrealized gain required for auto / assisted trims</span>
                  <SafeguardNumberRow stepperAriaLabel="Adjust min profit before trims" value={safeguards.minProfitBeforeTrimPct} onChange={function (minProfitBeforeTrimPct) { return onSafeguardsChange(__assign(__assign({}, safeguards), { minProfitBeforeTrimPct: minProfitBeforeTrimPct })); }} min={0} max={25} step={0.05} decimals={2}/>
                </label>
                <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1.5 text-[9px] text-sigflo-text transition hover:bg-white/[0.04]">
                  <span>Allow partial exits</span>
                  <input type="checkbox" checked={safeguards.allowPartialExits} onChange={function (e) { return onSafeguardsChange(__assign(__assign({}, safeguards), { allowPartialExits: e.target.checked })); }} className="h-4 w-4 cursor-pointer rounded border border-white/20 bg-sigflo-surface accent-[#00FFC8] focus:ring-1 focus:ring-sigflo-accent/30 focus:ring-offset-0"/>
                </label>
                <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1.5 text-[9px] text-sigflo-text transition hover:bg-white/[0.04]">
                  <span>Allow full auto close</span>
                  <input type="checkbox" checked={safeguards.allowFullAutoClose} onChange={function (e) { return onSafeguardsChange(__assign(__assign({}, safeguards), { allowFullAutoClose: e.target.checked })); }} className="h-4 w-4 cursor-pointer rounded border border-white/20 bg-sigflo-surface accent-[#00FFC8] focus:ring-1 focus:ring-sigflo-accent/30 focus:ring-offset-0"/>
                </label>
                <button type="button" onClick={function () { return onSafeguardsChange(__assign({}, aiExitAutomation_1.DEFAULT_AUTOMATION_SAFEGUARDS)); }} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] py-1.5 text-[8px] font-semibold uppercase tracking-wider text-sigflo-muted transition hover:border-white/[0.12] hover:text-sigflo-text">
                  Reset safeguards to defaults
                </button>
              </div>) : null}

            {activity.length > 0 ? (<div className="border-t border-white/[0.06] pt-1.5">
                <div className="mb-0.5 flex items-center justify-between gap-2">
                  <span className="text-[7px] font-bold uppercase tracking-wider text-sigflo-muted">Activity</span>
                  {onClearActivity ? (<button type="button" onClick={onClearActivity} className="text-[8px] font-semibold text-sigflo-muted hover:text-white/75">
                      Clear
                    </button>) : null}
                </div>
                <ul className={"space-y-1 overflow-y-auto pr-0.5 text-[8px] leading-tight text-white/80 ".concat(compactActivity ? 'max-h-20' : 'max-h-32')}>
                  {__spreadArray([], activity, true).reverse().map(function (e) { return (<li key={e.id} className="flex gap-1.5 border-b border-white/[0.04] pb-1 last:border-0">
                      <span className="shrink-0 font-mono text-[8px] text-sigflo-muted">{(0, aiExitAutomation_1.formatActivityTime)(e.ts)}</span>
                      <span className="min-w-0 text-white/85">{e.message}</span>
                    </li>); })}
                </ul>
              </div>) : null}
          </div>
        </div>
      </div>
    </div>);
}
