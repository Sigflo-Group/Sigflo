import { secureStorage } from '@/lib/storage';

const KEY = 'sigflo_feed_welcome_dismissed';

export function isFeedWelcomeDismissed(): boolean {
  try {
    return secureStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissFeedWelcome(): void {
  try {
    secureStorage.setItem(KEY, '1');
  } catch {
    // Ignore storage failures (private mode / blocked storage).
  }
}
