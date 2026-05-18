"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradingControlModeSheet = TradingControlModeSheet;
var react_1 = require("react");
var tradingControlMode_1 = require("@/lib/tradingControlMode");
var TEAL = '#00C878';
var SHEET_BG = '#171A20';
function TradingControlModeSheet(_a) {
    var open = _a.open, onClose = _a.onClose, currentMode = _a.currentMode, onSelectMode = _a.onSelectMode;
    (0, react_1.useEffect)(function () {
        if (!open)
            return;
        var prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return function () {
            document.body.style.overflow = prev;
        };
    }, [open]);
    (0, react_1.useEffect)(function () {
        if (!open)
            return;
        var onKey = function (e) {
            if (e.key === 'Escape')
                onClose();
        };
        window.addEventListener('keydown', onKey);
        return function () { return window.removeEventListener('keydown', onKey); };
    }, [open, onClose]);
    if (!open)
        return null;
    return (<div className="fixed inset-0 z-[95] flex flex-col justify-end" role="presentation">
      <button type="button" className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" aria-label="Close mode picker" onClick={onClose}/>
      <div role="dialog" aria-modal="true" aria-labelledby="sigflo-mode-sheet-title" className="relative z-[96] flex max-h-[min(78dvh,520px)] flex-col rounded-t-3xl border border-white/[0.08] shadow-[0_-16px_48px_rgba(0,0,0,0.55)]" style={{ backgroundColor: SHEET_BG }}>
        <div className="flex shrink-0 flex-col items-center pt-2 pb-1">
          <div className="h-1 w-10 rounded-full bg-white/15" aria-hidden/>
        </div>
        <div className="border-b border-white/[0.06] px-4 pb-3 pt-1">
          <h2 id="sigflo-mode-sheet-title" className="text-base font-bold tracking-tight text-white">
            AI control mode
          </h2>
          <p className="mt-1 text-[11px] leading-relaxed text-sigflo-muted">
            Choose how much automation you want. You can change this anytime.
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <div className="flex flex-col gap-2.5">
            {tradingControlMode_1.TRADING_CONTROL_MODE_ORDER.map(function (m) {
            var meta = tradingControlMode_1.TRADING_CONTROL_MODE_META[m];
            var active = currentMode === m;
            var autoOptional = m === 'auto' && !tradingControlMode_1.TRADING_AUTO_EXECUTION_ACTIVE;
            return (<button key={m} type="button" onClick={function () { return onSelectMode(m); }} className={"w-full rounded-2xl border px-4 py-3.5 text-left transition ".concat(active
                    ? 'border-[#00C878] bg-[#141a1d] shadow-[0_0_18px_-10px_rgba(0,200,120,0.28)] ring-1 ring-[#00C878]/20'
                    : 'border-white/[0.07] bg-black/25 hover:border-white/[0.12] hover:bg-black/35')}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[15px] font-bold tracking-tight text-white">{meta.label}</p>
                    {active ? (<span className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#0F1115]" style={{ backgroundColor: TEAL }}>
                        Active
                      </span>) : null}
                  </div>
                  <p className={"mt-1.5 text-[13px] font-medium leading-snug ".concat(active ? 'text-[#b8fff0]' : 'text-white/75')}>
                    {meta.sheetDescription}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-sigflo-muted">{meta.sheetSubtext}</p>
                  {autoOptional ? (<p className="mt-2 rounded-lg border border-amber-400/20 bg-amber-500/[0.07] px-2 py-1.5 text-[10px] leading-snug text-amber-100/90">
                      Optional / future: unattended execution is not live yet — you still confirm every order.
                    </p>) : null}
                </button>);
        })}
          </div>
        </div>
      </div>
    </div>);
}
