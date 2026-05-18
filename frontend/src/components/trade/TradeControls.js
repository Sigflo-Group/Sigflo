"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradeControls = TradeControls;
var react_1 = require("react");
var OrderInputsCard_1 = require("@/components/trade/OrderInputsCard");
var PreTradeWarningCard_1 = require("@/components/trade/PreTradeWarningCard");
var formatQuote_1 = require("@/lib/formatQuote");
var sound_1 = require("@/utils/sound");
function fmtManageSignedUsd(n) {
    var sign = n >= 0 ? '+' : '-';
    return "".concat(sign, "$").concat(Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
}
function fmtManageSignedPct(n) {
    var sign = n >= 0 ? '+' : '-';
    return "".concat(sign).concat(Math.abs(n).toFixed(1), "%");
}
function manageSizeSummary(ctx) {
    var base = ctx.pair.includes('/') ? ctx.pair.split('/')[0].trim() : ctx.pair;
    if (ctx.posSize != null && Number.isFinite(ctx.posSize)) {
        return "".concat((0, formatQuote_1.formatQuoteNumber)(Math.abs(ctx.posSize)), " ").concat(base);
    }
    return "\u2248 $".concat(Math.round(ctx.positionUsd).toLocaleString('en-US'), " position size");
}
function TradeControls(props) {
    var manageDataInvalid = props.manageDataInvalid, ticketIntent = props.ticketIntent, onClosePosition = props.onClosePosition, onAddToPosition = props.onAddToPosition, market = props.market, mergedModel = props.mergedModel, isManageMode = props.isManageMode, manageCtx = props.manageCtx, managePnlDisplay = props.managePnlDisplay, markForManage = props.markForManage, manageInsightLine = props.manageInsightLine, amountUsd = props.amountUsd, leverage = props.leverage, managePositionLeverage = props.managePositionLeverage, side = props.side, stopStr = props.stopStr, targetStr = props.targetStr, onAmountChange = props.onAmountChange, onLeverageChange = props.onLeverageChange, onStopStrChange = props.onStopStrChange, onTargetStrChange = props.onTargetStrChange, metrics = props.metrics, estFeeUsd = props.estFeeUsd, balanceLabel = props.balanceLabel, balanceHelper = props.balanceHelper, displayBalanceUsd = props.displayBalanceUsd, fundingBalanceUsd = props.fundingBalanceUsd, fundingBalanceAsset = props.fundingBalanceAsset, minOrderUsd = props.minOrderUsd, orderSymbol = props.orderSymbol, maxLeverage = props.maxLeverage, utaMarginInUseUsd = props.utaMarginInUseUsd, utaEquityUsd = props.utaEquityUsd, utaUnrealizedPnlUsd = props.utaUnrealizedPnlUsd, utaWalletBalanceUsd = props.utaWalletBalanceUsd, assetTransferHref = props.assetTransferHref, manageFuturesTpSl = props.manageFuturesTpSl, _a = props.suppressLegacyManageHero, suppressLegacyManageHero = _a === void 0 ? false : _a, quoteMarkPrice = props.quoteMarkPrice, quoteIndexPrice = props.quoteIndexPrice, futuresTpSlTriggerBy = props.futuresTpSlTriggerBy, onFuturesTpSlTriggerByChange = props.onFuturesTpSlTriggerByChange, slTpPercentEntryAnchor = props.slTpPercentEntryAnchor, onPartialPositionScaleOut = props.onPartialPositionScaleOut, _b = props.partialPositionScaleOutBusy, partialPositionScaleOutBusy = _b === void 0 ? false : _b;
    var passLevelsToOrderCard = !isManageMode || (isManageMode && market === 'futures');
    var slTpEntryChipForCard = slTpPercentEntryAnchor != null &&
        Number.isFinite(slTpPercentEntryAnchor) &&
        slTpPercentEntryAnchor > 0
        ? 'avg'
        : 'entry';
    var prevRiskWarnRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(function () {
        if (isManageMode)
            return;
        var high = metrics.liquidationRisk === 'High';
        var lowScore = metrics.riskSummary.tradeScore < 45;
        var warn = high || lowScore;
        var prev = prevRiskWarnRef.current;
        prevRiskWarnRef.current = { high: high, lowScore: lowScore };
        if (prev == null)
            return;
        if (warn && !prev.high && !prev.lowScore) {
            (0, sound_1.playAlertSound)();
        }
    }, [isManageMode, metrics.liquidationRisk, metrics.riskSummary.tradeScore]);
    return (<div className="mx-auto flex w-full max-w-lg flex-col space-y-1 px-3 pb-4 pt-0">
      {manageDataInvalid ? (<p className="rounded-xl border border-amber-500/25 bg-amber-500/[0.08] px-3 py-2.5 text-center text-[11px] leading-snug text-amber-100/90">
          Could not load this position from the URL (missing pair, size, or side). Open the position from Portfolio
          again, or switch back to the trade scanner.
        </p>) : null}
      {ticketIntent === 'close' ? (<div className="space-y-2 rounded-xl border border-rose-500/20 bg-rose-500/[0.07] px-3 py-2.5">
          <p className="text-center text-[11px] leading-snug text-rose-100/90">
            Plan your exit on the chart — closing still happens on the exchange.
          </p>
          {onClosePosition ? (<button type="button" onClick={onClosePosition} className="w-full rounded-xl border border-rose-400/40 bg-rose-500/[0.18] py-3 text-sm font-bold text-rose-50 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition hover:bg-rose-500/25 active:scale-[0.99]">
              Close position
            </button>) : null}
        </div>) : null}
      {ticketIntent === 'add' ? (<div className="space-y-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-2.5">
          <p className="text-center text-[11px] leading-snug text-emerald-100/90">
            Size up below to mirror how much more you want on this book.
          </p>
          {onAddToPosition ? (<button type="button" onClick={onAddToPosition} className="w-full rounded-xl bg-sigflo-accent py-3 text-sm font-bold text-sigflo-bg shadow-glow transition hover:brightness-110 active:scale-[0.99]">
              Add to position
            </button>) : null}
        </div>) : null}

      {isManageMode && managePnlDisplay && manageCtx && !suppressLegacyManageHero ? (<>
          <div className={"rounded-2xl border px-3 py-2.5 ".concat(managePnlDisplay.pnlUsd >= 0
                ? 'border-emerald-400/20 bg-emerald-500/[0.06] shadow-[0_0_36px_-14px_rgba(52,211,153,0.28)]'
                : 'border-rose-400/15 bg-rose-950/[0.22] shadow-[inset_0_1px_0_0_rgba(248,113,113,0.08)]')}>
            <p className={"font-mono text-2xl font-bold tabular-nums tracking-tight ".concat(managePnlDisplay.pnlUsd >= 0 ? 'text-emerald-300' : 'text-rose-300')}>
              {fmtManageSignedUsd(managePnlDisplay.pnlUsd)}
            </p>
            <p className={"mt-0.5 font-mono text-lg font-semibold tabular-nums ".concat(managePnlDisplay.pnlUsd >= 0 ? 'text-emerald-200/90' : 'text-rose-200/90')}>
              ({fmtManageSignedPct(managePnlDisplay.pnlPct)})
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-sigflo-surface sigflo-panel-texture p-3.5">
            <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5">
              <span className="min-w-0 truncate text-lg font-bold text-white">{manageCtx.pair}</span>
              <span className={"shrink-0 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ".concat(manageCtx.side === 'long' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300')}>
                {manageCtx.side === 'long' ? 'LONG' : 'SHORT'}
              </span>
            </div>
            <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
              <div>
                <dt className="text-sigflo-muted">Entry</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-white">${(0, formatQuote_1.formatQuoteNumber)(manageCtx.entryPrice)}</dd>
              </div>
              <div>
                <dt className="text-sigflo-muted">Current</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-white">${(0, formatQuote_1.formatQuoteNumber)(markForManage)}</dd>
              </div>
              <div>
                <dt className="text-sigflo-muted">Size</dt>
                <dd className="mt-0.5 font-semibold text-white">{manageSizeSummary(manageCtx)}</dd>
              </div>
              <div>
                <dt className="text-sigflo-muted">Leverage</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-white">
                  {market === 'futures' ? "".concat(managePositionLeverage !== null && managePositionLeverage !== void 0 ? managePositionLeverage : leverage, "\u00D7") : '1× spot'}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-sigflo-muted">Unrealized PnL (plan)</dt>
                <dd className={"mt-0.5 font-mono font-semibold tabular-nums ".concat(managePnlDisplay.pnlUsd >= 0 ? 'text-emerald-300' : 'text-rose-300')}>
                  {fmtManageSignedUsd(managePnlDisplay.pnlUsd)} ({fmtManageSignedPct(managePnlDisplay.pnlPct)})
                </dd>
              </div>
            </dl>
            {manageInsightLine ? (<p className="mt-3 border-t border-white/[0.06] pt-2.5 text-[11px] font-medium leading-snug text-cyan-200/90">
                {manageInsightLine}
              </p>) : null}
          </div>
        </>) : null}

      <OrderInputsCard_1.OrderInputsCard market={market} balanceUsd={metrics.balanceUsd} displayBalanceUsd={displayBalanceUsd} amountUsd={amountUsd} leverage={leverage} side={side} positionSizeUsd={metrics.positionSizeUsd} walletUsedPct={metrics.walletUsedPct} liquidationRisk={metrics.liquidationRisk} onAmountChange={onAmountChange} onLeverageChange={onLeverageChange} onSideChange={function () { }} lockSide={isManageMode} showSideToggle={false} panelTitle={isManageMode ? 'Margin (add / reduce)' : 'Position size'} hideLiquidationFooter={isManageMode} quoteLastPrice={mergedModel.lastPrice} quoteMarkPrice={quoteMarkPrice !== null && quoteMarkPrice !== void 0 ? quoteMarkPrice : undefined} quoteIndexPrice={quoteIndexPrice !== null && quoteIndexPrice !== void 0 ? quoteIndexPrice : undefined} quotePair={mergedModel.pair} referenceEntryPrice={slTpPercentEntryAnchor != null &&
            Number.isFinite(slTpPercentEntryAnchor) &&
            slTpPercentEntryAnchor > 0
            ? slTpPercentEntryAnchor
            : mergedModel.entry} balanceLabel={balanceLabel} balanceHelper={balanceHelper} fundingBalanceUsd={fundingBalanceUsd} fundingBalanceAsset={fundingBalanceAsset} minOrderUsd={minOrderUsd} orderSymbol={orderSymbol} maxLeverage={maxLeverage} utaMarginInUseUsd={utaMarginInUseUsd} utaEquityUsd={utaEquityUsd} utaUnrealizedPnlUsd={utaUnrealizedPnlUsd} utaWalletBalanceUsd={utaWalletBalanceUsd} assetTransferHref={assetTransferHref} stopInput={passLevelsToOrderCard ? stopStr : undefined} takeProfitInput={passLevelsToOrderCard ? targetStr : undefined} onStopInputChange={passLevelsToOrderCard ? onStopStrChange : undefined} onTakeProfitInputChange={passLevelsToOrderCard ? onTargetStrChange : undefined} futuresTpSlTriggerBy={market === 'futures' ? futuresTpSlTriggerBy : undefined} onFuturesTpSlTriggerByChange={market === 'futures' ? onFuturesTpSlTriggerByChange : undefined} compactStats={!isManageMode
            ? {
                marginUsd: metrics.amountUsedUsd,
                estFeeUsd: estFeeUsd,
                liquidationPrice: market === 'futures' ? metrics.liquidation : null,
                riskLevel: metrics.liquidationRisk,
                riskMeterPct: metrics.riskSummary.riskMeterPct,
            }
            : undefined} onPartialPositionScaleOut={onPartialPositionScaleOut} partialPositionScaleOutBusy={partialPositionScaleOutBusy} slTpEntryChip={slTpEntryChipForCard}/>

      {manageFuturesTpSl ? (<div className="rounded-xl border border-white/[0.08] bg-black/22 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sigflo-muted">Exchange TP / SL</p>
          <p className="mt-1 text-[10px] leading-snug text-sigflo-muted/90">
            Full-position TP/SL on Bybit uses the trigger you pick in Position size (Mark / Last / Index). Empty fields
            clear that leg. Confirm on the exchange.
          </p>
          <button type="button" disabled={!manageFuturesTpSl.canApplyAll || manageFuturesTpSl.pending} onClick={manageFuturesTpSl.onApplyAll} className="mt-2.5 w-full rounded-xl border border-[#00ffc8]/35 bg-[#00ffc8]/12 py-2.5 text-xs font-bold text-[#00ffc8] transition hover:bg-[#00ffc8]/18 disabled:cursor-not-allowed disabled:opacity-45">
            {manageFuturesTpSl.pending ? 'Applying…' : 'Apply all changes on exchange'}
          </button>
          <button type="button" disabled={!manageFuturesTpSl.canApply || manageFuturesTpSl.pending} onClick={manageFuturesTpSl.onApply} className="mt-1.5 w-full rounded-xl border border-white/[0.12] bg-white/[0.03] py-2 text-[11px] font-semibold text-sigflo-muted transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-45">
            {manageFuturesTpSl.pending ? 'Updating…' : 'Apply TP / SL only'}
          </button>
          {manageFuturesTpSl.hasPendingChanges ? (<p className="mt-1 text-[10px] text-sigflo-muted/90">
              Pending manage edits detected. Apply all will execute size changes as a real market order, then sync TP/SL.
            </p>) : (<p className="mt-1 text-[10px] text-sigflo-muted/70">
              No pending edits in manage controls.
            </p>)}
        </div>) : null}

      {!isManageMode ? (<PreTradeWarningCard_1.PreTradeWarningCard walletUsedPct={metrics.walletUsedPct} leverage={metrics.leverage} riskLevel={metrics.liquidationRisk} riskMeterPct={metrics.riskSummary.riskMeterPct} tradeScore={metrics.riskSummary.tradeScore} setupTradeConflictMessage={metrics.riskSummary.setupTradeConflictMessage} walletImpactLabel={metrics.riskSummary.walletImpactLabel} primaryMessage={metrics.riskSummary.primaryMessage} warnings={metrics.riskSummary.warnings}/>) : null}
    </div>);
}
