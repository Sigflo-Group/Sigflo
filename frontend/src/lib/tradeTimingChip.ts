import type { MarketRowStatus } from '@/types/markets';

export type TradeTimingChipState = 'early' | 'developing' | 'ready' | 'invalid';

/** Alpha and line emphasis for chart trade overlays (entry / stop / target) from timing state. */
/** Chart overlay line opacity from `tradeTimingOverlayVisual` — floored so entry/target stay readable when timing is “invalid”. */
export function tradeTimingLineAlpha(
  level: 'entry' | 'stop' | 'target' | 'liquidation',
  timingAlphaScale: number,
): number {
  const a = timingAlphaScale;
  if (level === 'stop' || level === 'liquidation') {
    return Math.max(0.42, a);
  }
  return Math.max(0.35, a);
}

export function tradeTimingOverlayVisual(state: TradeTimingChipState): {
  alphaScale: number;
  /** Extra width on entry line when “ready” (subtle emphasis vs glow). */
  entryLineExtraWidth: number;
} {
  switch (state) {
    case 'early':
      return { alphaScale: 0.4, entryLineExtraWidth: 0 };
    case 'developing':
      return { alphaScale: 0.7, entryLineExtraWidth: 0 };
    case 'ready':
      return { alphaScale: 1, entryLineExtraWidth: 1 };
    case 'invalid':
      return { alphaScale: 0.14, entryLineExtraWidth: 0 };
    default:
      return { alphaScale: 1, entryLineExtraWidth: 0 };
  }
}

/** 0–100 readiness used for timing chip thresholds — matches entry guidance weighting. */
export function blendTimingReadinessScore(setupScore: number, tradeScore: number): number {
  return setupScore * 0.45 + tradeScore * 0.55;
}

function timingReadiness(tradeScore: number, setupScore?: number | null): number {
  if (setupScore != null && Number.isFinite(setupScore)) {
    return blendTimingReadinessScore(setupScore, tradeScore);
  }
  return tradeScore;
}

/**
 * How much row-level scanner scores can move the timing readiness vs signal `baseReadiness`.
 * Weak base → almost no scanner lift; decent base → scanner can boost more (feels natural vs a fixed blend).
 */
function scannerReadinessBlendWeight(baseReadiness: number): number {
  const b = Math.max(0, Math.min(100, baseReadiness));
  if (b <= 44) return 0.05;
  if (b >= 72) return 0.36;
  return 0.05 + ((b - 44) / (72 - 44)) * (0.36 - 0.05);
}

/** Do not show “Ready” when trade score is this low, even if blended readiness clears the bar (scanner optimism). */
const READY_MIN_TRADE_SCORE = 50;

/**
 * Legacy timing chip from scanner row + blended readiness (can label triggered rows “Weak timing”).
 * Trade screen / dock / scanner card use {@link buildTradeTimingUiModel} instead — setup vs execution split.
 */
export function tradeTimingChipProps(
  status: MarketRowStatus,
  tradeScore: number,
  setupScore?: number | null,
  scannerTiming?: {
    timingScore?: number | null;
    entryFreshnessScore?: number | null;
    actionabilityScore?: number | null;
  },
): { state: TradeTimingChipState; label: string } {
  const scannerTimingScore = scannerTiming?.timingScore;
  const scannerFreshness = scannerTiming?.entryFreshnessScore;
  const scannerActionability = scannerTiming?.actionabilityScore;
  const hasScannerReadiness =
    Number.isFinite(scannerTimingScore) ||
    Number.isFinite(scannerFreshness) ||
    Number.isFinite(scannerActionability);
  const scannerReadiness = Math.round(
    (Number.isFinite(scannerActionability) ? (scannerActionability as number) * 0.5 : 0) +
      (Number.isFinite(scannerTimingScore) ? (scannerTimingScore as number) * 0.3 : 0) +
      (Number.isFinite(scannerFreshness) ? (scannerFreshness as number) * 0.2 : 0),
  );
  const baseReadiness = timingReadiness(tradeScore, setupScore);
  const w = hasScannerReadiness ? scannerReadinessBlendWeight(baseReadiness) : 0;
  const readiness = hasScannerReadiness
    ? Math.round(w * scannerReadiness + (1 - w) * baseReadiness)
    : baseReadiness;
  let effectiveStatus: MarketRowStatus = status;
  if (hasScannerReadiness && status === 'idle') {
    // Lifecycle scores can stay valid while row status briefly churns to idle during refresh/merge.
    if ((scannerActionability ?? 0) >= 64) effectiveStatus = 'triggered';
    else if ((scannerTimingScore ?? 0) >= 52 || (scannerFreshness ?? 0) >= 52) effectiveStatus = 'developing';
  }

  if (effectiveStatus === 'overextended' || effectiveStatus === 'extended') {
    return {
      state: 'invalid',
      label: effectiveStatus === 'extended' ? 'Late setup' : 'Stretched',
    };
  }
  if (effectiveStatus === 'developing') return { state: 'developing', label: 'Developing' };
  if (effectiveStatus === 'triggered') {
    if (readiness >= 42 && tradeScore >= READY_MIN_TRADE_SCORE) {
      return { state: 'ready', label: 'Ready' };
    }
    if (readiness >= 32) return { state: 'developing', label: 'Triggered' };
    return { state: 'invalid', label: 'Weak timing' };
  }
  if (effectiveStatus === 'idle') return { state: 'early', label: 'Too early' };
  return { state: 'early', label: 'Too early' };
}
