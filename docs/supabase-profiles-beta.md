# Supabase `profiles` (open beta)

Sigflo is in **open beta**: the SPA does **not** gate routes on `profiles.approved`. Any signed-in user can use the app.

## Optional admin tooling

`POST /api/admin/beta` (Netlify function) can still list or flip `profiles.approved` for internal ops. That is **not** required for normal users.

Configure only if you use it:

- `SUPABASE_SERVICE_ROLE_KEY`
- `SIGFLO_BETA_ADMIN_EMAILS` or `SIGFLO_BETA_ADMIN_USER_IDS`

See [NETLIFY.md](./NETLIFY.md).

## Legacy `approved` column

If your project already has `public.profiles.approved`, you can leave it (defaults are fine) or drop it when convenient:

```sql
-- optional cleanup
alter table public.profiles drop column if exists approved;
```

No migration is shipped for `approved` in this repo anymore.
