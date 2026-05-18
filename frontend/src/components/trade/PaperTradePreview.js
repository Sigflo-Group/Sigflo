"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaperTradePreview = PaperTradePreview;
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
var tradeMath_1 = require("@/utils/tradeMath");
function fmtUsd(n) {
    if (!Number.isFinite(n))
        return '—';
    var abs = Math.abs(n);
    var d = abs >= 100 ? 0 : abs >= 1 ? 2 : 3;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: d,
        maximumFractionDigits: d,
    }).format(n);
}
function fmtPx(n) {
    if (!Number.isFinite(n))
        return '—';
    return n.toLocaleString('en-US', { maximumFractionDigits: 6 });
}
function fmtSize(n) {
    if (!Number.isFinite(n))
        return '—';
    if (n >= 1e6)
        return "".concat((n / 1e6).toFixed(2), "M");
    if (n >= 1e3)
        return "".concat((n / 1e3).toFixed(2), "k");
    return n.toLocaleString('en-US', { maximumFractionDigits: 4, minimumFractionDigits: 0 });
}
var SLIDER_MIN = 0.25;
var ADVANCED_SLIDER_MAX = 25;
function PaperTradePreview(_a) {
    var entryPrice = _a.entryPrice, stopPrice = _a.stopPrice, targets = _a.targets, direction = _a.direction, onInteraction = _a.onInteraction, _b = _a.previewEnabled, previewEnabled = _b === void 0 ? true : _b, previewDisabledReason = _a.previewDisabledReason, _c = _a.highlightPulseToken, highlightPulseToken = _c === void 0 ? 0 : _c, maxRiskPerTradePct = _a.maxRiskPerTradePct;
    var _d = (0, react_1.useState)(1000), balance = _d[0], setBalance = _d[1];
    var _e = (0, react_1.useState)(false), advancedRiskUnlocked = _e[0], setAdvancedRiskUnlocked = _e[1];
    var _f = (0, react_1.useState)(function () {
        return Math.min(Math.max(SLIDER_MIN, maxRiskPerTradePct), ADVANCED_SLIDER_MAX);
    }), riskPercent = _f[0], setRiskPercent = _f[1];
    var _g = (0, react_1.useState)(false), pulseClass = _g[0], setPulseClass = _g[1];
    var interactionFired = (0, react_1.useRef)(false);
    var prevPulseRef = (0, react_1.useRef)(highlightPulseToken);
    var policyCap = Math.max(SLIDER_MIN, maxRiskPerTradePct);
    var sliderMax = advancedRiskUnlocked ? ADVANCED_SLIDER_MAX : policyCap;
    (0, react_1.useEffect)(function () {
        setRiskPercent(function (p) {
            if (advancedRiskUnlocked)
                return Math.min(ADVANCED_SLIDER_MAX, Math.max(SLIDER_MIN, p));
            return Math.min(policyCap, Math.max(SLIDER_MIN, p));
        });
    }, [advancedRiskUnlocked, policyCap]);
    (0, react_1.useEffect)(function () {
        if (highlightPulseToken > 0 && highlightPulseToken !== prevPulseRef.current) {
            prevPulseRef.current = highlightPulseToken;
            setPulseClass(true);
            var t_1 = window.setTimeout(function () { return setPulseClass(false); }, 1400);
            return function () { return window.clearTimeout(t_1); };
        }
    }, [highlightPulseToken]);
    var fireInteraction = function () {
        if (interactionFired.current)
            return;
        interactionFired.current = true;
        onInteraction === null || onInteraction === void 0 ? void 0 : onInteraction();
    };
    var result = (0, react_1.useMemo)(function () {
        if (!previewEnabled)
            return null;
        return (0, tradeMath_1.calculatePaperTrade)({
            balance: balance,
            riskPercent: riskPercent,
            entryPrice: entryPrice,
            stopPrice: stopPrice,
            targets: targets,
            direction: direction,
        });
    }, [balance, riskPercent, entryPrice, stopPrice, targets, direction, previewEnabled]);
    var showPolicyNote = !advancedRiskUnlocked;
    var showAboveCapHint = advancedRiskUnlocked && riskPercent > policyCap + 1e-6;
    return (<framer_motion_1.motion.section layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className={"rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 backdrop-blur-sm ".concat(pulseClass ? 'animate-sigflo-paper-preview-pulse' : '')}>
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        Paper Trade Preview
        <span className="ml-1.5 font-normal normal-case tracking-normal text-zinc-600">· Plan only</span>
      </h2>
      <p className="mt-1 text-[10px] leading-snug text-zinc-500">
        If you took this trade, here is the structure. Illustrative only — not financial advice.
      </p>

      {!previewEnabled && previewDisabledReason ? (<p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/[0.07] px-2.5 py-2 text-[11px] leading-snug text-amber-200/95" role="status">
          {previewDisabledReason}
        </p>) : null}

      <div className={"mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 ".concat(!previewEnabled ? 'pointer-events-none opacity-[0.38]' : '')}>
        <label className="grid gap-1">
          <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Balance (simulated)</span>
          <input type="number" min={1} step={100} value={Number.isFinite(balance) ? balance : ''} onChange={function (e) {
            fireInteraction();
            var v = Number(e.target.value);
            setBalance(Number.isFinite(v) && v > 0 ? v : 1000);
        }} disabled={!previewEnabled} className="rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-zinc-100 outline-none ring-0 focus:border-[#00ffc8]/40 disabled:cursor-not-allowed"/>
        </label>
        <div className="grid gap-1">
          <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            Risk % of balance ({riskPercent.toFixed(2)}%)
          </span>
          <input type="range" aria-label="Risk percent of simulated balance" min={SLIDER_MIN} max={sliderMax} step={0.25} value={Math.min(riskPercent, sliderMax)} onChange={function (e) {
            fireInteraction();
            var v = Number(e.target.value);
            setRiskPercent(Number.isFinite(v) ? v : SLIDER_MIN);
        }} disabled={!previewEnabled} className="mt-1.5 w-full accent-[#00ffc8] disabled:cursor-not-allowed"/>
          {showPolicyNote ? (<p className="text-[9px] leading-snug text-zinc-500">Limited by your risk controls</p>) : null}
          {showAboveCapHint ? (<p className="text-[9px] leading-snug text-amber-200/80">Above your saved per-trade cap — advanced override</p>) : null}
          <label className="mt-1 flex cursor-pointer items-center gap-2 text-[9px] text-zinc-500">
            <input type="checkbox" checked={advancedRiskUnlocked} onChange={function (e) {
            fireInteraction();
            setAdvancedRiskUnlocked(e.target.checked);
        }} disabled={!previewEnabled} className="h-3.5 w-3.5 rounded border-white/20 bg-black/40 text-cyan-500"/>
            <span>Advanced sizing (unlock higher risk %)</span>
          </label>
        </div>
      </div>

      <div className={"mt-3 grid gap-1.5 border-t border-white/[0.06] pt-3 text-xs ".concat(!previewEnabled || result == null ? 'opacity-40' : '')}>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-0.5">
          <span className="text-zinc-500">Entry (plan)</span>
          <span className="text-right font-medium tabular-nums text-zinc-200">{fmtPx(entryPrice)}</span>
          <span className="text-zinc-500">Stop / invalidation</span>
          <span className="text-right font-medium tabular-nums text-zinc-200">{fmtPx(stopPrice)}</span>
          {result ? (<>
              <span className="text-zinc-500">Position size (units)</span>
              <span className="text-right font-medium tabular-nums text-zinc-200">{fmtSize(result.positionSize)}</span>
              <span className="text-zinc-500">Risk amount</span>
              <span className="text-right font-medium tabular-nums text-zinc-200">{fmtUsd(result.riskAmount)}</span>
              <span className="text-zinc-500">Loss at stop</span>
              <span className="text-right font-medium tabular-nums text-rose-300/90">{fmtUsd(-result.lossAtStop)}</span>
            </>) : (<>
              <span className="text-zinc-500">Position size (units)</span>
              <span className="text-right font-medium tabular-nums text-zinc-500">—</span>
              <span className="text-zinc-500">Risk amount</span>
              <span className="text-right font-medium tabular-nums text-zinc-500">—</span>
              <span className="text-zinc-500">Loss at stop</span>
              <span className="text-right font-medium tabular-nums text-zinc-500">—</span>
            </>)}
        </div>
      </div>

      {result && result.profitTargets.length > 0 ? (<div className="mt-3 border-t border-white/[0.06] pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Targets</p>
          <ul className="mt-2 grid gap-1.5">
            {result.profitTargets.map(function (row, i) {
                var win = row.pnl >= 0;
                return (<li key={"".concat(row.price, "-").concat(i)} className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-x-2 text-xs">
                  <span className="text-zinc-500">T{i + 1}</span>
                  <span className="min-w-0 truncate text-right font-medium tabular-nums text-zinc-200">
                    {fmtPx(row.price)}
                  </span>
                  <span className={"text-right font-semibold tabular-nums ".concat(win ? 'text-[#00ffc8]' : 'text-rose-300/85')}>
                    {row.pnl >= 0 ? '+' : ''}
                    {fmtUsd(row.pnl)}
                  </span>
                  <span className={"text-right tabular-nums ".concat(win ? 'text-[#00ffc8]/80' : 'text-rose-300/70')}>
                    {Number.isFinite(row.rr) ? "".concat(row.rr.toFixed(2), "R") : '—'}
                  </span>
                </li>);
            })}
          </ul>
        </div>) : previewEnabled && targets.length > 0 && result == null ? (<p className="mt-3 border-t border-white/[0.06] pt-3 text-[11px] text-zinc-500">Unable to compute preview for these levels.</p>) : null}

      <p className="mt-3 text-[10px] leading-snug text-zinc-500">
        Simulation only. No real orders placed. Does not model fees, slippage, or liquidation.
      </p>
    </framer_motion_1.motion.section>);
}
