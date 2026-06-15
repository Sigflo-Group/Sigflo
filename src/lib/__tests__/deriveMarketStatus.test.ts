import { describe, it, expect } from 'vitest';
import { deriveMarketStatus } from '@/lib/marketScannerRows';
import type { CryptoSignal } from '@/types/signal';

function shell(partial: Partial<CryptoSignal>): CryptoSignal {
  return {
    id: 'test',
    pair: 'BTC',
    side: 'long',
    biasLabel: 'Test',
    setupType: 'breakout',
    setupScore: 72,
    setupScoreLabel: 'Strong',
    setupTags: [],
    exchange: 'Bybit',
    postedAgo: 'Live',
    ...partial,
  } as CryptoSignal;
}

describe('deriveMarketStatus', () => {
  it('maps lifecycle triggered before overextended setup type', () => {
    expect(
      deriveMarketStatus(
        shell({ setupType: 'overextended', timingState: 'triggered', triggerType: 'mean_reversion_cooling' }),
      ),
    ).toBe('triggered');
  });

  it('maps ready with confirmed trigger to triggered in UI', () => {
    expect(
      deriveMarketStatus(
        shell({ timingState: 'ready', setupScore: 80, triggerType: 'breakout_first_close' }),
      ),
    ).toBe('triggered');
  });

  it('keeps ready without trigger metadata as developing', () => {
    expect(
      deriveMarketStatus(
        shell({ timingState: 'ready', setupScore: 80, triggerType: 'unknown' }),
      ),
    ).toBe('developing');
  });
});
