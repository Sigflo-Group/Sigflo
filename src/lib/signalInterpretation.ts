/**
 * Signal interpretation synthesis layer.
 *
 * Translates raw detector/engine output into calm, decision-oriented language
 * for non-professional users. All functions are pure and deterministic.
 *
 * Design philosophy:
 *  - One coherent market posture, not multiple conflicting detector labels
 *  - Human phrases instead of raw quant values (RSI 100 → "Extremely overheated")
 *  - Explicit patience guidance (act / plan / watch / avoid)
 *  - Empty / insufficient-data states feel intentional, not broken
 */

import type { CryptoSignal } from '@/types/signal';
import type { MarketRowStatus } from '@/types/markets';

// ─── types ────────────────────────────────────────────────────────────────────

/** One of eight market conditions readable at a glance. */
export type SignalPosture =
  | 'breakout_active'    // triggered with momentum behind it
  | 'breakout_building'  // setup compressing / approaching key level
  | 'trend_stretched'    // overextended — late entry risk
  | 'pullback_holding'   // triggered at support, buyers present
  | 'pullback_forming'   // retracing toward mean, not confirmed
  | 'momentum_fading'    // post-peak, entry quality declining
  | 'setup_forming'      // early signals, not ready
  | 'unclear';           // not enough structure to read

export type ChaseRisk = 'low' | 'moderate' | 'high';
export type PatientRecommendation = 'act' | 'plan_entry' | 'watch' | 'avoid';
export type ConfidenceTier = 'high' | 'strong' | 'moderate' | 'low';

/** The full interpretation ready for UI rendering — no raw quant values exposed. */
export interface SignalInterpretation {
  posture: SignalPosture;
  postureLabel: string;
  postureColor: 'emerald' | 'cyan' | 'amber' | 'slate';
  actionHeadline: string;
  supportingNote: string;
  confidenceTier: ConfidenceTier;
  confidenceLabel: string;
  chaseRisk: ChaseRisk;
  chaseRiskLabel: string;
  patience: PatientRecommendation;
  patienceLabel: string;
  /** Human-readable RSI phrase — never a raw number in the default view. */
  rsiLabel: string;
  /** Human-readable volatility phrase. */
  volatilityLabel: string;
}

// ─── RSI / volatility humanisation ───────────────────────────────────────────

function rsiToLabel(rsi: number | undefined): string {
  if (rsi === undefined || rsi === null) return 'Not enough data';
  if (rsi >= 80) return 'Extremely overheated';
  if (rsi >= 74) return 'Overheated';
  if (rsi >= 65) return 'Momentum climbing';
  if (rsi >= 55) return 'Healthy range';
  if (rsi >= 45) return 'Neutral zone';
  if (rsi >= 35) return 'Cooling off';
  if (rsi >= 26) return 'Oversold';
  return 'Extremely oversold';
}

function volatilityToLabel(signal: CryptoSignal): string {
  const vs = signal.marketState?.volatilityState;
  const regime = signal.marketState?.regime;
  if (vs === 'expanding' && regime === 'volatile') return 'Elevated — wide stops needed';
  if (vs === 'expanding') return 'Above average';
  if (vs === 'contracting' && regime === 'compression') return 'Compressed — squeeze potential';
  if (vs === 'contracting') return 'Quiet range';
  return 'Normal';
}

// ─── posture derivation ────────────────────────────────────────────────────────

function derivePosture(signal: CryptoSignal, status: MarketRowStatus): SignalPosture {
  const rsi = signal.facts?.rsi;
  // RSI extremity is direction-relative: overbought (>74) is the danger zone for longs,
  // oversold (<26) is the mirror danger zone for shorts.
  const rsiExtreme = rsi !== undefined && (signal.side === 'short' ? rsi < 26 : rsi > 74);

  if (signal.setupType === 'overextended') return 'trend_stretched';

  if (signal.setupType === 'breakout') {
    if (status === 'triggered') return rsiExtreme ? 'trend_stretched' : 'breakout_active';
    if (status === 'extended') return 'momentum_fading';
    if (rsiExtreme) return 'trend_stretched';
    if (signal.setupScore >= 45) return 'breakout_building';
    return 'unclear';
  }

  if (signal.setupType === 'pullback') {
    if (status === 'triggered') return 'pullback_holding';
    if (status === 'extended') return 'momentum_fading';
    if (status === 'developing' || status === 'idle') return 'pullback_forming';
    return 'pullback_forming';
  }

  if (signal.setupScore < 45) return 'unclear';
  return 'setup_forming';
}

function postureToLabel(posture: SignalPosture): string {
  const labels: Record<SignalPosture, string> = {
    breakout_active:   'Breakout active',
    breakout_building: 'Momentum building',
    trend_stretched:   'Trend stretched',
    pullback_holding:  'Pullback holding',
    pullback_forming:  'Pullback forming',
    momentum_fading:   'Momentum fading',
    setup_forming:     'Setup forming',
    unclear:           'No clear read',
  };
  return labels[posture];
}

function postureToColor(posture: SignalPosture): SignalInterpretation['postureColor'] {
  if (posture === 'breakout_active' || posture === 'pullback_holding') return 'emerald';
  if (posture === 'breakout_building' || posture === 'pullback_forming') return 'cyan';
  if (posture === 'trend_stretched' || posture === 'momentum_fading') return 'amber';
  return 'slate';
}

// ─── chase risk ───────────────────────────────────────────────────────────────

function deriveChaseRisk(signal: CryptoSignal, status: MarketRowStatus): ChaseRisk {
  const rsi = signal.facts?.rsi;
  const ext = signal.facts?.extensionAtr;
  const isShort = signal.side === 'short';

  if (signal.setupType === 'overextended' || status === 'overextended') return 'high';
  if (rsi !== undefined && (isShort ? rsi < 26 : rsi > 74)) return 'high';
  if (ext !== undefined && ext > 1.5) return 'high';
  if (signal.riskTag === 'High Risk') return 'high';

  if (rsi !== undefined && (isShort ? rsi < 35 : rsi > 65)) return 'moderate';
  if (signal.riskTag === 'Medium Risk' && status !== 'triggered') return 'moderate';
  if (status === 'extended') return 'moderate';

  return 'low';
}

function chaseRiskToLabel(risk: ChaseRisk): string {
  if (risk === 'low') return 'Clean entry zone';
  if (risk === 'moderate') return 'Moderate risk';
  return 'Avoid chasing';
}

// ─── confidence ───────────────────────────────────────────────────────────────

function deriveConfidenceTier(score: number): ConfidenceTier {
  if (score >= 80) return 'high';
  if (score >= 65) return 'strong';
  if (score >= 45) return 'moderate';
  return 'low';
}

function confidenceTierToLabel(tier: ConfidenceTier): string {
  const labels: Record<ConfidenceTier, string> = {
    high:     'High confidence',
    strong:   'Moderate confidence',
    moderate: 'Developing setup',
    low:      'Low confidence',
  };
  return labels[tier];
}

// ─── patience ────────────────────────────────────────────────────────────────

function derivePatience(
  signal: CryptoSignal,
  status: MarketRowStatus,
  chaseRisk: ChaseRisk,
): PatientRecommendation {
  if (chaseRisk === 'high' || signal.setupType === 'overextended') return 'avoid';
  if (status === 'triggered' && signal.setupScore >= 60) return 'act';
  if (status === 'extended' || status === 'idle') return 'watch';
  if (status === 'developing' && signal.setupScore >= 65) return 'plan_entry';
  return 'watch';
}

function patienceToLabel(patience: PatientRecommendation): string {
  const labels: Record<PatientRecommendation, string> = {
    act:        'Entry conditions open',
    plan_entry: 'Start planning entry',
    watch:      'Wait for confirmation',
    avoid:      'Avoid chasing here',
  };
  return labels[patience];
}

// ─── action headline (the primary user-facing line) ───────────────────────────

function buildActionHeadline(
  posture: SignalPosture,
  signal: CryptoSignal,
  patience: PatientRecommendation,
): string {
  const pair = signal.pair;

  switch (posture) {
    case 'breakout_active':
      return patience === 'act'
        ? `${pair} is breaking out. Conditions are open — entry is reasonable here.`
        : `${pair} has broken out but momentum is elevated. A slight pullback improves the entry.`;

    case 'breakout_building':
      return patience === 'plan_entry'
        ? `Momentum is building in ${pair}. Plan your entry around the breakout level.`
        : `${pair} is coiling. Wait for price to close through the key level before acting.`;

    case 'trend_stretched':
      return `${pair} is stretched well beyond trend. Late entries here carry elevated reversal risk — patience is better.`;

    case 'pullback_holding':
      return `${pair} pulled back and buyers are holding. Continuation looks favorable if this level stays intact.`;

    case 'pullback_forming':
      return `${pair} is pulling back toward the trend mean. Not confirmed yet — watch the next few candles.`;

    case 'momentum_fading':
      return `The ${pair} momentum window is closing. Entry quality has declined — better to wait for a fresh setup.`;

    case 'setup_forming':
      return `${pair} conditions are still developing. The setup is not ready to act on yet — add to watchlist.`;

    case 'unclear':
      return `${pair} structure is mixed right now. No clear edge — watch and wait for cleaner conditions.`;
  }
}

// ─── supporting note (secondary context) ─────────────────────────────────────

function buildSupportingNote(posture: SignalPosture, signal: CryptoSignal): string {
  // Prefer an existing human-written warning or reason if available.
  if (signal.warnings && signal.warnings.length > 0) return signal.warnings[0];
  if (signal.reasons && signal.reasons.length > 0) return signal.reasons[0];

  const htf = signal.higherTimeframeBias ?? signal.facts?.higherTimeframeBias;

  switch (posture) {
    case 'breakout_active':
      return htf === 'bullish' && signal.side === 'long'
        ? 'Higher timeframe trend supports continuation.'
        : 'Monitor volume — sustained follow-through confirms the breakout.';

    case 'breakout_building':
      return 'Range is tightening. A clean close above resistance can accelerate quickly.';

    case 'trend_stretched':
      return 'Price is extended well beyond the trend mean. Mean reversion typically follows.';

    case 'pullback_holding':
      return 'Buyers are defending this zone. A strong close here keeps the setup intact.';

    case 'pullback_forming':
      return 'Let the pullback settle before looking for entry. Jumping early increases risk.';

    case 'momentum_fading':
      return 'Peak timing has likely passed. The signal is still visible but entry quality is lower.';

    case 'setup_forming':
      return 'Structure is developing. Check back when the setup has had time to confirm.';

    case 'unclear':
      return signal.whyThisMatters || 'Monitor structure for confirmation before acting.';
  }
}

// ─── public API ───────────────────────────────────────────────────────────────

/**
 * Synthesise a signal + its current market status into a single, coherent
 * user-facing interpretation. Pure function — safe to call on every render.
 */
export function interpretSignal(
  signal: CryptoSignal,
  status: MarketRowStatus,
): SignalInterpretation {
  const posture = derivePosture(signal, status);
  const chaseRisk = deriveChaseRisk(signal, status);
  const confidenceScore = signal.confidence ?? signal.setupScore;
  const confidenceTier = deriveConfidenceTier(confidenceScore);
  const patience = derivePatience(signal, status, chaseRisk);

  return {
    posture,
    postureLabel: postureToLabel(posture),
    postureColor: postureToColor(posture),
    actionHeadline: buildActionHeadline(posture, signal, patience),
    supportingNote: buildSupportingNote(posture, signal),
    confidenceTier,
    confidenceLabel: confidenceTierToLabel(confidenceTier),
    chaseRisk,
    chaseRiskLabel: chaseRiskToLabel(chaseRisk),
    patience,
    patienceLabel: patienceToLabel(patience),
    rsiLabel: rsiToLabel(signal.facts?.rsi),
    volatilityLabel: volatilityToLabel(signal),
  };
}

// ─── empty state helpers ──────────────────────────────────────────────────────

/** Returns a calm "not enough data yet" message instead of dashes or zeros. */
export function emptyMetricLabel(context: 'samples' | 'history' | 'followthrough' | 'generic'): string {
  switch (context) {
    case 'samples':      return 'Still learning this setup';
    case 'history':      return 'Waiting for more history';
    case 'followthrough': return 'Not enough data yet';
    case 'generic':
    default:             return 'Collecting data';
  }
}
