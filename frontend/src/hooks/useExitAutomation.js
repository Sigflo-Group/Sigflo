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
exports.useExitAutomation = useExitAutomation;
var react_1 = require("react");
var aiExitAutomation_1 = require("@/lib/aiExitAutomation");
var globalAnnouncements_1 = require("@/lib/globalAnnouncements");
var exitGuidance_1 = require("@/lib/exitGuidance");
var LS_MODE = 'sigflo.exitAi.mode';
var LS_STRATEGY = 'sigflo.exitAi.strategy';
var LS_SAFEGUARDS = 'sigflo.exitAi.safeguards';
var LS_CUSTOM_THRESHOLDS = 'sigflo.exitAi.customThresholds';
var EXIT_AI_POPUP_KINDS = new Set([
    'auto_trim',
    'auto_close',
    'safeguard',
    'assisted_ready',
]);
function loadMode() {
    var v = window.localStorage.getItem(LS_MODE);
    if (v === 'manual' || v === 'assisted' || v === 'auto')
        return v;
    return 'manual';
}
function loadStrategy() {
    var v = window.localStorage.getItem(LS_STRATEGY);
    if (v === 'protect_profit' || v === 'trend_follow' || v === 'tight_risk' || v === 'custom')
        return v;
    return 'protect_profit';
}
function loadSafeguards() {
    try {
        var raw = window.localStorage.getItem(LS_SAFEGUARDS);
        if (!raw)
            return __assign({}, aiExitAutomation_1.DEFAULT_AUTOMATION_SAFEGUARDS);
        var p = JSON.parse(raw);
        return {
            maxLossPct: typeof p.maxLossPct === 'number' && Number.isFinite(p.maxLossPct)
                ? Math.min(50, Math.max(0.5, p.maxLossPct))
                : aiExitAutomation_1.DEFAULT_AUTOMATION_SAFEGUARDS.maxLossPct,
            minProfitBeforeTrimPct: typeof p.minProfitBeforeTrimPct === 'number' && Number.isFinite(p.minProfitBeforeTrimPct)
                ? Math.min(25, Math.max(0, p.minProfitBeforeTrimPct))
                : aiExitAutomation_1.DEFAULT_AUTOMATION_SAFEGUARDS.minProfitBeforeTrimPct,
            allowPartialExits: p.allowPartialExits !== false,
            allowFullAutoClose: p.allowFullAutoClose !== false,
        };
    }
    catch (_a) {
        return __assign({}, aiExitAutomation_1.DEFAULT_AUTOMATION_SAFEGUARDS);
    }
}
function loadCustomStrategyThresholds() {
    try {
        var raw = window.localStorage.getItem(LS_CUSTOM_THRESHOLDS);
        if (!raw)
            return __assign({}, exitGuidance_1.DEFAULT_CUSTOM_STRATEGY_THRESHOLDS);
        var p = JSON.parse(raw);
        return (0, exitGuidance_1.sanitizeExitStrategyThresholds)(p);
    }
    catch (_a) {
        return __assign({}, exitGuidance_1.DEFAULT_CUSTOM_STRATEGY_THRESHOLDS);
    }
}
function activityStorageKey(scopeKey) {
    return "sigflo.exitAi.activity.".concat(scopeKey);
}
function useExitAutomation(scopeKey) {
    var _a = (0, react_1.useState)(loadMode), mode = _a[0], setMode = _a[1];
    var _b = (0, react_1.useState)(loadStrategy), strategy = _b[0], setStrategy = _b[1];
    var _c = (0, react_1.useState)(loadSafeguards), safeguards = _c[0], setSafeguards = _c[1];
    var _d = (0, react_1.useState)(loadCustomStrategyThresholds), customStrategyThresholds = _d[0], setCustomStrategyThresholds = _d[1];
    var _e = (0, react_1.useState)([]), activity = _e[0], setActivity = _e[1];
    (0, react_1.useEffect)(function () {
        setActivity((0, aiExitAutomation_1.parseActivityLogJson)(window.localStorage.getItem(activityStorageKey(scopeKey))));
    }, [scopeKey]);
    (0, react_1.useEffect)(function () {
        window.localStorage.setItem(LS_MODE, mode);
    }, [mode]);
    (0, react_1.useEffect)(function () {
        window.localStorage.setItem(LS_STRATEGY, strategy);
    }, [strategy]);
    (0, react_1.useEffect)(function () {
        window.localStorage.setItem(LS_SAFEGUARDS, JSON.stringify(safeguards));
    }, [safeguards]);
    (0, react_1.useEffect)(function () {
        window.localStorage.setItem(LS_CUSTOM_THRESHOLDS, JSON.stringify(customStrategyThresholds));
    }, [customStrategyThresholds]);
    var mergeCustomStrategyThresholds = (0, react_1.useCallback)(function (patch) {
        setCustomStrategyThresholds(function (prev) { return (0, exitGuidance_1.sanitizeExitStrategyThresholds)(__assign(__assign({}, prev), patch)); });
    }, []);
    var resetCustomStrategyThresholds = (0, react_1.useCallback)(function () {
        setCustomStrategyThresholds(__assign({}, exitGuidance_1.DEFAULT_CUSTOM_STRATEGY_THRESHOLDS));
    }, []);
    var persistActivity = (0, react_1.useCallback)(function (next) {
        window.localStorage.setItem(activityStorageKey(scopeKey), JSON.stringify(next));
    }, [scopeKey]);
    var pushActivity = (0, react_1.useCallback)(function (entry) {
        setActivity(function (prev) {
            var next = (0, aiExitAutomation_1.appendActivityEntry)(prev, entry);
            persistActivity(next);
            var added = next[next.length - 1];
            if (added && EXIT_AI_POPUP_KINDS.has(added.kind)) {
                queueMicrotask(function () {
                    (0, globalAnnouncements_1.emitGlobalAnnouncement)({
                        id: added.id,
                        kind: 'ai_action',
                        title: 'Exit AI',
                        subtitle: added.message,
                    });
                });
            }
            return next;
        });
    }, [persistActivity]);
    var clearActivity = (0, react_1.useCallback)(function () {
        setActivity([]);
        window.localStorage.removeItem(activityStorageKey(scopeKey));
    }, [scopeKey]);
    return (0, react_1.useMemo)(function () { return ({
        mode: mode,
        setMode: setMode,
        strategy: strategy,
        setStrategy: setStrategy,
        safeguards: safeguards,
        setSafeguards: setSafeguards,
        customStrategyThresholds: customStrategyThresholds,
        mergeCustomStrategyThresholds: mergeCustomStrategyThresholds,
        resetCustomStrategyThresholds: resetCustomStrategyThresholds,
        activity: activity,
        pushActivity: pushActivity,
        clearActivity: clearActivity,
    }); }, [
        mode,
        strategy,
        safeguards,
        customStrategyThresholds,
        mergeCustomStrategyThresholds,
        resetCustomStrategyThresholds,
        activity,
        pushActivity,
        clearActivity,
    ]);
}
