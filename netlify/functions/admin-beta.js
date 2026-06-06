import { ensureRootEnvLoaded } from './lib/load-root-env.mjs';
import { runAdminBeta } from './lib/admin-beta-core.mjs';
import { verifySupabaseBearer } from './lib/verify-supabase-auth.mjs';
import { consumeRateLimit } from './lib/rate-limit.mjs';

export const handler = async (event) => {
  ensureRootEnvLoaded();

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204 };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const auth = await verifySupabaseBearer(event.headers?.authorization ?? event.headers?.Authorization, process.env);
  if (!auth.ok) {
    return {
      statusCode: auth.statusCode,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: auth.error }),
    };
  }

  const rlKey = `admin-beta:${auth.userId}`;
  if (!consumeRateLimit(rlKey, { windowMs: 60_000, max: 30 })) {
    return {
      statusCode: 429,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Too many admin requests. Try again shortly.' }),
    };
  }

  const result = await runAdminBeta(event.body, event.headers.authorization ?? event.headers.Authorization, process.env);

  return {
    statusCode: result.statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result.body),
  };
};
