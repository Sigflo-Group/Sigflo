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
exports.ADD_BOT_TEMPLATES = exports.CORE_MARKET_OPTIONS = exports.DEFAULT_ADD_BOT_MARKETS = void 0;
exports.riskLevelToRiskMode = riskLevelToRiskMode;
exports.normalizeMarketTokens = normalizeMarketTokens;
exports.defaultBotUserConfigFromAgent = defaultBotUserConfigFromAgent;
exports.loadBotUserConfigMap = loadBotUserConfigMap;
exports.persistBotUserConfigMap = persistBotUserConfigMap;
exports.mergeBotConfigPatch = mergeBotConfigPatch;
exports.mergeBotWithUserConfig = mergeBotWithUserConfig;
exports.buildBotSettingsSummaryLine = buildBotSettingsSummaryLine;
var bots_1 = require("@/lib/bots");
var STORAGE_KEY = 'sigflo.botUserConfig.v1';
exports.DEFAULT_ADD_BOT_MARKETS = ['BTC', 'ETH', 'SOL'];
exports.CORE_MARKET_OPTIONS = ['BTC', 'ETH', 'SOL'];
function riskLevelToRiskMode(level) {
    if (level === 'low')
        return 'defensive';
    if (level === 'high')
        return 'aggressive';
    return 'balanced';
}
function riskModeToUserRisk(mode) {
    if (mode === 'defensive')
        return 'low';
    if (mode === 'aggressive')
        return 'high';
    return 'medium';
}
function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
}
/** Normalize user market tokens to short symbols (BTC not BTCUSDT). */
function normalizeMarketTokens(raw) {
    var out = [];
    var seen = new Set();
    for (var _i = 0, raw_1 = raw; _i < raw_1.length; _i++) {
        var t = raw_1[_i];
        var u = t.trim().toUpperCase();
        u = u.replace(/\/USDT$/i, '').replace(/USDT$/i, '');
        u = u.replace(/[^A-Z0-9]/g, '');
        if (u.length < 2 || u.length > 12)
            continue;
        if (seen.has(u))
            continue;
        seen.add(u);
        out.push(u);
    }
    return out.slice(0, 16);
}
function defaultBotUserConfigFromAgent(base) {
    return {
        watchedPairs: normalizeMarketTokens(__spreadArray([], base.watchedPairs, true)),
        riskLevel: riskModeToUserRisk(base.riskMode),
        displayName: '',
        tradeFrequency: 'medium',
        riskUnit: 'percent',
        riskPerTradePct: 1,
        riskPerTradeUsd: 50,
        maxActiveTrades: 3,
        defaultPositionSizeUsd: 150,
        stopBehavior: 'normal',
        autoMoveStop: false,
        autoScaleOut: true,
        updatedAt: Date.now(),
    };
}
function coerceTradeFrequency(v) {
    if (v === 'low' || v === 'high')
        return v;
    return 'medium';
}
function coerceStopBehavior(v) {
    if (v === 'tight' || v === 'wide')
        return v;
    return 'normal';
}
function coerceRiskUnit(v) {
    return v === 'dollar' ? 'dollar' : 'percent';
}
function omitUndefined(o) {
    var out = {};
    for (var _i = 0, _a = Object.entries(o); _i < _a.length; _i++) {
        var _b = _a[_i], k = _b[0], v = _b[1];
        if (v !== undefined)
            out[k] = v;
    }
    return out;
}
function mergeConfigLayer(defaults, existing, patch) {
    var m = __assign(__assign(__assign(__assign({}, defaults), omitUndefined((existing !== null && existing !== void 0 ? existing : {}))), omitUndefined(patch)), { updatedAt: Date.now() });
    m.watchedPairs = normalizeMarketTokens(m.watchedPairs);
    if (m.watchedPairs.length === 0)
        m.watchedPairs = __spreadArray([], defaults.watchedPairs, true);
    m.riskLevel =
        m.riskLevel === 'low' || m.riskLevel === 'high' || m.riskLevel === 'medium' ? m.riskLevel : defaults.riskLevel;
    m.displayName = typeof m.displayName === 'string' ? m.displayName : '';
    m.tradeFrequency = coerceTradeFrequency(m.tradeFrequency);
    m.stopBehavior = coerceStopBehavior(m.stopBehavior);
    m.riskUnit = coerceRiskUnit(m.riskUnit);
    m.riskPerTradePct = clamp(Number(m.riskPerTradePct) || defaults.riskPerTradePct, 0.1, 10);
    m.riskPerTradeUsd =
        m.riskPerTradeUsd != null && Number.isFinite(Number(m.riskPerTradeUsd))
            ? clamp(Number(m.riskPerTradeUsd), 1, 1000000)
            : null;
    m.maxActiveTrades = clamp(Math.round(Number(m.maxActiveTrades) || defaults.maxActiveTrades), 1, 10);
    m.defaultPositionSizeUsd = clamp(Number(m.defaultPositionSizeUsd) || defaults.defaultPositionSizeUsd, 5, 500000);
    m.autoMoveStop = Boolean(m.autoMoveStop);
    m.autoScaleOut = m.autoScaleOut !== false;
    return m;
}
function defaultsForBotId(botId) {
    var base = bots_1.baseBots.find(function (b) { return b.id === botId; });
    if (base)
        return defaultBotUserConfigFromAgent(base);
    return mergeConfigLayer({
        watchedPairs: ['BTC', 'ETH', 'SOL'],
        riskLevel: 'medium',
        displayName: '',
        tradeFrequency: 'medium',
        riskUnit: 'percent',
        riskPerTradePct: 1,
        riskPerTradeUsd: 50,
        maxActiveTrades: 3,
        defaultPositionSizeUsd: 150,
        stopBehavior: 'normal',
        autoMoveStop: false,
        autoScaleOut: true,
        updatedAt: Date.now(),
    }, undefined, {});
}
/** Migrate legacy rows (only watchedPairs + riskLevel) to full BotUserConfig. */
function coerceStoredEntry(botId, raw) {
    if (!raw || typeof raw !== 'object')
        return null;
    var o = raw;
    var defaults = defaultsForBotId(botId);
    var pairs = Array.isArray(o.watchedPairs) ? normalizeMarketTokens(o.watchedPairs.map(String)) : [];
    var risk = o.riskLevel === 'low' || o.riskLevel === 'high' || o.riskLevel === 'medium' ? o.riskLevel : defaults.riskLevel;
    var legacy = {
        watchedPairs: pairs.length > 0 ? pairs : defaults.watchedPairs,
        riskLevel: risk,
        displayName: typeof o.displayName === 'string' ? o.displayName : '',
        tradeFrequency: coerceTradeFrequency(o.tradeFrequency),
        riskUnit: coerceRiskUnit(o.riskUnit),
        riskPerTradePct: typeof o.riskPerTradePct === 'number' ? o.riskPerTradePct : undefined,
        riskPerTradeUsd: o.riskPerTradeUsd === null
            ? null
            : typeof o.riskPerTradeUsd === 'number'
                ? o.riskPerTradeUsd
                : undefined,
        maxActiveTrades: typeof o.maxActiveTrades === 'number' ? o.maxActiveTrades : undefined,
        defaultPositionSizeUsd: typeof o.defaultPositionSizeUsd === 'number' ? o.defaultPositionSizeUsd : undefined,
        stopBehavior: coerceStopBehavior(o.stopBehavior),
        autoMoveStop: typeof o.autoMoveStop === 'boolean' ? o.autoMoveStop : undefined,
        autoScaleOut: typeof o.autoScaleOut === 'boolean' ? o.autoScaleOut : undefined,
        updatedAt: typeof o.updatedAt === 'number' && Number.isFinite(o.updatedAt) ? o.updatedAt : Date.now(),
    };
    return mergeConfigLayer(defaults, {}, legacy);
}
function loadBotUserConfigMap() {
    if (typeof window === 'undefined')
        return {};
    try {
        var raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw)
            return {};
        var parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object')
            return {};
        var out = {};
        for (var _i = 0, _a = Object.entries(parsed); _i < _a.length; _i++) {
            var _b = _a[_i], id = _b[0], v = _b[1];
            var c = coerceStoredEntry(id, v);
            if (c)
                out[id] = c;
        }
        return out;
    }
    catch (_c) {
        return {};
    }
}
function persistBotUserConfigMap(map) {
    if (typeof window === 'undefined')
        return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}
function mergeBotConfigPatch(botId, prev, patch) {
    var defaults = defaultsForBotId(botId);
    return mergeConfigLayer(defaults, prev, patch);
}
function mergeBotWithUserConfig(base, c) {
    if (!c || c.watchedPairs.length === 0)
        return base;
    var watchedPairs = normalizeMarketTokens(c.watchedPairs);
    if (watchedPairs.length === 0)
        return base;
    var name = c.displayName.trim() ? c.displayName.trim() : base.name;
    return __assign(__assign({}, base), { name: name, watchedPairs: watchedPairs, riskMode: riskLevelToRiskMode(c.riskLevel), activityLine: "Monitoring ".concat(watchedPairs.join(', '), "\u2026") });
}
/** One-line preview for the settings screen (deterministic from key knobs). */
function buildBotSettingsSummaryLine(args) {
    var name = args.displayName.trim() || 'This agent';
    var cadence = args.tradeFrequency === 'low'
        ? 'trade less frequently'
        : args.tradeFrequency === 'high'
            ? 'scan for setups more often'
            : '';
    var stops = args.stopBehavior === 'tight'
        ? 'tighter stops'
        : args.stopBehavior === 'wide'
            ? 'wider stops'
            : '';
    var risk = args.riskLevel === 'low'
        ? 'a conservative risk stance'
        : args.riskLevel === 'high'
            ? 'a more aggressive risk stance'
            : '';
    if (cadence && stops) {
        var out = "".concat(name, " will now ").concat(cadence, " with ").concat(stops);
        if (risk)
            out += ", and ".concat(risk);
        return "".concat(out, ".");
    }
    if (cadence && risk) {
        return "".concat(name, " will now ").concat(cadence, ", leaning toward ").concat(risk, ".");
    }
    if (cadence) {
        return "".concat(name, " will now ").concat(cadence, ".");
    }
    if (stops && risk) {
        return "".concat(name, " will now use ").concat(stops, " with ").concat(risk, ".");
    }
    if (stops) {
        return "".concat(name, " will now use ").concat(stops, ".");
    }
    if (risk) {
        return "".concat(name, " will now emphasize ").concat(risk, ".");
    }
    return "".concat(name, " is set to steady scanning, normal stops, and balanced risk.");
}
exports.ADD_BOT_TEMPLATES = [
    {
        id: 'bot-kai',
        name: 'Kai',
        archetype: 'Momentum',
        tagline: 'Rides trends. Lets winners run.',
        accentClass: 'from-emerald-500/15 to-[#171A20]',
        borderActiveClass: 'border-emerald-400/45',
    },
    {
        id: 'bot-nova',
        name: 'Nova',
        archetype: 'Breakout',
        tagline: 'Finds moves early. Locks in gains.',
        accentClass: 'from-cyan-500/15 to-[#171A20]',
        borderActiveClass: 'border-cyan-400/45',
    },
    {
        id: 'bot-rio',
        name: 'Rio',
        archetype: 'Reversal',
        tagline: 'Protects capital. Exits early.',
        accentClass: 'from-rose-500/12 to-[#171A20]',
        borderActiveClass: 'border-rose-400/40',
    },
];
