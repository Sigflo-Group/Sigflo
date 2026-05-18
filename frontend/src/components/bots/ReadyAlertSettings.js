"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.ReadyAlertSettings = ReadyAlertSettings;
var sound_1 = require("@/utils/sound");
var SCORE_OPTIONS = [70, 75, 80, 85];
function toggleState(states, s) {
    var has = states.includes(s);
    var next = has ? states.filter(function (x) { return x !== s; }) : __spreadArray(__spreadArray([], states, true), [s], false);
    return next.length > 0 ? next : states;
}
function toggleChannel(channels, c) {
    var has = channels.includes(c);
    var next = has ? channels.filter(function (x) { return x !== c; }) : __spreadArray(__spreadArray([], channels, true), [c], false);
    return next.length > 0 ? next : channels;
}
function ReadyAlertSettings(_a) {
    var value = _a.value, onChange = _a.onChange;
    return (<div className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-3 backdrop-blur-sm">
      <h2 className="text-sm font-semibold text-zinc-100">Ready setup alerts</h2>
      <p className="mt-1 text-[11px] leading-snug text-zinc-500">
        Get notified when a setup becomes worth reviewing under high-quality conditions.
      </p>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
        <span className="text-[12px] font-medium text-zinc-300">Alerts</span>
        <button type="button" role="switch" aria-checked={value.enabled ? 'true' : 'false'} aria-label={value.enabled ? 'Turn ready setup alerts off' : 'Turn ready setup alerts on'} title={value.enabled ? 'Turn alerts off' : 'Turn alerts on'} onClick={function () {
            (0, sound_1.playUiTapSound)();
            onChange(__assign(__assign({}, value), { enabled: !value.enabled }));
        }} className={"relative h-7 w-11 shrink-0 rounded-full border transition ".concat(value.enabled
            ? 'border-[#00ffc8]/35 bg-[rgba(0,255,200,0.12)]'
            : 'border-white/10 bg-black/40')}>
          <span className={"absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-zinc-200 shadow transition-transform ".concat(value.enabled ? 'translate-x-[18px] bg-[#b8fff0]' : '')}/>
        </button>
      </div>

      <div className={"mt-3 space-y-2 border-t border-white/[0.06] pt-3 ".concat(value.enabled ? '' : 'pointer-events-none opacity-45')}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Score threshold</p>
        <div className="flex flex-wrap gap-1.5">
          {SCORE_OPTIONS.map(function (n) {
            var on = value.minScore === n;
            return (<button key={n} type="button" onClick={function () {
                    (0, sound_1.playUiTapSound)();
                    onChange(__assign(__assign({}, value), { minScore: n }));
                }} className={"rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition ".concat(on
                    ? 'border-[#00ffc8]/35 bg-[rgba(0,255,200,0.1)] text-[#c5f5e8]'
                    : 'border-white/10 bg-black/30 text-zinc-400 hover:border-white/16')}>
                {n}+
              </button>);
        })}
        </div>

        <p className="pt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">When</p>
        <div className="flex flex-wrap gap-1.5">
          {['Ready', 'Triggered'].map(function (s) {
            var on = value.states.includes(s);
            return (<button key={s} type="button" onClick={function () {
                    (0, sound_1.playUiTapSound)();
                    onChange(__assign(__assign({}, value), { states: toggleState(value.states, s) }));
                }} className={"rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition ".concat(on
                    ? 'border-[#00ffc8]/35 bg-[rgba(0,255,200,0.1)] text-[#c5f5e8]'
                    : 'border-white/10 bg-black/30 text-zinc-400 hover:border-white/16')}>
                {s}
              </button>);
        })}
        </div>

        <p className="pt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Channels</p>
        <div className="space-y-1.5">
          {[
            { id: 'in_app', label: 'In-app' },
            { id: 'sound', label: 'Sound' },
        ].map(function (_a) {
            var id = _a.id, label = _a.label;
            var on = value.channels.includes(id);
            return (<button key={id} type="button" onClick={function () {
                    (0, sound_1.playUiTapSound)();
                    onChange(__assign(__assign({}, value), { channels: toggleChannel(value.channels, id) }));
                }} className={"flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-left text-[12px] font-medium transition ".concat(on
                    ? 'border-[#00ffc8]/30 bg-[rgba(0,255,200,0.08)] text-[#d2faf0]'
                    : 'border-white/10 bg-black/25 text-zinc-400 hover:border-white/14')}>
                {label}
                <span className={"text-[10px] ".concat(on ? 'text-[#9fe8d6]' : 'text-zinc-600')}>{on ? 'On' : 'Off'}</span>
              </button>);
        })}
          <div className="flex w-full cursor-not-allowed items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2 text-left opacity-70" aria-disabled>
            <span className="text-[12px] font-medium text-zinc-500">Push</span>
            <span className="text-[10px] font-medium text-zinc-600">Coming soon</span>
          </div>
        </div>
      </div>
    </div>);
}
exports.default = ReadyAlertSettings;
