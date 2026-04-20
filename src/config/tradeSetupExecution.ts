/**
 * Setup vs execution model — tunable thresholds.
 * Separates “when to watch/act” (setup) from “how well you filled” (execution).
 */

/** After UI shows Triggered, entries within this window are never graded Weak. */
export const SETUP_TRIGGER_GRACE_WINDOW_MS = 15_000;

/**
 * Max **adverse** deviation from ideal entry (percent of ideal price) for Strong execution.
 * Favorable fills (better than ideal) always qualify as Strong if within tiny noise.
 */
export const EXECUTION_STRONG_MAX_ADVERSE_DEVIATION_PCT = 0.18;

/** Max adverse deviation (%) for Okay before Weak (outside grace window). */
export const EXECUTION_OKAY_MAX_ADVERSE_DEVIATION_PCT = 0.65;
