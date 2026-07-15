import { describe, it, expect } from 'vitest';
import { buildManageTradeQueryFromLinearPosition } from '@/lib/tradeNavigation';
import { parseManageTradeContext } from '@/lib/manageTradeContext';
import type { PositionItem } from '@/types/integrations';

function basePosition(overrides: Partial<PositionItem> = {}): PositionItem {
  return {
    symbol: 'XAUUSDT',
    side: 'long',
    size: 0.664,
    entryPrice: 4039.9,
    ...overrides,
  };
}

describe('buildManageTradeQueryFromLinearPosition', () => {
  it('prefers the exchange-reported markPrice over a caller-supplied fallback', () => {
    // Regression: a symbol not tracked by Sigflo's internal live engine (e.g. a manually
    // opened XAU position) previously had the caller's synthetic ~100 fallback price win
    // over the real markPrice already present on the exchange position — corrupting both
    // the manage-mode chart display and the order-sizing math on re-entry into that screen.
    const pos = basePosition({ markPrice: 4041.1 });
    const query = buildManageTradeQueryFromLinearPosition(pos, { markPrice: 100 });
    const parsed = parseManageTradeContext(new URLSearchParams(query));
    expect(parsed?.markPrice).toBe(4041.1);
  });

  it('falls back to the caller-supplied markPrice when the exchange position has none', () => {
    const pos = basePosition({ markPrice: undefined });
    const query = buildManageTradeQueryFromLinearPosition(pos, { markPrice: 4041.1 });
    const parsed = parseManageTradeContext(new URLSearchParams(query));
    expect(parsed?.markPrice).toBe(4041.1);
  });

  it('falls back to entryPrice when neither the position nor the caller has a mark', () => {
    const pos = basePosition({ markPrice: undefined });
    const query = buildManageTradeQueryFromLinearPosition(pos);
    const parsed = parseManageTradeContext(new URLSearchParams(query));
    expect(parsed?.markPrice).toBe(4039.9);
    expect(parsed?.entryPrice).toBe(4039.9);
  });
});
