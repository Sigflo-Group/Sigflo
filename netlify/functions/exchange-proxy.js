import { ensureRootEnvLoaded } from './lib/load-root-env.mjs';

const rawOrigin = (
  process.env.BACKEND_API_ORIGIN ?? process.env.VITE_BACKEND_API_BASE ?? ''
).replace(/\/+$/, '').replace(/\/api$/, '');
const BACKEND_ORIGIN = rawOrigin && !rawOrigin.startsWith('http') ? `https://${rawOrigin}` : rawOrigin;

function buildTargetUrl(event) {
  const origPath = event.path
    .replace(/^\/\.netlify\/functions\/exchange-proxy/, '')
    .replace(/^\/api\/exchange/, '');
  if (!origPath || origPath.includes('..')) return null;

  const base = new URL(`${BACKEND_ORIGIN}/api/exchange/`);
  const url = new URL(`.${origPath.startsWith('/') ? origPath : `/${origPath}`}`, base);
  if (!url.pathname.startsWith('/api/exchange/') && url.pathname !== '/api/exchange') {
    return null;
  }

  const qs =
    event.rawQuery != null && String(event.rawQuery).length > 0
      ? `?${String(event.rawQuery)}`
      : event.queryStringParameters
        ? `?${new URLSearchParams(event.queryStringParameters).toString()}`
        : '';
  return `${url.origin}${url.pathname}${qs}`;
}

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

  const targetUrl = buildTargetUrl(event);
  if (!targetUrl) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid exchange proxy path.' }),
    };
  }

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

  const hasBody = event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD' && event.body;
  if (hasBody && !headers['content-type'] && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(targetUrl, {
      method: event.httpMethod,
      headers,
      body: hasBody ? event.body : undefined,
    });

    const body = await res.text();
    return {
      statusCode: res.status,
      headers: {
        'Content-Type': res.headers.get('content-type') ?? 'application/json',
      },
      body,
    };
  } catch {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Exchange API is temporarily unreachable. Try again shortly.',
      }),
    };
  }
};
