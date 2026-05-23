import { secureStorage } from '@/lib/storage';

const KEY = 'sigflo_first_trade_guide_dismissed';

export function isFirstTradeGuideDismissed(): boolean {
  try {
    return secureStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissFirstTradeGuide(): void {
  try {
    secureStorage.setItem(KEY, '1');
  } catch { }
}
