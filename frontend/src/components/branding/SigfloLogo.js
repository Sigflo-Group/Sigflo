"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SigfloLogo = SigfloLogo;
var MARK_SRC = "".concat(import.meta.env.BASE_URL, "sigflo-mark.png");
function SigfloLogo(_a) {
    var _b = _a.size, size = _b === void 0 ? 30 : _b, _c = _a.glowing, glowing = _c === void 0 ? false : _c, _d = _a.className, className = _d === void 0 ? '' : _d;
    return (<div className={"relative inline-flex items-center justify-center ".concat(glowing ? 'drop-shadow-[0_0_14px_rgba(34,211,238,0.35)]' : '', " ").concat(className)} style={{ width: size, height: size }} aria-hidden>
      <img src={MARK_SRC} alt="" width={size} height={size} className="h-full w-full object-contain" draggable={false}/>
    </div>);
}
