import { ensureRootEnvLoaded } from './lib/load-root-env.mjs';
import { runMarketNewsScan } from './lib/market-news-scan-core.mjs';
import { verifySupabaseBearer, getClientIp } from './lib/verify-supabase-auth.mjs';
import { consumeRateLimit } from './lib/rate-limit.mjs';

export const handler = async (event) => {
  ensureRootEnvLoaded();

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204 };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const auth = await verifySupabaseBearer(event.headers?.authorization ?? event.headers?.Authorization, process.env);
  if (!auth.ok) {
    return { statusCode: auth.statusCode, body: JSON.stringify({ error: auth.error }) };
  }

  const rlKey = `news-scan:${auth.userId}:${getClientIp(event)}`;
  if (!consumeRateLimit(rlKey, { windowMs: 60_000, max: 10 })) {
    return { statusCode: 429, body: JSON.stringify({ error: 'Too many news scan requests. Try again shortly.' }) };
  }

  const result = await runMarketNewsScan(event.body, process.env);
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result),
  };
};
