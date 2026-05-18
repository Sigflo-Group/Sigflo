"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAppAnnouncementsEnabled = useAppAnnouncementsEnabled;
var react_1 = require("react");
var appAnnouncementsPreference_1 = require("@/lib/appAnnouncementsPreference");
function useAppAnnouncementsEnabled() {
    return (0, react_1.useSyncExternalStore)(appAnnouncementsPreference_1.subscribeAppAnnouncementsPref, appAnnouncementsPreference_1.readAppAnnouncementsEnabled, appAnnouncementsPreference_1.readAppAnnouncementsEnabled);
}
