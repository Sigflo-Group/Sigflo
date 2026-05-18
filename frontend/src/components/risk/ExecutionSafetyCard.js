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
exports.ExecutionSafetyCard = ExecutionSafetyCard;
function ToggleRow(_a) {
    var label = _a.label, helper = _a.helper, checked = _a.checked, onChange = _a.onChange, disabled = _a.disabled;
    return (<label className={"flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-white/[0.07] bg-black/25 px-3 py-2.5 ".concat(disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-white/12')}>
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold text-zinc-200">{label}</span>
        <span className="mt-0.5 block text-[9px] leading-snug text-zinc-500">{helper}</span>
      </span>
      <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={function (e) {
            e.preventDefault();
            if (!disabled)
                onChange(!checked);
        }} className={"relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ".concat(checked ? 'bg-[#00ffc8]/35' : 'bg-zinc-700/80', " ").concat(disabled ? '' : 'hover:brightness-110')}>
        <span className={"absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ".concat(checked ? 'left-5' : 'left-0.5')}/>
      </button>
    </label>);
}
function ExecutionSafetyCard(_a) {
    var value = _a.value, onChange = _a.onChange;
    return (<section className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-3 backdrop-blur-sm sm:px-4 sm:py-3.5">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400">Execution safety</h2>
      <p className="mt-1 text-[10px] leading-snug text-zinc-500">
        These gates apply before Sigflo sends anything to your broker. You can keep live trading off while you learn
        the product.
      </p>
      <div className="mt-3 space-y-2">
        <ToggleRow label={value.allowLiveExecution ? 'Live execution enabled' : 'Live execution locked'} helper="When locked, Sigflo will not submit opening orders or TP/SL updates to the exchange. You can still review setups and paper flows." checked={value.allowLiveExecution} onChange={function (allowLiveExecution) { return onChange(__assign(__assign({}, value), { allowLiveExecution: allowLiveExecution })); }}/>
        <ToggleRow label="Require confirmation before orders" helper="Adds an explicit confirm step in trading flows (where supported)." checked={value.requireConfirmation} onChange={function (requireConfirmation) { return onChange(__assign(__assign({}, value), { requireConfirmation: requireConfirmation })); }}/>
        <ToggleRow label="Paper mode by default" helper="Prefer paper-style review until you choose otherwise." checked={value.paperModeDefault} onChange={function (paperModeDefault) { return onChange(__assign(__assign({}, value), { paperModeDefault: paperModeDefault })); }}/>
      </div>
    </section>);
}
