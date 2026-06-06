import { describe, expect, it } from 'vitest';
import {
  exchangeLinearLegStillOpen,
  pollUntilExchangeLinearLegClosed,
} from '@/lib/exchangePositionSync';
import type { ExchangeSnapshot } from '@/types/integrations';

function mexcSnap(positions: ExchangeSnapshot['positions']): ExchangeSnapshot[] {
  return [{ exchange: 'mexc', status: 'connected', balances: [], positions }];
}

describe('exchangeLinearLegStillOpen', () => {
  it('detects open MEXC leg by symbol and side', () => {
    const snaps = mexcSnap([{ symbol: 'BTCUSDT', side: 'long', size: 0.01, entryPrice: 100_000 }]);
    expect(exchangeLinearLegStillOpen(snaps, 'mexc', 'BTCUSDT', 'long')).toBe(true);
    expect(exchangeLinearLegStillOpen(snaps, 'mexc', 'BTCUSDT', 'short')).toBe(false);
  });

  it('returns false when flat', () => {
    const snaps = mexcSnap([]);
    expect(exchangeLinearLegStillOpen(snaps, 'mexc', 'BTCUSDT', 'long')).toBe(false);
  });
});

describe('pollUntilExchangeLinearLegClosed', () => {
  it('resolves when leg drops off snapshot', async () => {
    let pass = 0;
    const refresh = async () => {
      pass += 1;
      return pass < 3
        ? mexcSnap([{ symbol: 'ETHUSDT', side: 'short', size: 1, entryPrice: 3000 }])
        : mexcSnap([]);
    };
    const result = await pollUntilExchangeLinearLegClosed(
      refresh,
      'mexc',
      'ETHUSDT',
      'short',
      0,
      { deadlineMs: 5000, intervalMs: 10 },
    );
    expect(result.closed).toBe(true);
    expect(pass).toBeGreaterThanOrEqual(3);
  });
});
