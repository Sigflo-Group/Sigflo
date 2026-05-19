import { getJson, postJson, signHmacSha256 } from './http.js';
import type {
  AccountBucketSnapshot,
  BalanceItem,
  ClosedTradeItem,
  ConnectInput,
  ExchangeAccountBreakdown,
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

type MexcContractAsset = {
  currency: string;
  availableBalance: string;
  frozenBalance: string;
  positionMargin: string;
  equity: string;
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

async function futuresPrivatePost<T>(
  path: string,
  body: Record<string, unknown>,
  creds: ConnectInput,
): Promise<T> {
  const timestamp = String(Date.now());
  const bodyJson = JSON.stringify(body);
  // MEXC futures POST signature: HMAC-SHA256(secret, apiKey + timestamp + requestBodyJson)
  const signature = signHmacSha256(creds.apiSecret, creds.apiKey + timestamp + bodyJson);
  const headers: Record<string, string> = {
    'ApiKey': creds.apiKey,
    'Request-Time': timestamp,
    'Signature': signature,
  };
  return postJson<T>(`${FUTURES_BASE}${path}`, body, headers);
}

// ── Order types ──────────────────────────────────────────────────────────────

export type MexcOrderRequest = {
  symbol: string;          // "BTC_USDT"
  side: 1 | 2 | 3 | 4;   // 1=open long, 2=close short, 3=open short, 4=close long
  openType: 1 | 2;        // 1=isolated, 2=cross
  type: 1 | 5;            // 1=limit, 5=market
  vol: string;             // quantity in base currency
  leverage?: number;       // required for opening positions
  price?: string;          // limit orders only
  stopLossPrice?: string;
  takeProfitPrice?: string;
};

export type MexcOrderResponse = {
  success: boolean;
  data: number;            // orderId
};

/** "BTCUSDT" → "BTC_USDT" (inserts underscore before USDT) */
function standardSymbolToMexc(sym: string): string {
  return sym.endsWith('USDT') ? sym.slice(0, -4) + '_USDT' : sym;
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
    const [account, futuresAssets] = await Promise.all([
      spotPrivateGet<MexcAccountResponse>('/api/v3/account', {}, input),
      futuresPrivateGet<MexcFuturesResponse<MexcContractAsset[] | MexcContractAsset>>(
        '/api/v1/private/account/assets', {}, input,
      ).then((r) => {
        if (!r.success || r.data == null) return [] as MexcContractAsset[];
        return Array.isArray(r.data) ? r.data : [r.data];
      }).catch(() => [] as MexcContractAsset[]),
    ]);

    const balances = new Map<string, BalanceItem>();

    for (const b of account.balances ?? []) {
      const free = Number(b.free ?? 0);
      const locked = Number(b.locked ?? 0);
      const total = free + locked;
      if (total > 0) balances.set(b.asset, { asset: b.asset, free, locked, total });
    }

    // Merge futures wallet assets — add to existing asset or create new entry
    for (const a of futuresAssets) {
      const asset = (a.currency ?? '').toUpperCase();
      if (!asset) continue;
      const free = Number(a.availableBalance ?? 0);
      const locked = Number(a.frozenBalance ?? 0) + Number(a.positionMargin ?? 0);
      const total = Number(a.equity ?? 0) || free + locked;
      if (total <= 0) continue;
      const existing = balances.get(asset);
      if (existing) {
        existing.free += free;
        existing.locked += locked;
        existing.total += total;
      } else {
        balances.set(asset, { asset, free, locked, total });
      }
    }

    return [...balances.values()];
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

  async fetchAccountBreakdown(input: ConnectInput): Promise<ExchangeAccountBreakdown | null> {
    const [spotAccount, contractAssets] = await Promise.all([
      spotPrivateGet<MexcAccountResponse>('/api/v3/account', {}, input),
      futuresPrivateGet<MexcFuturesResponse<MexcContractAsset[]>>(
        '/api/v1/private/account/assets', {}, input,
      ).then((r) => (r.success && Array.isArray(r.data) ? r.data : [])).catch(() => [] as MexcContractAsset[]),
    ]);

    const spotBalances: BalanceItem[] = (spotAccount.balances ?? [])
      .map((b) => ({ asset: b.asset, free: Number(b.free ?? 0), locked: Number(b.locked ?? 0), total: Number(b.free ?? 0) + Number(b.locked ?? 0) }))
      .filter((b) => b.total > 0)
      .sort((a, b) => b.total - a.total);

    const futuresBalances: BalanceItem[] = contractAssets
      .map((a) => ({ asset: a.currency, free: Number(a.availableBalance ?? 0), locked: Number(a.frozenBalance ?? 0) + Number(a.positionMargin ?? 0), total: Number(a.equity ?? 0) }))
      .filter((b) => b.total > 0)
      .sort((a, b) => b.total - a.total);

    if (spotBalances.length === 0 && futuresBalances.length === 0) return null;

    const spotUsdt = spotBalances.find((b) => b.asset.toUpperCase() === 'USDT');
    const futuresUsdt = futuresBalances.find((b) => b.asset.toUpperCase() === 'USDT');
    const totalEquity = (spotUsdt?.total ?? 0) + (futuresUsdt?.total ?? 0);
    const availableToTrade = (spotUsdt?.free ?? 0) + (futuresUsdt?.free ?? 0);

    const buckets: AccountBucketSnapshot[] = [];

    if (spotBalances.length > 0) {
      buckets.push({
        kind: 'spot',
        label: 'Spot Wallet',
        helperText: 'Available for spot trading and transfers',
        metrics: {
          availableBalance: spotUsdt?.free ?? null,
          walletBalance: spotUsdt?.total ?? null,
          equity: null,
          marginBalance: null,
          marginUsed: null,
          unrealizedPnl: null,
        },
        assets: spotBalances,
      });
    }

    if (futuresBalances.length > 0) {
      buckets.push({
        kind: 'derivatives',
        label: 'Futures Wallet',
        helperText: 'Contract trading balance (MEXC perpetuals)',
        metrics: {
          availableBalance: futuresUsdt?.free ?? null,
          walletBalance: futuresUsdt?.total ?? null,
          equity: futuresUsdt?.total ?? null,
          marginBalance: null,
          marginUsed: futuresUsdt ? (futuresUsdt.locked > 0 ? futuresUsdt.locked : null) : null,
          unrealizedPnl: null,
        },
        assets: futuresBalances,
      });
    }

    return {
      overview: {
        totalEquity: totalEquity > 0 ? totalEquity : null,
        totalWalletBalance: totalEquity > 0 ? totalEquity : null,
        availableToTrade: availableToTrade > 0 ? availableToTrade : null,
        unifiedMarginInUseUsd: null,
        fundingWalletBalance: spotUsdt?.total ?? null,
        fundingPrimaryAsset: spotUsdt ? 'USDT' : null,
      },
      buckets,
    };
  }

  async placeLinearOrder(
    input: ConnectInput,
    params: {
      symbol: string;           // "BTCUSDT"
      side: 'Buy' | 'Sell';
      reduceOnly?: boolean;
      orderType?: 'Market' | 'Limit';
      qty: string;
      leverage?: number;
      price?: string;
      takeProfit?: string;
      stopLoss?: string;
    },
  ): Promise<{ orderId: string }> {
    const mexcSymbol = standardSymbolToMexc(params.symbol);

    // Map Bybit-style side+reduceOnly → MEXC side integer
    // 1=open long, 2=close short, 3=open short, 4=close long
    let mexcSide: 1 | 2 | 3 | 4;
    if (params.side === 'Buy' && !params.reduceOnly) mexcSide = 1;       // open long
    else if (params.side === 'Sell' && !params.reduceOnly) mexcSide = 3; // open short
    else if (params.side === 'Sell' && params.reduceOnly) mexcSide = 4;  // close long
    else mexcSide = 2;                                                    // Buy + reduceOnly → close short

    const orderBody: MexcOrderRequest = {
      symbol: mexcSymbol,
      side: mexcSide,
      openType: 1, // isolated
      type: params.orderType === 'Limit' ? 1 : 5,
      vol: params.qty,
      ...(params.leverage != null && !params.reduceOnly ? { leverage: params.leverage } : {}),
      ...(params.price ? { price: params.price } : {}),
      ...(params.takeProfit ? { takeProfitPrice: params.takeProfit } : {}),
      ...(params.stopLoss ? { stopLossPrice: params.stopLoss } : {}),
    };

    const res = await futuresPrivatePost<MexcOrderResponse>(
      '/api/v1/private/order/submit',
      orderBody as unknown as Record<string, unknown>,
      input,
    );

    if (!res.success) {
      throw new Error(`MEXC order rejected (success=false, data=${res.data})`);
    }

    return { orderId: String(res.data) };
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
