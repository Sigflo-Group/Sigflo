import type { AlertPreference } from '@/types/alerts';
import type { OpportunityCardModel } from '@/types/botSystem';

export type SetupAlertEvent = {
  id: string;
  pair: string;
  state: 'Ready' | 'Triggered';
  score: number;
};

function isReadyOrTriggered(state: OpportunityCardModel['state']): state is 'Ready' | 'Triggered' {
  return state === 'Ready' || state === 'Triggered';
}

function prefsIncludesState(state: 'Ready' | 'Triggered', prefs: AlertPreference): boolean {
  return prefs.states.includes(state);
}

/** True when this row counts as alert-worthy under prefs (Ready/Triggered, score, enabled). */
function qualifiesForSetupAlert(opp: OpportunityCardModel, prefs: AlertPreference): boolean {
  if (!prefs.enabled) return false;
  if (!isReadyOrTriggered(opp.state)) return false;
  if (!prefsIncludesState(opp.state, prefs)) return false;
  if (opp.score < prefs.minScore) return false;
  return true;
}

/**
 * Diff two opportunity snapshots and emit discrete alert events for UX (highlight + optional sound).
 * Does not dedupe across time — caller should avoid calling on initial hydration with empty `prev`.
 */
export function processOpportunitiesForAlerts(
  prev: OpportunityCardModel[],
  next: OpportunityCardModel[],
  preferences: AlertPreference,
): SetupAlertEvent[] {
  if (!preferences.enabled) return [];

  const prevById = new Map(prev.map((o) => [o.id, o]));
  const out: SetupAlertEvent[] = [];
  const seen = new Set<string>();

  for (const n of next) {
    if (!isReadyOrTriggered(n.state)) continue;
    if (!prefsIncludesState(n.state, preferences)) continue;
    if (n.score < preferences.minScore) continue;

    const p = prevById.get(n.id);
    let fire = false;

    if (!p) {
      fire = true;
    } else {
      const prevQualifies = qualifiesForSetupAlert(p, preferences);

      if (!prevQualifies) {
        fire = true;
      } else if (p.state === 'Building' && n.state === 'Ready') {
        fire = true;
      } else if (p.state === 'Watching' && n.state === 'Ready') {
        fire = true;
      } else if (p.state === 'Ready' && n.state === 'Triggered') {
        fire = true;
      } else if (
        isReadyOrTriggered(p.state) &&
        p.score < preferences.minScore &&
        n.score >= preferences.minScore
      ) {
        fire = true;
      }
    }

    if (fire && !seen.has(n.id)) {
      seen.add(n.id);
      out.push({ id: n.id, pair: n.pair, state: n.state, score: n.score });
    }
  }

  return out;
}
