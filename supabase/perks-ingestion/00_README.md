# PERKS INGESTION SCRIPTS

Reviewable, manual SQL for refreshing the `perks` catalogue from `Perks_Rows.xlsx`.
**Nothing here is auto-run.** Execute in order, by hand, once Lidl + O2 are in the file and the data is clean.

## Source
- File: `Perks_Rows.xlsx`, sheet `perks_rows` (project root) — single source of truth.
- 21 columns. Export the sheet to CSV before loading.

## Run order
1. `01_schema_alter.sql`   — add `emoji`, `price`, `feature`, `titlegroup` to `perks` (run once; idempotent).
2. `02_staging_load.sql`   — create the `perks_import` staging table, then paste/COPY the CSV into it.
3. `03_full_replace.sql`   — upsert staging → `perks`, then delete catalogue rows not in the file.
4. `04_normalisation.sql`  — standardise category casing + backfill `popularity`.
5. `05_validation_checks.sql` — run BEFORE step 3 to confirm the dataset is clean (see also VALIDATION-CHECKLIST.md).

## Why staging (not TRUNCATE)
`user_perk_usage.perk_id` → `perks(perk_id)` is `ON DELETE CASCADE`. A `TRUNCATE`/blunt delete
would cascade-delete user usage history. The staging approach only removes perks genuinely absent
from the file (e.g. Amex), preserving usage rows for perks that remain.

## Decisions baked in (2026-06-02)
- Extend schema for the 4 extra columns.
- Full replace (file supersedes live catalogue).
- Standardise category casing + popularity default.
