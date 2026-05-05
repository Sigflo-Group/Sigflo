import type { DetectorOutput, StrategyType } from '@/types/engine';
import type { Direction } from '@/types/botSystem';
import type { EngineSnapshotCandle, MarketSnapshot } from '@/types/market';
import {
  buildAtrLevels,
  clampScore,
  capReversalReady,
  getOpportunityStateFromScore,
  getRiskLabel,
  timeframeAlignmentForStrategy,
} from '@/services/engine/scoring';

function lastClose(snapshot: MarketSnapshot): number {
  const last = snapshot.candles[snapshot.candles.length - 1];
  return last?.close ?? snapshot.price;
}

function lastCandle(snapshot: MarketSnapshot): EngineSnapshotCandle | null {
  const n = snapshot.candles.length;
  return n > 0 ? snapshot.candles[n - 1]! : null;
}

function slugPair(pair: string): string {
  return pair.replace(/\//g, '-').toLowerCase();
}

function buildId(pair: string, strategy: StrategyType, engine: DetectorOutput['sourceEngine']): string {
  return `demo-${slugPair(pair)}-${strategy.toLowerCase()}-${engine.toLowerCase()}`;
}

function freshnessFor(pair: string, strategy: StrategyType): number {
  let h = 0;
  for (let i = 0; i < pair.length; i++) h = (h + pair.charCodeAt(i) * (i + 7)) % 997;
  const s = strategy.length * 13;
  return 12 + (h + s) % 180;
}

function requireSnapshot(snapshot: MarketSnapshot): boolean {
  if (snapshot.candles.length < 5) return false;
  const { ema20, ema50, rsi, atr } = snapshot.indicators;
  return [ema20, ema50, rsi, atr].every((x) => x != null && Number.isFinite(x));
}

function recentHigh(candles: EngineSnapshotCandle[], bars: number): number {
  const slice = candles.slice(-bars);
  return slice.reduce((m, c) => Math.max(m, c.high), 0);
}

/** Lower wick rejection (bullish bias). */
function rejectionCandleLong(c: EngineSnapshotCandle): boolean {
  const body = Math.abs(c.close - c.open);
  const lowerWick = Math.min(c.open, c.close) - c.low;
  return body > 0 && lowerWick >= body * 0.55 && c.close >= c.open;
}

function rejectionCandleShort(c: EngineSnapshotCandle): boolean {
  const body = Math.abs(c.close - c.open);
  const upperWick = c.high - Math.max(c.open, c.close);
  return body > 0 && upperWick >= body * 0.55 && c.close <= c.open;
}

function bodyRangeRatio(c: EngineSnapshotCandle): number {
  const range = c.high - c.low;
  if (range <= 0) return 0;
  return Math.abs(c.close - c.open) / range;
}

type FinishParams = {
  id: string;
  pair: string;
  direction: Direction;
  strategyType: StrategyType;
  setupType: string;
  scoreRaw: number;
  hasTrigger: boolean;
  thesis: string;
  rationale: string;
  entryZone: string;
  invalidation: string;
  targets: string[];
  freshnessSec: number;
  sourceEngine: DetectorOutput['sourceEngine'];
  cleanTrendAlignment: boolean;
  invalidationTight: boolean;
  rsi?: number;
  volumeRatio?: number;
};

function finishOutput(p: FinishParams): DetectorOutput | null {
  const score = clampScore(p.scoreRaw);
  let state = getOpportunityStateFromScore(score, p.hasTrigger);
  if (p.strategyType === 'Reversal') {
    state = capReversalReady(state, score);
  }
  if (state == null) return null;

  const riskLabel = getRiskLabel({
    score,
    strategyType: p.strategyType,
    rsi: p.rsi,
    volumeRatio: p.volumeRatio,
    cleanTrendAlignment: p.cleanTrendAlignment,
    invalidationTight: p.invalidationTight,
  });

  return {
    id: p.id,
    pair: p.pair,
    direction: p.direction,
    strategyType: p.strategyType,
    setupType: p.setupType,
    hasTrigger: p.hasTrigger,
    score,
    state,
    thesis: p.thesis,
    rationale: p.rationale,
    entryZone: p.entryZone,
    invalidation: p.invalidation,
    targets: p.targets,
    timeframeAlignment: timeframeAlignmentForStrategy(p.strategyType),
    freshnessSec: p.freshnessSec,
    riskLabel,
    sourceEngine: p.sourceEngine,
  };
}

export function runBreakoutDetector(snapshot: MarketSnapshot): DetectorOutput | null {
  if (!requireSnapshot(snapshot)) return null;
  const { indicators, pair } = snapshot;
  const ema20 = indicators.ema20!;
  const ema50 = indicators.ema50!;
  const rsi = indicators.rsi!;
  const atr = indicators.atr!;
  const vol = indicators.volumeRatio!;
  const close = lastClose(snapshot);
  const last = lastCandle(snapshot);
  if (!last) return null;

  if (close <= ema20 || ema20 <= ema50) return null;
  if (vol < 1.25) return null;
  if (rsi < 52 || rsi > 72) return null;

  const rh5 = recentHigh(snapshot.candles, 5);
  /** Allow modest wick room so synthetic OHLC still qualifies as “pressing the high”. */
  if (close < rh5 * 0.995) return null;

  let s = 50;
  s += 10;
  s += vol >= 1.35 ? 10 : 6;
  s += 8;
  s += 8;
  s += bodyRangeRatio(last) >= 0.35 ? 6 : 3;

  const hasTrigger = close >= rh5 * 0.998 && vol >= 1.35;
  const levels = buildAtrLevels(pair, close, atr, 'LONG');

  return finishOutput({
    id: buildId(pair, 'Breakout', 'Nova'),
    pair,
    direction: 'LONG',
    strategyType: 'Breakout',
    setupType: 'Range expansion / breakout',
    scoreRaw: s,
    hasTrigger,
    thesis: 'Volume expansion confirms breakout pressure while trend alignment stays constructive.',
    rationale:
      'Price is pressing the recent swing high with participation above baseline — monitor for follow-through without chasing.',
    entryZone: levels.entryZone,
    invalidation: levels.invalidation,
    targets: levels.targets,
    freshnessSec: freshnessFor(pair, 'Breakout'),
    sourceEngine: 'Nova',
    cleanTrendAlignment: ema20 > ema50 && close > ema20,
    invalidationTight: atr > 0 && close - (close - 1.0 * atr) < 2.5 * atr,
    rsi,
    volumeRatio: vol,
  });
}

export function runReversalDetector(snapshot: MarketSnapshot): DetectorOutput | null {
  if (!requireSnapshot(snapshot)) return null;
  const { indicators, pair } = snapshot;
  const ema20 = indicators.ema20!;
  const ema50 = indicators.ema50!;
  const rsi = indicators.rsi!;
  const atr = indicators.atr!;
  const vol = indicators.volumeRatio!;
  const close = lastClose(snapshot);
  const last = lastCandle(snapshot);
  if (!last) return null;

  let direction: Direction | null = null;
  if (rsi < 35) direction = 'LONG';
  else if (rsi > 65) direction = 'SHORT';
  else return null;

  if (vol < 1.1) return null;

  const extLong = direction === 'LONG' && close < ema20;
  const extShort = direction === 'SHORT' && close > ema20;
  if (!extLong && !extShort) return null;

  const reject =
    direction === 'LONG' ? rejectionCandleLong(last) : rejectionCandleShort(last);
  const deepExtreme = direction === 'LONG' ? rsi < 30 : rsi > 70;
  if (!reject && !deepExtreme) return null;

  let s = 48;
  s += rsi < 35 ? 12 + (35 - rsi) * 0.4 : 12 + (rsi - 65) * 0.4;
  s += 10;
  s += 8;
  const extPct = Math.abs(close - ema20) / ema20;
  s += Math.min(8, extPct * 400);
  s += 6;

  const trendAgainst =
    direction === 'LONG' ? ema20 < ema50 && ema50 < close * 1.002 : ema20 > ema50 && ema50 > close * 0.998;
  if (trendAgainst) s -= 12;
  if (vol < 1.15) s -= 8;

  const hasTrigger = reject && vol >= 1.25;
  const levels = buildAtrLevels(pair, close, atr, direction);

  return finishOutput({
    id: buildId(pair, 'Reversal', 'Rio'),
    pair,
    direction,
    strategyType: 'Reversal',
    setupType: direction === 'LONG' ? 'Oversold mean reversion' : 'Overbought mean reversion',
    scoreRaw: s,
    hasTrigger,
    thesis:
      direction === 'LONG'
        ? 'Reversal candidate needs confirmation candle before entry — structure is stretched but not confirmed.'
        : 'Stretch above the short-term mean with signs of sell-side rejection; confirmation still matters.',
    rationale: `RSI ${rsi.toFixed(0)} and a rejection-style print argue for a measured fade — invalidation should stay tight.`,
    entryZone: levels.entryZone,
    invalidation: levels.invalidation,
    targets: levels.targets,
    freshnessSec: freshnessFor(pair, 'Reversal'),
    sourceEngine: 'Rio',
    cleanTrendAlignment: false,
    invalidationTight: atr > 0,
    rsi,
    volumeRatio: vol,
  });
}

export function runMomentumDetector(snapshot: MarketSnapshot): DetectorOutput | null {
  if (!requireSnapshot(snapshot)) return null;
  const { indicators, pair } = snapshot;
  const ema20 = indicators.ema20!;
  const ema50 = indicators.ema50!;
  const rsi = indicators.rsi!;
  const atr = indicators.atr!;
  const vol = indicators.volumeRatio!;
  const close = lastClose(snapshot);
  const last = lastCandle(snapshot);
  if (!last) return null;

  let direction: Direction | null = null;
  if (close > ema20 && ema20 > ema50) direction = 'LONG';
  else if (close < ema20 && ema20 < ema50) direction = 'SHORT';
  else return null;

  if (vol < 1.2) return null;

  if (direction === 'LONG' && (rsi < 55 || rsi > 70)) return null;
  if (direction === 'SHORT' && (rsi < 30 || rsi > 45)) return null;

  const continuation =
    direction === 'LONG' ? close >= last.open && close >= (last.high + last.low) / 2 : close <= last.open && close <= (last.high + last.low) / 2;
  if (!continuation) return null;

  let s = 52;
  s += 12;
  s += 8;
  s += 8;
  s += 8;
  s += bodyRangeRatio(last) >= 0.25 ? 6 : 2;

  const overheated = direction === 'LONG' ? rsi > 72 : rsi < 28;
  if (overheated) s -= 10;

  const extended =
    direction === 'LONG'
      ? (close - ema20) / ema20 > 0.025
      : (ema20 - close) / ema20 > 0.025;
  if (extended) s -= 8;

  if (vol < 1.15) s -= 10;

  const hasTrigger = continuation && vol >= 1.35 && !extended;
  const levels = buildAtrLevels(pair, close, atr, direction);

  return finishOutput({
    id: buildId(pair, 'Momentum', 'Pulse'),
    pair,
    direction,
    strategyType: 'Momentum',
    setupType: direction === 'LONG' ? 'Trend impulse (long)' : 'Trend impulse (short)',
    scoreRaw: s,
    hasTrigger,
    thesis:
      direction === 'LONG'
        ? 'Trend remains intact while participation supports the directional push.'
        : 'Downward stack holds with sellers still leaning on intraday structure.',
    rationale:
      'EMA stack and momentum band line up — continuation quality matters more than chasing the last tick.',
    entryZone: levels.entryZone,
    invalidation: levels.invalidation,
    targets: levels.targets,
    freshnessSec: freshnessFor(pair, 'Momentum'),
    sourceEngine: 'Pulse',
    cleanTrendAlignment: true,
    invalidationTight: atr > 0,
    rsi,
    volumeRatio: vol,
  });
}

export function runTrendPullbackDetector(snapshot: MarketSnapshot): DetectorOutput | null {
  if (!requireSnapshot(snapshot)) return null;
  const { indicators, pair } = snapshot;
  const ema20 = indicators.ema20!;
  const ema50 = indicators.ema50!;
  const rsi = indicators.rsi!;
  const atr = indicators.atr!;
  const vol = indicators.volumeRatio!;
  const close = lastClose(snapshot);
  const last = lastCandle(snapshot);
  if (!last) return null;

  const dist = Math.abs(close - ema20) / ema20;
  if (dist > 0.012) return null;

  let direction: Direction | null = null;
  if (ema20 > ema50 && close > ema50 && rsi >= 38 && rsi <= 58) direction = 'LONG';
  else if (ema20 < ema50 && close < ema50 && rsi >= 42 && rsi <= 62) direction = 'SHORT';
  else return null;

  const trendIntact =
    direction === 'LONG' ? ema20 > ema50 * 1.002 : ema20 < ema50 * 0.998;
  if (!trendIntact) return null;

  const invLevel = direction === 'LONG' ? ema50 - 0.35 * atr : ema50 + 0.35 * atr;
  const t1 = direction === 'LONG' ? close + 1.2 * atr : close - 1.2 * atr;
  const risk = Math.abs(close - invLevel);
  const reward = Math.abs(t1 - close);
  const rrOk = risk > 0 && reward / risk >= 0.9;

  let s = 50;
  s += 12;
  s += dist < 0.008 ? 10 : 6;
  s += 8;
  s += rrOk ? 8 : 2;
  s += 6;

  if (dist > 0.01) s -= 10;
  if (direction === 'LONG' && (rsi < 35 || rsi > 62)) s -= 8;
  if (direction === 'SHORT' && (rsi < 40 || rsi > 65)) s -= 8;
  if (!rrOk) s -= 8;

  const hasTrigger = dist < 0.007 && rrOk && vol >= 1.15;
  const levels = buildAtrLevels(pair, close, atr, direction);

  return finishOutput({
    id: buildId(pair, 'TrendPullback', 'Guard'),
    pair,
    direction,
    strategyType: 'TrendPullback',
    setupType: 'Trend pullback',
    scoreRaw: s,
    hasTrigger,
    thesis:
      direction === 'LONG'
        ? 'Trend remains intact while price resets near EMA20 — RSI is cooling without breaking the broader trend.'
        : 'Down trend holds as price revisits the mean — watch for a clean rollover rather than forcing size.',
    rationale:
      'Pullback depth is shallow versus structure; invalidation is defined so risk stays explicit if the trend fails.',
    entryZone: levels.entryZone,
    invalidation: levels.invalidation,
    targets: levels.targets,
    freshnessSec: freshnessFor(pair, 'TrendPullback'),
    sourceEngine: 'Guard',
    cleanTrendAlignment: trendIntact,
    invalidationTight: rrOk && atr > 0,
    rsi,
    volumeRatio: vol,
  });
}
