-- 02_staging_load.sql
-- Create a staging table that mirrors the CSV exported from Perks_Rows.xlsx (sheet perks_rows),
-- then load the CSV into it. Run 01_schema_alter.sql first.

drop table if exists public.perks_import;

create table public.perks_import (
  perk_id              text,
  provider             text,
  membership           text,
  tier                 text,
  feature              text,
  titlegroup           text,
  title                text,
  description          text,
  category             text,
  reset_period         text,
  next_reset_date      date,
  usage_limit          text,
  usage_notes          text,
  source_url           text,
  last_verified        date,
  popularity           text,
  icon_provider_url    text,
  icon_membership_url  text,
  created_at           timestamptz,
  emoji                text,
  price                numeric(10,2)
);

-- LOAD THE DATA (choose one):
--
-- A) Supabase Studio: open public.perks_import → Insert → Import data from CSV.
--    Column order above matches the Perks_Rows.xlsx header exactly.
--
-- B) psql / COPY (server-side file):
-- \copy public.perks_import from 'Perks_Rows.csv' with (format csv, header true);

-- Sanity after load:
-- select count(*) as rows_loaded from public.perks_import;   -- expect 288 (pre Lidl/O2)
