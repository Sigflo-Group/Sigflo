"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskReviewCard = RiskReviewCard;
var framer_motion_1 = require("framer-motion");
var botSystem_1 = require("@/types/botSystem");
function readinessCopy(state) {
    var s = state.replace(/[\s_]/g, '').toLowerCase();
    if (s === 'ready' || s === 'triggered' || s === 'managing')
        return 'Reviewable';
    if (s === 'building' || s === 'watching')
        return 'Wait for confirmation';
    if (s === 'coolingoff' || s === 'invalidated')
        return 'Do not enter';
    if (s === 'completed')
        return 'Closed — review only';
    return 'Assess carefully';
}
function riskTone(label) {
    if (label === 'Low')
        return 'text-[#00ffc8]/90';
    if (label === 'High')
        return 'text-amber-200/90';
    return 'text-amber-200/90';
}
function RiskReviewCard(_a) {
    var score = _a.score, riskLabel = _a.riskLabel, state = _a.state, userRiskMode = _a.userRiskMode, maxRiskPerTradePct = _a.maxRiskPerTradePct, maxOpenPositions = _a.maxOpenPositions, allowLiveExecution = _a.allowLiveExecution, _b = _a.reviewOnlyFromBotsPath, reviewOnlyFromBotsPath = _b === void 0 ? false : _b, requireConfirmation = _a.requireConfirmation, monitoredOpenCount = _a.monitoredOpenCount;
    var tier = score != null && Number.isFinite(score) ? (0, botSystem_1.getScoreTier)(score) : null;
    var profile = userRiskMode != null && maxRiskPerTradePct != null && maxOpenPositions != null;
    return (<framer_motion_1.motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: 0.12, ease: [0.22, 1, 0.36, 1] }} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-sm">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Risk read</h2>
      <dl className="mt-2 space-y-2 text-xs">
        <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-2">
          <dt className="text-zinc-500">Setup risk label</dt>
          <dd className={"font-semibold ".concat(riskTone(riskLabel))}>{riskLabel !== null && riskLabel !== void 0 ? riskLabel : '—'}</dd>
        </div>
        <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-2">
          <dt className="text-zinc-500">Setup score tier</dt>
          <dd className="font-medium text-zinc-200">{tier !== null && tier !== void 0 ? tier : '—'}</dd>
        </div>
        {profile ? (<>
            <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-2">
              <dt className="text-zinc-500">Your risk mode</dt>
              <dd className="font-medium text-zinc-100">{userRiskMode} mode</dd>
            </div>
            <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-2">
              <dt className="text-zinc-500">Max risk per trade</dt>
              <dd className="font-mono font-medium text-zinc-200">
                {Number(maxRiskPerTradePct.toFixed(2))}% max risk per trade
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-2">
              <dt className="text-zinc-500">Max open positions</dt>
              <dd className="font-mono font-medium text-zinc-200">
                {monitoredOpenCount !== null && monitoredOpenCount !== void 0 ? monitoredOpenCount : '—'} open · cap {maxOpenPositions}
              </dd>
            </div>
            <div className="space-y-1.5 border-b border-white/[0.06] pb-2 pt-0.5">
              <dt className="text-zinc-500">Execution readiness</dt>
              <dd className="space-y-1 text-[11px] font-normal leading-snug text-zinc-300">
                <p className="text-zinc-200">{readinessCopy(state)}</p>
                <p>
                  {!allowLiveExecution
                ? 'Live execution locked in Risk controls.'
                : reviewOnlyFromBotsPath
                    ? 'Live execution allowed in Risk controls — use standard Trade (not this Bots review URL) to send orders.'
                    : 'Live execution available in Risk controls.'}
                </p>
                {requireConfirmation ? <p>Confirmation required</p> : <p>Confirmation optional</p>}
              </dd>
            </div>
          </>) : (<div className="flex flex-col gap-0.5 pt-0.5 sm:flex-row sm:items-center sm:justify-between">
            <dt className="text-zinc-500">Execution readiness</dt>
            <dd className="font-medium text-zinc-100">{readinessCopy(state)}</dd>
          </div>)}
      </dl>
      <p className="mt-2 text-[10px] leading-snug text-zinc-500">
        Outcomes are not guaranteed. This is a structured read for review only.
      </p>
    </framer_motion_1.motion.section>);
}
