create table if not exists match_results (
  id uuid primary key default gen_random_uuid(),
  match_id varchar(80) not null,
  provider varchar(40) not null default 'manual',
  provider_match_id varchar(120),
  stage varchar(40) not null,
  status varchar(40) not null,
  home_team_id varchar(80) not null,
  away_team_id varchar(80) not null,
  home_score integer,
  away_score integer,
  winner_team_id varchar(80),
  started_at timestamp with time zone,
  updated_at timestamp with time zone not null default now()
);

create unique index if not exists match_results_match_id_unique
on match_results(match_id);
