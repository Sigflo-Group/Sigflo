"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManagePositionControlPanel = ManagePositionControlPanel;
var react_1 = require("react");
var ExitAiCoPilotBlock_1 = require("@/components/trade/exit/ExitAiCoPilotBlock");
var formatQuote_1 = require("@/lib/formatQuote");
var sound_1 = require("@/utils/sound");
function fmtSignedUsd(n) {
    var sign = n >= 0 ? '+' : '−';
    return "".concat(sign, "$").concat(Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
}
function fmtSignedPct(n) {
    var sign = n >= 0 ? '+' : '−';
    return "".concat(sign).concat(Math.abs(n).toFixed(2), "%");
}
function sizeSummary(ctx) {
    var base = ctx.pair.includes('/') ? ctx.pair.split('/')[0].trim() : ctx.pair;
    if (ctx.posSize != null && Number.isFinite(ctx.posSize)) {
        return "".concat((0, formatQuote_1.formatQuoteNumber)(Math.abs(ctx.posSize)), " ").concat(base);
    }
    return "\u2248 $".concat(Math.round(ctx.positionUsd).toLocaleString('en-US'), " notional");
}
function healthStyles(status, label) {
    var normalizedStatus = String(status !== null && status !== void 0 ? status : '').trim().toLowerCase();
    var normalizedLabel = String(label !== null && label !== void 0 ? label : '').trim().toLowerCase();
    var key = normalizedStatus ||
        (normalizedLabel.includes('near invalidation')
            ? 'near_invalidation'
            : normalizedLabel.includes('losing momentum')
                ? 'losing_momentum'
                : normalizedLabel.includes('risk')
                    ? 'at_risk'
                    : 'healthy');
    switch (key) {
        case 'healthy':
            return 'border-emerald-300/50 ring-1 ring-emerald-200/20 text-emerald-50';
        case 'at_risk':
            return 'border-amber-200/60 ring-1 ring-amber-100/30 text-amber-50';
        case 'losing_momentum':
            return 'border-orange-200/65 ring-1 ring-orange-100/25 text-orange-50';
        case 'near_invalidation':
            return 'border-rose-200/70 ring-1 ring-rose-100/30 text-rose-50';
        default:
            return 'border-white/[0.08] bg-black/25 text-landing-text';
    }
}
function healthSurfaceStyle(status, label) {
    var normalizedStatus = String(status !== null && status !== void 0 ? status : '').trim().toLowerCase();
    var normalizedLabel = String(label !== null && label !== void 0 ? label : '').trim().toLowerCase();
    var key = normalizedStatus ||
        (normalizedLabel.includes('near invalidation')
            ? 'near_invalidation'
            : normalizedLabel.includes('losing momentum')
                ? 'losing_momentum'
                : normalizedLabel.includes('risk')
                    ? 'at_risk'
                    : 'healthy');
    switch (key) {
        case 'healthy':
            return { backgroundColor: 'rgba(16, 185, 129, 0.24)' };
        case 'at_risk':
            return { backgroundColor: 'rgba(245, 158, 11, 0.28)' };
        case 'losing_momentum':
            return { backgroundColor: 'rgba(249, 115, 22, 0.30)' };
        case 'near_invalidation':
            return { backgroundColor: 'rgba(244, 63, 94, 0.36)' };
        default:
            return {};
    }
}
function ManagePositionControlPanel(_a) {
    var manageCtx = _a.manageCtx, pnlUsd = _a.pnlUsd, pnlPct = _a.pnlPct, mark = _a.mark, leverageLabel = _a.leverageLabel, isFutures = _a.isFutures, exchangeLegSide = _a.exchangeLegSide, health = _a.health, positionBias = _a.positionBias, exitAiModel = _a.exitAiModel, exitMode = _a.exitMode, onExitModeChange = _a.onExitModeChange, onCloseFull = _a.onCloseFull, onPartialOpen = _a.onPartialOpen, onMoveStopBreakeven = _a.onMoveStopBreakeven, onTightenStop = _a.onTightenStop, onAddToPosition = _a.onAddToPosition, onReversePosition = _a.onReversePosition, onAdjustRisk = _a.onAdjustRisk, onViewSetupOnChart = _a.onViewSetupOnChart, timeline = _a.timeline, actionsDisabled = _a.actionsDisabled, canMoveStops = _a.canMoveStops;
    var chipSide = isFutures && (exchangeLegSide === 'long' || exchangeLegSide === 'short') ? exchangeLegSide : manageCtx.side;
    var winning = pnlUsd >= 0;
    var staticActive = exitMode === 'manual';
    var aiActive = exitMode !== 'manual';
    var prevHealthStatusRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(function () {
        var s = health.status;
        var prev = prevHealthStatusRef.current;
        prevHealthStatusRef.current = s;
        if (prev == null)
            return;
        if (prev === 'healthy' && s !== 'healthy') {
            (0, sound_1.playAlertSound)();
        }
    }, [health.status]);
    return (<div className={"mx-auto w-full max-w-lg space-y-3 px-3 pt-2 ".concat(winning
            ? 'shadow-[0_0_48px_-28px_rgba(0,200,120,0.35)]'
            : 'shadow-[0_0_40px_-24px_rgba(248,113,113,0.22)]')}>
      <section className={"rounded-2xl border px-3 py-3 ".concat(winning
            ? 'border-landing-accent/20 bg-landing-surface sigflo-panel-texture'
            : 'border-rose-400/25 bg-[#1a0c10]')}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-landing-muted">Live PnL</p>
            <p className={"mt-0.5 font-mono text-3xl font-bold tabular-nums tracking-tight ".concat(winning ? 'text-emerald-300' : 'text-rose-300')}>
              {fmtSignedUsd(pnlUsd)}
            </p>
            <p className={"mt-0.5 font-mono text-lg font-semibold tabular-nums ".concat(winning ? 'text-emerald-200/90' : 'text-rose-200/90')}>
              {fmtSignedPct(pnlPct)}
            </p>
          </div>
          <span className={"shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ".concat(chipSide === 'long'
            ? 'border-landing-accent/40 bg-landing-accent-dim text-landing-accent-hi'
            : 'border-rose-400/35 bg-rose-500/15 text-rose-100')}>
            {chipSide === 'long' ? 'Long' : 'Short'}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/[0.06] pt-3 text-[11px]">
          <span className="font-semibold text-landing-text">{manageCtx.pair}</span>
          <span className="text-landing-muted">·</span>
          <span className="text-landing-muted">Size</span>
          <span className="font-medium text-landing-text">{sizeSummary(manageCtx)}</span>
          <span className="text-landing-muted">·</span>
          <span className="text-landing-muted">Lev</span>
          <span className="font-mono font-semibold text-landing-text">{leverageLabel}</span>
        </div>
        <dl className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <dt className="text-landing-muted">Entry</dt>
            <dd className="mt-0.5 font-mono font-semibold text-landing-text">${(0, formatQuote_1.formatQuoteNumber)(manageCtx.entryPrice)}</dd>
          </div>
          <div>
            <dt className="text-landing-muted">Mark</dt>
            <dd className="mt-0.5 font-mono font-semibold text-landing-text">${(0, formatQuote_1.formatQuoteNumber)(mark)}</dd>
          </div>
        </dl>
      </section>

      <section className={"rounded-2xl border px-3 py-2.5 ".concat(healthStyles(health.status, health.label))} style={healthSurfaceStyle(health.status, health.label)}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] opacity-80">Position health</p>
            <p className="mt-1 text-sm font-bold">{health.label}</p>
          </div>
          {positionBias ? (<div className="min-w-0 shrink-0 border-l border-white/[0.14] pl-2.5 sm:pl-3">
              <div className="ml-auto w-fit max-w-[min(100%,15rem)] rounded-lg border border-white/[0.1] bg-black/25 px-2 py-1.5 text-right">
                <div className="flex items-baseline justify-end gap-1.5">
                  <span className="shrink-0 text-[9px] font-bold uppercase tracking-[0.16em] opacity-75">Bias</span>
                  <p className={"min-w-0 text-sm font-bold leading-none ".concat(positionBias.variant === 'aligned'
                ? 'text-emerald-100'
                : positionBias.variant === 'counter'
                    ? 'text-amber-100'
                    : 'text-white/80')}>
                    {positionBias.title}
                  </p>
                </div>
                <p className="mt-1 text-[11px] leading-snug opacity-90">{positionBias.subtitle}</p>
              </div>
            </div>) : null}
        </div>
      </section>

      <section>
        <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-landing-muted">Quick actions</p>
        {onAdjustRisk ? (<button type="button" disabled={actionsDisabled} onClick={onAdjustRisk} className="mb-2 w-full rounded-xl border border-landing-accent/35 bg-landing-accent-dim/40 py-2.5 text-[11px] font-bold text-landing-accent-hi transition hover:border-landing-accent/50 active:scale-[0.99] disabled:opacity-45">
            Adjust risk
          </button>) : null}
        <div className="grid grid-cols-2 gap-2">
          <button type="button" disabled={actionsDisabled} onClick={onCloseFull} className="rounded-xl border border-rose-400/35 bg-rose-500/15 py-2.5 text-[11px] font-bold text-rose-100 transition hover:border-rose-300/65 hover:bg-rose-500/28 hover:text-rose-50 active:scale-[0.99] disabled:opacity-45">
            Close position
          </button>
          <button type="button" disabled={actionsDisabled} onClick={onPartialOpen} className="rounded-xl border border-white/[0.1] bg-landing-surface landing-panel-texture py-2.5 text-[11px] font-bold text-landing-text transition hover:border-landing-accent/30 active:scale-[0.99] disabled:opacity-45">
            Partial close
          </button>
          <button type="button" disabled={actionsDisabled || !canMoveStops || !isFutures} onClick={onMoveStopBreakeven} className="rounded-xl border border-white/[0.1] bg-landing-surface landing-panel-texture py-2.5 text-[11px] font-bold text-landing-text transition hover:border-landing-accent/30 active:scale-[0.99] disabled:opacity-45">
            Stop → breakeven
          </button>
          <button type="button" disabled={actionsDisabled || !canMoveStops || !isFutures} onClick={onTightenStop} className="rounded-xl border border-white/[0.1] bg-landing-surface landing-panel-texture py-2.5 text-[11px] font-bold text-landing-text transition hover:border-landing-accent/30 active:scale-[0.99] disabled:opacity-45">
            Tighten stop
          </button>
          {onReversePosition ? (<button type="button" disabled={actionsDisabled || !isFutures} onClick={onReversePosition} className="col-span-2 rounded-xl border border-amber-300/35 bg-amber-500/12 py-2.5 text-[11px] font-bold text-amber-100 transition hover:border-amber-200/65 hover:bg-amber-500/24 hover:text-amber-50 active:scale-[0.99] disabled:opacity-45">
              Reverse position
            </button>) : null}
        </div>
        <button type="button" disabled={actionsDisabled} onClick={onAddToPosition} className="mt-2 w-full rounded-xl bg-landing-accent py-3 text-sm font-bold text-landing-bg shadow-landing-glow-sm transition hover:brightness-110 active:scale-[0.99] disabled:opacity-45">
          Add to position
        </button>
      </section>

      <ExitAiCoPilotBlock_1.ExitAiCoPilotBlock model={exitAiModel} exitMode={exitMode} onExitModeChange={onExitModeChange} onCloseNow={onCloseFull} actionsDisabled={actionsDisabled}/>

      <section className="rounded-2xl border border-landing-border bg-black/25 px-3 py-2.5">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-landing-muted">Exit mode</p>
        <div className="mt-2 flex rounded-xl border border-white/[0.08] bg-landing-bg/80 p-0.5">
          <button type="button" disabled={actionsDisabled} onClick={function () { return onExitModeChange('manual'); }} className={"flex-1 rounded-lg py-2 text-[11px] font-bold transition ".concat(staticActive ? 'bg-landing-accent-dim text-landing-accent-hi' : 'text-landing-muted')}>
            Static SL/TP
          </button>
          <button type="button" disabled={actionsDisabled} onClick={function () { return onExitModeChange('assisted'); }} className={"flex-1 rounded-lg py-2 text-[11px] font-bold transition ".concat(aiActive ? 'bg-landing-accent-dim text-landing-accent-hi' : 'text-landing-muted')}>
            AI exit
          </button>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-landing-muted">
          {staticActive
            ? 'Chart shows your planned stop and target; updates sync to the exchange when you apply TP/SL.'
            : 'AI exit uses assisted automation — trims and exits follow your safeguards. Target on chart is a reference, not a fixed take-profit.'}
        </p>
        {onViewSetupOnChart ? (<button type="button" disabled={actionsDisabled} onClick={onViewSetupOnChart} className="mt-2 w-full rounded-lg border border-cyan-400/25 bg-cyan-500/[0.08] py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-cyan-100/95 transition hover:border-cyan-400/40 hover:bg-cyan-500/14 active:scale-[0.99] disabled:opacity-45">
            View on chart
          </button>) : null}
      </section>

      {timeline.length > 0 ? (<section className="rounded-2xl border border-white/[0.06] bg-black/20 px-3 py-2">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-landing-muted">Exit timeline</p>
          <ul className="mt-2 space-y-1.5">
            {timeline.map(function (line) { return (<li key={line} className="text-[11px] leading-snug text-landing-text/90 before:mr-1.5 before:text-landing-accent-hi before:content-['·']">
                {line}
              </li>); })}
          </ul>
        </section>) : null}
    </div>);
}
