"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskLimitCard = RiskLimitCard;
function RiskLimitCard(_a) {
    var title = _a.title, description = _a.description, attention = _a.attention, children = _a.children;
    return (<section className={"rounded-2xl border px-3 py-3 backdrop-blur-sm sm:px-4 sm:py-3.5 ".concat(attention
            ? 'border-rose-400/25 bg-rose-500/[0.06]'
            : 'border-white/10 bg-white/[0.035]')}>
      <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400">{title}</h2>
      {description ? <div className="mt-1 text-[10px] leading-snug text-zinc-500">{description}</div> : null}
      <div className="mt-3">{children}</div>
    </section>);
}
