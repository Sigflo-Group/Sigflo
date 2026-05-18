import { secureStorage } from '@/lib/storage';
import type { AlertChannel, AlertPreference } from '@/types/alerts';

const STORAGE_KEY = 'sigflo_alert_preferences';

export const DEFAULT_ALERT_PREFERENCES: AlertPreference = {
  enabled: true,
  minScore: 75,
  states: ['Ready', 'Triggered'],
  channels: ['in_app', 'sound'],
};

const ALLOWED_MIN_SCORES = new Set([70, 75, 80, 85]);
const ALLOWED_CHANNELS = new Set<AlertChannel>(['in_app', 'sound', 'push']);

function normalizeStates(value: unknown): ('Ready' | 'Triggered')[] {
  if (!Array.isArray(value) || value.length === 0) return [...DEFAULT_ALERT_PREFERENCES.states];
  const out = value.filter((s): s is 'Ready' | 'Triggered' => s === 'Ready' || s === 'Triggered');
  return out.length > 0 ? out : [...DEFAULT_ALERT_PREFERENCES.states];
}

function normalizeChannels(value: unknown): AlertChannel[] {
  if (!Array.isArray(value) || value.length === 0) return [...DEFAULT_ALERT_PREFERENCES.channels];
  const filtered = value.filter((c): c is AlertChannel => ALLOWED_CHANNELS.has(c as AlertChannel));
  const noPush = filtered.filter((c) => c !== 'push');
  return noPush.length > 0 ? noPush : [...DEFAULT_ALERT_PREFERENCES.channels];
}

function coercePreference(raw: Partial<AlertPreference> | null | undefined): AlertPreference {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_ALERT_PREFERENCES };
  const minScore =
    typeof raw.minScore === 'number' && ALLOWED_MIN_SCORES.has(raw.minScore) ? raw.minScore : DEFAULT_ALERT_PREFERENCES.minScore;
  return {
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : DEFAULT_ALERT_PREFERENCES.enabled,
    minScore,
    states: normalizeStates(raw.states),
    channels: normalizeChannels(raw.channels),
  };
}

export function getAlertPreferences(): AlertPreference {
  if (typeof window === 'undefined' || false) {
    return { ...DEFAULT_ALERT_PREFERENCES };
  }
  try {
    const raw = secureStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_ALERT_PREFERENCES };
    const parsed = JSON.parse(raw) as Partial<AlertPreference>;
    return coercePreference(parsed);
  } catch {
    return { ...DEFAULT_ALERT_PREFERENCES };
  }
}

export function saveAlertPreferences(preferences: AlertPreference): void {
  const normalized = coercePreference(preferences);
  if (typeof window === 'undefined' || false) return;
  try {
    secureStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch (e) { console.error("[Caught Error]", e); }
}

export function resetAlertPreferences(): AlertPreference {
  if (typeof window !== 'undefined') {
    try {
      secureStorage.removeItem(STORAGE_KEY);
    } catch (e) { console.error("[Caught Error]", e); }
  }
  return { ...DEFAULT_ALERT_PREFERENCES };
}
