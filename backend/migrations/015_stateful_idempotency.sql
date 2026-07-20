alter table idempotency_keys
  add column if not exists request_hash text,
  add column if not exists status text not null default 'processing',
  add column if not exists response_json jsonb,
  add column if not exists error_text text,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'idempotency_keys_status_check'
  ) then
    alter table idempotency_keys
      add constraint idempotency_keys_status_check
      check (status in ('processing', 'succeeded', 'failed'));
  end if;
end $$;

create index if not exists idempotency_keys_expires_at_idx
  on idempotency_keys (expires_at);
