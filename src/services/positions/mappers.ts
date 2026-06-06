import type { SimulatedActivePosition } from '@/types/activePosition';
import type { PositionItem } from '@/types/integrations';
import type { Position } from '@/types/botsPositionsStrip';
import type { SigfloActivePosition } from '@/types/position';
import { livePnlPercent } from '@/lib/positionRoe';
import { normalizePositionPairKey } from '@/services/positions/positionRepository';
import type { MarketMode } from '@/types/trade';

function formatStripPairLabel(pair: string): string {
  const t = pair.trim();
  if (t.includes('/')) return t.replace(/\s*\/\s*/g, ' / ');
  const u = t.toUpperCase();
  const base = u.replace(/USDT$/i, '').replace(/USDC$/i, '').replace(/[^A-Z0-9]/g, '');
  if (base && u.endsWith('USDT')) return `${base} / USDT`;
  if (base && u.endsWith('USDC')) return `${base} / USDC`;
  return t || '—';
}

export function sigfloActiveToStripPosition(p: SigfloActivePosition): Position {
  const isPaper = p.source === 'bots-paper' || p.source === 'demo';
  return {
    pairKey: normalizePositionPairKey(p.pair),
    pairLabel: formatStripPairLabel(p.pair),
    direction: p.direction,
    unrealizedPnl: p.unrealizedPnl,
    unrealizedPnlPct: p.unrealizedPnlPct,
    isPaper,
    sourceLabel: isPaper ? 'PAPER' : 'LIVE',
  };
}

export function sigfloActivePositionFromExchange(
  p: PositionItem,
  displayPair: string,
  liveMark: number,
  exchange: 'bybit' | 'mexc' = 'bybit',
): SigfloActivePosition {
  const mark =
    p.markPrice != null && Number.isFinite(p.markPrice) && p.markPrice > 0 ? p.markPrice : liveMark;
  const lev = p.leverage != null && p.leverage > 0 ? p.leverage : 1;
  const pnlUsd =
    p.unrealizedPnl != null && Number.isFinite(p.unrealizedPnl) ? p.unrealizedPnl : 0;
  const pnlPct = livePnlPercent({
    side: p.side,
    unrealizedPnl: pnlUsd,
    size: p.size,
    entryPrice: p.entryPrice,
    markPrice: mark,
    leverage: lev,
    positionIM: p.positionIM,
  });
  const targets: number[] = [];
  if (p.takeProfitPrice != null && Number.isFinite(p.takeProfitPrice) && p.takeProfitPrice > 0) {
    targets.push(p.takeProfitPrice);
  }

  return {
    id: `${exchange}:${p.symbol}:${p.side}:${p.positionIdx ?? 0}`,
    pair: displayPair,
    direction: p.side,
    entryPrice: p.entryPrice,
    markPrice: mark > 0 ? mark : p.entryPrice,
    size: p.size,
    leverage: lev,
    marginMode: 'cross',
    unrealizedPnl: pnlUsd,
    unrealizedPnlPct: pnlPct,
    stopPrice: p.stopLossPrice ?? null,
    liquidationPrice: p.liqPrice ?? null,
    targets,
    openedAt: p.openedAtMs ?? Date.now(),
    source: exchange,
  };
}

export function simulatedFromSigfloActive(p: SigfloActivePosition, market: MarketMode): SimulatedActivePosition {
  const m = Number.isFinite(p.markPrice) && p.markPrice > 0 ? p.markPrice : p.entryPrice;
  const notionalPrice = p.entryPrice > 0 ? p.entryPrice : m;
  const notional = Math.abs(p.size) * Math.max(notionalPrice, 0);
  const margin = notional / Math.max(1, p.leverage);
  return {
    id: p.id,
    symbol: p.pair,
    side: p.direction,
    market,
    leverage: p.leverage,
    entryPrice: p.entryPrice,
    positionNotionalUsd: notional,
    marginUsd: Math.max(1e-9, margin),
    liquidationPrice: p.liquidationPrice,
    takeProfitPrice: p.targets[0] ?? null,
    stopLossPrice: p.stopPrice,
    openedAtMs: p.openedAt,
  };
}
