create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  category text not null check (category in ('bug', 'feature', 'signal_quality', 'exchange_issue', 'general')),
  message text not null,
  screenshot_url text,
  route text,
  browser_info jsonb not null default '{}',
  active_exchange text,
  app_version text,
  created_at timestamptz not null default now()
);

create index if not exists feedback_user_id_idx on feedback (user_id);
create index if not exists feedback_category_idx on feedback (category);
create index if not exists feedback_created_at_idx on feedback (created_at desc);

alter table feedback enable row level security;

create policy "Users can insert their own feedback"
  on feedback for insert
  with check (user_id = auth.uid()::text);

create policy "Users can view their own feedback"
  on feedback for select
  using (user_id = auth.uid()::text);
