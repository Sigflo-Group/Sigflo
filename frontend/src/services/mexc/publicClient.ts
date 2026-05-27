import { apiJson } from '@/services/api/http';
import type { Candle } from '@/types/market';

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
  low24Price?: string;
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
    `/mexc-public/klines/${encodeURIComponent(symbol)}?interval=${mexcInterval}&limit=${limit}`,
  );
  if (!json?.success || !json.data?.time?.length) return [];
  const d = json.data;
  return d.time.map((ts, i) => ({
    ts: ts < 1e12 ? ts * 1000 : ts,
    open: Number(d.open[i]),
    high: Number(d.high[i]),
    low: Number(d.low[i]),
    close: Number(d.close[i]),
    volume: Number(d.vol[i]),
  }));
}

export async function fetchMexcTicker(symbol: string): Promise<MexcPublicTickerSnapshot | null> {
  const json = await apiJson<MexcFuturesResponse<MexcTickerData | MexcTickerData[]>>(
    `/mexc-public/ticker/${encodeURIComponent(symbol)}`,
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

  const high24h = Number(t.high24Price ?? t.lower24Price ?? lastPrice);
  const low24h = Number(t.low24Price ?? t.lower24Price ?? lastPrice);
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
