import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { BybitWsClient } from '@/lib/bybitWsClient';
import { LIVE_MARKET_CHART_THROTTLE_MS, LIVE_MARKET_UI_THROTTLE_MS } from '@/lib/liveMarketTickConstants';
import { fetchKlines, fetchTickers } from '@/services/bybit/client';
import type { Candle } from '@/types/market';
import type { TradeChartCandle } from '@/types/trade';

export type TradeChartInterval = '1' | '5' | '15' | '60' | '240' | 'D' | 'W';
const SUPPORTED_INTERVALS: TradeChartInterval[] = ['1', '5', '15', '60', '240', 'D', 'W'];

export type LiveTradeTickSnapshot = {
  lastPrice: number;
  /** Linear mark price when known (REST/WS); omitted on spot or before first tick. */
  markPrice?: number;
  /** Linear index price when known (REST/WS). */
  indexPrice?: number;
  change24hPct: number;
  high24h: number;
  low24h: number;
  volume24h: string;
  lastUpdateTs: number;
};

type LiveTradeState = {
  /** Set when `lastPrice` / candles were produced for this Bybit linear symbol; used to mask stale rows after `symbol` prop changes. */
  dataSymbol?: string;
  lastPrice?: number;
  markPrice?: number;
  indexPrice?: number;
  change24hPct?: number;
  high24h?: number;
  low24h?: number;
  volume24h?: string;
  priceSeries?: number[];
  chartCandles?: TradeChartCandle[];
  loadingInterval: boolean;
  lastUpdateTs?: number;
  mode: 'REST' | 'WS' | 'OFFLINE';
  connection: 'connected' | 'reconnecting' | 'disconnected';
};

export type LiveTradeMarketResult = LiveTradeState & {
  /** Updated synchronously on every ticker / trade — source of truth for tick logic. */
  lastPriceRef: MutableRefObject<number | undefined>;
  /** Full quote snapshot; WS handlers write here only (no setState). */
  tickSnapshotRef: MutableRefObject<LiveTradeTickSnapshot | null>;
};

type LiveTradeMarketOptions = {
  /** Optional quote UI throttle override for high-responsiveness views (e.g. manage-mode PnL). */
  uiThrottleMs?: number;
  /** When true, quote UI fields are pushed immediately on incoming ticks/public trades. */
  immediateUiOnTick?: boolean;
};

function upsertCandle(store: Candle[], next: Candle): Candle[] {
  const out = [...store];
  const last = out.at(-1);
  if (!last || next.ts > last.ts) out.push(next);
  else if (next.ts === last.ts) out[out.length - 1] = next;
  return out.slice(-140);
}

function toBillions(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  return `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function normalizeSeries(candles: Candle[]): number[] {
  if (candles.length === 0) return [];
  const closes = candles.map((c) => c.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = Math.max(0.000001, max - min);
  return closes.map((v) => (v - min) / span);
}

function toTradeCandles(candles: Candle[]): TradeChartCandle[] {
  return candles.map((c) => ({
    ts: c.ts,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
  }));
}

export function useLiveTradeMarket(
  symbol: string,
  interval: TradeChartInterval,
  options?: LiveTradeMarketOptions,
): LiveTradeMarketResult {
  const [state, setState] = useState<LiveTradeState>({
    loadingInterval: true,
    mode: 'OFFLINE',
    connection: 'disconnected',
  });

  const lastPriceRef = useRef<number | undefined>(undefined);
  const tickSnapshotRef = useRef<LiveTradeTickSnapshot | null>(null);
  const pendingUiRef = useRef(false);
  const pendingChartRef = useRef(false);
  const chartImmediateRef = useRef(false);

  const candlesRef = useRef<Record<TradeChartInterval, Candle[]>>({
    '1': [],
    '5': [],
    '15': [],
    '60': [],
    '240': [],
    D: [],
    W: [],
  });
  const readyRef = useRef(false);

  /** Drop tick refs as soon as `symbol` changes so nothing reads the prior pair’s price before the main effect runs. */
  useLayoutEffect(() => {
    lastPriceRef.current = undefined;
    tickSnapshotRef.current = null;
  }, [symbol]);

  /** RAF loop: refs → React state at throttled rates. */
  useEffect(() => {
    let stopped = false;
    let raf = 0;
    let lastUiPush = -Infinity;
    let lastChartPush = -Infinity;

    const tick = () => {
      if (stopped) return;
      raf = window.requestAnimationFrame(tick);
      const snap = tickSnapshotRef.current;
      if (!snap) return;

      const now = performance.now();
      const uiThrottleMs = Math.max(16, options?.uiThrottleMs ?? LIVE_MARKET_UI_THROTTLE_MS);
      const uiDue = pendingUiRef.current && now - lastUiPush >= uiThrottleMs;
      const chartImmediate = chartImmediateRef.current;
      chartImmediateRef.current = false;
      const chartDue =
        pendingChartRef.current &&
        (chartImmediate || now - lastChartPush >= LIVE_MARKET_CHART_THROTTLE_MS);

      if (!uiDue && !chartDue) return;

      const active = candlesRef.current[interval];

      if (uiDue) {
        pendingUiRef.current = false;
        lastUiPush = now;
      }
      if (chartDue) {
        pendingChartRef.current = false;
        lastChartPush = now;
      }

      setState((prev) => {
        const next: LiveTradeState = { ...prev };
        if (uiDue) {
          next.lastPrice = snap.lastPrice;
          if (snap.markPrice != null && Number.isFinite(snap.markPrice) && snap.markPrice > 0) {
            next.markPrice = snap.markPrice;
          }
          if (snap.indexPrice != null && Number.isFinite(snap.indexPrice) && snap.indexPrice > 0) {
            next.indexPrice = snap.indexPrice;
          }
          next.change24hPct = snap.change24hPct;
          next.high24h = snap.high24h;
          next.low24h = snap.low24h;
          next.volume24h = snap.volume24h;
          next.lastUpdateTs = snap.lastUpdateTs;
          next.mode = readyRef.current ? 'WS' : prev.mode;
          next.dataSymbol = symbol;
        }
        if (chartDue && active.length > 0) {
          next.priceSeries = normalizeSeries(active);
          next.chartCandles = toTradeCandles(active);
          next.loadingInterval = false;
          next.mode = readyRef.current ? 'WS' : prev.mode;
          next.dataSymbol = symbol;
        }
        return next;
      });
    };

    raf = window.requestAnimationFrame(tick);
    return () => {
      stopped = true;
      window.cancelAnimationFrame(raf);
    };
  }, [symbol, interval, options?.uiThrottleMs]);

  useEffect(() => {
    let cancelled = false;
    readyRef.current = false;
    candlesRef.current = { '1': [], '5': [], '15': [], '60': [], '240': [], D: [], W: [] };
    tickSnapshotRef.current = null;
    lastPriceRef.current = undefined;
    pendingUiRef.current = false;
    pendingChartRef.current = false;
    chartImmediateRef.current = false;
    /** Drop prior symbol/interval OHLC from React state immediately — avoids painting the wrong asset after pair change (e.g. BTC candles under LINK). */
    setState((prev) => ({
      ...prev,
      loadingInterval: true,
      chartCandles: undefined,
      priceSeries: undefined,
      lastPrice: undefined,
      markPrice: undefined,
      indexPrice: undefined,
      change24hPct: undefined,
      high24h: undefined,
      low24h: undefined,
      volume24h: undefined,
      lastUpdateTs: undefined,
      dataSymbol: symbol,
    }));

    async function bootstrap(reason: 'startup' | 'reconnect') {
      try {
        console.log(`[Sigflo][Trade] REST bootstrap (${reason}) ${symbol}`);
        const [c1, c5, c15, c60, c240, cD, cW, tickers] = await Promise.all([
          fetchKlines(symbol, '1', 200),
          fetchKlines(symbol, '5', 140),
          fetchKlines(symbol, '15', 140),
          fetchKlines(symbol, '60', 140),
          fetchKlines(symbol, '240', 140),
          fetchKlines(symbol, 'D', 140),
          fetchKlines(symbol, 'W', 140),
          fetchTickers([symbol]),
        ]);
        candlesRef.current = {
          '1': c1,
          '5': c5,
          '15': c15,
          '60': c60,
          '240': c240,
          D: cD,
          W: cW,
        };
        const active = candlesRef.current[interval];
        const t = tickers[0];
        if (!t || cancelled) {
          if (!cancelled) {
            setState((prev) => ({
              ...prev,
              loadingInterval: false,
              dataSymbol: symbol,
              mode: 'OFFLINE',
              connection: 'disconnected',
            }));
          }
          return;
        }
        readyRef.current = true;

        const markPx =
          t.markPrice != null && Number.isFinite(t.markPrice) && t.markPrice > 0 ? t.markPrice : undefined;
        const indexPx =
          t.indexPrice != null && Number.isFinite(t.indexPrice) && t.indexPrice > 0 ? t.indexPrice : undefined;
        const snap: LiveTradeTickSnapshot = {
          lastPrice: t.lastPrice,
          ...(markPx != null ? { markPrice: markPx } : {}),
          ...(indexPx != null ? { indexPrice: indexPx } : {}),
          change24hPct: t.price24hPcnt * 100,
          high24h: t.high24h,
          low24h: t.low24h,
          volume24h: toBillions(t.turnover24h),
          lastUpdateTs: Date.now(),
        };
        tickSnapshotRef.current = snap;
        lastPriceRef.current = t.lastPrice;

        setState((prev) => ({
          ...prev,
          dataSymbol: symbol,
          lastPrice: snap.lastPrice,
          ...(markPx != null ? { markPrice: markPx } : {}),
          ...(indexPx != null ? { indexPrice: indexPx } : {}),
          change24hPct: snap.change24hPct,
          high24h: snap.high24h,
          low24h: snap.low24h,
          volume24h: snap.volume24h,
          priceSeries: normalizeSeries(active),
          chartCandles: toTradeCandles(active),
          loadingInterval: false,
          lastUpdateTs: snap.lastUpdateTs,
          mode: prev.connection === 'connected' ? 'WS' : 'REST',
        }));
      } catch {
        if (cancelled) return;
        tickSnapshotRef.current = null;
        lastPriceRef.current = undefined;
        setState((prev) => ({
          ...prev,
          loadingInterval: false,
          dataSymbol: symbol,
          mode: 'OFFLINE',
          connection: 'disconnected',
        }));
      }
    }

    const applyTickerToCandles = (price: number) => {
      const active = candlesRef.current[interval];
      if (active.length > 0) {
        const last = active[active.length - 1];
        active[active.length - 1] = {
          ...last,
          close: price,
          high: Math.max(last.high, price),
          low: Math.min(last.low, price),
        };
      }
    };

    const ws = new BybitWsClient({
      klineSymbols: [symbol],
      klineIntervals: SUPPORTED_INTERVALS,
      includeTickers: true,
      includePublicTrades: true,
      onLog: (msg) => console.log(`[Sigflo][Trade] ${msg}`),
      onConnectionChange: (connection) => {
        setState((prev) => ({
          ...prev,
          connection,
          mode:
            prev.mode === 'OFFLINE'
              ? 'OFFLINE'
              : connection === 'connected'
                ? 'WS'
                : connection === 'reconnecting'
                  ? 'REST'
                  : 'REST',
        }));
        if (connection === 'connected') void bootstrap('reconnect');
      },
      onTicker: (t) => {
        if (t.symbol !== symbol) return;
        const price = t.lastPrice;
        const prev = tickSnapshotRef.current;
        const markPx =
          t.markPrice > 0
            ? t.markPrice
            : prev?.markPrice != null && prev.markPrice > 0
              ? prev.markPrice
              : undefined;
        const indexPx =
          t.indexPrice != null && t.indexPrice > 0
            ? t.indexPrice
            : prev?.indexPrice != null && prev.indexPrice > 0
              ? prev.indexPrice
              : undefined;
        const snap: LiveTradeTickSnapshot = {
          lastPrice: price,
          ...(markPx != null ? { markPrice: markPx } : {}),
          ...(indexPx != null ? { indexPrice: indexPx } : {}),
          change24hPct: t.price24hPcnt * 100,
          high24h: t.high24h,
          low24h: t.low24h,
          volume24h: toBillions(t.turnover24h),
          lastUpdateTs: Date.now(),
        };
        tickSnapshotRef.current = snap;
        lastPriceRef.current = price;
        applyTickerToCandles(price);
        pendingUiRef.current = true;
        pendingChartRef.current = true;
        if (options?.immediateUiOnTick) {
          setState((prev) => ({
            ...prev,
            dataSymbol: symbol,
            lastPrice: snap.lastPrice,
            ...(snap.markPrice != null ? { markPrice: snap.markPrice } : {}),
            ...(snap.indexPrice != null ? { indexPrice: snap.indexPrice } : {}),
            change24hPct: snap.change24hPct,
            high24h: snap.high24h,
            low24h: snap.low24h,
            volume24h: snap.volume24h,
            lastUpdateTs: snap.lastUpdateTs,
            mode: readyRef.current ? 'WS' : prev.mode,
          }));
          pendingUiRef.current = false;
        }
      },
      onPublicTrade: (tr) => {
        if (tr.symbol !== symbol) return;
        const price = tr.price;
        const prevSnap = tickSnapshotRef.current;
        if (!prevSnap) return;
        tickSnapshotRef.current = {
          ...prevSnap,
          lastPrice: price,
          lastUpdateTs: Date.now(),
        };
        lastPriceRef.current = price;
        applyTickerToCandles(price);
        pendingUiRef.current = true;
        pendingChartRef.current = true;
        if (options?.immediateUiOnTick) {
          const snap = tickSnapshotRef.current;
          if (snap) {
            setState((prev) => ({
              ...prev,
              dataSymbol: symbol,
              lastPrice: snap.lastPrice,
              ...(snap.markPrice != null ? { markPrice: snap.markPrice } : {}),
              ...(snap.indexPrice != null ? { indexPrice: snap.indexPrice } : {}),
              change24hPct: snap.change24hPct,
              high24h: snap.high24h,
              low24h: snap.low24h,
              volume24h: snap.volume24h,
              lastUpdateTs: snap.lastUpdateTs,
              mode: readyRef.current ? 'WS' : prev.mode,
            }));
            pendingUiRef.current = false;
          }
        }
      },
      onKline: (k) => {
        if (k.symbol !== symbol) return;
        if (!SUPPORTED_INTERVALS.includes(k.interval as TradeChartInterval)) return;
        const key: TradeChartInterval = k.interval as TradeChartInterval;
        candlesRef.current[key] = upsertCandle(candlesRef.current[key], {
          ts: k.start,
          open: k.open,
          high: k.high,
          low: k.low,
          close: k.close,
          volume: k.volume,
          isClosed: k.confirm,
        });
        if (k.confirm) {
          chartImmediateRef.current = true;
        }
        const active = candlesRef.current[interval];
        if (active.length > 0) {
          const c = active[active.length - 1];
          const base = tickSnapshotRef.current;
          if (base) {
            tickSnapshotRef.current = {
              ...base,
              lastPrice: c.close,
              lastUpdateTs: Date.now(),
            };
            lastPriceRef.current = c.close;
          }
        }
        pendingUiRef.current = true;
        pendingChartRef.current = true;
      },
    });

    void bootstrap('startup').then(() => ws.connect());
    return () => {
      cancelled = true;
      ws.disconnect();
    };
  }, [symbol, interval, options?.immediateUiOnTick]);

  useEffect(() => {
    const active = candlesRef.current[interval];
    if (!active || active.length === 0) return;
    chartImmediateRef.current = true;
    pendingChartRef.current = true;
    setState((prev) => ({
      ...prev,
      priceSeries: normalizeSeries(active),
      chartCandles: toTradeCandles(active),
    }));
  }, [interval]);

  return useMemo(() => {
    const mismatched = state.dataSymbol != null && state.dataSymbol !== symbol;
    const core: LiveTradeState = mismatched
      ? {
          loadingInterval: true,
          mode: state.mode,
          connection: state.connection,
          dataSymbol: state.dataSymbol,
        }
      : state;
    return {
      ...core,
      lastPriceRef,
      tickSnapshotRef,
    };
  }, [state, symbol]);
}
