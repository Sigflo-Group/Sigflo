/** Placeholder Android / Play Store wiring — replace URLs when the listing is live. */
export const ANDROID_APP_CONFIG = {
  /** Play Console application id (placeholder until published). */
  packageName: import.meta.env.VITE_ANDROID_PACKAGE_NAME?.trim() || 'group.sigflo.app',
  /**
   * Full Play Store listing URL. Empty = placeholder mode (in-app actions show “coming soon”).
   * Example: https://play.google.com/store/apps/details?id=group.sigflo.app
   */
  playStoreListingUrl: import.meta.env.VITE_ANDROID_PLAY_STORE_URL?.trim() || '',
  /** Shown in Account → Android app. Bump with each store release. */
  installedVersionLabel: import.meta.env.VITE_APP_VERSION?.trim() || '0.0.1',
} as const;

export function isAndroidUserAgent(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /android/i.test(navigator.userAgent);
}

export function isAndroidPlayStoreConfigured(): boolean {
  return ANDROID_APP_CONFIG.playStoreListingUrl.length > 0;
}

/** Canonical update / listing URL for the Play Store app page. */
export function resolveAndroidPlayStoreUrl(): string {
  const configured = ANDROID_APP_CONFIG.playStoreListingUrl;
  if (configured) return configured;
  const id = encodeURIComponent(ANDROID_APP_CONFIG.packageName);
  return `https://play.google.com/store/apps/details?id=${id}`;
}

export const ANDROID_APP_PLACEHOLDER_COPY = {
  updateSoon:
    'Play Store updates are not linked yet. When the Android app is listed, this opens Google Play to install the latest version.',
  uninstallSoon:
    'To remove Sigflo from your phone, uninstall it from Android Settings or Google Play. Account and exchange data are managed separately in Account above.',
} as const;
