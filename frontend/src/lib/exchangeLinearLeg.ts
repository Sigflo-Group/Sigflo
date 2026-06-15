import type { PositionItem } from '@/types/integrations';
import type { TradeSide } from '@/types/trade';

/** True when any synced leg uses Bybit hedge indices (1 = long, 2 = short). */
export function bybitAccountUsesHedgeMode(positions: readonly PositionItem[] | null | undefined): boolean {
  if (!positions?.length) return false;
  return positions.some((p) => {
    const idx = p.positionIdx ?? 0;
    return idx === 1 || idx === 2;
  });
}

/** Bybit linear hedge: idx 1 = long leg, 2 = short; one-way uses 0. */
export function bybitLinearPositionIdxForOpenSide(side: TradeSide, hedgeHintIdx: number): number {
  if (hedgeHintIdx === 1 || hedgeHintIdx === 2) {
    return side === 'long' ? 1 : 2;
  }
  return 0;
}

/** Pick `positionIdx` for a new Bybit open from account / symbol context. */
export function inferBybitOpenPositionIdx(
  positions: readonly PositionItem[] | null | undefined,
  orderSymbol: string,
  side: TradeSide,
): number {
  if (!positions?.length) return 0;
  const onSymbol = positions.filter((p) => p.symbol === orderSymbol && p.size > 0);
  const hedgeLeg = onSymbol.find((p) => {
    const idx = p.positionIdx ?? 0;
    return idx === 1 || idx === 2;
  });
  const hedgeHint =
    hedgeLeg?.positionIdx ??
    (bybitAccountUsesHedgeMode(positions) ? 1 : 0);
  return bybitLinearPositionIdxForOpenSide(side, hedgeHint);
}

/** Resolve one open linear leg — hedge-safe via optional `positionIdx`. */
export function resolveExchangeLinearLeg(
  positions: readonly PositionItem[] | null | undefined,
  symbol: string,
  legSide: TradeSide,
  positionIdx?: number | null,
): PositionItem | null {
  if (!positions?.length) return null;
  const open = positions.filter((x) => x.symbol === symbol && x.size > 0);
  if (open.length === 0) return null;
  if (positionIdx != null && Number.isFinite(positionIdx)) {
    const byIdx = open.find((x) => (x.positionIdx ?? 0) === positionIdx);
    if (byIdx) return byIdx;
  }
  return open.find((x) => x.side === legSide) ?? open[0];
}
