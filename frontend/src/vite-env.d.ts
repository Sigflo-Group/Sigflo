/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Override market news scan API path (default `/api/ai/news-scan`). */
  readonly VITE_NEWS_SCAN_ENDPOINT?: string;
  /** Set to "false" to skip a second model call when grounded quick/deep output fails validation (saves API cost). */
  readonly VITE_AI_GROUNDED_RETRY_ON_INVALID?: string;
  readonly VITE_BACKEND_API_BASE?: string;
  readonly VITE_DEV_USER_ID?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /**
   * Canonical origin for Supabase OAuth / email redirect (e.g. https://www.sigflo.group).
   * Use when users hit apex then Netlify sends them to www — implicit hash tokens can be lost.
   */
  readonly VITE_AUTH_REDIRECT_ORIGIN?: string;
  /** Optional Bybit affiliate/referral code used to prefill signup links. */
  readonly VITE_BYBIT_AFFILIATE_CODE?: string;
  /** Optional MEXC affiliate/referral code used to prefill signup links. */
  readonly VITE_MEXC_AFFILIATE_CODE?: string;
  /** Optional full Bybit affiliate signup URL override (takes precedence over code). */
  readonly VITE_BYBIT_AFFILIATE_SIGNUP_URL?: string;
  /** Optional full MEXC affiliate signup URL override (takes precedence over code). */
  readonly VITE_MEXC_AFFILIATE_SIGNUP_URL?: string;
  /** Dev only: set to `app` to mimic `app.sigflo.group` routing (feed at `/`, landing at `/landing`). */
  readonly VITE_APP_HOST?: string;
  /** Display / store version label (Account → Android app). */
  readonly VITE_APP_VERSION?: string;
  /** Play Console package id, e.g. group.sigflo.app */
  readonly VITE_ANDROID_PACKAGE_NAME?: string;
  /** Full Play Store listing URL — enables live update link (omit for placeholder mode). */
  readonly VITE_ANDROID_PLAY_STORE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
