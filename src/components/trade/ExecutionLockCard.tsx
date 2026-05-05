import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export type ExecutionLockCardProps = {
  state: string;
  source: 'bots' | 'manual';
  onPaperPreview: () => void;
  allowLiveExecution: boolean;
  requireConfirmation: boolean;
  paperModeDefault: boolean;
  maxOpenPositionsReached?: boolean;
};

export function ExecutionLockCard({
  state: _state,
  source,
  onPaperPreview,
  allowLiveExecution,
  requireConfirmation,
  paperModeDefault,
  maxOpenPositionsReached = false,
}: ExecutionLockCardProps) {
  const primaryLabel = paperModeDefault ? 'Paper trade preview' : 'Preview plan';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
      className="sigflo-exec-lock-card rounded-2xl border border-white/10 bg-[#050505]/90 px-4 py-3 backdrop-blur-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Execution</p>
          <p className="mt-1 text-xs text-zinc-400">
            Review-only context{source === 'bots' ? ' · opened from Bots' : ''}. Sigflo will not send live orders from
            this path unless you enable them in Risk controls.
          </p>
        </div>
      </div>

      {maxOpenPositionsReached ? (
        <div className="mt-3 rounded-xl border border-amber-400/25 bg-amber-500/[0.08] px-3 py-2">
          <p className="text-[11px] font-semibold text-amber-100/95">Max open positions reached</p>
          <p className="mt-0.5 text-[10px] leading-snug text-amber-100/75">
            New entries paused by risk controls. You can still review and use paper preview.
          </p>
        </div>
      ) : null}

      <ul className="mt-3 space-y-1.5 text-[11px] leading-snug text-zinc-400">
        {!allowLiveExecution ? (
          <li className="flex gap-2">
            <span className="text-[#00ffc8]/70" aria-hidden>
              ·
            </span>
            <span>Live execution locked by risk controls</span>
          </li>
        ) : (
          <li className="flex gap-2">
            <span className="text-[#00ffc8]/70" aria-hidden>
              ·
            </span>
            <span>Live execution is allowed when you connect and confirm in trade flows.</span>
          </li>
        )}
        {requireConfirmation ? (
          <li className="flex gap-2">
            <span className="text-[#00ffc8]/70" aria-hidden>
              ·
            </span>
            <span>Orders require confirmation</span>
          </li>
        ) : null}
        {paperModeDefault ? (
          <li className="flex gap-2">
            <span className="text-[#00ffc8]/70" aria-hidden>
              ·
            </span>
            <span>Paper mode preferred by default</span>
          </li>
        ) : null}
      </ul>

      <div className="mt-3 flex flex-col gap-2">
        <button
          type="button"
          onClick={onPaperPreview}
          className="w-full rounded-xl border border-[#00ffc8]/35 bg-[#00ffc8]/10 py-2.5 text-sm font-semibold text-[#00ffc8] transition hover:bg-[#00ffc8]/15"
        >
          {primaryLabel}
        </button>
        <Link
          to="/risk"
          className="flex w-full items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-[#00ffc8]/25 hover:text-zinc-100"
        >
          Risk controls
        </Link>
      </div>
    </motion.div>
  );
}
