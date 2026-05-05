-- Opportunities for Bots / Trade review (Supabase persistence).
-- Numbered 011 because 001_profiles.sql etc. already exist in this repo.

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  pair text not null,
  direction text not null check (direction in ('long', 'short')),
  setup_type text not null,
  strategy_type text not null,
  source_engine text not null,
  status text not null check (status in (
    'watching',
    'building',
    'ready',
    'triggered',
    'managing',
    'completed',
    'invalidated',
    'cooling_off'
  )),
  score integer not null check (score >= 0 and score <= 100),
  thesis text not null,
  rationale text not null,
  entry_zone text,
  invalidation text,
  targets text[] not null default '{}',
  timeframe_alignment text[] not null default '{}',
  freshness_sec integer not null default 0,
  risk_label text not null check (risk_label in ('low', 'medium', 'high')),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.opportunities enable row level security;

create policy "Anyone can read demo opportunities"
on public.opportunities
for select
using (is_demo = true);

create policy "Authenticated users can read non-demo opportunities"
on public.opportunities
for select
to authenticated
using (is_demo = false);
