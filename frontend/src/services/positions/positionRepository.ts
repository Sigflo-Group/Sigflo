import type { SigfloActivePosition } from '@/types/position';
import type { PaperTradeOpenInput, PaperTradingSnapshot } from '@/types/paperTrading';

/** Normalize `BTC / USDT`, `BTCUSDT`, `btc-usdt` → `BTCUSDT`. */
export function normalizePositionPairKey(pair: string): string {
  return pair
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/\//g, '')
    .replace(/-/g, '');
}

/** Map live ticker symbols (e.g. `BTCUSDT`) to keys used by paper positions. */
export function buildPaperMarkByPairFromSymbols(
  tickers: Record<string, { lastPrice: number } | null | undefined>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [symbol, ticker] of Object.entries(tickers)) {
    if (!(ticker != null && Number.isFinite(ticker.lastPrice) && ticker.lastPrice > 0)) continue;
    out[normalizePositionPairKey(symbol)] = ticker.lastPrice;
  }
  return out;
}

function pairBaseFromNormalizedKey(key: string): string {
  if (key.endsWith('USDT')) return key.slice(0, -4);
  if (key.endsWith('USDC')) return key.slice(0, -4);
  return key;
}

/**
 * Paper marks from WS tickers, with REST mini-chart closes as fallback per open position.
 */
export function buildPaperMarkByPair(
  tickers: Record<string, { lastPrice: number } | null | undefined>,
  options?: {
    positionPairKeys?: string[];
    lastCloseByPairBase?: Record<string, number>;
  },
): Record<string, number> {
  const out = buildPaperMarkByPairFromSymbols(tickers);
  for (const rawKey of options?.positionPairKeys ?? []) {
    const key = normalizePositionPairKey(rawKey);
    if (out[key] != null && out[key] > 0) continue;
    const close = options?.lastCloseByPairBase?.[pairBaseFromNormalizedKey(key)];
    if (close != null && Number.isFinite(close) && close > 0) out[key] = close;
  }
  return out;
}

export type PositionRepository = {
  getActivePositionByPair(pair: string): SigfloActivePosition | null;
  /** All rows the repository currently considers open (demo: mock list; future: synced open legs). */
  listActivePositions(): readonly SigfloActivePosition[];
  /** Optional mutable operations (supported by demo repository). */
  closePositionByPair?: (
    pair: string,
    opts?: { markPrice?: number; reason?: 'manual_close' | 'flip_position' | 'close_all' },
  ) => boolean;
  closeAllPositions?: (opts?: { markByPair?: Record<string, number> }) => number;
  openPaperPosition?: (input: PaperTradeOpenInput) => { ok: boolean; position?: SigfloActivePosition; error?: string };
  getPaperTradingSnapshot?: (markByPair?: Record<string, number>) => PaperTradingSnapshot;
};
