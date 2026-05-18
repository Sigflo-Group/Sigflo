"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotHeader = BotHeader;
function BotHeader(_a) {
    var pair = _a.pair, freshness = _a.freshness, statusLabel = _a.statusLabel, statusTextClass = _a.statusTextClass, statusDotClass = _a.statusDotClass;
    return (<header className="rounded-2xl border border-white/[0.07] bg-sigflo-surface sigflo-panel-texture p-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">{pair} / USDT</h1>
          <p className="mt-0.5 text-[10px] text-sigflo-muted">Triggered {freshness}</p>
        </div>
        <span className={"inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] ".concat(statusTextClass)}>
          <span className="relative flex h-2 w-2">
            <span className={"absolute inline-flex h-full w-full animate-pulse-dot rounded-full ".concat(statusDotClass, " [animation-duration:2.2s]")}/>
            <span className={"relative inline-flex h-full w-full rounded-full ".concat(statusDotClass)}/>
          </span>
          {statusLabel}
        </span>
      </div>
    </header>);
}
