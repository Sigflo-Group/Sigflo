export type TradingStyleChoice = 'aggressive' | 'balanced' | 'defensive';

const KEY_DONE = 'sigflo_trading_style_onboarded';
const KEY_STYLE = 'sigflo_trading_style';

export function isTradingStyleOnboarded(): boolean {
  try {
    return window.localStorage.getItem(KEY_DONE) === '1';
  } catch {
    return true;
  }
}

export function readTradingStyleChoice(): TradingStyleChoice | null {
  try {
    const v = window.localStorage.getItem(KEY_STYLE);
    if (v === 'aggressive' || v === 'balanced' || v === 'defensive') return v;
    return null;
  } catch {
    return null;
  }
}

export function markTradingStyleOnboarded(choice: TradingStyleChoice): void {
  try {
    window.localStorage.setItem(KEY_DONE, '1');
    window.localStorage.setItem(KEY_STYLE, choice);
  } catch {
    /* ignore quota / private mode */
  }
}
