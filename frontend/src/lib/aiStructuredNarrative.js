"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expandStructuredToQuickNarrative = expandStructuredToQuickNarrative;
exports.buildLocalStructuredAnalysis = buildLocalStructuredAnalysis;
function entryState(status, tradeScore) {
    if (status === 'overextended' || tradeScore < 45)
        return 'Weak timing';
    if (status === 'triggered' && tradeScore >= 65)
        return 'Ready';
    if (status === 'triggered' && tradeScore < 55)
        return 'Too late';
    if (status === 'idle')
        return 'Too early';
    return 'Too early';
}
function pickLevelsForLocal(ctx) {
    var out = [];
    var add = function (n) {
        if (n == null || !Number.isFinite(n))
            return;
        if (!out.some(function (x) { return Math.abs(x - n) < 1e-8; }))
            out.push(n);
    };
    add(ctx.lastPrice);
    add(ctx.entry);
    add(ctx.stop);
    add(ctx.target);
    return out.filter(function (n) { return ctx.allowedPriceLevels.some(function (a) { return Math.abs(a - n) < Math.max(1e-8, Math.abs(a) * 1e-6); }); });
}
function expandStructuredToQuickNarrative(action, s, ctx) {
    var lv = s.levels_used.length > 0
        ? s.levels_used.map(function (n) { return n.toLocaleString('en-US', { maximumFractionDigits: 8 }); }).join(', ')
        : 'none from package';
    var gaps = ctx.dataGaps.length ? "Data gaps: ".concat(ctx.dataGaps.join(', '), ".") : '';
    var actionLabel = action === 'explain' ? 'Explain' : action === 'watch' ? 'Watch list' : 'Entry';
    var headline = "".concat(ctx.symbol, " \u00B7 ").concat(actionLabel, " \u2014 ").concat(s.bias, " (").concat(s.confidence, "%)");
    if (action === 'explain') {
        var lvShort = s.levels_used.length > 0
            ? s.levels_used.map(function (n) { return n.toLocaleString('en-US', { maximumFractionDigits: 2 }); }).join(', ')
            : '—';
        var gapBit = ctx.dataGaps.length ? " Missing: ".concat(ctx.dataGaps.join(', '), ".") : '';
        var body_1 = "".concat(s.reasoning.trim(), " ").concat(s.notes.trim(), " Levels: ").concat(lvShort, ". ").concat(s.trade_valid ? 'Model: trade ok.' : 'Model: wait / invalid.').concat(gapBit).trim();
        return { headline: headline, body: body_1 };
    }
    var body = "Confidence (model): ".concat(s.confidence, "/100 \u00B7 Bias: ").concat(s.bias, "\n").concat(s.reasoning, "\nLevels cited: ").concat(lv, "\nTrade valid (model): ").concat(s.trade_valid ? 'yes' : 'no', "\nNotes: ").concat(s.notes).concat(gaps ? "\n".concat(gaps) : '');
    return { headline: headline, body: body };
}
function buildLocalStructuredAnalysis(action, signal, status, tradeScore, ctx) {
    var _a, _b;
    var timing = entryState(status, tradeScore);
    var levels = pickLevelsForLocal(ctx);
    var bias = signal.side === 'long' ? 'long' : 'short';
    var conf = Math.round(tradeScore);
    var reasoning;
    var notes;
    var trade_valid;
    if (action === 'explain') {
        var b = signal.scoreBreakdown;
        reasoning = "".concat(signal.side, " ").concat(signal.setupType, " \u00B7 score ").concat(signal.setupScore, "/100 \u00B7 scanner \"").concat(status, "\" \u00B7 readiness ").concat(conf, " \u00B7 subs T").concat(b.trendAlignment, "/M").concat(b.momentumQuality, "/S").concat(b.structureQuality, "/P").concat(b.volumeConfirmation, "/R").concat(b.riskConditions, ".");
        notes = "".concat(signal.riskTag, ". Timing: ").concat(timing, ".").concat(ctx.dataGaps.includes('recent_ohlc_series') ? ' No OHLC in package.' : '').trim();
        trade_valid = status !== 'overextended' && conf >= 45;
    }
    else if (action === 'watch') {
        var cue = (_a = signal.watchCue) === null || _a === void 0 ? void 0 : _a.trim();
        var next = (_b = signal.watchNext) === null || _b === void 0 ? void 0 : _b.trim();
        reasoning = cue
            ? "Primary watch from signal: ".concat(cue).concat(next ? " Next: ".concat(next, ".") : '')
            : "Watch the path implied by ".concat(signal.setupType, ": no extra watch lines were supplied beyond the engine context.");
        notes = 'Use only the chart and levels in the trade plan; do not assume liquidity or order flow not in the package.';
        trade_valid = true;
    }
    else {
        var eq = signal.scoreBreakdown.trendAlignment +
            signal.scoreBreakdown.momentumQuality +
            signal.scoreBreakdown.structureQuality +
            signal.scoreBreakdown.volumeConfirmation +
            signal.scoreBreakdown.riskConditions;
        reasoning = "Internal entry-quality sum is ".concat(eq, "/100 (components are trend, momentum, structure, participation, risk only \u2014 as provided). Scanner timing: ").concat(timing, ".");
        notes =
            status === 'overextended'
                ? 'Overextended status — new entries are usually poor risk/reward until structure resets.'
                : 'Size only after your own confirmation; the engine does not execute.';
        trade_valid = timing === 'Ready' || timing === 'Too early';
    }
    var structured = {
        bias: bias,
        confidence: conf,
        reasoning: reasoning,
        levels_used: levels,
        trade_valid: trade_valid,
        notes: notes,
    };
    var _c = expandStructuredToQuickNarrative(action, structured, ctx), headline = _c.headline, body = _c.body;
    return { structured: structured, headline: headline, body: body, source: 'local' };
}
