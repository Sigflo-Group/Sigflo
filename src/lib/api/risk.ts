import { apiFetch } from '@/lib/api/client';
import type { SigfloRiskSettings } from '@/types/risk';

export type ServerRiskSettings = SigfloRiskSettings & { persisted: boolean };

export function getServerRiskSettings() {
  return apiFetch<ServerRiskSettings>('/risk/settings');
}

export function putServerRiskSettings(settings: SigfloRiskSettings) {
  return apiFetch<ServerRiskSettings>('/risk/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}
