create extension if not exists "pgcrypto";

create table if not exists pools (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null,
  code varchar(64) not null unique,
  created_at timestamptz not null default now()
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references pools(id) on delete cascade,
  name varchar(120) not null,
  created_at timestamptz not null default now()
);

create table if not exists brackets (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references pools(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  champion_team_id varchar(80) not null,
  group_picks jsonb not null,
  knockout_picks jsonb not null,
  points integer not null default 0,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists brackets_pool_id_idx on brackets(pool_id);
create index if not exists brackets_player_id_idx on brackets(player_id);
create index if not exists players_pool_id_idx on players(pool_id);
