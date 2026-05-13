type TriggeredStatusBadgeProps = {
  count: number;
  loading?: boolean;
  className?: string;
};

export function TriggeredStatusBadge({ count, loading = false, className = '' }: TriggeredStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-sigflo-accent/25 bg-sigflo-accentDim px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-sigflo-accent ${className}`}
      aria-live="polite"
      aria-label={loading ? 'Syncing triggered setups' : `${count} triggered setups`}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-sigflo-accent [animation-duration:1.8s]" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sigflo-accent" />
      </span>
      {loading ? 'Syncing…' : `Triggered ${count}`}
    </span>
  );
}
