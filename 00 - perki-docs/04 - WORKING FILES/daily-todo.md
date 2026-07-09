# 🚀 PERKI — ROLLING TO-DO

_Pulled manually · Last updated: 2026-07-09 (rev 14) · Scheduled auto-send: OFF (update on request only)_

> 🎯 NORTH STAR: grow the Beehiiv weekly email list to 10,000 subscribers. Perki is a weekly personalised engine that saves people money (optimise + consolidate) and tells them how to use the perks they already pay for.

---

## ✅ DONE RECENTLY (9 Jul, second wave — the redesign is BUILT, not just specced)
- **Website rebuilt in the mob language** — new shared UI kit (`src/ui/kit.jsx`); Home rebuilt end to end (display hero, live data tiles, bundle shelves from the catalogue, indigo proof band, engines split, email capture); Perks page rebuilt (sticky Moment → Membership → Tier chip rows with live counts, photo card grid, "from tier" + "Also in" flags, tier ladder replacing Compare); global pill buttons + announcement strip.
- **Home hero polished** — provider logos as a 4×4 grid (15 live logos + self-counting "+N" cell) and a photo-backed **Today's pick** tile that rotates a real perk daily and opens the drawer.
- **Profile page rebuilt** — "Worth a tap today" photo shelf (scored like the email), memberships with live Save/Right-sized engine badges, variant-aware "Upgrades on the shelf", and one perk browser (search + type chips + Still to use / Already used) replacing eight collapsibles.
- **App redesigned to match** — indigo pill bottom nav, "Morning, Ollie." display greetings, pill chips everywhere, Moment filter in Marketplace, indigo verdict card on the Profile tab.
- **Onboarding shipped** — signup now lands on `/onboarding` (no email detour): six category tabs (⚡📱📡📺🎧💳), curated dropdowns (OVO/British Gas/E.On/EDF/Octopus… per category), multiple adds per category, tier picker for catalogue providers, instant chips with remove. "Request another…" → modal → `membership_requests` → **Postgres trigger → `request-notify` edge function → branded email to Ollie** (tested live).
- **Stock photography on perk tiles** — 39 categories mapped to verified Unsplash CDN images (`src/data/stockImages.js`), per-perk `image_url` override supported, emoji fallback if a URL ever dies. Website + app tiles both covered; email stays live-text by design.
- *(Earlier today: catalogue 536 + tier model + WHOOP digest with 4 daily variants — see rev 13 / timeline.)*

---

## ☀️ TODAY — shipped ✅, two small things left
- ✅ **Pushed and live** — all nine commits are on Vercel and the digest is at v50, deployed from your repo (cosmetic nits fixed). Nothing queued.
- **📧 Supabase toggle for instant onboarding** *(needs you, 30 seconds)* — Dashboard → Auth → Sign In / Up → turn OFF "Confirm email", otherwise new signups still see a confirm notice before onboarding.
- **📱 Open perki-app.vercel.app on your phone** — the redesign is live; the homepage hero, onboarding flow and profile loop are the things to feel out.
- **⏰ Watch the email variants** — Fri Momentum · Sat Verdict · Sun Savings · Mon Bundle.

## 📅 THIS WEEK — QA the new surfaces
- **🧪 `npm run dev` at 390px** — homepage 4×4 logo grid density; Today's pick tile; Perks moment chips ↔ tier ladder interplay; Profile worth-a-tap → Still-to-use → Already-used loop; app tab feel (4-col grid on the 13); full onboarding run with a fresh account.
- **📸 Photo curation pass** — all category images are verified but two are compromises (broadband = cabling, mobile = flat-lay); swap freely in `stockImages.js`.
- **👀 boots.com Price Advantage** — still awaiting your 30-second eyeball.

## 🗓️ THIS MONTH — grow + test
- **🟣 Beehiiv setup** — email block library is ready; weekly = re-ordering of daily blocks.
- **🏷️ Provider types** (spec ready) · **🛒 O2 + Lidl** (awaiting data) · **🧪 test with friends — onboarding is finally show-able** · **📈 referral loop**.
- **📬 Deliverability watch** — variants + request-notify mean more send patterns; check Junk occasionally.

## 🔭 ON THE HORIZON
- **🔌 Partner portal + API** · **💸 Placement revenue** · **🎬 Product demo flow** · **🗓️ Calendar Where-to-use-next**.
- **🧹 Architecture debt** — shared module for the triple-copied bundle/tier/cadence logic; shared verdict generator; commissioned photography to replace stock.

## 🤝 NEED FROM YOU
- `git push` · digest redeploy (optional) · Supabase "Confirm email" OFF
- boots.com glance · O2 + Lidl data · friends to test onboarding

## 🧭 GUARDRAILS
Manual ingestion only, no scraping · accuracy over speed · auto-send to-do is OFF · brand locked (eggshell · indigo · gold) · Perki recommends and links, never moves money · calendar access opt-in only.
