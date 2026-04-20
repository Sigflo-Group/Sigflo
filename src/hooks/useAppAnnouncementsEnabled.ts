import { useSyncExternalStore } from 'react';
import { readAppAnnouncementsEnabled, subscribeAppAnnouncementsPref } from '@/lib/appAnnouncementsPreference';

export function useAppAnnouncementsEnabled(): boolean {
  return useSyncExternalStore(subscribeAppAnnouncementsPref, readAppAnnouncementsEnabled, readAppAnnouncementsEnabled);
}
