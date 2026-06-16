import { SigfloLogo } from '@/components/branding/SigfloLogo';
import { feedActionablePath, getFeedRoute } from '@/config/appRoutes';
import { useCanGoBack } from '@/hooks/useCanGoBack';
import { useSignalEngine } from '@/hooks/useSignalEngine';
import { emitGlobalAnnouncement } from '@/lib/globalAnnouncements';
import { countTriggeredPairs } from '@/lib/marketScannerRows';
import { Link, useLocation, useNavigate } from 'react-router-dom';

/** Main hub screens: show shared tagline beside “Sigflo” in the top bar. */
function showAppTagline(pathname: string): boolean {
  const feedPath = getFeedRoute();
  const isFeedScreen = pathname === feedPath || pathname === `${feedPath}/`;
  if (isFeedScreen) return true;
  const p = pathname.replace(/\/$/, '') || '/';
  if (p === '/markets' || p === '/portfolio' || p === '/profile') return true;
  if (p === '/bots' || p.startsWith('/bots/')) return true;
  return false;
}

export function AppTopBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const canGoBack = useCanGoBack();
  const taglineVisible = showAppTagline(pathname);
  const p = pathname.replace(/\/$/, '') || '/';
  const showBrandingLogo = p !== '/trade';
  const { signals, loading, mode, error, proIntelligenceMode, setProIntelligenceMode } = useSignalEngine();
  const triggeredPairCount = countTriggeredPairs(signals);

  return (
    <header className="sticky top-0 z-30 -mx-4 shrink-0 border-b border-white/[0.06] bg-sigflo-bg/80 px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] backdrop-blur-xl">
      <div className="flex min-h-7 items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          {canGoBack ? (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-10 min-h-[2.75rem] w-10 min-w-[2.75rem] shrink-0 items-center justify-center rounded-lg border border-white/[0.08] text-sigflo-muted transition hover:text-white sm:h-9 sm:min-h-0 sm:w-9 sm:min-w-0"
              aria-label="Back"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-[18px] w-[18px] sm:h-4 sm:w-4">
                <path
                  d="M15 6l-6 6 6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : null}
          <div className="flex min-w-0 items-center gap-1.5">
            {showBrandingLogo ? <SigfloLogo size={28} glowing className="shrink-0" /> : null}
            <div className="flex min-w-0 items-center gap-2 overflow-hidden">
              <h1 className="m-0 flex h-7 shrink-0 items-center text-base font-semibold leading-none tracking-tight text-white">
                Sigflo
              </h1>
              <span className="inline-flex h-5 shrink-0 items-center rounded-full border border-[rgba(0,200,120,0.34)] bg-[rgba(0,200,120,0.12)] px-1.5 text-[8px] font-bold uppercase leading-none tracking-[0.1em] text-[#8FFFD4] sm:px-2 sm:text-[9px] sm:tracking-[0.12em]">
                Open beta
              </span>
              {taglineVisible ? (
                <p className="m-0 hidden min-w-0 truncate border-l border-white/[0.1] pl-2 text-[10px] font-medium leading-none tracking-wide text-sigflo-muted sm:block">
                  From signal to execution.
                </p>
              ) : null}
            </div>
          </div>
        </div>
        <div className="ml-2 flex shrink-0 items-center gap-1">
          <Link
            to={feedActionablePath()}
            className="inline-flex h-7 min-w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-sigflo-accent/25 bg-sigflo-accentDim px-1.5 py-0 text-[9px] font-bold uppercase leading-none tracking-[0.08em] text-sigflo-accent transition hover:border-sigflo-accent/40 hover:bg-sigflo-accent/14 sm:gap-1.5 sm:px-2.5 sm:text-[10px] sm:tracking-wider"
            aria-label="Open feed and view triggered setups"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-sigflo-accent [animation-duration:1.8s]" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sigflo-accent" />
            </span>
            <span className="sm:hidden">{loading ? '...' : `${triggeredPairCount} triggered`}</span>
            <span className="hidden sm:inline">
              {loading ? 'Syncing...' : `Triggered ${triggeredPairCount}`}
            </span>
            {!loading && mode === 'OFFLINE' ? (
              <span className="hidden text-[9px] font-medium normal-case text-rose-300/90 lg:inline" title={error}>
                · offline
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            onClick={() => {
              const next = !proIntelligenceMode;
              setProIntelligenceMode(next);
              emitGlobalAnnouncement({
                id: `pro-intel-${Date.now()}`,
                kind: 'ai_action',
                title: next ? 'Pro Intelligence Mode enabled' : 'Pro Intelligence Mode disabled',
                subtitle: next
                  ? 'Advanced analytics are now available.'
                  : 'Default streamlined view restored.',
              });
            }}
            className={`inline-flex h-7 shrink-0 items-center rounded-full border px-1.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] transition sm:px-2 ${
              proIntelligenceMode
                ? 'border-cyan-300/35 bg-cyan-500/12 text-cyan-100 hover:bg-cyan-500/18'
                : 'border-white/[0.1] bg-white/[0.04] text-sigflo-muted hover:text-sigflo-text'
            }`}
            aria-pressed={proIntelligenceMode}
            aria-label={proIntelligenceMode ? 'Disable Pro Intelligence Mode' : 'Enable Pro Intelligence Mode'}
            title={proIntelligenceMode ? 'Pro Intelligence Mode on' : 'Pro Intelligence Mode off'}
          >
            {proIntelligenceMode ? 'Pro On' : 'Pro Off'}
          </button>
        </div>
      </div>
    </header>
  );
}
