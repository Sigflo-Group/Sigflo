import type { CryptoSignal } from '@/types/signal';

function setupLabel(score: number): string {
  if (score >= 85) return 'High Conviction';
  if (score >= 75) return 'Strong';
  if (score >= 60) return 'Moderate';
  if (score >= 45) return 'Developing';
  return 'No Trade';
}

function riskShort(tag: string): string {
  return tag.replace(' Risk', '');
}

function actionLine(signal: CryptoSignal): string {
  if (signal.setupType === 'overextended') return 'Too aggressive — reduce size';
  if (signal.setupScore >= 85) return 'High-quality continuation conditions — execution can be active.';
  if (signal.setupScore >= 75) return 'Strong alignment — execution conditions are favorable.';
  if (signal.setupScore >= 60) return 'Moderate setup — balanced execution with confirmation.';
  if (signal.setupScore >= 45) return 'Developing setup — keep on watchlist for clearer confirmation.';
  return 'Unclear conditions — no-trade stance until structure improves.';
}

export function SetupContextCard({ signal }: { signal: CryptoSignal }) {
  const setupColor =
    signal.setupScore >= 85
      ? 'text-amber-300'
      : signal.setupScore >= 75
        ? 'text-sigflo-accent'
        : signal.setupScore >= 60
          ? 'text-sky-300'
          : signal.setupScore >= 45
            ? 'text-cyan-300'
            : 'text-rose-400';
  const riskColor =
    signal.riskTag === 'High Risk' ? 'text-rose-400' : signal.riskTag === 'Low Risk' ? 'text-emerald-400' : 'text-sigflo-muted';

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-sigflo-surface sigflo-panel-texture p-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-sigflo-muted">Setup: <span className={`font-bold ${setupColor}`}>{setupLabel(signal.setupScore)}</span></span>
          <span className="text-sigflo-muted">Risk: <span className={`font-bold ${riskColor}`}>{riskShort(signal.riskTag)}</span></span>
          <span className="text-sigflo-muted">Score: <span className="font-bold text-white">{signal.setupScore}</span></span>
        </div>
      </div>
      <p className="mt-3 text-sm font-semibold text-sigflo-accent">{actionLine(signal)}</p>
    </div>
  );
}
