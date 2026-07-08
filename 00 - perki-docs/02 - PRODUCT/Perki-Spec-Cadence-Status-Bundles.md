# Perki spec: cadence, status and bundles

_Status: ready for engineering · Owner: Ollie · Last updated: 2026-06-14 · Scope: website + app + email_

## 1. Summary

Perki stops asking users for any dates. Reset dates, usage dates, expiry dates and reminders are removed from the interface everywhere. In their place, every item carries two simple, user-facing signals: a Cadence (how often it renews) and a Status (whether the user has used it). The underlying renewal-date logic stays in the database and the code, but dormant and hidden, so it can be switched back on later. A new bundling layer groups items into use-case "moments" such as Holiday, Cinema, Sports and Workday.

An item means any perk, feature, competition or discount. The rules below apply to all four types identically.

## 2. Cadence (replaces reset dates)

Every item shows exactly one of three cadences, derived automatically. Users never enter or see a date.

| Cadence | Meaning | Resets |
|---------|---------|--------|
| Weekly | Renews each week | Automatically every Monday |
| Monthly | Renews each month | Automatically on the 1st |
| One-off | Does not renew | Never |

Derivation from the existing `perks.reset_period` field:

- `WEEKLY` → Weekly
- `MONTHLY` → Monthly
- `NONE`, `ANNUALLY`, `YEARLY`, null → One-off

Cadence is a property of the catalogue item, the same for every user. It is global and rule-based: Weekly items conceptually reset Monday 00:00 Europe/London, Monthly items on the 1st 00:00 Europe/London. No per-user reset date is shown, and none is required. Annual and other periods collapse into One-off in the UI for now; the real period is preserved in the data (see section 7).

## 3. Status (replaces usage tracking)

Every item shows exactly one of three statuses, set by the user with a single control. Statuses carry no dates and no company data.

| Status | Meaning |
|--------|---------|
| Have used | The user has used this item |
| Have not used | Default. The user has not used it |
| Will not use | The user has chosen to set it aside |

Derivation from the existing `user_perk_state` row:

- `will_not_use = true` → Will not use
- else if `used = true` → Have used
- else → Have not used

Setting a status writes only the boolean flags. The user never picks a date. Internally the system may still stamp timestamps (see section 7), but nothing date-based is shown or asked for.

## 4. Data model

No new user-input fields. The model is the existing schema, reinterpreted.

Catalogue (`perks`), unchanged: keep `reset_period` and `next_reset_date`. The UI never reads `next_reset_date`; it derives Cadence from `reset_period` only.

User state (`user_perk_state`), unchanged columns, narrowed UI use: the interface reads and writes `used` and `will_not_use` only. `used_at`, `last_used_at` and `next_reset_date` remain in the table and may keep being written by the backend, but are never surfaced or required.

Derived, computed at read time, never stored as user input:

- `cadence`: "weekly" | "monthly" | "oneoff", from `reset_period`.
- `status`: "used" | "unused" | "wontuse", from the flags above.

Feature flag: add a single backend flag, for example `RENEWAL_DATES_ENABLED` (default false). While false, no renewal date is shown anywhere and cadence drives all reset messaging. Flipping it true later re-exposes the dormant date logic without a data migration (see section 7).

## 5. UI and UX rules

Show everything. Display all perks, features, competitions and discounts by default. Do not hide or filter items based on status, cadence or any date. "Will not use" items remain visible (they may be visually de-emphasised, but not removed).

No date inputs anywhere. Remove every field, picker, calendar, reminder toggle and "next reset" or "last used" readout from the interface. There is nothing for the user to type or pick that is date-based.

Each item shows, and only shows:

- Icon, title, and provider with tier.
- A cadence chip: Weekly, Monthly or One-off.
- A status control: a three-way segmented control reading Have used / Have not used / Will not use, reflecting the current status.
- The type tag already in use (Feature, Perk, Discount, Competition).

Nothing else. No dates, no countdowns, no "resets on", no "expires", no streaks.

## 6. Bundling (new presentation layer)

Bundles group related items across providers into curated use-case "moments". A bundle is shown as one grouped offering, not a list of isolated perks.

Mechanism: a bundle is defined by a name, an icon, and a set of catalogue categories (and optional keywords) it draws from. The app assembles each bundle by collecting the user's held items whose category matches, ordered by type then title. Bundles are a presentation layer over the existing `category` field, so no schema change is required to launch. An optional `bundle_tags` array on `perks` can be added later for hand-curation beyond category matching.

Starter bundles:

| Bundle | Icon | Draws from (categories / examples) |
|--------|------|------------------------------------|
| Holiday | ✈️ | Travel, Insurance, Currency. Lounge access, travel insurance, roaming, airport discounts |
| Cinema | 🎬 | Entertainment, Streaming. Free tickets, discounted snacks, partner cinema perks |
| Sports | ⚽ | Sports. Ticket discounts, merchandise perks, travel perks |
| Workday | 💼 | Productivity, Insurance, Food. Travel or "trouble" insurance, productivity perks, food discounts |

Rules: a bundle appears only if the user holds at least one matching item; empty bundles are omitted, never padded. An item may appear in more than one bundle. Within a bundle, items keep their own cadence chip and status control. Bundles are how "Where to use next" and the email's contextual prompts are populated, so the same bundle config drives app and email.

## 7. Retaining renewal-date logic internally

The renewal-date system is kept whole but dormant, so it can be re-enabled later without rebuilding.

- Keep the `reset_period` and `next_reset_date` columns in both `perks` and `user_perk_state`.
- Keep the calculation logic intact, for example the existing `nextResetFrom` helper and the `next_reset_date` that `markPerkUsed` computes when an item is marked used. These may keep running server-side; their output is simply not shown.
- Do not surface any renewal date in the UI and do not require user input.
- Gate all renewal-date display behind `RENEWAL_DATES_ENABLED` (default false). When false, the app runs purely on Cadence and Status. When true in future, the dormant dates can drive reminders or precise reset countdowns again.

In short: cadence and status are the live system; renewal dates are preserved infrastructure, switched off at the UI.

## 8. Implementation notes: removing date inputs

Audit and remove every date-based surface, then route messaging through cadence:

- Perk drawer and sheet (`src/ui/PerkDrawer.jsx`, `src/app/components.jsx`): remove the Renewal, Next reset and Last used rows. Replace any "renews / resets on date" line with the cadence chip. Keep the used / will-not-use controls, relabelled to the three statuses.
- Catalogue helpers (`src/data/catalog.js`, `src/app/theme.js`): replace `resetHuman(reset_period)` date phrasing with a `cadenceLabel(reset_period)` returning Weekly / Monthly / One-off. Keep `nextResetFrom` and the `next_reset_date` writes in place but unreferenced by the UI.
- Profile and lists: remove any date columns or "resets" text; show the cadence chip and status control instead.
- Email digest (`supabase/functions/daily-digest/index.ts`): the "what to use today" copy should speak in cadence terms ("resets weekly", "resets monthly", "one-off") rather than specific dates, and must never print `next_reset_date`.
- Confirm there is no input, picker or reminder control anywhere that accepts a date from the user.

## 9. Copy and layout rules

- Cadence chip copy: exactly "Weekly", "Monthly", "One-off".
- Status control copy: exactly "Have used", "Have not used", "Will not use".
- Reset phrasing, where any is needed, is cadence-based only: "Resets every Monday", "Resets on the 1st", "One-off". Never a date, countdown or "expires".
- British English, sentence case, value-first, no em dashes.
- Item card order: icon, title, provider and tier, type tag, cadence chip, status control. One line where space allows, wrapping cleanly on mobile.
- Bundles render as titled cards (icon plus name) containing their items; each item keeps its chip and status control.

## 10. Acceptance criteria

1. No screen anywhere accepts a date, reminder or expiry from the user.
2. Every item shows exactly one cadence (Weekly, Monthly or One-off) derived from `reset_period`, with no date shown.
3. Every item shows exactly one status (Have used, Have not used, Will not use) backed by the existing flags, with no date shown.
4. All items are visible by default; nothing is hidden or filtered by status, cadence or date.
5. Bundles render as grouped use-case cards and are omitted when empty.
6. `reset_period`, `next_reset_date` and the calculation logic remain in place and pass through unchanged, hidden behind `RENEWAL_DATES_ENABLED = false`.
7. The app functions fully on cadence and status alone.

## 11. Open items

- Confirm the four starter bundles and their category mappings, and whether to add a `bundle_tags` field for hand-curation.
- Decide whether "Will not use" items are de-emphasised or shown identically.
- Confirm annual-period items should read as One-off in the UI for now.
