# TASKS

_Last updated: 2026-06-02_

## Perks source file
- **`Perks_Rows.xlsx`** (root, sheet `perks_rows`) = single source of truth until Lidl + O2 added.
- 288 rows / 21 cols. Providers: Revolut 123, Sky 87, Monzo 55, OVO 23 (Sky new, Amex dropped vs live seed).

## Ingestion workflow (agreed 2026-06-02)
- [ ] Extend `perks` schema: add `emoji`, `price`, `feature`, `titlegroup`
- [ ] Standardise category casing (one convention) + set `popularity` default
- [ ] Fix 7 truncated `perk_id`s (ending in `-`)
- [ ] Full replace: clear `perks`, load all 288 rows (Amex out, Sky in)
- [ ] Add **Lidl** perks to the file, then ingest  — awaiting source data
- [ ] Add **O2** perks to the file, then ingest    — awaiting source data
- [ ] Manual CSV paste only — no scraping / automated extraction

## Perks file audit (see 05 - OUTPUTS/perks-file-audit.md + perks-data-dictionary.md)
Field population: DONE 2026-06-02 (icons, usage_notes, popularity='Unknown', date fixes). Backup: Perks_Rows.backup-2026-06-02.xlsx.

Validation status:
- [x] Internal/structural validation — required fields, unique IDs, enum values, date consistency, price uniform per tier.
- [ ] **Factual validation (NOT done — needs verified sources or sign-off; no scraping):**
  - [ ] Add real `source_url`s for Sky's 87 perks (currently '-', biggest gap)
  - [ ] Confirm the 4 tier prices are current (Sky 140, OVO 46, Revolut 0/4/8/15/55, Monzo 0/3/7/17)
  - [ ] Verify `description` accuracy vs provider
  - [ ] Verify `category` assignments are correct
  - [ ] Verify real `reset_period` cadence per perk
- [ ] Refresh `last_verified` once each perk is factually checked

## After ingestion
- [ ] Full audit of the data model (providers / tiers / perks / user_memberships / user_perk_usage)
- [ ] Audit perk structure + how data flows into the app
- [ ] Audit how data flows into the email prototype (daily-digest)

## Deferred (data foundation first)
- [ ] App layout refinements
- [ ] Email prototype layout refinements
- [ ] Build pitch deck
- [ ] Product demo flow

## Future-state (not now — do NOT action)
- Direct provider API relationships
- Partner portal (companies input their own perks)
- Marketplace model (Uswitch-style)
- Bidding / placement revenue
- Structured product library for discovery + comparison

## Current build status (verified against code 2026-06-02)
- App, email prototype, Supabase backend: built + connected
- Seeded: 38 perks across 4 providers — Amex (11), Revolut (12), Monzo (8), OVO Energy (7)
- Lidl + O2: NOT yet in seed (confirmed pending)
- Edge function: daily-digest present
