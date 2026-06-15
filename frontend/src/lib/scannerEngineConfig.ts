import type { ScannerLifecycleConfig } from '@/lib/scannerConfig';
import { SCANNER_LIFECYCLE_CONFIG } from '@/lib/scannerConfig';
import type { ScannerFilterConfig } from '@/engine/types';
import { DEFAULT_STRATEGY_PERSONALITY_MODE, STRATEGY_PERSONALITY_PROFILES } from '@/lib/strategyPersonality';

/** Shared emit / warmup constants for live engine and offline replay. */
export const ENGINE_EMIT_CONFIG = {
  cooldownMs: 20 * 60 * 1000,
  scoreImproveBypass: 6,
  atrMoveBypass: 0.6,
  /** Closed 15m bars required before detectors run. */
  minClosedCandles15m: 60,
  /** Minimum closed 5m bars for lower-timeframe confirmation in bias scoring. */
  minClosedCandles5m: 20,
} as const;

/** Offline scanner / determinism filter defaults — aligned with balanced live engine emit gate. */
export function defaultScannerFilterConfig(): ScannerFilterConfig {
  const personality = STRATEGY_PERSONALITY_PROFILES[DEFAULT_STRATEGY_PERSONALITY_MODE];
  return {
    minConfidenceToEmit: personality.minConfidenceToEmit,
    minSetupScore: personality.minConfidenceToEmit,
    cooldownMs: ENGINE_EMIT_CONFIG.cooldownMs * personality.cooldownMultiplier,
    minScoreImprovement: ENGINE_EMIT_CONFIG.scoreImproveBypass,
    atrMoveBypass: ENGINE_EMIT_CONFIG.atrMoveBypass,
  };
}

export type MarketRegime = 'risk_on' | 'neutral' | 'risk_off';

export interface DetectorThresholds {
  breakoutVolRatio: number;
  breakoutDistAtr: number;
  breakoutCompression: number;
  pullbackMaxDistAtr: number;
  overextendedStretchAtr: number;
}

export function thresholdsForRegime(regime: MarketRegime): DetectorThresholds {
  if (regime === 'risk_off') {
    return {
      breakoutVolRatio: 1.36,
      breakoutDistAtr: 0.28,
      breakoutCompression: 0.46,
      pullbackMaxDistAtr: 0.45,
      overextendedStretchAtr: 1.7,
    };
  }
  if (regime === 'risk_on') {
    return {
      breakoutVolRatio: 1.2,
      breakoutDistAtr: 0.38,
      breakoutCompression: 0.38,
      pullbackMaxDistAtr: 0.6,
      overextendedStretchAtr: 1.9,
    };
  }
  return {
    breakoutVolRatio: 1.26,
    breakoutDistAtr: 0.32,
    breakoutCompression: 0.44,
    pullbackMaxDistAtr: 0.5,
    overextendedStretchAtr: 1.8,
  };
}

export function evaluateEmitGate(args: {
  now: number;
  prev: { emittedAt: number; setupScore: number; refPrice: number; atr: number } | undefined;
  signalSetupScore: number;
  priceNow: number;
  atrNow: number;
  lastClosedTs: number;
  prevCandleTs: number | null | undefined;
  cooldownMs?: number;
  scoreImproveBypass?: number;
  atrMoveBypass?: number;
}): {
  emit: boolean;
  cooldownPassed: boolean;
  scoreImproved: boolean;
  priceMoved: boolean;
  newClosedBar: boolean;
} {
  const cooldownMs = args.cooldownMs ?? ENGINE_EMIT_CONFIG.cooldownMs;
  const scoreImproveBypass = args.scoreImproveBypass ?? ENGINE_EMIT_CONFIG.scoreImproveBypass;
  const atrMoveBypass = args.atrMoveBypass ?? ENGINE_EMIT_CONFIG.atrMoveBypass;
  const prev = args.prev;
  const newClosedBar = args.prevCandleTs == null || args.lastClosedTs > args.prevCandleTs;
  const safeAtr = Math.max(args.atrNow, 0.000001);
  const scoreImproved =
    newClosedBar && prev ? args.signalSetupScore - prev.setupScore >= scoreImproveBypass : false;
  const priceMoved =
    newClosedBar && prev ? Math.abs(args.priceNow - prev.refPrice) / safeAtr >= atrMoveBypass : false;
  const cooldownPassed = !prev || args.now - prev.emittedAt >= cooldownMs;
  return {
    emit: cooldownPassed || scoreImproved || priceMoved,
    cooldownPassed,
    scoreImproved,
    priceMoved,
    newClosedBar,
  };
}

/** Human-readable funnel stage labels for debug UI. */
export const FUNNEL_STAGE_LABELS: Record<string, string> = {
  skip_no_ticker: 'No live ticker yet',
  skip_insufficient_candles: 'Warming up (< 60 closed 15m bars)',
  skip_btc_eth_warmup: 'BTC/ETH regime warmup incomplete',
  skip_no_detector: 'No detector passed confidence threshold',
  skip_below_emit_threshold: 'Below emit threshold',
  emitted: 'Emitted to feed',
  emitted_cooldown_suppressed: 'Lifecycle updated; emit suppressed by cooldown',
};

export const NOT_TRIGGERED_REASON_LABELS: Record<string, string> = {
  no_breakout_trigger_close: 'No timing trigger on this bar',
  no_timing_trigger: 'No timing trigger on this bar',
  lifecycle_extended: 'Lifecycle is extended (late entry)',
  lifecycle_expired: 'Lifecycle expired',
  lifecycle_developing: 'Still developing',
  lifecycle_ready: 'Ready but not triggered',
  actionability_below_58: 'Actionability below triggered minimum',
  freshness_below_45: 'Entry freshness below triggered minimum',
};

export function lifecycleConfigSummary(config: ScannerLifecycleConfig = SCANNER_LIFECYCLE_CONFIG): string {
  return `extendedAfter=${config.extendedAfterCandles} candles, expiredAfter=${config.expiredAfterCandles} candles`;
}
