import { motion } from 'framer-motion';

export type TradeReasoningTimelineProps = {
  items: string[];
};

export function TradeReasoningTimeline({ items }: TradeReasoningTimelineProps) {
  if (items.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-sm"
    >
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Review trail</h2>
      <ol className="relative mt-3 space-y-0 border-l border-white/10 pl-4">
        {items.map((text, i) => (
          <li key={`${i}-${text.slice(0, 24)}`} className="relative pb-3 last:pb-0">
            <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full border border-[#00ffc8]/40 bg-[#00ffc8]/25" />
            <p className="text-xs leading-snug text-zinc-400">{text}</p>
          </li>
        ))}
      </ol>
    </motion.section>
  );
}
