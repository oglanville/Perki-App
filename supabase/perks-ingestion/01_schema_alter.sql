-- 01_schema_alter.sql
-- Add the 4 columns present in Perks_Rows.xlsx but missing from the perks table.
-- Idempotent: safe to run more than once.

alter table public.perks add column if not exists emoji       text;
alter table public.perks add column if not exists price       numeric(10,2) default 0;
alter table public.perks add column if not exists feature     text;
alter table public.perks add column if not exists titlegroup  text;

comment on column public.perks.emoji      is 'Display emoji for the perk (from source file).';
comment on column public.perks.price      is 'Perk monetary value / price, if applicable. 0 = none.';
comment on column public.perks.feature    is 'Source-file feature flag/grouping.';
comment on column public.perks.titlegroup is 'Source-file title grouping for collapsing related perks.';

-- Verify:
-- select column_name, data_type from information_schema.columns
-- where table_schema='public' and table_name='perks' order by ordinal_position;
