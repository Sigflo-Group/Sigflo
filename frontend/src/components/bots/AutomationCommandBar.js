"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationCommandBar = AutomationCommandBar;
var react_router_dom_1 = require("react-router-dom");
function healthColor(health) {
    if (health === 'Healthy')
        return 'bg-[#00ffc8]';
    if (health === 'Degraded')
        return 'bg-amber-300';
    return 'bg-rose-400';
}
function AutomationCommandBar(_a) {
    var _b;
    var model = _a.model, _c = _a.setupReadyFlashKey, setupReadyFlashKey = _c === void 0 ? 0 : _c, _d = _a.setupReadyBanner, setupReadyBanner = _d === void 0 ? null : _d;
    return (<section className="rounded-2xl border border-white/10 bg-white/[0.045] px-3 py-2.5 backdrop-blur">
      <div className="flex items-center gap-2 text-[11px] font-semibold text-zinc-300">
        <span key={setupReadyFlashKey} className={"inline-flex h-1.5 w-1.5 shrink-0 rounded-full ".concat(healthColor(model.systemHealth), " ").concat(setupReadyFlashKey > 0 ? 'sigflo-cmdbar-ready-pulse' : '')}/>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate">
            {model.automationMode} · {model.riskMode} risk · {(_b = model.liveExecutionLine) !== null && _b !== void 0 ? _b : 'Live locked'}
          </span>
          <span className="truncate font-normal text-zinc-500">
            {model.capitalDeployedPct}% deployed · {model.exchange}
          </span>
          {model.riskGuardLine ? (<span className="truncate font-normal text-zinc-500">{model.riskGuardLine}</span>) : null}
        </span>
      </div>
      {setupReadyBanner ? (<p className="mt-1.5 text-[10px] font-medium text-[#a8e8d8] transition-opacity duration-300">{setupReadyBanner}</p>) : null}
      <div className="mt-2 flex justify-end border-t border-white/[0.08] pt-2">
        <react_router_dom_1.Link to="/risk" className="text-[10px] font-semibold uppercase tracking-wide text-[#7ee8d3] underline-offset-2 transition hover:text-[#b8f5e6] hover:underline">
          Risk controls
        </react_router_dom_1.Link>
      </div>
    </section>);
}
exports.default = AutomationCommandBar;
