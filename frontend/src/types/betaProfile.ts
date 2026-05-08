/** Row in `public.profiles` — see `docs/supabase-profiles-beta.md` for schema + RLS. */
export type BetaProfileRow = {
  id: string;
  email: string;
  approved: boolean;
  created_at: string;
};
