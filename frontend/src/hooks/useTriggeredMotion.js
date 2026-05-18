"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTriggeredMotion = useTriggeredMotion;
var react_1 = require("react");
/**
 * Returns `true` briefly when state transitions from non-triggered -> triggered.
 * Used for one-shot premium trigger animations (border pulse, dot pop, entry highlight).
 */
function useTriggeredMotion(isTriggered, durationMs) {
    if (durationMs === void 0) { durationMs = 900; }
    var _a = (0, react_1.useState)(false), justTriggered = _a[0], setJustTriggered = _a[1];
    var prevTriggeredRef = (0, react_1.useRef)(isTriggered);
    (0, react_1.useEffect)(function () {
        var wasTriggered = prevTriggeredRef.current;
        prevTriggeredRef.current = isTriggered;
        if (!isTriggered || wasTriggered)
            return;
        setJustTriggered(true);
        var t = window.setTimeout(function () { return setJustTriggered(false); }, durationMs);
        return function () { return window.clearTimeout(t); };
    }, [durationMs, isTriggered]);
    return justTriggered;
}
