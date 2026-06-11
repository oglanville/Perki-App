# 🚀 PERKI — ROLLING TO-DO

_Pulled manually · Last updated: 2026-06-10 (rev 8) · Scheduled auto-send: OFF (update on request only)_

> North star: the app, website and email now share one brand. Ship them, test with real people, then build the marketplace.

---

## ✅ DONE RECENTLY (to 2026-06-10) — compare, search facets, pricing & deck
- **Marketplace Compare built (website)** — wrote the spec, then built it: a Compare toggle splits the view into two independent marketplaces with one shared search at the top. Each side keeps its own Memberships / Tiers / Categories, so anything can be compared against anything. Marketplace body extracted into a reusable `MarketplacePane`.
- **Marketplace search hides empty filters (web + app)** — when you search, only Membership / Tier / Category chips with a matching result show, and a selected-but-emptied filter clears itself.
- **Perk pop-out price follows the clicked tier (web + app)** — headline shows the clicked tier's price, with "also available in a cheaper tier — get it from…" beneath; All tiers still resolves to the cheapest; the included list keys to the clicked tier too.
- **Pitch deck repaired and finished** — fixed the packaging corruption, restored the "Make every perk count." close slide, and added the five app-configuration screenshots to a captioned "Inside the app" slide. 16 slides, render-QA'd.
- **App fully redesigned** to the brand (Phases 1–5): re-skin, single slide-out drawer, real provider logos + brand rows, lowest-tier pricing.
- **LegacyApp retired** — the 968-line monolith split into a clean `src/app/` module tree (AppShell, tabs, hooks); validated by bundling the whole graph.
- **Homepage** — added a "How it works" button above "See my perks".
- **Profile mobile fixed** — dropdowns collapsed by default, overflow guard so nothing forces zoom, old app bottom-nav removed, "App" added to the main menu.
- **Daily email redesigned** — responsive 7-section template + full brief, on the new brand.
- **daily-digest function ported** to the new email with a 7am Europe/London guard + cron migration (003); JWT/header bugs diagnosed and fixed.
- **Daily email deployed + previewed** — new design confirmed.
- **App redesign pushed live to Vercel**.
- **OVO Energy badge fixed** — unified to a green "OVO" wordmark across website, app and email.
- **Unified Web + App product spec** written, then implemented: splitter order, "Unused Tiers" rename, typed Active/Inactive split, search auto-expand.
- **App Marketplace flattened** to mirror the website; add-membership moved to Profile → Unused Tiers.
- **Marketplace finalised (web + app)** — permanent Memberships → Tiers → Categories filters, flat A–Z list, deduped to the cheapest tier, tier chips show price.
- **Pitch deck updated** — removed Opportunity slide; added a "See it in action" email-screenshots slide; founder origin story on Team; live Vercel link.
- **Profile spec built + Features toggle** — order Feature → Perk → Discount → Competition; Used/Unused Discounts, Entered/Unentered Competitions; Features now Active/Inactive like Perks; Unused Tiers = upgrades; "Claimed" stat.

---

## ☀️ TODAY — get it live and tidy the rest
- **🛒 Ingest O2 + Lidl** *(top priority)* — add the two providers so the catalogue and deck reflect full coverage. Awaiting source data.
- **📄 Deck polish** — export a PDF, install Outfit + Work Sans for exact type, swap illustrative stats for Perki-specific numbers.
- **🔁 Sort out renewal logic** — make perk reset and renewal dates compute correctly across the app.

## 📅 THIS WEEK — strengthen the MVP
- **📧 Finish email automation** — template + function are done; now run cron migration 003 (06:00 + 07:00 UTC jobs), verify the perki.app sending domain in Resend (SPF/DKIM/DMARC), and confirm one send fires at 7am London.
- **🧪 QA the new marketplace work** — pressure-test Compare, the search facets and the clicked-tier pop-out on `npm run dev`, then redeploy.
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
