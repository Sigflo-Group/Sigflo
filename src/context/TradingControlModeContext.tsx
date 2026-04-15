import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  DEFAULT_TRADING_CONTROL_MODE,
  loadTradingControlMode,
  TRADING_CONTROL_MODE_META,
  TRADING_CONTROL_MODE_STORAGE_KEY,
  tradingModeSwitchToast,
  type TradingControlMode,
} from '@/lib/tradingControlMode';

type TradingControlModeContextValue = {
  mode: TradingControlMode;
  setMode: (next: TradingControlMode) => void;
  meta: (typeof TRADING_CONTROL_MODE_META)[TradingControlMode];
};

const TradingControlModeContext = createContext<TradingControlModeContextValue | null>(null);

export function TradingControlModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<TradingControlMode>(() =>
    typeof window !== 'undefined' ? loadTradingControlMode() : DEFAULT_TRADING_CONTROL_MODE,
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const feedbackTimerRef = useRef<number | undefined>(undefined);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const setMode = useCallback((next: TradingControlMode) => {
    if (modeRef.current === next) return;
    modeRef.current = next;
    window.localStorage.setItem(TRADING_CONTROL_MODE_STORAGE_KEY, next);
    setModeState(next);
    window.clearTimeout(feedbackTimerRef.current);
    setFeedback(tradingModeSwitchToast(next));
    feedbackTimerRef.current = window.setTimeout(() => {
      setFeedback(null);
    }, 3400);
  }, []);

  useEffect(() => {
    return () => window.clearTimeout(feedbackTimerRef.current);
  }, []);

  const value = useMemo<TradingControlModeContextValue>(
    () => ({
      mode,
      setMode,
      meta: TRADING_CONTROL_MODE_META[mode],
    }),
    [mode, setMode],
  );

  return (
    <TradingControlModeContext.Provider value={value}>
      {children}
      {feedback ? (
        <div
          className="pointer-events-none fixed left-1/2 z-[100] w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 transition-opacity duration-200"
          style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))' }}
          role="status"
        >
          <div className="rounded-xl border border-[#00ffc8]/30 bg-black/92 px-3 py-2.5 text-center text-xs font-semibold leading-snug text-[#b8fff0] shadow-[0_12px_40px_-12px_rgba(0,255,200,0.2)] backdrop-blur-md">
            {feedback}
          </div>
        </div>
      ) : null}
    </TradingControlModeContext.Provider>
  );
}

export function useTradingControlMode(): TradingControlModeContextValue {
  const ctx = useContext(TradingControlModeContext);
  if (!ctx) throw new Error('useTradingControlMode must be used within TradingControlModeProvider');
  return ctx;
}
