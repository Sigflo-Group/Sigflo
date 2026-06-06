import { secureStorage } from '@/lib/storage';

const KEY = 'sigflo_feed_walkthrough_seen';

export function isFeedWalkthroughSeen(): boolean {
  try {
    return secureStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function markFeedWalkthroughSeen(): void {
  try {
    secureStorage.setItem(KEY, '1');
  } catch {
    // Ignore storage failures (private mode / blocked storage).
  }
}
