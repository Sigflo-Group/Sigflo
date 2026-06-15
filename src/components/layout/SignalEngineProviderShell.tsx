import { Outlet } from 'react-router-dom';
import { AccountSnapshotProvider } from '@/context/AccountSnapshotContext';
import { ExchangeIntegrationsProvider } from '@/context/ExchangeIntegrationsContext';
import { SignalEngineProvider } from '@/context/SignalEngineContext';
import { ExitAiDecisionBridge } from '@/components/layout/ExitAiDecisionBridge';
import { GlobalAnnouncementHost } from '@/components/layout/GlobalAnnouncementHost';

/**
 * Single signal-engine WebSocket + global bias / AI toast host for all authenticated trade/scanner routes.
 */
export function SignalEngineProviderShell() {
  return (
    <AccountSnapshotProvider pollMs={12_000}>
      <ExchangeIntegrationsProvider>
        <SignalEngineProvider>
          <ExitAiDecisionBridge />
          <GlobalAnnouncementHost />
          <Outlet />
        </SignalEngineProvider>
      </ExchangeIntegrationsProvider>
    </AccountSnapshotProvider>
  );
}
