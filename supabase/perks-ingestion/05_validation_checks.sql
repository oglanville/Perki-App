-- 05_validation_checks.sql
-- Run against public.perks_import AFTER loading the CSV and BEFORE 03_full_replace.sql.
-- Each query should return ZERO rows unless noted. If any return rows, fix the file and re-load.

-- 1. Row count (expect 288 pre-Lidl/O2; higher once added).
select count(*) as total_rows from public.perks_import;

-- 2. Missing required fields (must be empty result).
select perk_id, provider, tier, title
from public.perks_import
where perk_id is null or btrim(perk_id) = ''
   or provider is null or btrim(provider) = ''
   or membership is null or btrim(membership) = ''
   or tier is null or btrim(tier) = ''
   or title is null or btrim(title) = ''
   or description is null or btrim(description) = ''
   or category is null or btrim(category) = '';

-- 3. Duplicate perk_id (must be empty).
select perk_id, count(*)
from public.perks_import
group by perk_id having count(*) > 1;

-- 4. Truncated perk_id ending in '-' (must be empty after fixing the 7 known cases).
select perk_id from public.perks_import where perk_id like '%-';

-- 5. Lidl + O2 present (expect 2 rows once added; 0 means not yet ingested).
select provider, count(*) from public.perks_import
where provider in ('Lidl','O2') group by provider;

-- 6. reset_period within allowed set (must be empty).
select distinct reset_period from public.perks_import
where reset_period not in ('NONE','ANNUALLY','MONTHLY','WEEKLY');

-- 7. next_reset_date required when reset_period <> 'NONE' (must be empty).
select perk_id, reset_period from public.perks_import
where reset_period <> 'NONE' and next_reset_date is null;

-- 8. Category casing review (eyeball: should be one consistent convention).
select category, count(*) from public.perks_import group by category order by category;

-- 9. price sanity — no negatives (must be empty).
select perk_id, price from public.perks_import where price < 0;

-- 10. Provider / tier overview (sanity vs expectations).
select provider, count(*) from public.perks_import group by provider order by provider;
select tier, count(*) from public.perks_import group by tier order by tier;
