import { apiJson } from './http';
import type { ClosedTradeRow, ExchangeSnapshot, PositionItem } from '@/types/integrations';

function isMexcStockPosition(p: PositionItem): boolean {
  // MEXC tokenized stocks append "STOCK" to the base asset (e.g. SPCXSTOCK).
  // These are not supported by Sigflo's futures-only MEXC integration.
  return p.symbol.toUpperCase().includes('STOCK');
}

export async function getAccountSnapshots(): Promise<ExchangeSnapshot[]> {
  const data = await apiJson<{ exchanges: ExchangeSnapshot[] }>('/portfolio/accounts');
  const exchanges = data?.exchanges ?? [];
  return exchanges.map((snap) => {
    if (snap.exchange !== 'mexc') return snap;
    return {
      ...snap,
      positions: (snap.positions ?? []).filter((p) => !isMexcStockPosition(p)),
    };
  });
}

export async function getClosedTrades(): Promise<ClosedTradeRow[]> {
  const data = await apiJson<{ trades: ClosedTradeRow[] }>('/portfolio/closed-trades');
  return data?.trades ?? [];
}
