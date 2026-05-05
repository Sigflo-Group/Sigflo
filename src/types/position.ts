import type { TradeSide } from '@/types/trade';

/** Where this row originated — broker wiring will add live sources later. */
export type SigfloPositionSource = 'demo' | 'bybit' | 'manual';

export type SigfloMarginMode = 'cross' | 'isolated' | 'spot';

/**
 * Canonical open-position row for Sigflo UI (active management, exit automation, trade review).
 * Not a wire-format for any exchange.
 */
export type SigfloActivePosition = {
  id: string;
  /** Display label, e.g. `BTC / USDT` */
  pair: string;
  direction: TradeSide;
  entryPrice: number;
  markPrice: number;
  /** Signed contract / base size as used by the rest of the ticket (linear qty). */
  size: number;
  leverage: number;
  marginMode: SigfloMarginMode;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  stopPrice: number | null;
  liquidationPrice: number | null;
  targets: number[];
  openedAt: number;
  source: SigfloPositionSource;
};
