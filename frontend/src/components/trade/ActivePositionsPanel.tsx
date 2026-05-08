import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { ActivePositionCard as LegacyActivePositionCard } from '@/components/trade/ActivePositionCard';
import { ExitAutomationCard } from '@/components/trade/ExitAutomationCard';
import { ActivePositionCard as SigfloActivePositionCard } from '@/components/positions/ActivePositionCard';
import { syntheticFromExchangePosition } from '@/lib/exchangePositionSynthetic';
import type { SimulatedActivePosition } from '@/types/activePosition';
import type { SigfloActivePosition } from '@/types/position';
import type { PositionItem } from '@/types/integrations';
import type { MarketMode } from '@/types/trade';

type ActivePositionsPanelProps = {
  market: MarketMode;
  exchangePosition: PositionItem | null;
  /** Spot holding derived from wallet balance (no linear `position/list` row). */
  exchangeSpotDisplay: SimulatedActivePosition | null;
  /** Chart / header pair label (may differ from `BTCUSDT`). */
  displayPair: string;
  leverageFallback: number;
  markPrice: number;
  onRequestCloseAllModal: () => void;
  exitAiModeLabel: string;
  exitStrategyLabel: string;
  scenarioSummary: string;
  /** Linear futures: navigate to manage-position flow (TP/SL, add size, close ticket). */
  onOpenManagePosition?: () => void;
  /**
   * Unified Sigflo layer (exchange-backed or demo repository) for futures active management UI.
   */
  sigfloManagedLayer: SigfloActivePosition | null;
  /** Live mark for the layer card / exit automation (e.g. throttled last). */
  liveMarkForLayer?: number | null;
  onSuggestStopMove?: (suggestedStop: number | null) => void;
  onSuggestPartialTp?: () => void;
  onDisableAutomation?: () => void;
};

export function ActivePositionsPanel({
  market,
  exchangePosition,
  exchangeSpotDisplay,
  displayPair,
  leverageFallback,
  markPrice,
  onRequestCloseAllModal,
  exitAiModeLabel,
  exitStrategyLabel,
  scenarioSummary,
  onOpenManagePosition,
  sigfloManagedLayer,
  liveMarkForLayer,
  onSuggestStopMove,
  onSuggestPartialTp,
  onDisableAutomation,
}: ActivePositionsPanelProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const exchangeCardModel = useMemo(() => {
    if (!exchangePosition) return null;
    return syntheticFromExchangePosition(exchangePosition, displayPair, market, leverageFallback);
  }, [displayPair, exchangePosition, leverageFallback, market]);

  const showExchangeFutures = market === 'futures' && exchangePosition != null && exchangeCardModel != null;
  const showExchangeSpot = market === 'spot' && exchangeSpotDisplay != null;
  const showExchange = showExchangeFutures || showExchangeSpot;
  const showFuturesLayer = market === 'futures' && sigfloManagedLayer != null;
  const demoOnlyLayer = showFuturesLayer && !showExchangeFutures;

  const showPanel = showExchange || showFuturesLayer;

  if (!showPanel) return null;

  const header = demoOnlyLayer
    ? 'Active position (demo)'
    : market === 'spot'
      ? 'Bybit spot'
      : 'Bybit position';

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key="active-positions-panel"
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10, transition: { duration: 0.22 } }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className="border-t border-[#00ffc8]/14 bg-gradient-to-b from-[#00ffc8]/[0.05] to-transparent px-1.5 py-1.5 sm:px-2 sm:py-2"
      >
        <div className="mx-auto flex max-w-lg flex-col gap-1.5">
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 px-0.5">
            <span className="min-w-0 truncate text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#7ee8d3] sm:text-[10px]">
              {header}
            </span>
            <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-1.5">
              {showExchangeFutures && onOpenManagePosition ? (
                <button
                  type="button"
                  onClick={onOpenManagePosition}
                  className="rounded-md border border-cyan-400/35 bg-cyan-500/[0.08] px-2 py-1 text-[8px] font-bold uppercase tracking-wide text-cyan-100/95 transition hover:bg-cyan-500/14 sm:text-[9px]"
                >
                  Manage
                </button>
              ) : null}
              {!demoOnlyLayer ? (
                <button
                  type="button"
                  onClick={onRequestCloseAllModal}
                  className="rounded-md border border-rose-500/35 bg-rose-500/[0.08] px-2 py-1 text-[8px] font-bold uppercase tracking-wide text-rose-200/95 transition hover:bg-rose-500/16 sm:text-[9px]"
                >
                  Close all
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <AnimatePresence initial={false}>
              {showFuturesLayer && sigfloManagedLayer ? (
                <motion.div
                  key={`sigflo-layer-${sigfloManagedLayer.id}`}
                  layout
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -12, scale: 0.98, transition: { duration: 0.2 } }}
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="flex flex-col gap-1.5"
                >
                  <SigfloActivePositionCard
                    position={sigfloManagedLayer}
                    liveMarkPrice={liveMarkForLayer}
                    nowMs={nowMs}
                  />
                  <ExitAutomationCard
                    position={sigfloManagedLayer}
                    liveMarkPrice={liveMarkForLayer}
                    onSuggestStopMove={onSuggestStopMove}
                    onSuggestPartialTp={onSuggestPartialTp}
                    onDisableAutomation={onDisableAutomation}
                  />
                </motion.div>
              ) : null}
              {showExchangeSpot && exchangeSpotDisplay ? (
                <motion.div
                  key={exchangeSpotDisplay.id}
                  layout
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -12, scale: 0.98, transition: { duration: 0.2 } }}
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                >
                  <LegacyActivePositionCard
                    position={exchangeSpotDisplay}
                    markPrice={markPrice}
                    nowMs={nowMs}
                    exitAiModeLabel={exitAiModeLabel}
                    exitStrategyLabel={exitStrategyLabel}
                    scenarioSummary={scenarioSummary}
                    executionSource="exchange"
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <p className="px-0.5 text-center text-[8px] leading-snug text-sigflo-muted/85">
            {demoOnlyLayer
              ? 'Suggestion only · Live changes require confirmation — demo row, not your exchange.'
              : market === 'spot'
                ? 'Synced from your Bybit wallet — Close / Partial send market sells (base qty).'
                : 'Synced from your Bybit account — use Close to send reduce-only orders.'}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
