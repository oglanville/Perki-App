# Perki spec: Marketplace Compare (website only)

_Status: ready for engineering handoff · Scope: website Marketplace only · Last updated: 2026-06-10_

## 1. Summary

Compare lets a person view two tiers of the same membership side by side, so they can see exactly what an upgrade adds before they commit. It is a Marketplace-only mode on the website. It is off by default and is entered only by pressing the Compare button.

Typical use: the left pane shows a free bank account or base tariff, the right pane shows the same provider on a higher tier with a small extra cost, and the difference in perks, features, discounts, competitions and categories is immediately visible.

Out of scope: the app, Profile, Home, and the daily email. No data model or backend changes. Compare is a presentation layer over the existing Marketplace catalogue.

## 2. Behaviour overview

Default Marketplace is a single column, unchanged. Pressing Compare splits the view into two equal panes. Both panes share one set of top filters and one search bar, which stay synchronised. Each pane has its own tier selector, so the left and right tiers can differ. Pressing Compare again (now reading Exit compare) returns to the single-column Marketplace.

The two panes always show the same membership and the same Marketplace structure (perks, features, discounts, competitions, grouped the same way). Only the selected tier differs between them, which is the whole point of the comparison.

## 3. Component breakdown

### 3.1 Compare toggle button
- Position: directly beneath the existing Request button in the Marketplace header, right-aligned, same width and styling family as Request.
- Label: "Compare" when off, "Exit compare" when on.
- State: reflects `compareMode` (boolean). Acts as a clear on/off control.

### 3.2 Compare layout container
- Replaces the single `PerkList` column when `compareMode` is true.
- Two equal-width panes (50 / 50) with a consistent gutter between them.
- Shared header above the panes: the three filter rows (Memberships, Tiers-as-global is not used here, see below, Categories) and the search bar, rendered once and applied to both panes.

### 3.3 Shared filter bar (one instance, drives both panes)
- Memberships row, Categories row, and the search input behave exactly as in standard Marketplace.
- These are global to the comparison: changing them re-filters both panes identically.
- The global Tiers row is hidden in Compare mode, because tier is the dimension being compared and is selected per pane instead (see 3.4).

### 3.4 Per-pane tier selector
- Each pane has its own Tiers chip row at the top of the pane.
- Shows the tier chips available for the currently selected membership, with price labels, identical in source to the standard Marketplace Tiers row.
- Selecting a tier in a pane changes only that pane.
- Default on entry: left pane selects the lowest tier (cheapest, lowest `sort_order`); right pane selects the next tier up. If only one tier exists, see edge cases.

### 3.5 Pane content area
- Each pane renders the same Marketplace content structure for its selected tier: Perks, Features, Discounts, Competitions, grouped within their Categories, in the established order.
- Content respects the shared Memberships, Categories and search filters, then its own tier.
- A short pane header shows the membership name, the selected tier, and the tier price label, so each side is self-labelling.

## 4. Interaction rules

### 4.1 Entering Compare mode
- Trigger: press Compare. No other entry point.
- On entry, seed both panes from current state: keep the selected membership, category and search; set left tier to the cheapest available tier and right tier to the next tier up.
- If no membership is selected on entry, see edge cases (4.5).

### 4.2 Exiting Compare mode
- Trigger: press Exit compare. No other exit point.
- On exit, return to single-column Marketplace. Preserve the shared Memberships, Categories and search selections. The single-column Tiers selection resets to "All tiers" (the standard default), since per-pane tiers have no single equivalent.

### 4.3 Selecting tiers
- Tier is chosen independently in each pane and affects only that pane.
- Tier selection never changes the membership; both panes always show the same membership.
- The two panes may show the same tier (allowed, produces identical content) without error.

### 4.4 Syncing filters
- Memberships, Categories and search are global and apply to both panes on every change.
- Changing the membership re-seeds both panes' tier selectors to that membership's tiers, defaulting to cheapest (left) and next-up (right).
- Category and search changes filter both panes identically and do not change either pane's selected tier.
- The existing cheapest-tier and empty-chip-hide rules continue to apply to the shared Memberships and Categories rows, and to each pane's own tier row.

## 5. Edge cases

| Case | Expected behaviour |
|------|--------------------|
| No membership selected when Compare is pressed | Compare needs a single membership to compare its tiers. Either keep Compare disabled until a membership is selected, or prompt "Pick a membership to compare its tiers." Recommended: disable the Compare button (with a tooltip) until a membership is chosen. |
| Membership has only one tier | Nothing to compare. Both panes show that single tier; show an inline note in the right pane: "Only one tier available for this membership." Compare still renders rather than erroring. |
| Membership has exactly two tiers | Left = tier 1, right = tier 2. Standard case. |
| Membership has three or more tiers | Default left = cheapest, right = next up. User can change either pane to any available tier. |
| A category or search leaves one pane empty | That pane shows the standard "No perks match your filters." empty state; the other pane renders normally. The panes never collapse or resize because one is empty. |
| Tier becomes unavailable after a filter change | If a pane's selected tier no longer has any matching content for the active filters, keep the tier selected and show the empty state, consistent with single-column behaviour. The tier itself is not auto-changed by category or search. |
| Same tier selected in both panes | Allowed. Both sides show identical content. No warning required. |
| Switching membership while comparing | Both panes follow to the new membership and re-seed tiers (cheapest / next-up). |

## 6. Implementation notes

### 6.1 State
- Add to the Marketplace page state: `compareMode` (boolean), `leftTier` (string or null), `rightTier` (string or null).
- Keep the existing shared state: `membership`, `category`, `query`. These continue to drive both panes.
- The existing single-column `tier` state is unused while `compareMode` is true; reset it to null on exit.
- Derive each pane's rows from the existing `baseRows` (membership-scoped) plus the shared category and search filters, then that pane's own tier. Reuse `dedupeCheapest` per pane only when no tier is selected, which in Compare should not happen because each pane always has a tier; so each pane shows the full set for its tier (no dedupe needed inside a single tier).
- Reuse the existing `tierChips`, `matches`, and empty-chip-hiding logic. Per-pane tier rows are the same `tierChips` source, rendered twice.

### 6.2 Layout and responsive
- Panes are a two-column CSS grid (`1fr 1fr`) with a gutter, inside the existing Marketplace container width.
- Each pane scrolls independently if content height differs, so a long left pane does not stretch the right.
- Responsive: two equal panes do not fit comfortably on a phone. Below the `md` breakpoint, stack the panes vertically (left above right), each keeping its own tier selector and pane header, with the shared filters and search above both. This is the recommended default; the alternative (hiding Compare on small screens) is weaker because Compare is most useful on the exact tier decision a mobile user is making. Confirm the breakpoint choice in review.
- The shared filter bar and search render once, full width, above the panes in both layouts.

### 6.3 Reuse and isolation
- Compare is a website-only change. Do not touch `src/app/` (the app Marketplace), Profile, Home, or the email.
- Build the split view inside the existing Marketplace page (`src/pages/Perks.jsx`) or a dedicated `CompareView` child it renders when `compareMode` is true, to keep the single-column path untouched.
- Each pane reuses the existing perk-list rendering component so structure, grouping and styling stay identical to standard Marketplace by construction.

### 6.4 Accessibility and clarity
- The Compare button is a labelled toggle (`aria-pressed`).
- Each pane carries an accessible label naming its membership and tier, so screen-reader users can tell the panes apart.
- Tier chips remain keyboard-focusable and operate independently per pane.

## 7. Acceptance criteria

1. A Compare button sits directly beneath Request on the website Marketplace and toggles to Exit compare when active.
2. Pressing Compare splits the Marketplace into two equal panes; pressing Exit compare restores the single column.
3. Memberships, Categories and search are shared and stay synchronised across both panes.
4. Each pane has its own tier selector; changing one pane's tier does not affect the other.
5. Both panes always show the same membership and the same Perks / Features / Discounts / Competitions / Categories structure.
6. On entry, left defaults to the cheapest tier and right to the next tier up.
7. All edge cases in section 5 behave as described, with no console errors and no layout collapse on empty panes.
8. On screens below the chosen breakpoint, panes stack vertically with shared filters above.
9. No app, Profile, Home or email behaviour changes.
