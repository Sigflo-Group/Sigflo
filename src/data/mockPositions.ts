import type { SigfloActivePosition } from '@/types/position';

/** Demo-only rows keyed by normalized pair (e.g. `BTCUSDT`). */
export const MOCK_SIGFLO_POSITIONS: SigfloActivePosition[] = [
  {
    id: 'demo:btcusdt:long',
    pair: 'BTC / USDT',
    direction: 'long',
    entryPrice: 94_200,
    markPrice: 94_850,
    size: 0.042,
    leverage: 12,
    marginMode: 'cross',
    unrealizedPnl: 27.3,
    unrealizedPnlPct: 6.85,
    stopPrice: 92_800,
    liquidationPrice: 88_150,
    targets: [96_200, 97_400, 99_000],
    openedAt: Date.now() - 3.2 * 60 * 60 * 1000,
    source: 'demo',
  },
];
