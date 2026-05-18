"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pill = Pill;
var tones = {
    neutral: 'border-white/10 bg-white/[0.04] text-sigflo-muted',
    cyan: 'border-sigflo-accent/25 bg-sigflo-accentDim text-sigflo-accent',
    accent: 'border-sigflo-accent/25 bg-sigflo-accentDim text-sigflo-accent',
    green: 'border-emerald-400/25 bg-sigflo-profitDim text-emerald-200',
    red: 'border-rose-400/25 bg-sigflo-lossDim text-rose-200',
};
function Pill(_a) {
    var children = _a.children, _b = _a.tone, tone = _b === void 0 ? 'neutral' : _b, _c = _a.className, className = _c === void 0 ? '' : _c;
    return (<span className={"inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide ".concat(tones[tone], " ").concat(className)}>
      {children}
    </span>);
}
