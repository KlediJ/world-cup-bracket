alter table brackets
add column if not exists official_knockout_picks jsonb not null default '{}';

alter table brackets
add column if not exists official_champion_team_id varchar(80);

alter table brackets
add column if not exists official_knockout_submitted_at timestamp with time zone;
