"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useThrottledLiveUnrealized = useThrottledLiveUnrealized;
var react_1 = require("react");
var liveMarketTickConstants_1 = require("@/lib/liveMarketTickConstants");
function computeFromMark(pos, mark) {
    var entry = Math.max(1e-9, pos.entryPrice);
    var dir = pos.side === 'long' ? 1 : -1;
    var movePct = ((mark - entry) / entry) * 100 * dir;
    var pnlUsd = pos.positionNotionalUsd * (movePct / 100);
    return { pnlUsd: pnlUsd, movePct: movePct, mark: mark };
}
/**
 * Reads `lastPriceRef` on a RAF loop and commits PnL to React at {@link LIVE_MARKET_UI_THROTTLE_MS}.
 * Keeps high-frequency ticks out of the render path while staying visually real-time.
 */
function useThrottledLiveUnrealized(lastPriceRef, position, enabled) {
    var posRef = (0, react_1.useRef)(position);
    (0, react_1.useLayoutEffect)(function () {
        posRef.current = position;
    }, [position]);
    var _a = (0, react_1.useState)({ pnlUsd: 0, movePct: 0, mark: 0 }), bundle = _a[0], setBundle = _a[1];
    (0, react_1.useEffect)(function () {
        if (!enabled || !position) {
            setBundle({ pnlUsd: 0, movePct: 0, mark: 0 });
            return;
        }
        var mark0 = lastPriceRef.current;
        if (mark0 != null && Number.isFinite(mark0) && mark0 > 0) {
            setBundle(computeFromMark(position, mark0));
        }
        var raf = 0;
        var lastCommit = 0;
        var loop = function () {
            raf = window.requestAnimationFrame(loop);
            var pos = posRef.current;
            if (!pos)
                return;
            var now = performance.now();
            if (now - lastCommit < liveMarketTickConstants_1.LIVE_MARKET_UI_THROTTLE_MS)
                return;
            var mark = lastPriceRef.current;
            if (mark == null || !Number.isFinite(mark) || mark <= 0)
                return;
            var next = computeFromMark(pos, mark);
            lastCommit = now;
            setBundle(function (prev) {
                return Math.abs(prev.pnlUsd - next.pnlUsd) < 1e-8 &&
                    Math.abs(prev.movePct - next.movePct) < 1e-5 &&
                    prev.mark === next.mark
                    ? prev
                    : next;
            });
        };
        raf = window.requestAnimationFrame(loop);
        return function () { return window.cancelAnimationFrame(raf); };
    }, [enabled, position === null || position === void 0 ? void 0 : position.id, lastPriceRef]);
    return bundle;
}
