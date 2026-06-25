/**
 * engineBootstrap.ts
 *
 * REST backfill / bootstrap orchestration extracted from SignalEngineContext.
 * Functions here are async and drive the engine startup / reconnect sequence.
 * They mutate engine stores via the EngineStores bag (same pattern as enginePipeline.ts).
 */

import { exchangeManager } from '@/core/exchange-manager';
import { TRACKED_SYMBOLS } from '@/lib/marketScannerRows';
import { emptyIntervalCandles, upsertCandle } from '@/lib/engineUtils';
import {
  recomputeForSymbol,
  recomputeAllFromStore,
  pushEngineState,
  pipelineHealthCtx,
  type EngineStores,
  type PipelineCallbacks,
  type EngineMode,
} from '@/lib/enginePipeline';
import type { Candle } from '@/types/market';

const DEBUG = import.meta.env.DEV || !!(globalThis as Record<string, unknown>).__SIGFLO_DEBUG__;

export type PendingWSCandle = {
  symbol: string;
  interval: string;
  ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  confirmed: boolean;
};

export type BootstrapContext = {
  stores: EngineStores;
  callbacks: PipelineCallbacks;
  /** Whether this bootstrap run has been cancelled (component unmounted). */
  cancelledRef: { current: boolean };
  /** Monotonic generation counter — incremented on each new bootstrap call to detect stale runs. */
  backfillGenRef: { current: number };
  pendingWSCandlesRef: { current: PendingWSCandle[] };
};

// ---------------------------------------------------------------------------
// Low-level fetch helpers
// ---------------------------------------------------------------------------

async function fetchKlinesSafe(
  symbols: string[],
): Promise<Array<{ symbol: string; candles5m: Candle[]; candles15m: Candle[] }>> {
  const ok: Array<{ symbol: string; candles5m: Candle[]; candles15m: Candle[] }> = [];
  // Process symbols sequentially and fetch intervals sequentially per symbol.
  // Combined with the per-request throttle in the Bybit client this avoids
  // production rate-limiting on bootstrap.
  for (const symbol of symbols) {
    try {
      const candles5m = await exchangeManager.current.fetchKlines(symbol, '5', 240);
      const candles15m = await exchangeManager.current.fetchKlines(symbol, '15', 240);
      ok.push({ symbol, candles5m, candles15m });
    } catch (err) {
      // Always log kline backfill failures so we can see rate-limiting in production.
      console.warn('[Sigflo][Engine] skipped symbol kline backfill', symbol, err);
    }
  }
  return ok;
}

export async function ingestSymbolBackfill(
  ctx: BootstrapContext,
  symbols: string[],
): Promise<void> {
  if (symbols.length === 0) return;
  console.log('[Sigflo][Engine] ingestSymbolBackfill start', symbols);
  const [tickers, symbolResults] = await Promise.all([
    exchangeManager.current.fetchTickers(symbols),
    fetchKlinesSafe(symbols),
  ]);
  console.log('[Sigflo][Engine] ingestSymbolBackfill got', {
    tickers: tickers.length,
    klineResults: symbolResults.length,
  });
  for (const ticker of tickers) ctx.stores.tickersRef.current[ticker.symbol] = ticker;
  for (const { symbol, candles5m, candles15m } of symbolResults) {
    ctx.stores.candlesRef.current[symbol] = {
      ...emptyIntervalCandles(),
      ...ctx.stores.candlesRef.current[symbol],
      '5': candles5m,
      '15': candles15m,
    };
  }
}

// ---------------------------------------------------------------------------
// Bootstrap orchestration
// ---------------------------------------------------------------------------

export async function backfillFromRest(
  ctx: BootstrapContext,
  reason: 'startup' | 'reconnect',
): Promise<void> {
  const gen = ++ctx.backfillGenRef.current;
  if (DEBUG) console.log(`[Sigflo][Engine] REST bootstrap (${reason})`);
  ctx.stores.streamReadyRef.current = false;

  const finishBootstrap = (mode: EngineMode) => {
    if (gen !== ctx.backfillGenRef.current || ctx.cancelledRef.current) return;
    ctx.stores.streamReadyRef.current = true;
    const connection = ctx.stores.wsConnectedRef.current ? 'connected' : 'disconnected';
    console.log('[Sigflo][Engine] finishBootstrap', {
      reason,
      mode,
      gen,
      triggeredPairs: pipelineHealthCtx(ctx.stores, mode, connection).triggeredPairs.length,
    });
    const seenPending = new Set<string>();
    for (const pending of ctx.pendingWSCandlesRef.current) {
      if (pending.interval !== '15') continue;
      const key = `${pending.symbol}:${pending.ts}`;
      if (seenPending.has(key)) continue;
      seenPending.add(key);
      recomputeForSymbol(ctx.stores, ctx.callbacks, pending.symbol, 'WS');
    }
    ctx.pendingWSCandlesRef.current = [];
    ctx.callbacks.setLiveTickersBySymbol({ ...ctx.stores.tickersRef.current });
    pushEngineState(ctx.stores, ctx.callbacks, mode, connection);
  };

  try {
    const tracked = [...TRACKED_SYMBOLS];
    console.log('[Sigflo][Engine] bootstrap tracked symbols', tracked);
    const trackedSet = new Set<string>(tracked);
    await ingestSymbolBackfill(ctx, tracked);
    if (gen !== ctx.backfillGenRef.current || ctx.cancelledRef.current) return;

    // Apply any WS candles that arrived before backfill completed.
    for (const pending of ctx.pendingWSCandlesRef.current) {
      if (pending.interval !== '15') continue;
      const { symbol } = pending;
      if (!ctx.stores.candlesRef.current[symbol]) {
        ctx.stores.candlesRef.current[symbol] = emptyIntervalCandles();
      }
      ctx.stores.candlesRef.current[symbol]['15'] = upsertCandle(
        ctx.stores.candlesRef.current[symbol]['15'],
        {
          ts: pending.ts,
          open: pending.open,
          high: pending.high,
          low: pending.low,
          close: pending.close,
          volume: pending.volume,
          isClosed: pending.confirmed,
        },
      );
    }

    for (const symbol of tracked) {
      try {
        recomputeForSymbol(ctx.stores, ctx.callbacks, symbol, 'REST');
      } catch (recomputeErr) {
        console.error('[Sigflo][Engine] recomputeForSymbol failed', symbol, recomputeErr);
      }
    }

    const extras = ctx.callbacks.getKlineSymbols().filter((s) => !trackedSet.has(s));
    console.log('[Sigflo][Engine] bootstrap extras', extras);
    if (extras.length > 0) {
      await ingestSymbolBackfill(ctx, extras);
      if (gen !== ctx.backfillGenRef.current || ctx.cancelledRef.current) return;
      for (const symbol of extras) {
        try {
          recomputeForSymbol(ctx.stores, ctx.callbacks, symbol, 'REST');
        } catch (recomputeErr) {
          console.error('[Sigflo][Engine] recomputeForSymbol failed', symbol, recomputeErr);
        }
      }
    }

    recomputeAllFromStore(ctx.stores, ctx.callbacks, 'REST');
    finishBootstrap('REST');
  } catch (err) {
    if (gen !== ctx.backfillGenRef.current || ctx.cancelledRef.current) return;
    console.warn('[Sigflo][Engine] full bootstrap failed, retrying tracked only', err);
    try {
      await ingestSymbolBackfill(ctx, [...TRACKED_SYMBOLS]);
      if (gen !== ctx.backfillGenRef.current || ctx.cancelledRef.current) return;
      for (const symbol of TRACKED_SYMBOLS) {
        try {
          recomputeForSymbol(ctx.stores, ctx.callbacks, symbol, 'REST');
        } catch (recomputeErr) {
          console.error('[Sigflo][Engine] recomputeForSymbol failed', symbol, recomputeErr);
        }
      }
      recomputeAllFromStore(ctx.stores, ctx.callbacks, 'REST');
      finishBootstrap('REST');
    } catch (fallbackErr) {
      if (gen !== ctx.backfillGenRef.current || ctx.cancelledRef.current) return;
      pushEngineState(
        ctx.stores,
        ctx.callbacks,
        'OFFLINE',
        ctx.stores.wsConnectedRef.current ? 'reconnecting' : 'disconnected',
        fallbackErr instanceof Error ? fallbackErr.message : 'Signal engine failed',
      );
    }
  }
}

/** Backfill and compute new kline symbols that weren't in the initial bootstrap set. */
export async function backfillNewSymbols(
  ctx: BootstrapContext,
  symbols: string[],
): Promise<void> {
  if (symbols.length === 0) return;
  if (DEBUG) console.log('[Sigflo][Engine] backfill new kline symbols', symbols);
  try {
    const [tickers, symbolResults] = await Promise.all([
      exchangeManager.current.fetchTickers(symbols),
      fetchKlinesSafe(symbols),
    ]);
    if (ctx.cancelledRef.current) return;
    for (const ticker of tickers) ctx.stores.tickersRef.current[ticker.symbol] = ticker;
    for (const { symbol, candles5m, candles15m } of symbolResults) {
      ctx.stores.candlesRef.current[symbol] = {
        ...emptyIntervalCandles(),
        ...ctx.stores.candlesRef.current[symbol],
        '5': candles5m,
        '15': candles15m,
      };
    }
    const mode: EngineMode = ctx.stores.streamReadyRef.current ? 'WS' : 'REST';
    for (const symbol of symbols) {
      recomputeForSymbol(ctx.stores, ctx.callbacks, symbol, mode);
    }
    ctx.callbacks.setLiveTickersBySymbol({ ...ctx.stores.tickersRef.current });
    pushEngineState(
      ctx.stores,
      ctx.callbacks,
      mode,
      ctx.stores.wsConnectedRef.current ? 'connected' : 'disconnected',
    );
  } catch (err) {
    if (ctx.cancelledRef.current) return;
    if (DEBUG) console.warn('[Sigflo][Engine] backfill new symbols failed', err);
  }
}
