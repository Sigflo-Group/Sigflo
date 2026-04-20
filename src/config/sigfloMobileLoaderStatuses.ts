/** Preset copy for {@link SigfloMobileLoader} — feed / app boot. */
export const SIGFLO_MOBILE_LOADER_FEED_STATUSES: string[] = [
  'Loading workspace',
  'Refreshing market data',
  'Preparing signals',
];

/** Preset copy for auth flows (callback, session restore). */
export const SIGFLO_MOBILE_LOADER_AUTH_STATUSES: string[] = [
  'Securing session',
  'Loading account',
  'Verifying access',
];

/** Preset copy for trade workspace — pass into `SigfloMobileLoader` where you gate the trade UI. */
export const SIGFLO_MOBILE_LOADER_TRADE_STATUSES: string[] = [
  'Loading position',
  'Refreshing chart',
  'Preparing execution tools',
];
