"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useHoldStepper = useHoldStepper;
var react_1 = require("react");
var DEFAULT_DELAY_MS = 420;
var DEFAULT_INTERVAL_MS = 52;
/**
 * Pointer hold-to-repeat for +/- steppers: short tap = one step; hold = step after delay then repeat.
 * Suppresses the extra synthetic `click` after pointer so mouse taps do not double-step; keyboard (Space/Enter) still fires one step via `onClick`.
 */
function useHoldStepper(onStep, options) {
    var _a, _b;
    var delayMs = (_a = options === null || options === void 0 ? void 0 : options.delayMs) !== null && _a !== void 0 ? _a : DEFAULT_DELAY_MS;
    var intervalMs = (_b = options === null || options === void 0 ? void 0 : options.intervalMs) !== null && _b !== void 0 ? _b : DEFAULT_INTERVAL_MS;
    var onStepRef = (0, react_1.useRef)(onStep);
    onStepRef.current = onStep;
    var delayTimerRef = (0, react_1.useRef)(null);
    var intervalTimerRef = (0, react_1.useRef)(null);
    var repeatStartedRef = (0, react_1.useRef)(false);
    var usedPointerRef = (0, react_1.useRef)(false);
    var clearTimers = (0, react_1.useCallback)(function () {
        if (delayTimerRef.current != null) {
            clearTimeout(delayTimerRef.current);
            delayTimerRef.current = null;
        }
        if (intervalTimerRef.current != null) {
            clearInterval(intervalTimerRef.current);
            intervalTimerRef.current = null;
        }
    }, []);
    (0, react_1.useEffect)(function () { return function () { return clearTimers(); }; }, [clearTimers]);
    var beginHold = (0, react_1.useCallback)(function () {
        usedPointerRef.current = true;
        clearTimers();
        repeatStartedRef.current = false;
        delayTimerRef.current = window.setTimeout(function () {
            repeatStartedRef.current = true;
            onStepRef.current();
            intervalTimerRef.current = window.setInterval(function () {
                onStepRef.current();
            }, intervalMs);
        }, delayMs);
    }, [clearTimers, delayMs, intervalMs]);
    var endHold = (0, react_1.useCallback)(function () {
        var hadRepeat = repeatStartedRef.current;
        clearTimers();
        repeatStartedRef.current = false;
        if (!hadRepeat) {
            onStepRef.current();
        }
    }, [clearTimers]);
    var onClick = (0, react_1.useCallback)(function (e) {
        if (usedPointerRef.current) {
            usedPointerRef.current = false;
            e.preventDefault();
            return;
        }
        onStepRef.current();
    }, []);
    return {
        onPointerDown: beginHold,
        onPointerUp: endHold,
        onPointerLeave: endHold,
        onPointerCancel: endHold,
        onClick: onClick,
    };
}
