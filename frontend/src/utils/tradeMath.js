"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePriceFromString = parsePriceFromString;
exports.parseEntryZoneMidpoint = parseEntryZoneMidpoint;
exports.parseTargetPrices = parseTargetPrices;
exports.validateBotsPaperPlan = validateBotsPaperPlan;
exports.calculatePaperTrade = calculatePaperTrade;
/**
 * Pull the first numeric price from a label (engine copy, locale-formatted, etc.).
 * Strips thousands separators and currency symbols before parsing.
 */
function parsePriceFromString(str) {
    if (str == null)
        return null;
    var t = str.trim();
    if (!t)
        return null;
    var normalized = t.replace(/\$/g, '').replace(/,/g, '');
    var m = normalized.match(/-?\d+(?:\.\d+)?/);
    if (!(m === null || m === void 0 ? void 0 : m[0]))
        return null;
    var n = Number(m[0]);
    return Number.isFinite(n) && n > 0 ? n : null;
}
/** All positive finite numbers in order (for ranges like "65,100 - 65,200"). */
function parseAllPricesFromString(str) {
    var _a;
    if (str == null)
        return [];
    var normalized = str.replace(/\$/g, '').replace(/,/g, '');
    var matches = (_a = normalized.match(/-?\d+(?:\.\d+)?/g)) !== null && _a !== void 0 ? _a : [];
    var out = [];
    for (var _i = 0, matches_1 = matches; _i < matches_1.length; _i++) {
        var raw = matches_1[_i];
        var n = Number(raw);
        if (Number.isFinite(n) && n > 0)
            out.push(n);
    }
    return out;
}
/** Entry zone string → midpoint of first two prices, or single price if only one. */
function parseEntryZoneMidpoint(zone) {
    var nums = parseAllPricesFromString(zone !== null && zone !== void 0 ? zone : '');
    if (nums.length === 0)
        return null;
    if (nums.length === 1)
        return nums[0];
    return (nums[0] + nums[1]) / 2;
}
function parseTargetPrices(targets) {
    if (!(targets === null || targets === void 0 ? void 0 : targets.length))
        return [];
    var out = [];
    for (var _i = 0, targets_1 = targets; _i < targets_1.length; _i++) {
        var row = targets_1[_i];
        var p = parsePriceFromString(row);
        if (p != null)
            out.push(p);
    }
    return out;
}
function validateBotsPaperPlan(entryPrice, stopPrice, targets, direction) {
    var stopOk = direction === 'LONG' ? stopPrice < entryPrice : stopPrice > entryPrice;
    var stopWarning = stopOk
        ? null
        : direction === 'LONG'
            ? 'Stop must be below entry for LONG'
            : 'Stop must be above entry for SHORT';
    var targetsOk = true;
    var targetsWarning = null;
    for (var _i = 0, targets_2 = targets; _i < targets_2.length; _i++) {
        var t = targets_2[_i];
        if (!Number.isFinite(t) || t <= 0)
            continue;
        var ok = direction === 'LONG' ? t > entryPrice : t < entryPrice;
        if (!ok) {
            targetsOk = false;
            targetsWarning =
                direction === 'LONG' ? 'Targets must be above entry for LONG' : 'Targets must be below entry for SHORT';
            break;
        }
    }
    return {
        stopOk: stopOk,
        targetsOk: targetsOk,
        ok: stopOk && targetsOk,
        stopWarning: stopWarning,
        targetsWarning: targetsWarning,
    };
}
function calculatePaperTrade(input) {
    var balance = input.balance, riskPercent = input.riskPercent, entryPrice = input.entryPrice, stopPrice = input.stopPrice, targets = input.targets, direction = input.direction;
    if (!Number.isFinite(balance) || balance <= 0)
        return null;
    if (!Number.isFinite(riskPercent) || riskPercent <= 0)
        return null;
    if (!Number.isFinite(entryPrice) || entryPrice <= 0)
        return null;
    if (!Number.isFinite(stopPrice) || stopPrice <= 0)
        return null;
    var riskAmount = balance * (riskPercent / 100);
    if (!Number.isFinite(riskAmount) || riskAmount <= 0)
        return null;
    var distanceToStop = direction === 'LONG' ? entryPrice - stopPrice : stopPrice - entryPrice;
    if (!Number.isFinite(distanceToStop) || distanceToStop <= 0)
        return null;
    var positionSize = riskAmount / distanceToStop;
    if (!Number.isFinite(positionSize) || positionSize <= 0)
        return null;
    var lossAtStop = riskAmount;
    var profitTargets = [];
    for (var _i = 0, targets_3 = targets; _i < targets_3.length; _i++) {
        var target = targets_3[_i];
        if (!Number.isFinite(target) || target <= 0)
            continue;
        var pnl = direction === 'LONG' ? (target - entryPrice) * positionSize : (entryPrice - target) * positionSize;
        var rr = riskAmount > 0 ? pnl / riskAmount : 0;
        profitTargets.push({ price: target, pnl: pnl, rr: rr });
    }
    return {
        positionSize: positionSize,
        riskAmount: riskAmount,
        lossAtStop: lossAtStop,
        profitTargets: profitTargets,
    };
}
