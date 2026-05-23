alter table feedback add column if not exists severity text not null default 'normal';
alter table feedback add constraint feedback_severity_check check (severity in ('normal', 'cosmetic', 'annoying', 'blocking'));

create index if not exists feedback_severity_idx on feedback (severity);
