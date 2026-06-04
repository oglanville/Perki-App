# PERKS INGESTION — VALIDATION CHECKLIST

Confirm every item before running the ingestion scripts (`supabase/perks-ingestion/`).
Goal: the dataset is fully clean before it touches the live `perks` table.

## A. File readiness (Perks_Rows.xlsx)
- [ ] Lidl perks added to the file
- [ ] O2 perks added to the file
- [ ] Sheet `perks_rows` exported to CSV with the header row intact
- [ ] Column order unchanged (21 cols, matching the staging table)

## B. Structural integrity (run 05_validation_checks.sql on perks_import)
- [ ] Row count matches expectation (288 + Lidl + O2)
- [ ] No missing required fields (perk_id, provider, membership, tier, title, description, category)
- [ ] No duplicate `perk_id`s
- [ ] No truncated `perk_id`s ending in `-` (the 7 known cases fixed)
- [ ] `reset_period` only ever NONE / ANNUALLY / MONTHLY / WEEKLY
- [ ] `next_reset_date` present wherever `reset_period <> 'NONE'`
- [ ] No negative `price` values

## C. Content quality
- [ ] Lidl + O2 rows present and correctly tiered
- [ ] Category values use one consistent casing convention (review query #8)
- [ ] `popularity` reviewed — blanks will default to 'Unknown' on load (intended?)
- [ ] `emoji` populated where you want it shown
- [ ] `source_url` + `last_verified` accurate (manual accuracy check — accuracy > speed)
- [ ] Spot-check 5–10 perks against their `source_url` for correctness

## D. Replace-impact awareness
- [ ] Reviewed which perks will be DELETED (in live `perks`, not in file — e.g. Amex)
- [ ] Accept that deletes cascade to `user_perk_usage` for removed perks
- [ ] Sky (new provider) addition is expected

## E. Execution (only after A–D pass)
- [ ] `01_schema_alter.sql` run (emoji, price, feature, titlegroup added)
- [ ] `02_staging_load.sql` run + CSV loaded into `perks_import`
- [ ] `05_validation_checks.sql` re-run — all clean
- [ ] `03_full_replace.sql` run inside a transaction; counts verified before COMMIT
- [ ] `04_normalisation.sql` run; distinct categories reviewed
- [ ] Final: `select count(*) from public.perks` matches the file
- [ ] App + email prototype spot-checked against the new data
