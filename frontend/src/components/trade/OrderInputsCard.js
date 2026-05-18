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
exports.OrderInputsCard = OrderInputsCard;
var react_1 = require("react");
var useHoldStepper_1 = require("@/hooks/useHoldStepper");
var RiskSegmentMeter_1 = require("@/components/ui/RiskSegmentMeter");
var formatQuote_1 = require("@/lib/formatQuote");
var formatFundingBalance_1 = require("@/lib/formatFundingBalance");
var exchangeTransferUrls_1 = require("@/lib/exchangeTransferUrls");
var bybitTpSlTrigger_1 = require("@/lib/bybitTpSlTrigger");
function fmtUsd2(n) {
    if (!Number.isFinite(n))
        return '—';
    return "$".concat(n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
}
function money(n) {
    return "$".concat(Math.round(n).toLocaleString('en-US'));
}
function moneyTight(n) {
    if (!Number.isFinite(n))
        return '—';
    var abs = Math.abs(n);
    if (abs >= 1000)
        return "$".concat(abs.toLocaleString('en-US', { maximumFractionDigits: 0 }));
    return "$".concat(abs.toFixed(2));
}
function roundUsd(n) {
    return Math.round(n * 100) / 100;
}
var AMOUNT_INPUT_STEP_USD = 0.01;
/** Hard cap on native range `max` so the control stays responsive (avoid millions of DOM steps). */
var AMOUNT_SLIDER_INDEX_CAP = 500000;
/**
 * How many discrete positions the amount slider uses: high enough for ~cent-level deltas on
 * typical balances; capped so a linear 0…`amountMax` slider is not limited by screen pixels.
 */
function computeAmountSliderIndexMax(amountMax) {
    if (!Number.isFinite(amountMax) || amountMax <= 0)
        return 1;
    var idealCents = Math.ceil(amountMax / 0.01);
    return Math.min(AMOUNT_SLIDER_INDEX_CAP, Math.max(200, idealCents));
}
function amountUsdToSliderIndex(amountUsd, amountMax, indexMax) {
    if (!(amountMax > 0) || indexMax <= 0)
        return 0;
    var a = Math.max(0, Math.min(amountMax, Number.isFinite(amountUsd) ? amountUsd : 0));
    var idx = Math.round((a / amountMax) * indexMax);
    return Math.min(indexMax, Math.max(0, idx));
}
function sliderIndexToAmountUsd(idx, amountMax, indexMax) {
    if (!(amountMax > 0) || indexMax <= 0 || !Number.isFinite(idx))
        return 0;
    var i = Math.min(indexMax, Math.max(0, Math.round(idx)));
    var raw = (i / indexMax) * amountMax;
    if (!Number.isFinite(raw))
        return 0;
    return roundUsd(Math.min(amountMax, Math.max(0, raw)));
}
/** Stop loss slider: adverse move from entry (0–100%). */
var SL_PCT_SLIDER_MAX = 100;
var SL_PCT_STEP = 0.1;
/** One-tap adverse % presets (must stay ≤ SL_PCT_SLIDER_MAX). */
var SL_PCT_PRESETS = [0.2, 1, 2, 3, 5, 10, 15, 25, 50];
/** Take profit slider: favorable move from entry (%). */
var TP_PCT_SLIDER_MIN = 0;
var TP_PCT_SLIDER_MAX = 500;
/** How closely the TP thumb / +% readout tracks implied % when price (e.g. mark) moves — not chip snaps (those would jump 25↔50). */
var TP_PCT_REFLECT_STEP = 0.1;
/** One-tap favorable % presets (clamped to slider range in UI). */
var TP_PCT_PRESETS = [0, 10, 25, 50, 100, 150, 200, 300, 400, 500];
/** Scale-out % of the **open exchange leg** (partial TP) — shown under Take profit when eligible. */
var PARTIAL_POSITION_TP_PCTS = [25, 50, 75];
/** Snap targets (slider only settles on these; includes 0% SL / TP preset list). */
var SL_SNAP_PCTS = __spreadArray([0], SL_PCT_PRESETS, true);
var TP_SNAP_PCTS = TP_PCT_PRESETS;
/** Internal range resolution (linear thumb position 0…1000). */
var LEVEL_SLIDER_STEPS = 1000;
/** Must match `.sigflo-level-slider` thumb width in `index.css` (WebKit + Moz). */
var LEVEL_SLIDER_THUMB_PX = 20;
function nearestSnapPct(raw, snaps) {
    var best = snaps[0];
    var bestD = Math.abs(raw - best);
    for (var _i = 0, snaps_1 = snaps; _i < snaps_1.length; _i++) {
        var s = snaps_1[_i];
        var d = Math.abs(raw - s);
        if (d < bestD) {
            bestD = d;
            best = s;
        }
    }
    return best;
}
function roundPctToStep(pct, step) {
    if (!Number.isFinite(pct) || !(step > 0))
        return 0;
    return Math.round(pct / step) * step;
}
function fmtPctCompact(pct) {
    return Number.isInteger(pct) ? "".concat(pct) : pct.toFixed(1);
}
/** Single futures reference: fair/mark first (perp convention), then last, then index. */
function coalesceFuturesQuotePx(last, mark, index) {
    if (mark != null && Number.isFinite(mark) && mark > 0)
        return mark;
    if (last != null && Number.isFinite(last) && last > 0)
        return last;
    if (index != null && Number.isFinite(index) && index > 0)
        return index;
    return null;
}
function pctBasisHeaderText(b, entryBasisUi) {
    if (b === 'entry')
        return entryBasisUi;
    if (b === 'quote')
        return 'live';
    return 'last';
}
function pctBasisChipText(b, entryChipLabel) {
    if (b === 'entry')
        return entryChipLabel;
    if (b === 'quote')
        return 'Live';
    return 'Last';
}
function slTpAwaitingSliderCopy(basis, sliderBlocked, m) {
    if (!sliderBlocked || basis === 'entry')
        return null;
    if (basis === 'quote') {
        return m === 'futures' ? 'Waiting for a live quote (mark / last / index) — % slider stays off until then.' : null;
    }
    return 'Waiting for last price — % slider stays off until then.';
}
function pctBasisTooltip(basis, market, chip) {
    if (basis === 'entry') {
        return chip === 'avg'
            ? 'Calculate from exchange average entry (filled)'
            : 'Calculate from plan / chart entry anchor';
    }
    if (basis === 'quote') {
        return market === 'futures'
            ? 'Calculate % from live perp quote (mark if available, else last traded, else index).'
            : 'Calculate from last traded price (order-book prints).';
    }
    return 'Calculate from last traded price (order-book prints).';
}
var FUTURES_SL_TP_PCT_BASES = ['entry'];
var SPOT_SL_TP_PCT_BASES = ['entry'];
/** Evenly spaces SL chip/tick centers along the track (last segment maps 50% → 100% for the thumb). */
function slChipLayoutNorm(chipIndex) {
    var n = SL_SNAP_PCTS.length;
    if (n <= 1)
        return 0;
    return chipIndex / n;
}
function slPctFromLinearSteps(steps) {
    var _a;
    var u = Math.min(1, Math.max(0, steps / LEVEL_SLIDER_STEPS));
    var s = SL_SNAP_PCTS;
    var n = s.length;
    if (n < 2)
        return u >= 1 ? SL_PCT_SLIDER_MAX : ((_a = s[0]) !== null && _a !== void 0 ? _a : 0);
    var uLastChip = (n - 1) / n;
    if (u >= uLastChip) {
        if (u >= 1)
            return SL_PCT_SLIDER_MAX;
        var tail = 1 - uLastChip;
        var t_1 = tail > 0 ? (u - uLastChip) / tail : 1;
        return s[n - 1] + t_1 * (SL_PCT_SLIDER_MAX - s[n - 1]);
    }
    var f = u * n;
    var k = Math.min(n - 2, Math.max(0, Math.floor(f)));
    var u0 = k / n;
    var u1 = (k + 1) / n;
    var span = u1 - u0;
    var t = span > 0 ? (u - u0) / span : 0;
    return s[k] + t * (s[k + 1] - s[k]);
}
function slLinearStepsFromPct(pct) {
    var p = Math.min(SL_PCT_SLIDER_MAX, Math.max(0, pct));
    var s = SL_SNAP_PCTS;
    var n = s.length;
    if (n < 2)
        return Math.round((p / SL_PCT_SLIDER_MAX) * LEVEL_SLIDER_STEPS);
    if (p >= s[n - 1]) {
        if (p >= SL_PCT_SLIDER_MAX)
            return LEVEL_SLIDER_STEPS;
        var uLastChip = (n - 1) / n;
        var tail = 1 - uLastChip;
        var denom = SL_PCT_SLIDER_MAX - s[n - 1];
        var t_2 = denom > 0 ? (p - s[n - 1]) / denom : 1;
        var u_1 = uLastChip + t_2 * tail;
        return Math.round(u_1 * LEVEL_SLIDER_STEPS);
    }
    var k = 0;
    while (k < n - 1 && s[k + 1] < p)
        k++;
    var lo = s[k];
    var hi = s[k + 1];
    var u0 = k / n;
    var u1 = (k + 1) / n;
    var span = hi - lo;
    var t = span > 0 ? (p - lo) / span : 0;
    var u = u0 + t * (u1 - u0);
    return Math.round(u * LEVEL_SLIDER_STEPS);
}
/**
 * Horizontal position where the range thumb *center* sits for `norm` in [0,1]
 * (thumb inset matches `.sigflo-level-slider` 20px width).
 */
function levelThumbAlignedStyle(norm, placement) {
    if (placement === void 0) { placement = 'label'; }
    var n = Math.min(1, Math.max(0, norm));
    var half = LEVEL_SLIDER_THUMB_PX / 2;
    var horizontal = {
        left: "calc(".concat(half, "px + (100% - ").concat(LEVEL_SLIDER_THUMB_PX, "px) * ").concat(n, ")"),
        transform: 'translateX(-50%)',
    };
    if (placement === 'tickBelow') {
        return __assign(__assign({ position: 'absolute' }, horizontal), { top: 'auto', bottom: 0, width: 1, height: 5, borderRadius: 9999, backgroundColor: 'rgba(168, 162, 154, 0.42)', boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.05)' });
    }
    return horizontal;
}
function tpChipLayoutNorm(chipIndex) {
    var n = TP_SNAP_PCTS.length;
    if (n <= 1)
        return 0;
    return chipIndex / n;
}
function tpPctFromLinearSteps(steps) {
    var _a;
    var u = Math.min(1, Math.max(0, steps / LEVEL_SLIDER_STEPS));
    var s = TP_SNAP_PCTS;
    var n = s.length;
    if (n < 2) {
        return u >= 1 ? TP_PCT_SLIDER_MAX : ((_a = s[0]) !== null && _a !== void 0 ? _a : TP_PCT_SLIDER_MIN);
    }
    var uLastChip = (n - 1) / n;
    if (u >= uLastChip) {
        if (u >= 1)
            return TP_PCT_SLIDER_MAX;
        var tail = 1 - uLastChip;
        var t_3 = tail > 0 ? (u - uLastChip) / tail : 1;
        return s[n - 1] + t_3 * (TP_PCT_SLIDER_MAX - s[n - 1]);
    }
    var f = u * n;
    var k = Math.min(n - 2, Math.max(0, Math.floor(f)));
    var u0 = k / n;
    var u1 = (k + 1) / n;
    var span = u1 - u0;
    var t = span > 0 ? (u - u0) / span : 0;
    return s[k] + t * (s[k + 1] - s[k]);
}
function tpLinearStepsFromPct(pct) {
    var p = Math.min(TP_PCT_SLIDER_MAX, Math.max(TP_PCT_SLIDER_MIN, pct));
    var s = TP_SNAP_PCTS;
    var n = s.length;
    if (n < 2) {
        var span = TP_PCT_SLIDER_MAX - TP_PCT_SLIDER_MIN;
        return Math.round(span > 0 ? ((p - TP_PCT_SLIDER_MIN) / span) * LEVEL_SLIDER_STEPS : 0);
    }
    if (p >= s[n - 1]) {
        if (p >= TP_PCT_SLIDER_MAX)
            return LEVEL_SLIDER_STEPS;
        var uLastChip = (n - 1) / n;
        var tail = 1 - uLastChip;
        var denom = TP_PCT_SLIDER_MAX - s[n - 1];
        var t_4 = denom > 0 ? (p - s[n - 1]) / denom : 1;
        var u_2 = uLastChip + t_4 * tail;
        return Math.round(u_2 * LEVEL_SLIDER_STEPS);
    }
    var k = 0;
    while (k < n - 1 && s[k + 1] < p)
        k++;
    var lo = s[k];
    var hi = s[k + 1];
    var u0 = k / n;
    var u1 = (k + 1) / n;
    var spanPct = hi - lo;
    var t = spanPct > 0 ? (p - lo) / spanPct : 0;
    var u = u0 + t * (u1 - u0);
    return Math.round(u * LEVEL_SLIDER_STEPS);
}
function distancePctToBps(pct) {
    return Math.round(pct * 100);
}
function takeProfitPriceFromBps(entry, tradeSide, bps) {
    var m = bps / 10000;
    return tradeSide === 'long' ? entry * (1 + m) : entry * (1 - m);
}
function stopPriceFromBps(entry, tradeSide, bps) {
    var m = bps / 10000;
    return tradeSide === 'long' ? entry * (1 - m) : entry * (1 + m);
}
function impliedTakeProfitBps(entry, tradeSide, tp) {
    if (!(entry > 0) || !Number.isFinite(tp))
        return null;
    var raw = tradeSide === 'long' ? ((tp - entry) / entry) * 10000 : ((entry - tp) / entry) * 10000;
    if (!Number.isFinite(raw))
        return null;
    return Math.round(raw);
}
function impliedStopBps(entry, tradeSide, stop) {
    if (!(entry > 0) || !Number.isFinite(stop))
        return null;
    var raw = tradeSide === 'long' ? ((entry - stop) / entry) * 10000 : ((stop - entry) / entry) * 10000;
    if (!Number.isFinite(raw))
        return null;
    return Math.round(raw);
}
function OrderInputsCard(props) {
    var _a, _b;
    var market = props.market, balanceUsd = props.balanceUsd, displayBalanceUsd = props.displayBalanceUsd, amountUsd = props.amountUsd, leverage = props.leverage, side = props.side, positionSizeUsd = props.positionSizeUsd, walletUsedPct = props.walletUsedPct, liquidationRisk = props.liquidationRisk, onAmountChange = props.onAmountChange, onLeverageChange = props.onLeverageChange, onSideChange = props.onSideChange, _c = props.lockSide, lockSide = _c === void 0 ? false : _c, _d = props.showSideToggle, showSideToggle = _d === void 0 ? false : _d, _e = props.panelTitle, panelTitle = _e === void 0 ? 'Position' : _e, _f = props.hideLiquidationFooter, hideLiquidationFooter = _f === void 0 ? false : _f, stopInput = props.stopInput, takeProfitInput = props.takeProfitInput, onStopInputChange = props.onStopInputChange, onTakeProfitInputChange = props.onTakeProfitInputChange, compactStats = props.compactStats, quoteLastPrice = props.quoteLastPrice, quoteMarkPrice = props.quoteMarkPrice, quoteIndexPrice = props.quoteIndexPrice, futuresTpSlTriggerBy = props.futuresTpSlTriggerBy, onFuturesTpSlTriggerByChange = props.onFuturesTpSlTriggerByChange, quotePair = props.quotePair, referenceEntryPrice = props.referenceEntryPrice, _g = props.balanceLabel, balanceLabel = _g === void 0 ? 'Wallet Balance' : _g, balanceHelper = props.balanceHelper, fundingBalanceUsd = props.fundingBalanceUsd, fundingBalanceAsset = props.fundingBalanceAsset, minOrderUsd = props.minOrderUsd, orderSymbol = props.orderSymbol, maxLeverage = props.maxLeverage, utaMarginInUseUsd = props.utaMarginInUseUsd, utaEquityUsd = props.utaEquityUsd, utaUnrealizedPnlUsd = props.utaUnrealizedPnlUsd, utaWalletBalanceUsd = props.utaWalletBalanceUsd, assetTransferHref = props.assetTransferHref, onPartialPositionScaleOut = props.onPartialPositionScaleOut, _h = props.partialPositionScaleOutBusy, partialPositionScaleOutBusy = _h === void 0 ? false : _h, _j = props.slTpEntryChip, slTpEntryChip = _j === void 0 ? 'entry' : _j;
    var entryBasisUi = slTpEntryChip === 'avg' ? 'avg' : 'entry';
    var entryChipLabel = slTpEntryChip === 'avg' ? 'Avg' : 'Entry';
    var balanceShown = displayBalanceUsd != null && Number.isFinite(displayBalanceUsd) ? displayBalanceUsd : balanceUsd;
    var amountMax = Math.max(0, Number.isFinite(balanceUsd) ? balanceUsd : 0);
    var amountInputStep = AMOUNT_INPUT_STEP_USD;
    var amountSliderIndexMax = computeAmountSliderIndexMax(amountMax);
    var amountSliderUiIndexRaw = amountUsdToSliderIndex(amountUsd, amountMax, amountSliderIndexMax);
    var amountSliderUiIndex = Number.isFinite(amountSliderUiIndexRaw)
        ? Math.min(amountSliderIndexMax, Math.max(0, Math.round(amountSliderUiIndexRaw)))
        : 0;
    var clampAmount = function (n) { return roundUsd(Math.max(0, Math.min(amountMax, Number.isFinite(n) ? n : 0))); };
    var amountUsdRef = (0, react_1.useRef)(amountUsd);
    amountUsdRef.current = amountUsd;
    var holdAmountUp = (0, useHoldStepper_1.useHoldStepper)(function () {
        onAmountChange(clampAmount(amountUsdRef.current + amountInputStep));
    });
    var holdAmountDown = (0, useHoldStepper_1.useHoldStepper)(function () {
        onAmountChange(clampAmount(amountUsdRef.current - amountInputStep));
    });
    var _k = (0, react_1.useState)(function () {
        if (stopInput != null && stopInput !== '') {
            var n = parseFloat(String(stopInput).replace(/,/g, ''));
            return Number.isFinite(n) && n > 0;
        }
        return false;
    }), slEnabled = _k[0], setSlEnabled = _k[1];
    var _l = (0, react_1.useState)(function () {
        if (takeProfitInput != null && takeProfitInput !== '') {
            var n = parseFloat(String(takeProfitInput).replace(/,/g, ''));
            return Number.isFinite(n) && n > 0;
        }
        return false;
    }), tpEnabled = _l[0], setTpEnabled = _l[1];
    var _m = (0, react_1.useState)('cross'), marginMode = _m[0], setMarginMode = _m[1];
    var _o = (0, react_1.useState)('entry'), slPercentBasis = _o[0], setSlPercentBasis = _o[1];
    var _p = (0, react_1.useState)('entry'), tpPercentBasis = _p[0], setTpPercentBasis = _p[1];
    (0, react_1.useEffect)(function () {
        if (market === 'spot') {
            setSlPercentBasis(function (b) { return (b === 'quote' ? 'last' : b); });
            setTpPercentBasis(function (b) { return (b === 'quote' ? 'last' : b); });
        }
        else {
            setSlPercentBasis(function (b) { return (b === 'last' ? 'quote' : b); });
            setTpPercentBasis(function (b) { return (b === 'last' ? 'quote' : b); });
        }
    }, [market]);
    (0, react_1.useEffect)(function () {
        if (stopInput != null && stopInput !== '') {
            var n = parseFloat(String(stopInput).replace(/,/g, ''));
            if (Number.isFinite(n) && n > 0)
                setSlEnabled(true);
        }
    }, [stopInput]);
    (0, react_1.useEffect)(function () {
        if (takeProfitInput != null && takeProfitInput !== '') {
            var n = parseFloat(String(takeProfitInput).replace(/,/g, ''));
            if (Number.isFinite(n) && n > 0)
                setTpEnabled(true);
        }
    }, [takeProfitInput]);
    var riskColor = liquidationRisk === 'High' ? 'text-rose-400' : liquidationRisk === 'Medium' ? 'text-amber-300' : 'text-emerald-400';
    var showLevels = Boolean(onStopInputChange && onTakeProfitInputChange && stopInput !== undefined && takeProfitInput !== undefined);
    var baseSymbol = (quotePair === null || quotePair === void 0 ? void 0 : quotePair.includes('/')) === true
        ? ((_a = quotePair.split('/')[0]) === null || _a === void 0 ? void 0 : _a.trim()) || '—'
        : (quotePair === null || quotePair === void 0 ? void 0 : quotePair.replace(/USDT$/i, '').trim()) || '—';
    var baseApprox = quoteLastPrice != null && quoteLastPrice > 0 && Number.isFinite(positionSizeUsd)
        ? positionSizeUsd / quoteLastPrice
        : null;
    var feePctOfNotional = positionSizeUsd > 0 && compactStats ? (compactStats.estFeeUsd / positionSizeUsd) * 100 : 0;
    var entry = referenceEntryPrice;
    var stopN = stopInput != null ? parseFloat(String(stopInput).replace(/,/g, '')) : NaN;
    var tpN = takeProfitInput != null ? parseFloat(String(takeProfitInput).replace(/,/g, '')) : NaN;
    var entryNum = entry != null && entry > 0 ? entry : null;
    var lastNum = quoteLastPrice != null && Number.isFinite(quoteLastPrice) && quoteLastPrice > 0 ? quoteLastPrice : null;
    var exchangeMarkNum = quoteMarkPrice != null && Number.isFinite(quoteMarkPrice) && quoteMarkPrice > 0 ? quoteMarkPrice : null;
    var exchangeIndexNum = quoteIndexPrice != null && Number.isFinite(quoteIndexPrice) && quoteIndexPrice > 0 ? quoteIndexPrice : null;
    var quoteNum = market === 'futures' ? coalesceFuturesQuotePx(lastNum, exchangeMarkNum, exchangeIndexNum) : null;
    var slReferencePrice = slPercentBasis === 'entry'
        ? entryNum
        : slPercentBasis === 'quote'
            ? quoteNum
            : lastNum;
    var tpReferencePrice = tpPercentBasis === 'entry'
        ? entryNum
        : tpPercentBasis === 'quote'
            ? quoteNum
            : lastNum;
    var hasQuoteContext = entryNum != null;
    var showSlPctPanel = Boolean(onStopInputChange) && hasQuoteContext;
    var showTpPctPanel = Boolean(onTakeProfitInputChange) && hasQuoteContext;
    var slPctSliderBlocked = slReferencePrice == null;
    var tpPctSliderBlocked = tpReferencePrice == null;
    var slAwaitingMsg = slTpAwaitingSliderCopy(slPercentBasis, slPctSliderBlocked, market);
    var tpAwaitingMsg = slTpAwaitingSliderCopy(tpPercentBasis, tpPctSliderBlocked, market);
    /** Same anchor as SL/TP sliders (entry vs live quote). */
    var stopPctHint = slReferencePrice != null &&
        slReferencePrice > 0 &&
        Number.isFinite(stopN) &&
        stopN > 0
        ? ((stopN - slReferencePrice) / slReferencePrice) * 100 * (side === 'long' ? 1 : -1)
        : null;
    var tpPctHint = tpReferencePrice != null &&
        tpReferencePrice > 0 &&
        Number.isFinite(tpN) &&
        tpN > 0
        ? ((tpN - tpReferencePrice) / tpReferencePrice) * 100 * (side === 'long' ? 1 : -1)
        : null;
    var tpBpsImpliedByBasis = tpReferencePrice != null ? impliedTakeProfitBps(tpReferencePrice, side, tpN) : null;
    var slBpsImpliedByBasis = slReferencePrice != null ? impliedStopBps(slReferencePrice, side, stopN) : null;
    var slSliderPct = slEnabled && slReferencePrice != null && slBpsImpliedByBasis != null
        ? Math.min(SL_PCT_SLIDER_MAX, Math.max(0, roundPctToStep(slBpsImpliedByBasis / 100, SL_PCT_STEP)))
        : 0;
    /** Reflect implied % with fine steps so live quote moves do not quantize to coarse presets (avoids 50%↔25% jumps). */
    var tpSliderPct = !tpEnabled || tpReferencePrice == null
        ? 100
        : tpBpsImpliedByBasis != null
            ? Math.min(TP_PCT_SLIDER_MAX, Math.max(TP_PCT_SLIDER_MIN, roundPctToStep(tpBpsImpliedByBasis / 100, TP_PCT_REFLECT_STEP)))
            : 100;
    var slSliderLinearSteps = (0, react_1.useMemo)(function () { return (slEnabled ? slLinearStepsFromPct(slSliderPct) : 0); }, [slEnabled, slSliderPct]);
    var tpSliderLinearSteps = (0, react_1.useMemo)(function () { return (tpEnabled ? tpLinearStepsFromPct(tpSliderPct) : tpLinearStepsFromPct(100)); }, [tpEnabled, tpSliderPct]);
    var levMax = market === 'futures'
        ? Math.max(1, Math.min(200, Math.floor(maxLeverage != null && Number.isFinite(maxLeverage) && maxLeverage > 0 ? maxLeverage : 200)))
        : 1;
    var leverageChipLevels = (0, react_1.useMemo)(function () {
        var preset = [2, 5, 10, 25, 50, 100, 200].filter(function (x) { return x <= levMax; });
        if (levMax > 1 && !preset.includes(levMax)) {
            return __spreadArray(__spreadArray([], preset, true), [levMax], false).sort(function (a, b) { return a - b; });
        }
        return preset;
    }, [levMax]);
    var symbolLabel = ((_b = orderSymbol !== null && orderSymbol !== void 0 ? orderSymbol : quotePair) !== null && _b !== void 0 ? _b : 'selected market').toUpperCase();
    var minOrderOk = minOrderUsd != null && Number.isFinite(minOrderUsd) && minOrderUsd > 0;
    var enteredAmountValid = Number.isFinite(amountUsd) && amountUsd > 0;
    var amountTooSmall = minOrderOk && enteredAmountValid && amountUsd < minOrderUsd;
    /** Cent compare: 100% chip can land on rounded cap while float `amountMax` differs slightly. */
    var amountTooLarge = enteredAmountValid &&
        amountMax > 0 &&
        Math.round(amountUsd * 100) > Math.round(amountMax * 100);
    var balanceTooLowForMinimum = minOrderOk && amountMax > 0 && amountMax < minOrderUsd;
    var sizeValidationMessage = amountMax <= 0
        ? 'Insufficient available balance'
        : balanceTooLowForMinimum
            ? 'Insufficient available balance'
            : amountTooLarge
                ? 'Insufficient available balance'
                : amountTooSmall
                    ? "Minimum order for ".concat(symbolLabel, " is ").concat(fmtUsd2(minOrderUsd))
                    : null;
    var showUtaBreakdown = Boolean(balanceHelper);
    var showFundingWallet = fundingBalanceUsd != null && Number.isFinite(fundingBalanceUsd) && fundingBalanceUsd >= 0;
    var transferBtnClassName = 'shrink-0 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.1em] text-sigflo-muted/85 transition hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-sigflo-text/75';
    var _q = (0, react_1.useState)(false), transferModalOpen = _q[0], setTransferModalOpen = _q[1];
    (0, react_1.useEffect)(function () {
        if (!transferModalOpen)
            return;
        var onKey = function (e) {
            if (e.key === 'Escape')
                setTransferModalOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return function () { return window.removeEventListener('keydown', onKey); };
    }, [transferModalOpen]);
    return (<div className="rounded-2xl border border-white/[0.1] bg-gradient-to-b from-white/[0.04] to-sigflo-surface/95 p-3 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)] backdrop-blur-sm space-y-3">
      <div className="flex items-start justify-between gap-2 text-xs text-sigflo-muted">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="text-sm font-bold text-white">{panelTitle}</span>
          {assetTransferHref && !showFundingWallet ? (<button type="button" title="Move funds on Bybit (Funding ↔ Unified)" onClick={function () { return setTransferModalOpen(true); }} className={transferBtnClassName}>
              Transfer
            </button>) : null}
        </div>
        <span className="shrink-0 max-w-[min(100%,18rem)] text-right">
          {showUtaBreakdown ? (<>
              <div className={"grid w-full max-w-md justify-end gap-1.5 sm:ml-auto ".concat(utaEquityUsd != null && Number.isFinite(utaEquityUsd) ? 'sm:grid-cols-3' : 'sm:grid-cols-2', " grid-cols-1")}>
                <div className="min-w-0 rounded-lg border border-white/[0.1] bg-black/25 px-2 py-1.5 text-left" title="Collateral available for new orders in your Bybit unified trading account">
                  <span className="block text-[8px] font-semibold uppercase tracking-[0.12em] text-sigflo-muted">
                    Available (UTA)
                  </span>
                  <span className="block tabular-nums text-[11px] text-sigflo-text">{fmtUsd2(balanceShown)}</span>
                  <span className="block text-[8px] leading-tight text-sigflo-muted/80">For new orders</span>
                </div>
                <div className="min-w-0 rounded-lg border border-white/[0.1] bg-black/25 px-2 py-1.5 text-left" title="Margin and collateral reserved for open exchange positions and working orders">
                  <span className="block text-[8px] font-semibold uppercase tracking-[0.12em] text-sigflo-muted">Margin in use</span>
                  <span className="block tabular-nums text-[11px] text-white/90">
                    {utaMarginInUseUsd != null && Number.isFinite(utaMarginInUseUsd) ? fmtUsd2(utaMarginInUseUsd) : '—'}
                  </span>
                  <span className="block text-[8px] leading-tight text-sigflo-muted/80">Exchange positions</span>
                </div>
                {utaEquityUsd != null && Number.isFinite(utaEquityUsd) ? (<div className="min-w-0 rounded-lg border border-white/[0.1] bg-black/25 px-2 py-1.5 text-left" title="Total UTA equity per Bybit (includes unrealized PnL on real positions)">
                    <span className="block text-[8px] font-semibold uppercase tracking-[0.12em] text-sigflo-muted">Equity (UTA)</span>
                    <span className="block tabular-nums text-[11px] text-cyan-200/95">{fmtUsd2(utaEquityUsd)}</span>
                    <span className="block text-[8px] leading-tight text-sigflo-muted/80">Incl. unrealized (Bybit)</span>
                  </div>) : null}
              </div>
              {utaUnrealizedPnlUsd != null && Number.isFinite(utaUnrealizedPnlUsd) ? (<span className="mt-1 block text-right text-[9px] tabular-nums text-sigflo-muted/85">
                  Unrealized PnL on exchange:{' '}
                  <span className={utaUnrealizedPnlUsd >= 0 ? 'text-emerald-200/90' : 'text-rose-200/90'}>
                    {utaUnrealizedPnlUsd >= 0 ? '+' : '−'}
                    {fmtUsd2(Math.abs(utaUnrealizedPnlUsd))}
                  </span>
                </span>) : null}
              {utaWalletBalanceUsd != null &&
                Number.isFinite(utaWalletBalanceUsd) &&
                (utaEquityUsd == null ||
                    !Number.isFinite(utaEquityUsd) ||
                    Math.abs(utaWalletBalanceUsd - utaEquityUsd) > 0.02) ? (<span className="mt-0.5 block text-right text-[9px] tabular-nums text-sigflo-muted/75">
                  Wallet balance (UTA, Bybit): {fmtUsd2(utaWalletBalanceUsd)}
                </span>) : null}
              <span className="mt-1 block text-[9px] text-sigflo-muted/80">{balanceHelper}</span>
            </>) : (<>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-sigflo-muted/90">{balanceLabel}</span>
              <span className="block tabular-nums text-[11px] text-sigflo-text">{money(balanceShown)}</span>
              {balanceHelper ? <span className="block text-[9px] text-sigflo-muted/80">{balanceHelper}</span> : null}
            </>)}
          {showFundingWallet ? (<div className="mt-2 border-t border-white/[0.06] pt-2">
              <div className="flex w-full min-w-0 items-center justify-end gap-2">
                {assetTransferHref ? (<button type="button" title="Move funds on Bybit (Funding ↔ Unified)" onClick={function () { return setTransferModalOpen(true); }} className={"relative z-[1] -translate-x-6 ".concat(transferBtnClassName)}>
                    Transfer
                  </button>) : null}
                <span className="text-right text-[9px] font-semibold uppercase tracking-[0.08em] text-sigflo-muted/90">
                  Funding wallet
                </span>
              </div>
              <span className="mt-0.5 block tabular-nums text-[10px] text-sigflo-muted">
                {(0, formatFundingBalance_1.formatFundingBalance)(fundingBalanceUsd, fundingBalanceAsset)}
              </span>
              <span className="mt-0.5 block max-w-[11rem] text-[8px] leading-tight text-sigflo-muted/75 sm:max-w-none" title="Separate deposit wallet — not included in Available / In use above until you transfer to UTA">
                Not in unified trading — use Transfer to move funds to UTA for orders
              </span>
            </div>) : null}
        </span>
      </div>

      <label className="block space-y-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sigflo-muted">Amount (USD)</span>
        <div className="group relative">
          <input type="number" min={0} max={amountMax} step={amountInputStep} value={amountUsd || ''} onChange={function (e) {
            var n = Number(e.target.value || 0);
            onAmountChange(clampAmount(n));
        }} className="sigflo-number-input w-full rounded-xl border border-white/[0.08] bg-black/35 px-3 py-2.5 pr-11 text-sm text-white outline-none ring-sigflo-accent/30 placeholder:text-sigflo-muted focus:ring" placeholder="0"/>
          <div className="absolute inset-y-1.5 right-1 flex w-7 flex-col gap-1">
            <button type="button" className="flex h-1/2 select-none items-center justify-center rounded border border-white/[0.08] bg-white/[0.06] text-[9px] leading-none text-sigflo-text transition hover:bg-white/[0.12]" aria-label="Increase amount" {...holdAmountUp}>
              +
            </button>
            <button type="button" className="flex h-1/2 select-none items-center justify-center rounded border border-white/[0.08] bg-white/[0.06] text-[9px] leading-none text-sigflo-text transition hover:bg-white/[0.12]" aria-label="Decrease amount" {...holdAmountDown}>
              −
            </button>
          </div>
        </div>
        {baseApprox != null ? (<p className="text-[11px] tabular-nums text-sigflo-muted">
            ≈ {(0, formatQuote_1.formatQuoteNumber)(baseApprox)} {baseSymbol}
          </p>) : null}
        {sizeValidationMessage ? (<p className="text-[10px] font-medium text-amber-200/90">{sizeValidationMessage}</p>) : minOrderOk ? (<p className="text-[10px] text-sigflo-muted/85">
            Minimum order for {symbolLabel}: {fmtUsd2(minOrderUsd)}
          </p>) : null}
      </label>

      <div className="space-y-1.5">
        <input type="range" min={0} max={amountSliderIndexMax} step={1} value={amountSliderUiIndex} onChange={function (e) {
            var v = Number(e.target.value);
            if (!Number.isFinite(v))
                return;
            onAmountChange(clampAmount(sliderIndexToAmountUsd(v, amountMax, amountSliderIndexMax)));
        }} className="w-full accent-[#00ffc8]" aria-label="Amount slider"/>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {[
            { id: '10', label: '10%', v: 0.1 },
            { id: '25', label: '25%', v: 0.25 },
            { id: '50', label: '50%', v: 0.5 },
            { id: '100', label: '100%', v: 1 },
        ].map(function (chip) {
            var target = roundUsd(amountMax * chip.v);
            var active = amountMax > 0 &&
                Math.abs(amountUsd - target) < Math.max(0.01, Math.min(1, amountMax * 0.02));
            return (<button key={chip.id} type="button" onClick={function () { return onAmountChange(target); }} className={"rounded-lg border px-2.5 py-1 text-[10px] font-bold transition ".concat(active
                    ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-200 ring-1 ring-emerald-400/25'
                    : 'border-white/[0.08] bg-white/[0.04] text-sigflo-muted hover:border-sigflo-accent/25 hover:bg-sigflo-accent/10 hover:text-sigflo-text')}>
                {chip.label}
              </button>);
        })}
        </div>
      </div>

      {market === 'futures' ? (<div className="space-y-2">
          <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-black/20 px-2 py-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-sigflo-muted">Margin</span>
            <div className="flex rounded-lg bg-black/40 p-0.5">
              {['cross', 'isolated'].map(function (m) { return (<button key={m} type="button" onClick={function () { return setMarginMode(m); }} className={"rounded-md px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide transition ".concat(marginMode === m ? 'bg-[#00ffc8]/20 text-[#00ffc8] ring-1 ring-[#00ffc8]/30' : 'text-sigflo-muted')}>
                  {m === 'cross' ? 'Cross' : 'Isolated'}
                </button>); })}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-sigflo-muted">Leverage</span>
            <span className="text-sm font-bold tabular-nums text-white">{Math.min(leverage, levMax)}x</span>
          </div>
          <div className="flex justify-between text-[9px] tabular-nums text-sigflo-muted">
            <span>1x</span>
            <span>{levMax}x</span>
          </div>
          <input type="range" min={1} max={levMax} step={1} value={Math.min(leverage, levMax)} onChange={function (e) { return onLeverageChange(Number(e.target.value)); }} className="w-full accent-[#00ffc8]"/>
          <div className="flex flex-wrap justify-end gap-1">
            {leverageChipLevels.map(function (x) { return (<button key={x} type="button" onClick={function () { return onLeverageChange(Math.min(x, levMax)); }} className={"rounded-lg border px-2 py-0.5 text-[9px] font-bold tabular-nums transition ".concat(leverage === x
                    ? 'border-[#00ffc8]/50 bg-[#00ffc8]/15 text-[#00ffc8]'
                    : 'border-white/[0.08] bg-white/[0.04] text-sigflo-muted hover:border-[#00ffc8]/25 hover:text-sigflo-text')}>
                {x}x
              </button>); })}
          </div>
        </div>) : (<p className="rounded-lg border border-white/[0.06] bg-black/25 px-2.5 py-1.5 text-center text-[10px] font-semibold text-sigflo-muted">Spot · no leverage</p>)}

      {showLevels ? (<div className="space-y-2">
          {market === 'futures' &&
                bybitTpSlTrigger_1.BYBIT_TPSL_TRIGGER_VALUES.length > 1 &&
                futuresTpSlTriggerBy != null &&
                onFuturesTpSlTriggerByChange ? (<div className="rounded-xl border border-white/[0.08] bg-black/30 px-2.5 py-2 ring-1 ring-white/[0.04]">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-sigflo-muted">TP / SL trigger</p>
              <p className="mt-0.5 text-[8px] leading-snug text-sigflo-muted/80">
                Bybit: which price crosses your levels first (same as MEXC Last / Fair / Index).
              </p>
              <div className="mt-1.5 inline-flex flex-wrap rounded-md border border-white/[0.08] bg-black/35 p-0.5">
                {bybitTpSlTrigger_1.BYBIT_TPSL_TRIGGER_VALUES.map(function (t) {
                    var active = futuresTpSlTriggerBy === t;
                    return (<button key={t} type="button" onClick={function () { return onFuturesTpSlTriggerByChange(t); }} className={"rounded px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] transition ".concat(active
                            ? 'bg-cyan-500/18 text-cyan-100 ring-1 ring-cyan-400/30'
                            : 'text-sigflo-muted hover:text-sigflo-text')} title={t === 'MarkPrice' ? 'Mark / fair price' : t === 'LastPrice' ? 'Last traded price' : 'Index price'}>
                      {(0, bybitTpSlTrigger_1.bybitTpSlTriggerShortLabel)(t)}
                    </button>);
                })}
              </div>
            </div>) : null}
          <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sigflo-muted">Stop loss</span>
              <button type="button" role="switch" aria-checked={slEnabled} onClick={function () {
                setSlEnabled(function (v) {
                    var next = !v;
                    if (!next)
                        onStopInputChange === null || onStopInputChange === void 0 ? void 0 : onStopInputChange('');
                    return next;
                });
            }} className={"relative h-6 w-10 shrink-0 rounded-full transition-colors ".concat(slEnabled ? 'bg-rose-500/35 ring-1 ring-rose-400/35' : 'bg-white/[0.08]')}>
                <span className={"absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ".concat(slEnabled ? 'translate-x-4' : 'translate-x-0')}/>
              </button>
            </div>
            <input type="text" inputMode="decimal" value={stopInput} disabled={!slEnabled} onChange={function (e) { return onStopInputChange === null || onStopInputChange === void 0 ? void 0 : onStopInputChange(e.target.value); }} className="w-full rounded-xl border border-white/[0.08] bg-black/35 px-2.5 py-2 text-xs text-white outline-none ring-rose-400/20 focus:ring disabled:cursor-not-allowed disabled:opacity-45" placeholder="USDT" aria-label="Stop loss price"/>
            {showSlPctPanel ? (<div className="mt-1.5 space-y-1.5 rounded-xl border border-white/[0.07] bg-black/35 px-2.5 py-2 ring-1 ring-white/[0.04]">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1">
                    <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-sigflo-muted">
                      % from {pctBasisHeaderText(slPercentBasis, entryBasisUi)} (adverse)
                    </span>
                    <div className="inline-flex flex-wrap rounded-md border border-white/[0.08] bg-black/30 p-0.5">
                      {(market === 'futures' ? FUTURES_SL_TP_PCT_BASES : SPOT_SL_TP_PCT_BASES).map(function (basis) {
                    var active = slPercentBasis === basis;
                    return (<button key={basis} type="button" onClick={function () { return setSlPercentBasis(basis); }} className={"rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] transition ".concat(active
                            ? 'bg-cyan-500/18 text-cyan-100 ring-1 ring-cyan-400/30'
                            : 'text-sigflo-muted hover:text-sigflo-text')} title={pctBasisTooltip(basis, market, slTpEntryChip)}>
                            {pctBasisChipText(basis, entryChipLabel)}
                          </button>);
                })}
                    </div>
                  </div>
                  <span className={"text-[12px] font-bold tabular-nums ".concat(slEnabled ? 'text-rose-200' : 'text-sigflo-muted')}>
                    {slEnabled ? "\u2212".concat(fmtPctCompact(slSliderPct), "%") : '—'}
                  </span>
                </div>
                {entryNum != null ? (<p className="text-[7px] font-mono tabular-nums leading-tight text-sigflo-muted/85">
                    {slTpEntryChip === 'avg' ? 'Avg' : 'Entry'} ${(0, formatQuote_1.formatQuoteNumber)(entryNum)}
                  </p>) : null}
                {slAwaitingMsg ? (<p className="text-[7px] leading-snug text-amber-200/85">{slAwaitingMsg}</p>) : null}
                <div className="relative w-full">
                  <input type="range" min={0} max={LEVEL_SLIDER_STEPS} step={1} disabled={!slEnabled || slReferencePrice == null} value={slSliderLinearSteps} aria-label={"Stop loss percent from ".concat(pctBasisHeaderText(slPercentBasis, entryBasisUi), " on adverse side")} onChange={function (e) {
                    var rawPct = slPctFromLinearSteps(Number(e.target.value));
                    var pct = Math.min(SL_PCT_SLIDER_MAX, Math.max(0, roundPctToStep(rawPct, SL_PCT_STEP)));
                    if (slReferencePrice == null || !onStopInputChange)
                        return;
                    setSlEnabled(true);
                    onStopInputChange((0, formatQuote_1.formatQuoteNumber)(stopPriceFromBps(slReferencePrice, side, distancePctToBps(pct))));
                }} className="sigflo-level-slider sigflo-level-slider--rose relative z-[1] w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"/>
                  <div className="pointer-events-none relative mt-px h-1.5 w-full shrink-0" aria-hidden>
                    {SL_SNAP_PCTS.map(function (pct, i) {
                    var norm = slChipLayoutNorm(i);
                    return (<span key={"sl-tick-".concat(pct)} className="pointer-events-none" style={levelThumbAlignedStyle(norm, 'tickBelow')}/>);
                })}
                  </div>
                  <div className="relative z-[1] mt-1 h-5 w-full">
                    {SL_SNAP_PCTS.map(function (pct, i) {
                    var on = slEnabled && slSliderPct === pct;
                    var norm = slChipLayoutNorm(i);
                    return (<button key={"sl-m-".concat(pct)} type="button" disabled={slReferencePrice == null} onClick={function () {
                            if (slReferencePrice == null || !onStopInputChange)
                                return;
                            setSlEnabled(true);
                            onStopInputChange((0, formatQuote_1.formatQuoteNumber)(stopPriceFromBps(slReferencePrice, side, distancePctToBps(pct))));
                        }} title={"".concat(pct, "% adverse")} style={levelThumbAlignedStyle(norm)} className={"absolute top-0 max-w-[2.25rem] truncate text-center text-[6.5px] font-bold tabular-nums leading-none transition sm:text-[7px] ".concat(on ? 'text-rose-200' : 'text-sigflo-muted/75 hover:text-rose-100/90', " disabled:pointer-events-none disabled:opacity-35")}>
                          {pct}%
                        </button>);
                })}
                  </div>
                </div>
                <div className="flex justify-between text-[8px] font-medium tabular-nums text-sigflo-muted/75">
                  <span>
                    0% ({pctBasisHeaderText(slPercentBasis, entryBasisUi)})
                  </span>
                  <span>{SL_PCT_SLIDER_MAX}% max</span>
                </div>
              </div>) : stopPctHint != null && Number.isFinite(stopPctHint) ? (<p className={"mt-1 text-[9px] font-semibold tabular-nums leading-none ".concat(stopPctHint <= 0 ? 'text-rose-300' : 'text-sigflo-muted')}>
                {stopPctHint >= 0 ? '+' : ''}
                {stopPctHint.toFixed(2)}%
              </p>) : null}
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sigflo-muted">Take profit</span>
              <button type="button" role="switch" aria-checked={tpEnabled} onClick={function () {
                setTpEnabled(function (v) {
                    var next = !v;
                    if (!next)
                        onTakeProfitInputChange === null || onTakeProfitInputChange === void 0 ? void 0 : onTakeProfitInputChange('');
                    return next;
                });
            }} className={"relative h-6 w-10 shrink-0 rounded-full transition-colors ".concat(tpEnabled ? 'bg-emerald-500/35 ring-1 ring-emerald-400/35' : 'bg-white/[0.08]')}>
                <span className={"absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ".concat(tpEnabled ? 'translate-x-4' : 'translate-x-0')}/>
              </button>
            </div>
            <input type="text" inputMode="decimal" value={takeProfitInput} disabled={!tpEnabled} onChange={function (e) { return onTakeProfitInputChange === null || onTakeProfitInputChange === void 0 ? void 0 : onTakeProfitInputChange(e.target.value); }} className="w-full rounded-xl border border-white/[0.08] bg-black/35 px-2.5 py-2 text-xs text-white outline-none ring-emerald-400/20 focus:ring disabled:cursor-not-allowed disabled:opacity-45" placeholder="USDT" aria-label="Take profit price"/>
            {showTpPctPanel ? (<div className="mt-1.5 space-y-1.5 rounded-xl border border-white/[0.07] bg-black/35 px-2.5 py-2 ring-1 ring-white/[0.04]">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1">
                    <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-sigflo-muted">
                      % from {pctBasisHeaderText(tpPercentBasis, entryBasisUi)} (favorable)
                    </span>
                    <div className="inline-flex flex-wrap rounded-md border border-white/[0.08] bg-black/30 p-0.5">
                      {(market === 'futures' ? FUTURES_SL_TP_PCT_BASES : SPOT_SL_TP_PCT_BASES).map(function (basis) {
                    var active = tpPercentBasis === basis;
                    return (<button key={basis} type="button" onClick={function () { return setTpPercentBasis(basis); }} className={"rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] transition ".concat(active
                            ? 'bg-cyan-500/18 text-cyan-100 ring-1 ring-cyan-400/30'
                            : 'text-sigflo-muted hover:text-sigflo-text')} title={pctBasisTooltip(basis, market, slTpEntryChip)}>
                            {pctBasisChipText(basis, entryChipLabel)}
                          </button>);
                })}
                    </div>
                  </div>
                  <span className={"text-[12px] font-bold tabular-nums ".concat(tpEnabled ? 'text-emerald-200' : 'text-sigflo-muted')}>
                    {tpEnabled ? "+".concat(fmtPctCompact(tpSliderPct), "%") : '—'}
                  </span>
                </div>
                {entryNum != null ? (<p className="text-[7px] font-mono tabular-nums leading-tight text-sigflo-muted/85">
                    {slTpEntryChip === 'avg' ? 'Avg' : 'Entry'} ${(0, formatQuote_1.formatQuoteNumber)(entryNum)}
                  </p>) : null}
                {tpAwaitingMsg ? (<p className="text-[7px] leading-snug text-amber-200/85">{tpAwaitingMsg}</p>) : null}
                <div className="relative w-full">
                  <input type="range" min={0} max={LEVEL_SLIDER_STEPS} step={1} disabled={!tpEnabled || tpReferencePrice == null} value={tpSliderLinearSteps} aria-label={"Take profit percent from ".concat(pctBasisHeaderText(tpPercentBasis, entryBasisUi), " on favorable side")} onChange={function (e) {
                    var rawPct = tpPctFromLinearSteps(Number(e.target.value));
                    var pct = nearestSnapPct(rawPct, TP_SNAP_PCTS);
                    if (tpReferencePrice == null || !onTakeProfitInputChange)
                        return;
                    setTpEnabled(true);
                    onTakeProfitInputChange((0, formatQuote_1.formatQuoteNumber)(takeProfitPriceFromBps(tpReferencePrice, side, distancePctToBps(pct))));
                }} className="sigflo-level-slider sigflo-level-slider--emerald relative z-[1] w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"/>
                  <div className="pointer-events-none relative mt-px h-1.5 w-full shrink-0" aria-hidden>
                    {TP_SNAP_PCTS.map(function (pct, i) {
                    var norm = tpChipLayoutNorm(i);
                    return (<span key={"tp-tick-".concat(pct)} className="pointer-events-none" style={levelThumbAlignedStyle(norm, 'tickBelow')}/>);
                })}
                  </div>
                  <div className="relative z-[1] mt-1 h-5 w-full">
                    {TP_SNAP_PCTS.map(function (pct, i) {
                    var on = tpEnabled && tpSliderPct === pct;
                    var norm = tpChipLayoutNorm(i);
                    return (<button key={"tp-m-".concat(pct)} type="button" disabled={tpReferencePrice == null} onClick={function () {
                            if (tpReferencePrice == null || !onTakeProfitInputChange)
                                return;
                            setTpEnabled(true);
                            onTakeProfitInputChange((0, formatQuote_1.formatQuoteNumber)(takeProfitPriceFromBps(tpReferencePrice, side, distancePctToBps(pct))));
                        }} title={"".concat(pct, "% favorable")} style={levelThumbAlignedStyle(norm)} className={"absolute top-0 max-w-[2.25rem] truncate text-center text-[6.5px] font-bold tabular-nums leading-none transition sm:text-[7px] ".concat(on ? 'text-emerald-200' : 'text-sigflo-muted/75 hover:text-emerald-100/90', " disabled:pointer-events-none disabled:opacity-35")}>
                          {pct}%
                        </button>);
                })}
                  </div>
                </div>
                <div className="flex justify-between text-[8px] font-medium tabular-nums text-sigflo-muted/75">
                  <span>
                    {TP_PCT_SLIDER_MIN}% ({pctBasisHeaderText(tpPercentBasis, entryBasisUi)})
                  </span>
                  <span>{TP_PCT_SLIDER_MAX}%</span>
                </div>
              </div>) : tpPctHint != null && Number.isFinite(tpPctHint) ? (<p className={"mt-1 text-[9px] font-semibold tabular-nums leading-none ".concat(tpPctHint >= 0 ? 'text-emerald-300' : 'text-rose-300')}>
                {tpPctHint >= 0 ? '+' : ''}
                {tpPctHint.toFixed(2)}%
              </p>) : null}
            {onPartialPositionScaleOut ? (<div className="mt-2 space-y-1 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-2 py-2 ring-1 ring-emerald-400/10" role="group" aria-label="Partial take profit — scale out a fraction of the open exchange position">
                <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-emerald-200/85">
                  Partial take profit
                </p>
                <div className="grid grid-cols-3 gap-1">
                  {PARTIAL_POSITION_TP_PCTS.map(function (pct) { return (<button key={pct} type="button" disabled={partialPositionScaleOutBusy} onClick={function () { return onPartialPositionScaleOut(pct / 100); }} aria-label={"Scale out ".concat(pct, " percent of open position")} className="flex min-h-[32px] items-center justify-center rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-1 text-center text-[10px] font-bold tabular-nums text-emerald-50 transition hover:border-emerald-300/50 hover:bg-emerald-500/25 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45">
                      {pct}%
                    </button>); })}
                </div>
                <p className="text-[8px] leading-snug text-sigflo-muted/90">
                  Same execution as the chart dock partial close.
                </p>
              </div>) : null}
          </div>
        </div>
        </div>) : null}

      {compactStats ? (<div className="grid grid-cols-2 gap-2 rounded-xl border border-white/[0.08] bg-black/30 p-2 sm:grid-cols-4">
          <div>
            <p className="text-[8px] font-semibold uppercase tracking-wider text-sigflo-muted">Margin</p>
            <p className="mt-0.5 text-[11px] font-bold tabular-nums text-white">{moneyTight(compactStats.marginUsd)}</p>
          </div>
          <div>
            <p className="text-[8px] font-semibold uppercase tracking-wider text-sigflo-muted">Est. fee</p>
            <p className="mt-0.5 text-[11px] font-bold tabular-nums text-white">
              {moneyTight(compactStats.estFeeUsd)}
              {feePctOfNotional > 0 ? (<span className="block text-[9px] font-normal text-sigflo-muted">({feePctOfNotional.toFixed(2)}%)</span>) : null}
            </p>
          </div>
          <div className={compactStats.liquidationPrice != null
                ? 'rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-1.5 py-1 ring-1 ring-amber-400/10'
                : ''}>
            <p className="text-[8px] font-semibold uppercase tracking-wider text-sigflo-muted">Liquidation</p>
            <p className="mt-0.5 text-[11px] font-bold tabular-nums text-amber-200">
              {compactStats.liquidationPrice != null ? "$".concat((0, formatQuote_1.formatQuoteNumber)(compactStats.liquidationPrice)) : '—'}
            </p>
          </div>
          <div>
            <p className="text-[8px] font-semibold uppercase tracking-wider text-sigflo-muted">Risk level</p>
            {compactStats.riskLevel != null && compactStats.riskMeterPct != null ? (<>
                <p className={"mt-0.5 text-[11px] font-bold ".concat(riskColor)}>{compactStats.riskLevel}</p>
                <RiskSegmentMeter_1.RiskSegmentMeter pct={compactStats.riskMeterPct} level={compactStats.riskLevel}/>
              </>) : (<p className={"mt-0.5 text-[11px] font-bold ".concat(riskColor)}>{liquidationRisk}</p>)}
          </div>
        </div>) : null}

      {lockSide ? (<div className="flex justify-center pt-0.5">
          <span className={"rounded-xl px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider ".concat(side === 'long' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300')}>
            {side === 'long' ? 'LONG' : 'SHORT'} · open leg
          </span>
        </div>) : showSideToggle ? (<div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={function () { return onSideChange('long'); }} className={"rounded-xl py-2.5 text-sm font-bold transition ".concat(side === 'long' ? 'bg-sigflo-accent text-sigflo-bg' : 'border border-white/[0.08] text-sigflo-text')}>
            {market === 'spot' ? 'Buy' : 'Open Long'}
          </button>
          <button type="button" onClick={function () { return onSideChange('short'); }} className={"rounded-xl py-2.5 text-sm font-bold transition ".concat(side === 'short' ? 'bg-rose-500 text-white' : 'border border-white/[0.08] text-sigflo-text')}>
            {market === 'spot' ? 'Sell' : 'Open Short'}
          </button>
        </div>) : null}

      <div className="flex items-center justify-between border-t border-white/[0.06] pt-2 text-[10px]">
        <span className="text-sigflo-muted">
          {money(positionSizeUsd)} · {walletUsedPct.toFixed(1)}% of wallet
        </span>
        {hideLiquidationFooter || (compactStats === null || compactStats === void 0 ? void 0 : compactStats.riskMeterPct) != null ? null : (<span className={"font-semibold ".concat(riskColor)}>Liq risk: {liquidationRisk}</span>)}
      </div>

      {assetTransferHref && transferModalOpen ? (<div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 cursor-default border-0 bg-black/75 p-0 backdrop-blur-[1px]" aria-label="Close" onClick={function () { return setTransferModalOpen(false); }}/>
          <div role="dialog" aria-modal="true" aria-labelledby="transfer-dialog-title" className="relative z-[1] w-full max-w-sm rounded-xl border border-white/[0.12] bg-[#0a0a0c] p-4 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.95)]" onClick={function (e) { return e.stopPropagation(); }}>
            <p id="transfer-dialog-title" className="text-sm font-bold text-white">
              Transfer on Bybit
            </p>
            <p className="mt-2 text-[11px] leading-snug text-sigflo-muted">
              Sigflo cannot move funds for you. On Bybit, use <span className="font-semibold text-sigflo-text/90">Transfer</span>{' '}
              between <span className="text-sigflo-text/90">Funding</span> and your{' '}
              <span className="text-sigflo-text/90">Unified Trading Account</span>.
            </p>
            <p className="mt-2 text-[10px] leading-snug text-sigflo-muted/90">
              If Bybit opens the chart instead, use the menu → <span className="text-white/85">Assets</span> →{' '}
              <span className="text-white/85">Transfer</span>.
            </p>
            <p className="mt-2 text-[9px] leading-snug text-sigflo-muted/80">
              Links go straight to Bybit’s site — Sigflo can’t pass your login through (and never sees your Bybit
              password). You’ll only skip sign-in if{' '}
              <span className="text-sigflo-muted">this same browser</span> already has an active Bybit web session.
              In-app or embedded browsers often use a separate cookie store; open the link in Chrome/Edge/Safari if
              Bybit asks you to log in again.
            </p>
            <p className="mt-1.5 text-[9px] leading-snug text-sigflo-muted/75">
              Bybit changes routes often; if one link 404s, try the other. Help always loads.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <a href={exchangeTransferUrls_1.BYBIT_APP_ASSETS_HOME_HREF} target="_blank" rel="noopener noreferrer" className="flex min-h-[44px] items-center justify-center rounded-lg bg-[#00ffc8]/15 text-center text-[12px] font-bold text-[#00ffc8] ring-1 ring-[#00ffc8]/35 transition hover:bg-[#00ffc8]/22">
                Open Assets (Bybit app)
              </a>
              <a href={exchangeTransferUrls_1.BYBIT_USER_ASSETS_EXCHANGE_HREF} target="_blank" rel="noopener noreferrer" className="flex min-h-[40px] items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.04] text-center text-[11px] font-semibold text-sigflo-text transition hover:bg-white/[0.07]">
                Alternate assets page
              </a>
              <a href={exchangeTransferUrls_1.BYBIT_TRANSFER_HELP_HREF} target="_blank" rel="noopener noreferrer" className="text-center text-[11px] font-semibold text-sigflo-muted underline decoration-white/20 underline-offset-2 hover:text-white/85">
                How to transfer (Bybit Help — always works)
              </a>
            </div>
            <button type="button" onClick={function () { return setTransferModalOpen(false); }} className="mt-4 w-full rounded-lg border border-white/[0.08] py-2 text-[11px] font-semibold text-sigflo-muted transition hover:bg-white/[0.04] hover:text-white">
              Close
            </button>
          </div>
        </div>) : null}
    </div>);
}
