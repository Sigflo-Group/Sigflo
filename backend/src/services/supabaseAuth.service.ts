import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify } from 'jose';
import { env } from '../config/env.js';

export type VerifiedAuthUser = {
  id: string;
  email?: string;
  claims: Record<string, unknown>;
};

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

// Cached at module level so the JWKS is fetched once and reused across requests.
let cachedJwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function getJwks(): ReturnType<typeof createRemoteJWKSet> | null {
  if (!env.SUPABASE_URL) return null;
  if (!cachedJwks) {
    const base = normalizeUrl(env.SUPABASE_URL);
    cachedJwks = createRemoteJWKSet(
      new URL(`${base}/auth/v1/.well-known/jwks.json`),
      { timeoutDuration: 5_000, cacheMaxAge: 300_000 }, // re-fetch every 5 min to handle key rotation
    );
  }
  return cachedJwks;
}

async function verifyWithHs256(token: string): Promise<VerifiedAuthUser | null> {
  if (!env.SUPABASE_JWT_SECRET) return null;
  try {
    const secret = new TextEncoder().encode(env.SUPABASE_JWT_SECRET);
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    const id = typeof payload.sub === 'string' ? payload.sub : null;
    if (!id) return null;
    return { id, email: typeof payload.email === 'string' ? payload.email : undefined, claims: payload as Record<string, unknown> };
  } catch {
    return null;
  }
}

/** Supabase asymmetric JWTs (RS256 legacy, ES256 current default on new projects). */
const JWKS_ALGORITHMS = ['RS256', 'ES256'] as const;

async function verifyWithJwks(token: string): Promise<VerifiedAuthUser | null> {
  const jwks = getJwks();
  if (!jwks) return null;
  try {
    const base = normalizeUrl(env.SUPABASE_URL!);
    const { payload } = await jwtVerify(token, jwks, { algorithms: [...JWKS_ALGORITHMS] });
    const iss = typeof payload.iss === 'string' ? payload.iss : '';
    if (iss && !iss.startsWith(`${base}/auth/v1`)) return null;
    const id = typeof payload.sub === 'string' ? payload.sub : null;
    if (!id) return null;
    return { id, email: typeof payload.email === 'string' ? payload.email : undefined, claims: payload as Record<string, unknown> };
  } catch {
    return null;
  }
}

export async function verifySupabaseAccessToken(token: string): Promise<VerifiedAuthUser | null> {
  let alg: string | undefined;
  try {
    alg = decodeProtectedHeader(token).alg;
  } catch {
    return null;
  }

  if (alg === 'RS256' || alg === 'ES256') {
    return verifyWithJwks(token);
  }
  if (alg === 'HS256') {
    return verifyWithHs256(token);
  }
  return null;
}
