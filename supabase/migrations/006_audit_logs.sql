create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  request_id text,
  action text not null,
  object_type text,
  object_id text,
  ip_address text,
  user_agent text,
  outcome text not null,
  payload_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
