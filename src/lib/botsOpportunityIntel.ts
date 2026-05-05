import type { OpportunityCardModel } from '@/types/botSystem';

export function formatShortAgo(seconds: number): string {
  if (!Number.isFinite(seconds)) return '—';
  if (seconds < 60) return `${Math.max(1, Math.round(seconds))}s ago`;
  const min = Math.round(seconds / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  return `${hr}h ago`;
}

/** One-line “latest activity” from the freshest meaningful opportunity. */
export function buildLatestActivityLine(opportunities: OpportunityCardModel[]): string | null {
  if (!opportunities.length) return null;
  const sorted = [...opportunities].sort((a, b) => a.freshnessSec - b.freshnessSec);
  const focus =
    sorted.find((o) => o.state === 'Ready' || o.state === 'Triggered') ??
    sorted.find((o) => o.state === 'Building') ??
    sorted[0];
  if (!focus) return null;
  const short =
    focus.pair
      .replace(/\s*\/\s*/g, '/')
      .split('/')[0]
      ?.trim() ?? focus.pair;
  const ago = formatShortAgo(focus.freshnessSec);
  if (focus.state === 'Ready') {
    return `${short} upgraded to Ready ${ago}`;
  }
  if (focus.state === 'Triggered') {
    return `${short} triggered ${ago}`;
  }
  return `${short} · ${focus.state} ${ago}`;
}
