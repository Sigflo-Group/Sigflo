"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAiStructuredAnalysis = parseAiStructuredAnalysis;
exports.validateGroundedStructuredAnalysis = validateGroundedStructuredAnalysis;
exports.validateDeepMarkdownGrounded = validateDeepMarkdownGrounded;
var BANNED_TERMS_DEFAULT = [
    'MACD',
    'Bollinger',
    'Ichimoku',
    'VWAP',
    'stochastic',
    'fibonacci',
    'fib retracement',
    'elliott wave',
    'harmonic',
];
function levelMatchesAllowed(n, allowed, relTol, absTol) {
    if (relTol === void 0) { relTol = 0.0005; }
    if (absTol === void 0) { absTol = 1e-8; }
    for (var _i = 0, allowed_1 = allowed; _i < allowed_1.length; _i++) {
        var a = allowed_1[_i];
        var tol = Math.max(absTol, Math.abs(a) * relTol);
        if (Math.abs(n - a) <= tol)
            return true;
    }
    return false;
}
function parseAiStructuredAnalysis(raw) {
    if (!raw || typeof raw !== 'object')
        return null;
    var o = raw;
    var bias = o.bias;
    if (bias !== 'long' && bias !== 'short' && bias !== 'neutral')
        return null;
    var confidence = o.confidence;
    if (typeof confidence !== 'number' || !Number.isFinite(confidence) || confidence < 0 || confidence > 100) {
        return null;
    }
    var reasoning = o.reasoning;
    var notes = o.notes;
    var trade_valid = o.trade_valid;
    if (typeof reasoning !== 'string' || typeof notes !== 'string' || typeof trade_valid !== 'boolean') {
        return null;
    }
    var levelsRaw = o.levels_used;
    if (!Array.isArray(levelsRaw))
        return null;
    var levels_used = [];
    for (var _i = 0, levelsRaw_1 = levelsRaw; _i < levelsRaw_1.length; _i++) {
        var x = levelsRaw_1[_i];
        if (typeof x === 'number' && Number.isFinite(x))
            levels_used.push(x);
        else if (typeof x === 'string' && Number.isFinite(Number(x)))
            levels_used.push(Number(x));
        else
            return null;
    }
    return {
        bias: bias,
        confidence: Math.round(confidence),
        reasoning: reasoning.trim(),
        levels_used: levels_used,
        trade_valid: trade_valid,
        notes: notes.trim(),
    };
}
function textViolatesIndicatorAllowlist(text, allowed) {
    var lower = text.toLowerCase();
    for (var _i = 0, BANNED_TERMS_DEFAULT_1 = BANNED_TERMS_DEFAULT; _i < BANNED_TERMS_DEFAULT_1.length; _i++) {
        var term = BANNED_TERMS_DEFAULT_1[_i];
        if (lower.includes(term.toLowerCase()))
            return true;
    }
    if (/\brsi\b/i.test(text) && !allowed.some(function (a) { return a.toLowerCase().includes('rsi'); }))
        return true;
    if (/\bema\b/i.test(text) && !allowed.some(function (a) { return a.toLowerCase().includes('ema'); }))
        return true;
    if (/\batr\b/i.test(text) && !allowed.some(function (a) { return a.toLowerCase().includes('atr'); }))
        return true;
    if (/\bvolume\b/i.test(text) && !allowed.some(function (a) { return a.toLowerCase().includes('volume'); }))
        return true;
    return false;
}
/** Long-form thesis only: hard-banned indicators only (no RSI/volume prose checks — they false-fail normal copy). */
function deepTextViolatesHardBannedIndicators(text) {
    var lower = text.toLowerCase();
    for (var _i = 0, BANNED_TERMS_DEFAULT_2 = BANNED_TERMS_DEFAULT; _i < BANNED_TERMS_DEFAULT_2.length; _i++) {
        var term = BANNED_TERMS_DEFAULT_2[_i];
        if (lower.includes(term.toLowerCase()))
            return true;
    }
    return false;
}
function validateGroundedStructuredAnalysis(s, ctx) {
    if (!s.reasoning || s.reasoning.length < 4) {
        return { ok: false, reason: 'reasoning_too_short' };
    }
    for (var _i = 0, _a = s.levels_used; _i < _a.length; _i++) {
        var lvl = _a[_i];
        if (!levelMatchesAllowed(lvl, ctx.allowedPriceLevels)) {
            return { ok: false, reason: "level_not_in_package:".concat(lvl) };
        }
    }
    var combined = "".concat(s.reasoning, "\n").concat(s.notes);
    if (textViolatesIndicatorAllowlist(combined, ctx.allowedIndicatorTerms)) {
        return { ok: false, reason: 'unsupported_indicator_mentioned' };
    }
    return { ok: true };
}
/**
 * Deep thesis: block only hard-banned indicators (MACD, Fib, etc.). Do not apply the same RSI/EMA/volume
 * substring rules as quick JSON — models say "volume" in plain English and we would fall back to offline
 * draft every time.
 *
 * Price check: decimals with 2+ fractional digits must either sit in a loose band around packaged levels
 * (so we still catch hallucinated levels near the trade) or be ignored (years like 2024.12, tiny ratios).
 */
function validateDeepMarkdownGrounded(body, ctx) {
    if (deepTextViolatesHardBannedIndicators(body)) {
        return { ok: false, reason: 'deep_indicator_violation' };
    }
    var allowed = ctx.allowedPriceLevels;
    if (allowed.length === 0)
        return { ok: true };
    var minL = Math.min.apply(Math, allowed);
    var maxL = Math.max.apply(Math, allowed);
    var envelopeLow = Math.max(0, minL * 0.05);
    var envelopeHigh = maxL * 20;
    var re = /\b\d+\.\d{2,12}\b/g;
    var m;
    while ((m = re.exec(body))) {
        var raw = m[0];
        if (/^(?:19|20)\d{2}\.\d{2}$/.test(raw))
            continue;
        var n = Number(raw);
        if (!Number.isFinite(n))
            continue;
        if (n < envelopeLow || n > envelopeHigh)
            continue;
        if (!levelMatchesAllowed(n, allowed, 0.012, 1e-5)) {
            return { ok: false, reason: "deep_unlisted_price:".concat(raw) };
        }
    }
    return { ok: true };
}
