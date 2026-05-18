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
exports.TRENDING_LIMIT = exports.LOSERS_LIMIT = exports.GAINERS_LIMIT = exports.TRACKED_SYMBOLS = void 0;
exports.symbolToPair = symbolToPair;
exports.rankTopGainers = rankTopGainers;
exports.rankTopLosers = rankTopLosers;
exports.rankMoversUniverse = rankMoversUniverse;
exports.buildTrackedFallbackSignal = buildTrackedFallbackSignal;
exports.buildTrackedScannerRows = buildTrackedScannerRows;
exports.deriveMarketStatus = deriveMarketStatus;
exports.buildWatchlistMarketRows = buildWatchlistMarketRows;
exports.isFeedActionableOpportunity = isFeedActionableOpportunity;
exports.buildMarketScannerRows = buildMarketScannerRows;
exports.countActiveSetups = countActiveSetups;
exports.countMarketRowStatuses = countMarketRowStatuses;
exports.parseMarketStatusQuery = parseMarketStatusQuery;
exports.scannerStatusTitle = scannerStatusTitle;
exports.formatTradeScannerStateLine = formatTradeScannerStateLine;
exports.inPlayMicroHeadline = inPlayMicroHeadline;
exports.inPlayStructureConfidence = inPlayStructureConfidence;
exports.attachTriggerTimestamps = attachTriggerTimestamps;
exports.sortScannerRowsForTapPriority = sortScannerRowsForTapPriority;
exports.formatInPlayTimingCue = formatInPlayTimingCue;
exports.attachScoreTrends = attachScoreTrends;
var setupScore_1 = require("@/lib/setupScore");
/** Core watchlist symbols (scanner / signal engine focus). Order is preserved in UI. */
exports.TRACKED_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'AVAXUSDT', 'LINKUSDT', 'PAXGUSDT', 'XAGUSDT'];
/** How many symbols to show (top 24h % gainers among USDT linear perpetuals). */
exports.GAINERS_LIMIT = 15;
/** Top 24h % losers (negative movers) merged into the Movers tab for short-bias tape. */
exports.LOSERS_LIMIT = 10;
/** @deprecated Use GAINERS_LIMIT */
exports.TRENDING_LIMIT = exports.GAINERS_LIMIT;
/** Base asset for display / engine match (e.g. BTCUSDT → BTC). */
function symbolToPair(symbol) {
    return symbol.endsWith('USDT') ? symbol.slice(0, -4) : symbol;
}
/**
 * Top gainers = highest positive 24h % change among linear USDT perpetuals.
 */
function rankTopGainers(tickers, limit) {
    return __spreadArray([], tickers, true).filter(function (t) { return t.symbol.endsWith('USDT') && t.price24hPcnt > 0; })
        .sort(function (a, b) { return b.price24hPcnt - a.price24hPcnt; })
        .slice(0, limit);
}
/** Deepest 24h % drops among USDT linear perpetuals (excludes flat / positive). */
function rankTopLosers(tickers, limit) {
    return __spreadArray([], tickers, true).filter(function (t) { return t.symbol.endsWith('USDT') && t.price24hPcnt < 0; })
        .sort(function (a, b) { return a.price24hPcnt - b.price24hPcnt; })
        .slice(0, limit);
}
/** Gainers first, then worst losers not already listed (for Movers grid + WS extras). */
function rankMoversUniverse(tickers) {
    var gainers = rankTopGainers(tickers, exports.GAINERS_LIMIT);
    var sym = new Set(gainers.map(function (t) { return t.symbol; }));
    var losers = rankTopLosers(tickers, exports.LOSERS_LIMIT).filter(function (t) { return !sym.has(t.symbol); });
    return __spreadArray(__spreadArray([], gainers, true), losers, true);
}
/** Above this 24h move %, synthetic Movers treat the tape as overextended (rare among “only green” lists). */
var MOVER_OVEREXTENDED_PCT = 18;
var MOVER_PULLBACK_PCT = 4;
function buildSyntheticTrendingSignal(symbol, pair, ticker) {
    var movePct = Math.abs(ticker.price24hPcnt * 100);
    var liq = Math.log10(Math.max(1, ticker.turnover24h));
    var breakdown = {
        trendAlignment: Math.min(25, Math.round(8 + movePct * 0.85)),
        momentumQuality: Math.min(20, Math.round(6 + movePct * 0.95)),
        structureQuality: Math.min(25, Math.round(10 + liq * 1.8)),
        volumeConfirmation: Math.min(15, Math.round(5 + liq * 1.2)),
        riskConditions: Math.min(15, Math.round(6 + (movePct > 8 ? 4 : 0))),
    };
    var up = ticker.price24hPcnt >= 0;
    var setupType = 'breakout';
    var tag = 'Breakout';
    if (movePct > MOVER_OVEREXTENDED_PCT) {
        setupType = 'overextended';
        tag = 'Overextended';
        // Pull back trend/momentum; keep structure/volume tied to liquidity so scores still spread across names.
        breakdown = {
            trendAlignment: Math.min(17, Math.round(breakdown.trendAlignment * 0.78)),
            momentumQuality: Math.min(14, Math.round(breakdown.momentumQuality * 0.72)),
            structureQuality: Math.min(22, Math.round(breakdown.structureQuality * 0.88)),
            volumeConfirmation: Math.min(13, breakdown.volumeConfirmation),
            riskConditions: Math.min(14, breakdown.riskConditions + 2),
        };
    }
    else if (movePct > MOVER_PULLBACK_PCT) {
        setupType = 'pullback';
        tag = 'Pullback';
    }
    var setupScore = (0, setupScore_1.calculateSetupScore)(breakdown);
    // Never label synthetic overextended movers as Elite (85+); do not flatten everyone to one number.
    if (setupType === 'overextended') {
        setupScore = Math.min(setupScore, 82);
    }
    var setupScoreLabel = (0, setupScore_1.getSetupScoreLabel)(setupScore);
    var aiExplanation = setupType === 'overextended'
        ? up
            ? "Extended 24h move (+".concat(movePct.toFixed(1), "%): participation is hot \u2014 mean-reversion risk rises with the extension.")
            : "Heavy 24h selloff (\u2212".concat(movePct.toFixed(1), "%): selling is stretched \u2014 sharp bounces can rip if shorts pile in late.")
        : setupType === 'pullback'
            ? up
                ? "Strong 24h bid (+".concat(movePct.toFixed(1), "%) with tape still constructive \u2014 watch whether dips find buyers.")
                : "Weak 24h tape (\u2212".concat(movePct.toFixed(1), "%) \u2014 bounces stay fragile until flow improves.")
            : up
                ? "Gaining tape (+".concat(movePct.toFixed(1), "%): trend and flow are improving; next leg depends on hold vs fade.")
                : "Soft 24h tape (\u2212".concat(movePct.toFixed(1), "%): flow is soft; next leg depends on support vs continuation.");
    var watchCue = setupType === 'overextended'
        ? up
            ? 'rejection or continuation'
            : 'capitulation or dead-cat bounce'
        : setupType === 'pullback'
            ? up
                ? 'buyers holding dip bids vs rollover'
                : 'sellers capping rallies vs breakdown'
            : up
                ? 'hold vs fade — next candle confirms bias'
                : 'pressure vs bounce — next candle confirms bias';
    return {
        id: "trend-".concat(symbol),
        pair: pair,
        side: up ? 'long' : 'short',
        biasLabel: up ? 'Potential Long' : 'Potential Short',
        setupType: setupType,
        setupScore: setupScore,
        setupScoreLabel: setupScoreLabel,
        scoreBreakdown: breakdown,
        riskTag: movePct > 10 ? 'High Risk' : movePct > 4 ? 'Medium Risk' : 'Low Risk',
        setupTags: [tag],
        exchange: 'Bybit',
        postedAgo: 'Live',
        aiExplanation: aiExplanation,
        whyThisMatters: 'Fast leaders attract attention; size and stops matter more than chasing the move.',
        watchCue: watchCue,
    };
}
function pickSignalForMarket(symbol, pair, engineSignals, ticker) {
    var byEngine = engineSignals.find(function (s) { return s.pair === pair; });
    if (byEngine)
        return byEngine;
    return buildSyntheticTrendingSignal(symbol, pair, ticker);
}
/** When the engine has not emitted for a tracked pair yet — live ticker still drives row prices. */
function buildTrackedFallbackSignal(pair, symbol) {
    /** Sum under 45 → scanner `idle` / Feed "Setup forming" until detectors qualify a live row. */
    var breakdown = {
        trendAlignment: 10,
        momentumQuality: 8,
        structureQuality: 9,
        volumeConfirmation: 6,
        riskConditions: 6,
    };
    var setupScore = (0, setupScore_1.calculateSetupScore)(breakdown);
    return {
        id: "tracked-".concat(symbol),
        pair: pair,
        side: 'long',
        biasLabel: 'Forming',
        setupType: 'breakout',
        setupScore: setupScore,
        setupScoreLabel: (0, setupScore_1.getSetupScoreLabel)(setupScore),
        scoreBreakdown: breakdown,
        riskTag: 'Medium Risk',
        setupTags: ['Breakout'],
        exchange: 'Bybit',
        postedAgo: 'Live',
        aiExplanation: 'Core watchlist — waiting for a clearer structural edge from the engine.',
        whyThisMatters: 'Liquidity and attention are high; confirmation still matters before sizing.',
        watchCue: 'next impulse — does volume confirm the break?',
    };
}
/**
 * Fixed watchlist rows: engine signal by pair, else a neutral shell until the detector fires.
 */
function buildTrackedScannerRows(engineSignals, tickersBySymbol) {
    return exports.TRACKED_SYMBOLS.map(function (symbol) {
        var pair = symbolToPair(symbol);
        var ticker = tickersBySymbol[symbol];
        var fromEngine = engineSignals.find(function (s) { return s.pair === pair; });
        var signal = fromEngine !== null && fromEngine !== void 0 ? fromEngine : buildTrackedFallbackSignal(pair, symbol);
        var lastPrice = ticker != null ? ticker.lastPrice : Number.NaN;
        var change24hPct = ticker != null ? ticker.price24hPcnt * 100 : Number.NaN;
        var status = deriveMarketStatus(signal);
        var setupTag = signal.setupTags[0];
        return {
            symbol: symbol,
            pair: pair,
            signal: signal,
            lastPrice: lastPrice,
            change24hPct: change24hPct,
            setupScore: signal.setupScore,
            setupScoreLabel: signal.setupScoreLabel,
            insight: signal.aiExplanation,
            setupTag: setupTag,
            status: status,
        };
    });
}
/** Synthetic Movers cards use ids `trend-{SYMBOL}` — status should not mirror engine “trigger” semantics. */
function isSyntheticMoverSignal(signal) {
    return signal.id.startsWith('trend-');
}
function deriveMarketStatus(signal) {
    if (signal.setupType === 'overextended')
        return 'overextended';
    if (signal.timingState === 'extended')
        return 'extended';
    if (signal.timingState === 'triggered')
        return 'triggered';
    if (signal.timingState === 'ready' || signal.timingState === 'developing')
        return 'developing';
    if (signal.timingState === 'expired')
        return 'idle';
    // List gainers with heuristic “pullback” are constructive tape, not a fired setup.
    if (isSyntheticMoverSignal(signal) && signal.setupType === 'pullback') {
        if (signal.setupScore >= 45)
            return 'developing';
        return 'idle';
    }
    // Synthetic breakout on the movers list: still cap at developing unless clearly extreme.
    if (isSyntheticMoverSignal(signal) && signal.setupType === 'breakout') {
        if (signal.setupScore >= 85)
            return 'triggered';
        if (signal.setupScore >= 45)
            return 'developing';
        return 'idle';
    }
    if (signal.setupScore >= 70)
        return 'triggered';
    if (signal.setupScore >= 45)
        return 'developing';
    return 'idle';
}
/**
 * User watchlist (Trade header star). Order matches `favoriteBases`.
 * Uses engine signal when present; else ticker-driven synthetic or a neutral shell when offline.
 */
function buildWatchlistMarketRows(favoriteBases, engineSignals, tickersBySymbol) {
    var out = [];
    var seenSym = new Set();
    var _loop_1 = function (baseRaw) {
        var pair = baseRaw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (pair.length < 2)
            return "continue";
        var symbol = "".concat(pair, "USDT");
        if (seenSym.has(symbol))
            return "continue";
        seenSym.add(symbol);
        var ticker = tickersBySymbol[symbol];
        var fromEngine = engineSignals.find(function (s) { return s.pair === pair; });
        var signal = fromEngine !== null && fromEngine !== void 0 ? fromEngine : (ticker != null ? buildSyntheticTrendingSignal(symbol, pair, ticker) : buildTrackedFallbackSignal(pair, symbol));
        var lastPrice = ticker != null ? ticker.lastPrice : Number.NaN;
        var change24hPct = ticker != null ? ticker.price24hPcnt * 100 : Number.NaN;
        var status_1 = deriveMarketStatus(signal);
        var setupTag = signal.setupTags[0];
        out.push({
            symbol: symbol,
            pair: pair,
            signal: signal,
            lastPrice: lastPrice,
            change24hPct: change24hPct,
            setupScore: signal.setupScore,
            setupScoreLabel: signal.setupScoreLabel,
            insight: signal.aiExplanation,
            setupTag: setupTag,
            status: status_1,
        });
    };
    for (var _i = 0, favoriteBases_1 = favoriteBases; _i < favoriteBases_1.length; _i++) {
        var baseRaw = favoriteBases_1[_i];
        _loop_1(baseRaw);
    }
    return out;
}
/** Same rules as Feed → “Actionable” filter (triggered/developing, score ≥ 65, not overextended). */
function isFeedActionableOpportunity(signal) {
    var status = deriveMarketStatus(signal);
    if (status === 'overextended')
        return false;
    if (status !== 'triggered' && status !== 'developing')
        return false;
    return signal.setupScore >= 65;
}
function buildMarketScannerRows(engineSignals, tickersBySymbol) {
    var all = Object.values(tickersBySymbol);
    var ranked = rankMoversUniverse(all);
    return ranked.map(function (t) {
        var symbol = t.symbol;
        var pair = symbolToPair(symbol);
        var signal = pickSignalForMarket(symbol, pair, engineSignals, t);
        var lastPrice = t.lastPrice;
        var change24hPct = t.price24hPcnt * 100;
        var status = deriveMarketStatus(signal);
        var setupTag = signal.setupTags[0];
        return {
            symbol: symbol,
            pair: pair,
            signal: signal,
            lastPrice: lastPrice,
            change24hPct: change24hPct,
            setupScore: signal.setupScore,
            setupScoreLabel: signal.setupScoreLabel,
            insight: signal.aiExplanation,
            setupTag: setupTag,
            status: status,
        };
    });
}
function countActiveSetups(rows, minScore) {
    if (minScore === void 0) { minScore = 70; }
    return rows.filter(function (r) { return r.setupScore >= minScore; }).length;
}
function countMarketRowStatuses(rows) {
    var out = {
        idle: 0,
        developing: 0,
        triggered: 0,
        extended: 0,
        overextended: 0,
    };
    for (var _i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
        var r = rows_1[_i];
        out[r.status]++;
    }
    return out;
}
function parseMarketStatusQuery(v) {
    if (v === 'idle' || v === 'developing' || v === 'triggered' || v === 'extended' || v === 'overextended')
        return v;
    return null;
}
function scannerStatusTitle(status) {
    switch (status) {
        case 'triggered':
            return 'In play';
        case 'developing':
            return 'Developing';
        case 'overextended':
            return 'Overextended';
        case 'extended':
            return 'Extended';
        default:
            return 'Idle';
    }
}
/** e.g. "In play Pullback" for Trade continuity strip. */
function formatTradeScannerStateLine(status, setupType) {
    var statusLabel = scannerStatusTitle(status);
    var setupLabel = setupType.charAt(0).toUpperCase() + setupType.slice(1);
    if (statusLabel === setupLabel)
        return statusLabel;
    return "".concat(statusLabel, " ").concat(setupLabel);
}
/** One-line pull under insight when setup is in play (scanner / trade / feed). */
function inPlayMicroHeadline(setupType) {
    if (setupType === 'breakout')
        return 'Breakout attempt in progress';
    return 'Setup is active — watching for continuation';
}
/** Micro structural confidence for in-play rows (analytical, not hype). */
function inPlayStructureConfidence(signal) {
    if (signal.setupType === 'pullback')
        return 'Clean pullback structure';
    return 'Structure holding';
}
/**
 * Sets `triggeredAtMs` when a row first enters in-play; clears when it leaves.
 * Mutates `refs` and updates prev status for each symbol in `rows`.
 * `scopeId` separates Tracked vs Movers so the two lists do not clobber each other.
 */
function attachTriggerTimestamps(rows, refs, scopeId) {
    var k = function (symbol) { return "".concat(scopeId, ":").concat(symbol); };
    var out = rows.map(function (r) {
        var key = k(r.symbol);
        var was = refs.prevStatusBySymbol[key];
        if (r.status === 'triggered' && was !== 'triggered') {
            refs.triggeredAtBySymbol[key] = Date.now();
        }
        if (r.status !== 'triggered') {
            delete refs.triggeredAtBySymbol[key];
        }
        if (r.status === 'triggered' && refs.triggeredAtBySymbol[key] === undefined) {
            refs.triggeredAtBySymbol[key] = Date.now();
        }
        var triggeredAtMs = r.status === 'triggered' ? refs.triggeredAtBySymbol[key] : undefined;
        return __assign(__assign({}, r), { triggeredAtMs: triggeredAtMs });
    });
    for (var _i = 0, rows_2 = rows; _i < rows_2.length; _i++) {
        var r = rows_2[_i];
        refs.prevStatusBySymbol[k(r.symbol)] = r.status;
    }
    return out;
}
/**
 * Attention routing: `triggered` rows always first, then by newest `triggeredAtMs`,
 * then score. All other statuses keep original list order.
 */
function sortScannerRowsForTapPriority(rows) {
    var tagged = rows.map(function (r, i) { return ({ r: r, i: i }); });
    tagged.sort(function (a, b) {
        var _a, _b;
        var aPlay = a.r.status === 'triggered' ? 1 : 0;
        var bPlay = b.r.status === 'triggered' ? 1 : 0;
        if (aPlay !== bPlay)
            return bPlay - aPlay;
        if (aPlay === 1) {
            var ta = (_a = a.r.triggeredAtMs) !== null && _a !== void 0 ? _a : -1;
            var tb = (_b = b.r.triggeredAtMs) !== null && _b !== void 0 ? _b : -1;
            if (tb !== ta)
                return tb - ta;
            if (b.r.setupScore !== a.r.setupScore)
                return b.r.setupScore - a.r.setupScore;
            return a.r.symbol.localeCompare(b.r.symbol);
        }
        return a.i - b.i;
    });
    return tagged.map(function (_a) {
        var r = _a.r;
        return r;
    });
}
/** Timing fragment for status line (`Triggered 6m ago` when `compactMinutes`). */
function formatInPlayTimingCue(triggeredAtMs, postedAgo, nowMs, compactMinutes) {
    if (nowMs === void 0) { nowMs = Date.now(); }
    if (compactMinutes === void 0) { compactMinutes = false; }
    if (triggeredAtMs != null && Number.isFinite(triggeredAtMs)) {
        var sec = Math.max(0, Math.floor((nowMs - triggeredAtMs) / 1000));
        if (sec < 50)
            return 'Just triggered';
        if (sec < 3600) {
            var m = Math.max(1, Math.floor(sec / 60));
            return compactMinutes ? "Triggered ".concat(m, "m ago") : "Triggered ".concat(m, " min ago");
        }
        var h = Math.floor(sec / 3600);
        if (compactMinutes)
            return h === 1 ? 'Triggered 1h ago' : "Triggered ".concat(h, "h ago");
        return h === 1 ? 'Triggered 1 hr ago' : "Triggered ".concat(h, " hr ago");
    }
    var ago = postedAgo === null || postedAgo === void 0 ? void 0 : postedAgo.trim();
    if (ago && ago.toLowerCase() !== 'live') {
        var compactMin = /^(\d+)\s*m\s*ago$/i.exec(ago);
        if (compactMin) {
            return compactMinutes ? "Triggered ".concat(compactMin[1], "m ago") : "Triggered ".concat(compactMin[1], " min ago");
        }
        return ago;
    }
    return 'Just triggered';
}
function attachScoreTrends(rows, previousScores) {
    return rows.map(function (r) {
        var prev = previousScores[r.symbol];
        var scoreTrend = null;
        if (prev !== undefined) {
            if (r.setupScore > prev)
                scoreTrend = 'up';
            else if (r.setupScore < prev)
                scoreTrend = 'down';
            else
                scoreTrend = 'flat';
        }
        return __assign(__assign({}, r), { scoreTrend: scoreTrend });
    });
}
