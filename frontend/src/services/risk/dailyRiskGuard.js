"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDemoDailyPnlSnapshot = getDemoDailyPnlSnapshot;
exports.buildDailyRiskGuard = buildDailyRiskGuard;
exports.riskGuardStatusLine = riskGuardStatusLine;
exports.useDailyRiskGuard = useDailyRiskGuard;
var react_1 = require("react");
var riskSettings_1 = require("@/services/risk/riskSettings");
var DEMO_OVERRIDE_STORAGE_KEY = 'sigflo_demo_daily_loss_pct';
/**
 * Demo session drawdown as a positive fraction of `maxDailyLossPct` (e.g. 0.55 → −55% of limit as day %).
 * Replace with exchange / ledger daily P&L when available.
 */
/** Below 0.5× limit → normal on first load; set `sigflo_demo_daily_loss_pct` in localStorage to stress warning/locked. */
var DEMO_DEFAULT_LOSS_FRACTION_OF_LIMIT = 0.42;
function readDemoLossPctOverride() {
    if (typeof window === 'undefined' || !window.localStorage)
        return null;
    try {
        var raw = window.localStorage.getItem(DEMO_OVERRIDE_STORAGE_KEY);
        if (raw == null || raw === '')
            return null;
        var n = Number(raw);
        if (!Number.isFinite(n))
            return null;
        return n;
    }
    catch (_a) {
        return null;
    }
}
/**
 * Mock daily P&L for the guard. Override for QA: `localStorage.setItem('sigflo_demo_daily_loss_pct', '3')`
 * (with max daily loss 3 → locked). Remove key to use the built-in demo ratio.
 */
function getDemoDailyPnlSnapshot(maxDailyLossPct) {
    var limit = Math.max(0.5, maxDailyLossPct);
    var override = readDemoLossPctOverride();
    var lossPctOfDay = override != null ? Math.min(limit * 2, Math.max(0, Math.abs(override))) : DEMO_DEFAULT_LOSS_FRACTION_OF_LIMIT * limit;
    var currentDailyPnlPct = -lossPctOfDay;
    var currentDailyPnl = -Math.max(1, lossPctOfDay * 24);
    return { currentDailyPnl: currentDailyPnl, currentDailyPnlPct: currentDailyPnlPct };
}
function statusMessage(status) {
    if (status === 'locked')
        return 'Daily risk limit reached';
    if (status === 'warning')
        return 'Approaching daily risk limit';
    return 'Within your daily risk envelope';
}
function buildDailyRiskGuard(input) {
    var limit = Math.max(0.5, input.dailyLossLimitPct);
    var lossPct = Math.max(0, -input.currentDailyPnlPct);
    var status;
    if (lossPct >= limit)
        status = 'locked';
    else if (lossPct >= 0.5 * limit)
        status = 'warning';
    else
        status = 'normal';
    return {
        currentDailyPnl: input.currentDailyPnl,
        currentDailyPnlPct: input.currentDailyPnlPct,
        dailyLossLimitPct: limit,
        status: status,
        message: statusMessage(status),
    };
}
function riskGuardStatusLine(status) {
    if (status === 'locked')
        return 'Risk guard locked';
    if (status === 'warning')
        return 'Risk guard warning';
    return 'Risk guard normal';
}
function useDailyRiskGuard() {
    var maxDailyLossPct = (0, riskSettings_1.useRiskSettings)().maxDailyLossPct;
    return (0, react_1.useMemo)(function () {
        var snap = getDemoDailyPnlSnapshot(maxDailyLossPct);
        return buildDailyRiskGuard({
            currentDailyPnl: snap.currentDailyPnl,
            currentDailyPnlPct: snap.currentDailyPnlPct,
            dailyLossLimitPct: maxDailyLossPct,
        });
    }, [maxDailyLossPct]);
}
