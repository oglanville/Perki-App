-- 03_full_replace.sql
-- Full replace of the perks catalogue from staging, FK-safe (no TRUNCATE).
-- Run 05_validation_checks.sql FIRST and confirm it is clean. Wrap in a transaction so you can ROLLBACK.

begin;

-- 1. Upsert every row from the file into perks (insert new, update existing by perk_id).
insert into public.perks (
  perk_id, provider, membership, tier, feature, titlegroup, title, description, category,
  reset_period, next_reset_date, usage_limit, usage_notes, source_url, last_verified,
  popularity, icon_provider_url, icon_membership_url, created_at, emoji, price
)
select
  perk_id, provider, membership, tier, feature, titlegroup, title, description, category,
  coalesce(reset_period,'NONE'), next_reset_date, coalesce(usage_limit,''), coalesce(usage_notes,''),
  coalesce(source_url,''), coalesce(last_verified, current_date),
  coalesce(popularity,'Unknown'), coalesce(icon_provider_url,''), coalesce(icon_membership_url,''),
  coalesce(created_at, now()), emoji, coalesce(price,0)
from public.perks_import
on conflict (perk_id) do update set
  provider            = excluded.provider,
  membership          = excluded.membership,
  tier                = excluded.tier,
  feature             = excluded.feature,
  titlegroup          = excluded.titlegroup,
  title               = excluded.title,
  description         = excluded.description,
  category            = excluded.category,
  reset_period        = excluded.reset_period,
  next_reset_date     = excluded.next_reset_date,
  usage_limit         = excluded.usage_limit,
  usage_notes         = excluded.usage_notes,
  source_url          = excluded.source_url,
  last_verified       = excluded.last_verified,
  popularity          = excluded.popularity,
  icon_provider_url   = excluded.icon_provider_url,
  icon_membership_url = excluded.icon_membership_url,
  emoji               = excluded.emoji,
  price               = excluded.price;

-- 2. Remove perks no longer in the file (e.g. American Express).
--    NOTE: cascades to user_perk_usage for those perk_ids (ON DELETE CASCADE).
--    Review the list first:
--    select perk_id, provider from public.perks
--    where perk_id not in (select perk_id from public.perks_import) order by provider;
delete from public.perks
where perk_id not in (select perk_id from public.perks_import);

-- 3. Confirm counts, then COMMIT (or ROLLBACK if wrong).
-- select count(*) from public.perks;  -- should equal rows in perks_import

commit;
-- rollback;   -- use instead of commit if anything looks off
