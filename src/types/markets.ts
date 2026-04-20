import type { CryptoSignal } from '@/types/signal';

/** Scanner UI state for a tracked perpetual. */
export type MarketRowStatus = 'idle' | 'developing' | 'triggered' | 'extended' | 'overextended';

/** vs last scanner refresh (setup score). */
export type MarketScoreTrend = 'up' | 'down' | 'flat' | null;

export interface MarketsScannerState {
  /** Core watchlist (fixed symbols). */
  trackedRows: MarketScannerRow[];
  /** User-saved pairs from Trade (star); same card shape as scanner rows. */
  watchlistRows: MarketScannerRow[];
  /** Top 24h gainers (Movers tab). */
  moverRows: MarketScannerRow[];
  activeSetupsTracked: number;
  activeSetupsMovers: number;
  moversCount: number;
  mode: 'REST' | 'WS' | 'OFFLINE';
  connection: 'connected' | 'reconnecting' | 'disconnected';
  tickersLoading: boolean;
}

export interface MarketScannerRow {
  symbol: string;
  pair: string;
  /** Merged signal for display + Trade (live engine). */
  signal: CryptoSignal;
  lastPrice: number;
  change24hPct: number;
  setupScore: number;
  setupScoreLabel: string;
  insight: string;
  setupTag?: string;
  status: MarketRowStatus;
  /** When this row entered in-play (client clock); for relative timing copy. */
  triggeredAtMs?: number;
  /** Populated after first ticker/engine refresh vs prior snapshot. */
  scoreTrend?: MarketScoreTrend;
}
