import { atr, ema, rsi } from '@/lib/indicators';
import type { Candle } from '@/types/market';
import type { CryptoSignal, SignalLifecycleStage } from '@/types/signal';

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

type MemoryLevel = {
  price: number;
  touches: number;
  reactions: number;
  kind: 'support' | 'resistance';
  lastTs: number;
};

export type MarketMemorySnapshot = {
  symbol: string;
  updatedAt: number;
  regime: 'trend' | 'range' | 'volatile' | 'compression';
  dominantBias: 'bullish' | 'bearish' | 'neutral';
  momentumState: 'strengthening' | 'weakening' | 'flat';
  volatilityState: 'expanding' | 'contracting';
  breakoutStatus: 'building' | 'confirmed' | 'failed';
  breakoutAttempts: number;
  failedBreakoutsRecent: number;
  failedContinuationAttempts: number;
  shortTermBiasScore: number;
  mediumTermBiasScore: number;
  structuralMemoryScore: number;
  recentSignals: Array<{
    ts: number;
    bias: string;
    confidence: number;
    setupType: string;
    lifecycle: SignalLifecycleStage;
  }>;
  keyLevels: MemoryLevel[];
  lifecycleStage: SignalLifecycleStage;
};

function deriveLifecycleStage(
  previous: SignalLifecycleStage | null,
  signal: CryptoSignal | null,
  momentumState: MarketMemorySnapshot['momentumState'],
  breakoutStatus: MarketMemorySnapshot['breakoutStatus'],
  failedBreakoutsRecent: number,
): SignalLifecycleStage {
  if (!signal) {
    if (previous === 'invalidated' || previous === 'completed') return 'completed';
    if (previous === 'active' || previous === 'confirmed' || previous === 'developing') return 'weakening';
    return 'emerging';
  }
  const confidence = signal.confidence ?? signal.setupScore;
  if (confidence < 45) return failedBreakoutsRecent >= 3 ? 'invalidated' : 'emerging';
  if (momentumState === 'weakening' || breakoutStatus === 'failed') return 'weakening';
  if (confidence < 60) return 'developing';
  if (confidence < 75) return 'confirmed';
  return 'active';
}

function updateLevels(
  prev: MemoryLevel[],
  candles15m: Candle[],
  now: number,
): MemoryLevel[] {
  const out = [...prev];
  const recent = candles15m.slice(-20);
  if (recent.length < 5) return out.slice(-8);
  const high = Math.max(...recent.map((c) => c.high));
  const low = Math.min(...recent.map((c) => c.low));
  const close = recent.at(-1)?.close ?? 0;
  const atrNow = Math.max(1e-8, atr(candles15m, 14).at(-1) ?? 0);
  const tol = atrNow * 0.25;
  const update = (price: number, kind: 'support' | 'resistance') => {
    const idx = out.findIndex((l) => Math.abs(l.price - price) <= tol && l.kind === kind);
    const reacted = kind === 'resistance' ? close < price : close > price;
    if (idx >= 0) {
      out[idx] = {
        ...out[idx]!,
        touches: out[idx]!.touches + 1,
        reactions: out[idx]!.reactions + (reacted ? 1 : 0),
        lastTs: now,
      };
      return;
    }
    out.push({ price, touches: 1, reactions: reacted ? 1 : 0, kind, lastTs: now });
  };
  update(high, 'resistance');
  update(low, 'support');
  return out.filter((l) => now - l.lastTs <= 3 * 24 * 60 * 60 * 1000).slice(-10);
}

export function updateMarketMemory(args: {
  symbol: string;
  previous?: MarketMemorySnapshot;
  candles15m: Candle[];
  signal: CryptoSignal | null;
  now?: number;
}): MarketMemorySnapshot {
  const now = args.now ?? Date.now();
  const prev = args.previous;
  const closes = args.candles15m.map((c) => c.close);
  const ema20 = ema(closes, 20);
  const ema50 = ema(closes, 50);
  const ema20Now = ema20.at(-1) ?? closes.at(-1) ?? 0;
  const ema50Now = ema50.at(-1) ?? closes.at(-1) ?? 0;
  const atrSeries = atr(args.candles15m, 14);
  const atrNow = Math.max(1e-8, atrSeries.at(-1) ?? 0);
  const atrAvg =
    atrSeries.slice(-20).reduce((s, v) => s + v, 0) / Math.max(1, Math.min(20, atrSeries.length));
  const atrRatio = atrAvg > 0 ? atrNow / atrAvg : 1;
  const rsiSeries = rsi(closes, 14);
  const rsiNow = rsiSeries.at(-1) ?? 50;
  const rsiPrev = rsiSeries.at(-2) ?? rsiNow;
  const closeNow = closes.at(-1) ?? 0;
  const trendBull = closeNow > ema20Now && ema20Now > ema50Now;
  const trendBear = closeNow < ema20Now && ema20Now < ema50Now;
  const compression =
    args.candles15m.slice(-8).reduce((sum, c) => sum + (c.high - c.low), 0) / Math.max(atrNow, 1e-8);
  const regime: MarketMemorySnapshot['regime'] =
    atrRatio > 1.35 ? 'volatile' : compression < 2.7 ? 'compression' : trendBull || trendBear ? 'trend' : 'range';
  const dominantBias: MarketMemorySnapshot['dominantBias'] = trendBull ? 'bullish' : trendBear ? 'bearish' : 'neutral';
  const momentumState: MarketMemorySnapshot['momentumState'] =
    rsiNow - rsiPrev > 1.2 ? 'strengthening' : rsiNow - rsiPrev < -1.2 ? 'weakening' : 'flat';
  const volatilityState: MarketMemorySnapshot['volatilityState'] = atrRatio >= 1 ? 'expanding' : 'contracting';

  const priorBreakoutAttempts = prev?.breakoutAttempts ?? 0;
  const breakoutAttempts = priorBreakoutAttempts + (args.signal?.setupType === 'breakout' ? 1 : 0);
  const confidence = args.signal?.confidence ?? args.signal?.setupScore ?? 0;
  const breakoutFailedNow = args.signal?.setupType === 'breakout' && confidence < 60;
  const failedBreakoutsRecent = clamp(
    Math.round((prev?.failedBreakoutsRecent ?? 0) * 0.82 + (breakoutFailedNow ? 1 : 0)),
    0,
    10,
  );
  const continuationFailedNow =
    (args.signal?.setupType === 'pullback' || args.signal?.setupType === 'breakout') && confidence < 55;
  const failedContinuationAttempts = clamp(
    Math.round((prev?.failedContinuationAttempts ?? 0) * 0.84 + (continuationFailedNow ? 1 : 0)),
    0,
    10,
  );
  const breakoutStatus: MarketMemorySnapshot['breakoutStatus'] =
    args.signal?.setupType === 'breakout'
      ? confidence >= 75
        ? 'confirmed'
        : confidence >= 50
          ? 'building'
          : 'failed'
      : failedBreakoutsRecent >= 3
        ? 'failed'
        : prev?.breakoutStatus ?? 'building';

  const shortTermBiasScore = clamp(
    (prev?.shortTermBiasScore ?? 50) * 0.75 +
      (args.signal?.side === 'long' ? 58 : args.signal?.side === 'short' ? 42 : 50) * 0.25,
    0,
    100,
  );
  const mediumTermBiasScore = clamp((prev?.mediumTermBiasScore ?? 50) * 0.85 + (dominantBias === 'bullish' ? 8 : dominantBias === 'bearish' ? -8 : 0), 0, 100);
  const structuralMemoryScore = clamp(
    (prev?.structuralMemoryScore ?? 50) * 0.9 +
      (regime === 'trend' ? 6 : regime === 'range' ? -4 : regime === 'compression' ? -2 : -6),
    0,
    100,
  );

  const lifecycleStage = deriveLifecycleStage(
    prev?.lifecycleStage ?? null,
    args.signal,
    momentumState,
    breakoutStatus,
    failedBreakoutsRecent,
  );

  const recentSignals = [
    ...(prev?.recentSignals ?? []).filter((s) => now - s.ts < 3 * 24 * 60 * 60 * 1000),
    ...(args.signal
      ? [
          {
            ts: now,
            bias: args.signal.biasLabel,
            confidence,
            setupType: args.signal.setupType,
            lifecycle: lifecycleStage,
          },
        ]
      : []),
  ].slice(-40);

  const keyLevels = updateLevels(prev?.keyLevels ?? [], args.candles15m, now);

  return {
    symbol: args.symbol,
    updatedAt: now,
    regime,
    dominantBias,
    momentumState,
    volatilityState,
    breakoutStatus,
    breakoutAttempts,
    failedBreakoutsRecent,
    failedContinuationAttempts,
    shortTermBiasScore,
    mediumTermBiasScore,
    structuralMemoryScore,
    recentSignals,
    keyLevels,
    lifecycleStage,
  };
}
