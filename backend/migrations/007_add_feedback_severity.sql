alter table feedback add column if not exists severity text not null default 'normal' check (severity in ('cosmetic', 'annoying', 'blocking'));

create index if not exists feedback_severity_idx on feedback (severity);
