import type { Response } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { getAdapter } from '../exchanges/registry.js';
import type { ExchangeId } from '../exchanges/types.js';
import {
  getBrokerAccountForUser,
  listBrokerAccountsForUser,
  upsertBrokerAccount,
  deleteBrokerAccount,
  type BrokerAccountRow,
} from '../db/queries/brokerAccounts.js';
import { encryptBrokerCredential, decryptBrokerCredential } from '../services/exchangeKey.service.js';
import { writeAuditLog } from '../services/auditLog.service.js';
import { log } from '../lib/logger.js';

const SUPPORTED_BROKERS: ExchangeId[] = ['bybit', 'mexc'];

function formatAccount(a: BrokerAccountRow) {
  return {
    id: a.id,
    exchange: a.broker as ExchangeId,
    status: a.status as 'connected' | 'invalid',
    accountLabel: a.accountLabel,
    lastValidatedAt: a.lastValidatedAt,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

export async function getExchangeStatus(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const accounts = await listBrokerAccountsForUser(req.user.userId);
  return res.json(accounts.map(formatAccount));
}

export async function postLinkExchange(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { broker, apiKey, apiSecret, accountLabel } = req.body as {
    broker: ExchangeId;
    apiKey: string;
    apiSecret: string;
    accountLabel?: string;
  };

  log('info', 'Exchange link attempt.', { userId: req.user.userId, broker });

  const existingAccounts = await listBrokerAccountsForUser(req.user.userId);
  const conflict = existingAccounts.find((a) => a.broker !== broker);
  if (conflict) {
    return res.status(409).json({
      error: `You already have ${conflict.broker.toUpperCase()} connected. Disconnect it before linking a different exchange.`,
    });
  }

  let validation: Awaited<ReturnType<ReturnType<typeof getAdapter>['validateReadOnly']>>;
  try {
    const adapter = getAdapter(broker);
    validation = await adapter.validateReadOnly({ apiKey, apiSecret });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log('warn', 'Exchange link — adapter threw during validation.', { userId: req.user.userId, broker, error: msg });
    return res.status(400).json({ error: `Connection failed: ${msg}` });
  }

  if (!validation.ok) {
    log('warn', 'Exchange link validation failed.', { userId: req.user.userId, broker, reason: validation.message });
    await writeAuditLog({
      userId: req.user.userId,
      requestId: req.requestId,
      action: 'exchange.link',
      objectType: 'broker_account',
      outcome: 'failure',
      payload: { broker },
      ipAddress: req.auditContext?.ipAddress,
      userAgent: req.auditContext?.userAgent,
      metadata: { reason: validation.message },
    });
    return res.status(400).json({ error: validation.message });
  }

  const account = await upsertBrokerAccount({
    userId: req.user.userId,
    broker,
    accountLabel: accountLabel ?? null,
    apiKeyEncrypted: encryptBrokerCredential(apiKey),
    apiSecretEncrypted: encryptBrokerCredential(apiSecret),
    permissions: { withdrawalsEnabled: false },
    status: 'connected',
  });

  log('info', 'Exchange linked successfully.', { userId: req.user.userId, broker, accountId: account.id });

  await writeAuditLog({
    userId: req.user.userId,
    requestId: req.requestId,
    action: 'exchange.link',
    objectType: 'broker_account',
    objectId: account.id,
    outcome: 'success',
    payload: { broker },
    ipAddress: req.auditContext?.ipAddress,
    userAgent: req.auditContext?.userAgent,
  });

  return res.json(formatAccount(account));
}

export async function postRevalidateExchange(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const accountId = String(req.body?.accountId ?? '');
  const account = await getBrokerAccountForUser(req.user.userId, accountId);
  if (!account) return res.status(404).json({ error: 'Broker account not found.' });

  const broker = account.broker as ExchangeId;
  if (!SUPPORTED_BROKERS.includes(broker)) {
    return res.status(400).json({ error: `Unsupported broker: ${broker}` });
  }

  const adapter = getAdapter(broker);
  const validation = await adapter.validateReadOnly({
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

  return res.json(formatAccount(updated));
}

export async function deleteExchange(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const broker = req.params.broker as ExchangeId;
  if (!SUPPORTED_BROKERS.includes(broker)) {
    return res.status(404).json({ error: 'Exchange not supported.' });
  }

  await deleteBrokerAccount(req.user.userId, broker);

  log('info', 'Exchange disconnected.', { userId: req.user.userId, broker });

  await writeAuditLog({
    userId: req.user.userId,
    requestId: req.requestId,
    action: 'exchange.disconnect',
    objectType: 'broker_account',
    outcome: 'success',
    payload: { broker },
    ipAddress: req.auditContext?.ipAddress,
    userAgent: req.auditContext?.userAgent,
  });

  return res.status(204).end();
}
