# PERKS FILE AUDIT — Perks_Rows.xlsx

_Date: 2026-06-02 · Scope: sheet `perks_rows`, 288 rows × 21 columns · Read-only audit, no changes made_

## Verdict
Structurally clean (no missing required fields, no duplicate `perk_id`s, strong descriptions).
Several fields are populated sub-optimally — fix before ingestion to avoid baking issues into the catalogue.

## Severity-ranked findings

### High — fix before ingest
1. **Stale recurring reset dates.** All `MONTHLY` (31) and `WEEKLY` (4) perks have `next_reset_date = 2026-05-31`, already in the past. Roll forward to the next valid cycle.
2. **Placeholder dates on non-resetting perks.** 194 rows with `reset_period = NONE` carry `next_reset_date = 2026-06-30` (filler). Set these to NULL.
3. **Sky source traceability.** All 87 Sky perks have `source_url = '-'` — no verifiable source. Conflicts with the "accuracy > speed" rule. Add real sources or mark unverified.

### Medium — decide intent
4. **Four 100%-empty columns:** `usage_notes`, `popularity`, `icon_provider_url`, `icon_membership_url`.
   - `popularity` → agreed default 'Unknown'.
   - icon URLs empty → app/email have no icons to render. Populate or confirm not needed.
   - `usage_notes` → populate where useful or accept blank.
5. **`price` is tier price, not perk price.** Repeated across every perk in a tier (Sky 140, OVO 46, Revolut 0/4/8/15/55, Monzo 0/3/7/17). Denormalised — belongs on a `tiers` table. Flag for the data-model audit.
6. **Generic source URLs.** Only 4 distinct URLs across 288 perks (all plan-overview pages). No perk-level traceability.

### Low — tidy-ups
7. **`titlegroup` duplicates `title` in 185/288 rows (64%).** Only ~103 rows use it for real grouping. Confirm purpose or drop.
8. **`membership` == `provider` in 100% of rows.** Currently redundant; keep only if sub-memberships are coming.
9. **`perk_id` hygiene.** 7 truncated IDs (trailing `-`), 27 IDs > 50 chars. Regenerate the 7; consider a length cap.
10. **Sky single-tier.** All 87 Sky perks sit under tier 'Silver'. Confirm intentional vs. a flattened multi-package structure.

## What's healthy
- No missing required fields; no duplicate `perk_id`s.
- Descriptions: 68–397 chars (avg 126) — none too short, none equal to title.
- `reset_period` clean (NONE / ANNUALLY / MONTHLY / WEEKLY); annual dates valid.
- `emoji` populated on every row (98 distinct).
- `feature` is a usable type classifier: feature (150), perk (72), competition (39), discount (27).

## Provider × tier snapshot
- Monzo (55): Free 4, Extra 10, Perks 19, Max 22
- Revolut (123): Standard 12, Plus 14, Premium 24, Metal 35, Ultra 38
- Sky (87): Silver 87
- OVO (23): Beyond 23
- _Pending: Lidl, O2_

## Recommended sequence
1. Roll forward stale monthly/weekly reset dates (finding 1).
2. Null out placeholder reset dates (finding 2).
3. Resolve Sky sources + icon URL population decision (findings 3, 4).
4. Add Lidl + O2.
5. Run the validation checklist, then ingest.
