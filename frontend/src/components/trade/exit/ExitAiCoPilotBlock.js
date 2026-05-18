"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExitAiCoPilotBlock = ExitAiCoPilotBlock;
function ExitAiCoPilotBlock(_a) {
    var model = _a.model, exitMode = _a.exitMode, onExitModeChange = _a.onExitModeChange, onCloseNow = _a.onCloseNow, _b = _a.actionsDisabled, actionsDisabled = _b === void 0 ? false : _b, _c = _a.compact, compact = _c === void 0 ? false : _c;
    var aiOn = exitMode !== 'manual';
    var pad = compact ? 'px-3 py-2.5' : 'px-3 py-3';
    var titleSz = compact ? 'text-[9px]' : 'text-[10px]';
    var intentSz = compact ? 'text-[12px]' : 'text-[13px]';
    return (<section className={"rounded-2xl border bg-landing-surface landing-panel-texture ".concat(pad, " ").concat(model.panelToneClass)} aria-label="Exit AI co-pilot">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={"".concat(titleSz, " font-bold uppercase tracking-[0.16em] text-landing-muted")}>Exit AI</p>
          <p className="mt-1 text-sm font-bold tracking-tight text-landing-text">{model.statusTitle}</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-landing-accent-hi/90">
            {model.directionLine}
          </p>
        </div>
        {aiOn ? (<span className="shrink-0 rounded-full border border-landing-accent/35 bg-landing-accent-dim/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-landing-accent-hi">
            Active
          </span>) : (<span className="shrink-0 rounded-full border border-white/[0.1] bg-black/30 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-landing-muted">
            Manual
          </span>)}
      </div>

      <p className={"mt-2 leading-snug text-landing-text/95 ".concat(intentSz)}>{model.intentLine}</p>

      {exitMode === 'assisted' ? (<p className="mt-2 rounded-lg border border-white/[0.06] bg-black/20 px-2 py-1.5 text-[10px] leading-snug text-landing-muted">
          Suggestion mode — readouts update as price moves; you confirm any exchange action.
        </p>) : null}
      {exitMode === 'auto' ? (<p className="mt-2 rounded-lg border border-landing-accent/25 bg-landing-accent-dim/20 px-2 py-1.5 text-[10px] leading-snug text-landing-accent-hi/90">
          Auto mode — exits may run within your safeguard limits. You can switch to static or assisted anytime.
        </p>) : null}

      {model.confidenceLine ? (<p className="mt-2 text-[11px] leading-relaxed text-landing-muted">{model.confidenceLine}</p>) : null}

      <p className="mt-2 border-t border-white/[0.06] pt-2 text-[11px] leading-relaxed text-landing-text/88">
        <span className="font-semibold text-landing-accent-hi/95">Next if conditions shift · </span>
        {model.actionPreview}
      </p>

      {model.contextLine ? (<p className="mt-2 text-[11px] leading-relaxed text-landing-muted">{model.contextLine}</p>) : null}

      <div className={"mt-3 flex flex-wrap gap-2 ".concat(compact ? '' : '')}>
        <button type="button" disabled={actionsDisabled} onClick={onCloseNow} className="rounded-xl border border-rose-400/35 bg-rose-500/12 px-3 py-2 text-[11px] font-bold text-rose-100 transition hover:bg-rose-500/18 active:scale-[0.99] disabled:opacity-45">
          Close now
        </button>
        {aiOn ? (<button type="button" disabled={actionsDisabled} onClick={function () { return onExitModeChange('manual'); }} className="rounded-xl border border-white/[0.1] bg-black/25 px-3 py-2 text-[11px] font-bold text-landing-text transition hover:border-white/[0.14] active:scale-[0.99] disabled:opacity-45">
            Use static SL/TP
          </button>) : (<button type="button" disabled={actionsDisabled} onClick={function () { return onExitModeChange('assisted'); }} className="rounded-xl border border-landing-accent/35 bg-landing-accent-dim/50 px-3 py-2 text-[11px] font-bold text-landing-accent-hi transition hover:border-landing-accent/45 active:scale-[0.99] disabled:opacity-45">
            Enable exit AI
          </button>)}
      </div>
    </section>);
}
