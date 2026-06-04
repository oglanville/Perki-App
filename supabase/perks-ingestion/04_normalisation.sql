-- 04_normalisation.sql
-- Run after 03_full_replace.sql. Standardises category casing and backfills popularity.

begin;

-- 1. Trim whitespace on key text fields.
update public.perks set
  category   = btrim(category),
  popularity = btrim(popularity);

-- 2. Backfill empty/missing popularity to the table default.
update public.perks
set popularity = 'Unknown'
where popularity is null or popularity = '';

-- 3. Category casing.
--    A full replace already drops the old lowercase seed categories (e.g. 'retail'),
--    so the file's Capitalised values become the standard. This step is a safety net that
--    Title-Cases any stray all-lowercase categories WITHOUT mangling known acronyms.
update public.perks p
set category = initcap(category)
where category = lower(category)               -- only touch all-lowercase strays
  and category not in ('ev');                  -- protect acronyms; extend list if needed

-- Acronym fix-ups (initcap would lowercase these):
update public.perks set category = 'EV' where lower(category) = 'ev';

-- 4. Review distinct categories by hand after running:
-- select category, count(*) from public.perks group by category order by category;

commit;
-- rollback;
