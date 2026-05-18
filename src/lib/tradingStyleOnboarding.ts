import { secureStorage } from '@/lib/storage';
export type TradingStyleChoice = 'aggressive' | 'balanced' | 'defensive';

const KEY_DONE = 'sigflo_trading_style_onboarded';
const KEY_STYLE = 'sigflo_trading_style';

export function isTradingStyleOnboarded(): boolean {
  try {
    return secureStorage.getItem(KEY_DONE) === '1';
  } catch {
    return true;
  }
}

export function readTradingStyleChoice(): TradingStyleChoice | null {
  try {
    const v = secureStorage.getItem(KEY_STYLE);
    if (v === 'aggressive' || v === 'balanced' || v === 'defensive') return v;
    return null;
  } catch {
    return null;
  }
}

export function markTradingStyleOnboarded(choice: TradingStyleChoice): void {
  try {
    secureStorage.setItem(KEY_DONE, '1');
    secureStorage.setItem(KEY_STYLE, choice);
  } catch (e) { console.error("[Caught Error]", e); }
}
