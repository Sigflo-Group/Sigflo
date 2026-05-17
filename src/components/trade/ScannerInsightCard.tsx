import { useEffect, useMemo, useState } from 'react';
import { MarketDeepAnalysisSheet } from '@/components/trade/MarketDeepAnalysisSheet';
import { MarketNewsScanSheet } from '@/components/news/MarketNewsScanSheet';
import { MarketPostureBar } from '@/components/shared/MarketPostureBar';
import { StatusChip } from '@/components/trade/StatusChip';
import { requestAssistantSuggestion } from '@/services/ai/client';
import { humanizeTraderCopy } from '@/lib/marketConditionsCopy';
import { interpretSignal } from '@/lib/signalInterpretation';
import { spotBaseAssetFromOrderSymbol } from '@/lib/spotSymbol';
import { buildTradeTimingUiModel } from '@/lib/tradeSetupExecutionModel';
import type { AiStructuredAnalysis, GroundedMarketContext } from '@/types/aiGrounded';
import type { MarketRowStatus } from '@/types/markets';
import type { CryptoSignal } from '@/types/signal';
import type { ExecutionQuality } from '@/types/trade';

/** Scanner “action” line when already in a position — descriptive feedback only. */
function inPositionFeedbackLine(executionQuality: ExecutionQuality | null): string {
  if (executionQuality === 'strong') return 'Fill is close to plan entry — execution reads strong.';
  if (executionQuality === 'okay') return 'Fill is within an acceptable range vs plan entry.';
  if (executionQuality === 'weak') return 'Fill is wider vs optimal entry — the score reflects that.';
  return 'Position is open — scores blend the setup with how entry matched the plan.';
}

/** 2–3 supporting bullets drawn from the AI explanation and structural cues. */
function supportingBullets(signal: CryptoSignal): string[] {
  const raw = humanizeTraderCopy(signal.aiExplanation.trim());
  const sentences = raw
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter((s) => s.length > 8);
  const out: string[] = [];
  for (const s of sentences) {
    if (out.length >= 3) break;
    if (!out.some((o) => o.toLowerCase() === s.toLowerCase())) out.push(s);
  }
  // Supplement with structural reads if AI copy is short.
  if (out.length < 2 && signal.reasons && signal.reasons.length > 0) {
    for (const r of signal.reasons) {
      if (out.length >= 3) break;
      out.push(r);
    }
  }
  return out.slice(0, 3);
}

export function ScannerInsightCard({
  signal,
  status,
  tradeScore,
  groundedContext,
  hasOpenPosition = false,
  executionQuality = null,
}: {
  signal: CryptoSignal;
  status: MarketRowStatus;
  tradeScore: number;
  groundedContext: GroundedMarketContext;
  hasOpenPosition?: boolean;
  executionQuality?: ExecutionQuality | null;
}) {
  const [aiResult, setAiResult] = useState<{
    headline: string;
    body: string;
    source: 'local' | 'remote';
    structured?: AiStructuredAnalysis;
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [deepSheetOpen, setDeepSheetOpen] = useState(false);
  const [newsScanOpen, setNewsScanOpen] = useState(false);
  const baseAsset = useMemo(() => spotBaseAssetFromOrderSymbol(signal.pair), [signal.pair]);
  const interp = useMemo(() => interpretSignal(signal, status), [signal, status]);
  const bullets = useMemo(() => supportingBullets(signal), [signal]);
  const timingUi = buildTradeTimingUiModel({
    inPosition: hasOpenPosition,
    marketStatus: status,
    executionQuality: executionQuality ?? null,
  });
  const action = hasOpenPosition
    ? inPositionFeedbackLine(executionQuality ?? null)
    : interp.patienceLabel;
  const sideChipClass =
    signal.side === 'long'
      ? 'border-emerald-400/30 bg-emerald-500/12 text-emerald-300'
      : 'border-rose-400/30 bg-rose-500/12 text-rose-300';

  useEffect(() => {
    setDeepSheetOpen(false);
    setNewsScanOpen(false);
  }, [signal.id]);

  const runExplain = async () => {
    setAiLoading(true);
    const result = await requestAssistantSuggestion({
      action: 'explain',
      signal,
      status,
      tradeScore,
      context: groundedContext,
    });
    setAiResult({
      headline: result.headline,
      body: result.body,
      source: result.source,
      structured: result.structured,
    });
    setAiLoading(false);
  };

  const runWatch = async () => {
    setAiLoading(true);
    const result = await requestAssistantSuggestion({
      action: 'watch',
      signal,
      status,
      tradeScore,
      context: groundedContext,
    });
    setAiResult({
      headline: result.headline,
      body: result.body,
      source: result.source,
      structured: result.structured,
    });
    setAiLoading(false);
  };

  const runEntry = async () => {
    setAiLoading(true);
    const result = await requestAssistantSuggestion({
      action: 'entry',
      signal,
      status,
      tradeScore,
      context: groundedContext,
    });
    setAiResult({
      headline: result.headline,
      body: result.body,
      source: result.source,
      structured: result.structured,
    });
    setAiLoading(false);
  };

  return (
    <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/[0.08] via-sigflo-surface/95 to-emerald-500/[0.06] px-2.5 py-2.5 shadow-[0_0_30px_-16px_rgba(34,211,238,0.55)] ring-1 ring-cyan-400/10">

      {/* ── PRIMARY: market posture (what the market is doing + what to do about it) ── */}
      <MarketPostureBar signal={signal} status={status} interp={interp} variant="normal" />

      {/* ── Side badge + scanner label (secondary header) ── */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${sideChipClass}`}
        >
          {signal.side}
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300/80 shadow-[0_0_8px_-2px_rgba(34,211,238,0.5)]"
            aria-hidden
          />
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-cyan-200/80">
            Signal scanner
          </p>
        </div>
      </div>

      {/* ── SECONDARY: supporting context (collapsible) ── */}
      {bullets.length > 0 ? (
        <>
          <button
            type="button"
            onClick={() => setContextOpen((o) => !o)}
            className="mt-2 text-left text-[9px] font-bold uppercase tracking-[0.14em] text-sigflo-muted/80 transition hover:text-sigflo-muted"
            aria-expanded={contextOpen}
          >
            {contextOpen ? 'Hide context ↑' : 'Supporting context ↓'}
          </button>
          {contextOpen ? (
            <ul className="mt-1.5 list-none space-y-1.5">
              {bullets.map((line, idx) => (
                <li
                  key={`${idx}-${line.slice(0, 24)}`}
                  className="flex gap-2 text-[11px] leading-snug text-white/80"
                >
                  <span className="shrink-0 text-cyan-300/60" aria-hidden>•</span>
                  <span className="min-w-0">{line}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}

      {/* ── Entry timing row ── */}
      <div className="mt-3 rounded-lg border border-white/[0.08] bg-black/35 px-2 py-1.5 ring-1 ring-white/[0.04]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-sigflo-muted">
            Entry timing
          </span>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:flex-initial">
            <StatusChip label={timingUi.chipLabel} state={timingUi.chipState} compact />
            <span className="shrink-0 font-mono text-[9px] font-semibold tabular-nums text-cyan-200/75">
              {Math.round(tradeScore)}
            </span>
          </div>
        </div>
        {timingUi.helperText ? (
          <p className="mt-1 text-[9px] leading-snug text-sigflo-muted/90">{timingUi.helperText}</p>
        ) : null}
        {timingUi.executionLabel ? (
          <p className="mt-0.5 text-[9px] leading-snug text-white/70">{timingUi.executionLabel}</p>
        ) : null}
      </div>

      {/* Action / patience line */}
      <p className="mt-2 text-[11px] font-semibold leading-snug text-emerald-300/90">{action}</p>

      {/* ── Quick read (AI buttons) ── */}
      <div className="mt-3 rounded-lg border border-white/[0.06] bg-black/20 p-2">
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-sigflo-muted">Quick read</span>
          <div className="flex flex-wrap justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setNewsScanOpen(true)}
              className="rounded-md border border-white/[0.08] bg-white/[0.05] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-sigflo-text/95 transition hover:bg-white/[0.09]"
            >
              {baseAsset} news
            </button>
            <button
              type="button"
              onClick={() => setDeepSheetOpen(true)}
              className="rounded-md border border-cyan-400/20 bg-cyan-500/[0.08] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-cyan-100/95 transition hover:bg-cyan-500/14"
            >
              Full thesis
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={runExplain}
            disabled={aiLoading}
            className="rounded-md border border-white/[0.06] bg-white/[0.04] px-2 py-1 text-[10px] font-medium leading-tight text-sigflo-text/95 transition hover:bg-white/[0.08]"
          >
            Explain setup
          </button>
          <button
            type="button"
            onClick={runWatch}
            disabled={aiLoading}
            className="rounded-md border border-white/[0.06] bg-white/[0.04] px-2 py-1 text-[10px] font-medium leading-tight text-sigflo-text/95 transition hover:bg-white/[0.08]"
          >
            What to watch
          </button>
          <button
            type="button"
            onClick={runEntry}
            disabled={aiLoading}
            className="rounded-md border border-white/[0.06] bg-white/[0.04] px-2 py-1 text-[10px] font-medium leading-tight text-sigflo-text/95 transition hover:bg-white/[0.08]"
          >
            Improve entry
          </button>
        </div>
        {aiLoading ? (
          <p className="mt-2 text-[10px] text-sigflo-muted">Assistant is thinking...</p>
        ) : aiResult ? (
          <div className="mt-2 rounded-md border border-white/[0.05] bg-black/30 p-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold leading-snug text-white/95">{aiResult.headline}</p>
              <span
                className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                  aiResult.source === 'remote'
                    ? 'border-emerald-400/35 bg-emerald-500/15 text-emerald-200'
                    : 'border-amber-400/35 bg-amber-500/15 text-amber-200'
                }`}
              >
                {aiResult.source === 'remote' ? 'AI live' : 'Fallback'}
              </span>
            </div>
            <p className="mt-1 whitespace-pre-line text-[10px] leading-relaxed text-sigflo-muted">
              {humanizeTraderCopy(aiResult.body)}
            </p>
            {aiResult.structured ? (
              <div className="mt-2 space-y-1 rounded border border-white/[0.05] bg-black/20 px-2 py-1.5 text-[9px] text-sigflo-muted">
                <p className="font-bold uppercase tracking-[0.12em] text-cyan-200/70">Grounded summary</p>
                <p>
                  Bias <span className="font-semibold text-white/90">{aiResult.structured.bias}</span> · Confidence{' '}
                  <span className="font-mono tabular-nums text-white/85">{aiResult.structured.confidence}</span> · Valid{' '}
                  <span className="text-white/85">{aiResult.structured.trade_valid ? 'yes' : 'no'}</span>
                </p>
                {aiResult.structured.levels_used.length > 0 ? (
                  <p className="font-mono text-[8px] text-white/70">
                    Levels used:{' '}
                    {aiResult.structured.levels_used
                      .map((n) => n.toLocaleString('en-US', { maximumFractionDigits: 8 }))
                      .join(', ')}
                  </p>
                ) : (
                  <p className="text-[8px] text-sigflo-muted/90">Levels used: none (package-only)</p>
                )}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 text-[10px] text-sigflo-muted">Assistant is ready for this setup.</p>
        )}
      </div>

      <MarketDeepAnalysisSheet
        open={deepSheetOpen}
        onClose={() => setDeepSheetOpen(false)}
        signal={signal}
        status={status}
        tradeScore={tradeScore}
        groundedContext={groundedContext}
        quickRead={aiResult ? { headline: aiResult.headline, body: aiResult.body } : null}
      />

      <MarketNewsScanSheet
        open={newsScanOpen}
        onClose={() => setNewsScanOpen(false)}
        focusAsset={baseAsset}
        marketRegime={groundedContext.marketRegime}
      />
    </div>
  );
}
