"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APP_ANNOUNCEMENTS_PREF_EVENT = void 0;
exports.readAppAnnouncementsEnabled = readAppAnnouncementsEnabled;
exports.setAppAnnouncementsEnabled = setAppAnnouncementsEnabled;
exports.subscribeAppAnnouncementsPref = subscribeAppAnnouncementsPref;
var STORAGE_KEY = 'sigflo-app-announcements-enabled';
/** Same-tab listeners (storage event only fires across tabs). */
exports.APP_ANNOUNCEMENTS_PREF_EVENT = 'sigflo-app-announcements-pref';
/**
 * When `false`, {@link GlobalAnnouncementHost} ignores all announcements (bias, Exit AI, etc.):
 * no in-app banners, haptics, or `Notification` calls. Default is on (`true`).
 */
function readAppAnnouncementsEnabled() {
    if (typeof window === 'undefined')
        return true;
    try {
        return window.localStorage.getItem(STORAGE_KEY) !== 'false';
    }
    catch (_a) {
        return true;
    }
}
function setAppAnnouncementsEnabled(enabled) {
    if (typeof window === 'undefined')
        return;
    try {
        if (enabled)
            window.localStorage.removeItem(STORAGE_KEY);
        else
            window.localStorage.setItem(STORAGE_KEY, 'false');
    }
    catch (_a) {
        /* private mode */
    }
    window.dispatchEvent(new Event(exports.APP_ANNOUNCEMENTS_PREF_EVENT));
}
function subscribeAppAnnouncementsPref(onStoreChange) {
    var fn = function () { return onStoreChange(); };
    if (typeof window === 'undefined')
        return function () { };
    window.addEventListener(exports.APP_ANNOUNCEMENTS_PREF_EVENT, fn);
    window.addEventListener('storage', fn);
    return function () {
        window.removeEventListener(exports.APP_ANNOUNCEMENTS_PREF_EVENT, fn);
        window.removeEventListener('storage', fn);
    };
}
