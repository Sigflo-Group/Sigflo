import { log } from '../lib/logger.js';
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
  holdVol: string;             // position size in contracts (张)
  holdAvgPrice: string;        // avg entry price
  openAvgPrice: string;
  liquidatePrice: string;
  leverage: number;
  im: string;                  // initial margin (USDT)
  realised: string;            // realised PnL so far
  unrealised?: string;         // unrealised (floating) PnL (USDT)
  createTime: number;          // ms
  updateTime: number;
};

type MexcContractTicker = {
  symbol: string;
  lastPrice: string;
  fairPrice?: string;          // mark price
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

// ── Public ticker ───────────────────────────────────────────────────────────

async function fetchContractMarkPrices(mexcSymbols: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (mexcSymbols.length === 0) return out;
  try {
    const res = await getJson<MexcFuturesResponse<MexcContractTicker[]>>(
      `${FUTURES_BASE}/api/v1/contract/ticker`,
      {},
    );
    if (!res.success || !Array.isArray(res.data)) return out;
    const wantSet = new Set(mexcSymbols);
    for (const t of res.data) {
      if (!wantSet.has(t.symbol)) continue;
      const fp = t.fairPrice != null ? Number(t.fairPrice) : NaN;
      if (Number.isFinite(fp) && fp > 0) {
        out.set(t.symbol, fp);
      } else {
        const lp = Number(t.lastPrice);
        if (Number.isFinite(lp) && lp > 0) out.set(t.symbol, lp);
      }
    }
  } catch {
    // best-effort — callers fall back gracefully
  }
  return out;
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
  lossTrend?: 1 | 2 | 3;  // 1=latest, 2=fair, 3=index (required with stopLossPrice)
  profitTrend?: 1 | 2 | 3; // (required with takeProfitPrice)
};

export type MexcOrderResponse = {
  success: boolean;
  data: number;            // orderId
  code?: number;
  message?: string;
};

type MexcStopOrderPlaceResponse = {
  success: boolean;
  data?: number | null;
  code?: number;
  message?: string;
};

export type MexcContractDetail = {
  symbol: string;
  priceUnit: string;
  /** Contract volume step (`volUnit` on MEXC contract/detail). */
  volumeUnit: string;
  minVol: string;
  maxVol: string;
  contractSize: string;
};

/** MEXC contract/detail uses `volUnit`; older typings called it `volumeUnit`. */
function parseContractDetail(row: Record<string, unknown>): MexcContractDetail | null {
  const symbol = typeof row.symbol === 'string' ? row.symbol : '';
  if (!symbol) return null;
  const volUnit = row.volUnit ?? row.volumeUnit;
  return {
    symbol,
    priceUnit: String(row.priceUnit ?? ''),
    volumeUnit: String(volUnit ?? ''),
    minVol: String(row.minVol ?? ''),
    maxVol: String(row.maxVol ?? ''),
    contractSize: String(row.contractSize ?? ''),
  };
}

type CachedLot = { expiryMs: number; lot: MexcContractDetail };
const instrumentLotCache = new Map<string, CachedLot>();
const LOT_CACHE_TTL_MS = 60 * 60 * 1000;

function decimalPlacesFromStepString(stepStr: string): number {
  const n = Number(stepStr);
  if (!Number.isFinite(n) || n <= 0) return 8;
  const s = stepStr.includes('e') || stepStr.includes('E') ? n.toFixed(16) : stepStr;
  const parts = String(s).split('.');
  if (parts.length < 2) return 0;
  return parts[1].replace(/0+$/, '').length || 0;
}

function normalizePriceToStep(priceRaw: string, priceUnitStr: string): string {
  const n = Number(String(priceRaw).trim().replace(/,/g, ''));
  const step = Number(priceUnitStr);
  if (!Number.isFinite(n) || n <= 0) return priceRaw.trim();
  if (!Number.isFinite(step) || step <= 0) return priceRaw.trim();
  const tol = 1e-12;
  let k = Math.round(n / step);
  let adj = k * step;
  const dec = Math.min(16, decimalPlacesFromStepString(priceUnitStr));
  let out = adj.toFixed(dec);
  out = out.replace(/\.?0+$/, '');
  return out === '' ? priceRaw.trim() : out;
}

function normalizeQtyToStep(
  qtyRaw: string,
  qtyStepStr: string,
  minQtyStr: string,
  opts?: { bumpToMin?: boolean },
): string {
  const bumpToMin = opts?.bumpToMin !== false;
  const n = Number(String(qtyRaw).trim().replace(/,/g, ''));
  const step = Number(qtyStepStr);
  const minQ = Number(minQtyStr);
  if (!Number.isFinite(n) || n <= 0) throw new Error('Order qty must be a positive number');
  if (!Number.isFinite(step) || step <= 0) return qtyRaw.trim();
  const tol = 1e-12;
  let k = Math.floor(n / step + tol);
  let adj = k * step;
  if (adj < minQ - tol) {
    if (!bumpToMin) {
      throw new Error(
        `Order size is below the MEXC minimum (${minQtyStr} contracts). Increase margin or order size.`,
      );
    }
    const minK = Math.ceil(minQ / step - tol);
    adj = minK * step;
  }
  if (!Number.isFinite(adj) || adj < minQ - tol || adj <= 0) {
    throw new Error(`Order qty ${qtyRaw} is below this symbol's minimum (${minQtyStr}, step ${qtyStepStr}).`);
  }
  const dec = Math.min(16, decimalPlacesFromStepString(qtyStepStr));
  let out = adj.toFixed(dec);
  out = out.replace(/\.?0+$/, '');
  return out === '' ? '0' : out;
}

async function fetchInstrumentLot(symbol: string): Promise<MexcContractDetail | null> {
  const sym = symbol.toUpperCase();
  const now = Date.now();
  const hit = instrumentLotCache.get(sym);
  if (hit && hit.expiryMs > now) return hit.lot;
  try {
    const res = await getJson<{ success: boolean; data: Array<Record<string, unknown>> }>(
      `${FUTURES_BASE}/api/v1/contract/detail`,
      {},
    );
    if (res.success && Array.isArray(res.data)) {
      const raw = res.data.find((c) => c.symbol === sym);
      const lot = raw ? parseContractDetail(raw) : null;
      if (lot) {
        instrumentLotCache.set(sym, { expiryMs: now + LOT_CACHE_TTL_MS, lot });
        return lot;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/** Convert base-asset qty string → MEXC contract `vol` string (step/min applied). */
async function fetchMexcOpenPositionLeg(
  input: ConnectInput,
  standardSymbol: string,
  positionSide: 'long' | 'short',
): Promise<MexcOpenPosition | null> {
  const mexcSymbol = standardSymbolToMexc(standardSymbol);
  const res = await futuresPrivateGet<MexcFuturesResponse<MexcOpenPosition[]>>(
    '/api/v1/private/position/open_positions',
    { symbol: mexcSymbol },
    input,
  );
  if (!res.success || !Array.isArray(res.data)) return null;
  const wantType: 1 | 2 = positionSide === 'long' ? 1 : 2;
  return (
    res.data.find(
      (p) => p.symbol === mexcSymbol && p.positionType === wantType && Number(p.holdVol) > 0,
    ) ?? null
  );
}

function formatMexcTpSlRejectMessage(res: MexcStopOrderPlaceResponse, fallback: string): string {
  const detail = res.message?.trim() || (res.code != null ? `code=${res.code}` : '');
  if (!detail) return fallback;
  const low = detail.toLowerCase();
  if (
    res.code === 2009
    || res.code === 3
    || low.includes('nonexistent')
    || low.includes('not exist')
    || low.includes('not found')
  ) {
    return 'MEXC has no open position for this symbol — refresh Account sync and try again.';
  }
  return `MEXC TP/SL rejected: ${detail}`;
}

function baseQtyToContractVol(
  baseQty: string,
  lot: MexcContractDetail,
  opts?: { bumpToMin?: boolean },
): string {
  const contractSize = Number(lot.contractSize);
  const raw =
    Number.isFinite(contractSize) && contractSize > 0
      ? String(Number(baseQty) / contractSize)
      : baseQty;
  return normalizeQtyToStep(raw, lot.volumeUnit, lot.minVol, opts);
}

async function ensureLinearLeverage(
  input: ConnectInput,
  mexcSymbol: string,
  leverage: number,
  positionType: 1 | 2,
): Promise<void> {
  const res = await futuresPrivatePost<MexcOrderResponse>(
    '/api/v1/private/position/change_leverage',
    {
      symbol: mexcSymbol,
      leverage,
      openType: 1,
      positionType,
    },
    input,
  );
  if (!res.success) {
    const detail = res.message ?? (res.code != null ? `code=${res.code}` : undefined);
    throw new Error(`MEXC leverage update failed${detail ? `: ${detail}` : ''}`);
  }
}

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
  readonly capabilities = {
    spot: true,
    futures: true,
    hedgeMode: false,
    trailingStop: false,
    closedPnl: true,
  } as const;

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
        balances.set(asset, {
          asset,
          free: existing.free + free,
          locked: existing.locked + locked,
          total: existing.total + total,
        });
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
    } catch (e) {
      console.warn('[MEXC] fetchPositions failed:', e);
      return [];
    }

    const open = raw.filter((p) => Number(p.holdVol) > 0);
    if (open.length === 0) return [];

    const markPriceMap = await fetchContractMarkPrices(open.map((p) => p.symbol));
    const lotBySymbol = new Map<string, MexcContractDetail>();
    await Promise.all(
      [...new Set(open.map((p) => p.symbol))].map(async (mexcSym) => {
        const lot = await fetchInstrumentLot(mexcSym);
        if (lot) lotBySymbol.set(mexcSym, lot);
      }),
    );

    return open.map((p): PositionItem => {
      const holdContracts = Number(p.holdVol);
      const lot = lotBySymbol.get(p.symbol);
      const contractSize = Number(lot?.contractSize);
      const size =
        Number.isFinite(contractSize) && contractSize > 0
          ? holdContracts * contractSize
          : holdContracts;
      const entryPrice = Number(p.holdAvgPrice || p.openAvgPrice);
      const side: 'long' | 'short' = p.positionType === 1 ? 'long' : 'short';

      const tickerMark = markPriceMap.get(p.symbol);
      let markPrice: number | undefined;
      if (tickerMark != null && tickerMark > 0) {
        markPrice = tickerMark;
      }

      let unrealizedPnl: number | undefined;
      if (p.unrealised != null) {
        const u = Number(p.unrealised);
        if (Number.isFinite(u)) {
          unrealizedPnl = u;
          // Derive mark price from unrealised if ticker didn't supply one
          if (markPrice == null && size > 0 && entryPrice > 0) {
            const derived = entryPrice + (side === 'long' ? u : -u) / size;
            if (Number.isFinite(derived) && derived > 0) markPrice = derived;
          }
        }
      } else if (markPrice != null && size > 0 && entryPrice > 0) {
        unrealizedPnl = side === 'long'
          ? (markPrice - entryPrice) * size
          : (entryPrice - markPrice) * size;
      }

      return {
        symbol: mexcSymbolToStandard(p.symbol),
        side,
        size,
        entryPrice,
        ...(markPrice != null ? { markPrice } : {}),
        ...(unrealizedPnl != null ? { unrealizedPnl } : {}),
        liqPrice: Number(p.liquidatePrice) > 0 ? Number(p.liquidatePrice) : undefined,
        leverage: p.leverage > 0 ? p.leverage : undefined,
        positionIM: Number(p.im) > 0 ? Number(p.im) : undefined,
        openedAtMs: p.createTime > 0 ? p.createTime : undefined,
      };
    });
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

    // Normalize price / qty to MEXC tick-size / step-size
    let price = params.price;
    let qty = params.qty;
    try {
      const lot = await fetchInstrumentLot(mexcSymbol);
      if (!lot) {
        throw new Error(`Could not load MEXC contract rules for ${mexcSymbol}. Try again shortly.`);
      }
      if (price) price = normalizePriceToStep(price, lot.priceUnit);
      qty = baseQtyToContractVol(qty, lot, { bumpToMin: !params.reduceOnly });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log('warn', 'MEXC order qty normalization failed', { symbol: mexcSymbol, error: msg });
      throw e instanceof Error ? e : new Error(msg);
    }

    // Map Bybit-style side+reduceOnly → MEXC side integer
    // 1=open long, 2=close short, 3=open short, 4=close long
    let mexcSide: 1 | 2 | 3 | 4;
    if (params.side === 'Buy' && !params.reduceOnly) mexcSide = 1;       // open long
    else if (params.side === 'Sell' && !params.reduceOnly) mexcSide = 3; // open short
    else if (params.side === 'Sell' && params.reduceOnly) mexcSide = 4;  // close long
    else mexcSide = 2;                                                    // Buy + reduceOnly → close short

    if (params.leverage != null && !params.reduceOnly) {
      const positionType: 1 | 2 = params.side === 'Buy' ? 1 : 2;
      await ensureLinearLeverage(input, mexcSymbol, params.leverage, positionType);
    }

    const orderBody: MexcOrderRequest = {
      symbol: mexcSymbol,
      side: mexcSide,
      openType: 1, // isolated
      type: params.orderType === 'Limit' ? 1 : 5,
      vol: qty,
      ...(params.leverage != null && !params.reduceOnly ? { leverage: params.leverage } : {}),
      price: price ?? '0',
    };

    // MEXC order/create rejects TP/SL on market orders — callers use setPositionTpSl after fill.
    if (params.takeProfit || params.stopLoss) {
      log('warn', 'MEXC placeLinearOrder ignores TP/SL on create; use setPositionTpSl after fill', {
        symbol: mexcSymbol,
        hadTakeProfit: !!params.takeProfit,
        hadStopLoss: !!params.stopLoss,
      });
    }

    const res = await futuresPrivatePost<MexcOrderResponse>(
      '/api/v1/private/order/create',
      orderBody as unknown as Record<string, unknown>,
      input,
    );

    if (!res.success) {
      const detail = res.message ?? (res.code != null ? `code=${res.code}` : undefined);
      throw new Error(
        `MEXC order rejected${detail ? `: ${detail}` : ''}`,
      );
    }

    return { orderId: String(res.data) };
  }

  /**
   * Set full-position TP/SL on an open MEXC futures position via
   * `/api/v1/private/stoporder/place` (position-level TP/SL). Pass "0" for a side
   * to skip that level. Returns order id(s) from the exchange.
   */
  async setPositionTpSl(
    input: ConnectInput,
    params: {
      symbol: string;          // "BTCUSDT"
      positionSide: 'long' | 'short';
      qty: string;             // base asset quantity
      takeProfit?: string;     // price as string; "0" = no TP / clear
      stopLoss?: string;       // price as string; "0" = no SL / clear
    },
  ): Promise<{
    orderIds: string[];
    placed: { sl?: string; tp?: string };
    warnings: string[];
  }> {
    const mexcSymbol = standardSymbolToMexc(params.symbol);
    const warnings: string[] = [];
    const placed: { sl?: string; tp?: string } = {};

    const hasSl = params.stopLoss != null && Number(params.stopLoss) > 0;
    const hasTp = params.takeProfit != null && Number(params.takeProfit) > 0;
    if (!hasSl && !hasTp) {
      return { orderIds: [], placed, warnings };
    }

    let leg = await fetchMexcOpenPositionLeg(input, params.symbol, params.positionSide);
    if (!leg) {
      const deadline = Date.now() + 10_000;
      while (!leg && Date.now() < deadline) {
        await new Promise<void>((r) => {
          setTimeout(r, 300);
        });
        leg = await fetchMexcOpenPositionLeg(input, params.symbol, params.positionSide);
      }
    }
    if (!leg) {
      throw new Error('MEXC has no open position for this symbol — refresh Account sync and try again.');
    }

    const lot = await fetchInstrumentLot(mexcSymbol);
    if (!lot) {
      throw new Error(`Could not load MEXC contract rules for ${mexcSymbol}. Try again shortly.`);
    }

    let contractVol: string;
    try {
      contractVol = normalizeQtyToStep(String(leg.holdVol), lot.volumeUnit, lot.minVol, { bumpToMin: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log('warn', 'MEXC TP/SL qty normalization failed', { symbol: mexcSymbol, holdVol: leg.holdVol, error: msg });
      throw e instanceof Error ? e : new Error(msg);
    }

    const body: Record<string, unknown> = {
      positionId: leg.positionId,
      vol: contractVol,
      volType: 2,
      lossTrend: 1,
      profitTrend: 1,
      stopLossType: 0,
      stopLossOrderPrice: 0,
      takeProfitType: 0,
      takeProfitOrderPrice: 0,
    };
    if (hasSl) {
      body.stopLossPrice = normalizePriceToStep(params.stopLoss!, lot.priceUnit);
    }
    if (hasTp) {
      body.takeProfitPrice = normalizePriceToStep(params.takeProfit!, lot.priceUnit);
    }

    const res = await futuresPrivatePost<MexcStopOrderPlaceResponse>(
      '/api/v1/private/stoporder/place',
      body,
      input,
    );
    if (!res.success || res.data == null) {
      const msg = formatMexcTpSlRejectMessage(res, 'MEXC TP/SL placement failed');
      log('warn', 'MEXC TP/SL placement rejected', { symbol: mexcSymbol, positionId: leg.positionId, error: msg });
      throw new Error(msg);
    }

    const orderId = String(res.data);
    if (hasSl) placed.sl = orderId;
    if (hasTp) placed.tp = orderId;
    return { orderIds: [orderId], placed, warnings };
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
    } catch (e) {
      console.warn('[MEXC] fetchClosedTrades failed:', e);
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
