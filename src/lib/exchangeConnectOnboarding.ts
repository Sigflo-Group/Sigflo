import { secureStorage } from '@/lib/storage';
const KEY_SEEN = 'sigflo_onboarding_connect_seen';

/** User finished the optional “link your exchange” step (linked, skipped, or closed the demo walkthrough). */
export function isExchangeConnectOnboardingSeen(): boolean {
  try {
    return secureStorage.getItem(KEY_SEEN) === '1';
  } catch {
    return true;
  }
}

export function markExchangeConnectOnboardingSeen(): void {
  try {
    secureStorage.setItem(KEY_SEEN, '1');
  } catch (e) { console.error("[Caught Error]", e); }
}
