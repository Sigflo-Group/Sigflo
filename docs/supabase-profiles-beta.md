# Supabase `profiles` table (beta access)

The app reads **`public.profiles.approved`** after sign-in. Run this in the Supabase SQL editor (or migrate via your usual process).

## Schema

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Signed-in users can read their own row.
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- First sign-in: client inserts own row (approved defaults to false).
create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);
```

## Approving users

Update in the SQL editor or via a trusted backend (service role), for example:

```sql
update public.profiles set approved = true where id = '<user-uuid>';
```

The waitlist screen includes **Check again** so the client re-fetches after `approved` is flipped.

## In-app approvals (Sigflo)

Use **Profile → Beta approvals** (`/admin/beta`). That calls **`POST /api/admin/beta`** on Netlify with the **service role** key so you don’t need a separate Lovable dashboard. Configure **`SUPABASE_SERVICE_ROLE_KEY`** and **`SIGFLO_BETA_ADMIN_EMAILS`** (see `docs/NETLIFY.md`). Admins listed there can use the app even before their own `profiles.approved` is set.

## Notes

- Do **not** grant `update` on `profiles` to `authenticated` if users should not self-approve.
- If the table or policies are missing, the app shows the waitlist UI with an error message until the schema is fixed.

## Troubleshooting (“I can’t log in”)

Supabase **auth** and **beta access** are separate:

1. **You see “You’re on the list.” / Early access**  
   You **are signed in**. The app is blocking the workspace until `profiles.approved` is `true`. In SQL (as admin):

   ```sql
   update public.profiles set approved = true
   where id = (select id from auth.users where email = 'you@example.com' limit 1);
   ```

   Then use **Check again** on that screen (or refresh).

2. **You see an error in the amber box on that screen**  
   The session is fine; **`profiles` queries failed** (missing table, RLS, wrong schema, etc.). Open DevTools → **Network**, find requests to `/rest/v1/profiles`, read the JSON `message` / `code`. Fix policies/table, then **Check again**.

3. **You never leave the Enter Sigflo / password / Google screen**  
   That’s **Auth** (wrong password, email not confirmed, redirect URL not in Supabase, etc.) — not the beta gate. Check Supabase **Authentication → Users** and **URL Configuration** redirect allow list.

4. **Stuck on “Checking access…”**  
   Usually a **hung or blocked** request to Supabase (network, ad blocker, CORS in odd setups). Check Network for `/rest/v1/profiles`.

### Privileges (if inserts/selects fail with permission errors)

```sql
grant usage on schema public to authenticated;
grant select, insert on table public.profiles to authenticated;
```
