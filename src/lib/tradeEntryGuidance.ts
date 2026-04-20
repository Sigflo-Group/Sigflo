import { blendTimingReadinessScore, type TradeTimingChipState } from '@/lib/tradeTimingChip';
import {
  buildTradeTimingUiModel,
  executionQualityExplanation,
} from '@/lib/tradeSetupExecutionModel';
import type { MarketRowStatus } from '@/types/markets';
import type { ExecutionQuality, TradeSide } from '@/types/trade';

export type EntryGuidance = {
  timingState: TradeTimingChipState;
  timingLabel: string;
  action: string;
  reason: string;
  confidenceLabel: 'High' | 'Medium' | 'Low';
  /** Setup vs execution model — short helper under timing. */
  timingHelperText?: string;
  executionSummary?: string | null;
};

/**
 * Pre-entry (and in-position) copy for the scenario strip — uses setup/execution split
 * ({@link buildTradeTimingUiModel}) so fills are not mislabeled as “Weak timing”.
 */
export function computeTradeEntryGuidance(args: {
  marketStatus: MarketRowStatus;
  tradeScore: number;
  setupScore: number;
  side: TradeSide;
  lastPrice: number;
  planEntry: number;
  hasOpenPosition: boolean;
  executionQuality?: ExecutionQuality | null;
}): EntryGuidance {
  const ui = buildTradeTimingUiModel({
    inPosition: args.hasOpenPosition,
    marketStatus: args.marketStatus,
    executionQuality: args.executionQuality ?? null,
  });

  const blend = blendTimingReadinessScore(args.setupScore, args.tradeScore) / 100;
  let confidenceLabel: EntryGuidance['confidenceLabel'] = 'Medium';
  if (blend > 0.62) confidenceLabel = 'High';
  else if (blend < 0.42) confidenceLabel = 'Low';

  const executionSummary =
    args.hasOpenPosition && args.executionQuality != null
      ? `Execution: ${args.executionQuality === 'strong' ? 'Strong' : args.executionQuality === 'okay' ? 'Okay' : 'Weak'} — ${executionQualityExplanation(args.executionQuality)}`
      : null;

  if (args.hasOpenPosition) {
    return {
      timingState: ui.chipState,
      timingLabel: ui.chipLabel,
      timingHelperText: ui.helperText,
      executionSummary,
      action: 'Entry is live — focus on path, size, and invalidation vs your plan.',
      reason:
        args.executionQuality === 'weak'
          ? 'Entered after optimal range — late entry reduced trade quality; manage risk tightly vs your stop.'
          : 'Focus on tape vs stop/target; add size only when structure still matches the thesis and your safeguards allow.',
      confidenceLabel,
    };
  }

  let action: string;
  let reason: string;

  switch (ui.setupState) {
    case 'triggered':
      action = 'Entry window is open — prefer limits or scaled bids near plan entry; avoid chasing spikes.';
      reason = 'This is the first actionable moment for this setup on the scanner timeline.';
      break;
    case 'building':
      action = 'Let the setup finish — wait for confirmation before committing size.';
      reason = 'Structure is still forming; early size increases variance.';
      break;
    default:
      action = 'Watch your levels; size only when your rules are satisfied.';
      reason = 'Patience beats forcing entries.';
  }

  if (ui.chipState === 'invalid') {
    action = 'Stand down or cut intended size until risk posture improves.';
    reason = 'Extension or late-setup risk suggests poor risk/reward for fresh entries here.';
  }

  if (args.planEntry > 0 && args.lastPrice > 0) {
    const gapPct =
      ((args.side === 'long' ? args.lastPrice - args.planEntry : args.planEntry - args.lastPrice) /
        args.planEntry) *
      100;
    if (Number.isFinite(gapPct) && Math.abs(gapPct) > 0.08) {
      reason += ` Last is ${gapPct >= 0 ? '+' : ''}${gapPct.toFixed(2)}% vs plan entry.`;
    }
  }

  return {
    timingState: ui.chipState,
    timingLabel: ui.chipLabel,
    timingHelperText: ui.helperText,
    executionSummary: null,
    action,
    reason,
    confidenceLabel,
  };
}
