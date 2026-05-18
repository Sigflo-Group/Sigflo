"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivePositionCard = ActivePositionCard;
var react_1 = require("react");
var formatQuote_1 = require("@/lib/formatQuote");
function formatDuration(openedAt, nowMs) {
    var s = Math.max(0, Math.floor((nowMs - openedAt) / 1000));
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = s % 60;
    if (h > 0)
        return "".concat(h, "h ").concat(m, "m");
    if (m > 0)
        return "".concat(m, "m ").concat(sec, "s");
    return "".concat(sec, "s");
}
function ActivePositionCard(_a) {
    var position = _a.position, liveMarkPrice = _a.liveMarkPrice, nowMs = _a.nowMs;
    var prevPnlRef = (0, react_1.useRef)(null);
    var mark = liveMarkPrice != null && Number.isFinite(liveMarkPrice) && liveMarkPrice > 0
        ? liveMarkPrice
        : position.markPrice;
    var pnlUsd = position.unrealizedPnl;
    var pnlPct = position.unrealizedPnlPct;
    (0, react_1.useEffect)(function () {
        prevPnlRef.current = pnlUsd;
    }, [pnlUsd]);
    var prev = prevPnlRef.current;
    var tickUp = prev != null && pnlUsd > prev + 0.01;
    var tickDown = prev != null && pnlUsd < prev - 0.01;
    var pnlPositive = pnlUsd >= 0;
    var pnlClass = pnlPositive ? 'text-emerald-300' : 'text-rose-300';
    var glowClass = tickUp
        ? 'shadow-[0_0_18px_-6px_rgba(52,211,153,0.4)]'
        : tickDown
            ? 'shadow-[0_0_18px_-6px_rgba(248,113,113,0.35)]'
            : pnlPositive
                ? 'shadow-[0_0_14px_-8px_rgba(52,211,153,0.18)]'
                : 'shadow-[0_0_14px_-8px_rgba(248,113,113,0.16)]';
    var sourceLabel = position.source === 'bybit' ? 'Bybit' : position.source === 'demo' ? 'Demo' : 'Manual';
    return (<div className={"rounded-xl border border-[#00ffc8]/22 bg-gradient-to-br from-black/55 to-black/40 px-2 py-2 transition-shadow duration-300 sm:px-2.5 sm:py-2.5 ".concat(glowClass)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-extrabold uppercase tracking-[0.12em] text-white/90">
            {position.pair}
          </p>
          <p className="mt-0.5 text-[9px] font-semibold text-sigflo-muted">
            <span className={position.direction === 'long' ? 'text-emerald-200/90' : 'text-rose-200/90'}>
              {position.direction.toUpperCase()}
            </span>
            <span className="mx-1.5 text-white/25">·</span>
            {formatDuration(position.openedAt, nowMs)} in trade
            <span className="mx-1.5 text-white/25">·</span>
            <span className="rounded border border-white/10 bg-white/[0.04] px-1 py-px font-mono text-[8px] uppercase tracking-wide text-zinc-300">
              {sourceLabel}
            </span>
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className={"font-mono text-[12px] font-bold tabular-nums sm:text-[13px] ".concat(pnlClass)}>
            {pnlUsd >= 0 ? '+' : ''}
            {(0, formatQuote_1.formatQuoteUsd)(pnlUsd)}
          </p>
          <p className={"font-mono text-[9px] tabular-nums ".concat(pnlClass)}>
            {pnlPct >= 0 ? '+' : ''}
            {pnlPct.toFixed(2)}% ROE
          </p>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-1 sm:grid-cols-3">
        <Cell label="Entry">{(0, formatQuote_1.formatQuoteNumber)(position.entryPrice)}</Cell>
        <Cell label="Mark">{(0, formatQuote_1.formatQuoteNumber)(mark)}</Cell>
        <Cell label="Size">{Math.abs(position.size).toFixed(4)}</Cell>
        <Cell label="Lev">{position.leverage}×</Cell>
        <Cell label="Margin">{position.marginMode}</Cell>
        <Cell label="Stop">{position.stopPrice != null ? (0, formatQuote_1.formatQuoteNumber)(position.stopPrice) : '—'}</Cell>
        <Cell label="Liq">{position.liquidationPrice != null ? (0, formatQuote_1.formatQuoteNumber)(position.liquidationPrice) : '—'}</Cell>
        <Cell label="Targets" className="sm:col-span-2">
          {position.targets.length
            ? position.targets.map(function (t) { return (0, formatQuote_1.formatQuoteNumber)(t); }).join(' · ')
            : '—'}
        </Cell>
      </div>
    </div>);
}
function Cell(_a) {
    var label = _a.label, children = _a.children, _b = _a.className, className = _b === void 0 ? '' : _b;
    return (<div className={"min-w-0 rounded-md border border-white/[0.06] bg-black/35 px-1.5 py-1 ".concat(className)}>
      <p className="truncate text-[7px] font-bold uppercase tracking-[0.1em] text-sigflo-muted">{label}</p>
      <p className="mt-0.5 truncate font-mono text-[10px] font-semibold tabular-nums text-white/92 sm:text-[11px]">
        {children}
      </p>
    </div>);
}
