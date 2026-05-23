import { apiJson } from './http';
import type {
  SecuritySummary,
  PermissionAuditResult,
  RiskAcknowledgement,
} from '@/types/security';

export async function getSecuritySummary(): Promise<SecuritySummary> {
  return apiJson<SecuritySummary>('/security/summary');
}

export async function auditExchangePermissions(accountId: string): Promise<{
  audit: PermissionAuditResult;
  permission: {
    readOnly: boolean;
    withdrawalsEnabled: boolean;
    canReadBalances: boolean;
    canReadPositions: boolean;
  };
}> {
  return apiJson('/security/audit-permissions', {
    method: 'POST',
    body: JSON.stringify({ accountId }),
  });
}

export async function rotateExchangeKey(input: {
  accountId: string;
  apiKey: string;
  apiSecret: string;
  reason?: string;
}): Promise<{ ok: true; accountId: string }> {
  return apiJson('/security/rotate-key', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function acknowledgeRisk(version: string): Promise<{ ok: true; version: string }> {
  return apiJson('/security/acknowledge-risk', {
    method: 'POST',
    body: JSON.stringify({ version }),
  });
}

export async function getRiskAcknowledgement(): Promise<RiskAcknowledgement> {
  return apiJson<RiskAcknowledgement>('/security/risk-acknowledgement');
}
