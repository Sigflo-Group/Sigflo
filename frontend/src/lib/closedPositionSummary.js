"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildClosedPositionSummary = buildClosedPositionSummary;
/**
 * Snapshot for the post-close summary card. Uses the same P&L geometry as live unrealized (linear in move %).
 */
function buildClosedPositionSummary(pos, mark, fraction) {
    var f = Math.min(1, Math.max(0, fraction));
    if (!(f > 0))
        return null;
    var entry = Math.max(1e-9, pos.entryPrice);
    var m = Number.isFinite(mark) && mark > 0 ? mark : entry;
    var dir = pos.side === 'long' ? 1 : -1;
    var movePct = ((m - entry) / entry) * 100 * dir;
    var fullPnl = pos.positionNotionalUsd * (movePct / 100);
    var pnlUsd = fullPnl * f;
    var closedNotional = pos.positionNotionalUsd * f;
    return {
        pairLabel: pos.symbol,
        side: pos.side,
        market: pos.market,
        execution: 'exchange',
        fraction: f,
        entryPrice: pos.entryPrice,
        markPrice: m,
        closedNotionalUsd: closedNotional,
        pnlUsd: pnlUsd,
        movePct: movePct,
        leverage: pos.market === 'futures' ? pos.leverage : undefined,
    };
}
