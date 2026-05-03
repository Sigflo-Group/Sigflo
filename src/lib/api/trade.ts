import { apiFetch } from '@/lib/api/client';
import type {
  TradeExecuteRequest,
  TradeExecuteResponse,
  TradeExecutionIntentRequest,
  TradeExecutionIntentResponse,
  TradeRecord,
} from '@/types/trade';

export function createTradeIntent(body: TradeExecutionIntentRequest) {
  return apiFetch<TradeExecutionIntentResponse>('/trade/intent', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function executeTrade(body: TradeExecuteRequest) {
  return apiFetch<TradeExecuteResponse>('/trade/execute', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function getTradeById(id: string) {
  return apiFetch<{ trade: TradeRecord }>(`/trade/${encodeURIComponent(id)}`);
}

export function listTrades(cursor?: string) {
  const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return apiFetch<{ trades: TradeRecord[]; nextCursor: string | null }>(`/trades${q}`);
}
