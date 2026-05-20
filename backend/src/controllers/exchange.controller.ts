import type { Response } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { getAdapter, getSupportedExchanges } from '../core/exchange-registry.js';
import type { ExchangeId } from '../exchanges/types.js';
import {
  getBrokerAccountForUser,
  listBrokerAccountsForUser,
  upsertBrokerAccount,
  deleteBrokerAccount,
  setActiveExchange,
  type BrokerAccountRow,
} from '../db/queries/brokerAccounts.js';
import { encryptBrokerCredential, decryptBrokerCredential } from '../services/exchangeKey.service.js';
import { writeAuditLog } from '../services/auditLog.service.js';
import { log } from '../lib/logger.js';

const SUPPORTED_BROKERS: ExchangeId[] = getSupportedExchanges();

function formatAccount(a: BrokerAccountRow) {
  return {
    id: a.id,
    exchange: a.broker as ExchangeId,
    status: a.status as 'connected' | 'invalid',
    isActive: a.isActive,
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

  if (!SUPPORTED_BROKERS.includes(broker)) {
    return res.status(400).json({ error: `Unsupported exchange: ${broker}` });
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

  // First account for this user becomes the active one automatically.
  const existing = await listBrokerAccountsForUser(req.user.userId);
  const hasActive = existing.some((a) => a.isActive);
  const isFirstAccount = existing.length === 0;

  const account = await upsertBrokerAccount({
    userId: req.user.userId,
    broker,
    accountLabel: accountLabel ?? null,
    apiKeyEncrypted: encryptBrokerCredential(apiKey),
    apiSecretEncrypted: encryptBrokerCredential(apiSecret),
    permissions: { withdrawalsEnabled: false },
    status: 'connected',
    // Auto-activate if this is the user's very first account or they have no active one.
    isActive: isFirstAccount || !hasActive,
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
    isActive: account.isActive,
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
  const broker = String(req.params.broker) as ExchangeId;
  if (!SUPPORTED_BROKERS.includes(broker)) {
    return res.status(404).json({ error: 'Exchange not supported.' });
  }

  // If the account being removed is active, auto-activate the next available account.
  const accounts = await listBrokerAccountsForUser(req.user.userId);
  const removing = accounts.find((a) => a.broker === broker);

  await deleteBrokerAccount(req.user.userId, broker);

  if (removing?.isActive) {
    const remaining = accounts.filter((a) => a.broker !== broker);
    if (remaining.length > 0) {
      await setActiveExchange(req.user.userId, remaining[0]!.id);
    }
  }

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

/**
 * Activate an already-connected exchange without re-entering credentials.
 * Uses atomic deactivate-all / activate-one so there is never a gap.
 */
export async function patchActivateExchange(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const accountId = String(req.params.id);

  const account = await getBrokerAccountForUser(req.user.userId, accountId);
  if (!account) return res.status(404).json({ error: 'Broker account not found.' });

  if (account.status !== 'connected') {
    return res.status(400).json({ error: 'Cannot activate an account in invalid state. Reconnect it first.' });
  }

  const updated = await setActiveExchange(req.user.userId, accountId);
  if (!updated) return res.status(404).json({ error: 'Broker account not found.' });

  log('info', 'Active exchange changed.', { userId: req.user.userId, broker: updated.broker, accountId: updated.id });

  await writeAuditLog({
    userId: req.user.userId,
    requestId: req.requestId,
    action: 'exchange.activate',
    objectType: 'broker_account',
    objectId: updated.id,
    outcome: 'success',
    payload: { broker: updated.broker },
    ipAddress: req.auditContext?.ipAddress,
    userAgent: req.auditContext?.userAgent,
  });

  return res.json(formatAccount(updated));
}

/**
 * Switch active exchange by providing new credentials.
 * Validates the new credentials then stores them (upsert), marking as active.
 * Does NOT delete other exchanges — they remain stored for later switching.
 */
export async function switchExchange(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { broker, apiKey, apiSecret, accountLabel } = req.body as {
    broker: ExchangeId;
    apiKey: string;
    apiSecret: string;
    accountLabel?: string;
  };

  if (!SUPPORTED_BROKERS.includes(broker)) {
    return res.status(400).json({ error: `Unsupported exchange: ${broker}` });
  }

  log('info', 'Exchange switch attempt.', { userId: req.user.userId, broker });

  let validation: Awaited<ReturnType<ReturnType<typeof getAdapter>['validateReadOnly']>>;
  try {
    const adapter = getAdapter(broker);
    validation = await adapter.validateReadOnly({ apiKey, apiSecret });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log('warn', 'Exchange switch — adapter threw during validation.', { userId: req.user.userId, broker, error: msg });
    return res.status(400).json({ error: `Connection failed: ${msg}` });
  }

  if (!validation.ok) {
    log('warn', 'Exchange switch validation failed.', { userId: req.user.userId, broker, reason: validation.message });
    await writeAuditLog({
      userId: req.user.userId,
      requestId: req.requestId,
      action: 'exchange.switch',
      objectType: 'broker_account',
      outcome: 'failure',
      payload: { broker },
      ipAddress: req.auditContext?.ipAddress,
      userAgent: req.auditContext?.userAgent,
      metadata: { reason: validation.message },
    });
    return res.status(400).json({ error: validation.message });
  }

  // Deactivate all, then upsert the new one as active.
  const account = await upsertBrokerAccount({
    userId: req.user.userId,
    broker,
    accountLabel: accountLabel ?? null,
    apiKeyEncrypted: encryptBrokerCredential(apiKey),
    apiSecretEncrypted: encryptBrokerCredential(apiSecret),
    permissions: { withdrawalsEnabled: false },
    status: 'connected',
    isActive: false, // will be set active via setActiveExchange below
  });

  const activated = await setActiveExchange(req.user.userId, account.id);

  log('info', 'Exchange switched successfully.', { userId: req.user.userId, broker, accountId: account.id });

  await writeAuditLog({
    userId: req.user.userId,
    requestId: req.requestId,
    action: 'exchange.switch',
    objectType: 'broker_account',
    objectId: account.id,
    outcome: 'success',
    payload: { broker },
    ipAddress: req.auditContext?.ipAddress,
    userAgent: req.auditContext?.userAgent,
  });

  return res.json(formatAccount(activated ?? account));
}
