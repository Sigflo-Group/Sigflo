"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ActivePositionsStrip;
var formatQuote_1 = require("@/lib/formatQuote");
function ActivePositionsStrip(_a) {
    var positions = _a.positions, onSelectPosition = _a.onSelectPosition;
    if (positions.length === 0)
        return null;
    return (<div className="rounded-2xl border border-[#00ffc8]/16 bg-[rgba(0,255,200,0.04)] px-3 py-2.5 backdrop-blur-md">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <h3 className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#9fe8d6]">Active positions</h3>
        <p className="text-[8px] font-medium uppercase tracking-wide text-zinc-500">Suggestion only</p>
      </div>

      <div className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:thin]">
        {positions.map(function (p) {
            var _a;
            var pnlPositive = p.unrealizedPnl >= 0;
            var pnlClass = pnlPositive ? 'text-emerald-300' : 'text-rose-300';
            var dirLabel = p.direction === 'long' ? 'LONG' : 'SHORT';
            var pnlUsd = p.unrealizedPnl >= 0
                ? "+$".concat((0, formatQuote_1.formatQuoteNumber)(Math.abs(p.unrealizedPnl)))
                : "\u2212$".concat((0, formatQuote_1.formatQuoteNumber)(Math.abs(p.unrealizedPnl)));
            var roe = p.unrealizedPnlPct >= 0
                ? "+".concat(p.unrealizedPnlPct.toFixed(1), "%")
                : "".concat(p.unrealizedPnlPct.toFixed(1), "%");
            return (<button key={p.pairKey} type="button" onClick={function () { return onSelectPosition === null || onSelectPosition === void 0 ? void 0 : onSelectPosition(p.pairKey); }} className="group flex min-w-[9.5rem] max-w-[11.5rem] shrink-0 snap-start flex-col rounded-xl border border-white/12 bg-white/[0.06] px-2.5 py-2 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md transition hover:border-[#00ffc8]/35 hover:bg-white/[0.09] active:scale-[0.99]">
              <div className="flex items-center justify-between gap-1.5">
                <p className="truncate text-[10px] font-bold uppercase tracking-wide text-white/90">
                  {p.pairLabel} · {dirLabel}
                </p>
                <span className={"shrink-0 rounded border px-1 py-0.5 text-[7px] font-bold uppercase tracking-[0.08em] ".concat(p.sourceLabel === 'PAPER'
                    ? 'border-violet-300/35 bg-violet-500/12 text-violet-100'
                    : 'border-emerald-300/35 bg-emerald-500/12 text-emerald-100')}>
                  {(_a = p.sourceLabel) !== null && _a !== void 0 ? _a : (p.isPaper ? 'PAPER' : 'LIVE')}
                </span>
              </div>
              <p className={"mt-1 font-mono text-[11px] font-semibold tabular-nums ".concat(pnlClass)}>
                {pnlUsd} · {roe}
              </p>
              <p className="mt-1 text-[8px] font-semibold uppercase tracking-wide text-zinc-500">
                {p.isPaper ? 'Paper position' : 'Managing exits'}
              </p>
              <span className="mt-1.5 text-[8px] font-semibold text-[#7ee8d3] underline-offset-2 group-hover:underline">
                Review position
              </span>
            </button>);
        })}
      </div>
    </div>);
}
