import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_AUTOMATION_SAFEGUARDS,
  appendActivityEntry,
  isActionableExitAiPopupActivity,
  parseActivityLogJson,
} from '@/lib/aiExitAutomation';
import { isActionableExitAiPopupMessage } from '@/lib/exitAiPopupGate';
import { emitGlobalAnnouncement } from '@/lib/globalAnnouncements';
import { DEFAULT_CUSTOM_STRATEGY_THRESHOLDS, sanitizeExitStrategyThresholds } from '@/lib/exitGuidance';
import type {
  AutomationSafeguards,
  ExitAiMode,
  ExitAutomationActivityEntry,
  ExitAutomationActivityKind,
  ExitStrategyPreset,
  ExitStrategyThresholds,
} from '@/types/aiExitAutomation';

const LS_MODE = 'sigflo.exitAi.mode';
const LS_STRATEGY = 'sigflo.exitAi.strategy';
const LS_SAFEGUARDS = 'sigflo.exitAi.safeguards';
const LS_CUSTOM_THRESHOLDS = 'sigflo.exitAi.customThresholds';

const EXIT_AI_POPUP_KINDS: ReadonlySet<ExitAutomationActivityKind> = new Set([
  'auto_trim',
  'auto_close',
  'safeguard',
  'assisted_ready',
]);
const EXIT_AI_POPUP_COOLDOWN_MS = 20_000;

function loadMode(): ExitAiMode {
  const v = window.localStorage.getItem(LS_MODE);
  if (v === 'manual' || v === 'assisted' || v === 'auto') return v;
  return 'manual';
}

function loadStrategy(): ExitStrategyPreset {
  const v = window.localStorage.getItem(LS_STRATEGY);
  if (v === 'protect_profit' || v === 'trend_follow' || v === 'tight_risk' || v === 'custom') return v;
  return 'protect_profit';
}

function loadSafeguards(): AutomationSafeguards {
  try {
    const raw = window.localStorage.getItem(LS_SAFEGUARDS);
    if (!raw) return { ...DEFAULT_AUTOMATION_SAFEGUARDS };
    const p = JSON.parse(raw) as Partial<AutomationSafeguards>;
    return {
      maxLossPct:
        typeof p.maxLossPct === 'number' && Number.isFinite(p.maxLossPct)
          ? Math.min(50, Math.max(0.5, p.maxLossPct))
          : DEFAULT_AUTOMATION_SAFEGUARDS.maxLossPct,
      minProfitBeforeTrimPct:
        typeof p.minProfitBeforeTrimPct === 'number' && Number.isFinite(p.minProfitBeforeTrimPct)
          ? Math.min(25, Math.max(0, p.minProfitBeforeTrimPct))
          : DEFAULT_AUTOMATION_SAFEGUARDS.minProfitBeforeTrimPct,
      allowPartialExits: p.allowPartialExits !== false,
      allowFullAutoClose: p.allowFullAutoClose !== false,
    };
  } catch {
    return { ...DEFAULT_AUTOMATION_SAFEGUARDS };
  }
}

function loadCustomStrategyThresholds(): ExitStrategyThresholds {
  try {
    const raw = window.localStorage.getItem(LS_CUSTOM_THRESHOLDS);
    if (!raw) return { ...DEFAULT_CUSTOM_STRATEGY_THRESHOLDS };
    const p = JSON.parse(raw) as Partial<ExitStrategyThresholds>;
    return sanitizeExitStrategyThresholds(p);
  } catch {
    return { ...DEFAULT_CUSTOM_STRATEGY_THRESHOLDS };
  }
}

function activityStorageKey(scopeKey: string) {
  return `sigflo.exitAi.activity.${scopeKey}`;
}

export function useExitAutomation(scopeKey: string) {
  const [mode, setMode] = useState<ExitAiMode>(loadMode);
  const [strategy, setStrategy] = useState<ExitStrategyPreset>(loadStrategy);
  const [safeguards, setSafeguards] = useState<AutomationSafeguards>(loadSafeguards);
  const [customStrategyThresholds, setCustomStrategyThresholds] =
    useState<ExitStrategyThresholds>(loadCustomStrategyThresholds);
  const [activity, setActivity] = useState<ExitAutomationActivityEntry[]>([]);
  const popupLastEmittedAtRef = useRef<Partial<Record<ExitAutomationActivityKind, number>>>({});

  useEffect(() => {
    setActivity(parseActivityLogJson(window.localStorage.getItem(activityStorageKey(scopeKey))));
  }, [scopeKey]);

  useEffect(() => {
    window.localStorage.setItem(LS_MODE, mode);
  }, [mode]);

  useEffect(() => {
    window.localStorage.setItem(LS_STRATEGY, strategy);
  }, [strategy]);

  useEffect(() => {
    window.localStorage.setItem(LS_SAFEGUARDS, JSON.stringify(safeguards));
  }, [safeguards]);

  useEffect(() => {
    window.localStorage.setItem(LS_CUSTOM_THRESHOLDS, JSON.stringify(customStrategyThresholds));
  }, [customStrategyThresholds]);

  const mergeCustomStrategyThresholds = useCallback((patch: Partial<ExitStrategyThresholds>) => {
    setCustomStrategyThresholds((prev) => sanitizeExitStrategyThresholds({ ...prev, ...patch }));
  }, []);

  const resetCustomStrategyThresholds = useCallback(() => {
    setCustomStrategyThresholds({ ...DEFAULT_CUSTOM_STRATEGY_THRESHOLDS });
  }, []);

  const persistActivity = useCallback((next: ExitAutomationActivityEntry[]) => {
    window.localStorage.setItem(activityStorageKey(scopeKey), JSON.stringify(next));
  }, [scopeKey]);

  const pushActivity = useCallback(
    (entry: Omit<ExitAutomationActivityEntry, 'id' | 'ts'> & { id?: string; ts?: number }) => {
      setActivity((prev) => {
        const next = appendActivityEntry(prev, entry);
        persistActivity(next);
        const added = next[next.length - 1];
<<<<<<< HEAD
        if (added && EXIT_AI_POPUP_KINDS.has(added.kind) && isActionableExitAiPopupMessage(added)) {
=======
        if (added && EXIT_AI_POPUP_KINDS.has(added.kind) && isActionableExitAiPopupActivity(added)) {
          const now = Date.now();
          const last = popupLastEmittedAtRef.current[added.kind] ?? 0;
          if (now - last < EXIT_AI_POPUP_COOLDOWN_MS) return next;
          popupLastEmittedAtRef.current[added.kind] = now;
>>>>>>> 53ef2818a37cb45118dfe40508c15d7db79a5f8a
          queueMicrotask(() => {
            emitGlobalAnnouncement({
              id: added.id,
              kind: 'ai_action',
              title: 'Exit AI',
              subtitle: added.message,
            });
          });
        }
        return next;
      });
    },
    [persistActivity],
  );

  const clearActivity = useCallback(() => {
    setActivity([]);
    window.localStorage.removeItem(activityStorageKey(scopeKey));
  }, [scopeKey]);

  return useMemo(
    () => ({
      mode,
      setMode,
      strategy,
      setStrategy,
      safeguards,
      setSafeguards,
      customStrategyThresholds,
      mergeCustomStrategyThresholds,
      resetCustomStrategyThresholds,
      activity,
      pushActivity,
      clearActivity,
    }),
    [
      mode,
      strategy,
      safeguards,
      customStrategyThresholds,
      mergeCustomStrategyThresholds,
      resetCustomStrategyThresholds,
      activity,
      pushActivity,
      clearActivity,
    ],
  );
}
