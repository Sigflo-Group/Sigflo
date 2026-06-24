import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { runScannerDeterminismCheck } from '@/engine/scannerDeterminism';
import type { ScannerDeterminismFrame } from '@/engine/scannerDeterminism';
import { useSignalEngine } from '@/hooks/useSignalEngine';
import {
  formatNotTriggeredReason,
  FUNNEL_STAGE_LABELS,
  getScannerPipelineHealth,
  type ScannerPipelineHealthSnapshot,
} from '@/lib/scannerPipelineHealth';
import { lifecycleConfigSummary } from '@/lib/scannerEngineConfig';
import { isSignalTimingTriggered } from '@/lib/marketScannerRows';

function PassCard({ frame, title }: { frame: ScannerDeterminismFrame; title: string }) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <span className="rounded-full border border-sigflo-border bg-sigflo-bg/70 px-2 py-0.5 text-[11px] text-sigflo-muted">
          run {frame.run}
        </span>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg border border-sigflo-border bg-sigflo-bg/50 p-2">
          <p className="text-sigflo-muted">Candidates</p>
          <p className="mt-1 font-semibold text-white">{frame.candidateCount}</p>
        </div>
        <div className="rounded-lg border border-sigflo-border bg-sigflo-bg/50 p-2">
          <p className="text-sigflo-muted">Accepted</p>
          <p className="mt-1 font-semibold text-white">{frame.acceptedCount}</p>
        </div>
      </div>
      <div className="space-y-2">
        {frame.accepted.length === 0 ? (
          <p className="text-xs text-sigflo-muted">No signals accepted on this pass.</p>
        ) : (
          frame.accepted.map((s) => (
            <div
              key={`${s.symbol}-${s.setupType}-${s.setupScore}-${s.directionBias ?? 'na'}`}
              className="rounded-xl border border-sigflo-border bg-sigflo-bg/45 px-3 py-2"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-white">
                  {s.symbol} · {s.directionBias ?? '—'}
                </p>
                <p className="text-xs text-emerald-300">{s.setupScore}</p>
              </div>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-sigflo-muted">
                {s.setupType} · {s.timingState ?? 'n/a'} · {s.tags.join(', ')}
              </p>
              {s.confidence != null ? (
                <p className="mt-1 text-[10px] text-cyan-200/90">confidence {s.confidence}</p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

type ScannerDiagnosticRow = {
  symbol: string;
  setupType: string;
  setupScore: number;
  timingScore: number;
  entryFreshnessScore: number;
  roomToTargetScore: number;
  actionabilityScore: number;
  state: string;
  triggerType: string;
  idealEntryPrice: number | null;
  currentPrice: number;
  atrExtensionFromIdeal: number;
  candlesSinceTrigger: number | null;
  candlesSincePeakTiming: number | null;
  penalties: {
    candlesLatePenalty: number;
    atrExtensionPenalty: number;
    percentExtensionPenalty: number;
    postTriggerImpulsePenalty: number;
    crowdedLevelPenalty: number;
    rrCompressionPenalty: number;
  };
  positiveFactors: string[];
  ts: number;
};

function readScannerDiagnostics(): ScannerDiagnosticRow[] {
  const g = globalThis as Record<string, unknown>;
  const raw = g.__SIGFLO_SCANNER_DIAGNOSTICS__;
  return Array.isArray(raw) ? (raw as ScannerDiagnosticRow[]).slice().reverse() : [];
}

function PipelineHealthCard({
  health,
  engineLoading,
}: {
  health: ScannerPipelineHealthSnapshot;
  engineLoading: boolean;
}) {
  if (!health.updatedAt) {
    return (
      <Card className="p-4">
        <h2 className="text-sm font-semibold text-white">Pipeline funnel</h2>
        <p className="mt-2 text-xs text-sigflo-muted">
          {engineLoading
            ? 'Live engine bootstrapping — fetching candles and running detectors…'
            : 'No live pipeline data yet. Wait for bootstrap to finish or open /feed and wait for scanner ticks.'}
        </p>
      </Card>
    );
  }

  const symbols = Object.values(health.lastBySymbol);

  return (
    <Card className="p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-white">Pipeline funnel · why not triggered?</h2>
        <span className="text-[11px] text-sigflo-muted">{lifecycleConfigSummary()}</span>
      </div>
      <p className="mb-3 text-xs text-sigflo-muted">
        Mode {health.engineMode} · {health.connection} · stream {health.streamReady ? 'ready' : 'bootstrapping'} · triggered{' '}
        {health.triggeredPairs.length ? health.triggeredPairs.join(', ') : 'none'}
      </p>
      <div className="mb-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        {Object.entries(health.funnel).map(([stage, count]) => (
          <div key={stage} className="rounded-lg border border-sigflo-border bg-sigflo-bg/50 p-2">
            <p className="text-[10px] text-sigflo-muted">{FUNNEL_STAGE_LABELS[stage] ?? stage}</p>
            <p className="mt-1 font-semibold text-white">{count}</p>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {symbols.length === 0 ? (
          <p className="text-xs text-sigflo-muted">No per-symbol reports yet.</p>
        ) : (
          symbols.map((r) => (
            <div key={`${r.symbol}-${r.ts}`} className="rounded-xl border border-sigflo-border bg-sigflo-bg/45 px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <p className="text-xs font-medium text-white">
                  {r.symbol}
                  {r.setupType ? ` · ${r.setupType}` : ''}
                  {r.side ? ` ${r.side}` : ''}
                </p>
                <p className="text-[11px] text-sigflo-muted">{FUNNEL_STAGE_LABELS[r.stage] ?? r.stage}</p>
              </div>
              {r.timingState ? (
                <p className="mt-1 text-[11px] text-cyan-200">
                  lifecycle {r.timingState}
                  {r.actionabilityScore != null ? ` · actionability ${r.actionabilityScore}` : ''}
                  {r.entryFreshnessScore != null ? ` · freshness ${r.entryFreshnessScore}` : ''}
                </p>
              ) : null}
              {r.notTriggeredReasons && r.notTriggeredReasons.length > 0 ? (
                <ul className="mt-1 list-inside list-disc text-[10px] text-amber-200/90">
                  {r.notTriggeredReasons.map((code) => (
                    <li key={code}>{formatNotTriggeredReason(code)}</li>
                  ))}
                </ul>
              ) : r.timingState === 'triggered' ? (
                <p className="mt-1 text-[10px] text-emerald-200/90">Trigger conditions met on last evaluation.</p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function LiveEngineCard() {
  const engine = useSignalEngine();
  const timing = useMemo(() => {
    let triggered = 0;
    let ready = 0;
    let developing = 0;
    for (const s of engine.signals) {
      if (isSignalTimingTriggered(s)) triggered += 1;
      else if (s.timingState === 'ready') ready += 1;
      else if (s.timingState === 'developing') developing += 1;
    }
    return { triggered, ready, developing };
  }, [engine.signals]);

  const topSignals = useMemo(
    () =>
      [...engine.signals]
        .sort((a, b) => {
          const t = (isSignalTimingTriggered(b) ? 1 : 0) - (isSignalTimingTriggered(a) ? 1 : 0);
          if (t !== 0) return t;
          return b.setupScore - a.setupScore;
        })
        .slice(0, 8),
    [engine.signals],
  );

  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold text-white">Live engine (Bybit data)</h2>
      <p className="mt-2 text-xs text-sigflo-muted">
        Mode {engine.mode} · {engine.connection}
        {engine.loading ? ' · bootstrapping' : ''}
        {engine.error ? ` · error: ${engine.error}` : ''}
      </p>
      <p className="mt-1 text-xs text-sigflo-muted">
        {engine.signals.length} in signal book · triggered {timing.triggered} · ready {timing.ready} · developing{' '}
        {timing.developing}
      </p>
      <p className="mt-2 text-[11px] text-amber-200/90">
        Top bar &quot;Triggered&quot; counts pairs where timing lifecycle fired — not detector qualification alone. Scanner
        Lab breakout at candle 74 is a crafted scenario; live markets may have developing setups without a timing trigger
        yet.
      </p>
      {topSignals.length === 0 ? (
        <p className="mt-3 text-xs text-sigflo-muted">No live signals in book yet.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {topSignals.map((s) => (
            <div
              key={s.id}
              className="rounded-xl border border-sigflo-border bg-sigflo-bg/45 px-3 py-2"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-white">
                  {s.pair} · {s.side} · {s.setupType}
                </p>
                <p className="text-xs text-emerald-300">{s.setupScore}</p>
              </div>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-sigflo-muted">
                timing: {s.timingState ?? 'n/a'}
                {s.triggerType && s.triggerType !== 'unknown' ? ` · ${s.triggerType.replaceAll('_', ' ')}` : ''}
                {isSignalTimingTriggered(s) ? ' · counts as triggered' : ' · not triggered yet'}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function ScannerDiagnosticsCard({
  rows,
  debugEnabled,
  onToggleDebug,
}: {
  rows: ScannerDiagnosticRow[];
  debugEnabled: boolean;
  onToggleDebug: () => void;
}) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-white">Timing lifecycle diagnostics</h2>
        <button
          type="button"
          onClick={onToggleDebug}
          className={`rounded-lg border px-2 py-1 text-[11px] font-semibold transition ${
            debugEnabled
              ? 'border-emerald-500/35 bg-emerald-500/15 text-emerald-200'
              : 'border-white/[0.12] bg-white/[0.04] text-sigflo-muted hover:text-white'
          }`}
        >
          {debugEnabled ? 'Debug logs on' : 'Enable console logs'}
        </button>
      </div>
      <p className="mb-3 text-xs text-sigflo-muted">
        Shows latest in-memory scanner lifecycle evaluations (up to 20). Focus: first trigger capture, freshness decay, and late penalties.
      </p>
      {rows.length === 0 ? (
        <p className="text-xs text-sigflo-muted">
          No diagnostics yet. Wait for live scanner updates, then refresh this view.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={`${r.symbol}-${r.ts}`} className="rounded-xl border border-sigflo-border bg-sigflo-bg/45 px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <p className="text-xs font-medium text-white">
                  {r.symbol} · {r.setupType}
                </p>
                <p className="text-[11px] text-sigflo-muted">{new Date(r.ts).toLocaleTimeString()}</p>
              </div>
              <p className="mt-1 text-[11px] text-cyan-200">
                state: {r.state} · trigger: {r.triggerType}
              </p>
              <p className="mt-1 text-[11px] text-sigflo-muted">
                setup {r.setupScore} · timing {r.timingScore} · freshness {r.entryFreshnessScore} · room {r.roomToTargetScore} · actionability {r.actionabilityScore}
              </p>
              <p className="mt-1 text-[11px] text-sigflo-muted">
                ideal {r.idealEntryPrice != null ? r.idealEntryPrice.toFixed(4) : '—'} · current {r.currentPrice.toFixed(4)} · atrExt {r.atrExtensionFromIdeal.toFixed(2)} · since trigger {r.candlesSinceTrigger ?? '—'} · since peak {r.candlesSincePeakTiming ?? '—'}
              </p>
              <p className="mt-1 text-[10px] text-rose-200/85">
                penalties: late {r.penalties.candlesLatePenalty.toFixed(1)}, atr {r.penalties.atrExtensionPenalty.toFixed(1)}, % {r.penalties.percentExtensionPenalty.toFixed(1)}, impulse {r.penalties.postTriggerImpulsePenalty.toFixed(1)}, crowded {r.penalties.crowdedLevelPenalty.toFixed(1)}, rr {r.penalties.rrCompressionPenalty.toFixed(1)}
              </p>
              <p className="mt-1 text-[10px] text-emerald-200/85">positives: {r.positiveFactors.length ? r.positiveFactors.join(', ') : 'none'}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function EngineDebugScreen() {
  const navigate = useNavigate();
  const engine = useSignalEngine();
  const [rerunTick, setRerunTick] = useState(0);
  const [lastRerunAt, setLastRerunAt] = useState(() => new Date());
  const [diagTick, setDiagTick] = useState(0);
  const [debugEnabled, setDebugEnabled] = useState<boolean>(() =>
    Boolean((globalThis as { __SIGFLO_SCANNER_DEBUG__?: boolean }).__SIGFLO_SCANNER_DEBUG__),
  );
  const determinism = useMemo(() => runScannerDeterminismCheck(), [rerunTick]);
  const diagnostics = useMemo(() => readScannerDiagnostics(), [diagTick, rerunTick]);
  const pipelineHealth = useMemo(() => getScannerPipelineHealth(), [diagTick, rerunTick]);

  useEffect(() => {
    const id = window.setInterval(() => setDiagTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="space-y-4 pb-6">
      <header>
        <div className="mb-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-xs font-semibold text-sigflo-muted transition hover:bg-white/[0.08] hover:text-white"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setRerunTick((n) => n + 1);
                setLastRerunAt(new Date());
              }}
              className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/15"
            >
              Rerun check
            </button>
            <Link
              to="/scanner-lab"
              className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1.5 text-xs font-semibold text-violet-200 transition hover:bg-violet-500/15"
            >
              Open Lab
            </Link>
          </div>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Engine Debug</h1>
        <p className="mt-1 text-sm text-sigflo-muted">
          Pass 1/2 use <strong className="font-medium text-white/90">synthetic fixture candles</strong> (not live Bybit).
          Same <code className="text-xs">buildSignalFromMarket</code> path as production. Developing = detector qualified,
          timing not fired.
        </p>
        <p className="mt-1 text-[11px] text-sigflo-muted">
          Reruns: {rerunTick} · Last run: {lastRerunAt.toLocaleTimeString()}
        </p>
      </header>

      <LiveEngineCard />
      <PipelineHealthCard health={pipelineHealth} engineLoading={engine.loading} />
      <PassCard frame={determinism.firstPass} title={`Pass 1: initial emit #${rerunTick + 1}`} />
      <PassCard frame={determinism.secondPass} title={`Pass 2: cooldown and dedup #${rerunTick + 1}`} />
      <ScannerDiagnosticsCard
        rows={diagnostics}
        debugEnabled={debugEnabled}
        onToggleDebug={() => {
          const next = !debugEnabled;
          (globalThis as { __SIGFLO_SCANNER_DEBUG__?: boolean }).__SIGFLO_SCANNER_DEBUG__ = next;
          setDebugEnabled(next);
        }}
      />
    </div>
  );
}
