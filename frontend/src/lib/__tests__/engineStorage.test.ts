import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadMarketMemoryStore,
  persistMarketMemoryStore,
  loadSignalLifecycleStore,
  persistSignalLifecycleStore,
  loadUserAdaptationStore,
  persistUserAdaptationStore,
  loadProIntelligencePrefs,
  persistProIntelligencePrefs,
  loadLifecycleRef,
  persistLifecycleRef,
  MARKET_MEMORY_STORE_KEY,
  SIGNAL_LIFECYCLE_STORE_KEY,
  PRO_INTELLIGENCE_PREFS_KEY,
  LIFECYCLE_REF_STORE_KEY,
} from '@/lib/engineStorage';
import type { MarketMemorySnapshot } from '@/lib/marketMemory';
import type { UserAdaptationStore } from '@/lib/userAdaptation';

const mockStore = new Map<string, string>();

beforeEach(() => {
  mockStore.clear();
  globalThis.localStorage = {
    getItem: (key: string) => mockStore.get(key) ?? null,
    setItem: (key: string, value: string) => { mockStore.set(key, value); },
    removeItem: (key: string) => { mockStore.delete(key); },
    clear: () => mockStore.clear(),
    get length() { return mockStore.size; },
    key: (index: number) => [...mockStore.keys()][index] ?? null,
  } as Storage;
});

function makeMarketMemory(overrides: Partial<MarketMemorySnapshot> = {}): MarketMemorySnapshot {
  return {
    symbol: 'BTCUSDT',
    updatedAt: Date.now(),
    regime: 'trend',
    dominantBias: 'bullish',
    momentumState: 'strengthening',
    volatilityState: 'expanding',
    breakoutStatus: 'none',
    breakoutAttempts: 0,
    failedBreakoutsRecent: 0,
    failedContinuationAttempts: 0,
    shortTermBiasScore: 0,
    mediumTermBiasScore: 0,
    structuralMemoryScore: 0,
    recentSignals: [],
    keyLevels: [],
    lifecycleStage: 'emerging',
    ...overrides,
  };
}

describe('market memory store', () => {
  it('returns empty object when nothing is stored', () => {
    expect(loadMarketMemoryStore()).toEqual({});
  });

  it('round-trips a simple value', () => {
    const store: Record<string, MarketMemorySnapshot> = { BTCUSDT: makeMarketMemory({ regime: 'trend' }) };
    persistMarketMemoryStore(store);
    const loaded = loadMarketMemoryStore();
    expect(loaded.BTCUSDT?.regime).toBe('trend');
  });

  it('returns empty object for corrupted JSON', () => {
    localStorage.setItem(MARKET_MEMORY_STORE_KEY, '{broken');
    expect(loadMarketMemoryStore()).toEqual({});
  });
});

describe('signal lifecycle store', () => {
  it('returns empty tracker when nothing is stored', () => {
    const store = loadSignalLifecycleStore();
    expect(store.events).toEqual([]);
    expect(store.feedbackBySymbolSetup).toEqual({});
    expect(store.generatedInsights).toEqual([]);
  });

  it('round-trips events and insights', () => {
    const store = {
      events: [{ symbol: 'BTCUSDT', setupType: 'breakout', side: 'long' as const, ts: 1000, setupScore: 80 }],
      feedbackBySymbolSetup: {},
      generatedInsights: [{ symbol: 'BTCUSDT', insight: 'good signal', ts: 1000 }],
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    persistSignalLifecycleStore(store as any);
    const loaded = loadSignalLifecycleStore();
    expect(loaded.events).toHaveLength(1);
    expect(loaded.generatedInsights).toHaveLength(1);
  });

  it('filters non-array events gracefully', () => {
    localStorage.setItem(SIGNAL_LIFECYCLE_STORE_KEY, JSON.stringify({ events: 'bad', feedbackBySymbolSetup: null, generatedInsights: null }));
    const loaded = loadSignalLifecycleStore();
    expect(loaded.events).toEqual([]);
    expect(loaded.generatedInsights).toEqual([]);
  });
});

describe('user adaptation store', () => {
  it('returns empty store when nothing is stored', () => {
    const store = loadUserAdaptationStore();
    expect(store.generatedNotes).toEqual([]);
    expect(store.preferences).toBeDefined();
  });

  it('round-trips preferences', () => {
    const store: UserAdaptationStore = {
      impressions: 5,
      follows: 3,
      ignores: 2,
      bySetup: {
        breakout: { impressions: 3, follows: 2 },
        pullback: { impressions: 1, follows: 1 },
        overextended: { impressions: 1, follows: 0 },
      },
      byRisk: {
        low: { impressions: 0, follows: 0 },
        moderate: { impressions: 0, follows: 0 },
        high: { impressions: 0, follows: 0 },
      },
      lowConfidenceIgnores: 0,
      lowConfidenceImpressions: 0,
      counterTrendImpressions: 0,
      counterTrendFollows: 0,
      generatedNotes: [],
      preferences: {
        preferredRiskLevel: 'moderate',
        preferredSignalFrequency: 'medium',
        preferredTradeType: 'mixed',
        volatilityTolerance: 'medium',
        counterTrendTolerance: 'medium',
      },
    };
    persistUserAdaptationStore(store);
    const loaded = loadUserAdaptationStore();
    expect(loaded.bySetup.breakout.impressions).toBe(3);
    expect(loaded.preferences.preferredRiskLevel).toBe('moderate');
  });
});

describe('pro intelligence prefs', () => {
  it('returns defaults when nothing is stored', () => {
    const prefs = loadProIntelligencePrefs();
    expect(prefs.enabled).toBe(false);
    expect(prefs.layout).toBe('compact');
    expect(prefs.panelExpanded).toEqual({});
  });

  it('round-trips enabled state and layout', () => {
    persistProIntelligencePrefs({ enabled: true, layout: 'expanded', panelExpanded: { chart: true } });
    const loaded = loadProIntelligencePrefs();
    expect(loaded.enabled).toBe(true);
    expect(loaded.layout).toBe('expanded');
    expect(loaded.panelExpanded.chart).toBe(true);
  });

  it('falls back to defaults for corrupted data', () => {
    localStorage.setItem(PRO_INTELLIGENCE_PREFS_KEY, 'null');
    const prefs = loadProIntelligencePrefs();
    expect(prefs.enabled).toBe(false);
  });
});

describe('lifecycle ref store', () => {
  it('returns empty object when nothing is stored', () => {
    expect(loadLifecycleRef()).toEqual({});
  });

  it('round-trips lifecycle states', () => {
    const store: Record<string, { state: string; candlesSinceTrigger: number }> = {
      'BTCUSDT:breakout:long': { state: 'triggered', candlesSinceTrigger: 2 },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    persistLifecycleRef(store as any);
    const loaded = loadLifecycleRef();
    expect(loaded['BTCUSDT:breakout:long']).toBeDefined();
  });

  it('returns empty object for non-object JSON', () => {
    localStorage.setItem(LIFECYCLE_REF_STORE_KEY, '"string"');
    expect(loadLifecycleRef()).toEqual({});
  });
});
