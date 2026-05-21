export type PermissionRisk = 'critical' | 'warning' | 'ok';

export type PermissionFlag = {
  level: PermissionRisk;
  code: string;
  label: string;
  detail: string;
  action: string;
};

export type PermissionAuditResult = {
  overallRisk: PermissionRisk;
  flags: PermissionFlag[];
  safe: boolean;
};

export type PermissionSnapshot = {
  id: string;
  exchange: string;
  readOnly: boolean;
  withdrawalsEnabled: boolean;
  canReadBalances: boolean;
  canReadPositions: boolean;
  hasWithdrawalRisk: boolean;
  capturedAt: string;
};

export type AuditLogEntry = {
  id: string;
  action: string;
  outcome: 'success' | 'failure';
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  metadata: Record<string, unknown>;
};

export type KeyRotationRecord = {
  id: string;
  exchange: string;
  rotatedAt: string;
  reason: string | null;
  ipAddress: string | null;
};

export type SecuritySummary = {
  auditLog: AuditLogEntry[];
  keyRotations: KeyRotationRecord[];
  permissionSnapshots: PermissionSnapshot[];
};

export type RiskAcknowledgement = {
  acknowledged: boolean;
  version?: string;
  acknowledgedAt?: string;
};

export type ExchangeConnectionStep =
  | 'choose_exchange'
  | 'risk_disclosure'
  | 'create_key'
  | 'enter_credentials'
  | 'validating'
  | 'success';
