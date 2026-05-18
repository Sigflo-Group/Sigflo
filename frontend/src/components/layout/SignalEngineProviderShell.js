"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignalEngineProviderShell = SignalEngineProviderShell;
var react_router_dom_1 = require("react-router-dom");
var AccountSnapshotContext_1 = require("@/context/AccountSnapshotContext");
var SignalEngineContext_1 = require("@/context/SignalEngineContext");
var ExitAiDecisionBridge_1 = require("@/components/layout/ExitAiDecisionBridge");
var GlobalAnnouncementHost_1 = require("@/components/layout/GlobalAnnouncementHost");
/**
 * Single signal-engine WebSocket + global bias / AI toast host for all authenticated trade/scanner routes.
 */
function SignalEngineProviderShell() {
    return (<AccountSnapshotContext_1.AccountSnapshotProvider pollMs={12000}>
      <SignalEngineContext_1.SignalEngineProvider>
        <ExitAiDecisionBridge_1.ExitAiDecisionBridge />
        <GlobalAnnouncementHost_1.GlobalAnnouncementHost />
        <react_router_dom_1.Outlet />
      </SignalEngineContext_1.SignalEngineProvider>
    </AccountSnapshotContext_1.AccountSnapshotProvider>);
}
