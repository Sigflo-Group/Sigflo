"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotAiActionRow = BotAiActionRow;
function BotAiActionRow(_a) {
    var activeAction = _a.activeAction, loading = _a.loading, copy = _a.copy, onRefineEntry = _a.onRefineEntry, onWhy = _a.onWhy, onImprove = _a.onImprove;
    return (<section className="mt-3 rounded-2xl border border-white/[0.06] bg-sigflo-surface sigflo-panel-texture p-3 opacity-0 [animation:fade-in-up_240ms_ease-out_200ms_forwards]">
      <div className="flex gap-2">
        <button type="button" onClick={onRefineEntry} className={"rounded-lg border border-white/[0.08] px-3 py-2 text-xs font-semibold transition active:scale-[0.98] ".concat(activeAction === 'entry' ? 'bg-[#00ffc8]/14 text-[#a8ffed]' : 'bg-white/[0.03] text-sigflo-text')}>
          Refine Entry ✨
        </button>
        <button type="button" onClick={onWhy} className={"rounded-lg border border-white/[0.08] px-3 py-2 text-xs font-semibold transition active:scale-[0.98] ".concat(activeAction === 'why' ? 'bg-cyan-500/14 text-cyan-200' : 'bg-white/[0.03] text-sigflo-text')}>
          Why?
        </button>
        <button type="button" onClick={onImprove} className={"rounded-lg border border-white/[0.08] px-3 py-2 text-xs font-semibold transition active:scale-[0.98] ".concat(activeAction === 'improve' ? 'bg-emerald-500/14 text-emerald-200' : 'bg-white/[0.03] text-sigflo-text')}>
          Improve
        </button>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-sigflo-muted">
        {loading ? 'Assistant refining...' : copy}
      </p>
    </section>);
}
