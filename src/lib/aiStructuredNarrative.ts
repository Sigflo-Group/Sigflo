import type {
  AiQuickAction,
  AiStructuredAnalysis,
  AssistantResponseGrounded,
  GroundedMarketContext,
} from '@/types/aiGrounded';
import type { MarketRowStatus } from '@/types/markets';
import type { CryptoSignal } from '@/types/signal';

function entryState(status: MarketRowStatus, tradeScore: number): 'Too early' | 'Ready' | 'Too late' | 'Weak timing' {
  if (status === 'overextended' || tradeScore < 45) return 'Weak timing';
  if (status === 'triggered' && tradeScore >= 65) return 'Ready';
  if (status === 'triggered' && tradeScore < 55) return 'Too late';
  if (status === 'idle') return 'Too early';
  return 'Too early';
}

function pickLevelsForLocal(ctx: GroundedMarketContext): number[] {
  const out: number[] = [];
  const add = (n?: number) => {
    if (n == null || !Number.isFinite(n)) return;
    if (!out.some((x) => Math.abs(x - n) < 1e-8)) out.push(n);
  };
  add(ctx.lastPrice);
  add(ctx.entry);
  add(ctx.stop);
  add(ctx.target);
  return out.filter((n) => ctx.allowedPriceLevels.some((a) => Math.abs(a - n) < Math.max(1e-8, Math.abs(a) * 1e-6)));
}

export function expandStructuredToQuickNarrative(
  action: AiQuickAction,
  s: AiStructuredAnalysis,
  ctx: GroundedMarketContext,
): { headline: string; body: string } {
  const lv =
    s.levels_used.length > 0
      ? s.levels_used.map((n) => n.toLocaleString('en-US', { maximumFractionDigits: 8 })).join(', ')
      : 'none from package';
  const gaps = ctx.dataGaps.length ? `Data gaps: ${ctx.dataGaps.join(', ')}.` : '';

  const actionLabel = action === 'explain' ? 'Explain' : action === 'watch' ? 'Watch list' : 'Entry';
  const headline = `${ctx.symbol} · ${actionLabel} — ${s.bias} (${s.confidence}%)`;

  if (action === 'explain') {
    const lvShort =
      s.levels_used.length > 0
        ? s.levels_used.map((n) => n.toLocaleString('en-US', { maximumFractionDigits: 2 })).join(', ')
        : '—';
    const gapBit = ctx.dataGaps.length ? ` Missing: ${ctx.dataGaps.join(', ')}.` : '';
    const body = `${s.reasoning.trim()} ${s.notes.trim()} Levels: ${lvShort}. ${s.trade_valid ? 'Model: trade ok.' : 'Model: wait / invalid.'}${gapBit}`.trim();
    return { headline, body };
  }

  const body = `Confidence (model): ${s.confidence}/100 · Bias: ${s.bias}\n${s.reasoning}\nLevels cited: ${lv}\nTrade valid (model): ${s.trade_valid ? 'yes' : 'no'}\nNotes: ${s.notes}${gaps ? `\n${gaps}` : ''}`;
  return { headline, body };
}

export function buildLocalStructuredAnalysis(
  action: AiQuickAction,
  signal: CryptoSignal,
  status: MarketRowStatus,
  tradeScore: number,
  ctx: GroundedMarketContext,
): AssistantResponseGrounded {
  const timing = entryState(status, tradeScore);
  const levels = pickLevelsForLocal(ctx);
  const bias: AiStructuredAnalysis['bias'] = signal.side === 'long' ? 'long' : 'short';
  const conf = Math.round(tradeScore);

  let reasoning: string;
  let notes: string;
  let trade_valid: boolean;

  if (action === 'explain') {
    const b = signal.scoreBreakdown;
    reasoning = `${signal.side} ${signal.setupType} · score ${signal.setupScore}/100 · scanner "${status}" · readiness ${conf} · subs T${b.trendAlignment}/M${b.momentumQuality}/S${b.structureQuality}/P${b.volumeConfirmation}/R${b.riskConditions}.`;
    notes = `${signal.riskTag}. Timing: ${timing}.${ctx.dataGaps.includes('recent_ohlc_series') ? ' No OHLC in package.' : ''}`.trim();
    trade_valid = status !== 'overextended' && conf >= 45;
  } else if (action === 'watch') {
    const cue = signal.watchCue?.trim();
    const next = signal.watchNext?.trim();
    reasoning = cue
      ? `Primary watch from signal: ${cue}${next ? ` Next: ${next}.` : ''}`
      : `Watch the path implied by ${signal.setupType}: no extra watch lines were supplied beyond the engine context.`;
    notes = 'Use only the chart and levels in the trade plan; do not assume liquidity or order flow not in the package.';
    trade_valid = true;
  } else {
    const eq =
      signal.scoreBreakdown.trendAlignment +
      signal.scoreBreakdown.momentumQuality +
      signal.scoreBreakdown.structureQuality +
      signal.scoreBreakdown.volumeConfirmation +
      signal.scoreBreakdown.riskConditions;
    reasoning = `Internal entry-quality sum is ${eq}/100 (components are trend, momentum, structure, participation, risk only — as provided). Scanner timing: ${timing}.`;
    notes =
      status === 'overextended'
        ? 'Overextended status — new entries are usually poor risk/reward until structure resets.'
        : 'Size only after your own confirmation; the engine does not execute.';
    trade_valid = timing === 'Ready' || timing === 'Too early';
  }

  const structured: AiStructuredAnalysis = {
    bias,
    confidence: conf,
    reasoning,
    levels_used: levels,
    trade_valid,
    notes,
  };

  const { headline, body } = expandStructuredToQuickNarrative(action, structured, ctx);
  return { structured, headline, body, source: 'local' };
}
