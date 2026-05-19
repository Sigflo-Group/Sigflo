import { NavLink } from 'react-router-dom';
import { getFeedRoute } from '@/config/appRoutes';

const staticTabs = [
  { to: '/markets', label: 'Markets', icon: MarketsIcon },
  { to: '/bots', label: 'Bots', icon: BotsIcon },
  { to: '/performance', label: 'Stats', icon: StatsIcon },
  { to: '/portfolio', label: 'Portfolio', icon: PortfolioIcon },
  { to: '/profile', label: 'Account', icon: ProfileIcon },
] as const;

export function BottomTabNav() {
  const tabs = [{ to: getFeedRoute(), label: 'Feed', icon: FeedIcon }, ...staticTabs] as const;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.06] bg-sigflo-bg/95 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-2xl"
      aria-label="Primary navigation"
    >
      {/* Persistent disclaimer — sits at the top of the nav bar, always visible */}
      <p className="pb-1 text-center text-[9px] leading-tight text-sigflo-muted/45">
        Market analysis only · Not financial advice ·{' '}
        <a href="/legal" className="underline decoration-sigflo-muted/25 underline-offset-2">
          Legal
        </a>
      </p>
      <div className="mx-auto flex max-w-lg items-end justify-between gap-0.5 px-2">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to !== '/bots'}
            className={({ isActive }) =>
              `group flex min-h-[3.5rem] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-2 transition-colors ${
                isActive ? 'text-sigflo-accent' : 'text-sigflo-muted hover:text-sigflo-text'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-11 w-14 min-h-[2.75rem] items-center justify-center rounded-xl transition-all ${
                    isActive
                      ? 'bg-sigflo-accentDim ring-1 ring-sigflo-accent/20'
                      : 'bg-transparent group-hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon active={isActive} />
                </span>
                <span className={`max-w-full truncate text-[11px] font-semibold leading-tight tracking-wide ${isActive ? 'text-sigflo-accent' : ''}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function FeedIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={active ? 'text-sigflo-accent' : 'currentColor'}>
      <path d="M4 6h16M4 12h10M4 18h16" stroke="currentColor" strokeWidth={active ? 2 : 1.8} strokeLinecap="round" />
    </svg>
  );
}

function MarketsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={active ? 'text-sigflo-accent' : 'currentColor'}>
      <path d="M4 18V6l6 8 4-6 6 10" stroke="currentColor" strokeWidth={active ? 2 : 1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BotsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={active ? 'text-sigflo-accent' : 'currentColor'}>
      <rect x="5" y="8" width="14" height="10" rx="2" stroke="currentColor" strokeWidth={active ? 2 : 1.8} />
      <path d="M9 8V6a2 2 0 012-2h2a2 2 0 012 2v2" stroke="currentColor" strokeWidth={active ? 2 : 1.8} />
      <circle cx="10" cy="13" r="1" fill="currentColor" />
      <circle cx="14" cy="13" r="1" fill="currentColor" />
    </svg>
  );
}

function PortfolioIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={active ? 'text-sigflo-accent' : 'currentColor'}>
      <path d="M4 19V5M4 19h16M8 15V9M12 15V7M16 15v-4" stroke="currentColor" strokeWidth={active ? 2 : 1.8} strokeLinecap="round" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={active ? 'text-sigflo-accent' : 'currentColor'}>
      <circle cx="12" cy="9" r="3.5" stroke="currentColor" strokeWidth={active ? 2 : 1.8} />
      <path d="M6 19c1.2-3 3.8-4.5 6-4.5s4.8 1.5 6 4.5" stroke="currentColor" strokeWidth={active ? 2 : 1.8} strokeLinecap="round" />
    </svg>
  );
}

function StatsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={active ? 'text-sigflo-accent' : 'currentColor'}>
      <path d="M5 18V10M12 18V6M19 18v-4" stroke="currentColor" strokeWidth={active ? 2 : 1.8} strokeLinecap="round" />
      <path d="M4 18h16" stroke="currentColor" strokeWidth={active ? 2 : 1.8} strokeLinecap="round" />
    </svg>
  );
}
