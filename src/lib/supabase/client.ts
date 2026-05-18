import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  // Keep runtime throw explicit for misconfigured deployments.
  // This file intentionally never accepts a service role key.
  // eslint-disable-next-line no-console
  console.warn('[auth] Supabase browser client is not configured.');
}

export const supabaseClient: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          flowType: 'pkce',
        },
      })
    : null;

export function requireSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    throw new Error('Supabase client is not configured.');
  }
  return supabaseClient;
}
