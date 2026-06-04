import { createAdapter } from './exchange-registry';
import type { ExchangeId, MarketDataAdapter } from './market-data-interface';

const DEFAULT_EXCHANGE: ExchangeId = 'bybit';

class ExchangeManager {
  private _activeId: ExchangeId = DEFAULT_EXCHANGE;
  private _adapter: MarketDataAdapter = createAdapter(DEFAULT_EXCHANGE);

  get activeId(): ExchangeId {
    return this._activeId;
  }

  get current(): MarketDataAdapter {
    return this._adapter;
  }

  /**
   * Hot-swap the active exchange.
   *
   * Disconnects the current WebSocket, clears the adapter,
   * then mounts the new one. Call `connectWebSocket` separately
   * after switching to restore subscriptions.
   */
  switchExchange(id: ExchangeId): void {
    if (id === this._activeId) return;

    console.info(`[ExchangeManager] switching ${this._activeId} → ${id}`);

    const adapter = createAdapter(id);
    this._adapter.disconnectWebSocket();
    this._adapter = adapter;
    this._activeId = id;
  }
}

export const exchangeManager = new ExchangeManager();
