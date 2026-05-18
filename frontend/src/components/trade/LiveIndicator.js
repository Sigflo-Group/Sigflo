"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveIndicator = LiveIndicator;
/**
 * Minimal live / triggered marker: small dot with optional restrained pulse + glow.
 * Pair with `uiSignalStateClasses().dot` for scanner-driven colors.
 */
function LiveIndicator(_a) {
    var _b = _a.pulse, pulse = _b === void 0 ? false : _b, dotClassName = _a.dotClassName, _c = _a.size, size = _c === void 0 ? 'md' : _c, label = _a.label, _d = _a.className, className = _d === void 0 ? '' : _d, _e = _a.pulseDurationSec, pulseDurationSec = _e === void 0 ? 2.4 : _e;
    var dim = size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2';
    var glowInset = size === 'md' ? 'inset-[-5px]' : 'inset-[-4px]';
    var blur = size === 'md' ? 'blur-[3px]' : 'blur-[2px]';
    var glowBg = size === 'md' ? 'bg-[#00ffc8]/18' : 'bg-[#00ffc8]/22';
    var dot = (<span className={"relative inline-flex ".concat(dim, " shrink-0 rounded-full ").concat(dotClassName)} aria-hidden/>);
    if (!pulse) {
        if (label == null)
            return dot;
        return (<span className={"inline-flex items-center gap-1 ".concat(className)}>
        {dot}
        {label}
      </span>);
    }
    return (<span className={"inline-flex items-center gap-1 ".concat(className)}>
      <span className={"relative flex ".concat(dim, " shrink-0")}>
        <span className={"absolute ".concat(glowInset, " rounded-full ").concat(glowBg, " ").concat(blur, " sigflo-live-pulse")} aria-hidden/>
        <span className={"absolute inline-flex h-full w-full animate-pulse-dot rounded-full ".concat(dotClassName)} style={{ animationDuration: "".concat(pulseDurationSec, "s") }} aria-hidden/>
        <span className={"relative inline-flex h-full w-full rounded-full ".concat(dotClassName)} aria-hidden/>
      </span>
      {label}
    </span>);
}
