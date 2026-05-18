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
exports.useBotStatuses = useBotStatuses;
var react_1 = require("react");
var bots_1 = require("@/lib/bots");
var STORAGE_KEY = 'sigflo.botStatusMap.v1';
function readStoredMap() {
    if (typeof window === 'undefined')
        return {};
    try {
        var raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw)
            return {};
        var parsed = JSON.parse(raw);
        return parsed !== null && parsed !== void 0 ? parsed : {};
    }
    catch (_a) {
        return {};
    }
}
function useBotStatuses() {
    var _a = (0, react_1.useState)(function () { return readStoredMap(); }), statusMap = _a[0], setStatusMap = _a[1];
    var resolvedMap = (0, react_1.useMemo)(function () {
        var _a;
        var out = {};
        for (var _i = 0, baseBots_1 = bots_1.baseBots; _i < baseBots_1.length; _i++) {
            var bot = baseBots_1[_i];
            out[bot.id] = (_a = statusMap[bot.id]) !== null && _a !== void 0 ? _a : bot.status;
        }
        return out;
    }, [statusMap]);
    var setBotStatus = function (botId, next) {
        setStatusMap(function (prev) {
            var _a;
            var updated = __assign(__assign({}, prev), (_a = {}, _a[botId] = next, _a));
            if (typeof window !== 'undefined')
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    };
    var togglePause = function (botId) {
        var _a, _b;
        var curr = (_a = resolvedMap[botId]) !== null && _a !== void 0 ? _a : 'active';
        var base = bots_1.baseBots.find(function (b) { return b.id === botId; });
        var resumeAs = (_b = base === null || base === void 0 ? void 0 : base.status) !== null && _b !== void 0 ? _b : 'active';
        setBotStatus(botId, curr === 'paused' ? resumeAs : 'paused');
    };
    return { statusMap: resolvedMap, setBotStatus: setBotStatus, togglePause: togglePause };
}
