import { apiJson } from '@/services/api/http';
import type { Candle, SymbolTicker, SymbolUniverseItem } from '@/types/market';

/** Idempotent — see backend/src/routes/mexcPublic.ts for why this must never double-convert. */
function toMexcSymbol(sym: string): string {
  if (sym.includes('_')) return sym;
  return sym.endsWith('USDT') ? sym.slice(0, -4) + '_USDT' : sym;
}

const INTERVAL_MAP: Record<string, string> = {
  '1': 'Min1',
  '5': 'Min5',
  '15': 'Min15',
  '30': 'Min30',
  '60': 'Min60',
  '240': 'Hour4',
  D: 'Day1',
  W: 'Week1',
};

type MexcFuturesResponse<T> = { success: boolean; code: number; data: T };

type MexcKlineData = {
  time: number[];
  open: (number | string)[];
  close: (number | string)[];
  high: (number | string)[];
  low: (number | string)[];
  vol: (number | string)[];
};

type MexcTickerData = {
  symbol: string;
  lastPrice: string;
  fairPrice?: string;
  indexPrice?: string;
  riseFallRate?: string;
  changeRate24?: string;
  high24Price?: string;
  lower24Price?: string;
  amount24?: string;
  volume24?: string;
};

export type MexcPublicTickerSnapshot = {
  lastPrice: number;
  markPrice: number | undefined;
  indexPrice: number | undefined;
  change24hPct: number;
  high24h: number;
  low24h: number;
  turnover24hUsd: number;
};

export async function fetchMexcKlines(symbol: string, interval: string, limit = 140): Promise<Candle[]> {
  const mexcInterval = INTERVAL_MAP[interval] ?? 'Min15';
  const json = await apiJson<MexcFuturesResponse<MexcKlineData>>(
    `/mexc-public/klines/${encodeURIComponent(toMexcSymbol(symbol))}?interval=${mexcInterval}&limit=${limit}`,
  );
  if (!json?.success || !json.data?.time?.length) return [];
  const d = json.data;
  const candles = d.time.map((ts, i) => ({
    ts: ts < 1e12 ? ts * 1000 : ts,
    open: Number(d.open[i]),
    high: Number(d.high[i]),
    low: Number(d.low[i]),
    close: Number(d.close[i]),
    volume: Number(d.vol[i]),
  }));
  return candles.map((c, i) => ({ ...c, isClosed: i < candles.length - 1 }));
}

export async function fetchMexcTicker(symbol: string): Promise<MexcPublicTickerSnapshot | null> {
  const json = await apiJson<MexcFuturesResponse<MexcTickerData | MexcTickerData[]>>(
    `/mexc-public/ticker/${encodeURIComponent(toMexcSymbol(symbol))}`,
  );
  if (!json?.success || !json.data) return null;
  const t = Array.isArray(json.data) ? json.data[0] : json.data;
  if (!t) return null;

  const lastPrice = Number(t.lastPrice);
  if (!Number.isFinite(lastPrice) || lastPrice <= 0) return null;

  const rawMark = t.fairPrice != null ? Number(t.fairPrice) : NaN;
  const markPrice = Number.isFinite(rawMark) && rawMark > 0 ? rawMark : undefined;

  const rawIndex = t.indexPrice != null ? Number(t.indexPrice) : NaN;
  const indexPrice = Number.isFinite(rawIndex) && rawIndex > 0 ? rawIndex : undefined;

  const rawRate = t.riseFallRate ?? t.changeRate24;
  const change24hPct = rawRate != null ? Number(rawRate) * 100 : 0;

  const high24h = Number(t.high24Price ?? lastPrice);
  const low24h = Number(t.lower24Price ?? lastPrice);
  const turnover24hUsd = Number(t.amount24 ?? t.volume24 ?? 0);

  return {
    lastPrice,
    markPrice,
    indexPrice,
    change24hPct: Number.isFinite(change24hPct) ? change24hPct : 0,
    high24h: Number.isFinite(high24h) && high24h > 0 ? high24h : lastPrice,
    low24h: Number.isFinite(low24h) && low24h > 0 ? low24h : lastPrice,
    turnover24hUsd,
  };
}

type MexcBulkTickerData = {
  symbol: string;
  lastPrice: string;
  fairPrice?: string;
  indexPrice?: string;
  riseFallRate?: string;
  high24Price?: string;
  lower24Price?: string;
  volume24?: string;
  amount24?: string;
};

function toSymbolTicker(t: MexcBulkTickerData): SymbolTicker {
  const markRaw = t.fairPrice != null ? Number(t.fairPrice) : NaN;
  const indexRaw = t.indexPrice != null ? Number(t.indexPrice) : NaN;
  return {
    symbol: t.symbol.replace(/_/g, ''),
    lastPrice: Number(t.lastPrice),
    ...(Number.isFinite(markRaw) && markRaw > 0 ? { markPrice: markRaw } : {}),
    ...(Number.isFinite(indexRaw) && indexRaw > 0 ? { indexPrice: indexRaw } : {}),
    high24h: Number(t.high24Price ?? 0),
    low24h: Number(t.lower24Price ?? 0),
    volume24h: Number(t.volume24 ?? 0),
    turnover24h: Number(t.amount24 ?? 0),
    price24hPcnt: Number(t.riseFallRate ?? 0),
  };
}

export async function fetchTickers(symbols?: string[]): Promise<SymbolTicker[]> {
  const json = await apiJson<MexcFuturesResponse<MexcBulkTickerData[]>>('/mexc-public/tickers');
  if (!json?.success || !Array.isArray(json.data)) return [];
  const list = json.data.map(toSymbolTicker);
  if (symbols?.length) {
    const set = new Set(symbols);
    return list.filter((t) => set.has(t.symbol));
  }
  return list;
}

export async function fetchTradablePerpSymbols(): Promise<string[]> {
  const json = await apiJson<MexcFuturesResponse<MexcBulkTickerData[]>>('/mexc-public/tickers');
  if (!json?.success || !Array.isArray(json.data)) return [];
  return json.data.map((t) => t.symbol.replace(/_/g, ''));
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
