alter table players
add column if not exists email varchar(255);

update players
set email = lower(replace(name, ' ', '.')) || '+' || id::text || '@pending.local'
where email is null;

alter table players
alter column email set not null;

create unique index if not exists players_pool_email_unique on players(pool_id, email);
