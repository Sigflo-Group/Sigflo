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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_ALERT_PREFERENCES = void 0;
exports.getAlertPreferences = getAlertPreferences;
exports.saveAlertPreferences = saveAlertPreferences;
exports.resetAlertPreferences = resetAlertPreferences;
var STORAGE_KEY = 'sigflo_alert_preferences';
exports.DEFAULT_ALERT_PREFERENCES = {
    enabled: true,
    minScore: 75,
    states: ['Ready', 'Triggered'],
    channels: ['in_app', 'sound'],
};
var ALLOWED_MIN_SCORES = new Set([70, 75, 80, 85]);
var ALLOWED_CHANNELS = new Set(['in_app', 'sound', 'push']);
function normalizeStates(value) {
    if (!Array.isArray(value) || value.length === 0)
        return __spreadArray([], exports.DEFAULT_ALERT_PREFERENCES.states, true);
    var out = value.filter(function (s) { return s === 'Ready' || s === 'Triggered'; });
    return out.length > 0 ? out : __spreadArray([], exports.DEFAULT_ALERT_PREFERENCES.states, true);
}
function normalizeChannels(value) {
    if (!Array.isArray(value) || value.length === 0)
        return __spreadArray([], exports.DEFAULT_ALERT_PREFERENCES.channels, true);
    var filtered = value.filter(function (c) { return ALLOWED_CHANNELS.has(c); });
    var noPush = filtered.filter(function (c) { return c !== 'push'; });
    return noPush.length > 0 ? noPush : __spreadArray([], exports.DEFAULT_ALERT_PREFERENCES.channels, true);
}
function coercePreference(raw) {
    if (!raw || typeof raw !== 'object')
        return __assign({}, exports.DEFAULT_ALERT_PREFERENCES);
    var minScore = typeof raw.minScore === 'number' && ALLOWED_MIN_SCORES.has(raw.minScore) ? raw.minScore : exports.DEFAULT_ALERT_PREFERENCES.minScore;
    return {
        enabled: typeof raw.enabled === 'boolean' ? raw.enabled : exports.DEFAULT_ALERT_PREFERENCES.enabled,
        minScore: minScore,
        states: normalizeStates(raw.states),
        channels: normalizeChannels(raw.channels),
    };
}
function getAlertPreferences() {
    if (typeof window === 'undefined' || !window.localStorage) {
        return __assign({}, exports.DEFAULT_ALERT_PREFERENCES);
    }
    try {
        var raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw)
            return __assign({}, exports.DEFAULT_ALERT_PREFERENCES);
        var parsed = JSON.parse(raw);
        return coercePreference(parsed);
    }
    catch (_a) {
        return __assign({}, exports.DEFAULT_ALERT_PREFERENCES);
    }
}
function saveAlertPreferences(preferences) {
    var normalized = coercePreference(preferences);
    if (typeof window === 'undefined' || !window.localStorage)
        return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    }
    catch (_a) {
        /* ignore quota / private mode */
    }
}
function resetAlertPreferences() {
    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            window.localStorage.removeItem(STORAGE_KEY);
        }
        catch (_a) {
            /* ignore */
        }
    }
    return __assign({}, exports.DEFAULT_ALERT_PREFERENCES);
}
