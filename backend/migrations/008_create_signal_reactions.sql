create table if not exists signal_reactions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  signal_id text not null,
  pair text not null,
  side text not null,
  setup_type text not null,
  setup_score integer not null,
  risk_tag text,
  reaction text not null check (reaction in ('helpful', 'not_helpful')),
  created_at timestamptz not null default now(),
  unique(user_id, signal_id)
);

create index if not exists signal_reactions_user_id_idx on signal_reactions (user_id);
create index if not exists signal_reactions_signal_id_idx on signal_reactions (signal_id);
create index if not exists signal_reactions_created_at_idx on signal_reactions (created_at desc);

alter table signal_reactions enable row level security;

create policy "Users can insert their own reactions"
  on signal_reactions for insert
  with check (user_id = auth.uid()::text);

create policy "Users can view their own reactions"
  on signal_reactions for select
  using (user_id = auth.uid()::text);
