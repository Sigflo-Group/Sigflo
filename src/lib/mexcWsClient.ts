type WsTopicInterval = '1' | '5' | '15' | '60' | '240' | 'D' | 'W';
type WsConnection = 'connected' | 'reconnecting' | 'disconnected';

export type MexcWsKline = {
  symbol: string;
  interval: WsTopicInterval;
  start: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
};

export type MexcWsTicker = {
  symbol: string;
  lastPrice: number;
  markPrice: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  turnover24h: number;
  price24hPcnt: number;
};

export type MexcWsPublicTrade = {
  symbol: string;
  price: number;
  ts: number;
};

export type MexcWsClientOptions = {
  klineSymbols?: string[];
  tickerSymbols?: string[];
  klineIntervals?: WsTopicInterval[];
  includeTickers?: boolean;
  includePublicTrades?: boolean;
  onKline?: (kline: MexcWsKline) => void;
  onTicker?: (ticker: MexcWsTicker) => void;
  onPublicTrade?: (trade: MexcWsPublicTrade) => void;
  onConnectionChange?: (state: WsConnection) => void;
  onLog?: (msg: string) => void;
};

const WS_URL = 'wss://contract.mexc.com/edge';

const INTERVAL_MAP: Record<string, string> = {
  '1': 'Min1', '5': 'Min5', '15': 'Min15',
  '60': 'Min60', '240': 'Hour4', D: 'Day1', W: 'Week1',
};

const REVERSE_INTERVAL_MAP: Record<string, WsTopicInterval> = {
  Min1: '1', Min5: '5', Min15: '15',
  Min60: '60', Hour4: '240', Day1: 'D', Week1: 'W',
};

function toMexcSymbol(sym: string): string {
  return sym.endsWith('USDT') ? sym.slice(0, -4) + '_USDT' : sym;
}

function fromMexcSymbol(sym: string): string {
  return sym.replace(/_/g, '');
}

function toNum(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return Number(v);
  return 0;
}

export class MexcWsClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private reconnectAttempt = 0;
  private running = false;
  private readonly options: MexcWsClientOptions;
  private readonly klineSymbols: string[];

  constructor(options: MexcWsClientOptions) {
    this.options = options;
    const kline = options.klineSymbols;
    if (!kline || kline.length === 0) {
      throw new Error('MexcWsClient: provide klineSymbols');
    }
    this.klineSymbols = [...kline];
  }

  // MEXC `sub.tickers` pushes ALL tickers — no per-symbol subscribe/unsubscribe needed.
  // This is a no-op to match the adapter interface.
  updateTickerSymbols(_next: string[]) {
  }

  connect() {
    this.running = true;
    this.openSocket();
  }

  disconnect() {
    this.running = false;
    if (this.reconnectTimer != null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.options.onConnectionChange?.('disconnected');
    this.ws?.close();
    this.ws = null;
  }

  private log(msg: string) {
    this.options.onLog?.(msg);
  }

  private openSocket() {
    this.log('[MEXC WS] connecting');
    const ws = new WebSocket(WS_URL);
    this.ws = ws;

    ws.onopen = () => {
      this.reconnectAttempt = 0;
      this.options.onConnectionChange?.('connected');
      this.log('[MEXC WS] connected');
      this.subscribe();
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(String(event.data)) as Record<string, unknown>;
        if (msg.ping != null) {
          ws.send(JSON.stringify({ pong: msg.ping }));
          return;
        }
        const channel = String(msg.channel ?? '');
        const data = msg.data;
        if (!channel || data == null) return;
        if (channel === 'push.kline') this.handleKline(data);
        else if (channel === 'push.tickers') this.handleTickers(data);
        else if (channel === 'push.deal') this.handleDeal(data, msg);
      } catch {
        // Ignore malformed payloads.
      }
    };

    ws.onclose = () => {
      this.ws = null;
      if (!this.running) return;
      this.options.onConnectionChange?.('reconnecting');
      this.reconnectAttempt += 1;
      const wait = Math.min(30_000, 1_000 * 2 ** Math.min(5, this.reconnectAttempt));
      this.log(`[MEXC WS] reconnect attempt ${this.reconnectAttempt} in ${wait}ms`);
      this.reconnectTimer = window.setTimeout(() => this.openSocket(), wait);
    };

    ws.onerror = () => {
      this.log('[MEXC WS] error');
    };
  }

  private subscribe() {
    if (!this.ws) return;
    const intervals = this.options.klineIntervals ?? ['5', '15'];
    for (const sym of this.klineSymbols) {
      const msym = toMexcSymbol(sym);
      for (const i of intervals) {
        this.ws.send(JSON.stringify({
          method: 'sub.kline',
          param: { symbol: msym, interval: INTERVAL_MAP[i] ?? 'Min15' },
        }));
      }
      if (this.options.includePublicTrades) {
        this.ws.send(JSON.stringify({
          method: 'sub.deal',
          param: { symbol: msym },
        }));
      }
    }
    if (this.options.includeTickers) {
      this.ws.send(JSON.stringify({ method: 'sub.tickers', param: {} }));
    }
    this.log('[MEXC WS] subscriptions sent');
  }

  private handleKline(data: unknown) {
    const row = data as Record<string, unknown> | undefined;
    if (!row) return;
    const rawSymbol = String(row.symbol ?? '');
    const rawInterval = String(row.interval ?? '');
    if (!rawSymbol || !rawInterval) return;
    const symbol = fromMexcSymbol(rawSymbol);
    const interval = REVERSE_INTERVAL_MAP[rawInterval] ?? '15';
    const rawT = toNum(row.t);
    const start = rawT < 1e12 ? rawT * 1000 : rawT;
    this.options.onKline?.({
      symbol,
      interval,
      start,
      open: toNum(row.o),
      high: toNum(row.h),
      low: toNum(row.l),
      close: toNum(row.c),
      volume: toNum(row.q),
      timestamp: start,
    });
  }

  private handleTickers(data: unknown) {
    const rows = Array.isArray(data) ? (data as Array<Record<string, unknown>>) : [];
    for (const row of rows) {
      const rawSymbol = String(row.symbol ?? '');
      if (!rawSymbol) continue;
      const symbol = fromMexcSymbol(rawSymbol);
      const markPx = toNum(row.fairPrice);
      this.options.onTicker?.({
        symbol,
        lastPrice: toNum(row.lastPrice),
        markPrice: Number.isFinite(markPx) && markPx > 0 ? markPx : 0,
        high24h: toNum(row.high24Price),
        low24h: toNum(row.lower24Price),
        volume24h: toNum(row.volume24),
        turnover24h: toNum(row.amount24),
        price24hPcnt: toNum(row.riseFallRate),
      });
    }
  }

  private handleDeal(data: unknown, msg: Record<string, unknown>) {
    const rows = Array.isArray(data) ? (data as Array<Record<string, unknown>>) : [];
    if (rows.length === 0) return;
    const last = rows[rows.length - 1];
    const price = toNum(last.p);
    if (!(price > 0)) return;
    const ts = toNum(last.t);
    const rawSymbol = String(msg.symbol ?? '');
    const symbol = rawSymbol ? fromMexcSymbol(rawSymbol) : '';
    if (!symbol) return;
    this.options.onPublicTrade?.({ symbol, price, ts });
  }
}
