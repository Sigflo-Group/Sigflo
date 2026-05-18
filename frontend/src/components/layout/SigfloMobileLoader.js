"use strict";
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
exports.SIGFLO_MOBILE_LOADER_TRADE_STATUSES = exports.SIGFLO_MOBILE_LOADER_FEED_STATUSES = exports.SIGFLO_MOBILE_LOADER_AUTH_STATUSES = void 0;
exports.SigfloMobileLoader = SigfloMobileLoader;
var react_1 = require("react");
var sigfloMobileLoaderStatuses_1 = require("@/config/sigfloMobileLoaderStatuses");
/** Stable default when `statuses` omitted — same as {@link SIGFLO_MOBILE_LOADER_FEED_STATUSES}. */
var DEFAULT_MOBILE_STATUSES = __spreadArray([], sigfloMobileLoaderStatuses_1.SIGFLO_MOBILE_LOADER_FEED_STATUSES, true);
var sigfloMobileLoaderStatuses_2 = require("@/config/sigfloMobileLoaderStatuses");
Object.defineProperty(exports, "SIGFLO_MOBILE_LOADER_AUTH_STATUSES", { enumerable: true, get: function () { return sigfloMobileLoaderStatuses_2.SIGFLO_MOBILE_LOADER_AUTH_STATUSES; } });
Object.defineProperty(exports, "SIGFLO_MOBILE_LOADER_FEED_STATUSES", { enumerable: true, get: function () { return sigfloMobileLoaderStatuses_2.SIGFLO_MOBILE_LOADER_FEED_STATUSES; } });
Object.defineProperty(exports, "SIGFLO_MOBILE_LOADER_TRADE_STATUSES", { enumerable: true, get: function () { return sigfloMobileLoaderStatuses_2.SIGFLO_MOBILE_LOADER_TRADE_STATUSES; } });
function mobileLoaderLogoSrc() {
    var base = import.meta.env.BASE_URL;
    if (!base || base === '/')
        return '/logo.png';
    return "".concat(base.replace(/\/?$/, ''), "/logo.png");
}
/**
 * Compact full-viewport loader for mobile / pull-to-refresh style waits.
 * Uses `public/logo.png` (same asset as splash). Optional faux progress bar.
 */
function SigfloMobileLoader(_a) {
    var statuses = _a.statuses, _b = _a.intervalMs, intervalMs = _b === void 0 ? 1800 : _b, _c = _a.showProgress, showProgress = _c === void 0 ? false : _c;
    var logoSrc = (0, react_1.useMemo)(function () { return mobileLoaderLogoSrc(); }, []);
    var lineList = (0, react_1.useMemo)(function () { return (statuses != null && statuses.length > 0 ? statuses : DEFAULT_MOBILE_STATUSES); }, [statuses]);
    var _d = (0, react_1.useState)(0), index = _d[0], setIndex = _d[1];
    var _e = (0, react_1.useState)(true), visible = _e[0], setVisible = _e[1];
    var _f = (0, react_1.useState)(18), progress = _f[0], setProgress = _f[1];
    (0, react_1.useEffect)(function () {
        if (!lineList.length)
            return;
        var timer = window.setInterval(function () {
            setVisible(false);
            window.setTimeout(function () {
                setIndex(function (prev) { return (prev + 1) % lineList.length; });
                setVisible(true);
            }, 140);
        }, intervalMs);
        return function () { return window.clearInterval(timer); };
    }, [lineList, intervalMs]);
    (0, react_1.useEffect)(function () {
        if (!showProgress)
            return;
        var timer = window.setInterval(function () {
            setProgress(function (prev) { return Math.min(94, prev + Math.random() * 10); });
        }, 700);
        return function () { return window.clearInterval(timer); };
    }, [showProgress]);
    var line = lineList.length ? lineList[index % lineList.length] : '';
    return (<div className="flex min-h-[100svh] items-center justify-center bg-[#050505] px-6 text-white">
      <div className="w-full max-w-[280px] text-center">
        <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#00ffc8]/10 blur-2xl" aria-hidden/>
          <div className="absolute inset-0 rounded-full bg-cyan-400/10 blur-2xl" aria-hidden/>

          <img src={logoSrc} alt="Sigflo" width={64} height={64} className="relative h-16 w-16 animate-sigflo-mobile-logo-pulse object-contain" style={{
            filter: 'drop-shadow(0 0 14px rgba(0,255,200,0.28)) drop-shadow(0 0 18px rgba(0,140,255,0.18))',
        }} decoding="async" draggable={false}/>
        </div>

        <div className="mb-2 text-[10px] uppercase tracking-[0.28em] text-white/32">Sigflo</div>

        <div className="h-6" aria-live="polite" aria-atomic="true">
          <p className={"text-sm text-white/72 transition-all duration-200 ".concat(visible ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0')}>
            {line}
          </p>
        </div>

        {showProgress ? (<div className="mx-auto mt-4 w-full max-w-[180px]">
            <div className="h-[4px] overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-[#00ffc8] via-[#00d9ff] to-blue-500 transition-all duration-500" style={{ width: "".concat(progress, "%") }}/>
            </div>
          </div>) : null}
      </div>
    </div>);
}
exports.default = SigfloMobileLoader;
