import type { Candle, KlineInterval } from '@/types/market';

export function signalPairToLinearKey(pair: string): string {
  const raw = pair.trim().toUpperCase();
  const base = raw.includes('/') ? raw.split('/')[0].trim() : raw.replace(/USDT$/i, '').trim();
  const clean = base.replace(/[^A-Z0-9]/g, '');
  return `${clean || 'BTC'}USDT`;
}

export function signalEmitKey(symbol: string, setupType: string, side: 'long' | 'short'): string {
  return `${symbol}:${setupType}:${side}`;
}

export function emptyIntervalCandles(): Record<KlineInterval, Candle[]> {
  return {
    '1': [],
    '5': [],
    '15': [],
    '60': [],
    '240': [],
    D: [],
    W: [],
  };
}

export function upsertCandle(store: Candle[], next: Candle): Candle[] {
  const out = [...store];
  const last = out.at(-1);
  if (!last || next.ts > last.ts) out.push(next);
  else if (next.ts === last.ts) out[out.length - 1] = next;
  else {
    let lo = 0; let hi = out.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (out[mid].ts < next.ts) lo = mid + 1; else hi = mid; }
    if (lo < out.length && out[lo].ts === next.ts) out[lo] = next; else out.splice(lo, 0, next);
  }
  return out.length <= 240 ? out : out.slice(-240);
}
