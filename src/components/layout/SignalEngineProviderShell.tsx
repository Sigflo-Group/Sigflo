import { Outlet } from 'react-router-dom';
import { AccountSnapshotProvider } from '@/context/AccountSnapshotContext';
import { SignalEngineProvider } from '@/context/SignalEngineContext';
import { ExitAiDecisionBridge } from '@/components/layout/ExitAiDecisionBridge';
import { GlobalAnnouncementHost } from '@/components/layout/GlobalAnnouncementHost';
import { useSyncActiveExchangeMarketData } from '@/hooks/useSyncActiveExchangeMarketData';

function ActiveExchangeMarketDataSync() {
  useSyncActiveExchangeMarketData();
  return null;
}

/**
 * Single signal-engine WebSocket + global bias / AI toast host for all authenticated trade/scanner routes.
 */
export function SignalEngineProviderShell() {
  return (
    <AccountSnapshotProvider pollMs={12_000}>
      <ActiveExchangeMarketDataSync />
      <SignalEngineProvider>
        <ExitAiDecisionBridge />
        <GlobalAnnouncementHost />
        <Outlet />
      </SignalEngineProvider>
    </AccountSnapshotProvider>
  );
}
