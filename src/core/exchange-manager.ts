import { createAdapter } from './exchange-registry';
import type { ExchangeId, MarketDataAdapter } from './market-data-interface';

const DEFAULT_EXCHANGE: ExchangeId = 'bybit';

type ExchangeSwitchListener = (id: ExchangeId) => void;
type ReconnectHook = () => void;

class ExchangeManager {
  private _activeId: ExchangeId = DEFAULT_EXCHANGE;
  private _adapter: MarketDataAdapter = createAdapter(DEFAULT_EXCHANGE);
  private listeners = new Set<ExchangeSwitchListener>();
  private reconnectHook: ReconnectHook | null = null;

  get activeId(): ExchangeId {
    return this._activeId;
  }

  get current(): MarketDataAdapter {
    return this._adapter;
  }

  /** Signal engine registers this to reconnect WS after a venue switch. */
  setReconnectHook(fn: ReconnectHook | null): void {
    this.reconnectHook = fn;
  }

  subscribe(listener: ExchangeSwitchListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Hot-swap the active exchange.
   *
   * Disconnects the current WebSocket, clears the adapter,
   * then mounts the new one. The signal engine reconnect hook
   * restores subscriptions when registered.
   */
  switchExchange(id: ExchangeId): void {
    if (id === this._activeId) return;

    console.info(`[ExchangeManager] switching ${this._activeId} → ${id}`);

    this._adapter.disconnectWebSocket();
    this._adapter = createAdapter(id);
    this._activeId = id;

    for (const listener of this.listeners) {
      listener(id);
    }
    this.reconnectHook?.();
  }
}

export const exchangeManager = new ExchangeManager();
