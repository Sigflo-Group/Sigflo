import { MexcWsClient } from '@/lib/mexcWsClient';
import {
  fetchTradablePerpSymbols as mexcFetchTradablePerpSymbols,
  fetchTickers as mexcFetchTickers,
  rankLiquidUniverse as mexcRankLiquidUniverse,
  fetchMexcKlines,
} from '@/services/mexc/publicClient';
import type { Candle, KlineInterval, SymbolTicker, SymbolUniverseItem } from '@/types/market';
import type {
  MarketDataAdapter,
  MarketDataCapabilities,
  WsSubscriptionOptions,
} from '@/core/market-data-interface';

export class MexcMarketDataAdapter implements MarketDataAdapter {
  readonly exchangeId = 'mexc' as const;
  readonly capabilities: MarketDataCapabilities = {
    linearPerps: true,
    spot: false,
    publicTrades: true,
  };

  private wsClient: MexcWsClient | null = null;
  /** Cached previous candle data per symbol:interval - used to emit confirmed candles
   *  on transition to a new candle, since MEXC WS does not provide a confirm flag. */
  private prevKlineData = new Map<
    string,
    { start: number; open: number; high: number; low: number; close: number; volume: number }
  >();

  fetchKlines(symbol: string, interval: KlineInterval, limit = 200): Promise<Candle[]> {
    return fetchMexcKlines(symbol, interval, limit);
  }

  fetchTickers(symbols?: string[]): Promise<SymbolTicker[]> {
    return mexcFetchTickers(symbols);
  }

  fetchTradablePerpSymbols(): Promise<string[]> {
    return mexcFetchTradablePerpSymbols();
  }

  rankLiquidUniverse(tickers: SymbolTicker[], minCount: number, maxCount: number): SymbolUniverseItem[] {
    return mexcRankLiquidUniverse(tickers, minCount, maxCount);
  }

  connectWebSocket(options: WsSubscriptionOptions): void {
    this.disconnectWebSocket();
    this.prevKlineData.clear();

    this.wsClient = new MexcWsClient({
      klineSymbols: options.klineSymbols,
      tickerSymbols: options.tickerSymbols,
      klineIntervals: options.klineIntervals as Array<'1' | '5' | '15' | '60' | '240' | 'D' | 'W'> | undefined,
      includeTickers: options.includeTickers,
      includePublicTrades: options.includePublicTrades,
      onLog: options.onLog,
      onConnectionChange: options.onConnectionChange,

      onKline: options.onKline
        ? (kline) => {
            const key = `${kline.symbol}:${kline.interval}`;
            const prev = this.prevKlineData.get(key);
            const isTransition = prev != null && kline.start !== prev.start;

            if (isTransition) {
              // Emit the previous candle as confirmed using its cached data.
              options.onKline!({
                symbol: kline.symbol,
                interval: kline.interval as KlineInterval,
                ts: prev.start,
                open: prev.open,
                high: prev.high,
                low: prev.low,
                close: prev.close,
                volume: prev.volume,
                confirmed: true,
              });
            }

            // Cache current kline data for future transition detection.
            this.prevKlineData.set(key, {
              start: kline.start,
              open: kline.open,
              high: kline.high,
              low: kline.low,
              close: kline.close,
              volume: kline.volume,
            });

            options.onKline!({
              symbol: kline.symbol,
              interval: kline.interval as KlineInterval,
              ts: kline.start,
              open: kline.open,
              high: kline.high,
              low: kline.low,
              close: kline.close,
              volume: kline.volume,
              confirmed: false,
            });
          }
        : undefined,

      onTicker: options.onTicker
        ? (ticker) => {
            options.onTicker!({
              symbol: ticker.symbol,
              lastPrice: ticker.lastPrice,
              markPrice: ticker.markPrice,
              indexPrice: undefined,
              high24h: ticker.high24h,
              low24h: ticker.low24h,
              volume24h: ticker.volume24h,
              turnover24h: ticker.turnover24h,
              price24hPcnt: ticker.price24hPcnt,
            });
          }
        : undefined,

      onPublicTrade: options.onPublicTrade
        ? (trade) => {
            options.onPublicTrade!({ symbol: trade.symbol, price: trade.price, ts: trade.ts });
          }
        : undefined,
    });

    this.wsClient.connect();
  }

  disconnectWebSocket(): void {
    this.wsClient?.disconnect();
    this.wsClient = null;
  }

  updateTickerSymbols(symbols: string[]): void {
    this.wsClient?.updateTickerSymbols(symbols);
  }

  updateKlineSymbols(symbols: string[]): void {
    this.wsClient?.updateKlineSymbols(symbols);
  }
}
