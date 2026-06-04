import { ensureRootEnvLoaded } from './lib/load-root-env.mjs';

const BACKEND_ORIGIN = (
  process.env.BACKEND_API_ORIGIN ?? process.env.VITE_BACKEND_API_BASE ?? ''
).replace(/\/+$/, '').replace(/\/api$/, '');

export const handler = async (event) => {
  ensureRootEnvLoaded();

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204 };
  }

  if (!BACKEND_ORIGIN) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error:
          'Exchange API proxy not configured — set BACKEND_API_ORIGIN in Netlify env vars (e.g. https://your-app.up.railway.app)',
      }),
    };
  }

  const origPath = event.path.replace(/^\/\.netlify\/functions\/exchange-proxy/, '').replace(/^\/api\/exchange/, '');
  const qs = event.rawQuery ?? event.queryStringParameters
    ? '?' + new URLSearchParams(event.queryStringParameters ?? {}).toString()
    : '';
  const targetUrl = `${BACKEND_ORIGIN}/api/exchange${origPath}${qs}`;

  const allowHeaders = new Set([
    'authorization',
    'content-type',
    'accept',
    'x-request-id',
    'x-idempotency-key',
  ]);
  const headers = Object.fromEntries(
    Object.entries(event.headers ?? {}).filter(([k]) => allowHeaders.has(k.toLowerCase())),
  );

  try {
    const res = await fetch(targetUrl, {
      method: event.httpMethod,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD' && event.body ? event.body : undefined,
    });

    const body = await res.text();
    return {
      statusCode: res.status,
      headers: {
        'Content-Type': res.headers.get('content-type') ?? 'application/json',
      },
      body,
    };
  } catch (e) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Exchange API is temporarily unreachable. Try again shortly.',
      }),
    };
  }
};
