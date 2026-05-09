import type { SetupScoreLabel } from '@/types/signal';

/**
 * Short band names from `setupScoreBandShort` — single source for setup-tier colours.
 * Order: best → worst, then structural risk override.
 */
export const SETUP_BAND_SHORT_ORDER = [
  'High conviction',
  'Strong',
  'Moderate',
  'Developing',
  'No trade',
  'Risky / Exhausted',
] as const;

export type SetupBandShort = (typeof SETUP_BAND_SHORT_ORDER)[number];

function isSetupBandShort(s: string): s is SetupBandShort {
  return (SETUP_BAND_SHORT_ORDER as readonly string[]).includes(s);
}

/** Map full score labels (e.g. `Strong setup`) to the same short key as the dock. */
export function setupBandShortFromFullLabel(full: SetupScoreLabel | string): string {
  return String(full)
    .replace(/\s+setup$/i, '')
    .replace(/\s+quality$/i, '');
}

/**
 * Dense-row emphasis: text + soft glow. Used in the price-chart dock; tune here for app-wide consistency.
 */
const DOCK_EMPHASIS: Record<SetupBandShort, string> = {
  'High conviction':
    'font-semibold text-amber-200/95 [text-shadow:0_0_6px_rgba(251,191,36,0.55),0_0_14px_rgba(245,158,11,0.3)]',
  Strong:
    'font-semibold text-emerald-200/95 [text-shadow:0_0_6px_rgba(52,211,153,0.55),0_0_14px_rgba(34,197,94,0.32)]',
  Moderate:
    'font-semibold text-sky-200/95 [text-shadow:0_0_6px_rgba(56,189,248,0.48),0_0_14px_rgba(14,165,233,0.28)]',
  Developing:
    'font-semibold text-cyan-200/95 [text-shadow:0_0_6px_rgba(34,211,238,0.42),0_0_14px_rgba(8,145,178,0.24)]',
  'No trade':
    'font-semibold text-rose-200/95 [text-shadow:0_0_6px_rgba(251,113,133,0.52),0_0_14px_rgba(244,63,94,0.28)]',
  'Risky / Exhausted':
    'font-semibold text-fuchsia-200/95 [text-shadow:0_0_6px_rgba(232,121,249,0.45),0_0_14px_rgba(192,38,211,0.28)]',
};

const DOCK_FALLBACK = 'font-semibold text-white/82';

export function setupBandDockEmphasisClass(bandShort: string): string {
  if (isSetupBandShort(bandShort)) return DOCK_EMPHASIS[bandShort];
  return DOCK_FALLBACK;
}

/** When you only have the full `setupScoreLabel` string from data. */
export function setupBandDockEmphasisClassFromFullLabel(full: SetupScoreLabel | string): string {
  return setupBandDockEmphasisClass(setupBandShortFromFullLabel(full));
}

/** Chart dock grid only — keeps the 2×2 box narrow so the row fits before the collapse chevron. */
export function setupBandDockCompactLabel(bandShort: string): string {
  if (bandShort === 'Risky / Exhausted') return 'Risky/exh.';
  return bandShort;
}
