import { AnimatePresence, motion } from 'framer-motion';

type OpportunityDecisionCardProps = {
  id: string;
  pair: string;
  strategy: string;
  direction: 'LONG' | 'SHORT';
  state: 'Watching' | 'Building' | 'Ready' | 'Triggered';
  score: number;
  explanation: string;
  entryZone?: { min: number; max: number };
  invalidation?: number;
  targets?: number[];
  isExpanded?: boolean;
  onToggleExpand?: (id: string) => void;
  onReview?: () => void;
  onQuickPaperTrade?: () => void;
  quickPaperTradeDisabled?: boolean;
  debugHydration?: { isDbHydrated: boolean; opportunityId: string };
};

const HEADLINES = {
  breakout: [
    'Pressure building below resistance',
    'Repeated tests of resistance',
    'Range tightening near breakout level',
    'Holding just under resistance',
  ],
  reversal: [
    'Momentum fading after push',
    'Exhaustion near highs',
    'Failed breakout attempt',
    'Rejection at resistance',
  ],
  momentum: [
    'Momentum building with trend',
    'Strong continuation move',
    'Trend holding with strength',
    'Break and follow-through',
  ],
  risk: ['Risk elevated', 'Volatility increasing', 'Conditions unstable', 'Exposure high'],
} as const;

const SUBTEXT = {
  breakout: [
    'Range tightening after multiple tests.',
    'Volatility compressing, expansion likely.',
    'Resistance keeps getting tested with little pullback.',
  ],
  reversal: [
    'Buyers are losing strength near highs.',
    'Upside attempts are getting rejected quickly.',
    'Momentum is fading into resistance.',
  ],
  momentum: ['Trend structure intact.', 'Follow-through is holding.', 'Continuation pressure remains steady.'],
  risk: [
    'Volatility is increasing and conditions are unstable.',
    'Price swings are widening around key levels.',
    'Exposure is high; keep risk controlled.',
  ],
} as const;

function pickTone(strategy: string, explanation: string): keyof typeof HEADLINES {
  const text = `${strategy} ${explanation}`.toLowerCase();
  if (text.includes('risk') || text.includes('volatil') || text.includes('unstable')) return 'risk';
  if (text.includes('reversal') || text.includes('reject') || text.includes('exhaust')) return 'reversal';
  if (text.includes('momentum') || text.includes('continuation') || text.includes('trend')) return 'momentum';
  return 'breakout';
}

function languageForOpportunity(strategy: string, explanation: string, score: number): { headline: string; subtext: string } {
  const tone = pickTone(strategy, explanation);
  const h = HEADLINES[tone];
  const s = SUBTEXT[tone];
  const idx = Math.max(0, Math.min(h.length - 1, Math.floor((Math.max(0, Math.min(100, score)) / 100) * h.length)));
  return { headline: h[idx] ?? h[0], subtext: s[Math.min(idx, s.length - 1)] ?? s[0] };
}

function stateLabel(state: OpportunityDecisionCardProps['state']): string {
  if (state === 'Ready') return 'Ready now';
  return state;
}

function stateClass(state: OpportunityDecisionCardProps['state']): string {
  if (state === 'Ready') return 'border-[#00ffc8]/35 bg-[#00ffc8]/12 text-[#bafef1]';
  if (state === 'Triggered') return 'border-cyan-300/35 bg-cyan-500/12 text-cyan-100';
  if (state === 'Building') return 'border-white/20 bg-white/[0.06] text-zinc-200';
  return 'border-white/12 bg-white/[0.03] text-zinc-400';
}

function confidence(score: number): {
  label: 'No Trade' | 'Developing' | 'Moderate' | 'Strong' | 'High Conviction';
  pct: number;
} {
  const pct = Math.max(0, Math.min(100, score));
  if (pct >= 85) return { label: 'High Conviction', pct };
  if (pct >= 75) return { label: 'Strong', pct };
  if (pct >= 60) return { label: 'Moderate', pct };
  if (pct >= 45) return { label: 'Developing', pct };
  return { label: 'No Trade', pct };
}

function fmt(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 4 });
}

function entryLine(entryZone?: { min: number; max: number }): string {
  if (!entryZone) return '—';
  const lo = Math.min(entryZone.min, entryZone.max);
  const hi = Math.max(entryZone.min, entryZone.max);
  return `${fmt(lo)}–${fmt(hi)}`;
}

function targetsLine(targets?: number[]): string {
  if (!targets || targets.length === 0) return '—';
  return targets
    .filter((n) => Number.isFinite(n))
    .slice(0, 2)
    .map(fmt)
    .join(' / ');
}

function riskReward(entryZone?: { min: number; max: number }, invalidation?: number, targets?: number[]) {
  if (!entryZone || invalidation == null || !targets || targets.length === 0) {
    return { riskPct: null as number | null, rewardPct: null as number | null, rr: null as number | null };
  }
  const entryMid = (entryZone.min + entryZone.max) / 2;
  const firstTarget = targets[0]!;
  if (!(entryMid > 0) || !Number.isFinite(firstTarget)) {
    return { riskPct: null, rewardPct: null, rr: null };
  }
  const riskPct = (Math.abs(entryMid - invalidation) / entryMid) * 100;
  const rewardPct = (Math.abs(firstTarget - entryMid) / entryMid) * 100;
  const rr = riskPct > 0 ? rewardPct / riskPct : null;
  return { riskPct, rewardPct, rr };
}

export function OpportunityDecisionCard(props: OpportunityDecisionCardProps) {
  const conf = confidence(props.score);
  const expanded = Boolean(props.isExpanded);
  const text = props.explanation.trim().replace(/\s+/g, ' ');
  const { headline, subtext } = languageForOpportunity(props.strategy, text, props.score);
  const entry = entryLine(props.entryZone);
  const stop = props.invalidation != null && Number.isFinite(props.invalidation) ? fmt(props.invalidation) : '—';
  const targets = targetsLine(props.targets);
  const rr = riskReward(props.entryZone, props.invalidation, props.targets);

  return (
    <motion.article
      layout
      className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3"
      animate={{ y: expanded ? -1 : 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <button
        type="button"
        onClick={() => props.onToggleExpand?.(props.id)}
        className="w-full text-left transition hover:-translate-y-[1px]"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold text-zinc-100">
            {props.pair} <span className="text-zinc-500">·</span> <span className="text-zinc-300">{props.strategy}</span>
          </p>
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${stateClass(props.state)}`}>
            {stateLabel(props.state)}
          </span>
        </div>

        <p className="mt-1 text-[13px] font-medium text-zinc-100">{headline}</p>
        <p className="mt-0.5 line-clamp-1 text-[11px] text-zinc-400">{subtext}</p>

        <div className="mt-2">
          <div className="mb-1 flex items-center justify-between text-[10px]">
            <span className="text-zinc-500">{stateLabel(props.state)}</span>
            <span className="font-semibold text-zinc-300">{conf.label}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full bg-[#00ffc8]/70" style={{ width: `${conf.pct}%` }} />
          </div>
        </div>

        <p className="mt-2 text-[11px] text-zinc-400">
          Entry {entry} · Stop {stop} · Targets {targets}
        </p>

        <div className="mt-2 flex items-center justify-between">
          <span
            className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
              props.direction === 'LONG' ? 'bg-emerald-500/15 text-emerald-200' : 'bg-rose-500/15 text-rose-200'
            }`}
          >
            {props.direction}
          </span>
          <span className="text-[11px] font-semibold text-[#9fe8d6]">Review trade →</span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-4 border-t border-white/10 bg-white/[0.02] pt-4">
              <div className="space-y-2 text-[11px]">
                <div>
                  <p className="text-zinc-500">Entry</p>
                  <p className="mt-0.5 font-mono text-zinc-200">{entry}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Stop</p>
                  <p className="mt-0.5 font-mono text-zinc-200">{props.invalidation != null ? `Below ${stop}` : '—'}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Targets</p>
                  <p className="mt-0.5 font-mono text-zinc-200">{targets}</p>
                </div>
              </div>

              <p className="mt-3 line-clamp-2 text-[11px] leading-snug text-zinc-300">{text || subtext}</p>
              {import.meta.env.DEV && props.debugHydration ? (
                <p className="mt-2 rounded-md border border-white/10 bg-black/25 px-2 py-1 font-mono text-[10px] text-zinc-400">
                  db-hydrated {props.debugHydration.isDbHydrated ? 'yes' : 'no'} · id {props.debugHydration.opportunityId}
                </p>
              ) : null}

              <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-white/[0.07] bg-black/20 px-2 py-2 text-[11px]">
                <div>
                  <p className="text-zinc-500">Risk</p>
                  <p className="mt-0.5 font-mono text-zinc-200">{rr.riskPct != null ? `${rr.riskPct.toFixed(1)}%` : '—'}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Reward</p>
                  <p className="mt-0.5 font-mono text-zinc-200">{rr.rewardPct != null ? `${rr.rewardPct.toFixed(1)}%` : '—'}</p>
                </div>
                <div>
                  <p className="text-zinc-500">R:R</p>
                  <p className="mt-0.5 font-mono text-zinc-200">{rr.rr != null ? rr.rr.toFixed(1) : '—'}</p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={props.onQuickPaperTrade}
                  disabled={!props.onQuickPaperTrade || props.quickPaperTradeDisabled}
                  className="h-10 rounded-xl bg-[#00ffc8] py-2 text-[11px] font-medium text-black transition hover:bg-[#00f2bd] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Paper trade this setup
                </button>
                <button
                  type="button"
                  onClick={() => props.onToggleExpand?.(props.id)}
                  className="rounded-xl border border-white/[0.12] bg-white/[0.03] py-2 text-[11px] font-semibold text-zinc-300 transition hover:bg-white/[0.06]"
                >
                  Collapse
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  );
}

export default OpportunityDecisionCard;

