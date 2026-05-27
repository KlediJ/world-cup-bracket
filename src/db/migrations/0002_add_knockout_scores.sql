alter table brackets
add column if not exists knockout_scores jsonb not null default '{}';
