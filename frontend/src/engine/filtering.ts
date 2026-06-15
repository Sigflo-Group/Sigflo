import { evaluateEmitGate } from '@/lib/scannerEngineConfig';
import type {
  EmittedSignalState,
  EmittedSignalStateMap,
  ScannerFilterConfig,
  SignalCandidate,
} from '@/engine/types';

function signalKey(candidate: SignalCandidate): string {
  return `${candidate.symbol}:${candidate.setupType}:${candidate.directionBias}`;
}

function passesConfidenceGate(candidate: SignalCandidate, cfg: ScannerFilterConfig): boolean {
  const threshold = cfg.minConfidenceToEmit ?? cfg.minSetupScore;
  const score = candidate.confidence ?? candidate.setupScore;
  return score >= threshold;
}

function shouldEmitByDedup(
  candidate: SignalCandidate,
  previous: EmittedSignalState | undefined,
  cfg: ScannerFilterConfig,
): boolean {
  if (!previous) return true;
  const refPrice = candidate.refPrice ?? previous.lastRefPrice ?? 0;
  const atrNow = Math.max(candidate.atr ?? previous.lastAtr ?? 1, 1e-6);
  const gate = evaluateEmitGate({
    now: candidate.timestamp,
    prev: {
      emittedAt: previous.lastEmittedAt,
      setupScore: previous.lastSetupScore,
      refPrice: previous.lastRefPrice ?? refPrice,
      atr: previous.lastAtr ?? atrNow,
    },
    signalSetupScore: candidate.setupScore,
    priceNow: refPrice,
    atrNow,
    lastClosedTs: candidate.timestamp,
    prevCandleTs: previous.lastCandleTs ?? null,
    cooldownMs: cfg.cooldownMs,
    scoreImproveBypass: cfg.minScoreImprovement,
    atrMoveBypass: cfg.atrMoveBypass,
  });
  return gate.emit;
}

export function applySignalQualityControls(
  candidates: SignalCandidate[],
  previousState: EmittedSignalStateMap,
  cfg: ScannerFilterConfig,
): { accepted: SignalCandidate[]; nextState: EmittedSignalStateMap } {
  const nextState = { ...previousState };
  const accepted: SignalCandidate[] = [];

  for (const candidate of candidates) {
    if (!candidate.confirmedOnClosedCandle) continue;
    if (!passesConfidenceGate(candidate, cfg)) continue;
    if (candidate.setupScore < cfg.minSetupScore) continue;
    const key = signalKey(candidate);
    const previous = nextState[key];
    if (!shouldEmitByDedup(candidate, previous, cfg)) continue;
    accepted.push(candidate);
    nextState[key] = {
      lastEmittedAt: candidate.timestamp,
      lastSetupScore: candidate.setupScore,
      lastRefPrice: candidate.refPrice,
      lastAtr: candidate.atr,
      lastCandleTs: candidate.timestamp,
    };
  }

  return { accepted, nextState };
}
