# 🚀 PERKI — ROLLING TO-DO

_Pulled manually · Last updated: 2026-06-24 (rev 12) · Scheduled auto-send: OFF (update on request only)_

> 🎯 NORTH STAR: grow the Beehiiv weekly email list to 10,000 subscribers. Perki is a weekly personalised engine that saves people money (optimise + consolidate) and tells them how to use the perks they already pay for.

---

## ✅ DONE RECENTLY (to 2026-06-24)
- **7am email fixed** — the daily cron was firing but every call was rejected at the Supabase gateway with a 401 ("Invalid API key", a stale `sb_secret_` token), so the digest never ran and nothing sent. Rerouted the cron through the function's preview path using the project's valid anon key, targeted at Ollie, with the timeout raised from 1s to 30s. Tested end to end: 200, sent, and the email arrived.
- **Cadence + Status system** built across web, app and email (Weekly / Monthly / One-off + Have used / Have not used / Will not use); renewal-date logic kept dormant behind a flag; no user date inputs or displays.
- **Provider logos for every membership** — Clearbit → Simple Icons → Google favicon → initials fallback chain (web + app).
- **Marketplace tier → membership filter** — selecting a tier filters the membership chips; the tier persists on a compatible membership.
- **Daily digest reworked** + **gold Active / Inactive per-type dashboard counts**; send now reports Resend's real result.
- **20 memberships live** in the catalogue (145 rows). Specs written: Weekly savings engine, Daily digest update, Cadence/Status/Bundles. Beehiiv weekly email drafted.

---

## ☀️ TODAY — confirm and ship
- **⏰ Watch tomorrow's 7am run** *(in progress)* — the cron is fixed and tested; confirm the automatic 06:00 UTC / 07:00 BST send lands on its own. If it does not arrive, it is Hotmail/Resend deliverability (check Junk + Resend dashboard), not the cron.
- **🚀 Deploy everything** *(top priority)* — front-end (`del .git\index.lock` → `git add src/` → commit → push, Vercel auto-deploys) and the digest. Lots is built and bundle-verified but not live.
- **🟣 Proper digest send** — redeploy with `supabase functions deploy daily-digest --no-verify-jwt` + a matching `CRON_SECRET`, then switch the cron back to the production path to drop the `[PREVIEW]` subject prefix and support more than one recipient.

## 📅 THIS WEEK — strengthen the MVP
- **🗓️ Winter DST fix for the cron** — the single 06:00 UTC job is 07:00 BST now but 06:00 GMT in winter; before late October, move it to 07:00 UTC (or restore the production path + 7am-London guard with two jobs).
- **🧱 Bundles view (app surface)** — config + email prompts done; build the grouped Holiday / Cinema / Sports / Workday view.
- **💸 Wire Savings + Consolidation engines to real per-user data** — currently illustrative placeholders.
- **🔍 Verify the 19 flagged catalogue rows** — see Perki-NEEDS-VERIFY.md.
- **🧪 QA on `npm run dev`** — cadence, status, logos, tier→membership filter.

## 🗓️ THIS MONTH — grow + test
- **🛒 Ingest O2 + Lidl** (awaiting data) · **🧭 reconcile OVO Energy/Sky TV vs OVO/Sky names** · **🚪 onboarding** · **📚 deepen the catalogue** · **🧪 test with friends** · **📈 referral loop toward 10k** · **🟣 Beehiiv setup + personalisation route**.

## 🔭 ON THE HORIZON
- **🔌 Partner portal + API** · **💸 Placement revenue** · **🎬 Product demo flow** · **🗓️ Calendar-driven Where-to-use-next**.

---

## 🤝 NEED FROM YOU
- Run the two deploys (your GitHub + Supabase auth)
- Verify the perki.app sending domain in Resend (SPF/DKIM/DMARC) if Hotmail filters the 7am send
- O2 + Lidl source data · friends to test

## 🧭 GUARDRAILS
Manual ingestion only, no scraping · accuracy over speed · auto-send to-do is OFF · brand locked (eggshell · indigo · gold) · Perki recommends and links, never moves money · calendar access opt-in only.
