import type { SignalSetupType } from '@/types/signal';

export type StrategyPersonalityMode =
  | 'conservative_structure'
  | 'balanced'
  | 'aggressive_momentum'
  | 'breakout_specialist'
  | 'swing_structure';

export type StrategyPersonalityProfile = {
  label: string;
  minConfidenceToEmit: number;
  confidenceAdjustment: number;
  breakoutBoost: number;
  pullbackBoost: number;
  overextendedPenalty: number;
  counterTrendPenalty: number;
  chopPenalty: number;
  weakVolumePenalty: number;
  cooldownMultiplier: number;
  tone: 'cautious' | 'neutral' | 'opportunity' | 'breakout' | 'macro';
};

export const STRATEGY_PERSONALITY_STORAGE_KEY = 'sigflo.strategyPersonalityMode.v1';
export const DEFAULT_STRATEGY_PERSONALITY_MODE: StrategyPersonalityMode = 'balanced';

export const STRATEGY_PERSONALITY_PROFILES: Record<StrategyPersonalityMode, StrategyPersonalityProfile> = {
  conservative_structure: {
    label: 'Conservative Structure',
    minConfidenceToEmit: 57,
    confidenceAdjustment: -5,
    breakoutBoost: -2,
    pullbackBoost: 2,
    overextendedPenalty: -6,
    counterTrendPenalty: 7,
    chopPenalty: 7,
    weakVolumePenalty: 6,
    cooldownMultiplier: 1.5,
    tone: 'cautious',
  },
  balanced: {
    label: 'Balanced',
    minConfidenceToEmit: 45,
    confidenceAdjustment: 0,
    breakoutBoost: 0,
    pullbackBoost: 0,
    overextendedPenalty: -1,
    counterTrendPenalty: 2,
    chopPenalty: 2,
    weakVolumePenalty: 2,
    cooldownMultiplier: 1,
    tone: 'neutral',
  },
  aggressive_momentum: {
    label: 'Aggressive Momentum',
    minConfidenceToEmit: 40,
    confidenceAdjustment: 4,
    breakoutBoost: 5,
    pullbackBoost: 1,
    overextendedPenalty: -1,
    counterTrendPenalty: 1,
    chopPenalty: 1,
    weakVolumePenalty: 1,
    cooldownMultiplier: 0.72,
    tone: 'opportunity',
  },
  breakout_specialist: {
    label: 'Breakout Specialist',
    minConfidenceToEmit: 44,
    confidenceAdjustment: 1,
    breakoutBoost: 7,
    pullbackBoost: -5,
    overextendedPenalty: -3,
    counterTrendPenalty: 2,
    chopPenalty: 1,
    weakVolumePenalty: 3,
    cooldownMultiplier: 0.9,
    tone: 'breakout',
  },
  swing_structure: {
    label: 'Swing Structure',
    minConfidenceToEmit: 53,
    confidenceAdjustment: -3,
    breakoutBoost: -1,
    pullbackBoost: 3,
    overextendedPenalty: -4,
    counterTrendPenalty: 5,
    chopPenalty: 6,
    weakVolumePenalty: 3,
    cooldownMultiplier: 1.35,
    tone: 'macro',
  },
};

export function parseStrategyPersonalityMode(raw: string | null): StrategyPersonalityMode {
  if (!raw) return DEFAULT_STRATEGY_PERSONALITY_MODE;
  if (raw in STRATEGY_PERSONALITY_PROFILES) return raw as StrategyPersonalityMode;
  return DEFAULT_STRATEGY_PERSONALITY_MODE;
}

export function loadStrategyPersonalityMode(): StrategyPersonalityMode {
  if (typeof window === 'undefined') return DEFAULT_STRATEGY_PERSONALITY_MODE;
  return parseStrategyPersonalityMode(window.localStorage.getItem(STRATEGY_PERSONALITY_STORAGE_KEY));
}

export function setupTypeBias(setupType: SignalSetupType, profile: StrategyPersonalityProfile): number {
  if (setupType === 'breakout') return profile.breakoutBoost;
  if (setupType === 'pullback') return profile.pullbackBoost;
  return profile.overextendedPenalty;
}

