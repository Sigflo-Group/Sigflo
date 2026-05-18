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
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitGlobalAnnouncement = emitGlobalAnnouncement;
exports.subscribeGlobalAnnouncements = subscribeGlobalAnnouncements;
var listeners = new Set();
function emitGlobalAnnouncement(partial) {
    var _a;
    var announcement = __assign(__assign({}, partial), { createdAt: (_a = partial.createdAt) !== null && _a !== void 0 ? _a : Date.now() });
    for (var _i = 0, listeners_1 = listeners; _i < listeners_1.length; _i++) {
        var fn = listeners_1[_i];
        try {
            fn(announcement);
        }
        catch (_b) {
            /* ignore listener errors */
        }
    }
}
function subscribeGlobalAnnouncements(listener) {
    listeners.add(listener);
    return function () { return listeners.delete(listener); };
}
