import type { SigfloActivePosition } from '@/types/position';

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
};
