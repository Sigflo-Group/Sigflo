"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineJournal = EngineJournal;
var SystemEventRow_1 = require("@/components/bots/SystemEventRow");
var JOURNAL_EVENT_TYPES = new Set([
    'setup_upgraded',
    'setup_invalidated',
    'risk_limit',
    'engine',
]);
function sortByTimeDesc(a, b) {
    return Date.parse(b.timestamp) - Date.parse(a.timestamp);
}
function EngineJournal(_a) {
    var events = _a.events, _b = _a.localEvents, localEvents = _b === void 0 ? [] : _b;
    var merged = __spreadArray(__spreadArray([], localEvents, true), events, true).filter(function (e) { return JOURNAL_EVENT_TYPES.has(e.eventType); }).sort(sortByTimeDesc);
    return (<section>
      <h2 className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Journal</h2>
      <p className="mb-2 text-[10px] leading-snug text-zinc-600">Recent signals and checks for this engine.</p>
      {merged.length > 0 ? (<div className="space-y-1.5">
          {merged.map(function (event) { return (<SystemEventRow_1.default key={event.id} event={event}/>); })}
        </div>) : (<p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[12px] text-zinc-500">
          No journal entries for this engine yet.
        </p>)}
    </section>);
}
