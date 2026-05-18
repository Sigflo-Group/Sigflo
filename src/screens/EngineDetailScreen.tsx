import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EngineDetailControls } from '@/components/engines/EngineDetailControls';
import { EngineFocusCard } from '@/components/engines/EngineFocusCard';
import { EngineHeaderCard } from '@/components/engines/EngineHeaderCard';
import { EngineJournal } from '@/components/engines/EngineJournal';
import { EngineOpportunityList } from '@/components/engines/EngineOpportunityList';
import { TriggeredStatusBadge } from '@/components/ui/TriggeredStatusBadge';
import { mockEngines } from '@/data/mockEngines';
import { mockSystemEvents } from '@/data/mockSystemEvents';
import { useSignalEngine } from '@/hooks/useSignalEngine';
import { countTriggeredPairs } from '@/lib/marketScannerRows';
import { parseSourceEngineFromOpportunityId } from '@/lib/tradeReviewCockpit';
import { getAlertPreferences } from '@/services/alerts/alertPreferences';
import { playUiTapSound } from '@/utils/sound';
import { listOpportunities } from '@/services/opportunities';
import type { AlertPreference } from '@/types/alerts';
import type { OpportunityCardModel, SystemEventModel } from '@/types/botSystem';
import { sortOpportunities } from '@/types/botSystem';

export default function EngineDetailScreen() {
  const { engineId } = useParams<{ engineId: string }>();
  const navigate = useNavigate();
  const { signals, loading: signalsLoading } = useSignalEngine();
  const [opportunities, setOpportunities] = useState<OpportunityCardModel[]>([]);
  const [oppLoading, setOppLoading] = useState(true);
  const [isPausedLocally, setIsPausedLocally] = useState(false);
  const [localJournalEvents, setLocalJournalEvents] = useState<SystemEventModel[]>([]);
  const [alertPrefs, setAlertPrefs] = useState<AlertPreference>(() => getAlertPreferences());
  const triggeredPairCount = useMemo(() => countTriggeredPairs(signals), [signals]);

  const engine = useMemo(
    () => (engineId ? mockEngines.find((e) => e.engineId === engineId) ?? null : null),
    [engineId],
  );

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setOppLoading(true);
      try {
        const list = await listOpportunities();
        if (!cancelled) setOpportunities(list);
      } catch {
        if (!cancelled) setOpportunities([]);
      } finally {
        if (!cancelled) setOppLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const formingForEngine = useMemo(() => {
    if (!engine) return [];
    return sortOpportunities(
      opportunities.filter(
        (o) =>
          (o.state === 'Building' || o.state === 'Watching') &&
          parseSourceEngineFromOpportunityId(o.id) === engine.engineName,
      ),
    );
  }, [opportunities, engine]);

  const scopedJournalEvents = useMemo(() => {
    if (!engineId) return [];
    return mockSystemEvents.filter((e) => e.relatedEngineId === engineId);
  }, [engineId]);

  const navigateToTradeReview = useCallback(
    (opportunity: OpportunityCardModel) => {
      const pair = opportunity.pair.replace('/', '');
      const q = new URLSearchParams({
        pair,
        source: 'bots',
        setup: opportunity.setupType,
        state: opportunity.state,
        direction: opportunity.direction,
        opportunityId: opportunity.id,
        score: String(opportunity.score),
        thesis: opportunity.thesis,
        rationale: opportunity.rationale,
      });
      if (opportunity.entryZone) q.set('entryZone', opportunity.entryZone);
      if (opportunity.invalidation) q.set('invalidation', opportunity.invalidation);
      if (opportunity.targets?.length) q.set('targets', opportunity.targets.join('|'));
      if (opportunity.timeframeAlignment?.length) q.set('timeframeAlignment', opportunity.timeframeAlignment.join('|'));
      navigate(`/trade?${q.toString()}`);
    },
    [navigate],
  );

  const onSelectOpportunity = useCallback(
    (id: string) => {
      const o = formingForEngine.find((x) => x.id === id);
      if (o) navigateToTradeReview(o);
    },
    [formingForEngine, navigateToTradeReview],
  );

  const toggleLocalPause = useCallback(() => {
    if (!engineId) return;
    setIsPausedLocally((prev) => {
      const next = !prev;
      const row: SystemEventModel = {
        id: `local-j-${Date.now()}`,
        timestamp: new Date().toISOString(),
        eventType: 'engine',
        severity: 'info',
        message: next
          ? 'Engine paused on this device (UI only — no server or exchange change).'
          : 'Engine resumed on this device (UI only).',
        relatedEngineId: engineId,
      };
      setLocalJournalEvents((j) => [row, ...j]);
      return next;
    });
  }, [engineId]);

  useEffect(() => {
    const sync = () => setAlertPrefs(getAlertPreferences());
    window.addEventListener('pageshow', sync);
    window.addEventListener('focus', sync);
    return () => {
      window.removeEventListener('pageshow', sync);
      window.removeEventListener('focus', sync);
    };
  }, []);

  const alertSummaryLine = useMemo(() => {
    if (!alertPrefs.enabled) return 'Ready setup alerts are off on this device.';
    if (alertPrefs.states.includes('Ready')) return 'Alerts active for Ready setups';
    if (alertPrefs.states.includes('Triggered')) return 'Alerts active for Triggered setups';
    return 'Setup alerts on — worth reviewing when conditions match your rules';
  }, [alertPrefs.enabled, alertPrefs.states]);

  if (!engineId || !engine) {
    return (
      <div className="min-h-[100dvh] bg-[#050505] pb-[max(6rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto w-full max-w-md space-y-3 px-3">
          <p className="text-[13px] text-zinc-400">Engine not found.</p>
          <Link to="/bots" className="inline-flex text-[13px] font-semibold text-[#9fe8d6]">
            Back to Bots
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#050505] pb-[max(7rem,env(safe-area-inset-bottom))] pt-3">
      <div className="mx-auto w-full max-w-md space-y-3 px-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-medium text-zinc-600">Engine intelligence · demo</p>
          <TriggeredStatusBadge count={triggeredPairCount} loading={signalsLoading} />
        </div>

        <EngineHeaderCard engine={engine} isPausedLocally={isPausedLocally} />

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5 backdrop-blur-sm">
          <p className="text-[12px] leading-snug text-zinc-300">{alertSummaryLine}</p>
          <button
            type="button"
            onClick={() => {
              playUiTapSound();
              navigate('/bots?alerts=1');
            }}
            className="mt-2 text-[11px] font-semibold text-[#9fe8d6] underline-offset-2 transition hover:text-[#c5f5e8]"
          >
            Edit alerts
          </button>
        </section>

        <EngineFocusCard engineId={engine.engineId} />

        <EngineOpportunityList loading={oppLoading} opportunities={formingForEngine} onSelect={onSelectOpportunity} />

        <EngineJournal events={scopedJournalEvents} localEvents={localJournalEvents} />

        <EngineDetailControls
          isPausedLocally={isPausedLocally}
          onPauseToggle={toggleLocalPause}
          onViewForming={() => navigate('/bots?forming=1')}
          onBackToBots={() => navigate('/bots')}
        />

        <p className="px-0.5 text-[10px] leading-snug text-zinc-600">
          No trade execution here. Signals stay read-only until you open a setup on Trade.
        </p>
      </div>
    </div>
  );
}
