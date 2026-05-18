"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BottomTabNav = BottomTabNav;
var react_router_dom_1 = require("react-router-dom");
var appRoutes_1 = require("@/config/appRoutes");
var staticTabs = [
    { to: '/markets', label: 'Markets', icon: MarketsIcon },
    { to: '/bots', label: 'Bots', icon: BotsIcon },
    { to: '/portfolio', label: 'Portfolio', icon: PortfolioIcon },
    { to: '/profile', label: 'Account', icon: ProfileIcon },
];
function BottomTabNav() {
    var tabs = __spreadArray([{ to: (0, appRoutes_1.getFeedRoute)(), label: 'Feed', icon: FeedIcon }], staticTabs, true);
    return (<nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.06] bg-sigflo-bg/95 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-2xl" aria-label="Primary navigation">
      <div className="mx-auto flex max-w-lg items-end justify-between gap-0.5 px-2">
        {tabs.map(function (_a) {
            var to = _a.to, label = _a.label, Icon = _a.icon;
            return (<react_router_dom_1.NavLink key={to} to={to} end={to !== '/bots'} className={function (_a) {
                    var isActive = _a.isActive;
                    return "group flex min-h-[3.5rem] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-2 transition-colors ".concat(isActive ? 'text-sigflo-accent' : 'text-sigflo-muted hover:text-sigflo-text');
                }}>
            {function (_a) {
                    var isActive = _a.isActive;
                    return (<>
                <span className={"flex h-11 w-14 min-h-[2.75rem] items-center justify-center rounded-xl transition-all ".concat(isActive
                            ? 'bg-sigflo-accentDim ring-1 ring-sigflo-accent/20'
                            : 'bg-transparent group-hover:bg-white/[0.04]')}>
                  <Icon active={isActive}/>
                </span>
                <span className={"max-w-full truncate text-[11px] font-semibold leading-tight tracking-wide ".concat(isActive ? 'text-sigflo-accent' : '')}>
                  {label}
                </span>
              </>);
                }}
          </react_router_dom_1.NavLink>);
        })}
      </div>
    </nav>);
}
function FeedIcon(_a) {
    var active = _a.active;
    return (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={active ? 'text-sigflo-accent' : 'currentColor'}>
      <path d="M4 6h16M4 12h10M4 18h16" stroke="currentColor" strokeWidth={active ? 2 : 1.8} strokeLinecap="round"/>
    </svg>);
}
function MarketsIcon(_a) {
    var active = _a.active;
    return (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={active ? 'text-sigflo-accent' : 'currentColor'}>
      <path d="M4 18V6l6 8 4-6 6 10" stroke="currentColor" strokeWidth={active ? 2 : 1.8} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>);
}
function BotsIcon(_a) {
    var active = _a.active;
    return (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={active ? 'text-sigflo-accent' : 'currentColor'}>
      <rect x="5" y="8" width="14" height="10" rx="2" stroke="currentColor" strokeWidth={active ? 2 : 1.8}/>
      <path d="M9 8V6a2 2 0 012-2h2a2 2 0 012 2v2" stroke="currentColor" strokeWidth={active ? 2 : 1.8}/>
      <circle cx="10" cy="13" r="1" fill="currentColor"/>
      <circle cx="14" cy="13" r="1" fill="currentColor"/>
    </svg>);
}
function PortfolioIcon(_a) {
    var active = _a.active;
    return (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={active ? 'text-sigflo-accent' : 'currentColor'}>
      <path d="M4 19V5M4 19h16M8 15V9M12 15V7M16 15v-4" stroke="currentColor" strokeWidth={active ? 2 : 1.8} strokeLinecap="round"/>
    </svg>);
}
function ProfileIcon(_a) {
    var active = _a.active;
    return (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={active ? 'text-sigflo-accent' : 'currentColor'}>
      <circle cx="12" cy="9" r="3.5" stroke="currentColor" strokeWidth={active ? 2 : 1.8}/>
      <path d="M6 19c1.2-3 3.8-4.5 6-4.5s4.8 1.5 6 4.5" stroke="currentColor" strokeWidth={active ? 2 : 1.8} strokeLinecap="round"/>
    </svg>);
}
