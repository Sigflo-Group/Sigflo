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
exports.ScannerLabScreen = ScannerLabScreen;
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var Card_1 = require("@/components/ui/Card");
var scannerLabCandles_1 = require("@/data/scannerLabCandles");
var detectors_1 = require("@/lib/detectors");
var setupScore_1 = require("@/lib/setupScore");
var candlePlayback_1 = require("@/lib/candlePlayback");
var SCENARIOS = {
    breakout: { label: 'Breakout' },
    pullback: { label: 'Pullback' },
    overextended: { label: 'Overextended' },
};
var SCENARIO_CANDLES = {
    breakout: scannerLabCandles_1.breakoutScenario5m,
    pullback: scannerLabCandles_1.pullbackScenario5m,
    overextended: scannerLabCandles_1.overextendedScenario5m,
};
function formatTs(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function nextNeedFromReasons(reasons) {
    var text = reasons.join(' ').toLowerCase();
    if (text.includes('volume'))
        return 'Needs volume expansion to trigger.';
    if (text.includes('pullback depth'))
        return 'Waiting for pullback depth to complete.';
    if (text.includes('rsi'))
        return 'Needs RSI alignment before trigger.';
    if (text.includes('range') || text.includes('compressed'))
        return 'Needs tighter range compression.';
    if (text.includes('distance to breakout'))
        return 'Needs price closer to breakout zone.';
    if (text.includes('momentum'))
        return 'Needs stronger momentum confirmation.';
    if (text.includes('resistance'))
        return 'Needs cleaner resistance interaction.';
    if (text.includes('not closed'))
        return 'Waiting for closed candle confirmation.';
    if (text.includes('need at least'))
        return 'Waiting for enough candles to evaluate setup.';
    return 'Needs more conditions to align before trigger.';
}
function statusFromEvaluation(r, score) {
    if (r.triggered)
        return 'triggered';
    var isWaiting = r.reasons.some(function (reason) { return reason.includes('Need at least') || reason.includes('not closed'); });
    if (isWaiting)
        return 'invalid';
    var failCount = r.reasons.length;
    var potential = score !== null && score !== void 0 ? score : 0;
    if (failCount <= 1 || potential >= 70)
        return 'close';
    if (failCount <= 3 || potential >= 55)
        return 'developing';
    return 'invalid';
}
function ScannerLabScreen() {
    var navigate = (0, react_router_dom_1.useNavigate)();
    var _a = (0, react_1.useState)('breakout'), scenario = _a[0], setScenario = _a[1];
    var _b = (0, react_1.useState)(false), isPlaying = _b[0], setIsPlaying = _b[1];
    var _c = (0, react_1.useState)(700), speedMs = _c[0], setSpeedMs = _c[1];
    var _d = (0, react_1.useState)(function () { return (0, candlePlayback_1.createPlaybackSession)({ scenario: 'breakout' }); }), session = _d[0], setSession = _d[1];
    var _e = (0, react_1.useState)(session.lastStep), lastStep = _e[0], setLastStep = _e[1];
    var stopAutoRef = (0, react_1.useRef)(null);
    var prevDetectorScoresRef = (0, react_1.useRef)({});
    var prevSetupScoreRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(function () {
        if (stopAutoRef.current)
            stopAutoRef.current();
        var next = (0, candlePlayback_1.setScenario)(session, scenario);
        setSession(next);
        setLastStep(next.lastStep);
        setIsPlaying(false);
    }, [scenario]);
    (0, react_1.useEffect)(function () {
        if (!isPlaying) {
            if (stopAutoRef.current)
                stopAutoRef.current();
            stopAutoRef.current = null;
            return undefined;
        }
        stopAutoRef.current = (0, candlePlayback_1.startAutoplay)(session, function (next) {
            setSession(next);
            var step = next.lastStep;
            if (!step)
                return;
            setLastStep(step);
            if (step.newSignals.length > 0) {
                for (var _i = 0, _a = step.newSignals; _i < _a.length; _i++) {
                    var s = _a[_i];
                    console.log("[ScannerLab] ".concat(formatTs(s.timestamp), " ").concat(s.symbol, " ").concat(s.setupType, " detected | Setup Score: ").concat(s.setupScore));
                    console.log('[ScannerLab] Breakdown:', s.scoreBreakdown);
                }
            }
            if (step.done)
                setIsPlaying(false);
        }, speedMs);
        return function () {
            if (stopAutoRef.current)
                stopAutoRef.current();
            stopAutoRef.current = null;
        };
    }, [isPlaying, speedMs, session]);
    var latestEvaluations = (0, react_1.useMemo)(function () {
        var _a;
        var rows = (_a = lastStep === null || lastStep === void 0 ? void 0 : lastStep.detectorEvaluations) !== null && _a !== void 0 ? _a : [];
        return rows.map(function (r) { return ({
            setupType: r.setupType,
            reasons: r.reasons.length > 0 ? r.reasons : ['Conditions not met'],
            score: r.scoreBreakdown ? (0, setupScore_1.calculateSetupScore)(r.scoreBreakdown) : null,
            facts: r.explanationFacts,
        }); }).map(function (row) {
            var prevScore = prevDetectorScoresRef.current[row.setupType];
            var trend = row.score == null || prevScore == null
                ? 'flat'
                : row.score > prevScore
                    ? 'rising'
                    : row.score < prevScore
                        ? 'weakening'
                        : 'flat';
            var raw = rows.find(function (r) { return r.setupType === row.setupType; });
            var status = raw ? statusFromEvaluation(raw, row.score) : 'invalid';
            if (status === 'triggered')
                return __assign(__assign({}, row), { status: status, nextNeed: 'In play now.', trend: trend });
            return __assign(__assign({}, row), { status: status, nextNeed: nextNeedFromReasons(row.reasons), trend: trend });
        });
    }, [lastStep]);
    var fireMoment = (0, react_1.useMemo)(function () {
        if (!lastStep || lastStep.newSignals.length === 0)
            return null;
        return {
            candleIndex: lastStep.index,
            setupTypes: new Set(lastStep.newSignals.map(function (s) { return s.setupType; })),
        };
    }, [lastStep]);
    var topPanel = (0, react_1.useMemo)(function () {
        var _a, _b;
        if (lastStep) {
            return {
                price: lastStep.currentCandle.close,
                rsi: lastStep.indicators.rsi14,
                atr: lastStep.indicators.atr14,
                ema20: lastStep.indicators.ema20,
                ema50: lastStep.indicators.ema50,
            };
        }
        var candles = SCENARIO_CANDLES[scenario];
        var seed = candles.slice(0, Math.min(6, candles.length));
        var indicators = (0, detectors_1.deriveIndicators)(seed);
        var price = (_b = (_a = seed.at(-1)) === null || _a === void 0 ? void 0 : _a.close) !== null && _b !== void 0 ? _b : 0;
        return {
            price: price,
            rsi: indicators.rsi14,
            atr: indicators.atr14,
            ema20: indicators.ema20,
            ema50: indicators.ema50,
        };
    }, [lastStep, scenario]);
    var currentSetup = (0, react_1.useMemo)(function () {
        var _a;
        var evals = (_a = lastStep === null || lastStep === void 0 ? void 0 : lastStep.detectorEvaluations) !== null && _a !== void 0 ? _a : [];
        var scored = evals
            .map(function (e) {
            if (!e.scoreBreakdown)
                return null;
            var raw = (0, setupScore_1.calculateSetupScore)(e.scoreBreakdown);
            var status = statusFromEvaluation(e, raw);
            var missing = e.reasons.length;
            // Readiness-adjusted potential:
            // non-triggered detectors lose points per missing condition so one inflated raw score
            // doesn't pin "Current Setup Score" unrealistically high.
            var adjusted = status === 'triggered' ? raw : Math.max(0, raw - missing * 6);
            var priority = status === 'triggered' ? 3 : status === 'close' ? 2 : status === 'developing' ? 1 : 0;
            return { raw: raw, adjusted: adjusted, priority: priority };
        })
            .filter(function (x) { return Boolean(x); });
        if (scored.length === 0)
            return null;
        var picked = __spreadArray([], scored, true).sort(function (a, b) { return b.priority - a.priority || b.adjusted - a.adjusted; })[0];
        var score = Math.round(picked.adjusted);
        var prev = prevSetupScoreRef.current;
        var trend = prev == null ? 'flat' : score > prev ? 'rising' : score < prev ? 'weakening' : 'flat';
        return {
            score: score,
            label: (0, setupScore_1.getSetupScoreLabel)(score),
            trend: trend,
        };
    }, [lastStep]);
    var usefulnessMetrics = (0, react_1.useMemo)(function () {
        var candles = SCENARIO_CANDLES[scenario];
        var upto = session.state.index;
        var detectorKeys = ['breakout', 'pullback', 'overextended'];
        var LOOKAHEAD_BARS = 5;
        var firstDeveloping = {
            breakout: null,
            pullback: null,
            overextended: null,
        };
        var leadLagSamples = {
            breakout: [],
            pullback: [],
            overextended: [],
        };
        for (var i = 1; i <= upto; i += 1) {
            var visible = candles.slice(0, i);
            var evaluations = (0, detectors_1.runScannerLabEngineEvaluations)(session.config.symbol, visible).evaluations;
            for (var _i = 0, evaluations_1 = evaluations; _i < evaluations_1.length; _i++) {
                var ev = evaluations_1[_i];
                var score = ev.scoreBreakdown ? (0, setupScore_1.calculateSetupScore)(ev.scoreBreakdown) : null;
                var status_1 = statusFromEvaluation(ev, score);
                if (status_1 === 'developing' && firstDeveloping[ev.setupType] == null) {
                    firstDeveloping[ev.setupType] = i;
                }
                if (status_1 === 'triggered') {
                    var first = firstDeveloping[ev.setupType];
                    if (first != null)
                        leadLagSamples[ev.setupType].push(i - first);
                    firstDeveloping[ev.setupType] = null;
                }
            }
        }
        var triggerByType = detectorKeys.reduce(function (acc, key) {
            acc[key] = session.state.emittedSignals.filter(function (s) { return s.setupType === key; });
            return acc;
        }, {});
        var out = detectorKeys.map(function (key) {
            var _a, _b;
            var signals = triggerByType[key];
            var density = upto > 0 ? (signals.length / upto) * 100 : 0;
            var lags = leadLagSamples[key];
            var avgLag = lags.length > 0 ? lags.reduce(function (a, b) { return a + b; }, 0) / lags.length : null;
            var favorableMoves = [];
            var adverseMoves = [];
            var closeAfterNMoves = [];
            for (var _i = 0, signals_1 = signals; _i < signals_1.length; _i++) {
                var s = signals_1[_i];
                var triggerIdx = s.candleIndex - 1;
                var futureIdx = Math.min(candles.length - 1, triggerIdx + LOOKAHEAD_BARS);
                if (triggerIdx < 0 || futureIdx <= triggerIdx)
                    continue;
                var entry = candles[triggerIdx].close;
                var window_1 = candles.slice(triggerIdx + 1, futureIdx + 1);
                if (window_1.length === 0)
                    continue;
                var atrAtTrigger = (0, detectors_1.deriveIndicators)(candles.slice(0, triggerIdx + 1)).atr14;
                var dir = s.directionBias === 'short' ? -1 : 1;
                var maxHigh = window_1.reduce(function (m, c) { return Math.max(m, c.high); }, window_1[0].high);
                var minLow = window_1.reduce(function (m, c) { return Math.min(m, c.low); }, window_1[0].low);
                var closeAfterN = (_b = (_a = window_1.at(-1)) === null || _a === void 0 ? void 0 : _a.close) !== null && _b !== void 0 ? _b : entry;
                var norm = Math.max(0.000001, atrAtTrigger);
                var favorableAtr = dir === 1 ? (maxHigh - entry) / norm : (entry - minLow) / norm;
                var adverseAtr = dir === 1 ? (entry - minLow) / norm : (maxHigh - entry) / norm;
                var closeAfterNAtr = ((closeAfterN - entry) * dir) / norm;
                favorableMoves.push(favorableAtr);
                adverseMoves.push(adverseAtr);
                closeAfterNMoves.push(closeAfterNAtr);
            }
            var avgFollow = closeAfterNMoves.length > 0 ? closeAfterNMoves.reduce(function (a, b) { return a + b; }, 0) / closeAfterNMoves.length : null;
            var avgAdverse = adverseMoves.length > 0 ? adverseMoves.reduce(function (a, b) { return a + b; }, 0) / adverseMoves.length : null;
            var avgFavorable = favorableMoves.length > 0 ? favorableMoves.reduce(function (a, b) { return a + b; }, 0) / favorableMoves.length : null;
            return {
                key: key,
                leadLag: avgLag,
                density: density,
                avgFavorableAtr: avgFavorable,
                avgAdverseAtr: avgAdverse,
                followThroughAtr: avgFollow,
                samples: signals.length,
            };
        });
        return out;
    }, [scenario, session.config.symbol, session.state.emittedSignals, session.state.index]);
    (0, react_1.useEffect)(function () {
        var nextMap = {};
        for (var _i = 0, latestEvaluations_1 = latestEvaluations; _i < latestEvaluations_1.length; _i++) {
            var row = latestEvaluations_1[_i];
            if (row.score != null)
                nextMap[row.setupType] = row.score;
        }
        prevDetectorScoresRef.current = nextMap;
    }, [latestEvaluations]);
    (0, react_1.useEffect)(function () {
        var _a;
        prevSetupScoreRef.current = (_a = currentSetup === null || currentSetup === void 0 ? void 0 : currentSetup.score) !== null && _a !== void 0 ? _a : null;
    }, [currentSetup === null || currentSetup === void 0 ? void 0 : currentSetup.score]);
    var handleStep = function () {
        var next = (0, candlePlayback_1.stepForward)(session);
        setSession(next);
        var step = next.lastStep;
        if (step) {
            setLastStep(step);
            for (var _i = 0, _a = step.newSignals; _i < _a.length; _i++) {
                var s = _a[_i];
                console.log("[ScannerLab] ".concat(formatTs(s.timestamp), " ").concat(s.symbol, " ").concat(s.setupType, " detected"));
            }
        }
    };
    var handleReset = function () {
        var next = (0, candlePlayback_1.resetPlayback)(session);
        setSession(next);
        setLastStep(next.lastStep);
        setIsPlaying(false);
    };
    return (<div className="space-y-4 pb-6 pt-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <button type="button" onClick={function () { return navigate(-1); }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-sigflo-muted transition hover:bg-white/[0.08] hover:text-white" aria-label="Go back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-400/85">Scanner Lab</p>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Playback sandbox</h1>
        <p className="text-sm text-sigflo-muted">Replay crafted scenarios candle-by-candle and inspect detector logic.</p>
      </header>

      <Card_1.Card className="space-y-2 p-4">
        <h2 className="text-sm font-semibold text-white">How to use this lab</h2>
        <p className="text-xs text-sigflo-muted">1) Pick a scenario. 2) Press Step or Play. 3) Watch detector status, setup score, and signal history.</p>
        <p className="text-xs text-sigflo-muted">
          Rules match the production engine (`@/engine/detectors`): long/short pairs and fixed thresholds. Window needs at least {detectors_1.MIN_ENGINE_BARS} bars before setups can fire.
        </p>
      </Card_1.Card>

      <Card_1.Card className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs font-medium text-sigflo-muted" htmlFor="scenario">
            Scenario
          </label>
          <select id="scenario" value={scenario} onChange={function (e) { return setScenario(e.target.value); }} className="rounded-lg border border-sigflo-border bg-sigflo-bg px-2 py-1 text-xs text-white">
            {Object.entries(SCENARIOS).map(function (_a) {
            var key = _a[0], s = _a[1];
            return (<option key={key} value={key}>
                {s.label}
              </option>);
        })}
          </select>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <button type="button" onClick={function () { return setIsPlaying(true); }} className="rounded-lg bg-emerald-500/20 px-2 py-2 text-xs text-emerald-200">
            Play
          </button>
          <button type="button" onClick={function () { return setIsPlaying(false); }} className="rounded-lg bg-white/[0.06] px-2 py-2 text-xs text-white">
            Pause
          </button>
          <button type="button" onClick={handleStep} className="rounded-lg bg-cyan-500/20 px-2 py-2 text-xs text-cyan-200">
            Step
          </button>
          <button type="button" onClick={handleReset} className="rounded-lg bg-white/[0.06] px-2 py-2 text-xs text-white">
            Reset
          </button>
        </div>
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-sigflo-muted">Speed</span>
          <select value={String(speedMs)} onChange={function (e) { return setSpeedMs(Number(e.target.value)); }} className="rounded-lg border border-sigflo-border bg-sigflo-bg px-2 py-1 text-xs text-white">
            <option value="1000">1.0s</option>
            <option value="700">0.7s</option>
            <option value="500">0.5s</option>
          </select>
        </div>
      </Card_1.Card>

      <Card_1.Card className="space-y-2 p-4">
        <h2 className="text-sm font-semibold text-white">Engine parity</h2>
        <p className="text-xs text-sigflo-muted">
          Playback uses <code className="rounded bg-white/10 px-1 py-0.5 text-[10px]">@/engine/detectors</code> with{' '}
          <code className="rounded bg-white/10 px-1 py-0.5 text-[10px]">pickBestDirectionalPair</code> — same stack as{' '}
          <code className="rounded bg-white/10 px-1 py-0.5 text-[10px]">runScannerPipeline</code>. Per-bar toggles were removed
          so the lab cannot drift from production thresholds.
        </p>
      </Card_1.Card>

      <Card_1.Card className="p-4">
        <p className="text-xs text-sigflo-muted">
          {lastStep
            ? "Candle ".concat(lastStep.index, "/").concat(session.state.total, " \u2022 ").concat(formatTs(lastStep.currentCandle.timestamp))
            : "Candle 0/".concat(session.state.total)}
        </p>
        {fireMoment ? (<div className="mt-2 inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold tracking-wide text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
            FIRE MOMENT • Candle {fireMoment.candleIndex}
          </div>) : null}
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg border border-sigflo-border bg-sigflo-bg/50 p-2">
            <p className="text-sigflo-muted">Price</p>
            <p className="mt-0.5 text-sm font-semibold text-white">{Math.round(topPanel.price).toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-sigflo-border bg-sigflo-bg/50 p-2">
            <p className="text-sigflo-muted">RSI</p>
            <p className="mt-0.5 text-sm font-semibold text-white">{Math.round(topPanel.rsi)}</p>
          </div>
          <div className="rounded-lg border border-sigflo-border bg-sigflo-bg/50 p-2">
            <p className="text-sigflo-muted">ATR</p>
            <p className="mt-0.5 text-sm font-semibold text-white">{Math.round(topPanel.atr).toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-sigflo-border bg-sigflo-bg/50 p-2">
            <p className="text-sigflo-muted">EMA20 / EMA50</p>
            <p className="mt-0.5 text-sm font-semibold text-white">
              {Math.round(topPanel.ema20).toLocaleString()} / {Math.round(topPanel.ema50).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="mt-2 rounded-lg border border-sigflo-border bg-sigflo-bg/50 p-2">
          <p className="text-sigflo-muted">Current Setup Score</p>
          <p className="mt-0.5 text-sm font-semibold text-white">
            {currentSetup ? currentSetup.score : '-'}{' '}
            {(currentSetup === null || currentSetup === void 0 ? void 0 : currentSetup.trend) === 'rising' ? '↑' : (currentSetup === null || currentSetup === void 0 ? void 0 : currentSetup.trend) === 'weakening' ? '↓' : '→'}
          </p>
          <p className="text-xs text-cyan-200">
            {currentSetup
            ? "".concat(currentSetup.label, " ").concat(currentSetup.trend === 'rising' ? '↑' : currentSetup.trend === 'weakening' ? '↓' : '').trim()
            : 'Builds as conditions align'}
          </p>
        </div>
      </Card_1.Card>

      <Card_1.Card className="space-y-2 p-4">
        <h2 className="text-sm font-semibold text-white">Detector status</h2>
        {latestEvaluations.length === 0 ? (<p className="text-xs text-sigflo-muted">Step through candles to evaluate detectors.</p>) : (latestEvaluations.map(function (row) {
            var _a, _b, _c, _d, _e;
            return (<div key={row.setupType} className={"rounded-xl border px-3 py-2 transition ".concat((fireMoment === null || fireMoment === void 0 ? void 0 : fireMoment.setupTypes.has(row.setupType))
                    ? 'border-emerald-300/60 bg-emerald-500/10 shadow-[0_0_18px_rgba(16,185,129,0.35)]'
                    : 'border-sigflo-border bg-sigflo-bg/50')}>
              <p className="text-xs font-semibold capitalize text-white">{row.setupType} detector</p>
              <p className="mt-1 text-xs text-white">
                Status:{' '}
                <span className={row.status === 'triggered'
                    ? 'text-emerald-300'
                    : row.status === 'close'
                        ? 'text-amber-300'
                        : row.status === 'developing'
                            ? 'text-cyan-300'
                            : 'text-sigflo-muted'}>
                  {row.status === 'triggered'
                    ? '✅ In play'
                    : row.status === 'close'
                        ? '⚠️ Close'
                        : row.status === 'developing'
                            ? '🔄 Developing'
                            : '❌ Invalid'}
                </span>
              </p>
              <p className="mt-1 text-xs text-white">
                Score: {(_a = row.score) !== null && _a !== void 0 ? _a : '-'} / Trigger: {session.config.minSetupScore}{' '}
                {row.trend === 'rising' ? '↑' : row.trend === 'weakening' ? '↓' : '→'}
              </p>
              {row.setupType === 'breakout' ? (<p className="mt-1 text-[11px] text-sigflo-muted">
                  Compression: {String((_c = (_b = row.facts) === null || _b === void 0 ? void 0 : _b.compressionRatio) !== null && _c !== void 0 ? _c : '-')} / threshold {String((_e = (_d = row.facts) === null || _d === void 0 ? void 0 : _d.compressionThreshold) !== null && _e !== void 0 ? _e : '-')}
                </p>) : null}
              <div className="mt-1 text-[11px] text-sigflo-muted">
                {row.status === 'triggered' ? (<>
                    <p>Reason:</p>
                    {row.reasons.map(function (reason, idx) { return (<p key={"".concat(row.setupType, "-reason-").concat(idx)} className="leading-relaxed">
                        "{reason}"
                      </p>); })}
                  </>) : (<>
                    <p className={row.status === 'developing' ? 'text-cyan-300' : 'text-red-300'}>
                      {row.status === 'developing'
                        ? "\uD83D\uDD04 ".concat(row.setupType[0].toUpperCase() + row.setupType.slice(1), " developing")
                        : "\u274C ".concat(row.setupType[0].toUpperCase() + row.setupType.slice(1), " not in play")}
                    </p>
                    {row.reasons.map(function (reason, idx) { return (<p key={"".concat(row.setupType, "-reason-").concat(idx)} className="leading-relaxed">
                        • {reason}
                      </p>); })}
                  </>)}
              </div>
              <p className="mt-2 text-[11px] font-medium text-cyan-200">{row.nextNeed}</p>
            </div>);
        }))}
      </Card_1.Card>

      <Card_1.Card className="space-y-2 p-4">
        <h2 className="text-sm font-semibold text-white">Signal history</h2>
        {session.state.emittedSignals.length === 0 ? (<p className="text-xs text-sigflo-muted">No signals yet. Step forward to validate timing and frequency.</p>) : (session.state.emittedSignals
            .slice()
            .reverse()
            .map(function (s, idx) { return (<div key={"".concat(s.timestamp, "-").concat(idx)} className="rounded-xl border border-sigflo-border bg-sigflo-bg/50 px-3 py-2">
                <p className={"text-xs ".concat(fireMoment && s.candleIndex === fireMoment.candleIndex
                ? 'font-semibold text-emerald-300'
                : 'text-sigflo-muted')}>
                  Candle {s.candleIndex} • {formatTs(s.timestamp)}
                </p>
                <p className="mt-1 text-xs text-white">
                  <span className="font-semibold capitalize">{s.setupType}</span> — {s.setupScore}
                </p>
                <p className="mt-1 text-[11px] text-sigflo-muted">"{s.whyFired}"</p>
              </div>); }))}
      </Card_1.Card>

      <Card_1.Card className="space-y-2 p-4">
        <h2 className="text-sm font-semibold text-white">Usefulness Metrics</h2>
        <div className="rounded-xl border border-sigflo-border bg-sigflo-bg/50 px-3 py-2 text-[11px] text-sigflo-muted">
          <p>
            <span className="text-white">Lead/Lag:</span> candles from first <span className="text-cyan-200">Developing</span> state to
            trigger. Lower is faster; very low may be noisy.
          </p>
          <p>
            <span className="text-white">Signal Density:</span> triggers per 100 candles. Higher = more frequent signals.
          </p>
          <p>
            <span className="text-white">Avg Follow-through:</span> direction-aware close-after-N in ATR. Higher positive is better.
          </p>
          <p>
            <span className="text-white">Avg Adverse Move:</span> against-position excursion in ATR after trigger. Lower is safer.
          </p>
          <p>
            <span className="text-white">Avg Favorable Excursion:</span> best in-window move in your direction (ATR). Higher means more
            opportunity.
          </p>
        </div>
        {usefulnessMetrics.map(function (m) { return (<div key={m.key} className="rounded-xl border border-sigflo-border bg-sigflo-bg/50 px-3 py-2 text-xs">
            <p className="font-semibold capitalize text-white">{m.key}</p>
            <p className="mt-1 text-sigflo-muted">
              Lead/Lag: {m.leadLag == null ? '-' : "".concat(m.leadLag.toFixed(1), " candles")}
            </p>
            <p className="text-sigflo-muted">Signal Density: {m.density.toFixed(1)} per 100 candles</p>
            <p className="text-sigflo-muted">
              Avg Follow-through: {m.followThroughAtr == null ? '-' : "".concat(m.followThroughAtr.toFixed(2), " ATR")}
            </p>
            <p className="text-sigflo-muted">Avg Adverse Move: {m.avgAdverseAtr == null ? '-' : "".concat(m.avgAdverseAtr.toFixed(2), " ATR")}</p>
            <p className="text-sigflo-muted">Avg Favorable Excursion: {m.avgFavorableAtr == null ? '-' : "".concat(m.avgFavorableAtr.toFixed(2), " ATR")}</p>
            <p className="text-sigflo-muted">Samples: {m.samples}</p>
          </div>); })}
      </Card_1.Card>
    </div>);
}
