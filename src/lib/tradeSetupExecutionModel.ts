/**
 * Trade readiness: **setup state** (Building / Triggered / In position) vs **execution quality**
 * (Strong / Okay / Weak) after fill. Replaces overloaded timing labels that mixed scanner lifecycle
 * with risk-adjusted trade score (which wrongly showed “Weak timing” immediately after entry).
 */

import {
  EXECUTION_OKAY_MAX_ADVERSE_DEVIATION_PCT,
  EXECUTION_STRONG_MAX_ADVERSE_DEVIATION_PCT,
  SETUP_TRIGGER_GRACE_WINDOW_MS,
} from '@/config/tradeSetupExecution';
import type { TradeTimingChipState } from '@/lib/tradeTimingChip';
import type { MarketRowStatus } from '@/types/markets';
import type { CryptoSignal } from '@/types/signal';
import type { ExecutionQuality, SetupDisplayState, TradeSide } from '@/types/trade';

export type TriggerLockSnapshot = {
  lockedAtMs: number;
  idealEntry: number;
};

/** Adverse move vs ideal: long = paid higher than ideal (worse); short = sold lower (worse). */
export function directionalEntryAdverseDeviationPct(side: TradeSide, actualEntry: number, idealEntry: number): number {
  if (!(idealEntry > 0) || !Number.isFinite(actualEntry)) return Number.POSITIVE_INFINITY;
  if (side === 'long') return ((actualEntry - idealEntry) / idealEntry) * 100;
  return ((idealEntry - actualEntry) / idealEntry) * 100;
}

export function getSetupDisplayState(args: { inPosition: boolean; marketStatus: MarketRowStatus }): SetupDisplayState {
  if (args.inPosition) return 'in_position';
  if (args.marketStatus === 'triggered') return 'triggered';
  return 'building';
}

export function getExecutionTradeScorePenalty(quality: ExecutionQuality | null): number {
  if (!quality) return 0;
  if (quality === 'strong') return 0;
  if (quality === 'okay') return 3;
  return 8;
}

/**
 * Execution grade after open — independent of timing chip / setup row state.
 * Grace: if `openedAtMs <= triggerLock.lockedAtMs + GRACE`, never Weak (Okay minimum).
 */
export function getExecutionQuality(args: {
  inPosition: boolean;
  side: TradeSide;
  actualEntry: number;
  idealEntry: number;
  openedAtMs: number | null;
  triggerLock: TriggerLockSnapshot | null;
}): ExecutionQuality | null {
  if (!args.inPosition) return null;
  if (!(args.actualEntry > 0) || !(args.idealEntry > 0)) return 'okay';

  const graceEndMs =
    args.triggerLock != null ? args.triggerLock.lockedAtMs + SETUP_TRIGGER_GRACE_WINDOW_MS : null;
  const withinGrace =
    graceEndMs != null && args.openedAtMs != null && args.openedAtMs <= graceEndMs;

  const adversePct = directionalEntryAdverseDeviationPct(args.side, args.actualEntry, args.idealEntry);

  if (withinGrace) {
    if (adversePct <= EXECUTION_STRONG_MAX_ADVERSE_DEVIATION_PCT) return 'strong';
    return 'okay';
  }

  if (adversePct <= EXECUTION_STRONG_MAX_ADVERSE_DEVIATION_PCT) return 'strong';
  if (adversePct <= EXECUTION_OKAY_MAX_ADVERSE_DEVIATION_PCT) return 'okay';
  return 'weak';
}

export function executionQualityExplanation(quality: ExecutionQuality): string {
  switch (quality) {
    case 'strong':
      return 'Filled near plan entry.';
    case 'okay':
      return 'Acceptable fill vs plan.';
    case 'weak':
      return 'Entered after optimal range — late entry reduced trade quality.';
    default:
      return '';
  }
}

export type TradeTimingUiModel = {
  setupState: SetupDisplayState;
  chipLabel: string;
  chipState: TradeTimingChipState;
  helperText: string;
  executionQuality: ExecutionQuality | null;
  executionLabel: string | null;
  executionHelperText: string | null;
  /** Feeds chart overlay line alpha (`tradeTimingOverlayVisual`). */
  overlayTimingState: TradeTimingChipState;
};

/**
 * Dock / scanner timing presentation — setup-only before entry; execution line only in position.
 */
export function buildTradeTimingUiModel(args: {
  inPosition: boolean;
  marketStatus: MarketRowStatus;
  executionQuality: ExecutionQuality | null;
}): TradeTimingUiModel {
  const { inPosition, marketStatus, executionQuality } = args;

  if (!inPosition && (marketStatus === 'overextended' || marketStatus === 'extended')) {
    const chipLabel = marketStatus === 'extended' ? 'Late setup' : 'Stretched';
    return {
      setupState: 'building',
      chipLabel,
      chipState: 'invalid',
      helperText: 'Poor risk/reward for fresh entries here.',
      executionQuality: null,
      executionLabel: null,
      executionHelperText: null,
      overlayTimingState: 'invalid',
    };
  }

  if (inPosition) {
    const execLabel =
      executionQuality != null
        ? `Execution: ${executionQuality === 'strong' ? 'Strong' : executionQuality === 'okay' ? 'Okay' : 'Weak'}`
        : null;
    return {
      setupState: 'in_position',
      chipLabel: 'In position',
      chipState: 'ready',
      helperText: 'Manage risk vs your plan.',
      executionQuality,
      executionLabel: execLabel,
      executionHelperText: executionQuality != null ? executionQualityExplanation(executionQuality) : null,
      overlayTimingState: 'ready',
    };
  }

  if (marketStatus === 'triggered') {
    return {
      setupState: 'triggered',
      chipLabel: 'Triggered',
      chipState: 'ready',
      helperText: 'Entry window open.',
      executionQuality: null,
      executionLabel: null,
      executionHelperText: null,
      overlayTimingState: 'ready',
    };
  }

  return {
    setupState: 'building',
    chipLabel: 'Building',
    chipState: 'developing',
    helperText: 'Watch for trigger.',
    executionQuality: null,
    executionLabel: null,
    executionHelperText: null,
    overlayTimingState: 'developing',
  };
}

/** Ideal entry reference for execution: prefer locked trigger, then signal, then plan anchor. */
export function resolveIdealEntryForExecution(args: {
  triggerLock: TriggerLockSnapshot | null;
  signal: CryptoSignal;
  planEntry: number;
  lastPrice: number | undefined;
}): number {
  const fromLock = args.triggerLock?.idealEntry;
  if (fromLock != null && Number.isFinite(fromLock) && fromLock > 0) return fromLock;
  const ideal = args.signal.idealEntryPrice;
  if (ideal != null && Number.isFinite(ideal) && ideal > 0) return ideal;
  if (Number.isFinite(args.planEntry) && args.planEntry > 0) return args.planEntry;
  const lp = args.lastPrice;
  if (lp != null && Number.isFinite(lp) && lp > 0) return lp;
  return args.planEntry;
}
