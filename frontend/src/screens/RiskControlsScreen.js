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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RiskControlsScreen;
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var ExecutionSafetyCard_1 = require("@/components/risk/ExecutionSafetyCard");
var RiskLimitCard_1 = require("@/components/risk/RiskLimitCard");
var RiskModeSelector_1 = require("@/components/risk/RiskModeSelector");
var riskSettings_1 = require("@/services/risk/riskSettings");
function NumField(_a) {
    var value = _a.value, onCommit = _a.onCommit, min = _a.min, max = _a.max, step = _a.step, suffix = _a.suffix;
    return (<div className="flex items-center gap-2">
      <input type="number" min={min} max={max} step={step} value={Number.isFinite(value) ? value : min} onChange={function (e) { return onCommit(Number(e.target.value)); }} className="w-full max-w-[7rem] rounded-lg border border-white/12 bg-black/40 px-2 py-1.5 font-mono text-[12px] text-zinc-100 outline-none transition focus:border-[#00ffc8]/40"/>
      <span className="text-[10px] font-medium text-zinc-500">{suffix}</span>
    </div>);
}
function RiskControlsScreen() {
    var draft = (0, riskSettings_1.useRiskSettings)();
    var persist = (0, react_1.useCallback)(function (patch) {
        (0, riskSettings_1.saveRiskSettings)(__assign(__assign({}, (0, riskSettings_1.getRiskSettings)()), patch));
    }, []);
    var setMode = (0, react_1.useCallback)(function (riskMode) { return persist({ riskMode: riskMode }); }, [persist]);
    return (<div className="min-h-[100dvh] bg-[#050505] pb-24 pt-4">
      <div className="mx-auto w-full max-w-lg space-y-4 px-4">
        <react_router_dom_1.Link to="/bots" className="inline-block text-[10px] font-semibold uppercase tracking-wide text-[#7ee8d3] underline-offset-2 hover:underline">
          ← Bots
        </react_router_dom_1.Link>

        <header className="space-y-1.5">
          <h1 className="text-lg font-bold tracking-tight text-zinc-100">Risk controls</h1>
          <p className="text-[11px] leading-relaxed text-zinc-500">
            Set the limits Sigflo must respect before any trade is reviewed or executed.
          </p>
        </header>

        <RiskLimitCard_1.RiskLimitCard title="Risk mode" description="How assertive discovery and sizing cues should feel. Hard limits below always apply.">
          <RiskModeSelector_1.RiskModeSelector value={draft.riskMode} onChange={setMode}/>
        </RiskLimitCard_1.RiskLimitCard>

        <RiskLimitCard_1.RiskLimitCard title="Per-trade risk" description="Ceiling for how much of your plan Sigflo should treat as at stake on a single ticket.">
          <NumField value={draft.maxRiskPerTradePct} min={0.1} max={25} step={0.1} suffix="% (max)" onCommit={function (maxRiskPerTradePct) { return persist({ maxRiskPerTradePct: maxRiskPerTradePct }); }}/>
        </RiskLimitCard_1.RiskLimitCard>

        <RiskLimitCard_1.RiskLimitCard title="Daily loss limit" description="Soft cap for a single session — enforcement will respect this once portfolio sync lands.">
          <NumField value={draft.maxDailyLossPct} min={0.5} max={50} step={0.5} suffix="% (soft cap)" onCommit={function (maxDailyLossPct) { return persist({ maxDailyLossPct: maxDailyLossPct }); }}/>
        </RiskLimitCard_1.RiskLimitCard>

        <RiskLimitCard_1.RiskLimitCard title="Max open positions" description="How many concurrent tickets Sigflo should assume across pairs.">
          <NumField value={draft.maxOpenPositions} min={1} max={25} step={1} suffix="open" onCommit={function (maxOpenPositions) { return persist({ maxOpenPositions: maxOpenPositions }); }}/>
        </RiskLimitCard_1.RiskLimitCard>

        <ExecutionSafetyCard_1.ExecutionSafetyCard value={{
            allowLiveExecution: draft.allowLiveExecution,
            requireConfirmation: draft.requireConfirmation,
            paperModeDefault: draft.paperModeDefault,
        }} onChange={function (v) { return persist(v); }}/>

        <p className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[10px] leading-relaxed text-zinc-500">
          Nothing on this page places orders. Preferences are saved on this device only for now.
        </p>
      </div>
    </div>);
}
