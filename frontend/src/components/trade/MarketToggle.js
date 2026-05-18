"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketToggle = MarketToggle;
function MarketToggle(_a) {
    var value = _a.value, onChange = _a.onChange, _b = _a.disabled, disabled = _b === void 0 ? false : _b;
    var options = [
        { id: 'futures', label: 'Futures' },
        { id: 'spot', label: 'Spot' },
    ];
    return (<div className={"flex rounded-xl border border-white/[0.06] bg-white/[0.02] p-0.5 ".concat(disabled ? 'opacity-50' : '')} role="tablist">
      {options.map(function (opt) {
            var active = value === opt.id;
            return (<button key={opt.id} type="button" role="tab" aria-selected={active} disabled={disabled} onClick={function () {
                    if (disabled)
                        return;
                    onChange(opt.id);
                }} className={"flex-1 rounded-lg py-1.5 text-[13px] font-semibold leading-none transition sm:text-sm ".concat(active ? 'bg-sigflo-accent/12 text-sigflo-accent ring-1 ring-sigflo-accent/25' : 'text-sigflo-muted hover:text-sigflo-text', " ").concat(disabled ? 'cursor-not-allowed' : '')}>
            {opt.label}
          </button>);
        })}
    </div>);
}
