"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotConsensusStrip = BotConsensusStrip;
var bots_1 = require("@/lib/bots");
/** Lightweight cross-agent stance row — trust / comparison, not execution. */
function BotConsensusStrip() {
    var rows = (0, bots_1.botPersonalityConsensusRows)();
    return (<section className="rounded-2xl border border-white/[0.06] bg-landing-surface p-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sigflo-muted">Agent lean (read only)</p>
      <p className="mt-1 text-[10px] leading-snug text-sigflo-muted/85">
        Each bot's default temperament on exits — suggestions only; you choose what to run.
      </p>
      <div className="mt-2.5 flex flex-col gap-1.5">
        {rows.map(function (_a) {
            var name = _a.name, stance = _a.stance;
            return (<div key={name} className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-sigflo-elevated px-2.5 py-2">
            <span className="text-xs font-semibold text-white/90">{name}</span>
            <span className="text-right text-[11px] font-medium text-[#7ee8d3]/95">{stance}</span>
          </div>);
        })}
      </div>
    </section>);
}
