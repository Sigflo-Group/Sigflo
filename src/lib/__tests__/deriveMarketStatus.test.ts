import { describe, it, expect } from 'vitest';
import { deriveMarketStatus, isFeedActionableOpportunity } from '@/lib/marketScannerRows';
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

  it('shows overextended setups as developing once they reach ready, not stuck at overextended', () => {
    expect(
      deriveMarketStatus(
        shell({ setupType: 'overextended', timingState: 'ready', triggerType: 'unknown' }),
      ),
    ).toBe('developing');
    expect(
      deriveMarketStatus(
        shell({ setupType: 'overextended', timingState: 'developing', triggerType: 'unknown' }),
      ),
    ).toBe('developing');
  });

  it('keeps overextended label when there is no lifecycle progress yet (e.g. synthetic movers)', () => {
    expect(
      deriveMarketStatus(
        shell({ setupType: 'overextended', timingState: undefined, triggerType: undefined }),
      ),
    ).toBe('overextended');
  });
});

describe('isFeedActionableOpportunity', () => {
  it('excludes an overextended setup even once it has progressed to developing/triggered', () => {
    // Regression: deriveMarketStatus now reports 'developing'/'triggered' for an overextended
    // setup once it starts progressing, which would otherwise let a stretched/mean-reversion
    // entry slip into "Actionable" once its status stops literally reading 'overextended'.
    expect(
      isFeedActionableOpportunity(
        shell({ setupType: 'overextended', timingState: 'developing', setupScore: 80, triggerType: 'unknown' }),
      ),
    ).toBe(false);
    expect(
      isFeedActionableOpportunity(
        shell({ setupType: 'overextended', timingState: 'triggered', setupScore: 80, triggerType: 'mean_reversion_cooling' }),
      ),
    ).toBe(false);
  });

  it('still allows a non-overextended developing/triggered setup through the score gates', () => {
    expect(
      isFeedActionableOpportunity(
        shell({ setupType: 'breakout', timingState: 'developing', setupScore: 70, triggerType: 'unknown' }),
      ),
    ).toBe(true);
    expect(
      isFeedActionableOpportunity(
        shell({ setupType: 'breakout', timingState: 'ready', triggerType: 'breakout_first_close', setupScore: 45 }),
      ),
    ).toBe(true);
  });
});
