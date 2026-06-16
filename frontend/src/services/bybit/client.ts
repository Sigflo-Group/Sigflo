import type { Candle, KlineInterval, SymbolTicker, SymbolUniverseItem } from '@/types/market';

const BASE =
  typeof import.meta !== 'undefined' && import.meta.env?.DEV
    ? '/bybit-proxy'
    : 'https://api.bybit.com';

// Bybit public API is aggressively rate-limited by IP. In production the SPA hits
// api.bybit.com directly, so serialise kline requests with a small gap and retry
// when we get rate-limit responses. This prevents the engine bootstrap from failing
// with "Too many visits" and leaving every symbol stuck at skip_btc_eth_warmup.
const KLINE_MIN_INTERVAL_MS = 500; // 2 req/s max
const KLINE_RATE_LIMIT_RETRIES = 5;

let klineRequestQueue: Promise<unknown> = Promise.resolve();
let lastKlineRequestTime = 0;

function scheduleKlineRequest<T>(fn: () => Promise<T>): Promise<T> {
  const next = klineRequestQueue.then(async () => {
    const now = Date.now();
    const wait = Math.max(0, KLINE_MIN_INTERVAL_MS - (now - lastKlineRequestTime));
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    lastKlineRequestTime = Date.now();
    return fn();
  });
  // Attach a no-op catch so the queue Promise never rejects; real errors surface via `next`.
  klineRequestQueue = next.catch(() => undefined);
  return next;
}

type BybitResp<T> = { retCode: number; retMsg: string; result: T };

function toNum(v: string | number | undefined): number {
  if (v === undefined) return 0;
  return typeof v === 'number' ? v : Number(v);
}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const r = await fetch(`${BASE}${path}`, { signal });
  if (!r.ok) throw new Error(`Bybit HTTP ${r.status}`);
  return (await r.json()) as T;
}

function isBybitRateLimitError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return msg.includes('too many visits') || msg.includes('rate limit') || msg.includes('exceeded');
}

export async function fetchTradablePerpSymbols(): Promise<string[]> {
  const data = await getJson<BybitResp<{ list: Array<{ symbol: string; status: string; quoteCoin: string }> }>>(
    '/v5/market/instruments-info?category=linear&limit=1000',
  );
  if (data.retCode !== 0) throw new Error(data.retMsg || 'Bybit instruments failed');
  return (data.result?.list ?? [])
    .filter((x) => x.status === 'Trading' && x.quoteCoin === 'USDT')
    .map((x) => x.symbol);
}

/** Max leverage allowed for the linear USDT contract (from instruments-info). Null if the request fails. */
export async function fetchLinearMaxLeverage(symbol: string): Promise<number | null> {
  const sym = symbol.trim().toUpperCase().replace(/\s+/g, '');
  if (!sym) return null;
  try {
    const data = await getJson<
      BybitResp<{
        list?: Array<{ leverageFilter?: { maxLeverage?: string } }>;
      }>
    >(`/v5/market/instruments-info?category=linear&symbol=${encodeURIComponent(sym)}`);
    if (data.retCode !== 0) return null;
    const raw = data.result.list?.[0]?.leverageFilter?.maxLeverage;
    const n = raw != null ? Number(String(raw).trim()) : NaN;
    if (!Number.isFinite(n) || n < 1) return null;
    return Math.max(1, Math.min(200, Math.floor(n)));
  } catch {
    return null;
  }
}

const TICKER_BATCH_SIZE = 10;

function mapTickerRows(list: Array<Record<string, string>>, symbolSet?: Set<string>): SymbolTicker[] {
  return list
    .filter((x) => (symbolSet ? symbolSet.has(String(x.symbol ?? '')) : true))
    .map((x) => {
      const markRaw = toNum(x.markPrice);
      const indexRaw = toNum(x.indexPrice);
      return {
        symbol: String(x.symbol ?? ''),
        lastPrice: toNum(x.lastPrice),
        ...(Number.isFinite(markRaw) && markRaw > 0 ? { markPrice: markRaw } : {}),
        ...(Number.isFinite(indexRaw) && indexRaw > 0 ? { indexPrice: indexRaw } : {}),
        high24h: toNum(x.highPrice24h),
        low24h: toNum(x.lowPrice24h),
        volume24h: toNum(x.volume24h),
        turnover24h: toNum(x.turnover24h),
        price24hPcnt: toNum(x.price24hPcnt),
      };
    });
}

async function fetchTickersBatch(symbols: string[], signal?: AbortSignal): Promise<SymbolTicker[]> {
  const param = `&symbol=${symbols.map((s) => encodeURIComponent(s)).join(',')}`;
  const data = await getJson<BybitResp<{ list: Array<Record<string, string>> }>>(
    `/v5/market/tickers?category=linear${param}`,
    signal,
  );
  if (data.retCode !== 0) throw new Error(data.retMsg || 'Bybit tickers failed');
  return mapTickerRows(data.result?.list ?? [], new Set(symbols));
}

export async function fetchTickers(symbols?: string[], signal?: AbortSignal): Promise<SymbolTicker[]> {
  if (!symbols?.length) {
    const data = await getJson<BybitResp<{ list: Array<Record<string, string>> }>>(
      `/v5/market/tickers?category=linear`,
      signal,
    );
    if (data.retCode !== 0) throw new Error(data.retMsg || 'Bybit tickers failed');
    return mapTickerRows(data.result?.list ?? []);
  }
  const out: SymbolTicker[] = [];
  for (let i = 0; i < symbols.length; i += TICKER_BATCH_SIZE) {
    const batch = symbols.slice(i, i + TICKER_BATCH_SIZE);
    const rows = await fetchTickersBatch(batch, signal);
    out.push(...rows);
  }
  return out;
}

export function rankLiquidUniverse(tickers: SymbolTicker[], minCount: number, maxCount: number): SymbolUniverseItem[] {
  const sorted = [...tickers].sort((a, b) => b.turnover24h - a.turnover24h);
  const take = Math.min(Math.max(minCount, 1), Math.max(maxCount, 1));
  return sorted.slice(0, take).map((t) => ({
    symbol: t.symbol,
    volume24h: t.volume24h,
    turnover24h: t.turnover24h,
  }));
}

export async function fetchKlines(symbol: string, interval: KlineInterval, limit = 200): Promise<Candle[]> {
  const path = `/v5/market/kline?category=linear&symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=${limit}`;

  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= KLINE_RATE_LIMIT_RETRIES; attempt++) {
    try {
      const data = await scheduleKlineRequest(() => getJson<BybitResp<{ list: string[][] }>>(path));
      if (data.retCode !== 0) throw new Error(data.retMsg || 'Bybit kline failed');
      // Bybit returns newest first; the first entry is the current forming bar.
      // After reversing, the last entry is the forming bar — mark it isClosed: false so the
      // detector pipeline can strip it and avoid running indicators against a partial candle.
      const raw = (data.result?.list ?? [])
        .map((r) => ({
          ts: Number(r[0]),
          open: Number(r[1]),
          high: Number(r[2]),
          low: Number(r[3]),
          close: Number(r[4]),
          volume: Number(r[5]),
        }))
        .reverse();
      return raw.map((c, i) => ({ ...c, isClosed: i < raw.length - 1 }));
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (!isBybitRateLimitError(lastError) || attempt === KLINE_RATE_LIMIT_RETRIES) throw lastError;
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s.
      await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** attempt));
    }
  }
  throw lastError ?? new Error('Bybit kline failed');
}
