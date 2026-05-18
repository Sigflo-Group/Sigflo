"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Card = Card;
function Card(_a) {
    var _b = _a.className, className = _b === void 0 ? '' : _b, children = _a.children, _c = _a.panelTexture, panelTexture = _c === void 0 ? true : _c, rest = __rest(_a, ["className", "children", "panelTexture"]);
    return (<div className={"rounded-2xl border border-white/[0.06] bg-sigflo-surface shadow-card ".concat(panelTexture ? 'relative overflow-hidden' : '', " ").concat(className)} {...rest}>
      {panelTexture ? (<>
          <span className="sigflo-panel-grid-overlay" aria-hidden/>
          {/* Real box (not display:contents) so z-index stacks above the grid overlay in all browsers */}
          <div className="relative z-[1] min-h-0 min-w-full">{children}</div>
        </>) : (children)}
    </div>);
}
