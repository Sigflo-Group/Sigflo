import { createClient } from '@supabase/supabase-js';

function supabaseUrl(env) {
  return (env.SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? '').trim();
}

function supabaseAnonKey(env) {
  return (env.SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_ANON_KEY ?? '').trim();
}

/**
 * @param {string | null | undefined} authorizationHeader
 * @param {NodeJS.ProcessEnv} env
 * @returns {Promise<{ ok: true, userId: string, email?: string } | { ok: false, statusCode: number, error: string }>}
 */
export async function verifySupabaseBearer(authorizationHeader, env) {
  const url = supabaseUrl(env);
  const anonKey = supabaseAnonKey(env);
  if (!url || !anonKey) {
    return {
      ok: false,
      statusCode: 503,
      error: 'Supabase is not configured (SUPABASE_URL + SUPABASE_ANON_KEY or VITE_*).',
    };
  }

  const token = String(authorizationHeader ?? '')
    .replace(/^Bearer\s+/i, '')
    .trim();
  if (!token) {
    return { ok: false, statusCode: 401, error: 'Missing Authorization: Bearer <access_token>.' };
  }

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser();
  if (userErr || !user) {
    return { ok: false, statusCode: 401, error: 'Invalid or expired session.' };
  }

  return { ok: true, userId: user.id, email: user.email ?? undefined };
}

/**
 * @param {import('aws-lambda').APIGatewayProxyEvent | { headers?: Record<string, string | undefined>, requestContext?: { identity?: { sourceIp?: string } } }} event
 */
export function getClientIp(event) {
  const h = event.headers ?? {};
  const forwarded = h['x-forwarded-for'] ?? h['X-Forwarded-For'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return event.requestContext?.identity?.sourceIp ?? 'unknown';
}
