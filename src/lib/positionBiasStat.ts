import { normalizeTradePairBase } from '@/lib/tradePairFavorites';
import type { CryptoSignal } from '@/types/signal';
import type { TradeSide } from '@/types/trade';

export type PositionBiasVariant = 'aligned' | 'counter' | 'neutral';

export type PositionBiasStat = {
  variant: PositionBiasVariant;
  /** Short headline, e.g. Favorable / Counter / Mixed / N/A */
  title: string;
  /** Scanner bias line or context */
  subtitle: string;
};

/** Do not show strong Favorable/Counter when the scanner row is weak (reduces flip-flop). */
export const POSITION_BIAS_MIN_SETUP_SCORE = 44;

/**
 * When two rows tie for the same pair, require this many `setupScore` points between #1 and #2
 * before we treat #1 as the definitive bias (Portfolio path only).
 */
export const POSITION_BIAS_RUNNER_UP_GAP = 6;

function neutralMixedStat(biasLabel: string, reason: string): PositionBiasStat {
  const b = biasLabel.trim();
  return {
    variant: 'neutral',
    title: 'Mixed',
    subtitle: b ? `${b} · ${reason}` : reason,
  };
}

function biasFromMatchedRow(
  positionSide: TradeSide,
  signal: Pick<CryptoSignal, 'side' | 'biasLabel'>,
): PositionBiasStat {
  const aligned = positionSide === signal.side;
  const sub = signal.biasLabel.trim();
  return {
    variant: aligned ? 'aligned' : 'counter',
    title: aligned ? 'Favorable' : 'Counter',
    subtitle: sub || (aligned ? 'With scanner' : 'Against scanner'),
  };
}

function topTwoScannerSignalsForSymbol(
  signals: readonly CryptoSignal[],
  linearSymbol: string,
): [CryptoSignal | null, CryptoSignal | null] {
  const want = normalizeTradePairBase(linearSymbol);
  const matches: CryptoSignal[] = [];
  for (const s of signals) {
    if (normalizeTradePairBase(s.pair) !== want) continue;
    matches.push(s);
  }
  if (matches.length === 0) return [null, null];
  matches.sort((a, b) => b.setupScore - a.setupScore);
  return [matches[0]!, matches[1] ?? null];
}

/**
 * Strongest scanner row for this contract (highest `setupScore` among rows whose pair base matches).
 */
export function pickBestScannerSignalForSymbol(
  signals: readonly CryptoSignal[],
  linearSymbol: string,
): CryptoSignal | null {
  const [best] = topTwoScannerSignalsForSymbol(signals, linearSymbol);
  return best;
}

/**
 * Open leg vs best ranked scanner row for this linear symbol (Portfolio cards, etc.).
 * Buffers: minimum setup score + leader gap over the runner-up for the same pair.
 */
export function positionBiasForLinearSymbol(
  linearSymbol: string,
  positionSide: TradeSide,
  signals: readonly CryptoSignal[],
): PositionBiasStat | null {
  const [best, second] = topTwoScannerSignalsForSymbol(signals, linearSymbol);
  if (!best) return null;
  if (!Number.isFinite(best.setupScore) || best.setupScore < POSITION_BIAS_MIN_SETUP_SCORE) {
    return neutralMixedStat(best.biasLabel, 'Scanner conviction below threshold');
  }
  if (
    second != null &&
    Number.isFinite(second.setupScore) &&
    best.setupScore - second.setupScore < POSITION_BIAS_RUNNER_UP_GAP
  ) {
    return neutralMixedStat(best.biasLabel, 'Top scanner rows are too close');
  }
  return biasFromMatchedRow(positionSide, best);
}

/**
 * Open leg vs a **specific** scanner row (Trade manage: `selectedSignal`).
 * Returns `null` when there is no row; neutral when the row’s pair base ≠ position instrument.
 * Buffer: minimum setup score before Favorable / Counter.
 */
export function positionBiasForSignalRow(
  positionInstrument: string,
  positionSide: TradeSide,
  signal: Pick<CryptoSignal, 'pair' | 'side' | 'biasLabel' | 'setupScore'> | null | undefined,
): PositionBiasStat | null {
  if (!signal) return null;
  if (normalizeTradePairBase(signal.pair) !== normalizeTradePairBase(positionInstrument)) {
    return {
      variant: 'neutral',
      title: 'N/A',
      subtitle: `Scanner row is ${signal.pair.trim()}`,
    };
  }
  if (!Number.isFinite(signal.setupScore) || signal.setupScore < POSITION_BIAS_MIN_SETUP_SCORE) {
    return neutralMixedStat(signal.biasLabel, 'Scanner conviction below threshold');
  }
  return biasFromMatchedRow(positionSide, signal);
}
