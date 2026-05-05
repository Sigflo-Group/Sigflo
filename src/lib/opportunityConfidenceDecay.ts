import { entryStatusFromOpportunityState } from '@/services/engine/opportunityNormalizer';
import type { OpportunityCardModel, OpportunityState } from '@/types/botSystem';

const STALE_SOFT_SEC = 120;
const STALE_HARD_SEC = 300;

/** Urgency ladder: one step down when freshness is elevated but not terminal. */
function downgradeOne(state: OpportunityState): OpportunityState | null {
  switch (state) {
    case 'Triggered':
      return 'Ready';
    case 'Ready':
      return 'Managing';
    case 'Managing':
      return 'Building';
    case 'Building':
      return 'Watching';
    case 'Watching':
      return null;
    default:
      return null;
  }
}

function terminalStateForHardStale(state: OpportunityState): OpportunityState | null {
  if (state === 'Completed' || state === 'Invalidated') return null;
  if (state === 'CoolingOff') return 'Invalidated';
  if (state === 'Triggered' || state === 'Ready' || state === 'Managing') return 'Invalidated';
  if (state === 'Building' || state === 'Watching') return 'CoolingOff';
  return null;
}

/**
 * Confidence decay from age (seconds since last engine touch / “as of” freshness).
 * - {@link freshnessSec} > 120: one step down the active ladder (Triggered → … → Watching).
 * - {@link freshnessSec} > 300: {@link Invalidated} for hot workflow states, else {@link CoolingOff} (then CoolingOff → Invalidated).
 */
export function applyOpportunityConfidenceDecay(card: OpportunityCardModel): OpportunityCardModel {
  const sec = card.freshnessSec;
  if (!Number.isFinite(sec) || sec <= STALE_SOFT_SEC) return card;

  let nextState = card.state;

  if (sec > STALE_HARD_SEC) {
    const terminal = terminalStateForHardStale(nextState);
    if (terminal) nextState = terminal;
  } else {
    const down = downgradeOne(nextState);
    if (down) nextState = down;
  }

  if (nextState === card.state) return card;

  return {
    ...card,
    state: nextState,
    entryStatus: entryStatusFromOpportunityState(nextState),
  };
}
