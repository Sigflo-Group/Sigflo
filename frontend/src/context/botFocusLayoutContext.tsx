import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

export function isBotFocusCockpitPath(pathname: string): boolean {
  return /\/bots\/[^/]+\/focus(\/|$)/.test(pathname) || /^bots\/[^/]+\/focus(\/|$)/.test(pathname.replace(/^\//, ''));
}

type BotFocusLayoutContextValue = {
  fullChartMode: boolean;
  setFullChartMode: (next: boolean) => void;
};

const BotFocusLayoutContext = createContext<BotFocusLayoutContextValue | null>(null);

export function BotFocusLayoutProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const onFocusRoute = isBotFocusCockpitPath(pathname);
  const [fullChartMode, setFullChartModeState] = useState(false);

  useEffect(() => {
    if (!onFocusRoute) setFullChartModeState(false);
  }, [onFocusRoute]);

  const setFullChartMode = useCallback((next: boolean) => {
    setFullChartModeState(next);
  }, []);

  const value = useMemo(
    (): BotFocusLayoutContextValue => ({
      fullChartMode: onFocusRoute && fullChartMode,
      setFullChartMode,
    }),
    [onFocusRoute, fullChartMode, setFullChartMode],
  );

  return <BotFocusLayoutContext.Provider value={value}>{children}</BotFocusLayoutContext.Provider>;
}

export function useBotFocusLayout(): BotFocusLayoutContextValue {
  const ctx = useContext(BotFocusLayoutContext);
  if (!ctx) {
    return { fullChartMode: false, setFullChartMode: () => {} };
  }
  return ctx;
}
