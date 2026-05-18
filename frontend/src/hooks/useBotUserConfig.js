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
exports.useBotUserConfig = useBotUserConfig;
var react_1 = require("react");
var botUserConfig_1 = require("@/lib/botUserConfig");
function useBotUserConfig() {
    var _a = (0, react_1.useState)(function () { return (0, botUserConfig_1.loadBotUserConfigMap)(); }), configById = _a[0], setConfigById = _a[1];
    var updateBotConfig = (0, react_1.useCallback)(function (botId, patch) {
        setConfigById(function (prev) {
            var _a;
            var nextCfg = (0, botUserConfig_1.mergeBotConfigPatch)(botId, prev[botId], patch);
            var next = __assign(__assign({}, prev), (_a = {}, _a[botId] = nextCfg, _a));
            (0, botUserConfig_1.persistBotUserConfigMap)(next);
            return next;
        });
    }, []);
    /** @deprecated Use updateBotConfig — kept for call sites that only set markets + risk. */
    var upsertConfig = (0, react_1.useCallback)(function (botId, patch) {
        updateBotConfig(botId, patch);
    }, [updateBotConfig]);
    var mergeBot = (0, react_1.useCallback)(function (base) { return (0, botUserConfig_1.mergeBotWithUserConfig)(base, configById[base.id]); }, [configById]);
    var hasUserConfig = (0, react_1.useCallback)(function (botId) { return Boolean(configById[botId]); }, [configById]);
    return (0, react_1.useMemo)(function () { return ({ configById: configById, updateBotConfig: updateBotConfig, upsertConfig: upsertConfig, mergeBot: mergeBot, hasUserConfig: hasUserConfig }); }, [configById, updateBotConfig, upsertConfig, mergeBot, hasUserConfig]);
}
