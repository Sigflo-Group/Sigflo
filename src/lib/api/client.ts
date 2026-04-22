import { requireSupabaseClient } from '@/lib/supabase/client';

function resolveApiBase(): string {
  const raw = import.meta.env.VITE_BACKEND_API_BASE?.trim();
  if (!raw) return '/api';
  const trimmed = raw.replace(/\/+$/, '');
  if (/^https?:\/\/[^/]+$/i.test(trimmed)) return `${trimmed}/api`;
  return trimmed;
}

const API_BASE = resolveApiBase();

export class ApiError extends Error {
  status: number;
  requestId?: string;
  constructor(message: string, status: number, requestId?: string) {
    super(message);
    this.status = status;
    this.requestId = requestId;
  }
}

async function getAccessToken(): Promise<string | null> {
  const sb = requireSupabaseClient();
  const { data } = await sb.auth.getSession();
  return data.session?.access_token ?? null;
}

function safeMessage(status: number): string {
  if (status === 401) return 'Session expired. Please sign in again.';
  if (status === 403) return 'You are not allowed to perform this action.';
  if (status >= 500) return 'Service unavailable. Please retry shortly.';
  return 'Request failed.';
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const requestId = res.headers.get('x-request-id') ?? undefined;

  if (!res.ok) {
    let message = safeMessage(res.status);
    try {
      const ct = res.headers.get('content-type') ?? '';
      if (ct.includes('application/json')) {
        const body = (await res.json()) as { error?: string; message?: string };
        if (typeof body.error === 'string' && body.error.trim()) message = body.error.trim();
        if (typeof body.message === 'string' && body.message.trim()) message = body.message.trim();
      }
    } catch {
      // keep sanitized fallback
    }
    throw new ApiError(message, res.status, requestId);
  }

  if (res.status === 204) return undefined as T;
  try {
    return (await res.json()) as T;
  } catch {
    throw new ApiError('Unexpected response format.', 500, requestId);
  }
}
