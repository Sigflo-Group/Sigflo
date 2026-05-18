"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveBadge = LiveBadge;
function LiveBadge(_a) {
    var _b = _a.label, label = _b === void 0 ? 'IN PLAY' : _b, _c = _a.className, className = _c === void 0 ? '' : _c;
    return (<span className={"inline-flex items-center gap-1.5 rounded-full border border-sigflo-accent/25 bg-sigflo-accentDim px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sigflo-accent ".concat(className)}>
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-sigflo-accent [animation-duration:1.8s]"/>
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sigflo-accent"/>
      </span>
      {label}
    </span>);
}
