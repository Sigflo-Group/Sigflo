import type { PermissionCheck } from '../exchanges/types.js';

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

/**
 * Evaluates an exchange permission set against Sigflo's security requirements.
 * Returns a structured risk assessment with user-facing copy for each flag.
 *
 * Sigflo requires: read-only keys with no withdrawal access.
 * Trade-capable keys are accepted but flagged as a warning.
 */
export function auditPermissions(perms: PermissionCheck): PermissionAuditResult {
  const flags: PermissionFlag[] = [];

  if (perms.withdrawalsEnabled) {
    flags.push({
      level: 'critical',
      code: 'WITHDRAWALS_ENABLED',
      label: 'Withdrawal access detected',
      detail:
        'This API key can initiate withdrawals. Sigflo never needs withdrawal access to read your positions or balance.',
      action: 'Regenerate your key with withdrawal permissions disabled.',
    });
  }

  if (!perms.readOnly) {
    flags.push({
      level: 'warning',
      code: 'NOT_READ_ONLY',
      label: 'Trade-capable key',
      detail:
        'This key has trading permissions. Sigflo only reads your account — it never places orders. A read-only key reduces your exposure.',
      action: 'Consider regenerating your key as read-only for better security.',
    });
  }

  if (!perms.canReadBalances) {
    flags.push({
      level: 'warning',
      code: 'MISSING_BALANCE_READ',
      label: 'Balance access unavailable',
      detail: 'Sigflo cannot read your account balances. Portfolio tracking will be limited.',
      action: 'Enable balance reading in your API key permissions.',
    });
  }

  if (!perms.canReadPositions) {
    flags.push({
      level: 'warning',
      code: 'MISSING_POSITION_READ',
      label: 'Position access unavailable',
      detail: 'Sigflo cannot read your open positions. Trade signals will work, but position tracking will not.',
      action: 'Enable position reading in your API key permissions.',
    });
  }

  const hasCritical = flags.some((f) => f.level === 'critical');
  const hasWarning = flags.some((f) => f.level === 'warning');

  const overallRisk: PermissionRisk = hasCritical ? 'critical' : hasWarning ? 'warning' : 'ok';

  return {
    overallRisk,
    flags,
    safe: !hasCritical,
  };
}

export function permissionRiskLabel(risk: PermissionRisk): string {
  switch (risk) {
    case 'critical':
      return 'Action required';
    case 'warning':
      return 'Review recommended';
    case 'ok':
      return 'Looks good';
  }
}
