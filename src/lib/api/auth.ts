import { requireSupabaseClient } from '@/lib/supabase/client';

export async function signInWithPassword(email: string, password: string) {
  const sb = requireSupabaseClient();
  const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
  return data;
}

export async function signOutUser() {
  const sb = requireSupabaseClient();
  const { error } = await sb.auth.signOut();
  if (error) throw error;
}
