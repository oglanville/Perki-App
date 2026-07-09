# 🚀 PERKI — ROLLING TO-DO

_Pulled manually · Last updated: 2026-07-09 (rev 13) · Scheduled auto-send: OFF (update on request only)_

> 🎯 NORTH STAR: grow the Beehiiv weekly email list to 10,000 subscribers. Perki is a weekly personalised engine that saves people money (optimise + consolidate) and tells them how to use the perks they already pay for.

---

## ✅ DONE RECENTLY (25 Jun → 9 Jul)
- **Proper digest send is LIVE** — [PREVIEW] era over. Two production cron jobs (06:00 + 07:00 UTC) authenticate against the Vault secret via a service-role-only RPC (`get_cron_secret`), so the cron and function can never drift; the 07:00 Europe/London guard makes one job a no-op, which also **fixes winter DST permanently**. Preview job unscheduled. Multi-recipient + opt-outs supported.
- **WHOOP-style daily email (v48)** — new modular template: verdict hero, dark "Here's how it stands" summary card, gold/indigo section pills, live-text week chart (from `last_used_at`), single CTA. **Four layout variants cycle daily**: Verdict day → Savings day → Bundle day → Momentum day. Savings + Consolidation split-screen kept. Test send verified (200, sent, arrived).
- **Bundles view shipped** in the app's Where tab — grouped moment cards, plus two new bundles: **Big shop** (Shopping/Savings/Rewards) and **Family day out** (Family/Education). Six bundles total.
- **Catalogue expanded 442 → 536 rows** — 96 new perks verified against official pages across 20 providers (Amex credits, BA Club retiering, Railcard variant-specific discounts, National Trust extras, Amazon Fresh/Luna/First Reads, Spotify audiobooks/AI DJ, VeryMe partner deals, IKEA, Costco, Tesco fuel points and more) + 20 corrections. All 19 NEEDS-VERIFY flags resolved. `Perks_Rows.xlsx` mirrors the DB exactly.
- **Tier data model fixed** — new `tier_kind` (hierarchical | variant) + `tier_rank` columns. Spotify, Railcard, National Trust, Amazon and Cineworld are variants: no false inheritance, savings engine skips them, add-membership no longer auto-selects "lower" plans. BA tiers finally have real backend ordering. Front-end + digest logic all rank/kind-aware.
- **Naming reconciled** — OVO Energy / Sky TV consistent across DB, xlsx and code. Amazon "Prime Student" renamed "Students and 18-24"; Prime Gaming replaced by Amazon Luna; Boots Price Advantage restored alongside the new personalised-offers row.
- **Redesign spec + prototypes** — `Perki-Spec-Redesign-2026-07.md` (mob.co.uk website language, WHOOP email system, component libraries, implementation notes) with 4 working prototypes in `redesign-2026-07/` (home, perks, profile, Beehiiv-compatible email).

---

## ☀️ TODAY — confirm and ship
- **🚀 git push** *(needs you)* — one local commit holds everything above; Vercel deploys the front-end changes on push.
- **🧽 Redeploy digest from repo** *(needs you, optional but quick)* — v48 has a cosmetic transcription nit (header gold dot + "+n more" grey text unstyled). The repo copy is correct: `supabase functions deploy daily-digest --no-verify-jwt --project-ref iievmjsfpgixqdpuxbkg` after pushing.
- **⏰ Watch the variants land** — tomorrow (Fri 10 Jul) is Momentum day, Sat is Verdict day, Sun Savings day, Mon Bundle day. Confirm each reads well on iPhone Mail.
- **👀 Eyeball boots.com** — Price Advantage was restored on the strength of the official page (contradicting April press coverage); a 30-second human look settles it.

## 📅 THIS WEEK — build the redesign
- **🎨 Rebuild the website pages from the prototypes** — Home (new page), Perks (chip filters + tier ladder), Profile (verdict card + membership rows with engine badges). Locked brand, mobile-first 390px.
- **🧪 QA on `npm run dev`** — six bundles in the Where tab; variant tiers behave (adding Spotify Family must NOT auto-add Student/Individual); tier ladders order correctly for BA and Cineworld.
- **📊 Verify the week chart populates** as you tick perks used (it reads `last_used_at`, which only started accumulating meaningfully now).

## 🗓️ THIS MONTH — grow + test
- **🟣 Beehiiv setup** — the email block library is Beehiiv-ready; the weekly becomes a re-ordering of the daily's blocks, not a rebuild. Choose the personalisation route and stand up the publication + signup toward 10k.
- **🏷️ Provider types** (life-category labels/filters) — spec ready, not built.
- **🛒 Ingest O2 + Lidl** (awaiting your source data) · **🚪 onboarding** (reuse Add Membership screens) · **🧪 test with friends** · **📈 referral loop**.
- **📬 Deliverability watch** — four rotating layouts is more variation than Hotmail has seen from us; keep an eye on Junk and verify SPF/DKIM/DMARC in Resend if anything slips.

## 🔭 ON THE HORIZON
- **🔌 Partner portal + API** · **💸 Placement revenue** · **🎬 Product demo flow** · **🗓️ Calendar-driven Where-to-use-next**.
- **🧹 Architecture debt** (from the spec): extract the triple-copied bundle/tier/cadence logic into one shared module; shared verdict generator across profile + email; lifestyle photography for the card tiles.

## 🤝 NEED FROM YOU
- `git push`, then optionally the digest redeploy command above
- A look at boots.com Price Advantage
- O2 + Lidl source data · friends to test

## 🧭 GUARDRAILS
Manual ingestion only, no scraping · accuracy over speed · auto-send to-do is OFF · brand locked (eggshell · indigo · gold) · Perki recommends and links, never moves money · calendar access opt-in only.
