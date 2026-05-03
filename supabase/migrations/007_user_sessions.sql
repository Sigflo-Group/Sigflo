create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_identifier text not null,
  step_up_verified_at timestamptz,
  revoked_at timestamptz,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_sessions_user_session_key unique (user_id, session_identifier)
);
