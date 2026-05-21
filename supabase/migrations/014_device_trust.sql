-- Device trust records: fingerprint-based recognition across sessions.
-- Allows Sigflo to recognize returning browsers and surface "new device" alerts.
create table if not exists public.device_trust (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  device_fingerprint text not null,
  device_label text,
  trusted_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now(),
  constraint device_trust_user_fingerprint_key unique (user_id, device_fingerprint)
);

alter table public.device_trust enable row level security;

drop policy if exists device_trust_select_own on public.device_trust;
create policy device_trust_select_own on public.device_trust
  for select using (user_id = auth.uid());

drop policy if exists device_trust_update_own on public.device_trust;
create policy device_trust_update_own on public.device_trust
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, update on table public.device_trust to authenticated;
revoke insert, delete on table public.device_trust from authenticated;

-- Key rotation history: immutable append-only log of credential replacement events.
create table if not exists public.key_rotation_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  broker_account_id uuid references public.broker_accounts (id) on delete set null,
  exchange text not null,
  rotated_at timestamptz not null default now(),
  reason text,
  initiated_by text not null default 'user',
  ip_address text,
  user_agent text
);

alter table public.key_rotation_log enable row level security;

drop policy if exists key_rotation_log_select_own on public.key_rotation_log;
create policy key_rotation_log_select_own on public.key_rotation_log
  for select using (user_id = auth.uid());

grant select on table public.key_rotation_log to authenticated;
revoke insert, update, delete on table public.key_rotation_log from authenticated;

-- Permission validation snapshots: stores the last known permission state per account.
create table if not exists public.permission_snapshots (
  id uuid primary key default gen_random_uuid(),
  broker_account_id uuid not null references public.broker_accounts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  exchange text not null,
  read_only boolean not null,
  withdrawals_enabled boolean not null,
  can_read_balances boolean not null,
  can_read_positions boolean not null,
  has_withdrawal_risk boolean not null generated always as (withdrawals_enabled) stored,
  captured_at timestamptz not null default now(),
  raw_permissions jsonb not null default '{}'::jsonb
);

alter table public.permission_snapshots enable row level security;

drop policy if exists permission_snapshots_select_own on public.permission_snapshots;
create policy permission_snapshots_select_own on public.permission_snapshots
  for select using (user_id = auth.uid());

grant select on table public.permission_snapshots to authenticated;
revoke insert, update, delete on table public.permission_snapshots from authenticated;

-- Risk acknowledgement log: records that the user explicitly accepted risk terms.
create table if not exists public.risk_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  acknowledged_version text not null,
  acknowledged_at timestamptz not null default now(),
  ip_address text,
  user_agent text
);

alter table public.risk_acknowledgements enable row level security;

drop policy if exists risk_acknowledgements_select_own on public.risk_acknowledgements;
create policy risk_acknowledgements_select_own on public.risk_acknowledgements
  for select using (user_id = auth.uid());

grant select on table public.risk_acknowledgements to authenticated;
revoke insert, update, delete on table public.risk_acknowledgements from authenticated;

-- Index audit_logs by created_at for the security center viewer.
create index if not exists audit_logs_user_created_idx
  on public.audit_logs (user_id, created_at desc);

create index if not exists key_rotation_log_user_idx
  on public.key_rotation_log (user_id, rotated_at desc);
