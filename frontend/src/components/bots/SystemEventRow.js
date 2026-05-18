"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemEventRow = SystemEventRow;
function severityColor(severity) {
    if (severity === 'success')
        return 'bg-emerald-300';
    if (severity === 'warning')
        return 'bg-amber-300';
    if (severity === 'danger')
        return 'bg-rose-400';
    return 'bg-cyan-300';
}
function formatTimeAgo(iso) {
    var t = Date.parse(iso);
    if (!Number.isFinite(t))
        return 'now';
    var diffSec = Math.max(0, Math.round((Date.now() - t) / 1000));
    if (diffSec < 60)
        return "".concat(diffSec, "s ago");
    var min = Math.round(diffSec / 60);
    if (min < 60)
        return "".concat(min, "m ago");
    var hr = Math.round(min / 60);
    return "".concat(hr, "h ago");
}
function SystemEventRow(_a) {
    var event = _a.event;
    return (<div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2.5 transition duration-300">
      <span className={"mt-1 h-2 w-2 shrink-0 rounded-full ".concat(severityColor(event.severity))}/>
      <div className="min-w-0">
        <p className="text-[10px] text-zinc-500">{formatTimeAgo(event.timestamp)}</p>
        <p className="text-xs text-zinc-200">
          {event.message}{' '}
          {event.relatedPair ? (<span className="rounded-full border border-white/10 bg-black/25 px-1.5 py-0.5 text-[10px] text-zinc-400">
              {event.relatedPair}
            </span>) : null}
        </p>
      </div>
    </div>);
}
exports.default = SystemEventRow;
