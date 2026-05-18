"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBotFocusCockpitPath = isBotFocusCockpitPath;
exports.BotFocusLayoutProvider = BotFocusLayoutProvider;
exports.useBotFocusLayout = useBotFocusLayout;
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
function isBotFocusCockpitPath(pathname) {
    return /\/bots\/[^/]+\/focus(\/|$)/.test(pathname) || /^bots\/[^/]+\/focus(\/|$)/.test(pathname.replace(/^\//, ''));
}
var BotFocusLayoutContext = (0, react_1.createContext)(null);
function BotFocusLayoutProvider(_a) {
    var children = _a.children;
    var pathname = (0, react_router_dom_1.useLocation)().pathname;
    var onFocusRoute = isBotFocusCockpitPath(pathname);
    var _b = (0, react_1.useState)(false), fullChartMode = _b[0], setFullChartModeState = _b[1];
    (0, react_1.useEffect)(function () {
        if (!onFocusRoute)
            setFullChartModeState(false);
    }, [onFocusRoute]);
    var setFullChartMode = (0, react_1.useCallback)(function (next) {
        setFullChartModeState(next);
    }, []);
    var value = (0, react_1.useMemo)(function () { return ({
        fullChartMode: onFocusRoute && fullChartMode,
        setFullChartMode: setFullChartMode,
    }); }, [onFocusRoute, fullChartMode, setFullChartMode]);
    return <BotFocusLayoutContext.Provider value={value}>{children}</BotFocusLayoutContext.Provider>;
}
function useBotFocusLayout() {
    var ctx = (0, react_1.useContext)(BotFocusLayoutContext);
    if (!ctx) {
        return { fullChartMode: false, setFullChartMode: function () { } };
    }
    return ctx;
}
