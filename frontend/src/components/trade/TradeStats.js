"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradeStatsInline = void 0;
exports.TradeStats = TradeStats;
function fmtSignedPct(n, digits) {
    if (digits === void 0) { digits = 1; }
    if (!Number.isFinite(n))
        return '—';
    var sign = n >= 0 ? '+' : '−';
    return "".concat(sign).concat(Math.abs(n).toFixed(digits), "%");
}
function TradeStats(_a) {
    var riskPercent = _a.riskPercent, rewardPercent = _a.rewardPercent, rrRatio = _a.rrRatio, _b = _a.variant, variant = _b === void 0 ? 'default' : _b, _c = _a.compact, compact = _c === void 0 ? false : _c, _d = _a.layout, layout = _d === void 0 ? 'inline' : _d;
    var rrOk = Number.isFinite(rrRatio) && rrRatio > 0;
    if (variant === 'strip' && layout === 'dockGrid') {
        return (<div role="group" aria-label="Target, risk, and reward-to-risk" className="grid w-max shrink-0 grid-cols-2 gap-x-2 gap-y-px text-[8px] tabular-nums leading-none sm:gap-x-2.5 sm:text-[9px]">
        <span className="text-center font-semibold text-emerald-200/90">{fmtSignedPct(rewardPercent)}</span>
        <span className="text-center font-semibold text-rose-200/85">{fmtSignedPct(-Math.abs(riskPercent))}</span>
        <span className="text-center text-[6.5px] font-semibold uppercase tracking-[0.08em] text-sigflo-muted/88 sm:text-[7.5px]">
          target
        </span>
        <span className="text-center text-[6.5px] font-semibold uppercase tracking-[0.08em] text-sigflo-muted/88 sm:text-[7.5px]">
          risk
        </span>
        <span className="col-span-2 border-t border-white/[0.08] pt-0.5 text-center text-[6.5px] text-sigflo-muted/90 sm:text-[7.5px]">
          R:R{' '}
          <span className="font-semibold tabular-nums text-cyan-200/90">{rrOk ? rrRatio.toFixed(1) : '—'}</span>
        </span>
      </div>);
    }
    var inner = (<>
      <span className="font-semibold text-emerald-200/90 tabular-nums">{fmtSignedPct(rewardPercent)}</span>
      <span className="text-sigflo-muted"> target</span>
      <span className="mx-[5px] text-white/[0.12]">·</span>
      <span className="font-semibold text-rose-200/85 tabular-nums">{fmtSignedPct(-Math.abs(riskPercent))}</span>
      <span className="text-sigflo-muted"> risk</span>
      <span className="mx-[5px] text-white/[0.12]">·</span>
      <span className="text-sigflo-text/90">
        R:R{' '}
        <span className="font-semibold tabular-nums text-cyan-200/90">{rrOk ? rrRatio.toFixed(1) : '—'}</span>
      </span>
    </>);
    var sizeCls = compact ? 'text-[10px] leading-none tracking-tight' : 'text-[10px] leading-snug tracking-tight';
    if (variant === 'strip') {
        return (<p className={"min-w-0 font-medium text-sigflo-muted ".concat(sizeCls, " ").concat(compact ? 'text-left' : 'text-center sm:text-left')}>
        {inner}
      </p>);
    }
    return <p className={"min-w-0 font-medium text-sigflo-muted ".concat(sizeCls)}>{inner}</p>;
}
/** Alias for product spec naming (`TradeStatsInline`). */
exports.TradeStatsInline = TradeStats;
