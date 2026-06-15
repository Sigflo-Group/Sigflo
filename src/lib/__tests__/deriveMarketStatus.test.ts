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

  it('does not promote ready state via score and stale triggerType alone', () => {
    expect(
      deriveMarketStatus(
        shell({ timingState: 'ready', setupScore: 80, triggerType: 'breakout_first_close' }),
      ),
    ).toBe('developing');
  });
});
