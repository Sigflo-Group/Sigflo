"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineStatusCard = EngineStatusCard;
var framer_motion_1 = require("framer-motion");
var sound_1 = require("@/utils/sound");
function healthDot(health) {
    if (health === 'Healthy')
        return 'bg-[#00ffc8]';
    if (health === 'Degraded')
        return 'bg-amber-300';
    return 'bg-rose-400';
}
function stateLabel(state) {
    if (state === 'ManagingTrade')
        return 'Managing trade';
    if (state === 'ConnectionIssue')
        return 'Connection issue';
    if (state === 'RiskLimited')
        return 'Risk limited';
    if (state === 'CoolingOff')
        return 'Cooling off';
    if (state === 'Paused')
        return 'Paused';
    return state;
}
function AnimatedScanNumber(_a) {
    var value = _a.value, valueKey = _a.valueKey;
    return (<span className="inline-flex min-w-[1.5ch] justify-end tabular-nums font-semibold text-zinc-200">
      <framer_motion_1.AnimatePresence mode="wait" initial={false}>
        <framer_motion_1.motion.span key={valueKey} initial={{ opacity: 0.45, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0.25, y: -3 }} transition={{ duration: 0.24, ease: 'easeOut' }}>
          {value}
        </framer_motion_1.motion.span>
      </framer_motion_1.AnimatePresence>
    </span>);
}
function EngineStatusCard(_a) {
    var _b, _c, _d;
    var engine = _a.engine, intel = _a.intel, onView = _a.onView, onPauseToggle = _a.onPauseToggle, onViewForming = _a.onViewForming, _e = _a.isPausedLocally, isPausedLocally = _e === void 0 ? false : _e;
    var formingCount = (_b = intel === null || intel === void 0 ? void 0 : intel.setupsForming) !== null && _b !== void 0 ? _b : engine.liveCandidates;
    var formingTopSetups = (_c = intel === null || intel === void 0 ? void 0 : intel.formingTopSetups) !== null && _c !== void 0 ? _c : [];
    var latestBody = isPausedLocally
        ? 'Engine paused locally'
        : ((_d = intel === null || intel === void 0 ? void 0 : intel.latestActivityLine) === null || _d === void 0 ? void 0 : _d.trim()) || engine.latestOutput;
    var displayState = isPausedLocally ? 'Paused' : engine.state;
    return (<article className={"rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition-opacity duration-200 ".concat(isPausedLocally ? 'opacity-[0.72]' : '')}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-zinc-100">{engine.engineName}</p>
          <p className="text-[11px] text-zinc-400">{engine.strategyType}</p>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
          <span className={"h-1.5 w-1.5 rounded-full ".concat(healthDot(engine.health))}/>
          {engine.health}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
        <span className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-2 py-0.5 font-semibold text-cyan-200">
          {engine.mode}
        </span>
        <span className="rounded-full border border-white/10 bg-black/25 px-2 py-0.5 text-zinc-400">
          {stateLabel(displayState)}
        </span>
      </div>

      <div className="mt-2 space-y-1 text-[11px] text-zinc-400">
        <p>
          Scanning{' '}
          <AnimatedScanNumber value={engine.pairsWatched} valueKey={"pairs-".concat(engine.engineId, "-").concat(engine.pairsWatched)}/>{' '}
          pairs
        </p>
        <p>
          <AnimatedScanNumber value={formingCount} valueKey={"forming-".concat(engine.engineId, "-").concat(formingCount)}/>{' '}
          setup{formingCount === 1 ? '' : 's'} forming
        </p>
        {formingTopSetups.length > 0 ? (<ul className="mt-1 space-y-1.5 text-zinc-500">
            {formingTopSetups.map(function (item) { return (<li key={"".concat(item.pair, "-").concat(item.explanation)} className="rounded-lg border border-white/[0.06] bg-black/20 px-2 py-1">
                <p className="text-[11px] font-semibold text-zinc-300">{item.pair}</p>
                <p className="mt-0.5 text-[10px] leading-snug text-zinc-500">{item.explanation}</p>
              </li>); })}
          </ul>) : null}
      </div>

      <p className="mt-2 text-[11px] leading-snug text-zinc-500">
        Latest: <span className="text-zinc-400">{latestBody}</span>
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {onViewForming ? (<button type="button" onClick={function () {
                (0, sound_1.playUiTapSound)();
                onViewForming();
            }} className="rounded-lg border border-[#00ffc8]/25 bg-[#00ffc8]/8 px-2.5 py-1.5 text-[11px] font-semibold text-[#9fe8d6] transition hover:border-[#00ffc8]/40 hover:bg-[#00ffc8]/12 active:scale-[0.98]">
            View forming setups
          </button>) : null}
        <button type="button" onClick={function () {
            (0, sound_1.playUiTapSound)();
            onView === null || onView === void 0 ? void 0 : onView(engine.engineId);
        }} className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-200 transition hover:border-white/20 active:scale-[0.98]">
          View engine
        </button>
        <button type="button" onClick={function () {
            (0, sound_1.playUiTapSound)();
            onPauseToggle === null || onPauseToggle === void 0 ? void 0 : onPauseToggle(engine.engineId);
        }} className={isPausedLocally
            ? 'rounded-lg border border-cyan-300/30 bg-cyan-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-cyan-200 transition hover:border-cyan-200/45 active:scale-[0.98]'
            : 'rounded-lg border border-amber-300/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-amber-200 transition hover:border-amber-200/45 active:scale-[0.98]'}>
          {isPausedLocally ? 'Resume' : 'Pause'}
        </button>
      </div>
    </article>);
}
exports.default = EngineStatusCard;
