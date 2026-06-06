import type { ExitGuidance } from '@/lib/exitGuidance';
import type { EntryGuidance } from '@/lib/tradeEntryGuidance';
import type { TradeTimingChipState } from '@/lib/tradeTimingChip';

const CONF_HIGH = '#00ffc8';
const CONF_MED = '#fbbf24';
const CONF_LOW = '#f87171';
const ACCENT = '#00ffc8';

function exitStateColor(s: ExitGuidance['state']) {
  if (s === 'hold') return ACCENT;
  if (s === 'trim') return CONF_MED;
  return CONF_LOW;
}

function exitConfidenceColor(label: ExitGuidance['confidenceLabel']) {
  if (label === 'High') return CONF_HIGH;
  if (label === 'Medium') return CONF_MED;
  return CONF_LOW;
}

function entryTimingStroke(state: TradeTimingChipState) {
  if (state === 'ready') return ACCENT;
  if (state === 'developing') return CONF_MED;
  if (state === 'early') return '#7dd3fc';
  return CONF_LOW;
}

export function ExitGuidanceCard({ eg }: { eg: ExitGuidance | null }) {
  if (!eg) return null;
  const stroke = exitStateColor(eg.state);
  const confColor = exitConfidenceColor(eg.confidenceLabel);

  return (
    <div
      className="min-h-0 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 transition-colors duration-300"
      style={{ boxShadow: `inset 0 0 0 1px ${stroke}22` }}
    >
      <p className="mb-1 text-[8px] font-bold uppercase tracking-[0.12em]" style={{ color: stroke }}>
        Exit guidance
      </p>
      <dl className="space-y-1 text-[10px] leading-snug text-white">
        <div>
          <dt className="text-[8px] uppercase tracking-wider text-sigflo-muted">Suggested action</dt>
          <dd className="font-semibold text-white/95">{eg.action}</dd>
        </div>
        <div>
          <dt className="text-[8px] uppercase tracking-wider text-sigflo-muted">Reason</dt>
          <dd className="text-white/85">{eg.reason}</dd>
        </div>
        <div>
          <dt className="text-[8px] uppercase tracking-wider text-sigflo-muted">Confidence</dt>
          <dd className="font-semibold" style={{ color: confColor }}>
            {eg.confidenceLabel}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function EntryGuidanceCard({ g }: { g: EntryGuidance }) {
  const stroke = entryTimingStroke(g.timingState);
  const confColor = exitConfidenceColor(g.confidenceLabel);

  return (
    <div
      className="min-h-0 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 transition-colors duration-300"
      style={{ boxShadow: `inset 0 0 0 1px ${stroke}22` }}
    >
      <p className="mb-1 text-[8px] font-bold uppercase tracking-[0.12em]" style={{ color: stroke }}>
        Entry guidance
      </p>
      <p className="mb-1 text-[9px] font-semibold leading-tight" style={{ color: stroke }}>
        Timing: {g.timingLabel}
      </p>
      {g.timingHelperText ? (
        <p className="mb-1 text-[9px] leading-snug text-sigflo-muted/90">{g.timingHelperText}</p>
      ) : null}
      {g.executionSummary ? (
        <p className="mb-1 text-[9px] leading-snug text-white/80">{g.executionSummary}</p>
      ) : null}
      <dl className="space-y-1 text-[10px] leading-snug text-white">
        <div>
          <dt className="text-[8px] uppercase tracking-wider text-sigflo-muted">Suggested action</dt>
          <dd className="font-semibold text-white/95">{g.action}</dd>
        </div>
        <div>
          <dt className="text-[8px] uppercase tracking-wider text-sigflo-muted">Reason</dt>
          <dd className="text-white/85">{g.reason}</dd>
        </div>
        <div>
          <dt className="text-[8px] uppercase tracking-wider text-sigflo-muted">Confidence</dt>
          <dd className="font-semibold" style={{ color: confColor }}>
            {g.confidenceLabel}
          </dd>
        </div>
      </dl>
    </div>
  );
}
