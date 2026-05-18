"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineDetailControls = EngineDetailControls;
var sound_1 = require("@/utils/sound");
function EngineDetailControls(_a) {
    var isPausedLocally = _a.isPausedLocally, onPauseToggle = _a.onPauseToggle, onViewForming = _a.onViewForming, onBackToBots = _a.onBackToBots;
    return (<section className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 backdrop-blur-sm">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Controls</h2>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button type="button" onClick={function () {
            (0, sound_1.playUiTapSound)();
            onPauseToggle();
        }} className={isPausedLocally
            ? 'rounded-xl border border-cyan-300/28 bg-cyan-500/10 px-3 py-2 text-center text-[12px] font-semibold text-cyan-200/95 transition hover:border-cyan-200/40 active:scale-[0.99] sm:min-w-[7.5rem]'
            : 'rounded-xl border border-amber-300/28 bg-amber-500/10 px-3 py-2 text-center text-[12px] font-semibold text-amber-200/95 transition hover:border-amber-200/40 active:scale-[0.99] sm:min-w-[7.5rem]'}>
          {isPausedLocally ? 'Resume' : 'Pause'}
        </button>
        <button type="button" onClick={function () {
            (0, sound_1.playUiTapSound)();
            onViewForming();
        }} className="rounded-xl border border-[#00ffc8]/22 bg-[rgba(0,255,200,0.07)] px-3 py-2 text-center text-[12px] font-semibold text-[#9fe8d6] transition hover:border-[#00ffc8]/35 active:scale-[0.99] sm:min-w-[7.5rem]">
          View forming setups
        </button>
        <button type="button" onClick={function () {
            (0, sound_1.playUiTapSound)();
            onBackToBots();
        }} className="rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-center text-[12px] font-semibold text-zinc-200 transition hover:border-white/18 active:scale-[0.99] sm:min-w-[7.5rem]">
          Back to Bots
        </button>
      </div>
      <p className="mt-2 text-[10px] leading-snug text-zinc-600">
        Pause is local to this device. It does not stop backend jobs, exchange connectivity, or automation you may run
        elsewhere.
      </p>
    </section>);
}
