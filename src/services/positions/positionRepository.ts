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
