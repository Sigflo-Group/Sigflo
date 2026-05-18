/**
 * Single Supabase browser client for the whole app.
 * All imports should use this file (`@/lib/supabase`) — the underlying
 * singleton lives in `@/lib/supabase/client.ts` and is shared with the
 * AuthProvider so there is exactly one SupabaseClient instance.
 */
export { supabaseClient as supabase, requireSupabaseClient } from '@/lib/supabase/client';

export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && key);
}
