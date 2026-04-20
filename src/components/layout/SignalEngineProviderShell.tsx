import { Outlet } from 'react-router-dom';
import { AccountSnapshotProvider } from '@/context/AccountSnapshotContext';
import { SignalEngineProvider } from '@/context/SignalEngineContext';
import { GlobalAnnouncementHost } from '@/components/layout/GlobalAnnouncementHost';

/**
 * Single signal-engine WebSocket + global bias / AI toast host for all authenticated trade/scanner routes.
 */
export function SignalEngineProviderShell() {
  return (
    <AccountSnapshotProvider pollMs={12_000}>
      <SignalEngineProvider>
        <GlobalAnnouncementHost />
        <Outlet />
      </SignalEngineProvider>
    </AccountSnapshotProvider>
  );
}
