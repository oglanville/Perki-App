# Perki — Unified Product Spec (Web + App)
Implementation-ready. Web and app behave identically unless a row says otherwise.

---

## 0. Decisions (resolved ambiguities)

Your brief contained conflicts. These are the rulings. Apply them everywhere.

| # | Decision |
|---|----------|
| D1 | Type token in data is singular, lowercase: `perk`, `feature`, `discount`, `competition`. UI heading is plural: Perks, Features, Discounts, Competitions. |
| D2 | One canonical type order, used in every list, sort, splitter and stat: **Perk → Feature → Discount → Competition**. This overrides the current feature-first sort and the different order written in your Profile section. |
| D3 | "Potential Tiers" / "Potential memberships" is renamed **Unused Tiers**. One name only. |
| D4 | The stat "Active Plans" is renamed **Active Memberships**. "Plan" is not a Perki term. |
| D5 | A Feature is Active whenever its Membership is Active. **An Inactive Feature cannot exist.** Never render one. |
| D6 | App Marketplace equals Website Marketplace: a flat list of individual perks. No grouping by Membership. No bundles. |
| D7 | App Home icons are images, never emoji. |
| D8 | Category is always the secondary splitter, nested under the type splitter. |

---

## 1. Glossary (canonical terms)

| Term | Means | Never call it |
|------|-------|---------------|
| Membership | A provider account a user holds (e.g. Monzo). | plan, subscription, provider |
| Tier | A priced level within a Membership (e.g. Perks, Max). | level, plan |
| Unused Tier | A Tier the user has not added but could. | potential tier, potential membership |
| Perk | A claimable benefit, type `perk`. | benefit, reward |
| Feature | An always-on inclusion, type `feature`. | — |
| Discount | A money-off benefit, type `discount`. | deal, offer |
| Competition | A prize draw, type `competition`. | comp, giveaway |
| Category | The subject grouping (Travel, Banking…). | tag, section |
| Active | A Perk/Discount/Competition marked Used, or any Feature on an active Membership. | claimed, done |
| Inactive | An unlocked Perk/Discount/Competition not yet Used. | unused, missed |

Type values: `perk` `feature` `discount` `competition`. Order: as listed (D2).

---

## 2. Website

### 2.1 Memberships
Each Membership is an expandable block. Inside, split in two levels:

- Primary splitter (type), in order: Perks, Features, Discounts, Competitions.
- Secondary splitter (Category), nested under each type.

Rules:
- Type headers are the strong visual divider. Category headers are lighter, one level in.
- Render a type section only if it holds at least one item.
- Sort: type order (D2), then Category A–Z, then Perk title A–Z.

### 2.2 Marketplace
- A flat list of every Perk across all providers. Individual rows. No Membership grouping. No bundles.
- Same two splitters as 2.1: type (Perk → Feature → Discount → Competition), then Category.
- Each row opens the Perk tooltip (2.4).

### 2.3 Profile
Top section — five stats, this order:
1. Monthly Cost
2. Active Memberships
3. Total Available Perks / Discounts / Competitions
4. Total Active Perks / Discounts / Competitions
5. Active Features

Below the stats:
- Active Memberships (list).
- Unused Tiers (list). Renamed from Potential.

Active / Inactive split:
- Active: Perks, Features, Discounts, Competitions.
- Inactive: Perks, Discounts, Competitions. No Inactive Features (D5).
- Each is a collapsible box, collapsed by default on first load.

### 2.4 Perk tooltip (Marketplace mode)
On open, show in this order:
1. Brief explanation (the Perk description).
2. Cheapest Tier the Perk appears in, with its price.
3. If the user tapped a pricier instance, highlight that it is cheaper from the cheapest Tier.
4. Every higher Tier the same Perk also appears in.
5. All Perks included at that cheapest Tier and below.

---

## 3. App

### 3.1 Marketplace
- Mirrors 2.2 exactly. Same flat list, same splitters, same row, same tooltip (2.4).
- No grouping by Membership. No bundles. One Perk per row (D6).
- The drawer/tooltip must implement the full 2.4 logic, not a reduced version.

### 3.2 Home screen icons
- Replace all emoji with images.
- Source order: per-Perk image → per-Category image → branded fallback tile (provider mark). Never an emoji.
- Example: Disneyland Perk shows the Disneyland towers image.
- One visual treatment: same aspect ratio, same corner radius, same padding, same placeholder.

### 3.3 Profile
Mirrors 2.3 exactly: same five stats in the same order, Active Memberships, Unused Tiers, and the Active/Inactive split.
- Active/Inactive boxes collapsed by default on first load.
- No Inactive Features (D5).

---

## 4. Shared logic (Web + App identical)

### 4.1 Type splitter
- Order fixed: Perk → Feature → Discount → Competition (D2).
- Empty type sections are hidden.

### 4.2 Category splitter
- Nested under each type.
- Category A–Z. Items inside a Category: Perk title A–Z.

### 4.3 Search auto-expand
- While the query is non-empty, every collapsible box (type sections, Membership blocks, Active/Inactive boxes) is forced open. All matches visible, zero extra taps.
- Match test: query is a case-insensitive substring of title, description, provider, Tier, or Category.
- Empty/whitespace query: boxes return to their default (collapsed) and remembered states.
- Hide any box with zero matches while a query is active.

### 4.4 Tooltip logic
- Single source of truth: cheapest Tier, the "Tier and below" included set, and the higher-Tier list (2.4). Web and app call the same function.

### 4.5 Counts
- Available (non-Feature) = unlocked Perks/Discounts/Competitions that are not "will not use".
- Active (non-Feature) = of those, marked Used.
- Inactive (non-Feature) = of those, not Used.
- Active Features = Feature-type items on active Memberships.
- "Will not use" items are excluded from every count and list.

### 4.6 State model
- A non-Feature Perk is Active (Used) or Inactive (not Used).
- A Feature is always Active on an active Membership.
- "Will not use" is a separate flag that removes the item from counts and lists.

---

## 5. Component-level breakdown

| Surface | Web component(s) | App component(s) | Change required |
|---------|------------------|------------------|-----------------|
| Type/Category splitter | `data/catalog.js` ordering, `ui/perkui.jsx` PerkList | `app/theme.js` ordering, `app/components.jsx` rows | Set type order to D2 (see 6.7). Add Category sub-grouping under type. |
| Memberships (expandable, 2.1) | `pages/Profile.jsx` MembershipRow + new expand | `app/tabs/ProfileTab.jsx` | Make each Membership expand into type → Category breakdown. |
| Marketplace | `pages/Perks.jsx`, `ui/perkui.jsx` PerkList | `app/tabs/MarketplaceTab.jsx` | App: drop any Membership/tier grouping; render flat list split by type → Category. |
| Tooltip | `ui/PerkDrawer.jsx` (marketplace mode already does 2.4) | `app/components.jsx` PerkSheet | App: extend PerkSheet marketplace mode to full 2.4 (cheapest Tier, included set, higher Tiers). |
| Profile stats | `pages/Profile.jsx` Stat row | `app/tabs/ProfileTab.jsx` | Rename "Active Plans" → "Active Memberships". Match five stats + order. |
| Unused Tiers | `pages/Profile.jsx` "Potential memberships" | `app/tabs/ProfileTab.jsx` (was Marketplace/Potential) | Rename to "Unused Tiers" in both. |
| Active/Inactive split | `pages/Profile.jsx` `Sub` | `app/tabs/ProfileTab.jsx` | Remove Inactive Features. Reorder to D2. Force-open on search. |
| Search | `ui/perkui.jsx` SearchBar + box `open` state | same | `open = query ? true : remembered ?? default`. |
| Home icons | n/a | `app/tabs/HomeTab.jsx`, `app/components.jsx` PerkSquareTile | Replace emoji with image tiles + fallback. |

---

## 6. Implementation notes

### 6.1 Sorting
- Items: type order (D2) → Category A–Z → title A–Z.
- Tiers: by price ascending (cheapest first).
- Memberships: provider A–Z.

### 6.2 Grouping
- Memberships page: Membership → type → Category → Perk.
- Marketplace: type → Category → Perk. No Membership level.
- Never group Marketplace by Membership or bundle.

### 6.3 Tooltip
- Compute once: `cheapestTier`, `cheapestPrice`, `clickedHigher`, `includedAtOrBelow` (deduped to cheapest instance, sorted by D2), `higherTiers`.
- Web and app import the same helper. No divergent copies.

### 6.4 Collapsible behaviour
- Default: collapsed on first load (Active/Inactive boxes, Membership blocks).
- Search active: force open, ignore remembered state.
- Search cleared: restore default + remembered state.
- Empty section under an active query: hide.

### 6.5 Image / icon behaviour (app)
- Resolution order: `perk.image_url` → `category.image_url` → branded fallback (provider mark). Never emoji.
- Same tile size, radius, padding, object-fit across all icons.
- Lazy-load. Fixed dimensions to prevent layout shift.
- Generated images allowed; store the resolved URL on the Perk so it is stable.

### 6.6 Edge cases
- Perk in multiple Tiers: show once, at its cheapest Tier; list higher Tiers in the tooltip.
- Membership with zero Perks of a type: hide that type section.
- All items of a type are "will not use": type section hidden; counts unaffected (already excluded).
- Inactive Feature: impossible. If data implies one, treat as Active.
- Missing image: branded fallback, never a broken image or emoji.
- Search with no matches: show an empty-state line, keep boxes hidden.
- Unused Tiers empty: show "You have added everything available."

### 6.7 Data structure implications
- Type order constant becomes `["perk","feature","discount","competition"]`. Replace the current `FEATURE_ORDER` (feature-first) in `data/catalog.js` and `app/theme.js`. Update `featureThenAlpha` to use it.
- Add `image_url` to the Perk record (nullable). Optional `Category.image_url` map for fallback.
- Active/Inactive derives from `user_perk_state.used`; "will not use" derives from the dismissed/will-not-use flag. One field, one name, used by both platforms.
- Tier price/order comes from `perks.price` via the shared tier map. No `tiers` table.
- Counts are computed, never stored.

---

## 7. Parity checklist (must hold before ship)
- [ ] Type order is Perk → Feature → Discount → Competition everywhere.
- [ ] App Marketplace is a flat individual list, no Membership grouping.
- [ ] App tooltip shows cheapest Tier, higher Tiers, and the Tier-and-below set.
- [ ] Profile stats and order match on web and app; "Active Memberships" label.
- [ ] "Unused Tiers" name used on both. "Potential" removed.
- [ ] Search force-opens all boxes on both.
- [ ] No Inactive Feature anywhere.
- [ ] App Home uses images, no emoji.
