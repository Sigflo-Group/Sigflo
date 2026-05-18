"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivePositionCard = ActivePositionCard;
var framer_motion_1 = require("framer-motion");
var react_1 = require("react");
var formatQuote_1 = require("@/lib/formatQuote");
function formatTimeInTrade(openedAtMs, nowMs) {
    var s = Math.max(0, Math.floor((nowMs - openedAtMs) / 1000));
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = s % 60;
    if (h > 0)
        return "".concat(h, "h ").concat(m, "m");
    if (m > 0)
        return "".concat(m, "m ").concat(sec, "s");
    return "".concat(sec, "s");
}
function pnlWithRoe(side, entry, mark, notionalUsd, marginUsd) {
    var e = Math.max(1e-12, entry);
    var dir = side === 'long' ? 1 : -1;
    var movePct = ((mark - e) / e) * 100 * dir;
    var pnlUsd = notionalUsd * (movePct / 100);
    var m = Math.max(1e-9, marginUsd);
    var roePct = (pnlUsd / m) * 100;
    return { pnlUsd: pnlUsd, roePct: roePct, movePct: movePct };
}
function StatCell(_a) {
    var label = _a.label, children = _a.children;
    return (<div className="min-w-0 rounded-md border border-white/[0.06] bg-black/35 px-1.5 py-1">
      <p className="truncate text-[7px] font-bold uppercase tracking-[0.1em] text-sigflo-muted">{label}</p>
      <div className="mt-0.5 truncate font-mono text-[10px] font-semibold tabular-nums leading-tight text-white/92 sm:text-[11px]">
        {children}
      </div>
    </div>);
}
function ActivePositionCard(_a) {
    var position = _a.position, markPrice = _a.markPrice, nowMs = _a.nowMs, exitAiModeLabel = _a.exitAiModeLabel, exitStrategyLabel = _a.exitStrategyLabel, scenarioSummary = _a.scenarioSummary, _b = _a.executionSource, executionSource = _b === void 0 ? 'exchange' : _b, exchangeUnrealizedUsd = _a.exchangeUnrealizedUsd;
    var prevPnlRef = (0, react_1.useRef)(null);
    var fromMark = pnlWithRoe(position.side, position.entryPrice, markPrice, position.positionNotionalUsd, position.marginUsd);
    var useExU = executionSource === 'exchange' &&
        exchangeUnrealizedUsd != null &&
        Number.isFinite(exchangeUnrealizedUsd);
    var pnlUsd = useExU ? exchangeUnrealizedUsd : fromMark.pnlUsd;
    var roePct = useExU && position.marginUsd > 0 ? (exchangeUnrealizedUsd / position.marginUsd) * 100 : fromMark.roePct;
    var movePct = fromMark.movePct;
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
    var nearStop = position.stopLossPrice != null &&
        Number.isFinite(position.stopLossPrice) &&
        Number.isFinite(markPrice) &&
        Math.abs(markPrice - position.stopLossPrice) / Math.max(markPrice, 1e-9) < 0.004;
    var nearTp = position.takeProfitPrice != null &&
        Number.isFinite(position.takeProfitPrice) &&
        Number.isFinite(markPrice) &&
        Math.abs(markPrice - position.takeProfitPrice) / Math.max(markPrice, 1e-9) < 0.004;
    var levelGlow = nearStop ? 'ring-1 ring-rose-400/25' : nearTp ? 'ring-1 ring-emerald-400/25' : '';
    var liveBadge = position.side === 'long' ? (<span className="inline-flex shrink-0 items-center gap-0.5 rounded border border-emerald-400/35 bg-emerald-500/[0.1] px-1 py-px text-[7px] font-extrabold uppercase tracking-wide text-emerald-200">
        <span className="relative flex h-1 w-1">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/45 opacity-50"/>
          <span className="relative inline-flex h-1 w-1 rounded-full bg-emerald-400"/>
        </span>
        Long
      </span>) : (<span className="inline-flex shrink-0 items-center gap-0.5 rounded border border-rose-400/35 bg-rose-500/[0.1] px-1 py-px text-[7px] font-extrabold uppercase tracking-wide text-rose-200">
        <span className="relative flex h-1 w-1">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400/40 opacity-50"/>
          <span className="relative inline-flex h-1 w-1 rounded-full bg-rose-400"/>
        </span>
        Short
      </span>);
    return (<div className={"rounded-xl border border-[#00ffc8]/18 bg-gradient-to-b from-black/85 to-black/92 p-2 ring-1 ring-white/[0.05] transition-shadow duration-300 sm:p-2.5 ".concat(glowClass, " ").concat(levelGlow)} role="region" aria-label={"Active position ".concat(position.symbol, " ").concat(position.side)}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-white/[0.07] pb-1.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <h3 className="truncate text-xs font-bold tracking-tight text-white sm:text-[13px]">{position.symbol}</h3>
          {liveBadge}
        </div>
        <p className="shrink-0 text-right text-[8px] font-medium tabular-nums text-sigflo-muted">
          {position.market === 'futures' ? "".concat(position.leverage, "x") : 'Spot'}
        </p>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 py-2">
        <div className="min-w-0">
          <p className="text-[7px] font-bold uppercase tracking-[0.14em] text-sigflo-muted">
            Unrealized (Bybit)
          </p>
          <framer_motion_1.motion.p initial={{ opacity: 0.88 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} className={"truncate font-mono text-xl font-bold tabular-nums tracking-tight sm:text-2xl ".concat(pnlClass)}>
            {pnlUsd >= 0 ? '+' : '−'}${(0, formatQuote_1.formatQuoteNumber)(Math.abs(pnlUsd))}
          </framer_motion_1.motion.p>
        </div>
        <div className="grid shrink-0 grid-rows-2 justify-items-end gap-0.5 text-right">
          <span className={"font-mono text-[11px] font-bold tabular-nums leading-none ".concat(pnlClass)}>
            {roePct >= 0 ? '+' : ''}
            {roePct.toFixed(1)}% <span className="text-[8px] font-semibold text-sigflo-muted">ROE</span>
          </span>
          <span className={"font-mono text-[9px] font-medium tabular-nums ".concat(pnlClass)}>
            {movePct >= 0 ? '+' : ''}
            {movePct.toFixed(2)}% <span className="text-sigflo-muted">PnL</span>
          </span>
        </div>
      </div>

      <div className="mb-1.5 rounded-lg border border-white/[0.06] bg-black/30 px-2 py-1.5">
        <p className="text-[7px] font-extrabold uppercase tracking-[0.12em] text-sigflo-muted">Exit & scenario</p>
        <p className="mt-0.5 text-[10px] font-semibold leading-snug text-white/90">
          <span className="text-cyan-200/90">{exitAiModeLabel}</span>
          <span className="text-sigflo-muted"> · </span>
          <span className="text-white/85">{exitStrategyLabel}</span>
        </p>
        <p className="mt-0.5 text-[9px] leading-snug text-sigflo-muted">{scenarioSummary}</p>
      </div>

      <div className="grid grid-cols-3 gap-1 sm:grid-cols-4 sm:gap-1.5">
        <StatCell label="Entry">{(0, formatQuote_1.formatQuoteUsd)(position.entryPrice)}</StatCell>
        <StatCell label="Mark">{(0, formatQuote_1.formatQuoteUsd)(markPrice)}</StatCell>
        <StatCell label="Size">${(0, formatQuote_1.formatQuoteNumber)(position.positionNotionalUsd)}</StatCell>
        <StatCell label="Margin">${(0, formatQuote_1.formatQuoteNumber)(position.marginUsd)}</StatCell>
        <StatCell label="Liq">
          {position.liquidationPrice != null && Number.isFinite(position.liquidationPrice)
            ? (0, formatQuote_1.formatQuoteUsd)(position.liquidationPrice)
            : '—'}
        </StatCell>
        <StatCell label="Time">{formatTimeInTrade(position.openedAtMs, nowMs)}</StatCell>
        <StatCell label="Stop">{position.stopLossPrice != null ? (0, formatQuote_1.formatQuoteUsd)(position.stopLossPrice) : '—'}</StatCell>
        <StatCell label="TP">{position.takeProfitPrice != null ? (0, formatQuote_1.formatQuoteUsd)(position.takeProfitPrice) : '—'}</StatCell>
      </div>
    </div>);
}
