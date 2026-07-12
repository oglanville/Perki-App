# 🚀 PERKI — ROLLING TO-DO

_Pulled manually · Last updated: 2026-07-09 (rev 15) · Scheduled auto-send: OFF (update on request only)_

> 🎯 NORTH STAR: grow the Beehiiv weekly email list to 10,000 subscribers. Perki is a weekly personalised engine that saves people money (optimise + consolidate) and tells them how to use the perks they already pay for.

---

## ✅ BUILT WITH FABLE — 9 Jul 2026 (one day, three waves)

### Wave 1 — data + email engine (morning)
- **Catalogue verified and expanded 433 → 536 rows** — all 19 NEEDS-VERIFY flags resolved against official pages; +96 new perks across 20 providers; BA retiered; Cineworld remodelled as four groups; Railcard/National Trust prices corrected; OVO/Sky naming reconciled.
- **Tier data model fixed** — `tier_kind` (hierarchical | variant) + `tier_rank` across DB and all three logic copies; Spotify/Railcard/NT/Amazon/Cineworld no longer fake-inherit; savings engine skips variants.
- **WHOOP-style daily email** — verdict hero, dark summary card, section pills, live-text week chart; **four layout variants cycling daily** (Verdict / Savings / Bundle / Momentum); Savings + Consolidation split kept.

### Wave 2 — the product looks like a product (afternoon)
- **Website rebuilt in the mob.co.uk language and LIVE** — UI kit, new Home (data-tile hero, bundle shelves, indigo proof band, engines, capture), Perks (moment chips, photo grid, tier ladder), Profile (verdict card, engine badges), global pills.
- **App redesigned to match** — pill nav, display greetings, moment filter, verdict card, password lock (`perki2026`).
- **Onboarding shipped** — six category tabs, curated dropdowns, tier picker, multiple adds; Request-another → Postgres trigger → `request-notify` edge function → email to Ollie (tested live).
- **Perk-aware stock photography** — 85 verified Unsplash images; keyword rules match what each perk IS (lounge ≠ curry ≠ travel insurance), category pools add variety, emoji fallback protects everything.

### Wave 3 — comprehensiveness + the email-to-site loop (evening)
- **Onboarding providers fully catalogued: 767 rows / 63 providers** — Octoplus, O2 Priority, Three+, EE Rewards, Sky VIP, British Gas PeakSave, EDF Sunday Saver, Netflix/Disney+/Apple TV+/NOW/Paramount+/YouTube Premium plans, five music services, six credit card programmes. Every onboarding pick now unlocks real perks (39/39 name-match verified). SMARTY + Capital One legitimately have nothing.
- **Amex free black card findable** — it was the "Rewards" tier all along; renamed **Rewards (Black)**.
- **Email-to-tracker loop** — gold "Update your perk tracker" button under the email intro, deep-linking to the profile's `#perks` anchor; "Every perk you hold" moved directly below "Worth a tap today" and restored to the Active/Inactive four-type banks (gold vs grey).
- **Email rendering hardened** — fluid-hybrid layout (no media-query dependence), bulletproof buttons, float-free rows, Apple Mail dark-mode armour (bgcolor everywhere), links repointed to the working domain.
- **iPhone fix pack** — membership rows wrap instead of truncate; compact tiles; provider grid geometry; OVO badge as scalable SVG.
- **Architecture** — `Perks_Rows.xlsx` is now a derived artifact: regenerate any time with `node scripts/export-perks-xlsx.mjs`.

---

## ☀️ NEXT STEPS — do these first
- **🚀 Deploy the digest** *(needs you, 10 seconds)* — `supabase functions deploy daily-digest --no-verify-jwt --project-ref iievmjsfpgixqdpuxbkg`. Ships the tracker button, fluid phone layout, dark-mode armour AND the working links in one go. Then tell Fable — a test send follows immediately.
- **🚀 git push** — several commits queued (onboarding catalogue wiring, profile reorder, email fixes, iPhone fixes).
- **🌐 Attach perki.app in Vercel** *(needs you)* — Project → Settings → Domains → add perki.app + set the DNS records shown. The email tracker button currently uses perki-app.vercel.app because perki.app serves nothing; once attached, Fable flips links back to the brand domain.
- **📊 Regenerate the spreadsheet** — `npm i -D xlsx` once, then `node scripts/export-perks-xlsx.mjs` (xlsx is 231 rows behind the DB).
- **📧 Supabase "Confirm email" OFF** (Auth → Sign In / Up) — still pending; blocks the instant onboarding flow.

## 📅 THIS WEEK
- **🧪 iPhone QA round two** — membership rows in Your memberships + Upgrades on the shelf; tracker button end to end (stay signed in on perki-app.vercel.app in Safari); the four email variants Fri–Mon.
- **👀 boots.com Price Advantage** — still awaiting your 30-second glance.
- **📸 Photo pass** — keyword matching is live; flag any perk whose photo feels wrong and it's a one-line rule fix.

## 🗓️ THIS MONTH
- **🟣 Beehiiv setup** — block library ready; the weekly is a re-ordering of daily blocks.
- **🏷️ Provider types** (spec ready) · **🛒 Lidl ingest** (O2 done via Priority; Lidl still awaiting data) · **🧪 test with friends — onboarding now unlocks real perks for every pick** · **📈 referral loop**.

## 🔭 ON THE HORIZON
- **🔌 Partner portal + API** · **💸 Placement revenue** · **🎬 Product demo flow** · **🗓️ Calendar Where-to-use-next**.
- **🧹 Architecture debt** — shared module for the triple-copied logic; proper auth-based app gating (password gate is client-side); commissioned photography.

## 🤝 NEED FROM YOU
- Digest deploy → say "done" for the test send · git push · perki.app domain in Vercel · xlsx regenerate · Confirm-email toggle · boots.com glance · Lidl data

## 🧭 GUARDRAILS
Manual ingestion only, no scraping · accuracy over speed · auto-send to-do is OFF · brand locked (eggshell · indigo · gold) · Perki recommends and links, never moves money · calendar access opt-in only.
