# Perki Spec — Profile, Ordering & Terminology
Addendum to the unified Web + App spec. Where it conflicts with an earlier rule, this document wins. Engineering-ready.

---

## 0. What this changes

| # | Change | Supersedes |
|---|--------|------------|
| A | Profile state labels are now type-specific (Used/Unused for discounts, Entered/Unentered for competitions). | Generic "Active/Inactive" applied to all types. |
| B | Type order on the Profile tab and the app Home tabs is **Feature → Perk → Discount → Competition**. | The earlier Perk-first profile order. |
| C | Unused Tiers list shows **upgrades only** (tiers above the user's current tier). | Unused Tiers showing every not-yet-added tier. |
| D | Active membership rows show the **active tier name**, not a tier count. | "{Provider} · N tiers". |
| E | **Features can be Active or Inactive (toggle on `used`), exactly like Perks.** | The earlier "Features are always Active" rule. |

Scope of the new order (B): the Profile tab (web + app) and the app Home sub-tabs only. The Marketplace stays alphabetical (its recent rule is unchanged).

---

## 1. Terminology (canonical state verbs by type)

Each benefit type uses its own verb for the "claimed" and "not claimed" states. The underlying data is one boolean (`used`); the label is chosen by type.

| Type | Order | Claimed state | Not-claimed state |
|------|-------|---------------|-------------------|
| Feature | 1 | **Active Feature** | **Inactive Feature** |
| Perk | 2 | **Active Perk** | **Inactive Perk** |
| Discount | 3 | **Used Discount** | **Unused Discount** |
| Competition | 4 | **Entered Competition** | **Unentered Competition** |

Hard rules:
- Never render "Active Discount", "Inactive Discount", "Active Competition", or "Inactive Competition" anywhere in Perki (web, app, email).
- A Feature is Active when marked used and Inactive otherwise, the same as a Perk.

---

## 2. Profile Tab — Memberships

**Active membership row.**
- Display `{Provider} · {active tier}` — the active tier name sits directly after the provider name. Example: `Monzo · Max`.
- Do not show a tier count.
- If a provider has more than one active tier, show the **highest** (the one the user pays for).

**Unused Tiers.**
- For each membership the user **holds**, list only tiers priced **higher** than their current active tier (upgrades).
- Sort ascending by price (cheapest upgrade first). Show each tier's price.
- A membership whose active tier is already the top tier shows no Unused Tiers.
- Open question for sign-off: brand-new memberships the user does **not** hold are out of scope for this list (it is upgrades-only). Confirm whether adding a new membership stays in this section or moves to a separate "Add a membership" action.

---

## 3. Ordering (Web + App)

Canonical type order for the Profile tab and the app Home tabs:

```
Feature → Perk → Discount → Competition
```

Apply to:
- **Profile tab** (web + app): the order of the typed sections within both the claimed and not-claimed groups.
- **App Home tabs**: the sub-tab row reorders to **Features · Perks · Discounts · Competitions**.

---

## 4. Profile Tab — claimed / not-claimed sections

Two groups, each ordered by §3. Section labels use the §1 verbs.

**Claimed**
1. Active Features
2. Active Perks
3. Used Discounts
4. Entered Competitions

**Not claimed**
1. Inactive Features
2. Inactive Perks
3. Unused Discounts
4. Unentered Competitions

All sections collapsed by default on first load; search expands them (unchanged rule).

---

## 5. Dashboard stats — knock-on fix

The dashboard stat currently reads "Total Active Perks / Discounts / Competitions". With §1, "Active Discounts" and "Active Competitions" are invalid terms. Resolve one of two ways (pick one at sign-off):

- **Recommended:** relabel the aggregate to a neutral verb — **"Claimed"** — counting used perks + used discounts + entered competitions.
- Or split into three labelled stats: Active Perks, Used Discounts, Entered Competitions.

"Active Features" and "Available" stats are unaffected.

---

## 6. Implementation notes

- **Order constant.** Introduce a Profile/Home order = `["feature","perk","discount","competition"]`. Use it for the Profile typed sections and the Home sub-tab list. Leave the Marketplace ordering (alphabetical) untouched.
- **State → label mapping.** One field drives state: `used`. Render the label by type — Perk and Feature: Active/Inactive; Discount: Used/Unused; Competition: Entered/Unentered. No schema change.
- **Membership row.** Replace the tier-count subtitle with the highest active tier name appended to the provider.
- **Unused Tiers.** For each held membership, filter the catalogue tiers to `sort_order > currentActiveTier.sort_order`; sort ascending; show price label.
- **Files in scope.** App: `src/app/tabs/ProfileTab.jsx`, `src/app/tabs/HomeTab.jsx`, `src/app/theme.js` (order constant). Web: `src/pages/Profile.jsx`. Plus any string in app/web/email rendering "Active/Inactive Competition" or "Active/Inactive Discount".
- **Edge cases.** Single-tier membership → no Unused Tiers. Competition/discount/feature counts read the same `used` field as perks. A Feature can now be Inactive.

---

## 7. Naming consistency (final)

Membership · Tier · Unused Tier (upgrade) · Perk · Feature · Discount · Competition · Category. State: Active/Inactive (Perks and Features) · Used/Unused (Discounts) · Entered/Unentered (Competitions).
