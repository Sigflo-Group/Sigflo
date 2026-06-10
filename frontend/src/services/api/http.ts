import { supabase } from '@/lib/supabase';
import { sanitizeUserFacingHttpErrorMessage } from '@/lib/httpErrorMessage';

/**
 * Backend mounts integrations and portfolio under `/api/...` (see backend `server.ts`).
 * Must end with `/api` (no trailing slash). Common mistake: `http://localhost:8787` → 404 on `/integrations/...`.
 */
function resolveApiBase(): string {
  const raw = import.meta.env.VITE_BACKEND_API_BASE?.trim();
  if (raw) {
    const base = raw.replace(/\/+$/, '');
    if (/^https?:\/\/[^/]+$/i.test(base)) {
      return `${base}/api`;
    }
    return base;
  }
  /** Same-origin `/api` — Vite dev proxy, Netlify/Vercel rewrites, or reverse proxy to the Express backend. */
  return '/api';
}

const API_BASE = resolveApiBase();
const DEV_USER_ID = import.meta.env.VITE_DEV_USER_ID?.trim();

function looksLikeHtmlPayload(s: string): boolean {
  const t = s.trim();
  if (t.length === 0) return false;
  if (/^<\s*!doctype/i.test(t) || /^<\s*html/i.test(t)) return true;
  if (t.includes('<!DOCTYPE') || t.includes('<!doctype')) return true;
  if (t.includes('CloudFront') && t.includes('could not be satisfied')) return true;
  if (t.includes('<HTML') || t.includes('<html')) return true;
  return false;
}

function cdnBlockedMessage(status: number): string {
  return `HTTP ${status} — CDN blocked this request (e.g. CloudFront/WAF) before your API. Fix: set Netlify (or build) env VITE_BACKEND_API_BASE to your API origin (e.g. https://YOUR-SERVICE.up.railway.app with no /api suffix), redeploy, and ensure that host does not return HTML for /api/* — or proxy /api on the same domain as the SPA.`;
}

const REQUEST_TIMEOUT_MS = 15_000;
const SESSION_READ_TIMEOUT_MS = 5_000;

async function resolveAccessToken(forceRefresh = false): Promise<string | null> {
  if (!supabase) return null;

  if (forceRefresh) {
    const { data, error } = await supabase.auth.refreshSession();
    if (!error && data.session?.access_token) return data.session.access_token;
  }

  const sessionResult = await Promise.race([
    supabase.auth.getSession(),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), SESSION_READ_TIMEOUT_MS)),
  ]);
  const session = sessionResult?.data?.session ?? null;
  if (!session?.access_token) return null;

  const expiresAtMs = (session.expires_at ?? 0) * 1000;
  if (!forceRefresh && expiresAtMs > 0 && expiresAtMs <= Date.now() + 60_000) {
    return resolveAccessToken(true);
  }

  return session.access_token;
}

async function fetchApi(path: string, init: RequestInit | undefined, token: string | null): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    ...(init?.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (DEV_USER_ID) {
    headers['x-user-id'] = DEV_USER_ID;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error('Request timed out. Check that the backend is running and reachable.');
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  let token = await resolveAccessToken();
  let res = await fetchApi(path, init, token);
  if (res.status === 401 && supabase && token) {
    const refreshed = await resolveAccessToken(true);
    if (refreshed && refreshed !== token) {
      token = refreshed;
      res = await fetchApi(path, init, token);
    }
  }
  if (!res.ok) {
    const ct = res.headers.get('content-type') ?? '';
    let message = `Request failed: HTTP ${res.status}`;
    try {
      if (ct.includes('application/json')) {
        const body = (await res.json()) as { error?: string; message?: string };
        const errText = typeof body.error === 'string' ? body.error : typeof body.message === 'string' ? body.message : '';
        if (errText) {
          message = looksLikeHtmlPayload(errText) ? cdnBlockedMessage(res.status) : errText;
        }
      } else {
        const text = await res.text();
        const trimmed = text.trim();
        if (looksLikeHtmlPayload(trimmed)) {
          message = cdnBlockedMessage(res.status);
        } else if (trimmed.length > 0 && trimmed.length < 400) {
          message = `Request failed: HTTP ${res.status} — ${trimmed}`;
        }
      }
    } catch {
      // keep default message
    }
    throw new Error(sanitizeUserFacingHttpErrorMessage(message));
  }
  if (res.status === 204 || res.status === 304) return undefined as T;
  return (await res.json()) as T;
}
