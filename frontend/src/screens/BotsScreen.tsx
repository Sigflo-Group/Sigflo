import { motion } from 'framer-motion';

const COMING_FEATURES = [
  {
    title: 'Automated signal execution',
    description: 'Let bots place trades automatically when high-confidence signals trigger, with configurable size and risk limits.',
  },
  {
    title: 'Custom trading strategies',
    description: 'Build and deploy your own strategies by combining entry conditions, filters, and exit rules.',
  },
  {
    title: 'Smart stop-loss & take-profit',
    description: 'Bots manage your positions with trailing stops, partial takes, and dynamic invalidation levels.',
  },
  {
    title: 'Risk management rules',
    description: 'Set daily drawdown caps, max position size, leverage limits, and cooldown periods per pair.',
  },
  {
    title: 'Backtesting engine',
    description: 'Replay historical market data to see how your strategy would have performed before going live.',
  },
  {
    title: 'Performance analytics',
    description: 'Detailed PnL breakdown, win-rate by pair, Sharpe ratio, and drawdown curves per bot.',
  },
];

export default function BotsScreen() {
  return (
    <div className="min-h-[100dvh] bg-[#050505] pb-[max(6rem,env(safe-area-inset-bottom))] pt-4">
      <div className="mx-auto w-full max-w-lg space-y-6 px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/[0.06] bg-sigflo-surface sigflo-panel-texture px-3 py-2.5">
            <h1 className="text-sm font-bold uppercase tracking-[0.14em] text-sigflo-text">Bots</h1>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.06] p-4 text-center"
        >
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 ring-1 ring-cyan-400/20">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-cyan-300">
              <rect x="5" y="8" width="14" height="10" rx="2" stroke="currentColor" strokeWidth={1.8} />
              <path d="M9 8V6a2 2 0 012-2h2a2 2 0 012 2v2" stroke="currentColor" strokeWidth={1.8} />
              <circle cx="10" cy="13" r="1" fill="currentColor" />
              <circle cx="14" cy="13" r="1" fill="currentColor" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-white">Coming soon</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-sigflo-muted">
            Automated trading bots are in active development. Here is what we are building:
          </p>
        </motion.div>

        <div className="space-y-2">
          {COMING_FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.1 + i * 0.04 }}
              className="rounded-xl border border-white/[0.06] bg-sigflo-surface px-3.5 py-3"
            >
              <h3 className="text-[13px] font-semibold text-white">{feature.title}</h3>
              <p className="mt-0.5 text-[12px] leading-relaxed text-sigflo-muted">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="text-center text-[11px] text-sigflo-muted"
        >
          Stay tuned — we will notify you when bots go live.
        </motion.p>
      </div>
    </div>
  );
}
