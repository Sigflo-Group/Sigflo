/**
 * Short-term structure levels from recent OHLC (v1).
 *
 * Sanity bands (min/max distance + final 5% guard) prevent showing stale or seed levels
 * that are nowhere near live price — a common trust break when mock data drifts from the tape.
 */

export type StructureCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

const DEFAULT_MAX_CANDLES = 100;

/** Map app chart candles (ts + optional volume) into the detector shape; keep last N only. */
export function toStructureCandles(
  raw: ReadonlyArray<{ ts: number; open: number; high: number; low: number; close: number; volume?: number }>,
  maxCount = DEFAULT_MAX_CANDLES,
): StructureCandle[] {
  const slice = raw.length <= maxCount ? raw : raw.slice(-maxCount);
  return slice.map((c) => ({
    time: c.ts,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume ?? 0,
  }));
}

export function findSwingHighs(candles: StructureCandle[], lookback = 2): number[] {
  const swings: number[] = [];
  if (candles.length < lookback * 2 + 1) return swings;

  for (let i = lookback; i < candles.length - lookback; i++) {
    const currentHigh = candles[i]!.high;
    let isSwingHigh = true;
    for (let j = 1; j <= lookback; j++) {
      if (currentHigh <= candles[i - j]!.high || currentHigh <= candles[i + j]!.high) {
        isSwingHigh = false;
        break;
      }
    }
    if (isSwingHigh) swings.push(currentHigh);
  }
  return swings;
}

export function findSwingLows(candles: StructureCandle[], lookback = 2): number[] {
  const swings: number[] = [];
  if (candles.length < lookback * 2 + 1) return swings;

  for (let i = lookback; i < candles.length - lookback; i++) {
    const currentLow = candles[i]!.low;
    let isSwingLow = true;
    for (let j = 1; j <= lookback; j++) {
      if (currentLow >= candles[i - j]!.low || currentLow >= candles[i + j]!.low) {
        isSwingLow = false;
        break;
      }
    }
    if (isSwingLow) swings.push(currentLow);
  }
  return swings;
}

/**
 * Merge prices that sit within thresholdPct of the running cluster mean (reduces duplicate triggers from noisy swings).
 */
export function clusterLevels(levels: number[], thresholdPct = 0.0025): number[] {
  if (!levels.length) return [];

  const sorted = [...levels].sort((a, b) => a - b);
  const clusters: number[][] = [[sorted[0]!]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]!;
    const lastCluster = clusters[clusters.length - 1]!;
    const avg = lastCluster.reduce((sum, n) => sum + n, 0) / lastCluster.length;
    const pctDiff = Math.abs(current - avg) / avg;

    if (pctDiff <= thresholdPct) {
      lastCluster.push(current);
    } else {
      clusters.push([current]);
    }
  }

  return clusters.map((cluster) => cluster.reduce((sum, n) => sum + n, 0) / cluster.length);
}

/** Last-line-of-defense: never surface a level the UI could read as “actionable” if it’s wildly off last. */
export function isLevelSane(currentPrice: number, level: number, maxPct = 0.05): boolean {
  if (!(currentPrice > 0) || !(level > 0)) return false;
  return Math.abs(level - currentPrice) / currentPrice <= maxPct;
}

export function detectNearestResistance(
  candles: StructureCandle[],
  currentPrice: number,
  minDistancePct = 0.002,
  maxDistancePct = 0.03,
): number | null {
  if (!(currentPrice > 0) || candles.length < 5) return null;

  const swingHighs = findSwingHighs(candles, 2);
  const filtered = swingHighs.filter((level) => {
    const distancePct = (level - currentPrice) / currentPrice;
    return distancePct >= minDistancePct && distancePct <= maxDistancePct;
  });

  const clustered = clusterLevels(filtered, 0.0025);
  if (!clustered.length) return null;

  const nearest = [...clustered].sort((a, b) => a - b)[0]!;
  return isLevelSane(currentPrice, nearest) ? nearest : null;
}

/** Nearest valid swing low below price (short-bias confirmation zone), symmetric rules to resistance. */
export function detectNearestSupport(
  candles: StructureCandle[],
  currentPrice: number,
  minDistancePct = 0.002,
  maxDistancePct = 0.03,
): number | null {
  if (!(currentPrice > 0) || candles.length < 5) return null;

  const swingLows = findSwingLows(candles, 2);
  const filtered = swingLows.filter((level) => {
    const distancePct = (currentPrice - level) / currentPrice;
    return distancePct >= minDistancePct && distancePct <= maxDistancePct;
  });

  const clustered = clusterLevels(filtered, 0.0025);
  if (!clustered.length) return null;

  const nearest = [...clustered].sort((a, b) => b - a)[0]!;
  return isLevelSane(currentPrice, nearest) ? nearest : null;
}

/**
 * Convenience: slice last candles, convert shape, run resistance detection.
 */
export function detectNearestResistanceFromChartCandles(
  raw: ReadonlyArray<{ ts: number; open: number; high: number; low: number; close: number; volume?: number }>,
  currentPrice: number,
  maxCandles = DEFAULT_MAX_CANDLES,
): number | null {
  const candles = toStructureCandles(raw, maxCandles);
  return detectNearestResistance(candles, currentPrice);
}

export function detectNearestSupportFromChartCandles(
  raw: ReadonlyArray<{ ts: number; open: number; high: number; low: number; close: number; volume?: number }>,
  currentPrice: number,
  maxCandles = DEFAULT_MAX_CANDLES,
): number | null {
  const candles = toStructureCandles(raw, maxCandles);
  return detectNearestSupport(candles, currentPrice);
}
