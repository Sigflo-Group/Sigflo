export type BotOverviewMetrics = {
  activeBots: number;
  scanningBots: number;
  marketsWatched: number;
  signalsToday: number;
  /** Default "Signals today"; use "Trades today" when the value is summed exchange closes. */
  todayActivityLabel?: string;
};

export type BotOverviewCardProps = {
  metrics: BotOverviewMetrics;
  subline: string;
  /** e.g. "Mode: Suggestion" — opens mode sheet when clicked */
  modeLabel: string;
  onOpenModeSheet: () => void;
  modeSheetOpen?: boolean;
  onAddBot?: () => void;
};

export function BotOverviewCard({
  metrics,
  subline,
  modeLabel,
  onOpenModeSheet,
  modeSheetOpen = false,
  onAddBot,
}: BotOverviewCardProps) {
  const cells: { label: string; value: string; accent?: boolean }[] = [
    { label: 'Active', value: String(metrics.activeBots), accent: metrics.activeBots > 0 },
    { label: 'Scanning', value: String(metrics.scanningBots) },
    { label: 'Markets', value: String(metrics.marketsWatched) },
    { label: metrics.todayActivityLabel ?? 'Signals today', value: String(metrics.signalsToday) },
  ];

  return (
    <header className="relative overflow-hidden rounded-2xl border border-[rgba(0,255,200,0.1)] bg-gradient-to-b from-[#0a1614] to-sigflo-surface shadow-[0_0_22px_-14px_rgba(0,255,200,0.2),inset_0_1px_0_0_rgba(255,255,255,0.04)] ring-1 ring-[rgba(0,255,200,0.05)]">
      <span className="sigflo-panel-grid-overlay z-0" aria-hidden />
      <div
        className="pointer-events-none absolute -right-8 -top-12 h-28 w-28 rounded-full bg-[#00ffc8]/[0.035] blur-xl"
        aria-hidden
      />
      <div className="relative z-[1] p-4">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-lg font-bold tracking-tight text-white">Bots</h1>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onOpenModeSheet}
              aria-expanded={modeSheetOpen}
              aria-haspopup="dialog"
              className="group relative overflow-hidden rounded-xl border border-white/[0.1] text-left shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] transition active:scale-[0.98] hover:border-[rgba(0,200,120,0.28)] hover:text-[#b8fff0]"
            >
              <span
                className="pointer-events-none absolute inset-0 z-0 bg-landing-mid transition-colors group-hover:bg-landing-card"
                aria-hidden
              />
              <span className="sigflo-panel-grid-overlay z-0" aria-hidden />
              <span className="relative z-[1] block px-2.5 py-2 text-[11px] font-semibold text-cyan-100/95">
                {modeLabel}
              </span>
            </button>
            {onAddBot ? (
              <button
                type="button"
                onClick={onAddBot}
                className="group relative overflow-hidden rounded-xl border border-white/[0.1] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition active:scale-[0.97] hover:border-[rgba(0,255,200,0.25)] hover:text-[#b8fff0]"
              >
                <span
                  className="pointer-events-none absolute inset-0 z-0 bg-landing-mid transition-colors group-hover:bg-landing-card"
                  aria-hidden
                />
                <span className="sigflo-panel-grid-overlay z-0" aria-hidden />
                <span className="relative z-[1] block px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-cyan-100/95">
                  + Add bot
                </span>
              </button>
            ) : null}
          </div>
        </div>
        <p className="mt-2 text-[10px] font-extrabold uppercase tracking-[0.24em] text-sigflo-muted/90">Command center</p>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {cells.map((c) => (
            <div
              key={c.label}
              className={`rounded-xl border px-1.5 py-2 text-center ${
                c.accent
                  ? 'border-[rgba(0,255,200,0.18)] bg-[#0d1a17] shadow-[0_0_12px_-10px_rgba(0,255,200,0.22)]'
                  : 'border-white/[0.06] bg-sigflo-elevated'
              }`}
            >
              <p className="text-[8px] font-semibold uppercase tracking-wider text-sigflo-muted">{c.label}</p>
              <p
                className={`mt-0.5 text-base font-bold tabular-nums leading-none ${
                  c.accent ? 'text-[#b8fff0]' : 'text-white'
                }`}
              >
                {c.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/[0.05] bg-sigflo-elevated px-3 py-2">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-[#00ffc8] opacity-40 [animation-duration:2.4s]" />
            <span className="relative inline-flex h-full w-full rounded-full bg-[#00ffc8] shadow-[0_0_5px_rgba(0,255,200,0.28)]" />
          </span>
          <p className="text-[11px] font-medium leading-snug text-cyan-100/85">{subline}</p>
        </div>
      </div>
    </header>
  );
}
