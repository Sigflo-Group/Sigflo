"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpportunityRowCard = OpportunityRowCard;
var botSystem_1 = require("@/types/botSystem");
function OpportunityRowCard(_a) {
    var opportunity = _a.opportunity, onSelect = _a.onSelect, _b = _a.variant, variant = _b === void 0 ? 'default' : _b, _c = _a.alertHighlight, alertHighlight = _c === void 0 ? false : _c, _d = _a.reviewLocked, reviewLocked = _d === void 0 ? false : _d;
    var stateStyles = (0, botSystem_1.getStateStyles)(opportunity.state);
    var muted = variant === 'muted';
    return (<button type="button" disabled={reviewLocked} onClick={function () {
            if (reviewLocked)
                return;
            onSelect === null || onSelect === void 0 ? void 0 : onSelect(opportunity.id);
        }} className={"w-full rounded-2xl border p-3 text-left transition active:scale-[0.98] ".concat(reviewLocked
            ? 'cursor-not-allowed border-white/[0.07] bg-white/[0.02] opacity-[0.85]'
            : alertHighlight
                ? 'border-[#00ffc8]/50 bg-white/[0.05] animate-sigflo-highlight'
                : muted
                    ? 'border-white/[0.07] bg-white/[0.025] opacity-[0.92] hover:border-white/[0.1] hover:scale-[1.005]'
                    : 'border-white/10 bg-white/[0.04] hover:scale-[1.01] hover:border-white/20')}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className={"truncate text-sm font-bold ".concat(muted ? 'text-zinc-200/90' : 'text-zinc-100')}>
            {opportunity.pair} <span className="text-zinc-500">·</span>{' '}
            <span className={opportunity.direction === 'LONG'
            ? muted
                ? 'text-emerald-400/75'
                : 'text-emerald-300'
            : muted
                ? 'text-rose-400/75'
                : 'text-rose-300'}>
              {opportunity.direction}
            </span>
            <span className={"ml-2 text-xs font-semibold ".concat(muted ? 'text-zinc-500' : 'text-zinc-400')}>
              {opportunity.score} · {(0, botSystem_1.getScoreTier)(opportunity.score)}
            </span>
          </p>
        </div>
        <span className={"inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ".concat(muted ? 'border-white/[0.08] bg-white/[0.02] text-zinc-400' : stateStyles.pill)}>
          <span className={"h-1.5 w-1.5 rounded-full ".concat(muted ? 'bg-zinc-500' : stateStyles.dot)}/>
          {(0, botSystem_1.stateLabel)(opportunity.state)}
        </span>
      </div>
      <p className={"mt-1 truncate text-xs font-semibold ".concat(muted ? 'text-zinc-500' : 'text-zinc-300')}>{opportunity.setupType}</p>
      <p className={"mt-0.5 truncate text-[11px] ".concat(muted ? 'text-zinc-600' : 'text-zinc-500')}>{opportunity.rationale}</p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] text-zinc-500">
          {opportunity.entryStatus} · {(0, botSystem_1.formatFreshness)(opportunity.freshnessSec)}
        </p>
        {reviewLocked ? (<span className="shrink-0 rounded-md border border-white/10 bg-black/30 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-zinc-500">
            Review locked
          </span>) : null}
      </div>
    </button>);
}
exports.default = OpportunityRowCard;
