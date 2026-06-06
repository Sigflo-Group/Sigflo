import { ensureRootEnvLoaded } from './lib/load-root-env.mjs';
import { runMarketNewsScan } from './lib/market-news-scan-core.mjs';
import { verifySupabaseBearer } from './lib/verify-supabase-auth.mjs';
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

  const rlKey = `news-scan:${auth.userId}`;
  if (!consumeRateLimit(rlKey, { windowMs: 60_000, max: 10 })) {
    return { statusCode: 429, body: JSON.stringify({ error: 'Too many news scan requests. Try again shortly.' }) };
  }

  try {
    const result = await runMarketNewsScan(event.body, process.env);
    if (result && typeof result === 'object' && result.ok === false) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      };
    }
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: false,
        error: e instanceof Error ? e.message : 'News scan failed.',
      }),
    };
  }
};
