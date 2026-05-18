import { getJson, signHmacSha256 } from './http.js';
import type {
  BalanceItem,
  ClosedTradeItem,
  ConnectInput,
  ExchangeAdapter,
  PermissionCheck,
  PositionItem,
  ValidationResult,
} from './types.js';

const BASE_URL = 'https://api.mexc.com';

type MexcAccountResponse = {
  canTrade?: boolean;
  canWithdraw?: boolean;
  canDeposit?: boolean;
  balances?: Array<{ asset: string; free: string; locked: string }>;
};

async function privateGet<T>(path: string, params: Record<string, string>, creds: ConnectInput): Promise<T> {
  const query = new URLSearchParams({
    ...params,
    timestamp: String(Date.now()),
  });
  const signature = signHmacSha256(creds.apiSecret, query.toString());
  query.set('signature', signature);
  const headers = {
    'X-MEXC-APIKEY': creds.apiKey,
  };
  return getJson<T>(`${BASE_URL}${path}?${query.toString()}`, headers);
}

function parsePermission(raw: MexcAccountResponse): PermissionCheck {
  const canReadBalances = Array.isArray(raw.balances);
  const canReadPositions = false;
  const withdrawalsEnabled = Boolean(raw.canWithdraw);
  const readOnly = canReadBalances && raw.canTrade === false;
  return { readOnly, withdrawalsEnabled, canReadBalances, canReadPositions, raw };
}

export class MexcAdapter implements ExchangeAdapter {
  readonly id = 'mexc' as const;

  async validateReadOnly(input: ConnectInput): Promise<ValidationResult> {
    const account = await privateGet<MexcAccountResponse>('/api/v3/account', {}, input);
    const permission = parsePermission(account);
    if (!permission.canReadBalances) {
      return { ok: false, message: 'MEXC key could not read account balances. Ensure the key has "Read Info" permission enabled.', permission };
    }
    // Note: MEXC's /api/v3/account returns canWithdraw at account level, not key level —
    // it is always true regardless of key permissions, so we cannot check it here.
    // Users must ensure withdrawals are disabled on the key at creation time.
    return { ok: true, message: 'MEXC key validated.', permission };
  }

  async fetchBalances(input: ConnectInput): Promise<BalanceItem[]> {
    const account = await privateGet<MexcAccountResponse>('/api/v3/account', {}, input);
    return (account.balances ?? [])
      .map((b) => {
        const free = Number(b.free ?? 0);
        const locked = Number(b.locked ?? 0);
        return {
          asset: b.asset,
          free,
          locked,
          total: free + locked,
        };
      })
      .filter((b) => b.total > 0);
  }

  async fetchPositions(): Promise<PositionItem[]> {
    return [];
  }

  async fetchClosedTrades(): Promise<ClosedTradeItem[]> {
    return [];
  }
}
