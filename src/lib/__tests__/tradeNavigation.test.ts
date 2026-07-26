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
  it('prefers the caller-supplied markPrice over the exchange-reported one', () => {
    // Callers (TradeScreen's openManagePositionView, BotFocusScreen's navigateToTradeForExit)
    // deliberately pass a fresher live-tick price to beat pos.markPrice, which comes from a
    // slower REST poll (e.g. useAccountSnapshot's 12s cadence). That freshness must win —
    // untracked-symbol correctness is handled by the callers themselves, not by silently
    // overriding their choice here.
    const pos = basePosition({ markPrice: 4030 });
    const query = buildManageTradeQueryFromLinearPosition(pos, { markPrice: 4041.1 });
    const parsed = parseManageTradeContext(new URLSearchParams(query));
    expect(parsed?.markPrice).toBe(4041.1);
  });

  it('falls back to the exchange-reported markPrice when the caller has none', () => {
    const pos = basePosition({ markPrice: 4041.1 });
    const query = buildManageTradeQueryFromLinearPosition(pos);
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
