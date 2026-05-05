import type { AlertChannel, AlertPreference } from '@/types/alerts';
import { playUiTapSound } from '@/utils/sound';

const SCORE_OPTIONS = [70, 75, 80, 85] as const;

export type ReadyAlertSettingsProps = {
  value: AlertPreference;
  onChange: (next: AlertPreference) => void;
};

function toggleState(states: ('Ready' | 'Triggered')[], s: 'Ready' | 'Triggered'): ('Ready' | 'Triggered')[] {
  const has = states.includes(s);
  const next = has ? states.filter((x) => x !== s) : [...states, s];
  return next.length > 0 ? next : states;
}

function toggleChannel(channels: AlertChannel[], c: Exclude<AlertChannel, 'push'>): AlertChannel[] {
  const has = channels.includes(c);
  const next = has ? channels.filter((x) => x !== c) : [...channels, c];
  return next.length > 0 ? next : channels;
}

export function ReadyAlertSettings({ value, onChange }: ReadyAlertSettingsProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-3 backdrop-blur-sm">
      <h2 className="text-sm font-semibold text-zinc-100">Ready setup alerts</h2>
      <p className="mt-1 text-[11px] leading-snug text-zinc-500">
        Get notified when a setup becomes worth reviewing under high-quality conditions.
      </p>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
        <span className="text-[12px] font-medium text-zinc-300">Alerts</span>
        <button
          type="button"
          role="switch"
          aria-checked={value.enabled ? 'true' : 'false'}
          aria-label={value.enabled ? 'Turn ready setup alerts off' : 'Turn ready setup alerts on'}
          title={value.enabled ? 'Turn alerts off' : 'Turn alerts on'}
          onClick={() => {
            playUiTapSound();
            onChange({ ...value, enabled: !value.enabled });
          }}
          className={`relative h-7 w-11 shrink-0 rounded-full border transition ${
            value.enabled
              ? 'border-[#00ffc8]/35 bg-[rgba(0,255,200,0.12)]'
              : 'border-white/10 bg-black/40'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-zinc-200 shadow transition-transform ${
              value.enabled ? 'translate-x-[18px] bg-[#b8fff0]' : ''
            }`}
          />
        </button>
      </div>

      <div className={`mt-3 space-y-2 border-t border-white/[0.06] pt-3 ${value.enabled ? '' : 'pointer-events-none opacity-45'}`}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Score threshold</p>
        <div className="flex flex-wrap gap-1.5">
          {SCORE_OPTIONS.map((n) => {
            const on = value.minScore === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => {
                  playUiTapSound();
                  onChange({ ...value, minScore: n });
                }}
                className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                  on
                    ? 'border-[#00ffc8]/35 bg-[rgba(0,255,200,0.1)] text-[#c5f5e8]'
                    : 'border-white/10 bg-black/30 text-zinc-400 hover:border-white/16'
                }`}
              >
                {n}+
              </button>
            );
          })}
        </div>

        <p className="pt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">When</p>
        <div className="flex flex-wrap gap-1.5">
          {(['Ready', 'Triggered'] as const).map((s) => {
            const on = value.states.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  playUiTapSound();
                  onChange({ ...value, states: toggleState(value.states, s) });
                }}
                className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                  on
                    ? 'border-[#00ffc8]/35 bg-[rgba(0,255,200,0.1)] text-[#c5f5e8]'
                    : 'border-white/10 bg-black/30 text-zinc-400 hover:border-white/16'
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>

        <p className="pt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Channels</p>
        <div className="space-y-1.5">
          {(
            [
              { id: 'in_app' as const, label: 'In-app' },
              { id: 'sound' as const, label: 'Sound' },
            ] as const
          ).map(({ id, label }) => {
            const on = value.channels.includes(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  playUiTapSound();
                  onChange({ ...value, channels: toggleChannel(value.channels, id) });
                }}
                className={`flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-left text-[12px] font-medium transition ${
                  on
                    ? 'border-[#00ffc8]/30 bg-[rgba(0,255,200,0.08)] text-[#d2faf0]'
                    : 'border-white/10 bg-black/25 text-zinc-400 hover:border-white/14'
                }`}
              >
                {label}
                <span className={`text-[10px] ${on ? 'text-[#9fe8d6]' : 'text-zinc-600'}`}>{on ? 'On' : 'Off'}</span>
              </button>
            );
          })}
          <div
            className="flex w-full cursor-not-allowed items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2 text-left opacity-70"
            aria-disabled
          >
            <span className="text-[12px] font-medium text-zinc-500">Push</span>
            <span className="text-[10px] font-medium text-zinc-600">Coming soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReadyAlertSettings;
