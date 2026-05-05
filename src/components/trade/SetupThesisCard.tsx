import { motion } from 'framer-motion';

export type SetupThesisCardProps = {
  thesis: string;
  rationale: string;
  timeframeAlignment?: string[];
};

export function SetupThesisCard({ thesis, rationale, timeframeAlignment }: SetupThesisCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-sm"
    >
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#00ffc8]/90">Why this setup exists</h2>
      <div className="mt-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Thesis</p>
        <p className="mt-1 text-sm font-medium leading-snug text-zinc-100">{thesis}</p>
      </div>
      <div className="mt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Rationale</p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-400">{rationale}</p>
      </div>
      {timeframeAlignment && timeframeAlignment.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {timeframeAlignment.map((tf) => (
            <span
              key={tf}
              className="rounded-md border border-white/10 bg-black/30 px-2 py-0.5 text-[10px] font-medium text-zinc-400"
            >
              {tf}
            </span>
          ))}
        </div>
      ) : null}
    </motion.section>
  );
}
