import type { ExchangeSnapshot } from '@/types/integrations';
import type { TradeSide } from '@/types/trade';

/** True when the exchange snapshot still shows an open linear leg for symbol+side (hedge-safe on Bybit). */
export function exchangeLinearLegStillOpen(
  snapshots: ExchangeSnapshot[],
  exchange: 'bybit' | 'mexc',
  symbol: string,
  legSide: TradeSide,
  positionIdx = 0,
): boolean {
  const snap = snapshots.find((s) => s.exchange === exchange && s.status === 'connected');
  if (!snap?.positions?.length) return false;
  return snap.positions.some((p) => {
    if (p.symbol !== symbol || !(p.size > 0) || p.side !== legSide) return false;
    if (exchange === 'mexc') return true;
    return (p.positionIdx ?? 0) === positionIdx;
  });
}

/** Poll portfolio sync until the linear leg disappears or deadline (post-close settle). */
export async function pollUntilExchangeLinearLegClosed(
  refresh: () => Promise<ExchangeSnapshot[]>,
  exchange: 'bybit' | 'mexc',
  symbol: string,
  legSide: TradeSide,
  positionIdx = 0,
  opts?: { deadlineMs?: number; intervalMs?: number },
): Promise<{ closed: boolean; snapshots: ExchangeSnapshot[] }> {
  const deadline = Date.now() + (opts?.deadlineMs ?? 15_000);
  const interval = opts?.intervalMs ?? 400;
  let snapshots = await refresh();
  while (
    exchangeLinearLegStillOpen(snapshots, exchange, symbol, legSide, positionIdx) &&
    Date.now() < deadline
  ) {
    await new Promise<void>((r) => {
      globalThis.setTimeout(r, interval);
    });
    snapshots = await refresh();
  }
  const closed = !exchangeLinearLegStillOpen(snapshots, exchange, symbol, legSide, positionIdx);
  return { closed, snapshots };
}
