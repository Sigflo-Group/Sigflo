import { createRemoteJWKSet, decodeJwt, decodeProtectedHeader, jwtVerify } from 'jose';
import { env } from '../config/env.js';

export type VerifiedAuthUser = {
  id: string;
  email?: string;
  claims: Record<string, unknown>;
};

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

/** Supabase asymmetric JWTs (RS256 legacy, ES256 current default on new projects). */
const JWKS_ALGORITHMS = ['RS256', 'ES256'] as const;

const jwksByUrl = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function getJwksForUrl(jwksUrl: URL): ReturnType<typeof createRemoteJWKSet> {
  const key = jwksUrl.toString();
  let cached = jwksByUrl.get(key);
  if (!cached) {
    cached = createRemoteJWKSet(jwksUrl, {
      timeoutDuration: 5_000,
      cacheMaxAge: 300_000,
    });
    jwksByUrl.set(key, cached);
  }
  return cached;
}

/** Only trust Supabase-hosted issuers when deriving JWKS from the token itself. */
function supabaseIssuerJwksUrl(iss: string): URL | null {
  try {
    const issuer = new URL(iss);
    if (!issuer.hostname.endsWith('.supabase.co')) return null;
    const base = normalizeUrl(iss);
    if (!base.endsWith('/auth/v1')) return null;
    return new URL(`${base}/.well-known/jwks.json`);
  } catch {
    return null;
  }
}

function resolveJwksUrl(token: string): URL | null {
  let iss: string | undefined;
  try {
    const payload = decodeJwt(token);
    iss = typeof payload.iss === 'string' ? payload.iss : undefined;
  } catch {
    return null;
  }

  if (env.SUPABASE_URL) {
    const base = normalizeUrl(env.SUPABASE_URL);
    if (iss && !iss.startsWith(`${base}/auth/v1`)) return null;
    return new URL(`${base}/auth/v1/.well-known/jwks.json`);
  }

  if (iss) return supabaseIssuerJwksUrl(iss);
  return null;
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

async function verifyWithJwks(token: string): Promise<VerifiedAuthUser | null> {
  const jwksUrl = resolveJwksUrl(token);
  if (!jwksUrl) return null;
  try {
    const jwks = getJwksForUrl(jwksUrl);
    const { payload } = await jwtVerify(token, jwks, { algorithms: [...JWKS_ALGORITHMS] });
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
