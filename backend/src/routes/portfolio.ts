import { Router } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { listBrokerAccountsForUser } from '../db/queries/brokerAccounts.js';
import { decryptBrokerCredential } from '../services/exchangeKey.service.js';
import { getAdapter } from '../core/exchange-registry.js';
import { log } from '../lib/logger.js';
import type { ClosedTradeItem, ExchangeId } from '../exchanges/types.js';

type ClosedTradeRow = ClosedTradeItem & { exchange: ExchangeId };

/** Avoid flooding logs when the SPA polls every ~12s with the same error. */
const lastWarnAt = new Map<string, number>();
const WARN_THROTTLE_MS = 60_000;

function logPortfolioWarnThrottled(key: string, message: string, meta: Record<string, unknown>) {
  const now = Date.now();
  const prev = lastWarnAt.get(key) ?? 0;
  if (now - prev < WARN_THROTTLE_MS) return;
  lastWarnAt.set(key, now);
  log('warn', message, meta);
}

export const portfolioRouter = Router();

portfolioRouter.get('/accounts', async (req: AuthedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const accounts = await listBrokerAccountsForUser(req.user.userId);
  const snapshots = await Promise.all(
    accounts.map(async (account) => {
      const exchange = account.broker as ExchangeId;
      try {
        const adapter = getAdapter(exchange);
        const creds = {
          apiKey: decryptBrokerCredential(account.apiKeyEncrypted),
          apiSecret: decryptBrokerCredential(account.apiSecretEncrypted),
        };
        const [balances, positions, accountBreakdown] = await Promise.all([
          adapter.fetchBalances(creds),
          adapter.fetchPositions(creds),
          adapter.fetchAccountBreakdown ? adapter.fetchAccountBreakdown(creds) : Promise.resolve(null),
        ]);
        return { exchange, status: 'connected', balances, positions, accountBreakdown };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logPortfolioWarnThrottled(
          `snap:${exchange}:${msg.slice(0, 120)}`,
          'Portfolio snapshot failed.',
          { exchange, error: msg },
        );
        return { exchange, status: 'error', balances: [], positions: [], accountBreakdown: null, syncError: msg };
      }
    }),
  );

  res.json({ exchanges: snapshots });
});

portfolioRouter.get('/closed-trades', async (req: AuthedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const accounts = await listBrokerAccountsForUser(req.user.userId);
  const merged: ClosedTradeRow[] = [];

  for (const account of accounts) {
    const exchange = account.broker as ExchangeId;
    try {
      const adapter = getAdapter(exchange);
      const creds = {
        apiKey: decryptBrokerCredential(account.apiKeyEncrypted),
        apiSecret: decryptBrokerCredential(account.apiSecretEncrypted),
      };
      const rows = await adapter.fetchClosedTrades(creds, { limit: 50 });
      for (const row of rows) merged.push({ ...row, exchange });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logPortfolioWarnThrottled(
        `closed:${exchange}:${msg.slice(0, 120)}`,
        'Closed trades fetch failed.',
        { exchange, error: msg },
      );
    }
  }

  merged.sort((a, b) => {
    if (b.closedAt < a.closedAt) return -1;
    if (b.closedAt > a.closedAt) return 1;
    return 0;
  });
  res.json({ trades: merged.slice(0, 100) });
});
