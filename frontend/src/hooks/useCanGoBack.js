"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCanGoBack = useCanGoBack;
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
function readCanGoBack() {
    if (typeof window === 'undefined')
        return false;
    var w = window;
    if (w.navigation && typeof w.navigation.canGoBack === 'boolean')
        return w.navigation.canGoBack;
    return window.history.length > 1;
}
/** True when the session history likely has a prior entry (for conditional header back → `navigate(-1)`). */
function useCanGoBack() {
    var location = (0, react_router_dom_1.useLocation)();
    return (0, react_1.useMemo)(function () { return readCanGoBack(); }, [location.key]);
}
