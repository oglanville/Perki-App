-- ╔══════════════════════════════════════════════════════════════╗
-- ║  PERKI — Daily Digest schedule (7am Europe/London)           ║
-- ║  Run ONCE in the Supabase SQL Editor (Dashboard → SQL).      ║
-- ╚══════════════════════════════════════════════════════════════╝
--
-- Why two jobs: pg_cron runs in UTC and does not follow British Summer Time.
-- 07:00 London is 06:00 UTC in summer (BST) and 07:00 UTC in winter (GMT).
-- So we fire at BOTH 06:00 and 07:00 UTC; the daily-digest function guards on
-- the actual Europe/London hour and only sends when it is 7am there. Exactly
-- one run sends each day, with no DST drift.

-- ─────────────────────────────────────────────
-- 1. Extensions
-- ─────────────────────────────────────────────
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ─────────────────────────────────────────────
-- 2. One-time secret (do NOT commit the secret itself)
--    Store the cron secret in Vault so it stays out of git. It must match the
--    `cron_secret` environment variable set on the daily-digest Edge Function.
--
--      select vault.create_secret('<YOUR_CRON_SECRET>', 'daily_digest_cron_secret');
--
--    Update it later with:
--      select vault.update_secret(
--        (select id from vault.secrets where name = 'daily_digest_cron_secret'),
--        '<NEW_SECRET>');
-- ─────────────────────────────────────────────

-- ─────────────────────────────────────────────
-- 3. Clear any previous schedules (makes this migration idempotent)
-- ─────────────────────────────────────────────
do $$
declare j record;
begin
  for j in
    select jobid from cron.job
    where jobname in ('perki-daily-digest-0600', 'perki-daily-digest-0700')
  loop
    perform cron.unschedule(j.jobid);
  end loop;
end $$;

-- ─────────────────────────────────────────────
-- 4. Schedule both UTC runs
-- ─────────────────────────────────────────────
select cron.schedule('perki-daily-digest-0600', '0 6 * * *', $cron$
  select net.http_post(
    url     := 'https://iievmjsfpgixqdpuxbkg.supabase.co/functions/v1/daily-digest',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'daily_digest_cron_secret')
    ),
    body    := '{}'::jsonb
  );
$cron$);

select cron.schedule('perki-daily-digest-0700', '0 7 * * *', $cron$
  select net.http_post(
    url     := 'https://iievmjsfpgixqdpuxbkg.supabase.co/functions/v1/daily-digest',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'daily_digest_cron_secret')
    ),
    body    := '{}'::jsonb
  );
$cron$);

-- ─────────────────────────────────────────────
-- Handy
--   Verify:   select jobname, schedule, active from cron.job where jobname like 'perki-daily-digest-%';
--   Run log:  select * from cron.job_run_details order by start_time desc limit 10;
--   Remove:   select cron.unschedule('perki-daily-digest-0600');
--             select cron.unschedule('perki-daily-digest-0700');
-- ─────────────────────────────────────────────
