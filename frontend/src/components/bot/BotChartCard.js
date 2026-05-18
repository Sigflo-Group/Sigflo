"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotChartCard = BotChartCard;
var formatQuote_1 = require("@/lib/formatQuote");
function BotChartCard(props) {
    var lastPrice = props.lastPrice, chartW = props.chartW, chartH = props.chartH, area = props.area, path = props.path, lineColor = props.lineColor, showEntry = props.showEntry, showStop = props.showStop, showTarget = props.showTarget, showLiq = props.showLiq, showVol = props.showVol, onToggleVol = props.onToggleVol, onToggleEntry = props.onToggleEntry, onToggleStop = props.onToggleStop, onToggleTarget = props.onToggleTarget, onToggleLiq = props.onToggleLiq;
    return (<section className="mt-3 rounded-2xl border border-white/[0.07] bg-sigflo-surface sigflo-panel-texture p-3 opacity-0 [animation:fade-in-up_260ms_ease-out_forwards]">
      <div className="mb-2 flex items-center justify-between text-xs">
        <p className="text-sigflo-muted">Chart</p>
        <p className="font-semibold text-white">${(0, formatQuote_1.formatQuoteNumber)(lastPrice)}</p>
      </div>
      <div className="relative overflow-hidden rounded-lg border border-white/[0.05] bg-black/20 p-2">
        <svg viewBox={"0 0 ".concat(chartW, " ").concat(chartH)} className="h-[132px] w-full" aria-hidden>
          <defs>
            <linearGradient id="bot-focus-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.24"/>
              <stop offset="100%" stopColor={lineColor} stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d={area} fill="url(#bot-focus-area)"/>
          <path d={path} fill="none" stroke={lineColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {showEntry ? <div className="absolute inset-x-2 top-1/2 border-t border-[#00ffc8]/70 shadow-[0_0_10px_rgba(0,255,200,0.45)]"/> : null}
        {showStop ? <div className="absolute inset-x-2 top-[64%] border-t border-rose-400/45"/> : null}
        {showTarget ? <div className="absolute inset-x-2 top-[33%] border-t border-emerald-300/45"/> : null}
        {showLiq ? <div className="absolute inset-x-2 top-[75%] border-t border-amber-300/35"/> : null}
        <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
          <button type="button" onClick={onToggleVol} className={"rounded px-2 py-0.5 ".concat(showVol ? 'bg-cyan-500/14 text-cyan-200' : 'bg-white/[0.04] text-sigflo-muted')}>Vol</button>
          <button type="button" onClick={onToggleEntry} className={"rounded px-2 py-0.5 ".concat(showEntry ? 'bg-[#00ffc8]/14 text-[#a8ffed]' : 'bg-white/[0.04] text-sigflo-muted')}>Entry</button>
          <button type="button" onClick={onToggleStop} className={"rounded px-2 py-0.5 ".concat(showStop ? 'bg-rose-500/14 text-rose-200' : 'bg-white/[0.04] text-sigflo-muted')}>Stop</button>
          <button type="button" onClick={onToggleTarget} className={"rounded px-2 py-0.5 ".concat(showTarget ? 'bg-emerald-500/14 text-emerald-200' : 'bg-white/[0.04] text-sigflo-muted')}>Target</button>
          <button type="button" onClick={onToggleLiq} className={"rounded px-2 py-0.5 ".concat(showLiq ? 'bg-amber-500/14 text-amber-200' : 'bg-white/[0.04] text-sigflo-muted')}>Liq</button>
        </div>
      </div>
    </section>);
}
