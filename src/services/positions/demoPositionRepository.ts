import type { SigfloActivePosition } from '@/types/position';
import { secureStorage } from '@/lib/storage';
import type {
  PaperTradeOpenInput,
  PaperTradingClosedTrade,
  PaperTradingOrder,
  PaperTradingSnapshot,
} from '@/types/paperTrading';
import { normalizePositionPairKey, type PositionRepository } from '@/services/positions/positionRepository';

export const DEMO_POSITIONS_CHANGED_EVENT = 'sigflo:demo-positions-changed';
export const PAPER_TRADING_CHANGED_EVENT = 'sigflo:paper-trading-changed';

const STORAGE_KEY = 'sigflo.paper-trading.state.v1';
const DEFAULT_STARTING_BALANCE_USD = 10_000;
const ORDER_HISTORY_LIMIT = 250;
const CLOSED_HISTORY_LIMIT = 250;

type PersistedPaperTradingState = {
  version: 1;
  startingBalanceUsd: number;
  cashUsd: number;
  positions: SigfloActivePosition[];
  orders: PaperTradingOrder[];
  closedTrades: PaperTradingClosedTrade[];
};

function isFinitePositive(n: number): boolean {
  return Number.isFinite(n) && n > 0;
}

function clampHistory<T>(rows: readonly T[], limit: number): T[] {
  if (rows.length <= limit) return [...rows];
  return [...rows.slice(0, limit)];
}

function randomId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
}

function notionalFromPosition(position: SigfloActivePosition): number {
  return Math.max(0, Math.abs(position.size) * Math.max(position.entryPrice, 0));
}

function marginFromPosition(position: SigfloActivePosition): number {
  const lev = Math.max(1, position.leverage);
  return notionalFromPosition(position) / lev;
}

function pnlUsdFromPosition(position: SigfloActivePosition, markPrice: number): number {
  const mark = isFinitePositive(markPrice) ? markPrice : position.markPrice;
  const size = Math.abs(position.size);
  if (position.direction === 'long') return (mark - position.entryPrice) * size;
  return (position.entryPrice - mark) * size;
}

function withComputedMark(position: SigfloActivePosition, markPrice: number): SigfloActivePosition {
  const mark = isFinitePositive(markPrice) ? markPrice : position.markPrice;
  const pnlUsd = pnlUsdFromPosition(position, mark);
  const margin = Math.max(1e-9, marginFromPosition(position));
  return {
    ...position,
    markPrice: mark,
    unrealizedPnl: pnlUsd,
    unrealizedPnlPct: (pnlUsd / margin) * 100,
  };
}

function safePairFromPosition(position: SigfloActivePosition): string {
  const trimmed = position.pair.trim();
  return trimmed.length > 0 ? trimmed : 'BTC / USDT';
}

export class DemoPositionRepository implements PositionRepository {
  private readonly byKey: Map<string, SigfloActivePosition>;
  private startingBalanceUsd: number;
  private cashUsd: number;
  private orderHistory: PaperTradingOrder[];
  private closedTrades: PaperTradingClosedTrade[];

  constructor(rows: readonly SigfloActivePosition[] = []) {
    const persisted = this.readPersistedState();
    const initialRows = persisted?.positions ?? rows;
    this.byKey = new Map(initialRows.map((r) => [normalizePositionPairKey(r.pair), r] as const));
    this.startingBalanceUsd = persisted?.startingBalanceUsd ?? DEFAULT_STARTING_BALANCE_USD;
    this.cashUsd = persisted?.cashUsd ?? this.startingBalanceUsd;
    this.orderHistory = persisted?.orders ?? [];
    this.closedTrades = persisted?.closedTrades ?? [];
    if (persisted == null) this.persist();
  }

  getActivePositionByPair(pair: string): SigfloActivePosition | null {
    const key = normalizePositionPairKey(pair);
    return this.byKey.get(key) ?? null;
  }

  listActivePositions(): readonly SigfloActivePosition[] {
    return [...this.byKey.values()];
  }

  addPosition(position: SigfloActivePosition): void {
    const open = this.openPaperPosition({
      pair: safePairFromPosition(position),
      market: position.marginMode === 'spot' ? 'spot' : 'futures',
      direction: position.direction,
      entryPrice: position.entryPrice,
      notionalUsd: Math.max(1, notionalFromPosition(position)),
      leverage: Math.max(1, position.leverage),
      stopPrice: position.stopPrice,
      targets: position.targets,
      source: position.source,
      openedAt: position.openedAt,
    });
    if (!open.ok && position.pair.trim().length > 0) {
      const key = normalizePositionPairKey(position.pair);
      this.byKey.set(key, position);
      this.persist();
      this.emitChanged();
    }
  }

  openPaperPosition(input: PaperTradeOpenInput): { ok: boolean; position?: SigfloActivePosition; error?: string } {
    const entryPrice = Number(input.entryPrice);
    const notionalUsd = Number(input.notionalUsd);
    const leverage = Math.max(1, Number(input.leverage));
    if (!isFinitePositive(entryPrice)) return { ok: false, error: 'Missing entry price for paper trade.' };
    if (!isFinitePositive(notionalUsd)) return { ok: false, error: 'Enter a valid paper trade size.' };
    const marginRequired = notionalUsd / leverage;
    if (this.cashUsd < marginRequired) {
      return {
        ok: false,
        error: `Not enough simulated cash. Need $${marginRequired.toFixed(2)}, available $${this.cashUsd.toFixed(2)}.`,
      };
    }

    const pair = input.pair.trim();
    if (!pair) return { ok: false, error: 'Missing pair for paper trade.' };
    const key = normalizePositionPairKey(pair);
    const existing = this.byKey.get(key);
    if (existing) {
      this.closePositionByPair(existing.pair, { markPrice: entryPrice, reason: 'flip_position' });
    }

    const size = notionalUsd / entryPrice;
    const openedAt = input.openedAt ?? Date.now();
    const next: SigfloActivePosition = withComputedMark(
      {
        id: randomId('paper-pos'),
        pair,
        direction: input.direction,
        entryPrice,
        markPrice: entryPrice,
        size,
        leverage,
        marginMode: input.market === 'spot' ? 'spot' : 'cross',
        unrealizedPnl: 0,
        unrealizedPnlPct: 0,
        stopPrice: input.stopPrice ?? null,
        liquidationPrice: null,
        targets: input.targets ?? [],
        openedAt,
        source: input.source ?? 'demo',
      },
      entryPrice,
    );

    this.cashUsd = Math.max(0, this.cashUsd - marginRequired);
    this.byKey.set(key, next);
    this.orderHistory = clampHistory(
      [
        {
          id: randomId('paper-order'),
          createdAt: Date.now(),
          type: 'open',
          side: input.direction === 'long' ? 'buy' : 'sell',
          pair,
          market: input.market,
          direction: input.direction,
          entryPrice,
          notionalUsd,
          leverage,
          status: 'filled',
          note: 'Paper Trading Mode',
        },
        ...this.orderHistory,
      ],
      ORDER_HISTORY_LIMIT,
    );
    this.persist();
    this.emitChanged();
    return { ok: true, position: next };
  }

  closePositionByPair(
    pair: string,
    opts?: { markPrice?: number; reason?: PaperTradingClosedTrade['reason'] },
  ): boolean {
    const key = normalizePositionPairKey(pair);
    const position = this.byKey.get(key);
    if (!position) return false;
    const exitPrice = isFinitePositive(opts?.markPrice ?? NaN) ? (opts?.markPrice as number) : position.markPrice;
    const margin = marginFromPosition(position);
    const pnlUsd = pnlUsdFromPosition(position, exitPrice);
    const notionalUsd = notionalFromPosition(position);
    const reason = opts?.reason ?? 'manual_close';

    this.byKey.delete(key);
    this.cashUsd = Math.max(0, this.cashUsd + margin + pnlUsd);
    this.closedTrades = clampHistory(
      [
        {
          id: randomId('paper-closed'),
          pair: position.pair,
          market: position.marginMode === 'spot' ? 'spot' : 'futures',
          direction: position.direction,
          openedAt: position.openedAt,
          closedAt: Date.now(),
          entryPrice: position.entryPrice,
          exitPrice,
          leverage: position.leverage,
          notionalUsd,
          realizedPnlUsd: pnlUsd,
          reason,
        },
        ...this.closedTrades,
      ],
      CLOSED_HISTORY_LIMIT,
    );
    this.orderHistory = clampHistory(
      [
        {
          id: randomId('paper-order'),
          createdAt: Date.now(),
          type: 'close',
          side: position.direction === 'long' ? 'sell' : 'buy',
          pair: position.pair,
          market: position.marginMode === 'spot' ? 'spot' : 'futures',
          direction: position.direction,
          entryPrice: exitPrice,
          notionalUsd,
          leverage: position.leverage,
          status: 'filled',
          note: 'Paper Trading Mode',
          realizedPnlUsd: pnlUsd,
        },
        ...this.orderHistory,
      ],
      ORDER_HISTORY_LIMIT,
    );
    this.persist();
    this.emitChanged();
    return true;
  }

  closeAllPositions(opts?: { markByPair?: Record<string, number> }): number {
    const count = this.byKey.size;
    if (count === 0) return 0;
    const markByPair = opts?.markByPair ?? {};
    const rows = [...this.byKey.values()];
    for (const row of rows) {
      const key = normalizePositionPairKey(row.pair);
      const mappedMark = markByPair[key] ?? row.markPrice;
      this.closePositionByPair(row.pair, { markPrice: mappedMark, reason: 'close_all' });
    }
    this.emitChanged();
    return count;
  }

  getPaperTradingSnapshot(markByPair?: Record<string, number>): PaperTradingSnapshot {
    const priceMap = markByPair ?? {};
    const positions = [...this.byKey.values()].map((position) => {
      const key = normalizePositionPairKey(position.pair);
      const mark = priceMap[key];
      return withComputedMark(position, mark);
    });
    const lockedMarginUsd = positions.reduce((sum, position) => sum + marginFromPosition(position), 0);
    const unrealizedPnlUsd = positions.reduce((sum, position) => sum + position.unrealizedPnl, 0);
    const realizedPnlUsd = this.closedTrades.reduce((sum, row) => sum + row.realizedPnlUsd, 0);
    const equityUsd = this.cashUsd + lockedMarginUsd + unrealizedPnlUsd;
    return {
      startingBalanceUsd: this.startingBalanceUsd,
      cashUsd: this.cashUsd,
      lockedMarginUsd,
      unrealizedPnlUsd,
      realizedPnlUsd,
      equityUsd,
      portfolioValueUsd: equityUsd,
      positions,
      orders: [...this.orderHistory],
      closedTrades: [...this.closedTrades],
    };
  }

  private readPersistedState(): PersistedPaperTradingState | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = secureStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<PersistedPaperTradingState>;
      if (!parsed || parsed.version !== 1) return null;
      const startingBalanceUsd = isFinitePositive(Number(parsed.startingBalanceUsd))
        ? Number(parsed.startingBalanceUsd)
        : DEFAULT_STARTING_BALANCE_USD;
      const cashUsd = Number.isFinite(Number(parsed.cashUsd)) ? Number(parsed.cashUsd) : startingBalanceUsd;
      const positions = Array.isArray(parsed.positions)
        ? parsed.positions.filter((row): row is SigfloActivePosition => {
            return Boolean(
              row &&
                typeof row.pair === 'string' &&
                (row.direction === 'long' || row.direction === 'short') &&
                Number.isFinite(row.entryPrice) &&
                Number.isFinite(row.size),
            );
          })
        : [];
      const orders = Array.isArray(parsed.orders) ? (parsed.orders as PaperTradingOrder[]) : [];
      const closedTrades = Array.isArray(parsed.closedTrades)
        ? (parsed.closedTrades as PaperTradingClosedTrade[])
        : [];
      return {
        version: 1,
        startingBalanceUsd,
        cashUsd,
        positions,
        orders,
        closedTrades,
      };
    } catch {
      return null;
    }
  }

  private persist(): void {
    if (typeof window === 'undefined') return;
    const next: PersistedPaperTradingState = {
      version: 1,
      startingBalanceUsd: this.startingBalanceUsd,
      cashUsd: this.cashUsd,
      positions: [...this.byKey.values()],
      orders: [...this.orderHistory],
      closedTrades: [...this.closedTrades],
    };
    try {
      secureStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore persistence errors (private mode / quota exceeded).
    }
  }

  private emitChanged(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(DEMO_POSITIONS_CHANGED_EVENT));
      window.dispatchEvent(new CustomEvent(PAPER_TRADING_CHANGED_EVENT));
    }
  }
}
