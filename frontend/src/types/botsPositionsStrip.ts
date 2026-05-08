import type { TradeSide } from '@/types/trade';

/** Row for `ActivePositionsStrip` (Bots summary). Named `Position` per product spec; import from this module only. */
export type Position = {
  pairKey: string;
  pairLabel: string;
  direction: TradeSide;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  isPaper?: boolean;
  sourceLabel?: 'LIVE' | 'PAPER';
};
