"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiInsightCard = AiInsightCard;
function AiInsightCard(_a) {
    var insight = _a.insight;
    return (<div className="rounded-2xl border border-white/[0.06] bg-sigflo-surface sigflo-panel-texture p-2.5">
      <div className="flex items-center gap-3 text-xs text-sigflo-muted">
        <span>Trend: <span className="font-semibold text-white">{insight.trend}</span></span>
        <span>Mom: <span className="font-semibold text-white">{insight.momentum}</span></span>
        <span>Risk: <span className={"font-semibold ".concat(insight.risk === 'High' ? 'text-rose-400' : insight.risk === 'Medium' ? 'text-amber-300' : 'text-emerald-400')}>{insight.risk}</span></span>
      </div>
    </div>);
}
