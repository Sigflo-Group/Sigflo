import { requireSupabaseClient } from '@/lib/supabase/client';

export async function getSupabaseAccessToken(): Promise<string | null> {
  try {
    const sb = requireSupabaseClient();
    const { data } = await sb.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

export async function authHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const token = await getSupabaseAccessToken();
  return {
    'Content-Type': 'application/json',
    ...(extra ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
