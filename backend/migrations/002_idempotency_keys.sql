create table if not exists idempotency_keys (
  key text primary key,
  expires_at timestamptz not null
);

create index if not exists idempotency_keys_expires_at_idx on idempotency_keys (expires_at);
