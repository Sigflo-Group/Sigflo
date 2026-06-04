import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  readChecklist,
  updateChecklist,
  dismissChecklist,
  isChecklistDismissed,
  isChecklistComplete,
  type ChecklistProgress,
} from '@/lib/onboardingChecklist';

const ITEMS: {
  key: keyof ChecklistProgress;
  label: string;
  alwaysChecked?: boolean;
  route?: string;
}[] = [
  { key: 'viewedFirstSignal', label: 'View your first signal' },
  { key: 'paperTraded', label: 'Paper trade a setup' },
  { key: 'visitedMarkets', label: 'Explore market scanner', route: '/markets' },
  { key: 'visitedRisk', label: 'Set risk controls', route: '/risk' },
  { key: 'connectedExchange', label: 'Connect an exchange (optional)', route: '/profile' },
];

export function OnboardingChecklist() {
  const [open, setOpen] = useState(true);
  const [dismissed, setDismissed] = useState(() => isChecklistDismissed());
  const [progress, setProgress] = useState<ChecklistProgress>(() => readChecklist());

  useEffect(() => {
    const id = window.setInterval(() => {
      setProgress((prev) => {
        const next = readChecklist();
        return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
      });
    }, 3000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (isChecklistComplete(progress)) {
      dismissChecklist();
      setDismissed(true);
    }
  }, [progress]);

  const onDismiss = useCallback(() => {
    dismissChecklist();
    setDismissed(true);
  }, []);

  if (dismissed) return null;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-sigflo-elevated px-4 py-3.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-200/85">Getting Started</p>
        <span className={`shrink-0 text-xs text-zinc-500 transition ${open ? 'rotate-180' : ''}`} aria-hidden>
          ▼
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <ul className="mt-3 grid gap-2">
              <li className="flex items-center gap-2.5">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sigflo-accent/20 text-[9px] font-bold text-sigflo-accent">
                  ✓
                </span>
                <span className="text-[12px] text-zinc-300">Create account</span>
              </li>
              {ITEMS.map((item) => {
                const done = progress[item.key];
                return (
                  <li key={item.key}>
                    {item.route && !done ? (
                      <Link
                        to={item.route}
                        onClick={() => updateChecklist({ [item.key]: true })}
                        className="flex items-center gap-2.5 text-[12px] text-zinc-400 transition hover:text-zinc-200"
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold ${
                            done
                              ? 'border-sigflo-accent bg-sigflo-accent/20 text-sigflo-accent'
                              : 'border-white/20 text-transparent'
                          }`}
                        >
                          {done ? '✓' : ''}
                        </span>
                        {item.label}
                      </Link>
                    ) : (
                      <span
                        className={`flex cursor-default items-center gap-2.5 text-[12px] ${
                          done ? 'text-zinc-300' : 'text-zinc-500'
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold ${
                            done
                              ? 'border-sigflo-accent bg-sigflo-accent/20 text-sigflo-accent'
                              : 'border-white/20 text-transparent'
                          }`}
                        >
                          {done ? '✓' : ''}
                        </span>
                        {item.label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={onDismiss}
              className="mt-3 text-[11px] text-zinc-500 hover:text-zinc-300"
            >
              Dismiss
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
