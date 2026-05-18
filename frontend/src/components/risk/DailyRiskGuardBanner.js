"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyRiskGuardBanner = DailyRiskGuardBanner;
function DailyRiskGuardBanner(_a) {
    var model = _a.model, _b = _a.showWhenNormal, showWhenNormal = _b === void 0 ? false : _b;
    if (model.status === 'normal' && !showWhenNormal)
        return null;
    if (model.status === 'warning') {
        return (<div role="status" className="rounded-xl border border-amber-400/20 bg-amber-500/[0.06] px-3 py-2 text-[11px] font-medium leading-snug text-amber-100/90">
        {model.message}
      </div>);
    }
    if (model.status === 'locked') {
        return (<div role="status" className="rounded-xl border border-zinc-500/25 bg-zinc-900/50 px-3 py-2.5 text-[11px] leading-snug text-zinc-200">
        <p className="font-semibold text-zinc-100">{model.message}</p>
        <p className="mt-1 text-[11px] font-medium text-zinc-300/95">New entries paused for today</p>
        <p className="mt-1.5 text-[10px] font-normal text-zinc-500">
          Setups remain readable; paper preview and open-position tools stay on.
        </p>
      </div>);
    }
    return (<div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[10px] text-zinc-500">
      {model.message}
    </div>);
}
