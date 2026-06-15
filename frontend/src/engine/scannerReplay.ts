import { evaluateTimingLifecycle, type CandidateLifecycle } from '@/lib/timingLifecycle';
import { ENGINE_EMIT_CONFIG } from '@/lib/scannerEngineConfig';
import type { Candle } from '@/types/market';
import type { SignalSetupType, SignalSide } from '@/types/signal';

export type LifecycleReplayStep = {
  candleIndex: number;
  candleTs: number;
  state: CandidateLifecycle['state'];
  timingScore: number;
  triggerType: string | null;
  candlesSinceTrigger: number | null;
};

export type LifecycleReplayResult = {
  steps: LifecycleReplayStep[];
  final: CandidateLifecycle | null;
};

/**
 * Replay lifecycle evaluation bar-by-bar on a closed-candle series.
 * Useful for regression tests and Scanner Lab parity checks.
 */
export function replayLifecycleOnCandles(args: {
  candles: Candle[];
  setupType: SignalSetupType;
  side: SignalSide;
  setupScore?: number;
  startIndex?: number;
}): LifecycleReplayResult {
  const start = args.startIndex ?? ENGINE_EMIT_CONFIG.minClosedCandles15m;
  const steps: LifecycleReplayStep[] = [];
  let lifecycle: CandidateLifecycle | undefined;
  let final: CandidateLifecycle | null = null;

  for (let i = start; i < args.candles.length; i += 1) {
    const slice = args.candles.slice(0, i + 1);
    const last = slice.at(-1);
    if (!last) continue;
    const { lifecycle: next, diagnostics } = evaluateTimingLifecycle({
      setupType: args.setupType,
      side: args.side,
      setupScore: args.setupScore ?? 72,
      candles: slice,
      previous: lifecycle,
    });
    lifecycle = next;
    final = next;
    steps.push({
      candleIndex: i,
      candleTs: last.ts,
      state: next.state,
      timingScore: diagnostics.timingScore,
      triggerType: next.trigger.triggerCandleTs != null ? next.trigger.triggerType : null,
      candlesSinceTrigger: next.candlesSinceTrigger,
    });
  }

  return { steps, final };
}
