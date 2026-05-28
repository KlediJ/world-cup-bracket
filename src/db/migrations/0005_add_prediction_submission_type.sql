alter table brackets
add column if not exists submission_type varchar(32) not null default 'classic';

alter table brackets
add column if not exists prediction_payload jsonb not null default '{}';
