# PERKS DATA DICTIONARY — Perks_Rows.xlsx (sheet `perks_rows`)

_21 columns. Definitions reflect current usage in the file as of 2026-06-02._

| # | Column | Type | Definition | Notes / current state |
|---|--------|------|------------|------------------------|
| 1 | `perk_id` | text (PK) | Unique slug identifying the perk, pattern `provider-tier-title`. | 7 truncated (trailing `-`); 27 over 50 chars. Must be unique. |
| 2 | `provider` | text | The company offering the perk. | Monzo, Revolut, Sky, OVO (Lidl, O2 pending). |
| 3 | `membership` | text | The membership/product the perk belongs to. | Currently identical to `provider` in every row (redundant until sub-memberships exist). |
| 4 | `tier` | text | The plan/tier level granting the perk. | e.g. Free/Extra/Perks/Max, Standard→Ultra, Silver, Beyond. |
| 5 | `feature` | text | Type classifier for the row. | One of: feature, perk, competition, discount. |
| 6 | `titlegroup` | text | Grouping label to collapse related perks in the UI. | Duplicates `title` in 64% of rows; only ~103 use it for real grouping. |
| 7 | `title` | text | Short display name of the perk. | Always present. |
| 8 | `description` | text | Full explanation of what the perk gives. | 68–397 chars (avg 126). Internally clean; not fact-checked vs provider. |
| 9 | `category` | text | Thematic category for filtering/grouping. | 37 values, Title-Cased (Banking, Entertainment…). Casing consistent; taxonomy not independently verified. |
| 10 | `reset_period` | text | How often the perk's allowance resets. | Enum: NONE / WEEKLY / MONTHLY / ANNUALLY. |
| 11 | `next_reset_date` | date | The next date the allowance resets. | NULL when `reset_period = NONE` (194 rows). Recurring dates rolled forward to future. |
| 12 | `usage_limit` | text | Human-readable cap on usage. | e.g. "Ongoing", "Subject to availability". |
| 13 | `usage_notes` | text | Templated guidance from reset_period + usage_limit. | Populated 2026-06-02, e.g. "Resets monthly. Usage: Ongoing." |
| 14 | `source_url` | text | Link to the authoritative source for the perk. | Only 4 distinct (generic plan pages); Sky = '-' (no source). Weak traceability. |
| 15 | `last_verified` | date | When the perk was last checked for accuracy. | Two dates only (2026-04-15 / 2026-04-28). |
| 16 | `popularity` | text | Intended signal of how widely used a perk is. | All 'Unknown' — no real usage data exists to populate it. |
| 17 | `icon_provider_url` | text | Logo URL for the provider. | Populated via logo convention (`logo.clearbit.com/<domain>`); unverified asset links. |
| 18 | `icon_membership_url` | text | Logo URL for the membership. | Mirrors provider icon (membership == provider). |
| 19 | `created_at` | timestamptz | Row creation timestamp. | From source. |
| 20 | `emoji` | text | Display emoji for the perk. | Present on every row (98 distinct). |
| 21 | `price` | numeric | Monetary value attached to the row. | **Actually the tier's subscription price, repeated per perk** (Sky 140, OVO 46, Revolut 0/4/8/15/55, Monzo 0/3/7/17). Denormalised — belongs on a `tiers` table. |

## Validation status (2026-06-02)
- **Validated — internal/structural:** required fields present, no duplicate IDs, enum values valid, dates consistent, price uniform per tier.
- **NOT validated — external/factual:** description accuracy, correct category assignment, real reset cadence, and actual tier prices. Requires verified sources (Sky currently has none) or manual sign-off. No scraping per project rule.
