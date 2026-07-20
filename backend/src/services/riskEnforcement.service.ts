import type { BrokerAccountRow } from '../db/queries/brokerAccounts.js';
import { getUserRiskSettings } from '../db/queries/riskSettings.js';
import { getAdapter } from '../core/exchange-registry.js';
import { resolveBrokerCredentials } from './brokerCredentials.js';
import type { ExchangeId } from '../exchanges/types.js';

export type RiskEnforcementResult =
  | { ok: true }
  | { ok: false; status: 403 | 409 | 503; reason: string };

function normalizeSymbol(symbol: string): string {
  return symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export async function enforceReliableLiveRiskLimits(input: {
  userId: string;
  account: BrokerAccountRow;
  symbol: string;
}): Promise<RiskEnforcementResult> {
  const settings = await getUserRiskSettings(input.userId);

  if (settings.persisted && !settings.allowLiveExecution) {
    return { ok: false, status: 403, reason: 'Live execution is disabled in Risk Controls.' };
  }

  if (!settings.persisted) return { ok: true };

  try {
    const adapter = getAdapter(input.account.broker as ExchangeId);
    const creds = await resolveBrokerCredentials(input.account);
    const positions = await adapter.fetchPositions(creds);
    const open = positions.filter((p) => Number.isFinite(p.size) && Math.abs(p.size) > 0);
    const sameSymbolAlreadyOpen = open.some(
      (p) => normalizeSymbol(p.symbol) === normalizeSymbol(input.symbol),
    );

    if (!sameSymbolAlreadyOpen && open.length >= settings.maxOpenPositions) {
      return {
        ok: false,
        status: 409,
        reason: `Max open positions reached (${settings.maxOpenPositions}). Close a position or raise the limit first.`,
      };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      status: 503,
      reason: 'Could not verify live position limits. Try again when portfolio sync is available.',
    };
  }
}
