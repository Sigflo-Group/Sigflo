"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivePositionsPanel = ActivePositionsPanel;
var framer_motion_1 = require("framer-motion");
var react_1 = require("react");
var ActivePositionCard_1 = require("@/components/trade/ActivePositionCard");
var ExitAutomationCard_1 = require("@/components/trade/ExitAutomationCard");
var ActivePositionCard_2 = require("@/components/positions/ActivePositionCard");
var exchangePositionSynthetic_1 = require("@/lib/exchangePositionSynthetic");
function ActivePositionsPanel(_a) {
    var market = _a.market, exchangePosition = _a.exchangePosition, exchangeSpotDisplay = _a.exchangeSpotDisplay, displayPair = _a.displayPair, leverageFallback = _a.leverageFallback, markPrice = _a.markPrice, onRequestCloseAllModal = _a.onRequestCloseAllModal, exitAiModeLabel = _a.exitAiModeLabel, exitStrategyLabel = _a.exitStrategyLabel, scenarioSummary = _a.scenarioSummary, onOpenManagePosition = _a.onOpenManagePosition, sigfloManagedLayer = _a.sigfloManagedLayer, liveMarkForLayer = _a.liveMarkForLayer, onSuggestStopMove = _a.onSuggestStopMove, onSuggestPartialTp = _a.onSuggestPartialTp, onDisableAutomation = _a.onDisableAutomation;
    var _b = (0, react_1.useState)(function () { return Date.now(); }), nowMs = _b[0], setNowMs = _b[1];
    (0, react_1.useEffect)(function () {
        var id = window.setInterval(function () { return setNowMs(Date.now()); }, 1000);
        return function () { return window.clearInterval(id); };
    }, []);
    var exchangeCardModel = (0, react_1.useMemo)(function () {
        if (!exchangePosition)
            return null;
        return (0, exchangePositionSynthetic_1.syntheticFromExchangePosition)(exchangePosition, displayPair, market, leverageFallback);
    }, [displayPair, exchangePosition, leverageFallback, market]);
    var showExchangeFutures = market === 'futures' && exchangePosition != null && exchangeCardModel != null;
    var showExchangeSpot = market === 'spot' && exchangeSpotDisplay != null;
    var showExchange = showExchangeFutures || showExchangeSpot;
    var showFuturesLayer = market === 'futures' && sigfloManagedLayer != null;
    var demoOnlyLayer = showFuturesLayer && !showExchangeFutures;
    var showPanel = showExchange || showFuturesLayer;
    if (!showPanel)
        return null;
    var header = demoOnlyLayer
        ? 'Active position (demo)'
        : market === 'spot'
            ? 'Bybit spot'
            : 'Bybit position';
    return (<framer_motion_1.AnimatePresence mode="popLayout">
      <framer_motion_1.motion.div key="active-positions-panel" layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10, transition: { duration: 0.22 } }} transition={{ type: 'spring', stiffness: 380, damping: 28 }} className="border-t border-[#00ffc8]/14 bg-gradient-to-b from-[#00ffc8]/[0.05] to-transparent px-1.5 py-1.5 sm:px-2 sm:py-2">
        <div className="mx-auto flex max-w-lg flex-col gap-1.5">
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 px-0.5">
            <span className="min-w-0 truncate text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#7ee8d3] sm:text-[10px]">
              {header}
            </span>
            <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-1.5">
              {showExchangeFutures && onOpenManagePosition ? (<button type="button" onClick={onOpenManagePosition} className="rounded-md border border-cyan-400/35 bg-cyan-500/[0.08] px-2 py-1 text-[8px] font-bold uppercase tracking-wide text-cyan-100/95 transition hover:bg-cyan-500/14 sm:text-[9px]">
                  Manage
                </button>) : null}
              {!demoOnlyLayer ? (<button type="button" onClick={onRequestCloseAllModal} className="rounded-md border border-rose-500/35 bg-rose-500/[0.08] px-2 py-1 text-[8px] font-bold uppercase tracking-wide text-rose-200/95 transition hover:bg-rose-500/16 sm:text-[9px]">
                  Close all
                </button>) : null}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <framer_motion_1.AnimatePresence initial={false}>
              {showFuturesLayer && sigfloManagedLayer ? (<framer_motion_1.motion.div key={"sigflo-layer-".concat(sigfloManagedLayer.id)} layout initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: -12, scale: 0.98, transition: { duration: 0.2 } }} transition={{ type: 'spring', stiffness: 420, damping: 32 }} className="flex flex-col gap-1.5">
                  <ActivePositionCard_2.ActivePositionCard position={sigfloManagedLayer} liveMarkPrice={liveMarkForLayer} nowMs={nowMs}/>
                  <ExitAutomationCard_1.ExitAutomationCard position={sigfloManagedLayer} liveMarkPrice={liveMarkForLayer} onSuggestStopMove={onSuggestStopMove} onSuggestPartialTp={onSuggestPartialTp} onDisableAutomation={onDisableAutomation}/>
                </framer_motion_1.motion.div>) : null}
              {showExchangeSpot && exchangeSpotDisplay ? (<framer_motion_1.motion.div key={exchangeSpotDisplay.id} layout initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: -12, scale: 0.98, transition: { duration: 0.2 } }} transition={{ type: 'spring', stiffness: 420, damping: 32 }}>
                  <ActivePositionCard_1.ActivePositionCard position={exchangeSpotDisplay} markPrice={markPrice} nowMs={nowMs} exitAiModeLabel={exitAiModeLabel} exitStrategyLabel={exitStrategyLabel} scenarioSummary={scenarioSummary} executionSource="exchange"/>
                </framer_motion_1.motion.div>) : null}
            </framer_motion_1.AnimatePresence>
          </div>

          <p className="px-0.5 text-center text-[8px] leading-snug text-sigflo-muted/85">
            {demoOnlyLayer
            ? 'Suggestion only · Live changes require confirmation — demo row, not your exchange.'
            : market === 'spot'
                ? 'Synced from your Bybit wallet — Close / Partial send market sells (base qty).'
                : 'Synced from your Bybit account — use Close to send reduce-only orders.'}
          </p>
        </div>
      </framer_motion_1.motion.div>
    </framer_motion_1.AnimatePresence>);
}
