import type { MarketMemorySnapshot } from '@/lib/marketMemory';
import { createEmptyUserAdaptationStore, type UserAdaptationStore } from '@/lib/userAdaptation';
import {
  createEmptySignalLifecycleTracker,
  type SignalLifecycleTrackerStore,
} from '@/lib/signalLifecycleTracker';
import { loadRegimePredictorStore, persistRegimePredictorStore } from '@/lib/regimePredictor';
import { loadAiSnapshotStore, persistAiSnapshotStore } from '@/lib/aiSnapshotLog';
import type { CandidateLifecycle } from '@/lib/timingLifecycle';

export const MARKET_MEMORY_STORE_KEY = '__SIGFLO_MARKET_MEMORY_V1__';
export const SIGNAL_LIFECYCLE_STORE_KEY = '__SIGFLO_SIGNAL_LIFECYCLE_V1__';
export const USER_ADAPTATION_STORE_KEY = '__SIGFLO_USER_ADAPTATION_V1__';
export const PRO_INTELLIGENCE_PREFS_KEY = '__SIGFLO_PRO_INTELLIGENCE_PREFS_V1__';
export const LIFECYCLE_REF_STORE_KEY = '__SIGFLO_LIFECYCLE_REF_V2__';

type ProIntelligencePrefs = {
  enabled: boolean;
  layout: 'compact' | 'expanded';
  panelExpanded: Record<string, boolean>;
};

function safeGetItem(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    // Ignore quota/privacy failures.
  }
}

export function loadMarketMemoryStore(): Record<string, MarketMemorySnapshot> {
  try {
    const raw = safeGetItem(MARKET_MEMORY_STORE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, MarketMemorySnapshot>;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed;
  } catch {
    return {};
  }
}

export function persistMarketMemoryStore(store: Record<string, MarketMemorySnapshot>): void {
  safeSetItem(MARKET_MEMORY_STORE_KEY, JSON.stringify(store));
}

export function loadSignalLifecycleStore(): SignalLifecycleTrackerStore {
  try {
    const raw = safeGetItem(SIGNAL_LIFECYCLE_STORE_KEY);
    if (!raw) return createEmptySignalLifecycleTracker();
    const parsed = JSON.parse(raw) as SignalLifecycleTrackerStore;
    if (!parsed || typeof parsed !== 'object') return createEmptySignalLifecycleTracker();
    return {
      events: Array.isArray(parsed.events) ? parsed.events : [],
      feedbackBySymbolSetup:
        parsed.feedbackBySymbolSetup && typeof parsed.feedbackBySymbolSetup === 'object'
          ? parsed.feedbackBySymbolSetup
          : {},
      generatedInsights: Array.isArray(parsed.generatedInsights) ? parsed.generatedInsights : [],
    };
  } catch {
    return createEmptySignalLifecycleTracker();
  }
}

export function persistSignalLifecycleStore(store: SignalLifecycleTrackerStore): void {
  safeSetItem(SIGNAL_LIFECYCLE_STORE_KEY, JSON.stringify(store));
}

export function loadUserAdaptationStore(): UserAdaptationStore {
  try {
    const raw = safeGetItem(USER_ADAPTATION_STORE_KEY);
    if (!raw) return createEmptyUserAdaptationStore();
    const parsed = JSON.parse(raw) as UserAdaptationStore;
    if (!parsed || typeof parsed !== 'object') return createEmptyUserAdaptationStore();
    return {
      ...createEmptyUserAdaptationStore(),
      ...parsed,
      bySetup: {
        ...createEmptyUserAdaptationStore().bySetup,
        ...(parsed.bySetup ?? {}),
      },
      byRisk: {
        ...createEmptyUserAdaptationStore().byRisk,
        ...(parsed.byRisk ?? {}),
      },
      preferences: {
        ...createEmptyUserAdaptationStore().preferences,
        ...(parsed.preferences ?? {}),
      },
      generatedNotes: Array.isArray(parsed.generatedNotes) ? parsed.generatedNotes : [],
    };
  } catch {
    return createEmptyUserAdaptationStore();
  }
}

export function persistUserAdaptationStore(store: UserAdaptationStore): void {
  safeSetItem(USER_ADAPTATION_STORE_KEY, JSON.stringify(store));
}

export function loadProIntelligencePrefs(): ProIntelligencePrefs {
  try {
    const raw = safeGetItem(PRO_INTELLIGENCE_PREFS_KEY);
    if (!raw) return { enabled: false, layout: 'compact', panelExpanded: {} };
    const parsed = JSON.parse(raw) as Partial<ProIntelligencePrefs>;
    return {
      enabled: Boolean(parsed?.enabled),
      layout: parsed?.layout === 'expanded' ? 'expanded' : 'compact',
      panelExpanded:
        parsed?.panelExpanded && typeof parsed.panelExpanded === 'object'
          ? (parsed.panelExpanded as Record<string, boolean>)
          : {},
    };
  } catch {
    return { enabled: false, layout: 'compact', panelExpanded: {} };
  }
}

export function persistProIntelligencePrefs(prefs: ProIntelligencePrefs): void {
  safeSetItem(PRO_INTELLIGENCE_PREFS_KEY, JSON.stringify(prefs));
}

function sanitizeLifecycleStore(parsed: Record<string, CandidateLifecycle>): Record<string, CandidateLifecycle> {
  const out: Record<string, CandidateLifecycle> = {};
  for (const [key, lc] of Object.entries(parsed)) {
    if (!lc || typeof lc !== 'object') continue;
    if (lc.state === 'triggered' && lc.trigger?.triggerCandleTs == null) continue;
    // Stale extended/expired rows block fresh trigger re-arm after reload.
    if (lc.state === 'extended' || lc.state === 'expired') continue;
    out[key] = lc;
  }
  return out;
}

export function loadLifecycleRef(): Record<string, CandidateLifecycle> {
  try {
    const raw = safeGetItem(LIFECYCLE_REF_STORE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, CandidateLifecycle>;
    if (!parsed || typeof parsed !== 'object') return {};
    return sanitizeLifecycleStore(parsed);
  } catch {
    return {};
  }
}

export function persistLifecycleRef(store: Record<string, CandidateLifecycle>): void {
  safeSetItem(LIFECYCLE_REF_STORE_KEY, JSON.stringify(store));
}

export type { ProIntelligencePrefs };
export { loadRegimePredictorStore, persistRegimePredictorStore, loadAiSnapshotStore, persistAiSnapshotStore };
