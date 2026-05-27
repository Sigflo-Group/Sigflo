import { apiJson } from './http';
import type { ExchangeId, IntegrationStatus } from '@/types/integrations';

export async function listIntegrations(): Promise<IntegrationStatus[]> {
  return apiJson<IntegrationStatus[]>('/exchange/status');
}

export async function connectExchange(
  exchange: ExchangeId,
  input: { apiKey: string; apiSecret: string; passphrase?: string },
): Promise<IntegrationStatus> {
  return apiJson<IntegrationStatus>('/exchange/link', {
    method: 'POST',
    body: JSON.stringify({ broker: exchange, apiKey: input.apiKey, apiSecret: input.apiSecret }),
  });
}

export async function disconnectExchange(exchange: ExchangeId): Promise<void> {
  await apiJson<void>(`/exchange/${exchange}`, { method: 'DELETE' });
}

export async function setActiveExchange(accountId: string): Promise<IntegrationStatus> {
  return apiJson<IntegrationStatus>(`/exchange/${accountId}/activate`, { method: 'PATCH' });
}
