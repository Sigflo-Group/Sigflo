import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { markFeedWalkthroughSeen } from '@/lib/feedWalkthrough';

const STEPS = [
  {
    title: 'Your Signal Feed',
    description:
      'Signals are live market setups ranked by strength. Your best setup is at the top — tap it to review the thesis and trade plan.',
  },
  {
    title: 'Filter What Matters',
    description:
      'Use the filter chips to narrow down: Strong 75+, Actionable setups, or High Risk signals. The count updates as you filter.',
  },
  {
    title: 'Live Status',
    description:
      'The status dot shows your connection to market data. Green = connected live, amber = reconnecting, gray = offline.',
  },
];

type FeedWalkthroughProps = {
  onComplete: () => void;
};

export function FeedWalkthrough({ onComplete }: FeedWalkthroughProps) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;

  const advance = () => {
    if (isLast) {
      markFeedWalkthroughSeen();
      onComplete();
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(4rem,env(safe-area-inset-top))] sm:items-center sm:pb-0">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#171A20] p-5 shadow-2xl"
        >
          <div className="flex items-center justify-center gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-6 bg-sigflo-accent' : 'w-1.5 bg-white/20'
                }`}
              />
            ))}
          </div>

          <p className="mt-5 text-center text-lg font-bold tracking-tight text-white">{STEPS[step].title}</p>
          <p className="mt-2 text-center text-[13px] leading-relaxed text-zinc-400">{STEPS[step].description}</p>

          <button
            type="button"
            onClick={advance}
            className="mt-6 flex w-full items-center justify-center rounded-xl bg-sigflo-accent py-3 text-sm font-bold text-black transition hover:brightness-110 active:scale-[0.98]"
          >
            {isLast ? 'Got it' : 'Next'}
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
