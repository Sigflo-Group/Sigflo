/**
 * Bybit asset / wallet entry points. Paths change by region and product.
 * Offer a few options in the UI — Help always resolves.
 */

function readEnvString(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function withQueryParams(baseHref: string, params: Record<string, string | null>): string {
  try {
    const url = new URL(baseHref);
    Object.entries(params).forEach(([key, value]) => {
      if (!value) return;
      url.searchParams.set(key, value);
    });
    return url.toString();
  } catch {
    return baseHref;
  }
}

function normalizeExternalHref(value: string | null, fallback: string): string {
  if (!value) return fallback;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return fallback;
    return url.toString();
  } catch {
    return fallback;
  }
}

const BYBIT_AFFILIATE_CODE = readEnvString(import.meta.env.VITE_BYBIT_AFFILIATE_CODE);
const MEXC_AFFILIATE_CODE = readEnvString(import.meta.env.VITE_MEXC_AFFILIATE_CODE);
const BYBIT_AFFILIATE_SIGNUP_OVERRIDE = readEnvString(import.meta.env.VITE_BYBIT_AFFILIATE_SIGNUP_URL);
const MEXC_AFFILIATE_SIGNUP_OVERRIDE = readEnvString(import.meta.env.VITE_MEXC_AFFILIATE_SIGNUP_URL);

/** Primary Assets entry (user hub). */
export const BYBIT_APP_ASSETS_HOME_HREF = 'https://www.bybit.com/user/assets/home/';

/** Logged-in deposit / top-up flow (redirects to login if needed). */
export const BYBIT_DEPOSIT_HREF = 'https://www.bybit.com/user/assets/deposit';

/** MEXC spot / funding deposit (logged-in). */
export const MEXC_DEPOSIT_HREF = 'https://www.mexc.com/assets/deposit';

/** Bybit API key management page. */
export const BYBIT_API_KEYS_HREF = 'https://www.bybit.com/app/user/api-management';

/** MEXC API key management page. */
export const MEXC_API_KEYS_HREF = 'https://www.mexc.com/user/openapi';

/** Bybit sign-up link (uses affiliate env config when provided). */
export const BYBIT_SIGN_UP_HREF = normalizeExternalHref(
  BYBIT_AFFILIATE_SIGNUP_OVERRIDE,
  withQueryParams('https://www.bybit.com/en/sign-up', {
    ref: BYBIT_AFFILIATE_CODE,
    ref_code: BYBIT_AFFILIATE_CODE,
  }),
);

/** MEXC sign-up link (uses affiliate env config when provided). */
export const MEXC_SIGN_UP_HREF = normalizeExternalHref(
  MEXC_AFFILIATE_SIGNUP_OVERRIDE,
  withQueryParams('https://www.mexc.com/register', {
    inviteCode: MEXC_AFFILIATE_CODE,
  }),
);

/** Alternate assets route (exchange index) when the `/app/` hub misbehaves. */
export const BYBIT_USER_ASSETS_EXCHANGE_HREF = 'https://www.bybit.com/user/assets/exchange/index';

/** Official help — always loads; use if every deep link 404s or redirects oddly. */
export const BYBIT_TRANSFER_HELP_HREF =
  'https://www.bybit.com/en/help-center/article/How-to-Transfer-Assets-on-Bybit';

/** Default for callers that pass a single href into the trade panel. */
export const BYBIT_ASSET_TRANSFER_HREF = BYBIT_APP_ASSETS_HOME_HREF;
