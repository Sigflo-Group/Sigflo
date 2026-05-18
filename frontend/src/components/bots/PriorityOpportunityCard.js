"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriorityOpportunityCard = PriorityOpportunityCard;
var sound_1 = require("@/utils/sound");
var botSystem_1 = require("@/types/botSystem");
function directionClass(direction) {
    return direction === 'LONG'
        ? 'border-emerald-300/35 bg-emerald-500/12 text-emerald-200'
        : 'border-rose-300/35 bg-rose-500/12 text-rose-200';
}
function glowClass(state) {
    return state === 'Ready' || state === 'Triggered' || state === 'Managing'
        ? 'ring-1 ring-[#00ffc8]/30 shadow-[0_0_24px_-16px_rgba(0,255,200,0.6)]'
        : '';
}
function PriorityOpportunityCard(_a) {
    var _b, _c, _d, _e, _f, _g;
    var opportunity = _a.opportunity, onReview = _a.onReview, onExplain = _a.onExplain, _h = _a.alertHighlight, alertHighlight = _h === void 0 ? false : _h, _j = _a.reviewLocked, reviewLocked = _j === void 0 ? false : _j;
    var tier = (0, botSystem_1.getScoreTier)(opportunity.score);
    var stateStyles = (0, botSystem_1.getStateStyles)(opportunity.state);
    var pulse = !alertHighlight && (opportunity.state === 'Ready' || opportunity.state === 'Triggered');
    return (<article className={"rounded-2xl border bg-white/[0.045] p-4 backdrop-blur transition ".concat(alertHighlight
            ? 'border-[#00ffc8]/50 animate-sigflo-highlight'
            : "border-white/10 ".concat(glowClass(opportunity.state)), " ").concat(pulse ? 'animate-[sigflo-entry-pulse_2.4s_ease-in-out_infinite]' : '')}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h2 className="text-base font-bold tracking-tight text-zinc-100">{opportunity.pair}</h2>
            <span className={"rounded-full border px-2 py-0.5 text-[10px] font-bold ".concat(directionClass(opportunity.direction))}>
              {opportunity.direction}
            </span>
            <span className="rounded-full border border-white/15 bg-black/30 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
              {opportunity.score} · {tier}
            </span>
          </div>
        </div>
        <span className={"inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ".concat(stateStyles.pill)}>
          <span className={"h-1.5 w-1.5 rounded-full ".concat(stateStyles.dot)}/>
          {(0, botSystem_1.stateLabel)(opportunity.state)}
        </span>
      </div>

      <p className="mt-3 text-sm font-semibold text-zinc-100">{opportunity.setupType}</p>
      <p className="mt-1 text-xs text-zinc-400">{opportunity.thesis}</p>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-xl border border-white/10 bg-black/25 px-2.5 py-2">
          <p className="text-zinc-500">Entry</p>
          <p className="mt-0.5 font-mono font-semibold text-zinc-100">{(_b = opportunity.entryZone) !== null && _b !== void 0 ? _b : opportunity.entryStatus}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/25 px-2.5 py-2">
          <p className="text-zinc-500">Invalidation</p>
          <p className="mt-0.5 font-mono font-semibold text-rose-200">{(_c = opportunity.invalidation) !== null && _c !== void 0 ? _c : 'Pending'}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/25 px-2.5 py-2">
          <p className="text-zinc-500">Targets</p>
          <p className="mt-0.5 font-mono font-semibold text-emerald-200">{(_e = (_d = opportunity.targets) === null || _d === void 0 ? void 0 : _d.join(' · ')) !== null && _e !== void 0 ? _e : 'Pending'}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/25 px-2.5 py-2">
          <p className="text-zinc-500">Timeframes</p>
          <p className="mt-0.5 font-semibold text-zinc-300">{(_g = (_f = opportunity.timeframeAlignment) === null || _f === void 0 ? void 0 : _f.join(' / ')) !== null && _g !== void 0 ? _g : 'Mixed'}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <button type="button" disabled={reviewLocked} onClick={function () {
            if (reviewLocked)
                return;
            (0, sound_1.playUiTapSound)();
            onReview === null || onReview === void 0 ? void 0 : onReview(opportunity.id);
        }} className={"rounded-xl px-3 py-2 text-xs font-bold transition active:scale-[0.98] ".concat(reviewLocked
            ? 'cursor-not-allowed border border-white/10 bg-white/[0.06] text-zinc-500'
            : 'bg-[#00ffc8] text-[#050505] hover:brightness-110')}>
          {reviewLocked ? 'Review locked' : 'Review trade'}
        </button>
        <button type="button" onClick={function () {
            (0, sound_1.playUiTapSound)();
            onExplain === null || onExplain === void 0 ? void 0 : onExplain(opportunity.id);
        }} className="text-xs font-semibold text-zinc-300 transition hover:text-zinc-100">
          Why this setup
        </button>
        <span className="ml-auto text-[10px] text-zinc-500">{(0, botSystem_1.formatFreshness)(opportunity.freshnessSec)}</span>
      </div>
    </article>);
}
exports.default = PriorityOpportunityCard;
