"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSetupAlerts = useSetupAlerts;
var react_1 = require("react");
var alertEngine_1 = require("@/services/alerts/alertEngine");
var alertPreferences_1 = require("@/services/alerts/alertPreferences");
var sound_1 = require("@/utils/sound");
var HIGHLIGHT_MS = 2000;
var BANNER_MS = 2600;
/**
 * Compares successive `opportunities` snapshots against alert preferences and drives
 * subtle in-app feedback (card highlight, optional sound, command bar ping).
 */
function useSetupAlerts(opportunities) {
    var prevRef = (0, react_1.useRef)(null);
    var hydratedRef = (0, react_1.useRef)(false);
    var highlightTimersRef = (0, react_1.useRef)(new Map());
    var _a = (0, react_1.useState)(function () { return new Set(); }), highlightIds = _a[0], setHighlightIds = _a[1];
    var _b = (0, react_1.useState)(0), commandBarFlashKey = _b[0], setCommandBarFlashKey = _b[1];
    var _c = (0, react_1.useState)(null), setupReadyBanner = _c[0], setSetupReadyBanner = _c[1];
    var bannerTimerRef = (0, react_1.useRef)(null);
    var clearHighlightTimer = (0, react_1.useCallback)(function (id) {
        var t = highlightTimersRef.current.get(id);
        if (t != null) {
            window.clearTimeout(t);
            highlightTimersRef.current.delete(id);
        }
    }, []);
    var runCompare = (0, react_1.useCallback)(function (next) {
        var _a;
        var prefs = (0, alertPreferences_1.getAlertPreferences)();
        if (!hydratedRef.current) {
            prevRef.current = next;
            if (next.length > 0)
                hydratedRef.current = true;
            return;
        }
        var prev = (_a = prevRef.current) !== null && _a !== void 0 ? _a : [];
        prevRef.current = next;
        if (prev.length === 0 && next.length > 0) {
            return;
        }
        var events = (0, alertEngine_1.processOpportunitiesForAlerts)(prev, next, prefs);
        if (events.length === 0)
            return;
        if (prefs.channels.includes('in_app')) {
            var _loop_1 = function (id) {
                clearHighlightTimer(id);
                setHighlightIds(function (h) {
                    var n = new Set(h);
                    n.add(id);
                    return n;
                });
                var tid = window.setTimeout(function () {
                    setHighlightIds(function (h) {
                        var n = new Set(h);
                        n.delete(id);
                        return n;
                    });
                    highlightTimersRef.current.delete(id);
                }, HIGHLIGHT_MS);
                highlightTimersRef.current.set(id, tid);
            };
            for (var _i = 0, _b = events.map(function (e) { return e.id; }); _i < _b.length; _i++) {
                var id = _b[_i];
                _loop_1(id);
            }
            setCommandBarFlashKey(function (k) { return k + 1; });
            if (bannerTimerRef.current != null) {
                window.clearTimeout(bannerTimerRef.current);
                bannerTimerRef.current = null;
            }
            setSetupReadyBanner('New setup ready');
            bannerTimerRef.current = window.setTimeout(function () {
                setSetupReadyBanner(null);
                bannerTimerRef.current = null;
            }, BANNER_MS);
        }
        if (prefs.channels.includes('sound')) {
            var wantsAlert = events.some(function (e) { return e.state === 'Triggered' || (e.state === 'Ready' && e.score >= 80); });
            if (wantsAlert)
                (0, sound_1.playAlertSound)();
            else
                (0, sound_1.playSetupReadySound)();
        }
    }, [clearHighlightTimer]);
    (0, react_1.useEffect)(function () {
        return function () {
            if (bannerTimerRef.current != null)
                window.clearTimeout(bannerTimerRef.current);
            for (var _i = 0, _a = highlightTimersRef.current.values(); _i < _a.length; _i++) {
                var t = _a[_i];
                window.clearTimeout(t);
            }
        };
    }, []);
    (0, react_1.useEffect)(function () {
        runCompare(opportunities);
    }, [opportunities, runCompare]);
    return { highlightIds: highlightIds, commandBarFlashKey: commandBarFlashKey, setupReadyBanner: setupReadyBanner };
}
