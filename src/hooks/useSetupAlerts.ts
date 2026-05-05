import { useCallback, useEffect, useRef, useState } from 'react';
import { processOpportunitiesForAlerts } from '@/services/alerts/alertEngine';
import { getAlertPreferences } from '@/services/alerts/alertPreferences';
import { playAlertSound, playSetupReadySound } from '@/utils/sound';
import type { OpportunityCardModel } from '@/types/botSystem';

const HIGHLIGHT_MS = 2000;
const BANNER_MS = 2600;

export type UseSetupAlertsResult = {
  /** Opportunity ids showing the short highlight ring. */
  highlightIds: ReadonlySet<string>;
  /** Incrementing key so the command bar dot can replay a one-shot pulse. */
  commandBarFlashKey: number;
  /** Short banner copy, or null. */
  setupReadyBanner: string | null;
};

/**
 * Compares successive `opportunities` snapshots against alert preferences and drives
 * subtle in-app feedback (card highlight, optional sound, command bar ping).
 */
export function useSetupAlerts(opportunities: OpportunityCardModel[]): UseSetupAlertsResult {
  const prevRef = useRef<OpportunityCardModel[] | null>(null);
  const hydratedRef = useRef(false);
  const highlightTimersRef = useRef<Map<string, number>>(new Map());

  const [highlightIds, setHighlightIds] = useState<ReadonlySet<string>>(() => new Set());
  const [commandBarFlashKey, setCommandBarFlashKey] = useState(0);
  const [setupReadyBanner, setSetupReadyBanner] = useState<string | null>(null);
  const bannerTimerRef = useRef<number | null>(null);

  const clearHighlightTimer = useCallback((id: string) => {
    const t = highlightTimersRef.current.get(id);
    if (t != null) {
      window.clearTimeout(t);
      highlightTimersRef.current.delete(id);
    }
  }, []);

  const runCompare = useCallback(
    (next: OpportunityCardModel[]) => {
      const prefs = getAlertPreferences();

      if (!hydratedRef.current) {
        prevRef.current = next;
        if (next.length > 0) hydratedRef.current = true;
        return;
      }

      const prev = prevRef.current ?? [];
      prevRef.current = next;

      if (prev.length === 0 && next.length > 0) {
        return;
      }

      const events = processOpportunitiesForAlerts(prev, next, prefs);
      if (events.length === 0) return;

      if (prefs.channels.includes('in_app')) {
        for (const id of events.map((e) => e.id)) {
          clearHighlightTimer(id);
          setHighlightIds((h) => {
            const n = new Set(h);
            n.add(id);
            return n;
          });
          const tid = window.setTimeout(() => {
            setHighlightIds((h) => {
              const n = new Set(h);
              n.delete(id);
              return n;
            });
            highlightTimersRef.current.delete(id);
          }, HIGHLIGHT_MS);
          highlightTimersRef.current.set(id, tid);
        }

        setCommandBarFlashKey((k) => k + 1);
        if (bannerTimerRef.current != null) {
          window.clearTimeout(bannerTimerRef.current);
          bannerTimerRef.current = null;
        }
        setSetupReadyBanner('New setup ready');
        bannerTimerRef.current = window.setTimeout(() => {
          setSetupReadyBanner(null);
          bannerTimerRef.current = null;
        }, BANNER_MS);
      }

      if (prefs.channels.includes('sound')) {
        const wantsAlert = events.some(
          (e) => e.state === 'Triggered' || (e.state === 'Ready' && e.score >= 80),
        );
        if (wantsAlert) playAlertSound();
        else playSetupReadySound();
      }
    },
    [clearHighlightTimer],
  );

  useEffect(() => {
    return () => {
      if (bannerTimerRef.current != null) window.clearTimeout(bannerTimerRef.current);
      for (const t of highlightTimersRef.current.values()) window.clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    runCompare(opportunities);
  }, [opportunities, runCompare]);

  return { highlightIds, commandBarFlashKey, setupReadyBanner };
}
