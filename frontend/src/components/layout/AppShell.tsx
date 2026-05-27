import { Outlet, useLocation } from 'react-router-dom';
import { AppTopBar } from '@/components/layout/AppTopBar';
import { BottomTabNav } from '@/components/layout/BottomTabNav';
import { BotFocusLayoutProvider, isBotFocusCockpitPath, useBotFocusLayout } from '@/context/botFocusLayoutContext';
import { FeedbackProvider } from '@/context/FeedbackContext';
import { FeedbackModal } from '@/components/feedback/FeedbackModal';

function AppShellMain() {
  const { pathname } = useLocation();
  const { fullChartMode } = useBotFocusLayout();
  const isBotFocusCockpit = isBotFocusCockpitPath(pathname);
  const hideTabBar = fullChartMode;
  /** Lets Bot Focus use an inner `overflow-y-auto` column (`flex-1 min-h-0`) so the cockpit scrolls on mobile. */
  const botFocusScrollChain = isBotFocusCockpit && !fullChartMode;
  /**
   * Lock shell height to the dynamic viewport so the focus cockpit’s inner scroller gets a real max height.
   * Without this, the flex column grows with content and `overflow-y-auto` never activates (broken on mobile).
   */
  const botFocusViewportLock = botFocusScrollChain;

  return (
    <div
      className={`relative flex flex-col bg-sigflo-bg ${
        botFocusViewportLock
          ? 'h-[100dvh] max-h-[100dvh] min-h-0 overflow-hidden'
          : 'min-h-[100dvh]'
      }`}
    >
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(0,255,200,0.06),transparent)]"
        aria-hidden
      />
      <main
        className={`relative flex-1 transition-[padding] duration-300 ease-out ${
          hideTabBar ? 'pb-0' : 'pb-[calc(7rem+env(safe-area-inset-bottom))]'
        } ${botFocusScrollChain ? 'flex min-h-0 flex-col overflow-hidden' : ''}`}
      >
        <div
          className={`mx-auto w-full px-4 transition-[max-width] duration-300 ease-out ${
            isBotFocusCockpit ? 'max-w-lg sm:max-w-2xl lg:max-w-4xl' : 'max-w-lg'
          } ${fullChartMode ? '!max-w-none px-0 sm:px-0 lg:max-w-none' : ''} ${
            botFocusScrollChain ? 'flex min-h-0 min-w-0 flex-1 flex-col' : ''
          }`}
        >
          {!fullChartMode ? <AppTopBar /> : null}
          <Outlet />
        </div>
      </main>
      {hideTabBar ? null : <BottomTabNav />}
      <FeedbackModal />
    </div>
  );
}

export function AppShell() {
  return (
    <BotFocusLayoutProvider>
      <FeedbackProvider>
        <AppShellMain />
      </FeedbackProvider>
    </BotFocusLayoutProvider>
  );
}
