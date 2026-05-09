import { useEffect, useRef } from 'react';
import { emitGlobalAnnouncement } from '@/lib/globalAnnouncements';
import type { ExitAutomationActivityEntry, ExitAutomationActivityKind } from '@/types/aiExitAutomation';

const TRADE_ACTIVITY_KEY = 'sigflo.exitAi.activity.trade';
const SEEN_CACHE_KEY = 'sigflo.exitAi.popupSeen.v1';
const POPUP_KINDS: ReadonlySet<ExitAutomationActivityKind> = new Set([
  'assisted_ready',
  'auto_trim',
  'auto_close',
  'safeguard',
]);

function isActionablePopupMessage(entry: ExitAutomationActivityEntry): boolean {
  const msg = entry.message.toLowerCase();
  // Do not surface blocking “decision” popups for informational/no-position logs.
  if (
    msg.includes('no exchange position') ||
    msg.includes('connect bybit') ||
    msg.includes('no live position') ||
    msg.includes('no position on this pair')
  ) {
    return false;
  }
  // Assisted prompts should represent an actionable confirm step, not stale/non-actionable chatter.
  if (entry.kind === 'assisted_ready') {
    if (!(msg.includes('submitting') || msg.includes('confirm') || msg.includes('prepared'))) return false;
  }
  return true;
}

function readActivityLog(): ExitAutomationActivityEntry[] {
  try {
    const raw = window.localStorage.getItem(TRADE_ACTIVITY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((row): row is ExitAutomationActivityEntry => {
      if (!row || typeof row !== 'object') return false;
      const r = row as Record<string, unknown>;
      return (
        typeof r.id === 'string' &&
        typeof r.kind === 'string' &&
        typeof r.message === 'string' &&
        typeof r.ts === 'number'
      );
    });
  } catch {
    return [];
  }
}

function readSeenSet(): Set<string> {
  try {
    const raw = window.sessionStorage.getItem(SEEN_CACHE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((v): v is string => typeof v === 'string'));
  } catch {
    return new Set();
  }
}

function persistSeenSet(ids: Set<string>) {
  try {
    const arr = [...ids];
    const trimmed = arr.slice(-300);
    window.sessionStorage.setItem(SEEN_CACHE_KEY, JSON.stringify(trimmed));
  } catch {
    /* ignore */
  }
}

export function ExitAiDecisionBridge() {
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    seenRef.current = readSeenSet();
  }, []);

  useEffect(() => {
    const publishNew = () => {
      const now = Date.now();
      const seen = seenRef.current;
      let dirty = false;
      for (const e of readActivityLog()) {
        if (!POPUP_KINDS.has(e.kind)) continue;
        if (!isActionablePopupMessage(e)) continue;
        if (seen.has(e.id)) continue;
        // Do not replay very old events after reload.
        if (e.ts < now - 10 * 60_000) {
          seen.add(e.id);
          dirty = true;
          continue;
        }
        seen.add(e.id);
        dirty = true;
        emitGlobalAnnouncement({
          id: `exit-activity-${e.id}`,
          kind: 'ai_action',
          title: e.kind === 'assisted_ready' ? 'Assisted Exit Confirmation Required' : 'Auto Exit AI Decision',
          subtitle: e.message,
          createdAt: e.ts,
        });
      }
      if (dirty) persistSeenSet(seen);
    };

    publishNew();
    const intervalId = window.setInterval(publishNew, 1200);
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === TRADE_ACTIVITY_KEY) publishNew();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return null;
}

