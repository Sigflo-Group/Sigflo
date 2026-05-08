import type { BotAgent } from '@/lib/bots';
import type { ClosedTradeRow, ExchangeSnapshot } from '@/types/integrations';

const STABLE_ASSETS = new Set(['USDT', 'USDC', 'USD', 'BUSD', 'DAI', 'TUSD', 'FDUSD', 'USDE']);

function equityUsdForSnapshot(s: ExchangeSnapshot): number {
  if (s.status !== 'connected') return 0;
  const te = s.accountBreakdown?.overview?.totalEquity;
  if (te != null && Number.isFinite(te) && te > 0) return te;
  let st = 0;
  for (const b of s.balances) {
    if (STABLE_ASSETS.has(b.asset.toUpperCase())) st += b.total;
  }
  let up = 0;
  for (const p of s.positions) up += p.unrealizedPnl ?? 0;
  return Math.max(0, st + up);
}

/** Sum of equity across connected exchange snapshots (for PnL % scaling). */
export function portfolioNetEquityUsd(snapshots: ExchangeSnapshot[]): number {
  let sum = 0;
  for (const s of snapshots) sum += equityUsdForSnapshot(s);
  return sum;
}

export function portfolioHasConnectedExchange(snapshots: ExchangeSnapshot[]): boolean {
  return snapshots.some((s) => s.status === 'connected');
}

/** Base asset for linear-style symbols (e.g. BTCUSDT → BTC). */
export function linearSymbolBase(symbol: string): string {
  const u = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const quotes = ['USDT', 'USDC', 'USD', 'BUSD', 'USDE', 'PERP'] as const;
  for (const q of quotes) {
    if (u.endsWith(q) && u.length > q.length) return u.slice(0, -q.length);
  }
  return u || symbol;
}

function watchedBaseSet(bot: BotAgent): Set<string> {
  return new Set(bot.watchedPairs.map((w) => linearSymbolBase(w)));
}

export function botOwnsSymbolBase(bot: BotAgent, symbol: string): boolean {
  return watchedBaseSet(bot).has(linearSymbolBase(symbol));
}

/** Pick a display bot for a symbol (first match in list order). */
export function attributeBotNameForSymbol(symbol: string, bots: BotAgent[]): string {
  const b = linearSymbolBase(symbol);
  for (const bot of bots) {
    if (watchedBaseSet(bot).has(b)) return bot.name;
  }
  return 'Portfolio';
}

export function closedTradesSinceUtc(closed: ClosedTradeRow[], sinceMs: number): ClosedTradeRow[] {
  return closed.filter((t) => new Date(t.closedAt).getTime() >= sinceMs);
}

export function utcDayStartMs(d = new Date()): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export type BotDayStats = {
  botId: string;
  name: string;
  dailyPnl: number;
  tradesToday: number;
  /** Win rate from today’s attributed closes, else null. */
  winRatePct: number | null;
  /** Shown when there are no attributed closes today. */
  seedWinRatePct: number;
};

export function buildBotDayStats(bots: BotAgent[], closedToday: ClosedTradeRow[]): BotDayStats[] {
  return bots.map((bot) => {
    const rows = closedToday.filter((t) => botOwnsSymbolBase(bot, t.symbol));
    const dailyPnl = rows.reduce((s, t) => s + t.closedPnl, 0);
    const settled = rows.filter((t) => Math.abs(t.closedPnl) >= 1e-8);
    const wins = settled.filter((t) => t.closedPnl > 0).length;
    const winRatePct = settled.length > 0 ? Math.round((wins / settled.length) * 100) : null;
    return {
      botId: bot.id,
      name: bot.name,
      dailyPnl,
      tradesToday: rows.length,
      winRatePct,
      seedWinRatePct: bot.stats.winRatePct,
    };
  });
}

/** Approximate % impact vs equity for a closed PnL row (no per-trade notional in API). */
export function closedPnlAsEquityPct(closedPnl: number, equityUsd: number): number {
  const base = Math.max(100, Math.abs(equityUsd) * 0.004);
  return (closedPnl / base) * 100;
}

/** Bot card footer when an exchange is connected — attributed closed trades by watched pairs. */
export type BotCardExchangeStats = {
  tradesToday: number;
  winRatePct: number | null;
  lastResultPct: number | null;
};

export function buildBotCardExchangeStats(
  bot: BotAgent,
  closedTrades: ClosedTradeRow[],
  equityUsd: number,
): BotCardExchangeStats {
  const attributed = closedTrades.filter((t) => botOwnsSymbolBase(bot, t.symbol));
  const tradesToday = closedTradesSinceUtc(attributed, utcDayStartMs()).length;
  const settled = attributed.filter((t) => Math.abs(t.closedPnl) >= 1e-8);
  const wins = settled.filter((t) => t.closedPnl > 0).length;
  const winRatePct = settled.length > 0 ? Math.round((wins / settled.length) * 100) : null;
  const sorted = [...attributed].sort(
    (a, b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime(),
  );
  const last = sorted[0];
  const lastResultPct =
    last != null ? closedPnlAsEquityPct(last.closedPnl, equityUsd) : null;
  return { tradesToday, winRatePct, lastResultPct };
}
