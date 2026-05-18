"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computePositionHealth = computePositionHealth;
/**
 * Lightweight book health for manage mode — **mark vs stop distance** and **underlying move from entry**.
 *
 * `pnlPct` must be the **price change % from entry** (same units as `managePnlFromPrices`: e.g. -1.2 = -1.2%),
 * not ROE / leverage-adjusted %.
 *
 * Intentionally **does not** use scanner signal breakdown (momentum/structure): that mixed unrelated
 * setup scores with the open leg and produced false “Losing momentum” / contradictory health.
 */
function computePositionHealth(args) {
    var side = args.side, mark = args.mark, stop = args.stop, pnlPct = args.pnlPct;
    if (!Number.isFinite(mark) || mark <= 0 || !Number.isFinite(stop) || stop <= 0) {
        return { status: 'healthy', label: 'Healthy' };
    }
    var distStopPct = side === 'long' ? ((mark - stop) / mark) * 100 : ((stop - mark) / mark) * 100;
    // Tight to stop, or modestly red with stop already close
    if (distStopPct < 0.28 || (pnlPct < -0.8 && distStopPct < 0.55)) {
        return { status: 'near_invalidation', label: 'Near invalidation' };
    }
    // Underwater vs entry and stop zone is tightening — geometry only (no scanner scores)
    if (pnlPct < -1 && distStopPct < 1.05) {
        return { status: 'losing_momentum', label: 'Losing momentum' };
    }
    // Close to stop, or clearly red on the underlying; avoid flagging “at risk” on sub‑1% noise alone
    if (distStopPct < 0.65 || pnlPct < -1.2) {
        return { status: 'at_risk', label: 'At risk' };
    }
    return { status: 'healthy', label: 'Healthy' };
}
