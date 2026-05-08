import { apiFetch } from '@/lib/api/client';
import type { BrokerLinkStatus, LinkExchangeRequest, LinkExchangeResponse, RevalidateExchangeResponse } from '@/types/exchange';

export function getExchangeStatus() {
  return apiFetch<{ accounts: BrokerLinkStatus[] }>('/exchange/status');
}

export function linkExchangeAccount(body: LinkExchangeRequest) {
  return apiFetch<LinkExchangeResponse>('/exchange/link', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function revalidateExchangeAccount(accountId: string) {
  return apiFetch<RevalidateExchangeResponse>('/exchange/revalidate', {
    method: 'POST',
    body: JSON.stringify({ accountId }),
  });
}
