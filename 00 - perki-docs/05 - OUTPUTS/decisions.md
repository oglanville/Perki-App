# DECISIONS

## 2026-06-02 — Alignment session
- **Immediate priority:** Lidl + O2 perk ingestion into Supabase. Single focus for next 2 days.
- **Then:** full audit of data model, perk structure, and data flow into app + email prototype.
- **App/email layouts:** good enough for now — revisit after the data foundation is stable.
- **Data sourcing:** manual only. Ollie maintains an Excel file, pasted into Supabase as CSV. No scraping, brute-forcing, or automated extraction from provider sites at this stage. Accuracy > speed.
- **Supabase updates:** direct edits to Supabase are fine for now. Migrations / ingestion pipelines deferred until structure is validated and stable.
- **Folder = single source of truth:** keep tasks.md, decisions.md, summaries.md updated as work progresses.
- **Daily cadence:** rolling to-do compiled and sent at 08:00 daily (immediate tasks, dependencies, blockers, decisions, milestones, asks).
- **Future-state (logged, not actioned):** provider APIs, partner portal, Uswitch-style marketplace, bidding/placement revenue, structured product library.

## 2026-06-02 — Perks source file (Perks_Rows.xlsx)
- **Single source of truth:** `Perks_Rows.xlsx` (project root, sheet `perks_rows`) is the master perks catalogue until Lidl + O2 are added. Manually maintained by Ollie; pasted into Supabase as CSV.
- **Extra columns → extend schema:** ALTER the `perks` table to add `emoji`, `price`, `feature`, `titlegroup` so the file and DB stay 1:1 (nothing dropped on ingest).
- **Load mode → full replace:** the file supersedes the live catalogue. Clear `perks` and load all 288 rows. Net effect: Amex removed (not in file), Sky added (new in file).
- **Normalisation → standardise now:** align category casing to one convention and set a sensible `popularity` default so app grouping/filtering stays clean. (Existing seed used lowercase categories + populated popularity; new file uses Capitalised categories + empty popularity.)
- **Open data-quality items to fix before/with ingest:** 7 truncated `perk_id`s ending in `-`; `usage_notes` + both icon URL columns are blank for all 288 rows.
