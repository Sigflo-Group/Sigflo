import type { Response } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { BybitAdapter } from '../exchanges/bybit.js';
import { getBrokerAccountForUser, listBrokerAccountsForUser, upsertBrokerAccount } from '../db/queries/brokerAccounts.js';
import { encryptBrokerCredential, decryptBrokerCredential } from '../services/exchangeKey.service.js';
import { writeAuditLog } from '../services/auditLog.service.js';

const bybit = new BybitAdapter();

export async function getExchangeStatus(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const accounts = await listBrokerAccountsForUser(req.user.userId);
  return res.json({
    accounts: accounts.map((a) => ({
      id: a.id,
      broker: a.broker,
      linked: a.status === 'connected',
      status: a.status,
      accountLabel: a.accountLabel,
      permissions: a.permissions ?? {},
      lastValidatedAt: a.lastValidatedAt,
    })),
  });
}

export async function postLinkExchange(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const body = req.body as { broker: 'bybit'; apiKey: string; apiSecret: string; accountLabel?: string };

  const creds = { apiKey: body.apiKey, apiSecret: body.apiSecret };
  const validation = await bybit.validateReadOnly(creds);
  if (!validation.ok) {
    await writeAuditLog({
      userId: req.user.userId,
      requestId: req.requestId,
      action: 'exchange.link',
      objectType: 'broker_account',
      outcome: 'failure',
      payload: { broker: body.broker },
      ipAddress: req.auditContext?.ipAddress,
      userAgent: req.auditContext?.userAgent,
      metadata: { reason: validation.message },
    });
    return res.status(400).json({ error: validation.message });
  }

  const account = await upsertBrokerAccount({
    userId: req.user.userId,
    broker: body.broker,
    accountLabel: body.accountLabel ?? null,
    apiKeyEncrypted: encryptBrokerCredential(body.apiKey),
    apiSecretEncrypted: encryptBrokerCredential(body.apiSecret),
    permissions: { withdrawalsEnabled: false, tradeEnabled: true },
    status: 'connected',
  });

  await writeAuditLog({
    userId: req.user.userId,
    requestId: req.requestId,
    action: 'exchange.link',
    objectType: 'broker_account',
    objectId: account.id,
    outcome: 'success',
    payload: { broker: body.broker },
    ipAddress: req.auditContext?.ipAddress,
    userAgent: req.auditContext?.userAgent,
  });

  return res.json({
    ok: true,
    account: {
      id: account.id,
      broker: account.broker,
      linked: account.status === 'connected',
      status: account.status,
      accountLabel: account.accountLabel,
      permissions: account.permissions ?? {},
      lastValidatedAt: account.lastValidatedAt,
    },
  });
}

export async function postRevalidateExchange(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const accountId = String(req.body?.accountId ?? '');
  const account = await getBrokerAccountForUser(req.user.userId, accountId);
  if (!account) return res.status(404).json({ error: 'Broker account not found' });
  if (account.broker !== 'bybit') return res.status(400).json({ error: 'Unsupported broker' });

  const validation = await bybit.validateReadOnly({
    apiKey: decryptBrokerCredential(account.apiKeyEncrypted),
    apiSecret: decryptBrokerCredential(account.apiSecretEncrypted),
  });
  if (!validation.ok) return res.status(400).json({ error: validation.message });

  const updated = await upsertBrokerAccount({
    userId: account.userId,
    broker: account.broker,
    accountLabel: account.accountLabel,
    apiKeyEncrypted: account.apiKeyEncrypted,
    apiSecretEncrypted: account.apiSecretEncrypted,
    permissions: account.permissions ?? {},
    status: 'connected',
  });

  await writeAuditLog({
    userId: req.user.userId,
    requestId: req.requestId,
    action: 'exchange.revalidate',
    objectType: 'broker_account',
    objectId: updated.id,
    outcome: 'success',
    ipAddress: req.auditContext?.ipAddress,
    userAgent: req.auditContext?.userAgent,
  });

  return res.json({
    ok: true,
    account: {
      id: updated.id,
      broker: updated.broker,
      linked: updated.status === 'connected',
      status: updated.status,
      accountLabel: updated.accountLabel,
      permissions: updated.permissions ?? {},
      lastValidatedAt: updated.lastValidatedAt,
    },
  });
}
