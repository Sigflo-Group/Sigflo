import { marketConditionLabel } from '@/lib/marketConditionsCopy';
import type { SignalEventStatus, SignalLifecycleEvent } from '@/types/signal';

export type TradeReplayMarkerKind =
  | 'signal_created'
  | 'lifecycle_note'
  | 'structure_peak'
  | 'structure_stress'
  | 'breakout_attempt'
  | 'rejection'
  | 'support_test'
  | 'invalidation'
  | 'confirmation'
  | 'regime_shift'
  | 'outcome';

export type TradeReplayUiEvent = {
  kind: TradeReplayMarkerKind;
  label: string;
  detail?: string;
};

export type TradeReplayFrame = {
  timestamp: number;
  price: number;
  signalState: SignalEventStatus | string;
  bias: SignalLifecycleEvent['bias'];
  /** Confidence at signal creation (only value persisted on the lifecycle record). */
  confidence: number;
  marketRegime: string;
  momentumState: 'strengthening' | 'weakening' | 'flat' | 'unknown';
  commentary: string;
  events: TradeReplayUiEvent[];
  /** 0–100 structural readout from price vs entry (excursion), not a stored AI confidence series. */
  structurePressure: number;
};

export type TradeReplayMarker = {
  id: string;
  frameIndex: number;
  timestamp: number;
  kind: TradeReplayMarkerKind;
  label: string;
};

export type TradeReplayModel = {
  frames: TradeReplayFrame[];
  markers: TradeReplayMarker[];
  story: string;
  title: string;
  disclaimer: string;
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function signedMove(event: SignalLifecycleEvent, price: number): number {
  const atr = Math.max(1e-8, event.entryContext.atrAtCreation);
  if (event.bias === 'long') return (price - event.entryContext.entryPrice) / atr;
  return (event.entryContext.entryPrice - price) / atr;
}

function adverseMove(event: SignalLifecycleEvent, price: number): number {
  const atr = Math.max(1e-8, event.entryContext.atrAtCreation);
  if (event.bias === 'long') return (event.entryContext.entryPrice - price) / atr;
  return (price - event.entryContext.entryPrice) / atr;
}

function inferStateFromExcursion(event: SignalLifecycleEvent, price: number): SignalEventStatus {
  const favorable = signedMove(event, price);
  const adverse = adverseMove(event, price);
  if (favorable >= 0.9) return 'confirmed';
  if (favorable >= 0.5) return 'evolving';
  if (favorable >= 0.2) return 'active';
  if (adverse >= 0.65) return 'rejected';
  return 'emerging';
}

function momentumFromText(text: string): TradeReplayFrame['momentumState'] {
  const t = text.toLowerCase();
  if (t.includes('weakening') || t.includes('reject') || t.includes('fakeout') || t.includes('failed')) return 'weakening';
  if (t.includes('strengthen') || t.includes('confirmed') || t.includes('continuation') || t.includes('target')) return 'strengthening';
  if (t.includes('flat') || t.includes('sideways') || t.includes('chop')) return 'flat';
  return 'unknown';
}

function classifyNoteEvents(note: string, setupType: SignalLifecycleEvent['setupType']): TradeReplayUiEvent[] {
  const lower = note.toLowerCase();
  const out: TradeReplayUiEvent[] = [{ kind: 'lifecycle_note', label: 'Lifecycle note', detail: note }];

  if (lower.includes('fakeout') || lower.includes('invalidation')) {
    out.push({ kind: 'invalidation', label: 'Invalidation', detail: note });
  }
  if (lower.includes('reject') || lower.includes('weakness')) {
    out.push({ kind: 'rejection', label: 'Rejection / stress', detail: note });
  }
  if (lower.includes('support') || lower.includes('retest')) {
    out.push({ kind: 'support_test', label: 'Support / retest', detail: note });
  }
  if (lower.includes('sideways') || lower.includes('chop') || lower.includes('range')) {
    out.push({ kind: 'regime_shift', label: 'Choppy market context', detail: note });
  }
  if (lower.includes('target') || lower.includes('continuation') || lower.includes('confirmed')) {
    out.push({ kind: 'confirmation', label: 'Confirmation / follow-through', detail: note });
  }
  if (setupType === 'breakout' && (lower.includes('break') || lower.includes('attempt'))) {
    out.push({ kind: 'breakout_attempt', label: 'Breakout attempt', detail: note });
  }
  return out;
}

function resolutionPrice(event: SignalLifecycleEvent): number {
  if (event.outcome === 'win') return event.targetLevel;
  if (event.outcome === 'loss') return event.invalidationLevel;
  if (event.outcome === 'neutral') return event.entryContext.entryPrice;
  const { entryPrice, atrAtCreation } = event.entryContext;
  const atr = Math.max(1e-8, atrAtCreation);
  if (event.bias === 'long') return entryPrice + event.maxFavorableExcursion * atr;
  return entryPrice - event.maxFavorableExcursion * atr;
}

function priceAlongArc(
  event: SignalLifecycleEvent,
  t: number,
  t0: number,
  tEnd: number,
  pMfe: number,
  pMae: number,
  pEnd: number,
): number {
  if (tEnd <= t0) return event.entryContext.entryPrice;
  const u = clamp((t - t0) / (tEnd - t0), 0, 1);
  const entry = event.entryContext.entryPrice;
  if (u <= 0.33) {
    const k = u / 0.33;
    return entry + (pMfe - entry) * k;
  }
  if (u <= 0.66) {
    const k = (u - 0.33) / 0.33;
    return pMfe + (pMae - pMfe) * k;
  }
  const k = (u - 0.66) / 0.34;
  return pMae + (pEnd - pMae) * k;
}

function buildStory(event: SignalLifecycleEvent): string {
  const conditions = marketConditionLabel(event.entryContext.marketRegime ?? null);
  const head = `Signal started with ${event.bias === 'long' ? 'bullish' : 'bearish'} ${event.setupType} structure and ${event.confidence.toFixed(0)}% confidence in a ${conditions.toLowerCase()}.`;
  const body = event.notes
    .slice(1)
    .filter(Boolean)
    .join(' ');
  const tail =
    event.outcome === 'win'
      ? 'Continuation reached the modeled target first.'
      : event.outcome === 'loss'
        ? event.notes.some((n) => n.toLowerCase().includes('fakeout'))
          ? 'A fakeout-style failure: the initial impulse did not hold through invalidation.'
          : 'Invalidation was reached before the target path played out.'
        : event.outcome === 'neutral'
          ? 'Price action stayed two-sided without a clean resolution in the tracked window.'
          : event.status === 'archived'
            ? 'This lifecycle entry was archived after the observation window.'
            : 'Lifecycle may still be monitored for fresh structure.';

  return [head, body || null, tail].filter(Boolean).join(' ');
}

/**
 * Read-only replay: reconstructs a timeline from `SignalLifecycleEvent` notes, creation metadata,
 * and final MFE/MAE/outcome. Does not call signal detectors or mutate stored data.
 */
export function buildTradeReplay(event: SignalLifecycleEvent, nowMs: number): TradeReplayModel {
  const { entryPrice, atrAtCreation } = event.entryContext;
  const atr = Math.max(1e-8, atrAtCreation);
  const t0 = event.timestamp;
  const tEnd = event.completedAt ?? Math.max(t0 + 30 * 60 * 1000, nowMs);

  const pMfe = event.bias === 'long' ? entryPrice + event.maxFavorableExcursion * atr : entryPrice - event.maxFavorableExcursion * atr;
  const pMae = event.bias === 'long' ? entryPrice - event.maxAdverseExcursion * atr : entryPrice + event.maxAdverseExcursion * atr;
  const pEnd = resolutionPrice(event);

  const regimeLabel = marketConditionLabel(event.entryContext.marketRegime);

  type Draft = {
    timestamp: number;
    price: number;
    commentary: string;
    events: TradeReplayUiEvent[];
    phase: 'create' | 'note' | 'peak' | 'stress' | 'outcome';
  };

  const drafts: Draft[] = [];

  drafts.push({
    timestamp: t0,
    price: entryPrice,
    commentary: event.notes[0] ?? 'Signal created and queued for lifecycle monitoring.',
    events: [{ kind: 'signal_created', label: 'Signal created', detail: `${event.setupType} · ${event.bias}` }],
    phase: 'create',
  });

  const noteList = event.notes.slice(1);
  for (let i = 0; i < noteList.length; i++) {
    const note = noteList[i]!;
    const frac = noteList.length > 0 ? (i + 1) / (noteList.length + 1) : 0.5;
    const ts = Math.round(t0 + frac * (tEnd - t0));
    const price = priceAlongArc(event, ts, t0, tEnd, pMfe, pMae, pEnd);
    drafts.push({
      timestamp: ts,
      price,
      commentary: note,
      events: classifyNoteEvents(note, event.setupType),
      phase: 'note',
    });
  }

  const tPeak = Math.round(t0 + 0.28 * (tEnd - t0));
  const tStress = Math.round(t0 + 0.52 * (tEnd - t0));

  drafts.push({
    timestamp: tPeak,
    price: pMfe,
    commentary: `Favorable excursion peaked near ${event.maxFavorableExcursion.toFixed(2)} ATR from entry.`,
    events: [{ kind: 'structure_peak', label: 'Structure: favorable peak', detail: `${event.maxFavorableExcursion.toFixed(2)} ATR MFE` }],
    phase: 'peak',
  });

  drafts.push({
    timestamp: tStress,
    price: pMae,
    commentary: `Adverse excursion reached about ${event.maxAdverseExcursion.toFixed(2)} ATR from entry.`,
    events: [{ kind: 'structure_stress', label: 'Structure: stress test', detail: `${event.maxAdverseExcursion.toFixed(2)} ATR MAE` }],
    phase: 'stress',
  });

  const outcomeLabel =
    event.outcome === 'win' ? 'Outcome: win (target path)' : event.outcome === 'loss' ? 'Outcome: loss (invalidation path)' : event.outcome === 'neutral' ? 'Outcome: neutral (chop)' : `Status: ${event.status}`;

  drafts.push({
    timestamp: tEnd,
    price: pEnd,
    commentary: outcomeLabel,
    events: [{ kind: 'outcome', label: 'Resolution', detail: outcomeLabel }],
    phase: 'outcome',
  });

  const phaseOrder: Record<Draft['phase'], number> = { create: 0, note: 1, peak: 2, stress: 3, outcome: 4 };
  drafts.sort((a, b) => a.timestamp - b.timestamp || phaseOrder[a.phase] - phaseOrder[b.phase]);

  const merged: Draft[] = [];
  for (const d of drafts) {
    const prev = merged.at(-1);
    if (prev && Math.abs(prev.timestamp - d.timestamp) < 45_000 && d.phase === 'note' && prev.phase !== 'note') {
      merged[merged.length - 1] = {
        ...prev,
        commentary: `${prev.commentary} · ${d.commentary}`,
        events: [...prev.events, ...d.events],
      };
      continue;
    }
    merged.push(d);
  }

  const frames: TradeReplayFrame[] = merged.map((d) => {
    const price = d.price;
    const favorable = signedMove(event, price);
    const adverse = adverseMove(event, price);
    const structurePressure = clamp(48 + 26 * favorable - 22 * adverse, 0, 100);
    const state = inferStateFromExcursion(event, price);
    const mom = momentumFromText(d.commentary);

    return {
      timestamp: d.timestamp,
      price,
      signalState: d.phase === 'outcome' ? event.status : state,
      bias: event.bias,
      confidence: event.confidence,
      marketRegime: regimeLabel,
      momentumState: mom,
      commentary: d.commentary,
      events: d.events,
      structurePressure,
    };
  });

  const markers: TradeReplayMarker[] = [];
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i]!;
    for (const ev of f.events) {
      markers.push({
        id: `${i}-${ev.kind}-${f.timestamp}`,
        frameIndex: i,
        timestamp: f.timestamp,
        kind: ev.kind,
        label: ev.label,
      });
    }
  }

  const title = `${event.symbol.replace(/USDT$/i, '')} · ${event.bias.toUpperCase()} · replay`;

  return {
    frames,
    markers,
    story: buildStory(event),
    title,
    disclaimer:
      'Replay uses stored lifecycle notes, creation confidence, and final MFE/MAE/outcome. Market Memory is a live symbol snapshot in the engine (not a historical time series here). Per-bar AI confidence is not persisted; the gradient path is an ATR excursion readout for context.',
  };
}
