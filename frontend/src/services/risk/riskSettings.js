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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_RISK_SETTINGS = exports.RISK_SETTINGS_CHANGED_EVENT = void 0;
exports.coerceRiskSettings = coerceRiskSettings;
exports.getRiskSettings = getRiskSettings;
exports.saveRiskSettings = saveRiskSettings;
exports.resetRiskSettings = resetRiskSettings;
exports.useRiskSettings = useRiskSettings;
exports.countExchangeOpenLegs = countExchangeOpenLegs;
exports.activePositionCountForRisk = activePositionCountForRisk;
var react_1 = require("react");
var positions_1 = require("@/services/positions");
var STORAGE_KEY = 'sigflo_risk_settings_v1';
exports.RISK_SETTINGS_CHANGED_EVENT = 'sigflo-risk-settings-changed';
exports.DEFAULT_RISK_SETTINGS = {
    riskMode: 'Balanced',
    maxRiskPerTradePct: 1,
    maxDailyLossPct: 3,
    maxOpenPositions: 3,
    allowLiveExecution: false,
    requireConfirmation: true,
    paperModeDefault: true,
};
function clamp(n, lo, hi) {
    if (!Number.isFinite(n))
        return lo;
    return Math.min(hi, Math.max(lo, n));
}
function coerceRiskMode(v) {
    if (v === 'Defensive' || v === 'Balanced' || v === 'Aggressive')
        return v;
    return exports.DEFAULT_RISK_SETTINGS.riskMode;
}
/** LocalStorage / JSON sometimes yields non-boolean toggles; normalize so Risk UI matches execution gates. */
function coerceBooleanField(value, defaultVal) {
    if (typeof value === 'boolean')
        return value;
    if (value === 'true' || value === 1)
        return true;
    if (value === 'false' || value === 0)
        return false;
    return defaultVal;
}
function coerceRiskSettings(raw) {
    if (!raw || typeof raw !== 'object')
        return __assign({}, exports.DEFAULT_RISK_SETTINGS);
    var o = raw;
    return {
        riskMode: coerceRiskMode(o.riskMode),
        maxRiskPerTradePct: clamp(Number(o.maxRiskPerTradePct), 0.1, 25),
        maxDailyLossPct: clamp(Number(o.maxDailyLossPct), 0.5, 50),
        maxOpenPositions: Math.round(clamp(Number(o.maxOpenPositions), 1, 25)),
        allowLiveExecution: coerceBooleanField(o.allowLiveExecution, exports.DEFAULT_RISK_SETTINGS.allowLiveExecution),
        requireConfirmation: coerceBooleanField(o.requireConfirmation, exports.DEFAULT_RISK_SETTINGS.requireConfirmation),
        paperModeDefault: coerceBooleanField(o.paperModeDefault, exports.DEFAULT_RISK_SETTINGS.paperModeDefault),
    };
}
/** Same reference when values unchanged — required for `useSyncExternalStore` snapshots. */
var riskSettingsSnapshot = null;
var riskSettingsSnapshotKey = '';
function readRiskSettingsFromStorage() {
    if (typeof window === 'undefined' || !window.localStorage) {
        return __assign({}, exports.DEFAULT_RISK_SETTINGS);
    }
    try {
        var raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw)
            return __assign({}, exports.DEFAULT_RISK_SETTINGS);
        return coerceRiskSettings(JSON.parse(raw));
    }
    catch (_a) {
        return __assign({}, exports.DEFAULT_RISK_SETTINGS);
    }
}
function invalidateRiskSettingsSnapshotCache() {
    riskSettingsSnapshot = null;
    riskSettingsSnapshotKey = '';
}
function getRiskSettings() {
    var computed = readRiskSettingsFromStorage();
    var key = JSON.stringify(computed);
    if (riskSettingsSnapshot != null && key === riskSettingsSnapshotKey) {
        return riskSettingsSnapshot;
    }
    riskSettingsSnapshotKey = key;
    riskSettingsSnapshot = computed;
    return riskSettingsSnapshot;
}
function saveRiskSettings(next) {
    var normalized = coerceRiskSettings(next);
    invalidateRiskSettingsSnapshotCache();
    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        }
        catch (_a) {
            /* ignore */
        }
        try {
            window.dispatchEvent(new CustomEvent(exports.RISK_SETTINGS_CHANGED_EVENT));
        }
        catch (_b) {
            /* ignore */
        }
    }
    return normalized;
}
function resetRiskSettings() {
    invalidateRiskSettingsSnapshotCache();
    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            window.localStorage.removeItem(STORAGE_KEY);
        }
        catch (_a) {
            /* ignore */
        }
        try {
            window.dispatchEvent(new CustomEvent(exports.RISK_SETTINGS_CHANGED_EVENT));
        }
        catch (_b) {
            /* ignore */
        }
    }
    return __assign({}, exports.DEFAULT_RISK_SETTINGS);
}
function subscribe(onStoreChange) {
    var handler = function () { return onStoreChange(); };
    if (typeof window !== 'undefined') {
        window.addEventListener('storage', handler);
        window.addEventListener(exports.RISK_SETTINGS_CHANGED_EVENT, handler);
        return function () {
            window.removeEventListener('storage', handler);
            window.removeEventListener(exports.RISK_SETTINGS_CHANGED_EVENT, handler);
        };
    }
    return function () { };
}
function useRiskSettings() {
    return (0, react_1.useSyncExternalStore)(subscribe, getRiskSettings, getRiskSettings);
}
/** Count non-flat linear rows from an exchange snapshot (or 0). */
function countExchangeOpenLegs(positions) {
    if (!(positions === null || positions === void 0 ? void 0 : positions.length))
        return 0;
    return positions.filter(function (p) { return Math.abs(p.size) > 0; }).length;
}
/**
 * Positions counted toward max-open risk: prefer live exchange legs; if none, demo repository rows
 * (so the Bots strip still exercises the warning in demo).
 */
function activePositionCountForRisk(exchangeOpenLegs) {
    if (exchangeOpenLegs > 0)
        return exchangeOpenLegs;
    return (0, positions_1.getPositionRepository)().listActivePositions().length;
}
