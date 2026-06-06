import { describe, expect, it } from 'vitest';
import {
  ANDROID_APP_CONFIG,
  isAndroidPlayStoreConfigured,
  resolveAndroidPlayStoreUrl,
} from '@/config/androidApp';

describe('androidApp config', () => {
  it('uses placeholder package id when env unset', () => {
    expect(ANDROID_APP_CONFIG.packageName).toBeTruthy();
  });

  it('builds fallback Play Store URL from package name', () => {
    expect(resolveAndroidPlayStoreUrl()).toContain('play.google.com');
    expect(resolveAndroidPlayStoreUrl()).toContain(encodeURIComponent(ANDROID_APP_CONFIG.packageName));
  });

  it('reports placeholder mode when listing URL empty', () => {
    expect(isAndroidPlayStoreConfigured()).toBe(Boolean(ANDROID_APP_CONFIG.playStoreListingUrl));
  });
});
