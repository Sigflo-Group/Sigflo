"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineFocusCard = EngineFocusCard;
var engineFocusCopy_1 = require("@/components/engines/engineFocusCopy");
function EngineFocusCard(_a) {
    var engineId = _a.engineId;
    return (<section className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-sm">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">What it does</h2>
      <p className="mt-1.5 text-[13px] leading-snug text-zinc-300">{(0, engineFocusCopy_1.engineFocusLine)(engineId)}</p>
    </section>);
}
