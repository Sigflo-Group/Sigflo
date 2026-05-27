import type { SignalLifecycleStage, SignalSetupType, SignalSide } from '@/types/signal';
import type { RegimeKind, RegimeTransitionPressures } from '@/types/regimePredictor';

/**
 * Immutable, append-only record of observable AI/engine state for telemetry and Trade Replay.
 * Written only by the snapshot logger — never mutated in place after persist.
 */
export type AiStateSnapshot = {
  timestamp: number;
  symbol: string;
  timeframe: '15m';
  price: number;
  bias: SignalSide | 'neutral';
  confidence: number;
  setupType: SignalSetupType | 'none';
  marketRegime: 'trend' | 'range' | 'volatile' | 'compression';
  momentumState: 'strengthening' | 'weakening' | 'flat';
  volatilityState: 'expanding' | 'contracting';
  signalLifecycleStage: SignalLifecycleStage;
  keyReasons: string[];
  riskNotes: string[];
  invalidationLevel: number;
  /** CryptoSignal.id when emitted, else lifecycle event id, else empty for ambient-only samples. */
  activeSignalId: string;
  /** Read-only regime transition context captured alongside engine state. */
  regimePredictor?: {
    currentRegime: RegimeKind;
    regimeStability: number;
    shiftProbability: number;
    likelyNextRegime: RegimeKind | null;
    earlyWarningSignals: string[];
    transitionPressures: RegimeTransitionPressures;
  };
};

export type AiSnapshotStore = {
  version: 1;
  /** Time-ordered snapshots per series key (signal id or ambient key). */
  series: Record<string, AiStateSnapshot[]>;
  /**
   * Last semantic fingerprint per series (excludes price). Telemetry-only; not shown in replay UI.
   * Used to avoid duplicate snapshots when the engine ticks without meaningful state change.
   */
  _fp?: Record<string, string>;
};
