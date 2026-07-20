import type { ConnectInput } from '../exchanges/types.js';
import { exchangeSignal, getJson, signHmacSha256 } from '../exchanges/http.js';

const BASE_URL = 'https://api.bybit.com';
const RECV_WINDOW = '60000';

type BybitResponse<T> = {
  retCode: number;
  retMsg: string;
  result: T;
};

type OrderResult = {
  orderId: string;
  orderLinkId?: string;
};

type LotSizeFilter = {
  qtyStep?: string;
  minOrderQty?: string;
  maxOrderQty?: string;
};

function signedHeaders(apiKey: string, apiSecret: string, payload: string) {
  const timestamp = String(Date.now());
  return {
    'X-BAPI-API-KEY': apiKey,
    'X-BAPI-TIMESTAMP': timestamp,
    'X-BAPI-RECV-WINDOW': RECV_WINDOW,
    'X-BAPI-SIGN': signHmacSha256(apiSecret, `${timestamp}${apiKey}${RECV_WINDOW}${payload}`),
  };
}

async function privateGet<T>(path: string, params: Record<string, string>, creds: ConnectInput): Promise<T> {
  const query = new URLSearchParams(params).toString();
  const data = await getJson<BybitResponse<T>>(
    `${BASE_URL}${path}?${query}`,
    signedHeaders(creds.apiKey, creds.apiSecret, query),
  );
  if (data.retCode !== 0) throw new Error(`Bybit error: ${data.retMsg || 'request rejected'}`);
  return data.result;
}

async function privatePost<T>(path: string, body: Record<string, unknown>, creds: ConnectInput): Promise<T> {
  const bodyStr = JSON.stringify(body);
  const headers = {
    ...signedHeaders(creds.apiKey, creds.apiSecret, bodyStr),
    'Content-Type': 'application/json',
  };
  const { signal, clear } = exchangeSignal();
  try {
    const response = await fetch(`${BASE_URL}${path}`, { method: 'POST', headers, body: bodyStr, signal });
    const text = await response.text();
    if (!response.ok) throw new Error(`Bybit HTTP ${response.status}: ${text.slice(0, 300) || 'request failed'}`);
    const data = JSON.parse(text) as BybitResponse<T>;
    if (data.retCode !== 0) throw new Error(`Bybit error: ${data.retMsg || 'request rejected'}`);
    return data.result;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Bybit request timed out: ${path}`);
    }
    throw error;
  } finally {
    clear();
  }
}

function decimals(step: string): number {
  const n = Number(step);
  if (!Number.isFinite(n) || n <= 0) return 8;
  const s = step.includes('e') || step.includes('E') ? n.toFixed(16) : step;
  const fraction = s.split('.')[1] ?? '';
  return fraction.replace(/0+$/, '').length;
}

function normalizeQty(rawQty: number, lot: LotSizeFilter | undefined): string {
  if (!Number.isFinite(rawQty) || rawQty <= 0) throw new Error('Order qty must be positive');
  if (!lot?.qtyStep || lot.minOrderQty == null || lot.maxOrderQty == null) {
    return rawQty.toFixed(8).replace(/\.?0+$/, '') || '0';
  }

  const step = Number(lot.qtyStep);
  const min = Number(lot.minOrderQty);
  const max = Number(lot.maxOrderQty);
  if (![step, min, max].every(Number.isFinite) || step <= 0 || min <= 0 || max <= 0) {
    return rawQty.toFixed(8).replace(/\.?0+$/, '') || '0';
  }

  let qty = Math.floor(rawQty / step + 1e-12) * step;
  if (qty < min) qty = Math.ceil(min / step - 1e-12) * step;
  if (qty > max) qty = Math.floor(max / step + 1e-12) * step;
  if (!Number.isFinite(qty) || qty <= 0 || qty < min - 1e-12) {
    throw new Error(`Order size is below Bybit minimum (${lot.minOrderQty}, step ${lot.qtyStep}).`);
  }
  return qty.toFixed(Math.min(16, decimals(lot.qtyStep))).replace(/\.?0+$/, '') || '0';
}

async function getLinearLot(symbol: string): Promise<LotSizeFilter | undefined> {
  const query = new URLSearchParams({ category: 'linear', symbol: symbol.toUpperCase() }).toString();
  const data = await getJson<BybitResponse<{ list?: Array<{ lotSizeFilter?: LotSizeFilter }> }>>(
    `${BASE_URL}/v5/market/instruments-info?${query}`,
  );
  if (data.retCode !== 0) return undefined;
  return data.result.list?.[0]?.lotSizeFilter;
}

export async function findBybitLinearOrderByLinkId(input: {
  creds: ConnectInput;
  symbol: string;
  orderLinkId: string;
}): Promise<OrderResult | null> {
  const result = await privateGet<{ list?: Array<{ orderId?: string; orderLinkId?: string }> }>(
    '/v5/order/realtime',
    {
      category: 'linear',
      symbol: input.symbol.toUpperCase(),
      orderLinkId: input.orderLinkId,
    },
    input.creds,
  );
  const row = result.list?.find((item) => item.orderLinkId === input.orderLinkId) ?? result.list?.[0];
  if (!row?.orderId) return null;
  return { orderId: row.orderId, orderLinkId: row.orderLinkId ?? input.orderLinkId };
}

export async function placeBybitManagedLinearOrder(input: {
  creds: ConnectInput;
  symbol: string;
  side: 'Buy' | 'Sell';
  rawQty: number;
  orderLinkId: string;
}): Promise<OrderResult & { reconciledAfterTimeout: boolean }> {
  const lot = await getLinearLot(input.symbol).catch(() => undefined);
  const qty = normalizeQty(input.rawQty, lot);
  try {
    const placed = await privatePost<OrderResult>(
      '/v5/order/create',
      {
        category: 'linear',
        symbol: input.symbol.toUpperCase(),
        side: input.side,
        orderType: 'Market',
        qty,
        positionIdx: 0,
        reduceOnly: false,
        timeInForce: 'IOC',
        orderLinkId: input.orderLinkId,
      },
      input.creds,
    );
    return { ...placed, orderLinkId: placed.orderLinkId ?? input.orderLinkId, reconciledAfterTimeout: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/Bybit request timed out: \/v5\/order\/create/i.test(message)) throw error;

    const reconciled = await findBybitLinearOrderByLinkId({
      creds: input.creds,
      symbol: input.symbol,
      orderLinkId: input.orderLinkId,
    }).catch(() => null);
    if (!reconciled) throw error;
    return { ...reconciled, reconciledAfterTimeout: true };
  }
}
