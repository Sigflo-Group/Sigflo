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

export type PositionRepository = {
  getActivePositionByPair(pair: string): SigfloActivePosition | null;
  /** All rows the repository currently considers open (demo: mock list; future: synced open legs). */
  listActivePositions(): readonly SigfloActivePosition[];
  /** Optional mutable operations (supported by demo repository). */
  closePositionByPair?: (pair: string) => boolean;
  closeAllPositions?: (opts?: { markByPair?: Record<string, number> }) => number;
  openPaperPosition?: (input: PaperTradeOpenInput) => { ok: boolean; position?: SigfloActivePosition; error?: string };
  getPaperTradingSnapshot?: (markByPair?: Record<string, number>) => PaperTradingSnapshot;
};
