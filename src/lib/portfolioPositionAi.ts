import type { PositionItem } from '@/types/integrations';

export type PositionAiExitStatus = 'holding' | 'tightening_risk' | 'preparing_exit';

const STATUS_COPY: Record<
  PositionAiExitStatus,
  { label: string; short: string; className: string }
> = {
  holding: {
    label: 'Holding',
    short: 'Thesis intact — let the trade work.',
    className: 'border-[#00C878]/35 bg-[#00C878]/10 text-[#5ee0a8]',
  },
  tightening_risk: {
    label: 'Tightening risk',
    short: 'Structure softening — protect what you have.',
    className: 'border-amber-400/35 bg-amber-500/12 text-amber-200',
  },
  preparing_exit: {
    label: 'Preparing exit',
    short: 'Invalidation nearby — plan the out.',
    className: 'border-rose-400/35 bg-rose-500/12 text-rose-200',
  },
};

export function positionAiExitMeta(status: PositionAiExitStatus) {
  return STATUS_COPY[status];
}

/**
 * Lightweight exit-readiness label from live PnL% and optional protective stop.
 */
export function derivePositionAiExitStatus(args: {
  pnlPct: number;
  unrealizedUsd: number;
  position: PositionItem;
}): PositionAiExitStatus {
  const { pnlPct, unrealizedUsd, position } = args;
  const hasStop =
    position.stopLossPrice != null &&
    Number.isFinite(position.stopLossPrice) &&
    position.stopLossPrice > 0;

  if (pnlPct <= -2.8 || unrealizedUsd <= -120) {
    return 'preparing_exit';
  }
  if (pnlPct <= -1.1 || (pnlPct < 0.4 && hasStop)) {
    return 'tightening_risk';
  }
  if (pnlPct <= -0.35) {
    return 'tightening_risk';
  }
  return 'holding';
}
