# 🚀 PERKI — ROLLING TO-DO

_Pulled manually · Last updated: 2026-06-04 (rev 5) · Scheduled auto-send: OFF (update on request only)_

> North star: the app, website and email now share one brand. Ship them, test with real people, then build the marketplace.

---

## ✅ DONE TODAY (2026-06-04) — app redesign + email
- **App fully redesigned** to the brand (Phases 1–5): re-skin, single slide-out drawer, real provider logos + brand rows, lowest-tier pricing.
- **LegacyApp retired** — the 968-line monolith split into a clean `src/app/` module tree (AppShell, tabs, hooks); validated by bundling the whole graph.
- **Homepage** — added a "How it works" button above "See my perks".
- **Profile mobile fixed** — dropdowns collapsed by default, overflow guard so nothing forces zoom, old app bottom-nav removed, "App" added to the main menu.
- **Daily email redesigned** — responsive 7-section template + full brief, on the new brand.
- **daily-digest function ported** to the new email with a 7am Europe/London guard + cron migration (003); JWT/header bugs diagnosed and fixed.
- **Daily email deployed + previewed** — new design confirmed.
- **App redesign pushed live to Vercel**.
- **OVO Energy badge fixed** — loads the real OVO logo (was falling back to "OV" initials).

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
