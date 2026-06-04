import type { TradeSource } from '@/types/tradeSource';
import type { ClosedTradeRow } from '@/types/integrations';
import type { PaperTradingClosedTrade } from '@/types/paperTrading';
import type { SigfloActivePosition } from '@/types/position';

const DEFAULT_SOURCE: TradeSource = 'manual';

/** Known trade sources for validation. */
const VALID_SOURCES: ReadonlySet<string> = new Set<TradeSource>([
  'manual',
  'bots-paper',
  'exchange-bot',
  'copy-trade',
]);

/**
 * Safely resolve a trade source value with defensive fallback.
 * - If value is undefined/null → defaults to 'manual'
 * - If value is not a known TradeSource → defaults to 'manual' and logs a warning
 */
export function resolveTradeSource(raw: unknown): TradeSource {
  if (raw == null) return DEFAULT_SOURCE;
  if (VALID_SOURCES.has(raw as string)) return raw as TradeSource;
  if (typeof raw === 'string') {
    console.warn(`[tradeSource] Malformed trade source value: "${raw}". Defaulting to "manual".`);
  }
  return DEFAULT_SOURCE;
}

/** Normalize a raw source value — resolves then casts. */
export function normalizeTradeSource<T extends { source?: unknown }>(item: T): T & { source: TradeSource } {
  return { ...item, source: resolveTradeSource(item.source) };
}

// ── ClosedTradeRow helpers ──────────────────────────────────────────

export function filterTradesBySource(
  trades: ClosedTradeRow[],
  source: TradeSource | TradeSource[],
): ClosedTradeRow[] {
  const sources = Array.isArray(source) ? source : [source];
  const set = new Set(sources);
  return trades.filter((t) => set.has(resolveTradeSource(t.source)));
}

export function getManualTrades(trades: ClosedTradeRow[]): ClosedTradeRow[] {
  return filterTradesBySource(trades, 'manual');
}

export function getRealTrades(trades: ClosedTradeRow[]): ClosedTradeRow[] {
  return filterTradesBySource(trades, ['manual', 'exchange-bot']);
}

export function getPaperBotTrades(trades: ClosedTradeRow[]): ClosedTradeRow[] {
  return filterTradesBySource(trades, 'bots-paper');
}

export function getCombinedTrades(trades: ClosedTradeRow[]): ClosedTradeRow[] {
  return filterTradesBySource(trades, ['manual', 'bots-paper']);
}

// ── PaperTradingClosedTrade helpers ─────────────────────────────────

export function filterPaperClosedBySource(
  trades: PaperTradingClosedTrade[],
  source: TradeSource | TradeSource[],
): PaperTradingClosedTrade[] {
  const sources = Array.isArray(source) ? source : [source];
  const set = new Set(sources);
  return trades.filter((t) => set.has(resolveTradeSource(t.source)));
}

export function getManualPaperClosed(trades: PaperTradingClosedTrade[]): PaperTradingClosedTrade[] {
  return filterPaperClosedBySource(trades, 'manual');
}

export function getPaperBotClosed(trades: PaperTradingClosedTrade[]): PaperTradingClosedTrade[] {
  return filterPaperClosedBySource(trades, 'bots-paper');
}

// ── SigfloActivePosition helpers ────────────────────────────────────

export function filterPositionsBySource(
  positions: SigfloActivePosition[],
  source: TradeSource | TradeSource[],
): SigfloActivePosition[] {
  const sources = Array.isArray(source) ? source : [source];
  const set = new Set(sources);
  return positions.filter((p) => set.has(resolveTradeSource(p.source)));
}

export function getManualPositions(positions: SigfloActivePosition[]): SigfloActivePosition[] {
  return filterPositionsBySource(positions, 'manual');
}

export function getPaperBotPositions(positions: SigfloActivePosition[]): SigfloActivePosition[] {
  return filterPositionsBySource(positions, 'bots-paper');
}

// ── Aggregate analytics helpers ─────────────────────────────────────

export type SourceFilteredAnalytics = {
  manual: {
    tradeCount: number;
    pnl: number;
    wins: number;
    losses: number;
  };
  botsPaper: {
    tradeCount: number;
    pnl: number;
    wins: number;
    losses: number;
  };
  combined: {
    tradeCount: number;
    pnl: number;
    wins: number;
    losses: number;
  };
};

export function computeSourceAnalytics(
  closedTrades: ClosedTradeRow[],
  paperClosedTrades?: PaperTradingClosedTrade[],
): SourceFilteredAnalytics {
  const allTrades: ClosedTradeRow[] = closedTrades;

  const manual = allTrades.filter((t) => resolveTradeSource(t.source) === 'manual');
  const botsPaper = allTrades.filter((t) => resolveTradeSource(t.source) === 'bots-paper');

  const manualPaper = (paperClosedTrades ?? []).filter((t) => resolveTradeSource(t.source) === 'manual');
  const botsPaperLocal = (paperClosedTrades ?? []).filter((t) => resolveTradeSource(t.source) === 'bots-paper');

  function stats(trades: { closedPnl?: number; realizedPnlUsd?: number; source?: unknown }[]) {
    const tradeCount = trades.length;
    const pnl = trades.reduce((s, t) => s + (t.closedPnl ?? t.realizedPnlUsd ?? 0), 0);
    const wins = trades.filter((t) => (t.closedPnl ?? t.realizedPnlUsd ?? 0) > 0).length;
    const losses = trades.filter((t) => (t.closedPnl ?? t.realizedPnlUsd ?? 0) < 0).length;
    return { tradeCount, pnl, wins, losses };
  }

  const allManual = [...manual, ...manualPaper];
  const allBotsPaper = [...botsPaper, ...botsPaperLocal];
  const allCombined = [...allManual, ...allBotsPaper];

  return {
    manual: stats(allManual),
    botsPaper: stats(allBotsPaper),
    combined: stats(allCombined),
  };
}
