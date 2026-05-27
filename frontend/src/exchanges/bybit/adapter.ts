import { BybitWsClient } from '@/lib/bybitWsClient';
import {
  fetchKlines as bybitFetchKlines,
  fetchTickers as bybitFetchTickers,
  fetchTradablePerpSymbols as bybitFetchTradablePerpSymbols,
  rankLiquidUniverse as bybitRankLiquidUniverse,
} from '@/services/bybit/client';
import type { Candle, KlineInterval, SymbolTicker, SymbolUniverseItem } from '@/types/market';
import type {
  MarketDataAdapter,
  MarketDataCapabilities,
  NormalizedKline,
  WsSubscriptionOptions,
} from '@/core/market-data-interface';

export class BybitMarketDataAdapter implements MarketDataAdapter {
  readonly exchangeId = 'bybit' as const;
  readonly capabilities: MarketDataCapabilities = {
    linearPerps: true,
    spot: true,
    publicTrades: true,
  };

  private wsClient: BybitWsClient | null = null;

  fetchKlines(symbol: string, interval: KlineInterval, limit = 200): Promise<Candle[]> {
    return bybitFetchKlines(symbol, interval, limit);
  }

  fetchTickers(symbols?: string[]): Promise<SymbolTicker[]> {
    return bybitFetchTickers(symbols);
  }

  fetchTradablePerpSymbols(): Promise<string[]> {
    return bybitFetchTradablePerpSymbols();
  }

  rankLiquidUniverse(tickers: SymbolTicker[], minCount: number, maxCount: number): SymbolUniverseItem[] {
    return bybitRankLiquidUniverse(tickers, minCount, maxCount);
  }

  connectWebSocket(options: WsSubscriptionOptions): void {
    this.disconnectWebSocket();

    this.wsClient = new BybitWsClient({
      klineSymbols: options.klineSymbols,
      tickerSymbols: options.tickerSymbols,
      klineIntervals: options.klineIntervals as Array<'1' | '5' | '15' | '60' | '240' | 'D' | 'W'> | undefined,
      includeTickers: options.includeTickers,
      includePublicTrades: options.includePublicTrades,
      onLog: options.onLog,
      onConnectionChange: options.onConnectionChange,

      onKline: options.onKline
        ? (kline) => {
            const normalized: NormalizedKline = {
              symbol: kline.symbol,
              interval: kline.interval as KlineInterval,
              ts: kline.start,
              open: kline.open,
              high: kline.high,
              low: kline.low,
              close: kline.close,
              volume: kline.volume,
              confirmed: kline.confirm,
            };
            options.onKline!(normalized);
          }
        : undefined,

      onTicker: options.onTicker
        ? (ticker) => {
            options.onTicker!({
              symbol: ticker.symbol,
              lastPrice: ticker.lastPrice,
              markPrice: ticker.markPrice,
              indexPrice: ticker.indexPrice,
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
}
