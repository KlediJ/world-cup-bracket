alter table brackets
add column if not exists third_place_advancers jsonb not null default '[]';
