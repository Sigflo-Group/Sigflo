/**
 * Regression tests for the RSI-extremity direction bug: `derivePosture` and
 * `deriveChaseRisk` used a long-only "high RSI = danger" check, so a short
 * setup sitting at an exhausted low RSI (the actual danger zone for shorts)
 * was labeled as a safe, low-risk "clean entry" instead of stretched/high-risk.
 */

import { describe, it, expect } from 'vitest';
import { interpretSignal } from '@/lib/signalInterpretation';
import type { CryptoSignal } from '@/types/signal';

function makeSignal(overrides: Partial<CryptoSignal> = {}): CryptoSignal {
  return {
    id: 'sig-1',
    pair: 'BTCUSDT',
    side: 'long',
    biasLabel: 'Potential Long',
    setupScore: 60,
    setupScoreLabel: 'Moderate setup',
    setupType: 'breakout',
    scoreBreakdown: {
      trendAlignment: 15,
      momentumQuality: 12,
      structureQuality: 15,
      volumeConfirmation: 10,
      riskConditions: 8,
    },
    riskTag: 'Medium Risk',
    setupTags: ['Breakout'],
    exchange: 'bybit',
    postedAgo: '2m ago',
    aiExplanation: '',
    whyThisMatters: '',
    facts: {},
    ...overrides,
  };
}

describe('interpretSignal — RSI direction awareness', () => {
  it('flags a triggered short at exhausted-low RSI as stretched, high-risk, avoid', () => {
    const shortSignal = makeSignal({
      side: 'short',
      setupType: 'breakout',
      facts: { rsi: 25 },
    });

    const interpretation = interpretSignal(shortSignal, 'triggered');

    expect(interpretation.posture).toBe('trend_stretched');
    expect(interpretation.chaseRisk).toBe('high');
    expect(interpretation.patience).toBe('avoid');
  });

  it('does not flag a triggered short at healthy RSI as stretched', () => {
    const shortSignal = makeSignal({
      side: 'short',
      setupType: 'breakout',
      facts: { rsi: 40 },
    });

    const interpretation = interpretSignal(shortSignal, 'triggered');

    expect(interpretation.posture).toBe('breakout_active');
    expect(interpretation.chaseRisk).toBe('low');
  });

  it('still flags a triggered long at overheated-high RSI as stretched, high-risk', () => {
    const longSignal = makeSignal({
      side: 'long',
      setupType: 'breakout',
      facts: { rsi: 80 },
    });

    const interpretation = interpretSignal(longSignal, 'triggered');

    expect(interpretation.posture).toBe('trend_stretched');
    expect(interpretation.chaseRisk).toBe('high');
    expect(interpretation.patience).toBe('avoid');
  });

  it('a short at moderately low RSI (35) reads moderate chase risk, mirroring the long side', () => {
    const shortSignal = makeSignal({
      side: 'short',
      setupType: 'breakout',
      facts: { rsi: 34 },
    });

    const interpretation = interpretSignal(shortSignal, 'developing');

    expect(interpretation.chaseRisk).toBe('moderate');
  });
});
