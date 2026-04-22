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
  if (!env.SUPABASE_URL) return null;
  try {
    const base = normalizeUrl(env.SUPABASE_URL);
    const jwks = createRemoteJWKSet(new URL(`${base}/auth/v1/.well-known/jwks.json`));
    const { payload } = await jwtVerify(token, jwks);
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
  try {
    const hdr = decodeProtectedHeader(token);
    if (hdr.alg === 'RS256') {
      const rs = await verifyWithJwks(token);
      if (rs) return rs;
    }
  } catch {
    // ignore
  }
  return (await verifyWithHs256(token)) ?? (await verifyWithJwks(token));
}
