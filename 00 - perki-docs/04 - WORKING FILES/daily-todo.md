# 🚀 PERKI — ROLLING TO-DO

_Pulled manually · Last updated: 2026-06-09 (rev 7) · Scheduled auto-send: OFF (update on request only)_

> North star: the app, website and email now share one brand. Ship them, test with real people, then build the marketplace.

---

## ✅ DONE RECENTLY (to 2026-06-09) — brand build-out, marketplace, spec & deck
- **App fully redesigned** to the brand (Phases 1–5): re-skin, single slide-out drawer, real provider logos + brand rows, lowest-tier pricing.
- **LegacyApp retired** — the 968-line monolith split into a clean `src/app/` module tree (AppShell, tabs, hooks); validated by bundling the whole graph.
- **Homepage** — added a "How it works" button above "See my perks".
- **Profile mobile fixed** — dropdowns collapsed by default, overflow guard so nothing forces zoom, old app bottom-nav removed, "App" added to the main menu.
- **Daily email redesigned** — responsive 7-section template + full brief, on the new brand.
- **daily-digest function ported** to the new email with a 7am Europe/London guard + cron migration (003); JWT/header bugs diagnosed and fixed.
- **Daily email deployed + previewed** — new design confirmed.
- **App redesign pushed live to Vercel**.
- **OVO Energy badge fixed** — unified to a green "OVO" wordmark across website, app and email.
- **Unified Web + App product spec** written, then implemented: splitter order, "Unused Tiers" rename, typed Active/Inactive split (no Inactive Feature), search auto-expand.
- **App Marketplace flattened** to mirror the website; add-membership moved to Profile → Unused Tiers.
- **App tooltip parity** — cheapest tier, higher tiers, and the tier-and-below included set.
- **Home grid icons** — trialled a brand SVG set, then reverted to emoji on the gold-tint tile (image_url support kept).
- **Marketplace finalised (web + app)** — permanent Memberships → Tiers → Categories filters, flat A–Z list, deduped to the cheapest tier, tier chips show price.
- **Pitch deck updated** — removed Opportunity slide; added a "See it in action" email-screenshots slide + app placeholder; founder origin story on Team; live Vercel link.
- **Profile spec built + Features toggle** — order Feature → Perk → Discount → Competition; Used/Unused Discounts, Entered/Unentered Competitions; Features now Active/Inactive like Perks; Unused Tiers = upgrades; "Claimed" stat.

---

## ☀️ TODAY — get it live and tidy the rest
- **🛒 Ingest O2 + Lidl** *(top priority)* — add the two providers so the catalogue and deck reflect full coverage. Awaiting source data.
- **📄 Deck polish** — export a PDF, install Outfit + Work Sans for exact type, swap illustrative stats for Perki-specific numbers.
- **🔁 Sort out renewal logic** — make perk reset and renewal dates compute correctly across the app.

## 📅 THIS WEEK — strengthen the MVP
- **📧 Finish email automation** — template + function are done; now run cron migration 003 (06:00 + 07:00 UTC jobs), verify the perki.app sending domain in Resend (SPF/DKIM/DMARC), and confirm one send fires at 7am London.
- **🖼️ Add screenshots to the deck** — drop real website and app examples in, now that both are on-brand.
- **🤝 Seek founder advice (weekly)** — message Tori Prew (HUUR), Tom Standen (Sylvi), George Gazzard (Solskin) once a week for input.

## 🗓️ THIS MONTH — grow the catalogue and get it tested
- **🚪 Build out the onboarding process** — a clean first-run flow that gets people to their perks fast.
- **📚 Deepen the catalogue** — add as many brands and tiers as possible to strengthen the MVP. Manual, accurate.
- **🧪 Test with friends** — real users across the website, app, and email.
- **🔍 Validate UX vs the brand** — pressure-test Marketplace + Profile against the finalised identity, log drift and fix.

## 🔭 ON THE HORIZON — monetisation + partnerships
- **🔌 Partner portal + API** so companies integrate their perks directly.
- **💸 Placement revenue** — natural ranking, boosted-on-search, pay-to-rank.
- **🎬 Product demo flow** for prospects and investors.

---

## 🤝 NEED FROM YOU
- O2 + Lidl source data
- Install Outfit + Work Sans fonts (for exact deck + app type)
- Verify the perki.app sending domain in Resend (so the daily email can send)
- Friends to test the app and email

## 🧭 GUARDRAILS (decisions already made)
Manual ingestion only, no scraping · accuracy over speed · auto-send to-do is OFF (manual pulls only) · brand is locked (eggshell · indigo · gold).
