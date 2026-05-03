const KEY_SEEN = 'sigflo_onboarding_connect_seen';

/** User finished the optional “link your exchange” step (linked, skipped, or closed the demo walkthrough). */
export function isExchangeConnectOnboardingSeen(): boolean {
  try {
    return window.localStorage.getItem(KEY_SEEN) === '1';
  } catch {
    return true;
  }
}

export function markExchangeConnectOnboardingSeen(): void {
  try {
    window.localStorage.setItem(KEY_SEEN, '1');
  } catch {
    /* ignore */
  }
}
