import { buildAtrLevels, clampScore, getOpportunityStateFromScore, timeframeAlignmentForStrategy } from '@/services/engine/scoring';
import { entryStatusFromOpportunityState } from '@/services/engine/opportunityNormalizer';
import type { StrategyType } from '@/types/engine';
import type { OpportunityCardModel } from '@/types/botSystem';
import type { CryptoSignal, SignalSetupTag } from '@/types/signal';

const TAG_TO_STRATEGY: Record<SignalSetupTag, StrategyType> = {
  Breakout: 'Breakout',
  Pullback: 'TrendPullback',
  Overextended: 'Reversal',
};

function toStrategyType(tags: SignalSetupTag[]): StrategyType {
  for (const t of tags) {
    const mapped = TAG_TO_STRATEGY[t];
    if (mapped) return mapped;
  }
  return 'Reversal';
}

function toDirection(side: 'long' | 'short'): 'LONG' | 'SHORT' {
  return side === 'long' ? 'LONG' : 'SHORT';
}

function toSetupLabel(setupType: string): string {
  switch (setupType) {
    case 'breakout':
      return 'Range expansion / breakout';
    case 'pullback':
      return 'Trend pullback';
    case 'overextended':
      return 'Mean reversion';
    default:
      return setupType;
  }
}

function calcFreshnessSec(signal: CryptoSignal): number {
  if (!signal.candlesSinceTrigger && !signal.candlesSincePeakTiming) return 30;
  const candles = signal.candlesSincePeakTiming ?? signal.candlesSinceTrigger ?? 0;
  return candles * 15 * 60;
}

export function signalToOpportunity(signal: CryptoSignal, price: number, atr: number): OpportunityCardModel {
  const strategy = toStrategyType(signal.setupTags);
  const direction = toDirection(signal.side);
  const id = `sig-${signal.pair.replace(/[^A-Z0-9]/g, '').toLowerCase()}-${signal.setupType}-${signal.side}`;
  const score = clampScore(signal.setupScore);
  const hasTrigger = signal.timingState === 'triggered' || signal.triggerType != null;
  let state = getOpportunityStateFromScore(score, hasTrigger);
  if (!state) state = 'Watching';

  const levels = buildAtrLevels(signal.pair, price, atr, direction);
  const freshnessSec = calcFreshnessSec(signal);
  const thesis = signal.aiExplanation || signal.biasLabel || 'Monitoring market structure for opportunity.';
  const rationaleText = signal.reasons?.length ? signal.reasons.join('. ') : thesis;

  return {
    id,
    pair: signal.pair,
    direction,
    setupType: toSetupLabel(signal.setupType),
    score,
    state,
    thesis,
    rationale: rationaleText,
    entryStatus: entryStatusFromOpportunityState(state),
    entryZone: levels.entryZone,
    invalidation: levels.invalidation,
    targets: levels.targets,
    timeframeAlignment: timeframeAlignmentForStrategy(strategy),
    freshnessSec,
  };
}

export function signalsToOpportunities(signals: CryptoSignal[], prices: Record<string, number>, atrValues: Record<string, number>): OpportunityCardModel[] {
  return signals.map((s) => {
    const price = prices[s.pair] ?? 0;
    const atr = atrValues[s.pair] ?? price * 0.005;
    return signalToOpportunity(s, price, atr);
  });
}
