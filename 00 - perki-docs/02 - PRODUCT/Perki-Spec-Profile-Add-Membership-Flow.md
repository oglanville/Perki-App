# Perki spec: Add Membership button and onboarding-style flow (Profile)

_Status: ready for engineering · Owner: Ollie · Scope: Profile page, web + app · Last updated: 2026-06-24_

## 1. Summary

Add a clear, primary way to add memberships from the Profile page: an "Add Membership" button beside the Active Memberships header that opens a two-step modal. Step one is a searchable, alphabetical list of memberships; step two picks a tier (or "No tier"); confirming adds the membership to the user's Active Memberships and writes it to the backend. The flow is deliberately built to mirror the future onboarding experience, so the same two screens can be reused there.

## 2. Entry point: the Add Membership button

- Label: "Add Membership".
- Placement: on the Profile page, aligned with the Active Memberships section header (right-aligned beside the heading on wider screens, full-width directly under the heading on narrow screens).
- Style: primary action button in the brand style (indigo), consistent with other primary buttons.
- Behaviour: opens the Add Membership modal at step one. This is the primary entry point for adding memberships; any existing "Unused Tiers" upgrade path remains for upgrading a held membership, but adding a new one happens here.

## 3. Modal step one: find a membership

A. Search

- A search bar pinned to the top of the modal, focused on open.
- Real-time filtering as the user types, matching on provider and membership name only.
- Results are memberships only. Perks, features, discounts and competitions never appear here.
- Matching is case-insensitive and substring-based.

B. Primary list

- The default list (empty search) shows all memberships in the catalogue, in alphabetical order by provider then membership.
- Each row shows the provider logo and the membership name (and provider if it differs from the membership name).
- Tapping a row advances to step two for that membership.
- Memberships the user already holds are still shown but marked "Added" (see edge cases).

## 4. Modal step two: select a tier and confirm

A. Tier selection

- Header names the chosen membership, with a back control to return to step one.
- Show all tiers for that membership, in price order low to high, each with its name and price label.
- Always offer a "No tier" option for memberships with no tiers, or when the user does not want to specify one.
- Selecting a tier (or "No tier") is the single action needed; there is no separate extra step.

B. Confirmation

- On selection, write the membership to the user's Active Memberships and close the modal back to the Profile page, where the new membership now appears.
- Trigger the backend write and any dependent recomputation (the user's perk set, dashboard counts, "what to use" lists), then refresh the Profile view.
- Show a brief inline success state; on error, keep the modal open with a retry.

## 5. UX rules

- The flow should feel identical to the future onboarding flow, so build the two screens as reusable pieces.
- Smooth transitions between step one and step two; the modal slides or cross-fades rather than reloading.
- Clear back navigation from step two to step one, and a single close control that exits the whole flow.
- No unnecessary steps: search or scroll, pick a membership, pick a tier or "No tier", done.
- Minimal, on-brand UI consistent with the rest of Perki (eggshell, indigo, gold; Outfit and Work Sans).
- Fully usable on mobile: large tap targets, the modal fills the screen on narrow widths.

## 6. Component breakdown

- AddMembershipButton: the trigger beside the Active Memberships header; opens the modal.
- AddMembershipModal: the container, owning the two-step state (step one / step two), the selected membership, and the selected tier, plus open/close.
- MembershipSearch: the search input with real-time filtering, memberships only.
- MembershipList: the alphabetical, filtered list of membership rows; row tap selects a membership and advances.
- TierSelect: the step-two screen listing the membership's tiers plus a "No tier" option, a back control, and the confirm-on-select behaviour.
- Reuse existing building blocks: the brand modal wrapper, the provider logo component, and the existing tier chip styling, so this matches the Marketplace and drawer.

## 7. Data requirements

- Membership catalogue: derive the full membership list and their tiers from the existing `buildMembershipCatalog` over the perks catalogue, which already yields `{ provider, membership, tiers: [{ tier, price_label, sort_order }] }`. Search filters this list; step two reads the chosen membership's `tiers`.
- The list must be memberships only, so it comes from the catalogue grouping, never from individual perk rows.
- Write path: reuse the existing `addMembership(userId, provider, membership, tier)`. It already removes any existing row for that provider and membership before inserting, so re-adding updates the tier rather than duplicating.
- Storage: `user_memberships (user_id, provider, membership, tier)`. For "No tier", store `tier` as null (see implementation notes), and continue to gate everything on cadence and status, not dates.
- After the write, refresh the same data the Profile already reads (held memberships, derived perks) so the new entry and its perks appear immediately.

## 8. Implementation notes

- Web lives in the Profile page (`src/pages/Profile.jsx`); app lives in the Profile tab (`src/app/tabs/ProfileTab.jsx`). Build the modal once per surface from shared logic, mirroring how Marketplace and the perk drawer are kept in parallel across web and app.
- The catalogue and `addMembership` already exist, so the work is the button, the modal, the two screens, and wiring confirm to `addMembership` then a refresh. No new tables.
- Handle "No tier" end to end: `addMembership` must accept a null or empty tier, and any tier-price or tier-label lookups must treat a missing tier safely (no crash, no "undefined" shown). Where a held membership has no tier, show just the provider and membership name without a tier chip.
- Keep the membership list query-light: it is the same in-memory catalogue the Marketplace uses, so no extra fetch is needed.
- Build the two screens so the future onboarding flow can import them unchanged.

## 9. Edge cases

- Membership with no tiers: step two shows only the "No tier" option (or auto-selects it with a single confirm), and the membership is added with a null tier.
- "No tier" chosen deliberately: same as above; stored with a null tier and displayed without a tier chip.
- Already-held membership: mark it "Added" in the list. Tapping it should let the user change the tier (which updates the existing row via `addMembership`), not create a duplicate.
- No search results: show a short empty state ("No memberships match"), with the option to request a membership via the existing request flow.
- Backend write fails: keep the modal open, show an inline error and a retry; do not optimistically leave a phantom membership on the Profile.
- Offline or not signed in: disable confirm with a clear message; never lose the user's selection.
- Long membership or tier names: truncate cleanly; never break the row layout.

## 10. Acceptance criteria

1. An "Add Membership" button sits beside the Active Memberships header on both web and app and opens the modal.
2. Step one shows all memberships alphabetically, filters in real time, and shows memberships only.
3. Tapping a membership advances to step two with clear back navigation.
4. Step two lists that membership's tiers in price order plus a "No tier" option.
5. Selecting a tier or "No tier" adds the membership to Active Memberships, writes via `addMembership`, and the Profile refreshes to show it with its perks.
6. Memberships with no tiers, and the "No tier" choice, are handled without errors and display without a tier chip.
7. Re-adding a held membership updates its tier rather than duplicating it.
8. The flow is minimal, on-brand, mobile-friendly, and built so onboarding can reuse the same two screens.
