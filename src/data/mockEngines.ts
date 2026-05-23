import type { CryptoSignal, SignalSetupType } from '@/types/signal';
import type { EngineStatusModel } from '@/types/botSystem';

const ENGINE_DEFS: { engineId: string; engineName: string; strategyType: string; setupTypes: SignalSetupType[]; defaultMode: 'Balanced' | 'Defensive' | 'Aggressive' }[] = [
  { engineId: 'eng-nova', engineName: 'Nova', strategyType: 'Breakout Engine', setupTypes: ['breakout'], defaultMode: 'Balanced' },
  { engineId: 'eng-rio', engineName: 'Rio', strategyType: 'Reversal Engine', setupTypes: ['overextended'], defaultMode: 'Defensive' },
  { engineId: 'eng-pulse', engineName: 'Pulse', strategyType: 'Momentum Engine', setupTypes: ['pullback'], defaultMode: 'Aggressive' },
  { engineId: 'eng-guard', engineName: 'Guard', strategyType: 'Risk Engine', setupTypes: [], defaultMode: 'Defensive' },
];

export function deriveEnginesFromSignals(signals: CryptoSignal[]): EngineStatusModel[] {
  return ENGINE_DEFS.map((def) => {
    const scoped = def.setupTypes.length > 0
      ? signals.filter((s) => def.setupTypes.includes(s.setupType))
      : signals;
    const triggered = scoped.filter((s) => s.signalLifecycleStage === 'active' || s.signalLifecycleStage === 'completed');
    const candidates = scoped.filter((s) => s.setupScore >= 55);
    const pairs = new Set(scoped.map((s) => s.pair));
    const top = candidates[0];

    return {
      engineId: def.engineId,
      engineName: def.engineName,
      strategyType: def.strategyType,
      mode: def.defaultMode,
      pairsWatched: pairs.size,
      state: triggered.length > 0 ? 'ManagingTrade' : 'Enabled',
      liveCandidates: candidates.length,
      activePositions: triggered.length,
      latestOutput: top
        ? `${top.pair} — score ${top.setupScore} (${top.setupType})`
        : 'Scanning for setups',
      health: triggered.length > 3 ? 'Degraded' : 'Healthy',
    };
  });
}

export const mockEngines: EngineStatusModel[] = [];
