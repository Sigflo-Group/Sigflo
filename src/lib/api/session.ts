import { apiFetch } from '@/lib/api/client';
import type { SecurityState } from '@/types/auth';

export function getCurrentSessionState() {
  return apiFetch<SecurityState>('/session/me');
}

export function performStepUpCheck(sessionId?: string) {
  return apiFetch<SecurityState>('/session/step-up', {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  });
}

export function revokeSession(sessionId?: string) {
  return apiFetch<{ ok: true }>('/session/revoke', {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  });
}
