import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSetupAlerts } from '@/hooks/useSetupAlerts';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AutomationCommandBar from '@/components/bots/AutomationCommandBar';
import EngineStatusCard from '@/components/bots/EngineStatusCard';
import OpportunityDecisionCard from '@/components/bots/OpportunityDecisionCard';
import ActivePositionsStrip from '@/components/bots/ActivePositionsStrip';
import PriorityOpportunityCard from '@/components/bots/PriorityOpportunityCard';
import ReadyAlertSettings from '@/components/bots/ReadyAlertSettings';
import ScanningStateCard from '@/components/bots/ScanningStateCard';
import SystemEventRow from '@/components/bots/SystemEventRow';
import { TriggeredStatusBadge } from '@/components/ui/TriggeredStatusBadge';
import { mockCommandBar } from '@/data/mockCommandBar';
import { mockEngines } from '@/data/mockEngines';
import { mockSystemEvents } from '@/data/mockSystemEvents';
import { useSignalEngine } from '@/hooks/useSignalEngine';
import { buildLatestActivityLine } from '@/lib/botsOpportunityIntel';
import { countTriggeredPairs } from '@/lib/marketScannerRows';
import { getAlertPreferences, saveAlertPreferences } from '@/services/alerts/alertPreferences';
import { getOpportunityRepository, listOpportunities } from '@/services/opportunities';
import { getPositionRepository, sigfloActivePositionFromExchange, sigfloActiveToStripPosition } from '@/services/positions';
import { DemoPositionRepository, DEMO_POSITIONS_CHANGED_EVENT } from '@/services/positions/demoPositionRepository';
import { DailyRiskGuardBanner } from '@/components/risk/DailyRiskGuardBanner';
import { riskGuardStatusLine, useDailyRiskGuard } from '@/services/risk/dailyRiskGuard';
import { useRiskSettings } from '@/services/risk/riskSettings';
import { useAccountSnapshot } from '@/hooks/useAccountSnapshot';
import type { AlertPreference } from '@/types/alerts';
import type { OpportunityCardModel } from '@/types/botSystem';
import type { SigfloActivePosition } from '@/types/position';
import { formatFreshness, sortOpportunities } from '@/types/botSystem';
import { playUiTapSound } from '@/utils/sound';

function alertStatusSummary(prefs: AlertPreference): string {
  if (!prefs.enabled) return 'Alerts off';
  return `Alerts on · ${prefs.minScore}+`;
}

/** Deep link `?alerts=1` — read once for initial state (Strict Mode–safe vs stripping the param immediately). */
function readOpenAlertsFromUrl(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return new URLSearchParams(window.location.search).get('alerts') === '1';
  } catch {
    return false;
  }
}

function OpportunitiesSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading opportunities">
      <div className="h-36 animate-pulse rounded-2xl border border-white/10 bg-white/[0.06]" />
      <div className="space-y-2">
        <div className="h-20 animate-pulse rounded-xl border border-white/10 bg-white/[0.05]" />
        <div className="h-20 animate-pulse rounded-xl border border-white/10 bg-white/[0.05]" />
      </div>
    </div>
  );
}

function extractNumericValues(text: string | null | undefined): number[] {
  if (!text) return [];
  const matches = text.match(/-?\d+(?:\.\d+)?/g);
  if (!matches) return [];
  return matches.map((m) => Number(m)).filter((n) => Number.isFinite(n));
}

function decisionPlanFromOpportunity(o: OpportunityCardModel): {
  entryZone?: { min: number; max: number };
  invalidation?: number;
  targets?: number[];
} {
  const entryVals = extractNumericValues(o.entryZone ?? o.entryStatus);
  const stopVals = extractNumericValues(o.invalidation);
  const targetVals = (o.targets ?? []).flatMap((t) => extractNumericValues(t));
  return {
    entryZone: entryVals.length >= 2 ? { min: entryVals[0]!, max: entryVals[1]! } : entryVals.length === 1 ? { min: entryVals[0]!, max: entryVals[0]! } : undefined,
    invalidation: stopVals.length ? stopVals[0] : undefined,
    targets: targetVals.length ? targetVals : undefined,
  };
}

function isFormingOpportunity(o: OpportunityCardModel): boolean {
  return o.state === 'Building' || o.state === 'Watching';
}

function isDbHydratedOpportunity(o: OpportunityCardModel): boolean {
  if (!o.id.trim()) return false;
  if (!Number.isFinite(o.score) || o.score <= 0) return false;
  if (!o.thesis.trim() || !o.rationale.trim()) return false;
  if (!o.entryZone || !o.invalidation || !o.targets?.length) return false;
  return true;
}

function symbolToDisplayPair(symbol: string): string {
  const s = symbol.trim().toUpperCase();
  if (s.endsWith('USDT')) return `${s.slice(0, -4)} / USDT`;
  if (s.endsWith('USDC')) return `${s.slice(0, -4)} / USDC`;
  return s;
}

export default function BotsScreen() {
  const navigate = useNavigate();
  const { signals, loading: signalsLoading } = useSignalEngine();
  const [searchParams, setSearchParams] = useSearchParams();
  const liveSectionRef = useRef<HTMLDivElement>(null);
  const formingSectionRef = useRef<HTMLElement>(null);
  const alertSettingsPanelRef = useRef<HTMLDivElement>(null);
  const pendingAlertsScrollRef = useRef(false);
  const [opportunities, setOpportunities] = useState<OpportunityCardModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoSource, setIsDemoSource] = useState(false);
  const [opportunityFilter, setOpportunityFilter] = useState<'all' | 'forming'>('all');
  const [locallyPausedEngineIds, setLocallyPausedEngineIds] = useState<ReadonlySet<string>>(() => new Set());
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncErrorAt, setLastSyncErrorAt] = useState<number | null>(null);
  const [scanLineTick, setScanLineTick] = useState(0);
  const [alertPrefs, setAlertPrefs] = useState<AlertPreference>(() => getAlertPreferences());
  const [showAlertSettings, setShowAlertSettings] = useState(readOpenAlertsFromUrl);
  const [expandedOpportunityId, setExpandedOpportunityId] = useState<string | null>(null);
  const [positionRevision, setPositionRevision] = useState(0);
  const [paperTradeToast, setPaperTradeToast] = useState<string | null>(null);
  const triggeredPairCount = useMemo(() => countTriggeredPairs(signals), [signals]);
  const { highlightIds, commandBarFlashKey, setupReadyBanner } = useSetupAlerts(opportunities);
  const { items: accountSnapshots } = useAccountSnapshot();
  const riskSettings = useRiskSettings();
  const dailyRiskGuard = useDailyRiskGuard();
  const reviewLocked = dailyRiskGuard.status === 'locked';
  const commandBarModel = useMemo(
    () => ({
      ...mockCommandBar,
      riskMode: riskSettings.riskMode,
      liveExecutionLine: riskSettings.allowLiveExecution ? 'Live ready' : 'Live locked',
      riskGuardLine: riskGuardStatusLine(dailyRiskGuard.status),
    }),
    [riskSettings.riskMode, riskSettings.allowLiveExecution, dailyRiskGuard.status],
  );

  useEffect(() => {
    const id = window.setInterval(() => setScanLineTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (searchParams.get('forming') !== '1') return;
    setOpportunityFilter('forming');
    const next = new URLSearchParams(searchParams);
    next.delete('forming');
    setSearchParams(next, { replace: true });
    window.requestAnimationFrame(() => {
      formingSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (searchParams.get('alerts') !== '1') return;
    setShowAlertSettings(true);
    setAlertPrefs(getAlertPreferences());
    pendingAlertsScrollRef.current = true;
  }, [searchParams]);

  useEffect(() => {
    if (!showAlertSettings || !pendingAlertsScrollRef.current) return;
    pendingAlertsScrollRef.current = false;
    const id = window.requestAnimationFrame(() => {
      alertSettingsPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => window.cancelAnimationFrame(id);
  }, [showAlertSettings]);

  /** Remove `alerts=1` from the URL once the panel is dismissed so bookmarks and engine deep links stay consistent. */
  useEffect(() => {
    if (showAlertSettings) return;
    if (searchParams.get('alerts') !== '1') return;
    const next = new URLSearchParams(searchParams);
    next.delete('alerts');
    setSearchParams(next, { replace: true });
  }, [showAlertSettings, searchParams, setSearchParams]);

  const refreshOpportunities = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!silent) setIsLoading(true);
    setIsSyncing(true);
    setError(null);
    try {
      const list = await listOpportunities();
      setOpportunities(list);
      setLastSyncedAt(Date.now());
      setLastSyncErrorAt(null);
    } catch (e) {
      const message = e instanceof Error && e.message ? e.message : 'Could not load opportunities';
      setError(message);
      if (!silent) setOpportunities([]);
      setLastSyncErrorAt(Date.now());
    } finally {
      setIsSyncing(false);
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const repo = getOpportunityRepository();
    setIsDemoSource(repo.source === 'demo');
    void refreshOpportunities();
  }, [refreshOpportunities]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void refreshOpportunities({ silent: true });
    }, 10_000);
    return () => window.clearInterval(id);
  }, [refreshOpportunities]);

  useEffect(() => {
    const onPositionsChanged = () => setPositionRevision((v) => v + 1);
    window.addEventListener(DEMO_POSITIONS_CHANGED_EVENT, onPositionsChanged);
    return () => window.removeEventListener(DEMO_POSITIONS_CHANGED_EVENT, onPositionsChanged);
  }, []);

  useEffect(() => {
    if (!paperTradeToast) return;
    const id = window.setTimeout(() => setPaperTradeToast(null), 1800);
    return () => window.clearTimeout(id);
  }, [paperTradeToast]);

  const ranked = opportunities;
  const activeSectionRef = useRef<HTMLElement>(null);

  const exchangeActivePositions = useMemo(() => {
    const out: SigfloActivePosition[] = [];
    for (const snap of accountSnapshots) {
      if (snap.status !== 'connected') continue;
      for (const p of snap.positions) {
        if (!(Number.isFinite(p.size) && p.size > 0)) continue;
        const mark =
          p.markPrice != null && Number.isFinite(p.markPrice) && p.markPrice > 0 ? p.markPrice : p.entryPrice;
        out.push(sigfloActivePositionFromExchange(p, symbolToDisplayPair(p.symbol), mark));
      }
    }
    return out;
  }, [accountSnapshots]);

  const localActivePositions = useMemo(
    () => getPositionRepository().listActivePositions(),
    [positionRevision],
  );

  const activeStripPositions = useMemo(
    () => {
      const byPairKey = new Map<string, ReturnType<typeof sigfloActiveToStripPosition>>();
      for (const p of exchangeActivePositions) {
        const mapped = sigfloActiveToStripPosition(p);
        byPairKey.set(mapped.pairKey, mapped);
      }
      for (const p of localActivePositions) {
        const mapped = sigfloActiveToStripPosition(p);
        if (!byPairKey.has(mapped.pairKey)) byPairKey.set(mapped.pairKey, mapped);
      }
      return [...byPairKey.values()];
    },
    [exchangeActivePositions, localActivePositions],
  );

  const hero = useMemo(() => {
    const bestByState = ranked.find((o) => o.state === 'Triggered' || o.state === 'Ready');
    if (bestByState) return bestByState;
    return ranked.find((o) => o.score > 65) ?? null;
  }, [ranked]);

  const formingBand = useMemo(() => {
    return ranked
      .filter(
        (o) =>
          isFormingOpportunity(o) &&
          (!hero || o.id !== hero.id),
      )
      .sort((a, b) => b.score - a.score);
  }, [ranked, hero]);

  const formingDisplay = useMemo(() => formingBand.slice(0, 3), [formingBand]);

  const primaryLiveRows = useMemo(() => {
    return sortOpportunities(
      ranked.filter((o) => {
        if (hero && o.id === hero.id) return false;
        if (o.score < 55) return false;
        if (isFormingOpportunity(o)) return false;
        return true;
      }),
    );
  }, [ranked, hero]);

  const filteredLiveRows = useMemo(() => {
    if (opportunityFilter !== 'forming') return primaryLiveRows;
    return sortOpportunities(ranked.filter((o) => o.state === 'Building' || o.state === 'Watching'));
  }, [opportunityFilter, primaryLiveRows, ranked]);

  const allFormingRows = useMemo(
    () => sortOpportunities(ranked.filter((o) => o.state === 'Building' || o.state === 'Watching')),
    [ranked],
  );

  const formingSectionRows = useMemo(() => {
    if (opportunityFilter === 'forming') return allFormingRows;
    return formingDisplay;
  }, [allFormingRows, formingDisplay, opportunityFilter]);

  const scanFreshSec = ranked.length ? Math.min(...ranked.map((o) => o.freshnessSec)) : null;
  const scanAgeSec = useMemo(() => {
    void scanLineTick;
    if (scanFreshSec != null) return scanFreshSec;
    if (lastSyncedAt == null) return null;
    return Math.max(1, Math.floor((Date.now() - lastSyncedAt) / 1000));
  }, [scanFreshSec, lastSyncedAt, scanLineTick]);
  const scanningLabel =
    scanAgeSec != null ? `Engines scanning · ${formatFreshness(scanAgeSec)}` : 'Engines scanning';
  const liveReadout = useMemo(() => {
    void scanLineTick;
    const total = ranked.length;
    const ready = ranked.filter((o) => o.state === 'Ready' || o.state === 'Triggered').length;
    const forming = ranked.filter((o) => isFormingOpportunity(o)).length;
    const age =
      lastSyncedAt != null ? Math.max(1, Math.floor((Date.now() - lastSyncedAt) / 1000)) : null;
    const ageLabel = age != null ? formatFreshness(age) : 'no sync yet';
    if (isSyncing) {
      return `Live readout: syncing now · ${total} tracked · ${forming} forming · ${ready} ready`;
    }
    if (lastSyncErrorAt != null && (lastSyncedAt == null || lastSyncErrorAt > lastSyncedAt)) {
      return `Live readout: reconnecting · last successful update ${ageLabel}`;
    }
    if (!isDemoSource && total === 0) {
      return 'Live readout: 0 tracked · no opportunities rows returned yet';
    }
    return `Live readout: live · ${total} tracked · ${forming} forming · ${ready} ready · updated ${ageLabel}`;
  }, [ranked, lastSyncedAt, isSyncing, lastSyncErrorAt, scanLineTick, isDemoSource]);

  const engineIntel = useMemo(
    () => ({
      setupsForming: formingBand.length,
      formingTopSetups: formingBand.slice(0, 2).map((o) => {
        const raw = o.pair.trim();
        const pair = raw.includes('/') ? raw : raw.replace(/USDT$/i, ' / USDT').replace(/USDC$/i, ' / USDC');
        const explanation = o.rationale.trim().replace(/\s+/g, ' ');
        return {
          pair,
          explanation: explanation.length > 84 ? `${explanation.slice(0, 81)}…` : explanation,
        };
      }),
      latestActivityLine: buildLatestActivityLine(ranked),
    }),
    [formingBand, ranked],
  );

  const navigateToTradeReview = (opportunity: OpportunityCardModel) => {
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
    q.set('reviewTop', '1');
    navigate(`/trade?${q.toString()}`);
  };

  const onReview = (id: string) => {
    const opp = ranked.find((o) => o.id === id);
    if (!opp) return;
    navigateToTradeReview(opp);
  };
  const onExplain = (id: string) => console.log('Why this setup', id);
  const onToggleOpportunityExpand = (id: string) => {
    playUiTapSound();
    setExpandedOpportunityId((prev) => (prev === id ? null : id));
  };

  const onSelectActivePosition = (pairKey: string) => {
    playUiTapSound();
    navigate(`/trade?pair=${encodeURIComponent(pairKey)}&source=position`);
  };

  const onQuickPaperTrade = (opportunity: OpportunityCardModel) => {
    const plan = decisionPlanFromOpportunity(opportunity);
    if (!plan.entryZone || plan.invalidation == null) return;
    const entryPrice = (plan.entryZone.min + plan.entryZone.max) / 2;
    const pair = opportunity.pair.includes('/') ? opportunity.pair : `${opportunity.pair} / USDT`;
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `bots-paper-${Date.now()}`;
    const next: SigfloActivePosition = {
      id,
      pair,
      direction: opportunity.direction === 'SHORT' ? 'short' : 'long',
      entryPrice,
      markPrice: entryPrice,
      size: 1000,
      leverage: 1,
      marginMode: 'cross',
      unrealizedPnl: 0,
      unrealizedPnlPct: 0,
      stopPrice: plan.invalidation,
      liquidationPrice: null,
      targets: plan.targets ?? [],
      openedAt: Date.now(),
      source: 'bots-paper',
    };
    const repo = getPositionRepository();
    if (repo instanceof DemoPositionRepository) {
      repo.addPosition(next);
    }
    setPaperTradeToast('Paper trade opened');
    setExpandedOpportunityId(null);
    window.requestAnimationFrame(() => {
      activeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  };
  const onViewEngine = (id: string) => {
    playUiTapSound();
    navigate(`/engines/${encodeURIComponent(id)}`);
  };

  const onPauseToggleEngine = (engineId: string) => {
    playUiTapSound();
    setLocallyPausedEngineIds((prev) => {
      const next = new Set(prev);
      if (next.has(engineId)) next.delete(engineId);
      else next.add(engineId);
      return next;
    });
  };

  const onViewFormingSetups = () => {
    setOpportunityFilter('forming');
    window.requestAnimationFrame(() => {
      formingSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.28, delay: i * 0.05 },
    }),
  };

  return (
    <div className="min-h-[100dvh] bg-[#050505] pb-24 pt-4">
      <div className="mx-auto w-full max-w-lg space-y-4 px-4">
        <motion.div custom={0} initial="hidden" animate="visible" variants={sectionVariants}>
          <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/[0.06] bg-sigflo-surface sigflo-panel-texture px-3 py-2.5">
            <h1 className="text-sm font-bold uppercase tracking-[0.14em] text-sigflo-text">Bots</h1>
            <TriggeredStatusBadge count={triggeredPairCount} loading={signalsLoading} />
          </div>
        </motion.div>
        <motion.div custom={0} initial="hidden" animate="visible" variants={sectionVariants}>
          <AutomationCommandBar
            model={commandBarModel}
            setupReadyFlashKey={commandBarFlashKey}
            setupReadyBanner={setupReadyBanner}
          />
        </motion.div>

        <DailyRiskGuardBanner model={dailyRiskGuard} />

        {isDemoSource ? (
          <div className="flex justify-end">
            <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-zinc-500">
              Demo engine output
            </span>
          </div>
        ) : null}

        {error ? (
          <p className="rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90">{error}</p>
        ) : null}

        {activeStripPositions.length > 0 ? (
          <motion.section ref={activeSectionRef} custom={1} initial="hidden" animate="visible" variants={sectionVariants}>
            <ActivePositionsStrip positions={activeStripPositions} onSelectPosition={onSelectActivePosition} />
          </motion.section>
        ) : null}
        {paperTradeToast ? (
          <div className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-lg border border-[#00ffc8]/30 bg-[#0b1512] px-3 py-1.5 text-xs font-medium text-[#bafef1] shadow-lg">
            {paperTradeToast}
          </div>
        ) : null}

        <motion.section custom={2} initial="hidden" animate="visible" variants={sectionVariants}>
          {isLoading ? (
            <OpportunitiesSkeleton />
          ) : hero ? (
            <PriorityOpportunityCard
              opportunity={hero}
              onReview={onReview}
              onExplain={onExplain}
              alertHighlight={highlightIds.has(hero.id)}
              reviewLocked={reviewLocked}
            />
          ) : (
            <ScanningStateCard />
          )}
        </motion.section>

        <motion.section ref={liveSectionRef} custom={3} initial="hidden" animate="visible" variants={sectionVariants}>
          <div
            id="sigflo-bots-alert-settings"
            ref={alertSettingsPanelRef}
            className="mb-2 space-y-2 scroll-mt-4"
          >
            <div className="flex flex-wrap items-end justify-between gap-2">
              <p className="flex min-w-0 flex-1 items-center gap-2 text-xs text-zinc-500">
                <span className="sigflo-engine-scan-dot shrink-0 rounded-full bg-[#00ffc8]/80" aria-hidden />
                <span>{scanningLabel}</span>
              </p>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                    alertPrefs.enabled
                      ? 'border-[#00ffc8]/25 bg-[rgba(0,255,200,0.07)] text-[#b8ece0]'
                      : 'border-white/10 bg-white/[0.04] text-zinc-500'
                  }`}
                >
                  {alertStatusSummary(alertPrefs)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    playUiTapSound();
                    setShowAlertSettings((open) => {
                      const next = !open;
                      if (next) setAlertPrefs(getAlertPreferences());
                      return next;
                    });
                  }}
                  className="text-[10px] font-semibold text-[#9fe8d6] underline-offset-2 transition hover:text-[#c5f5e8]"
                >
                  Alert settings
                </button>
              </div>
            </div>
            <p className="text-[10px] text-zinc-500">{liveReadout}</p>
            {showAlertSettings ? (
              <ReadyAlertSettings
                value={alertPrefs}
                onChange={(next) => {
                  saveAlertPreferences(next);
                  setAlertPrefs(next);
                }}
              />
            ) : null}
          </div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">Live opportunities</h3>
            {opportunityFilter === 'forming' ? (
              <div className="flex items-center gap-2 rounded-full border border-[#00ffc8]/22 bg-[rgba(0,255,200,0.08)] px-2.5 py-1">
                <span className="text-[10px] font-medium text-zinc-300">Showing forming setups</span>
                <button
                  type="button"
                  onClick={() => {
                    playUiTapSound();
                    setOpportunityFilter('all');
                  }}
                  className="text-[10px] font-semibold text-[#9fe8d6] underline-offset-2 transition hover:text-[#c5f5e8]"
                >
                  Clear
                </button>
              </div>
            ) : null}
          </div>
          {isLoading ? null : filteredLiveRows.length > 0 ? (
            <div className="space-y-2">
              {filteredLiveRows.map((row: OpportunityCardModel) => (
                <OpportunityDecisionCard
                  key={row.id}
                  id={row.id}
                  pair={row.pair}
                  strategy={row.setupType}
                  direction={row.direction}
                  state={row.state === 'Ready' || row.state === 'Triggered' || row.state === 'Building' || row.state === 'Watching' ? row.state : 'Watching'}
                  score={row.score}
                  explanation={row.rationale || row.thesis}
                  {...decisionPlanFromOpportunity(row)}
                  isExpanded={expandedOpportunityId === row.id}
                  onToggleExpand={onToggleOpportunityExpand}
                  onQuickPaperTrade={() => onQuickPaperTrade(row)}
                  quickPaperTradeDisabled={!decisionPlanFromOpportunity(row).entryZone || decisionPlanFromOpportunity(row).invalidation == null}
                  debugHydration={{ isDbHydrated: isDbHydratedOpportunity(row), opportunityId: row.id }}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm leading-6 text-zinc-400">
              {opportunityFilter === 'forming' ? (
                <p>No forming setups in the list right now.</p>
              ) : (
                <>
                  <p className="font-medium text-zinc-200">No setups meet our threshold right now</p>
                  <p className="mt-2">
                    Engines keep scanning for compression, pullbacks, and momentum. Near-ready ideas show under{' '}
                    <span className="text-zinc-300">Forming setups</span> below.
                  </p>
                </>
              )}
            </div>
          )}
        </motion.section>

        {!isLoading && (formingBand.length > 0 || opportunityFilter === 'forming') ? (
          <motion.section
            ref={formingSectionRef}
            custom={4}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
          >
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">Forming setups</h3>
            {formingSectionRows.length > 0 ? (
              <div className="space-y-2">
                {formingSectionRows.map((row) => (
                  <OpportunityDecisionCard
                    key={row.id}
                    id={row.id}
                    pair={row.pair}
                    strategy={row.setupType}
                    direction={row.direction}
                    state={row.state === 'Ready' || row.state === 'Triggered' || row.state === 'Building' || row.state === 'Watching' ? row.state : 'Watching'}
                    score={row.score}
                    explanation={row.rationale || row.thesis}
                    {...decisionPlanFromOpportunity(row)}
                    isExpanded={expandedOpportunityId === row.id}
                    onToggleExpand={onToggleOpportunityExpand}
                    onQuickPaperTrade={() => onQuickPaperTrade(row)}
                    quickPaperTradeDisabled={!decisionPlanFromOpportunity(row).entryZone || decisionPlanFromOpportunity(row).invalidation == null}
                    debugHydration={{ isDbHydrated: isDbHydratedOpportunity(row), opportunityId: row.id }}
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-zinc-400">
                No forming setups in the list right now.
              </p>
            )}
          </motion.section>
        ) : null}

        <motion.section custom={5} initial="hidden" animate="visible" variants={sectionVariants}>
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">Engine status</h3>
          <div className="grid grid-cols-1 gap-2">
            {mockEngines.map((engine) => (
              <EngineStatusCard
                key={engine.engineId}
                engine={engine}
                intel={engineIntel}
                isPausedLocally={locallyPausedEngineIds.has(engine.engineId)}
                onView={onViewEngine}
                onPauseToggle={onPauseToggleEngine}
                onViewForming={onViewFormingSetups}
              />
            ))}
          </div>
        </motion.section>

        <motion.section custom={6} initial="hidden" animate="visible" variants={sectionVariants}>
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">System journal</h3>
          <div className="space-y-2">
            {mockSystemEvents.map((event) => (
              <SystemEventRow key={event.id} event={event} />
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
