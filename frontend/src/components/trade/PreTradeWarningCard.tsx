import { humanizeTraderCopy } from '@/lib/marketConditionsCopy';
import type { RiskLevel } from '@/types/trade';

function actionHint(
  tradeScore: number,
  ctx: { leverage: number; walletUsedPct: number },
): string {
  if (tradeScore >= 75) return 'Good execution — entry active';
  if (tradeScore >= 60) return 'Acceptable — keep size controlled';
  if (tradeScore >= 45) return 'Too aggressive — reduce size';
  /** Below 45: score blends setup + margin + leverage — do not always blame leverage (e.g. 1× + tiny size). */
  if (ctx.walletUsedPct > 20) return 'Risk high — margin is still a large share of wallet';
  if (ctx.leverage > 1) return 'Risk high — lower leverage or margin';
  return 'Caution — weak setup is pulling the trade score down';
}

export function PreTradeWarningCard(props: {
  walletUsedPct: number;
  leverage: number;
  riskLevel: RiskLevel;
  riskMeterPct: number;
  tradeScore: number;
  setupTradeConflictMessage?: string;
  walletImpactLabel: string;
  primaryMessage: string;
  warnings: string[];
}) {
  const {
    walletUsedPct,
    tradeScore,
    primaryMessage,
    warnings,
    setupTradeConflictMessage,
    walletImpactLabel,
    leverage,
    riskLevel,
  } = props;

  const highRiskPulse = riskLevel === 'High' || tradeScore < 45;

  return (
    <div
      className={`rounded-2xl border p-3 space-y-2 backdrop-blur-sm ${
        highRiskPulse
          ? 'sigflo-high-risk-panel-pulse border-rose-400/40 bg-gradient-to-b from-rose-950/35 via-rose-950/20 to-sigflo-surface/90'
          : 'border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-sigflo-surface/90'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`text-sm font-bold leading-snug ${highRiskPulse ? 'text-rose-100' : 'text-white'}`}
        >
          {actionHint(tradeScore, { leverage, walletUsedPct })}
        </span>
        <span className="shrink-0 text-[10px] font-semibold tabular-nums text-sigflo-muted">Score {tradeScore}</span>
      </div>

      <p className="text-xs leading-relaxed text-sigflo-muted">{humanizeTraderCopy(primaryMessage)}</p>

      {setupTradeConflictMessage ? (
        <p className="text-[11px] font-medium leading-snug text-amber-200/90">{setupTradeConflictMessage}</p>
      ) : null}

      <p className="text-xs text-sigflo-muted">
        {walletImpactLabel} — risking{' '}
        <span className="font-semibold text-white">{walletUsedPct.toFixed(1)}%</span> of wallet
        {leverage > 1 ? (
          <span className="block pt-1 text-[10px] text-sigflo-muted/90">Leverage {leverage}x</span>
        ) : null}
      </p>

      {warnings.length > 0 ? (
        <ul className="list-inside list-disc space-y-1 text-[11px] leading-snug text-sigflo-muted/95">
          {warnings.map((w) => (
            <li key={w}>{humanizeTraderCopy(w)}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
