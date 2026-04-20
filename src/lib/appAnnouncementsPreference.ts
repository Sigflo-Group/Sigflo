const STORAGE_KEY = 'sigflo-app-announcements-enabled';

/** Same-tab listeners (storage event only fires across tabs). */
export const APP_ANNOUNCEMENTS_PREF_EVENT = 'sigflo-app-announcements-pref';

/**
 * When `false`, {@link GlobalAnnouncementHost} ignores all announcements (bias, Exit AI, etc.):
 * no in-app banners, haptics, or `Notification` calls. Default is on (`true`).
 */
export function readAppAnnouncementsEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
}

export function setAppAnnouncementsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (enabled) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, 'false');
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new Event(APP_ANNOUNCEMENTS_PREF_EVENT));
}

export function subscribeAppAnnouncementsPref(onStoreChange: () => void): () => void {
  const fn = () => onStoreChange();
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(APP_ANNOUNCEMENTS_PREF_EVENT, fn);
  window.addEventListener('storage', fn);
  return () => {
    window.removeEventListener(APP_ANNOUNCEMENTS_PREF_EVENT, fn);
    window.removeEventListener('storage', fn);
  };
}
