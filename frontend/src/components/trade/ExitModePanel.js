"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExitModePanel = ExitModePanel;
/**
 * Groups AI exit / automation controls with state-aware framing in live trade mode.
 */
function ExitModePanel(_a) {
    var live = _a.live, children = _a.children, footer = _a.footer, _b = _a.className, className = _b === void 0 ? '' : _b, _c = _a.showLiveBanner, showLiveBanner = _c === void 0 ? true : _c;
    var footerBlock = footer != null ? (<div className={"mt-2 border-t pt-2 ".concat(live ? 'border-[#00ffc8]/12' : 'border-white/[0.06]')}>{footer}</div>) : null;
    if (!live) {
        return (<div className={className}>
        {children}
        {footerBlock}
      </div>);
    }
    return (<div className={"rounded-xl bg-gradient-to-b from-[#00ffc8]/[0.04] to-black/20 p-2 sm:p-2.5 ".concat(className)}>
      {showLiveBanner ? (<p className="mb-1.5 text-[8px] font-extrabold uppercase tracking-[0.16em] text-[#7ee8d3]/85 sm:text-[9px]">
          Exit & automation
        </p>) : null}
      {children}
      {footerBlock}
    </div>);
}
