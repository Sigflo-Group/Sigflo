import type { OpportunityState } from '@/types/botSystem';
import type { StrategyType } from '@/types/engine';

export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Map score + trigger to workflow state. Returns null if below publish threshold (hidden).
 * - Triggered: score ≥ 82 and hasTrigger
 * - Ready: score ≥ 75 (caller may cap reversal)
 * - Building: ≥ 65
 * - Watching: ≥ 55
 */
export function getOpportunityStateFromScore(score: number, hasTrigger: boolean): OpportunityState | null {
  const s = clampScore(score);
  if (s < 55) return null;
  if (s >= 82 && hasTrigger) return 'Triggered';
  if (s >= 75) return 'Ready';
  if (s >= 65) return 'Building';
  return 'Watching';
}

/** Per-strategy timeframe labels for the Bots UI. */
export function timeframeAlignmentForStrategy(strategy: StrategyType): string[] {
  switch (strategy) {
    case 'Breakout':
      return ['15m', '1h'];
    case 'Momentum':
      return ['5m', '15m'];
    case 'TrendPullback':
      return ['15m', '1h'];
    case 'Reversal':
      return ['5m', '15m'];
  }
}

export function formatAdaptivePrice(pair: string, n: number): string {
  const u = pair.toUpperCase();
  const isBtcEth = u.includes('BTC') || u.includes('ETH');
  if (isBtcEth) {
    const digits = n >= 10_000 ? 0 : 1;
    return n.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits });
  }
  return n.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

export function buildAtrLevels(
  pair: string,
  price: number,
  atr: number,
  direction: 'LONG' | 'SHORT',
): { entryZone: string; invalidation: string; targets: string[] } {
  const a = atr;
  if (direction === 'LONG') {
    const eLo = price;
    const eHi = price + 0.25 * a;
    const inv = price - 1.0 * a;
    const t1 = price + 1.5 * a;
    const t2 = price + 2.5 * a;
    return {
      entryZone: `${formatAdaptivePrice(pair, eLo)} - ${formatAdaptivePrice(pair, eHi)}`,
      invalidation: formatAdaptivePrice(pair, inv),
      targets: [formatAdaptivePrice(pair, t1), formatAdaptivePrice(pair, t2)],
    };
  }
  const eLo = price - 0.25 * a;
  const eHi = price;
  const inv = price + 1.0 * a;
  const t1 = price - 1.5 * a;
  const t2 = price - 2.5 * a;
  return {
    entryZone: `${formatAdaptivePrice(pair, eLo)} - ${formatAdaptivePrice(pair, eHi)}`,
    invalidation: formatAdaptivePrice(pair, inv),
    targets: [formatAdaptivePrice(pair, t1), formatAdaptivePrice(pair, t2)],
  };
}

export type RiskLabel = 'Low' | 'Medium' | 'High';

export function getRiskLabel(params: {
  score: number;
  strategyType: StrategyType;
  rsi?: number;
  volumeRatio?: number;
  cleanTrendAlignment: boolean;
  invalidationTight: boolean;
}): RiskLabel {
  const { score, strategyType, rsi = 50, volumeRatio = 1, cleanTrendAlignment, invalidationTight } = params;
  if (strategyType === 'Reversal') return 'High';
  if (score < 68) return 'High';
  if (rsi < 32 || rsi > 72) return 'High';
  if (volumeRatio < 1.05) return 'High';
  if (score >= 80 && cleanTrendAlignment && invalidationTight) return 'Low';
  if (score >= 65 && score <= 79) return 'Medium';
  return 'Medium';
}

/** Reversal setups never earn Ready below this score (earned selectivity). */
export const REVERSAL_READY_MIN_SCORE = 78;

export function capReversalReady(state: OpportunityState | null, score: number): OpportunityState | null {
  if (state == null) return null;
  if (state === 'Ready' && score < REVERSAL_READY_MIN_SCORE) return 'Building';
  if (state === 'Triggered' && score < 82) return 'Building';
  return state;
}
