import { AnimatePresence, motion } from 'framer-motion';
import type { TradeChartInterval } from '@/hooks/useLiveTradeMarket';
import type { BotAgent } from '@/lib/bots';
import { formatBotPrice } from '@/lib/bots';

export function BotFocusFullChartTopBar({
  bot,
  onBack,
  pairLabel,
  onOpenTradeWorkspace,
}: {
  bot: BotAgent;
  onBack: () => void;
  pairLabel: string;
  onOpenTradeWorkspace: () => void;
}) {
  return (
    <header className="landing-panel-texture relative shrink-0 overflow-hidden border-b border-landing-border/70 bg-landing-bg px-3 py-2">
      <div className="relative z-[1] flex w-full min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-landing-border bg-landing-surface/80 text-landing-text transition active:scale-[0.96]"
          aria-label="Exit full chart"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M15 6l-6 6 6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-[11px] font-medium tracking-wide text-landing-muted/90">
            <span className="text-landing-text/95">{bot.name}</span>
            <span className="mx-1 text-landing-muted/50">·</span>
            <span>{bot.strategy}</span>
          </p>
          <p className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-wider text-landing-accent-hi/90">
            {pairLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenTradeWorkspace}
          className="shrink-0 rounded-lg border border-white/[0.1] bg-landing-surface/70 px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wide text-landing-muted transition active:scale-[0.97] hover:text-landing-text"
        >
          Trade view
        </button>
      </div>
    </header>
  );
}

export function BotFocusChartToolsDock({
  chartInterval,
  onIntervalChange,
  options,
  onFocusSetup,
}: {
  chartInterval: TradeChartInterval;
  onIntervalChange: (v: TradeChartInterval) => void;
  options: { value: TradeChartInterval; label: string }[];
  /** Zoom chart to entry / stop / target without leaving full chart. */
  onFocusSetup?: () => void;
}) {
  return (
    <div className="flex shrink-0 flex-col gap-2 border-t border-landing-border/50 bg-landing-bg/90 px-3 py-2 backdrop-blur-md">
      <div className="flex items-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-landing-muted">Time</span>
        <div className="flex min-w-0 flex-1 gap-1">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => onIntervalChange(o.value)}
              className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold transition ${
                chartInterval === o.value
                  ? 'bg-landing-accent-dim text-landing-accent-hi ring-1 ring-landing-accent/35'
                  : 'border border-white/[0.06] bg-landing-surface/70 text-landing-muted hover:text-landing-text'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      {onFocusSetup ? (
        <div className="flex justify-start">
          <button
            type="button"
            onClick={onFocusSetup}
            className="rounded-lg border border-landing-accent/35 bg-landing-accent-dim/40 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-landing-accent-hi transition hover:border-landing-accent/50 active:scale-[0.98]"
          >
            View on chart
          </button>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[9px] font-bold uppercase tracking-wider text-landing-muted">Soon</span>
        <button
          type="button"
          disabled
          className="rounded-lg border border-dashed border-white/[0.12] bg-white/[0.02] px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-landing-muted/60"
        >
          Indicators
        </button>
        <button
          type="button"
          disabled
          className="rounded-lg border border-dashed border-white/[0.12] bg-white/[0.02] px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-landing-muted/60"
        >
          Draw
        </button>
        <button
          type="button"
          disabled
          className="rounded-lg border border-dashed border-white/[0.12] bg-white/[0.02] px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-landing-muted/60"
        >
          Multi-bot
        </button>
      </div>
    </div>
  );
}

export function BotFocusInsightDrawer({
  open,
  onToggle,
  bot,
  hasActiveSetup,
  rrDisplay,
  toggleClassName = '',
  intentDisplay,
  commentaryDisplay,
  structureNote,
}: {
  open: boolean;
  onToggle: () => void;
  bot: BotAgent;
  hasActiveSetup: boolean;
  rrDisplay: number;
  /** Extra classes on the Insights toggle row (e.g. reserve space for floating actions). */
  toggleClassName?: string;
  /** When set, replaces `bot.intentLine` (e.g. live structure-aware copy from chart candles). */
  intentDisplay?: string;
  commentaryDisplay?: string;
  structureNote?: string | null;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full shrink-0 items-center justify-between gap-3 border-t border-landing-border/60 bg-landing-surface landing-panel-texture px-3 py-2 text-[11px] font-semibold text-landing-text transition hover:bg-white/[0.03] ${toggleClassName}`}
      >
        <span className="min-w-0 truncate text-left uppercase tracking-[0.12em] text-landing-muted">
          Insights
        </span>
        <span className="shrink-0 text-right text-landing-muted">{open ? 'Hide' : 'Show'}</span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-landing-border/40 bg-landing-bg/95"
          >
            <div className="max-h-[min(42dvh,22rem)] space-y-4 overflow-y-auto overscroll-contain px-3 py-3">
              <section>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-landing-muted">Intent</p>
                <p className="mt-1 text-sm font-medium leading-snug text-landing-text">
                  {intentDisplay ?? bot.intentLine}
                </p>
                {structureNote ? (
                  <p className="mt-1 text-[10px] leading-snug text-landing-muted/90">{structureNote}</p>
                ) : null}
              </section>
              <section>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-landing-muted">Commentary</p>
                <p className="mt-1 text-xs leading-relaxed text-landing-muted">
                  {commentaryDisplay ?? bot.detail.commentaryShort ?? bot.detail.aiNote}
                </p>
              </section>
              <section>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-landing-muted">Setup</p>
                {hasActiveSetup ? (
                  <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                    <div>
                      <dt className="text-landing-muted">Bias</dt>
                      <dd className="mt-0.5 font-semibold text-landing-text">{bot.detail.bias}</dd>
                    </div>
                    <div>
                      <dt className="text-landing-muted">Confidence</dt>
                      <dd className="mt-0.5 font-semibold text-landing-accent-hi">{bot.detail.confidencePct}%</dd>
                    </div>
                    <div>
                      <dt className="text-landing-muted">Entry</dt>
                      <dd className="mt-0.5 font-mono text-landing-text">{formatBotPrice(bot.detail.entry)}</dd>
                    </div>
                    <div>
                      <dt className="text-landing-muted">Stop</dt>
                      <dd className="mt-0.5 font-mono text-rose-200/90">{formatBotPrice(bot.detail.stop)}</dd>
                    </div>
                    <div>
                      <dt className="text-landing-muted">Target</dt>
                      <dd className="mt-0.5 font-mono text-emerald-200/90">{formatBotPrice(bot.detail.target)}</dd>
                    </div>
                    <div>
                      <dt className="text-landing-muted">R:R</dt>
                      <dd className="mt-0.5 font-mono font-semibold text-landing-text">
                        {Number.isFinite(rrDisplay) && rrDisplay > 0 ? `${rrDisplay.toFixed(2)} : 1` : '—'}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p className="mt-1 text-xs text-landing-muted">No active setup — bot is monitoring conditions.</p>
                )}
              </section>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
