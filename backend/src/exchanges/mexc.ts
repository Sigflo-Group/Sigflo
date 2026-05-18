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

// ── Spot API ────────────────────────────────────────────────────────────────
const SPOT_BASE = 'https://api.mexc.com';

type MexcAccountResponse = {
  canTrade?: boolean;
  canWithdraw?: boolean;
  canDeposit?: boolean;
  balances?: Array<{ asset: string; free: string; locked: string }>;
};

async function spotPrivateGet<T>(path: string, params: Record<string, string>, creds: ConnectInput): Promise<T> {
  const query = new URLSearchParams({ ...params, timestamp: String(Date.now()) });
  const signature = signHmacSha256(creds.apiSecret, query.toString());
  query.set('signature', signature);
  return getJson<T>(`${SPOT_BASE}${path}?${query.toString()}`, { 'X-MEXC-APIKEY': creds.apiKey });
}

// ── Futures/Contract API ────────────────────────────────────────────────────
// MEXC perpetual futures use a separate base URL and auth scheme.
// Auth: ApiKey header + Request-Time header + Signature (HMAC-SHA256 of apiKey+timestamp+queryString).
const FUTURES_BASE = 'https://contract.mexc.com';

type MexcFuturesResponse<T> = { success: boolean; data: T };

type MexcOpenPosition = {
  positionId: number;
  symbol: string;              // e.g. "BTC_USDT"
  positionType: 1 | 2;         // 1=long, 2=short
  holdVol: string;             // size in base asset
  holdAvgPrice: string;        // avg entry price
  openAvgPrice: string;
  liquidatePrice: string;
  leverage: number;
  im: string;                  // initial margin (USDT)
  realised: string;            // realised PnL so far (not unrealised)
  createTime: number;          // ms
  updateTime: number;
};

type MexcHistoryPosition = {
  positionId: number;
  symbol: string;
  positionType: 1 | 2;
  closeVol: string;            // closed size
  closeAvgPrice: string;       // close price
  openAvgPrice: string;        // entry price
  realised: string;            // net closed PnL (USDT)
  updateTime: number;          // close time (ms)
};

type MexcHistoryPage = {
  pageNum: number;
  pageSize: number;
  totalPage: number;
  resultList: MexcHistoryPosition[];
};

async function futuresPrivateGet<T>(
  path: string,
  params: Record<string, string>,
  creds: ConnectInput,
): Promise<T> {
  const timestamp = String(Date.now());
  const qs = new URLSearchParams(params).toString();
  // MEXC futures signature: HMAC-SHA256(secret, apiKey + timestamp + queryString)
  const signature = signHmacSha256(creds.apiSecret, creds.apiKey + timestamp + qs);
  const headers: Record<string, string> = {
    'ApiKey': creds.apiKey,
    'Request-Time': timestamp,
    'Signature': signature,
    'Content-Type': 'application/json',
  };
  const url = qs ? `${FUTURES_BASE}${path}?${qs}` : `${FUTURES_BASE}${path}`;
  return getJson<T>(url, headers);
}

/** "BTC_USDT" → "BTCUSDT" */
function mexcSymbolToStandard(sym: string): string {
  return sym.replace('_', '');
}

// ── Permission helpers ──────────────────────────────────────────────────────

function parsePermission(raw: MexcAccountResponse): PermissionCheck {
  const canReadBalances = Array.isArray(raw.balances);
  const withdrawalsEnabled = Boolean(raw.canWithdraw);
  const readOnly = canReadBalances && raw.canTrade === false;
  return { readOnly, withdrawalsEnabled, canReadBalances, canReadPositions: false, raw };
}

// ── Adapter ─────────────────────────────────────────────────────────────────

export class MexcAdapter implements ExchangeAdapter {
  readonly id = 'mexc' as const;

  async validateReadOnly(input: ConnectInput): Promise<ValidationResult> {
    const account = await spotPrivateGet<MexcAccountResponse>('/api/v3/account', {}, input);
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
    const account = await spotPrivateGet<MexcAccountResponse>('/api/v3/account', {}, input);
    return (account.balances ?? [])
      .map((b) => {
        const free = Number(b.free ?? 0);
        const locked = Number(b.locked ?? 0);
        return { asset: b.asset, free, locked, total: free + locked };
      })
      .filter((b) => b.total > 0);
  }

  async fetchPositions(input: ConnectInput): Promise<PositionItem[]> {
    let raw: MexcOpenPosition[];
    try {
      const res = await futuresPrivateGet<MexcFuturesResponse<MexcOpenPosition[]>>(
        '/api/v1/private/position/open_positions',
        {},
        input,
      );
      raw = res.success && Array.isArray(res.data) ? res.data : [];
    } catch {
      // Futures API not accessible (spot-only key, or account has no futures access) — return empty
      return [];
    }

    return raw
      .filter((p) => Number(p.holdVol) > 0)
      .map((p): PositionItem => ({
        symbol: mexcSymbolToStandard(p.symbol),
        side: p.positionType === 1 ? 'long' : 'short',
        size: Number(p.holdVol),
        entryPrice: Number(p.holdAvgPrice || p.openAvgPrice),
        liqPrice: Number(p.liquidatePrice) > 0 ? Number(p.liquidatePrice) : undefined,
        leverage: p.leverage > 0 ? p.leverage : undefined,
        positionIM: Number(p.im) > 0 ? Number(p.im) : undefined,
        openedAtMs: p.createTime > 0 ? p.createTime : undefined,
      }));
  }

  async fetchClosedTrades(input: ConnectInput, opts?: { limit?: number }): Promise<ClosedTradeItem[]> {
    const pageSize = String(Math.min(opts?.limit ?? 50, 100));
    let page: MexcHistoryPage;
    try {
      const res = await futuresPrivateGet<MexcFuturesResponse<MexcHistoryPage>>(
        '/api/v1/private/position/list/history_positions',
        { pageNum: '1', pageSize },
        input,
      );
      page = res.success && res.data ? res.data : { pageNum: 1, pageSize: 0, totalPage: 0, resultList: [] };
    } catch {
      return [];
    }

    return (page.resultList ?? [])
      .filter((p) => Number(p.closeVol) > 0)
      .map((p): ClosedTradeItem => ({
        symbol: mexcSymbolToStandard(p.symbol),
        closedPnl: Number(p.realised),
        closedAt: new Date(p.updateTime).toISOString(),
        orderId: String(p.positionId),
      }));
  }
}
