/**
 * Rule-based exit guidance + safeguards (aligned with `src/lib/exitGuidance.ts`
 * and `src/lib/aiExitAutomation.ts`) for the server-side automation worker.
 */
import { formatQuoteGuidance } from './formatQuoteGuidance.js';

export type ExitStrategyPreset = 'protect_profit' | 'trend_follow' | 'tight_risk' | 'custom';

export type ExitState = 'hold' | 'trim' | 'exit';

export type ExitGuidanceConfidence = 'High' | 'Medium' | 'Low';

export type ExitGuidance = {
  state: ExitState;
  headline: string;
  action: string;
  reason: string;
  confidenceLabel: ExitGuidanceConfidence;
  referencePrice: number;
};

export type ExitStrategyThresholds = {
  stopMain: number;
  stopMid: number;
  stopPnl: number;
  stopPnlSp: number;
  trimMain: number;
  trimMid: number;
  trimMom: number;
  trimLo: number;
  trimPnl: number;
};

export type AutomationSafeguards = {
  maxLossPct: number;
  minProfitBeforeTrimPct: number;
  allowPartialExits: boolean;
  allowFullAutoClose: boolean;
};

const DEFAULT_SAFEGUARDS: AutomationSafeguards = {
  maxLossPct: 5,
  minProfitBeforeTrimPct: 0.35,
  allowPartialExits: true,
  allowFullAutoClose: true,
};

export function coerceAutomationSafeguards(raw: unknown): AutomationSafeguards {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SAFEGUARDS };
  const o = raw as Record<string, unknown>;
  const maxLossPct =
    typeof o.maxLossPct === 'number' && Number.isFinite(o.maxLossPct)
      ? Math.min(50, Math.max(0.5, o.maxLossPct))
      : DEFAULT_SAFEGUARDS.maxLossPct;
  const minProfitBeforeTrimPct =
    typeof o.minProfitBeforeTrimPct === 'number' && Number.isFinite(o.minProfitBeforeTrimPct)
      ? Math.min(25, Math.max(0, o.minProfitBeforeTrimPct))
      : DEFAULT_SAFEGUARDS.minProfitBeforeTrimPct;
  return {
    maxLossPct,
    minProfitBeforeTrimPct,
    allowPartialExits: o.allowPartialExits !== false,
    allowFullAutoClose: o.allowFullAutoClose !== false,
  };
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function stopPressure(side: 'long' | 'short', entry: number, stop: number, last: number): number {
  if (!(entry > 0) || !(last > 0)) return 0;
  if (side === 'long') {
    const span = entry - stop;
    if (span <= 0) return 0;
    const buf = last - stop;
    if (buf <= 0) return 1;
    return 1 - clamp(buf / span, 0, 1);
  }
  const span = stop - entry;
  if (span <= 0) return 0;
  const buf = stop - last;
  if (buf <= 0) return 1;
  return 1 - clamp(buf / span, 0, 1);
}

function targetProximity(side: 'long' | 'short', entry: number, target: number, last: number): number {
  if (!(entry > 0) || !(last > 0)) return 0;
  if (side === 'long') {
    const span = target - entry;
    if (span <= 0) return 0;
    return clamp((last - entry) / span, 0, 1);
  }
  const span = entry - target;
  if (span <= 0) return 0;
  return clamp((entry - last) / span, 0, 1);
}

function trendMomentum01(trendAlignment: number, momentumQuality: number): number {
  return (clamp(trendAlignment / 25, 0, 1) + clamp(momentumQuality / 20, 0, 1)) / 2;
}

export const DEFAULT_CUSTOM_STRATEGY_THRESHOLDS: ExitStrategyThresholds = {
  stopMain: 0.74,
  stopMid: 0.48,
  stopPnl: -2.0,
  stopPnlSp: 0.55,
  trimMain: 0.7,
  trimMid: 0.42,
  trimMom: 0.44,
  trimLo: 0.36,
  trimPnl: 0.4,
};

function clampTh(n: number, lo: number, hi: number, fallback: number): number {
  if (!Number.isFinite(n)) return fallback;
  return Math.min(hi, Math.max(lo, n));
}

export function sanitizeExitStrategyThresholds(
  partial: Partial<ExitStrategyThresholds> | null | undefined,
): ExitStrategyThresholds {
  const d = DEFAULT_CUSTOM_STRATEGY_THRESHOLDS;
  if (!partial) return { ...d };
  return {
    stopMain: clampTh(partial.stopMain ?? d.stopMain, 0.45, 0.95, d.stopMain),
    stopMid: clampTh(partial.stopMid ?? d.stopMid, 0.2, 0.8, d.stopMid),
    stopPnl: clampTh(partial.stopPnl ?? d.stopPnl, -1.5, -0.2, d.stopPnl),
    stopPnlSp: clampTh(partial.stopPnlSp ?? d.stopPnlSp, 0.12, 0.6, d.stopPnlSp),
    trimMain: clampTh(partial.trimMain ?? d.trimMain, 0.45, 0.95, d.trimMain),
    trimMid: clampTh(partial.trimMid ?? d.trimMid, 0.2, 0.8, d.trimMid),
    trimMom: clampTh(partial.trimMom ?? d.trimMom, 0.15, 0.7, d.trimMom),
    trimLo: clampTh(partial.trimLo ?? d.trimLo, 0.15, 0.7, d.trimLo),
    trimPnl: clampTh(partial.trimPnl ?? d.trimPnl, 0.1, 0.85, d.trimPnl),
  };
}

function presetThresholdsNonCustom(preset: ExitStrategyPreset): ExitStrategyThresholds {
  if (preset === 'protect_profit') {
    return {
      stopMain: 0.66,
      stopMid: 0.42,
      stopPnl: -1.5,
      stopPnlSp: 0.5,
      trimMain: 0.58,
      trimMid: 0.36,
      trimMom: 0.48,
      trimLo: 0.3,
      trimPnl: 0.28,
    };
  }
  if (preset === 'trend_follow') {
    return {
      stopMain: 0.82,
      stopMid: 0.54,
      stopPnl: -2.5,
      stopPnlSp: 0.6,
      trimMain: 0.8,
      trimMid: 0.5,
      trimMom: 0.38,
      trimLo: 0.42,
      trimPnl: 0.52,
    };
  }
  if (preset === 'tight_risk') {
    return {
      stopMain: 0.62,
      stopMid: 0.4,
      stopPnl: -1.2,
      stopPnlSp: 0.45,
      trimMain: 0.64,
      trimMid: 0.38,
      trimMom: 0.48,
      trimLo: 0.34,
      trimPnl: 0.35,
    };
  }
  return { ...DEFAULT_CUSTOM_STRATEGY_THRESHOLDS };
}

export function resolveStrategyThresholds(
  preset: ExitStrategyPreset | undefined,
  customPartial: Partial<ExitStrategyThresholds> | null | undefined,
): ExitStrategyThresholds {
  const p = preset ?? 'custom';
  if (p === 'custom') {
    return sanitizeExitStrategyThresholds(customPartial);
  }
  return presetThresholdsNonCustom(p);
}

export function computeExitGuidance(args: {
  side: 'long' | 'short';
  entry: number;
  lastPrice: number;
  stop: number;
  target: number;
  trendAlignment: number;
  momentumQuality: number;
  pnlPct: number;
  strategyPreset?: ExitStrategyPreset;
  customStrategyThresholds?: Partial<ExitStrategyThresholds> | null;
}): ExitGuidance {
  const {
    side,
    entry,
    lastPrice,
    stop,
    target,
    trendAlignment,
    momentumQuality,
    pnlPct,
    strategyPreset,
    customStrategyThresholds,
  } = args;

  const sp = stopPressure(side, entry, stop, lastPrice);
  const tp = targetProximity(side, entry, target, lastPrice);
  const th = resolveStrategyThresholds(strategyPreset, strategyPreset === 'custom' ? customStrategyThresholds : null);
  const tm = trendMomentum01(trendAlignment, momentumQuality);

  let state: ExitState;
  let reason: string;
  let confidenceLabel: ExitGuidanceConfidence;
  let referencePrice: number;

  const nearStop =
    sp > th.stopMain || (sp > th.stopMid && tm < 0.32) || (pnlPct < th.stopPnl && sp > th.stopPnlSp);
  const nearTarget =
    tp > th.trimMain || (tp > th.trimMid && tm < th.trimMom) || (tp > th.trimLo && pnlPct > th.trimPnl);

  if (nearStop) {
    state = 'exit';
    reason =
      sp >= 0.9
        ? 'Price is pressing the invalidation zone — setup at risk.'
        : tm < 0.35
          ? 'Momentum fading while price drifts toward stop.'
          : 'Room to stop is thin — protect capital.';
    confidenceLabel = sp > 0.82 || tm < 0.28 ? 'High' : 'Medium';
    referencePrice = stop;
  } else if (nearTarget) {
    state = 'trim';
    const dynamicTrim =
      side === 'long'
        ? target * (1 - 0.0012 * (1 - tm))
        : target * (1 + 0.0012 * (1 - tm));
    referencePrice = dynamicTrim;
    reason =
      tp > 0.78
        ? 'Planned target zone is close — extension may mean-revert.'
        : tm < 0.45
          ? 'Tape softening into resistance — partial de-risk is reasonable.'
          : 'Favorable move — lock in some profit into liquidity.';
    confidenceLabel = tp > 0.75 ? 'High' : 'Medium';
  } else {
    state = 'hold';
    const nudge =
      side === 'long'
        ? target * (1 + 0.0025 * tm)
        : target * (1 - 0.0025 * tm);
    referencePrice = nudge;
    reason =
      tm > 0.55
        ? 'Trend alignment and momentum still support the thesis.'
        : 'No immediate threat to plan — watch for structure breaks.';
    confidenceLabel = tm > 0.5 ? 'High' : tm > 0.35 ? 'Medium' : 'Low';
  }

  const headline = state === 'hold' ? '' : state === 'trim' ? 'TRIM' : 'EXIT';

  let action: string;
  if (state === 'exit') {
    action = `Cut or tighten — watch ~$${formatQuoteGuidance(stop)}`;
  } else if (state === 'trim') {
    action = `Take profit near ~$${formatQuoteGuidance(referencePrice)}`;
  } else {
    action = `Let it work toward take-profit ~$${formatQuoteGuidance(target)}`;
  }

  return {
    state,
    headline,
    action,
    reason,
    confidenceLabel,
    referencePrice,
  };
}

export function applySafeguardsToGuidance(
  g: ExitGuidance,
  pnlPct: number,
  safeguards: AutomationSafeguards,
  stop: number,
  target: number,
  side: 'long' | 'short',
): ExitGuidance {
  const maxLoss = Math.abs(safeguards.maxLossPct);
  if (pnlPct <= -maxLoss) {
    return {
      ...g,
      state: 'exit',
      headline: 'EXIT',
      confidenceLabel: 'High',
      reason: 'Unrealized loss reached your max-loss safeguard.',
      action: `Exit toward ~$${formatQuoteGuidance(stop)}`,
      referencePrice: stop,
    };
  }

  if (g.state === 'trim' && pnlPct < safeguards.minProfitBeforeTrimPct) {
    const nudge = side === 'long' ? target * (1 + 0.002) : target * (1 - 0.002);
    return {
      ...g,
      state: 'hold',
      headline: '',
      confidenceLabel: 'Medium',
      reason: 'Below your minimum profit threshold for automated trims.',
      action: `Let it work toward take-profit ~$${formatQuoteGuidance(target)}`,
      referencePrice: nudge,
    };
  }

  return g;
}

export type ResolvedExitWatchGuidance = {
  raw: ExitGuidance;
  effective: ExitGuidance;
  pnlPct: number;
  lastPrice: number;
};

/** Same inputs as Trade screen manage-mode exit flow. */
export function resolveExitWatchGuidance(input: {
  side: 'long' | 'short';
  entry: number;
  mark: number;
  stop: number;
  target: number;
  trendAlignment: number;
  momentumQuality: number;
  strategyPreset: ExitStrategyPreset;
  customStrategyThresholds: Partial<ExitStrategyThresholds> | null;
  safeguards: AutomationSafeguards;
}): ResolvedExitWatchGuidance {
  const pnlPct =
    Number.isFinite(input.entry) && input.entry > 0 && Number.isFinite(input.mark) && input.mark > 0
      ? ((input.side === 'long' ? input.mark - input.entry : input.entry - input.mark) / input.entry) * 100
      : 0;
  const lastPrice = input.mark;

  const raw = computeExitGuidance({
    side: input.side,
    entry: input.entry,
    lastPrice,
    stop: input.stop,
    target: input.target,
    trendAlignment: input.trendAlignment,
    momentumQuality: input.momentumQuality,
    pnlPct,
    strategyPreset: input.strategyPreset,
    customStrategyThresholds: input.customStrategyThresholds,
  });

  const effective = applySafeguardsToGuidance(raw, pnlPct, input.safeguards, input.stop, input.target, input.side);

  return { raw, effective, pnlPct, lastPrice };
}
