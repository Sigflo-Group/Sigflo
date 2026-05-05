import type { Direction, OpportunityState } from './botSystem';

export type StrategyType = 'Breakout' | 'Reversal' | 'Momentum' | 'TrendPullback';

export type DetectorOutput = {
  id: string;
  pair: string;
  direction: Direction;
  strategyType: StrategyType;
  setupType: string;
  state: OpportunityState;
  score: number;
  /** True when structural trigger conditions fired (used for Triggered state). */
  hasTrigger?: boolean;
  thesis: string;
  rationale: string;
  entryZone: string;
  invalidation: string;
  targets: string[];
  timeframeAlignment: string[];
  freshnessSec: number;
  riskLabel: 'Low' | 'Medium' | 'High';
  sourceEngine: 'Nova' | 'Rio' | 'Pulse' | 'Guard';
};
