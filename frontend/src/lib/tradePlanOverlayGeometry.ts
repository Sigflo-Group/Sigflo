/** Half-width of entry band as a fraction of entry→stop distance (clamped). */
const BAND_FRAC = 0.08;
const BAND_MIN_PCT = 0.06;
const BAND_MAX_PCT = 0.35;

export function entryBandPrices(entry: number, stop: number): { lo: number; hi: number } {
  const span = Math.abs(entry - stop);
  const half = Math.min(
    Math.max(span * BAND_FRAC, entry * (BAND_MIN_PCT / 100)),
    entry * (BAND_MAX_PCT / 100),
  );
  return { lo: entry - half, hi: entry + half };
}

export function targetBandPrices(target: number, entry: number, stop: number): { lo: number; hi: number } {
  const ref = Math.max(Math.abs(target - entry), Math.abs(entry - stop) * 0.2, target * 0.0008);
  /** Was 0.35 — bands dominated the pane; ~0.14 keeps a readable exit zone without swallowing the chart. */
  const half = ref * 0.14;
  return { lo: target - half, hi: target + half };
}

/** % distance from last to level (signed: long stop below = negative when last above stop). */
export function pctToLevel(last: number, level: number, ref: number): number {
  if (!(ref > 0)) return 0;
  return ((last - level) / ref) * 100;
}

export function stopProximityBoost(last: number, stop: number, entry: number): number {
  const ref = Math.abs(entry) > 0 ? Math.abs(entry) : 1;
  const d = Math.abs(last - stop) / ref;
  if (d < 0.002) return 1;
  if (d < 0.004) return 0.85;
  if (d < 0.008) return 0.65;
  return 0.45;
}

export function targetProximityBoost(last: number, target: number, entry: number): number {
  const ref = Math.abs(entry) > 0 ? Math.abs(entry) : 1;
  const d = Math.abs(last - target) / ref;
  if (d < 0.003) return 1;
  if (d < 0.006) return 0.8;
  return 0.55;
}
