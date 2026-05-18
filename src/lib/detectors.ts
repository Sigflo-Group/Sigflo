/**
 * Scanner Lab / playback types + indicator helper.
 * Detection rules are sourced from `src/lib/signalDetectors.ts` (production engine) via
 * `runScannerLabEngineEvaluations` — use that function for structural production parity.
 */
export type {
  SetupType,
  DerivedIndicators,
  SignalCandidate,
  DetectorEvaluation,
  DetectorOptions,
} from '@/lib/scannerLabEngineAdapter';

export {
  DEFAULT_DETECTOR_OPTIONS,
  MIN_ENGINE_BARS,
  deriveIndicators,
  engineSnapshotToDerivedIndicators,
  playbackCandlesToEngine,
  runScannerLabEngineEvaluations,
} from '@/lib/scannerLabEngineAdapter';
