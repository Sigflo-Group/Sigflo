import { atr, ema, rsi } from '@/lib/indicators';
import type { MarketMemorySnapshot } from '@/lib/marketMemory';
import type { Candle } from '@/types/market';
import type { SignalLifecycleEvent } from '@/types/signal';
import type {
  RegimeKind,
  RegimePredictorOutput,
  RegimePredictorState,
  RegimeTransitionPressures,
} from '@/types/regimePredictor';

const REGIME_PREDICTOR_STORE_KEY = '__SIGFLO_REGIME_PREDICTOR_V1__';

const PRESSURE_KEYS: Array<keyof RegimeTransitionPressures> = [
  'trendToRange',
  'rangeToTrend',
  'compressionToExpansion',
  'expansionToCompression',
  'stableToVolatile',
  'volatileToStable',
];

const EMPTY_PRESSURES: RegimeTransitionPressures = {
  trendToRange: 0,
  rangeToTrend: 0,
  compressionToExpansion: 0,
  expansionToCompression: 0,
  stableToVolatile: 0,
  volatileToStable: 0,
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function ratioPct(n: number): number {
  return Math.round(n * 100);
}

function regimeFromMemory(memory: MarketMemorySnapshot): RegimeKind {
  return memory.regime;
}

function directionalEfficiency(candles: Candle[], lookback = 24): number {
  const slice = candles.slice(-lookback);
  if (slice.length < 4) return 0;
  const first = slice[0]!.close;
  const last = slice[slice.length - 1]!.close;
  const absNet = Math.abs(last - first);
  let path = 0;
  for (let i = 1; i < slice.length; i += 1) {
    path += Math.abs(slice[i]!.close - slice[i - 1]!.close);
  }
  if (path <= 1e-8) return 0;
  return clamp(absNet / path, 0, 1);
}

function alternationRate(candles: Candle[], lookback = 20): number {
  const slice = candles.slice(-lookback);
  if (slice.length < 5) return 0;
  let turns = 0;
  let prevSign = 0;
  for (let i = 1; i < slice.length; i += 1) {
    const d = slice[i]!.close - slice[i - 1]!.close;
    const sign = d > 0 ? 1 : d < 0 ? -1 : 0;
    if (sign === 0) continue;
    if (prevSign !== 0 && sign !== prevSign) turns += 1;
    prevSign = sign;
  }
  return clamp(turns / Math.max(1, slice.length - 2), 0, 1);
}

function emaSpreadPct(candles: Candle[]): number {
  const closes = candles.map((c) => c.close);
  if (closes.length < 55) return 0;
  const e20 = ema(closes, 20);
  const e50 = ema(closes, 50);
  const c = closes.at(-1) ?? 0;
  if (c <= 0) return 0;
  return Math.abs((e20.at(-1) ?? c) - (e50.at(-1) ?? c)) / c;
}

function atrFeatures(candles: Candle[]): {
  atrRatio: number;
  atrSlope: number;
  rangeCompression: number;
} {
  if (candles.length < 30) return { atrRatio: 1, atrSlope: 0, rangeCompression: 1 };
  const atrSeries = atr(candles, 14);
  const atrNow = atrSeries.at(-1) ?? 0;
  const atrPrev = atrSeries.at(-4) ?? atrNow;
  const atrAvg = atrSeries.slice(-20).reduce((s, v) => s + v, 0) / Math.max(1, Math.min(20, atrSeries.length));
  const atrRatio = atrAvg > 1e-8 ? atrNow / atrAvg : 1;
  const atrSlope = atrPrev > 1e-8 ? (atrNow - atrPrev) / atrPrev : 0;
  const recent = candles.slice(-12);
  const hi = Math.max(...recent.map((c) => c.high));
  const lo = Math.min(...recent.map((c) => c.low));
  const rangeCompression = atrNow > 1e-8 ? (hi - lo) / atrNow : 0;
  return { atrRatio, atrSlope, rangeCompression };
}

function momentumFeatures(candles: Candle[]): {
  rsiNow: number;
  rsiSlope: number;
  momentumDivergenceHint: number;
} {
  const closes = candles.map((c) => c.close);
  if (closes.length < 25) return { rsiNow: 50, rsiSlope: 0, momentumDivergenceHint: 0 };
  const r = rsi(closes, 14);
  const rsiNow = r.at(-1) ?? 50;
  const rsiPrev = r.at(-4) ?? rsiNow;
  const rsiSlope = (rsiNow - rsiPrev) / 4;
  const pxNow = closes.at(-1) ?? 0;
  const pxPrev = closes.at(-4) ?? pxNow;
  const pxDelta = pxNow - pxPrev;
  const divergence =
    (pxDelta > 0 && rsiSlope < -0.2) || (pxDelta < 0 && rsiSlope > 0.2) ? Math.min(1, Math.abs(rsiSlope) / 4) : 0;
  return { rsiNow, rsiSlope, momentumDivergenceHint: divergence };
}

function recentLifecycleStats(events: SignalLifecycleEvent[], symbol: string): {
  fakeoutRate: number;
  failedRate: number;
  completedCount: number;
} {
  const rows = events
    .filter((e) => e.symbol === symbol)
    .filter((e) => e.status === 'completed' || e.status === 'archived')
    .slice(-20);
  if (rows.length === 0) return { fakeoutRate: 0, failedRate: 0, completedCount: 0 };
  const losses = rows.filter((e) => e.outcome === 'loss').length;
  const fakeouts = rows.filter((e) => e.notes.some((n) => /fakeout/i.test(n))).length;
  return {
    fakeoutRate: fakeouts / rows.length,
    failedRate: losses / rows.length,
    completedCount: rows.length,
  };
}

function blendPressure(prev: number, target: number): number {
  const decayKeep = 0.84;
  const response = 0.16;
  return clamp(prev * decayKeep + target * response, 0, 100);
}

function transitionTargets(args: {
  memory: MarketMemorySnapshot;
  candles15m: Candle[];
  lifecycleEvents: SignalLifecycleEvent[];
  symbol: string;
}): {
  targets: RegimeTransitionPressures;
  evidence: string[];
  warningSignals: string[];
  riskFlags: string[];
} {
  const { memory, candles15m, lifecycleEvents, symbol } = args;
  const evidence: string[] = [];
  const warningSignals: string[] = [];
  const riskFlags: string[] = [];

  const regime = regimeFromMemory(memory);
  const de = directionalEfficiency(candles15m, 26);
  const alt = alternationRate(candles15m, 20);
  const spread = emaSpreadPct(candles15m);
  const { atrRatio, atrSlope, rangeCompression } = atrFeatures(candles15m);
  const { rsiSlope, momentumDivergenceHint } = momentumFeatures(candles15m);
  const life = recentLifecycleStats(lifecycleEvents, symbol);

  if (de < 0.22) evidence.push(`Momentum is becoming less reliable (${ratioPct(de)}% directional follow-through).`);
  if (alt > 0.45) evidence.push(`Price is flipping direction more often (${ratioPct(alt)}% of recent bars).`);
  if (spread < 0.0035) evidence.push('Trend lines are flattening, which often signals weaker follow-through.');
  if (atrRatio < 0.9) evidence.push('Price movement has cooled versus recent activity.');
  if (atrRatio > 1.18) evidence.push('Price movement is heating up versus recent activity.');
  if (life.completedCount >= 6 && life.fakeoutRate >= 0.25) {
    evidence.push(`False breaks are appearing more often (${ratioPct(life.fakeoutRate)}% of recent outcomes).`);
  }
  if (life.completedCount >= 6 && life.failedRate >= 0.45) {
    evidence.push(`Recent setups are failing more frequently (${ratioPct(life.failedRate)}%).`);
  }

  const trendToRangeTarget = clamp(
    (regime === 'trend' ? 18 : 8) +
      (memory.momentumState === 'weakening' ? 18 : 0) +
      clamp((0.28 - de) * 120, 0, 22) +
      clamp((0.004 - spread) * 3000, 0, 16) +
      memory.failedContinuationAttempts * 2.4 +
      life.fakeoutRate * 24 +
      momentumDivergenceHint * 20,
    0,
    100,
  );

  const rangeToTrendTarget = clamp(
    (regime === 'range' ? 18 : 7) +
      (memory.momentumState === 'strengthening' ? 14 : 0) +
      clamp((de - 0.24) * 110, 0, 20) +
      (memory.breakoutStatus === 'confirmed' ? 22 : memory.breakoutStatus === 'building' ? 10 : 0) +
      clamp((atrRatio - 1) * 35, 0, 16) +
      clamp((rsiSlope - 0.2) * 16, 0, 10),
    0,
    100,
  );

  const compressionToExpansionTarget = clamp(
    (regime === 'compression' ? 22 : 8) +
      clamp((0.95 - atrRatio) * 38, 0, 18) +
      clamp((3.4 - rangeCompression) * 12, 0, 20) +
      memory.breakoutAttempts * 1.8 +
      memory.failedBreakoutsRecent * 2.4 +
      clamp((atrSlope + 0.12) * 95, 0, 14),
    0,
    100,
  );

  const expansionToCompressionTarget = clamp(
    ((regime === 'volatile' || regime === 'trend') ? 14 : 8) +
      clamp((1.05 - atrRatio) * 42, 0, 18) +
      clamp((-atrSlope) * 85, 0, 18) +
      clamp((0.24 - de) * 100, 0, 14) +
      memory.failedBreakoutsRecent * 1.8,
    0,
    100,
  );

  const stableToVolatileTarget = clamp(
    ((regime === 'range' || regime === 'compression') ? 16 : 8) +
      clamp((atrRatio - 1) * 40, 0, 20) +
      clamp(atrSlope * 105, 0, 20) +
      memory.failedBreakoutsRecent * 2 +
      life.fakeoutRate * 26 +
      momentumDivergenceHint * 14,
    0,
    100,
  );

  const volatileToStableTarget = clamp(
    (regime === 'volatile' ? 22 : 8) +
      clamp((1.05 - atrRatio) * 44, 0, 24) +
      clamp((-atrSlope) * 95, 0, 18) +
      clamp((0.34 - alt) * 40, 0, 10),
    0,
    100,
  );

  if (trendToRangeTarget >= 55) {
    warningSignals.push('Trend is losing strength and conditions may turn choppy.');
  }
  if (rangeToTrendTarget >= 55) {
    warningSignals.push('A cleaner directional move may be starting to form.');
  }
  if (compressionToExpansionTarget >= 55) {
    warningSignals.push('Breakout pressure is building after a quieter phase.');
  }
  if (stableToVolatileTarget >= 55) {
    warningSignals.push('Market activity is increasing after a calmer period.');
  }
  if (volatileToStableTarget >= 55) {
    warningSignals.push('The market may be settling into steadier movement.');
  }
  if (life.fakeoutRate >= 0.3 && life.completedCount >= 6) {
    riskFlags.push('High fakeout risk');
  }
  if (trendToRangeTarget >= 60) {
    riskFlags.push('Trend losing strength');
  }
  if (compressionToExpansionTarget >= 60 || stableToVolatileTarget >= 60) {
    riskFlags.push('Breakout pressure building');
  }

  return {
    targets: {
      trendToRange: trendToRangeTarget,
      rangeToTrend: rangeToTrendTarget,
      compressionToExpansion: compressionToExpansionTarget,
      expansionToCompression: expansionToCompressionTarget,
      stableToVolatile: stableToVolatileTarget,
      volatileToStable: volatileToStableTarget,
    },
    evidence: evidence.slice(0, 6),
    warningSignals: warningSignals.slice(0, 6),
    riskFlags: Array.from(new Set(riskFlags)).slice(0, 5),
  };
}

function likelyNextRegime(
  pressures: RegimeTransitionPressures,
  currentRegime: RegimeKind,
): RegimeKind | null {
  const sorted = PRESSURE_KEYS
    .map((k) => ({ key: k, value: pressures[k] }))
    .sort((a, b) => b.value - a.value);
  const best = sorted[0];
  const second = sorted[1];
  if (!best || best.value < 38) return null;
  if (second && best.value - second.value < 4) return null;
  switch (best.key) {
    case 'trendToRange':
      return currentRegime === 'range' ? null : 'range';
    case 'rangeToTrend':
      return currentRegime === 'trend' ? null : 'trend';
    case 'compressionToExpansion':
      return currentRegime === 'volatile' ? null : 'volatile';
    case 'expansionToCompression':
      return currentRegime === 'compression' ? null : 'compression';
    case 'stableToVolatile':
      return currentRegime === 'volatile' ? null : 'volatile';
    case 'volatileToStable':
      if (currentRegime !== 'volatile') return null;
      return 'range';
    default:
      return null;
  }
}

export function createEmptyRegimePredictorOutput(currentRegime: RegimeKind): RegimePredictorOutput {
  return {
    currentRegime,
    regimeStability: 100,
    shiftProbability: 0,
    likelyNextRegime: null,
    earlyWarningSignals: [],
    supportingEvidence: [],
    riskFlags: [],
    transitionPressures: { ...EMPTY_PRESSURES },
  };
}

export function updateRegimePredictor(args: {
  previous: RegimePredictorState | null;
  symbol: string;
  memory: MarketMemorySnapshot;
  candles15m: Candle[];
  lifecycleEvents: SignalLifecycleEvent[];
  now: number;
}): RegimePredictorState {
  const { previous, symbol, memory, candles15m, lifecycleEvents, now } = args;
  const currentRegime = regimeFromMemory(memory);
  const prevPressures = previous?.output.transitionPressures ?? EMPTY_PRESSURES;
  const { targets, evidence, warningSignals, riskFlags } = transitionTargets({
    memory,
    candles15m,
    lifecycleEvents,
    symbol,
  });
  const pressures: RegimeTransitionPressures = {
    trendToRange: blendPressure(prevPressures.trendToRange, targets.trendToRange),
    rangeToTrend: blendPressure(prevPressures.rangeToTrend, targets.rangeToTrend),
    compressionToExpansion: blendPressure(
      prevPressures.compressionToExpansion,
      targets.compressionToExpansion,
    ),
    expansionToCompression: blendPressure(
      prevPressures.expansionToCompression,
      targets.expansionToCompression,
    ),
    stableToVolatile: blendPressure(prevPressures.stableToVolatile, targets.stableToVolatile),
    volatileToStable: blendPressure(prevPressures.volatileToStable, targets.volatileToStable),
  };

  const sortedValues = Object.values(pressures).sort((a, b) => b - a);
  const top = sortedValues[0] ?? 0;
  const second = sortedValues[1] ?? 0;
  const shiftProbability = clamp(Math.round(top * 0.78 + second * 0.22), 0, 100);
  const stabilityBase = 100 - shiftProbability;
  const instabilityPenalty = clamp((memory.failedBreakoutsRecent + memory.failedContinuationAttempts) * 1.4, 0, 22);
  const regimeStability = clamp(Math.round(stabilityBase - instabilityPenalty + 8), 0, 100);
  const nextRegime = likelyNextRegime(pressures, currentRegime);

  return {
    symbol,
    updatedAt: now,
    output: {
      currentRegime,
      regimeStability,
      shiftProbability,
      likelyNextRegime: nextRegime,
      earlyWarningSignals: warningSignals,
      supportingEvidence: evidence,
      riskFlags: shiftProbability >= 60 ? Array.from(new Set([...riskFlags, 'Market conditions less stable'])) : riskFlags,
      transitionPressures: {
        trendToRange: round1(pressures.trendToRange),
        rangeToTrend: round1(pressures.rangeToTrend),
        compressionToExpansion: round1(pressures.compressionToExpansion),
        expansionToCompression: round1(pressures.expansionToCompression),
        stableToVolatile: round1(pressures.stableToVolatile),
        volatileToStable: round1(pressures.volatileToStable),
      },
    },
  };
}

export function loadRegimePredictorStore(): Record<string, RegimePredictorState> {
  try {
    const raw = globalThis.localStorage?.getItem(REGIME_PREDICTOR_STORE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, RegimePredictorState>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function persistRegimePredictorStore(store: Record<string, RegimePredictorState>): void {
  try {
    globalThis.localStorage?.setItem(REGIME_PREDICTOR_STORE_KEY, JSON.stringify(store));
  } catch {
    // Ignore quota/privacy failures.
  }
}

