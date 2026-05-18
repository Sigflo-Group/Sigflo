"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradePlanCornerStats = TradePlanCornerStats;
var tradePlanOverlayGeometry_1 = require("@/lib/tradePlanOverlayGeometry");
function fmtPct(n) {
    return "".concat(n >= 0 ? '+' : '').concat(n.toFixed(2), "%");
}
function TradePlanCornerStats(_a) {
    var entry = _a.entry, stop = _a.stop, target = _a.target, lastPrice = _a.lastPrice, riskReward = _a.riskReward, _b = _a.className, className = _b === void 0 ? '' : _b, style = _a.style;
    var refPx = Math.abs(entry) > 0 ? Math.abs(entry) : 1;
    var pctStop = (0, tradePlanOverlayGeometry_1.pctToLevel)(lastPrice, stop, refPx);
    var pctTarget = (0, tradePlanOverlayGeometry_1.pctToLevel)(lastPrice, target, refPx);
    var rr = Number.isFinite(riskReward) && riskReward > 0 ? riskReward : null;
    return (<div className={"rounded-lg border border-white/[0.1] bg-[#0c0c0f] py-1 pl-[18px] pr-2 text-[8px] font-semibold leading-snug text-sigflo-muted shadow-lg ".concat(className)} style={style} aria-hidden>
      <div className="tabular-nums text-white/90">
        <span className="text-rose-200/90">Stop</span> {fmtPct(pctStop)}
        <span className="mx-1 text-white/25">·</span>
        <span className="text-emerald-200/90">Tgt</span> {fmtPct(pctTarget)}
      </div>
      {rr != null ? (<div className="mt-0.5 text-[7px] font-bold uppercase tracking-wide text-cyan-200/90">
          R:R {rr.toFixed(2)} : 1
        </div>) : null}
    </div>);
}
