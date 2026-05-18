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
exports.EXIT_AI_MODE_HELPER = exports.EXIT_STRATEGY_BLURB = exports.EXIT_STRATEGY_LABEL = exports.EXIT_AI_MODE_LABEL = exports.DEFAULT_AUTOMATION_SAFEGUARDS = void 0;
exports.newActivityId = newActivityId;
exports.formatActivityTime = formatActivityTime;
exports.applySafeguardsToGuidance = applySafeguardsToGuidance;
exports.nextPlannedAutomationLine = nextPlannedAutomationLine;
exports.parseActivityLogJson = parseActivityLogJson;
exports.appendActivityEntry = appendActivityEntry;
var formatQuote_1 = require("@/lib/formatQuote");
exports.DEFAULT_AUTOMATION_SAFEGUARDS = {
    maxLossPct: 5,
    minProfitBeforeTrimPct: 0.35,
    allowPartialExits: true,
    allowFullAutoClose: true,
};
exports.EXIT_AI_MODE_LABEL = {
    manual: 'Manual',
    assisted: 'Assisted',
    auto: 'Auto',
};
exports.EXIT_STRATEGY_LABEL = {
    protect_profit: 'Protect Profit',
    trend_follow: 'Trend Follow',
    tight_risk: 'Tight Risk',
    custom: 'Custom',
};
exports.EXIT_STRATEGY_BLURB = {
    protect_profit: 'Lock gains quickly when momentum weakens',
    trend_follow: 'Let winners run longer and tighten exits gradually',
    tight_risk: 'Exit earlier when weakness appears',
    custom: 'User-defined automation rules',
};
exports.EXIT_AI_MODE_HELPER = {
    manual: 'You control all exits',
    assisted: 'AI recommends and prepares exits',
    auto: 'AI can automatically manage exits',
};
function newActivityId() {
    return "".concat(Date.now(), "-").concat(Math.random().toString(36).slice(2, 9));
}
function formatActivityTime(ts) {
    return new Date(ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
/** Apply safeguard rules on top of model exit guidance (display + automation). */
function applySafeguardsToGuidance(g, pnlPct, safeguards, stop, target, side) {
    var maxLoss = Math.abs(safeguards.maxLossPct);
    if (pnlPct <= -maxLoss) {
        return __assign(__assign({}, g), { state: 'exit', headline: 'EXIT', confidenceLabel: 'High', reason: 'Unrealized loss reached your max-loss safeguard.', action: "Exit toward ~$".concat((0, formatQuote_1.formatQuoteGuidance)(stop)), referencePrice: stop });
    }
    if (g.state === 'trim' && pnlPct < safeguards.minProfitBeforeTrimPct) {
        var nudge = side === 'long'
            ? target * (1 + 0.002)
            : target * (1 - 0.002);
        return __assign(__assign({}, g), { state: 'hold', headline: '', confidenceLabel: 'Medium', reason: 'Below your minimum profit threshold for automated trims.', action: "Let it work toward take-profit ~$".concat((0, formatQuote_1.formatQuoteGuidance)(target)), referencePrice: nudge });
    }
    return g;
}
function nextPlannedAutomationLine(args) {
    var mode = args.mode, g = args.guidance, safeguards = args.safeguards, pnlPct = args.pnlPct;
    if (mode === 'manual') {
        return 'You control exits — AI shows guidance only.';
    }
    if (pnlPct <= -Math.abs(safeguards.maxLossPct)) {
        return safeguards.allowFullAutoClose
            ? 'Will close fully — max loss safeguard.'
            : 'Max loss hit — auto full close off; exit manually.';
    }
    if (mode === 'assisted') {
        if (g.state === 'hold')
            return 'No prepared exit — review guidance when state changes.';
        return "".concat(g.action, " \u2014 tap Confirm below when ready.");
    }
    // auto
    if (g.state === 'exit' && !safeguards.allowFullAutoClose) {
        return "Suggests full exit near $".concat((0, formatQuote_1.formatQuoteGuidance)(g.referencePrice), " \u2014 auto close off.");
    }
    if (g.state === 'trim' && !safeguards.allowPartialExits) {
        return "Near target \u2014 partial auto off; watching only.";
    }
    if (g.state === 'trim') {
        return "Will trim ~50% near $".concat((0, formatQuote_1.formatQuoteGuidance)(g.referencePrice));
    }
    if (g.state === 'exit') {
        return "Will close fully near $".concat((0, formatQuote_1.formatQuoteGuidance)(g.referencePrice));
    }
    return 'Automation watching trend and risk.';
}
function parseActivityLogJson(raw) {
    if (!raw)
        return [];
    try {
        var v = JSON.parse(raw);
        if (!Array.isArray(v))
            return [];
        return v
            .filter(function (e) {
            return e != null &&
                typeof e === 'object' &&
                typeof e.id === 'string' &&
                typeof e.ts === 'number' &&
                typeof e.message === 'string';
        })
            .slice(-80);
    }
    catch (_a) {
        return [];
    }
}
function appendActivityEntry(prev, entry) {
    var _a, _b;
    var next = {
        id: (_a = entry.id) !== null && _a !== void 0 ? _a : newActivityId(),
        ts: (_b = entry.ts) !== null && _b !== void 0 ? _b : Date.now(),
        kind: entry.kind,
        message: entry.message,
    };
    return __spreadArray(__spreadArray([], prev, true), [next], false).slice(-80);
}
