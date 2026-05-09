import type { DirectionalRiskLevel, SignalSetupType } from '@/types/signal';

export type UserPreferenceProfile = {
  preferredRiskLevel: DirectionalRiskLevel | 'mixed';
  preferredSignalFrequency: 'low' | 'medium' | 'high';
  preferredTradeType: SignalSetupType | 'mixed';
  volatilityTolerance: 'low' | 'medium' | 'high';
  counterTrendTolerance: 'low' | 'medium' | 'high';
};

export type UserAdaptationStore = {
  impressions: number;
  follows: number;
  ignores: number;
  bySetup: Record<SignalSetupType, { impressions: number; follows: number }>;
  byRisk: Record<DirectionalRiskLevel, { impressions: number; follows: number }>;
  lowConfidenceIgnores: number;
  lowConfidenceImpressions: number;
  counterTrendImpressions: number;
  counterTrendFollows: number;
  generatedNotes: string[];
  preferences: UserPreferenceProfile;
};

function defaultPreferences(): UserPreferenceProfile {
  return {
    preferredRiskLevel: 'mixed',
    preferredSignalFrequency: 'medium',
    preferredTradeType: 'mixed',
    volatilityTolerance: 'medium',
    counterTrendTolerance: 'medium',
  };
}

export function createEmptyUserAdaptationStore(): UserAdaptationStore {
  return {
    impressions: 0,
    follows: 0,
    ignores: 0,
    bySetup: {
      breakout: { impressions: 0, follows: 0 },
      pullback: { impressions: 0, follows: 0 },
      overextended: { impressions: 0, follows: 0 },
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
    preferences: defaultPreferences(),
  };
}

function recalcPreferences(store: UserAdaptationStore): UserPreferenceProfile {
  const riskRates = (Object.entries(store.byRisk) as Array<[DirectionalRiskLevel, { impressions: number; follows: number }]>)
    .map(([risk, v]) => [risk, v.impressions > 0 ? v.follows / v.impressions : 0] as const)
    .sort((a, b) => b[1] - a[1]);
  const setupRates = (Object.entries(store.bySetup) as Array<[SignalSetupType, { impressions: number; follows: number }]>)
    .map(([setup, v]) => [setup, v.impressions > 0 ? v.follows / v.impressions : 0] as const)
    .sort((a, b) => b[1] - a[1]);
  const followRate = store.impressions > 0 ? store.follows / store.impressions : 0;
  const counterTrendFollowRate =
    store.counterTrendImpressions > 0 ? store.counterTrendFollows / store.counterTrendImpressions : 0;
  return {
    preferredRiskLevel: riskRates[0] && riskRates[0][1] >= 0.46 ? riskRates[0][0] : 'mixed',
    preferredSignalFrequency: followRate < 0.22 ? 'low' : followRate > 0.48 ? 'high' : 'medium',
    preferredTradeType: setupRates[0] && setupRates[0][1] >= 0.44 ? setupRates[0][0] : 'mixed',
    volatilityTolerance:
      (store.byRisk.high.impressions > 0 ? store.byRisk.high.follows / store.byRisk.high.impressions : 0) > 0.4
        ? 'high'
        : (store.byRisk.low.impressions > 0 ? store.byRisk.low.follows / store.byRisk.low.impressions : 0) > 0.46
          ? 'low'
          : 'medium',
    counterTrendTolerance:
      counterTrendFollowRate < 0.2 ? 'low' : counterTrendFollowRate > 0.45 ? 'high' : 'medium',
  };
}

export function registerSignalImpression(
  store: UserAdaptationStore,
  input: { setupType: SignalSetupType; riskLevel: DirectionalRiskLevel; confidence: number; counterTrend: boolean },
): UserAdaptationStore {
  const next: UserAdaptationStore = {
    ...store,
    impressions: store.impressions + 1,
    bySetup: {
      ...store.bySetup,
      [input.setupType]: {
        ...store.bySetup[input.setupType],
        impressions: store.bySetup[input.setupType].impressions + 1,
      },
    },
    byRisk: {
      ...store.byRisk,
      [input.riskLevel]: {
        ...store.byRisk[input.riskLevel],
        impressions: store.byRisk[input.riskLevel].impressions + 1,
      },
    },
    lowConfidenceImpressions: store.lowConfidenceImpressions + (input.confidence < 60 ? 1 : 0),
    counterTrendImpressions: store.counterTrendImpressions + (input.counterTrend ? 1 : 0),
  };
  next.preferences = recalcPreferences(next);
  return next;
}

export function registerSignalFollow(
  store: UserAdaptationStore,
  input: { setupType: SignalSetupType; riskLevel: DirectionalRiskLevel; counterTrend: boolean },
): UserAdaptationStore {
  const next: UserAdaptationStore = {
    ...store,
    follows: store.follows + 1,
    bySetup: {
      ...store.bySetup,
      [input.setupType]: {
        ...store.bySetup[input.setupType],
        follows: store.bySetup[input.setupType].follows + 1,
      },
    },
    byRisk: {
      ...store.byRisk,
      [input.riskLevel]: {
        ...store.byRisk[input.riskLevel],
        follows: store.byRisk[input.riskLevel].follows + 1,
      },
    },
    counterTrendFollows: store.counterTrendFollows + (input.counterTrend ? 1 : 0),
  };
  next.preferences = recalcPreferences(next);
  return maybeAddNotes(next);
}

export function registerSignalIgnore(store: UserAdaptationStore, input: { confidence: number }): UserAdaptationStore {
  const next: UserAdaptationStore = {
    ...store,
    ignores: store.ignores + 1,
    lowConfidenceIgnores: store.lowConfidenceIgnores + (input.confidence < 60 ? 1 : 0),
  };
  next.preferences = recalcPreferences(next);
  return maybeAddNotes(next);
}

export function adaptationConfidenceAdjustment(store: UserAdaptationStore, setupType: SignalSetupType): number {
  const prefs = store.preferences;
  let delta = 0;
  if (prefs.preferredSignalFrequency === 'low') delta -= 3;
  if (prefs.preferredSignalFrequency === 'high') delta += 2;
  if (prefs.preferredTradeType !== 'mixed' && prefs.preferredTradeType === setupType) delta += 3;
  if (prefs.preferredTradeType !== 'mixed' && prefs.preferredTradeType !== setupType) delta -= 2;
  if (prefs.volatilityTolerance === 'low' && setupType === 'breakout') delta -= 2;
  return Math.max(-8, Math.min(6, delta));
}

function maybeAddNotes(store: UserAdaptationStore): UserAdaptationStore {
  const notes = [...store.generatedNotes];
  const lowConfidenceIgnoreRate =
    store.lowConfidenceImpressions > 0 ? store.lowConfidenceIgnores / store.lowConfidenceImpressions : 0;
  if (lowConfidenceIgnoreRate > 0.55) {
    notes.push('User consistently ignores low-confidence setups; weak-signal emphasis reduced.');
  }
  const breakout = store.bySetup.breakout;
  if (breakout.impressions >= 6 && breakout.follows / breakout.impressions > 0.55) {
    notes.push('User engagement favors breakout setups; breakout opportunities should be highlighted.');
  }
  if (store.counterTrendImpressions >= 5) {
    const rate = store.counterTrendFollows / Math.max(1, store.counterTrendImpressions);
    if (rate < 0.25) notes.push('User avoids counter-trend trades; conservative bias reinforcement applied.');
  }
  return {
    ...store,
    generatedNotes: notes.slice(-6),
  };
}

