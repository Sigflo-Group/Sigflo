create table if not exists public.user_security_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  step_up_required boolean not null default true,
  one_tap_enabled boolean not null default false,
  mfa_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
