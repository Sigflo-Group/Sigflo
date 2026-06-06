import type { Response } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { writeAuditLog } from '../services/auditLog.service.js';
import { rotateExchangeKey } from '../services/keyRotation.service.js';
import { auditPermissions } from '../services/permissionValidator.service.js';
import { getAdapter, getSupportedExchanges } from '../core/exchange-registry.js';
import type { ExchangeId } from '../exchanges/types.js';
import { decryptBrokerCredential } from '../services/exchangeKey.service.js';
import { getBrokerAccountForUser } from '../db/queries/brokerAccounts.js';
import { db } from '../db/index.js';
import { log } from '../lib/logger.js';
import { clientSafeExchangeError } from '../lib/clientSafeError.js';

const SUPPORTED: ExchangeId[] = getSupportedExchanges();
const MAX_AUDIT_LOG_ROWS = 50;

export async function getSecuritySummary(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { userId } = req.user;

  const [auditRows, rotationRows, permSnapshotRows] = await Promise.all([
    db.query<{
      id: string;
      action: string;
      outcome: string;
      ip_address: string | null;
      user_agent: string | null;
      created_at: string;
      metadata: Record<string, unknown>;
    }>(
      `select id, action, outcome, ip_address, user_agent, created_at, metadata
       from public.audit_logs
       where user_id = $1
       order by created_at desc
       limit $2`,
      [userId, MAX_AUDIT_LOG_ROWS],
    ),
    db.query<{
      id: string;
      exchange: string;
      rotated_at: string;
      reason: string | null;
      ip_address: string | null;
    }>(
      `select id, exchange, rotated_at, reason, ip_address
       from public.key_rotation_log
       where user_id = $1
       order by rotated_at desc
       limit 10`,
      [userId],
    ),
    db.query<{
      id: string;
      exchange: string;
      read_only: boolean;
      withdrawals_enabled: boolean;
      can_read_balances: boolean;
      can_read_positions: boolean;
      has_withdrawal_risk: boolean;
      captured_at: string;
    }>(
      `select ps.id, ps.exchange, ps.read_only, ps.withdrawals_enabled,
              ps.can_read_balances, ps.can_read_positions, ps.has_withdrawal_risk, ps.captured_at
       from public.permission_snapshots ps
       join public.broker_accounts ba on ba.id = ps.broker_account_id
       where ps.user_id = $1
         and ba.status = 'connected'
       order by ps.captured_at desc
       limit 5`,
      [userId],
    ),
  ]);

  return res.json({
    auditLog: auditRows.rows,
    keyRotations: rotationRows.rows,
    permissionSnapshots: permSnapshotRows.rows,
  });
}

export async function postAuditPermissions(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { userId } = req.user;

  const accountId = String(req.body?.accountId ?? '');
  const account = await getBrokerAccountForUser(userId, accountId);
  if (!account) return res.status(404).json({ error: 'Exchange account not found.' });

  const broker = account.broker as ExchangeId;
  if (!SUPPORTED.includes(broker)) {
    return res.status(400).json({ error: `Unsupported exchange: ${broker}` });
  }

  let validation: Awaited<ReturnType<ReturnType<typeof getAdapter>['validateReadOnly']>>;
  try {
    const adapter = getAdapter(broker);
    validation = await adapter.validateReadOnly({
      apiKey: decryptBrokerCredential(account.apiKeyEncrypted),
      apiSecret: decryptBrokerCredential(account.apiSecretEncrypted),
    });
  } catch (e) {
    return res.status(400).json({ error: clientSafeExchangeError(e, 'Permission check failed.') });
  }

  const audit = auditPermissions(validation.permission);

  await db.query(
    `insert into public.permission_snapshots
       (broker_account_id, user_id, exchange, read_only, withdrawals_enabled,
        can_read_balances, can_read_positions, raw_permissions)
     values ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      accountId,
      userId,
      broker,
      validation.permission.readOnly,
      validation.permission.withdrawalsEnabled,
      validation.permission.canReadBalances,
      validation.permission.canReadPositions,
      JSON.stringify(validation.permission.raw ?? {}),
    ],
  );

  log('info', 'Permission audit completed.', { userId, broker, risk: audit.overallRisk });

  return res.json({ audit, permission: validation.permission });
}

export async function postRotateKey(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { userId } = req.user;

  const { accountId, apiKey, apiSecret, reason } = req.body as {
    accountId: string;
    apiKey: string;
    apiSecret: string;
    reason?: string;
  };

  const result = await rotateExchangeKey({
    userId,
    accountId,
    newApiKey: apiKey,
    newApiSecret: apiSecret,
    reason,
    ipAddress: req.auditContext?.ipAddress,
    userAgent: req.auditContext?.userAgent,
    requestId: req.requestId,
  });

  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }

  return res.json({ ok: true, accountId: result.accountId });
}

export async function postAcknowledgeRisk(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { userId } = req.user;

  const version = String(req.body?.version ?? 'v1');

  await db.query(
    `insert into public.risk_acknowledgements (user_id, acknowledged_version, ip_address, user_agent)
     values ($1, $2, $3, $4)
     on conflict do nothing`,
    [userId, version, req.auditContext?.ipAddress ?? null, req.auditContext?.userAgent ?? null],
  );

  await writeAuditLog({
    userId,
    requestId: req.requestId,
    action: 'risk.acknowledge',
    objectType: 'risk_disclosure',
    objectId: version,
    outcome: 'success',
    ipAddress: req.auditContext?.ipAddress,
    userAgent: req.auditContext?.userAgent,
  });

  return res.json({ ok: true, version });
}

export async function getRiskAcknowledgement(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { userId } = req.user;

  const { rows } = await db.query<{ acknowledged_version: string; acknowledged_at: string }>(
    `select acknowledged_version, acknowledged_at
     from public.risk_acknowledgements
     where user_id = $1
     order by acknowledged_at desc
     limit 1`,
    [userId],
  );

  if (rows.length === 0) {
    return res.json({ acknowledged: false });
  }

  return res.json({
    acknowledged: true,
    version: rows[0]!.acknowledged_version,
    acknowledgedAt: rows[0]!.acknowledged_at,
  });
}
