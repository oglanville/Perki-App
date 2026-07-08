# Perki spec: provider types (life-category labels and filters)

_Status: ready for engineering · Owner: Ollie · Scope: catalogue, Profile (web + app), email, engines · Last updated: 2026-06-24_

## 1. Summary

Tag every membership with the real-world service category its provider sits in: Energy, Mobile, Internet, Gym, Banking, TV and streaming, Insurance, and so on. These are **labels and filters**, not a single pick per category. A user can hold more than one membership in a category (two streaming services, two travel cards), and a provider can sit in more than one category. The labels show on the Profile and in the email membership section, let the user filter their memberships by category on Profile, and feed the savings and consolidation engines so their advice can reason about "your energy provider" or "two mobile providers".

This is a new provider-level concept and is distinct from the existing per-perk `category` field (Banking, Travel, Insurance, and the rest), which classifies individual perks. Provider type classifies the membership and the provider behind it.

## 2. The model

Introduce a provider-type tag set. Because a provider can span categories (Amazon is shopping and streaming; a packaged bank account touches banking and insurance), a membership carries an array of one or more types.

Standard set (fixed list, extendable):

- Banking, Energy, Mobile, Internet, TV and streaming, Gym and fitness, Insurance, Groceries, Travel, Dining, Shopping, Loyalty, Other.

Where it lives:

- MVP: a curated map in the catalogue layer keyed by provider (with a per-membership override where needed), for example `PROVIDER_TYPES = { "OVO Energy": ["Energy"], "Vodafone": ["Mobile"], "Sky TV": ["TV and streaming"], "Amazon": ["Shopping", "TV and streaming"], "Monzo": ["Banking"], "Nationwide": ["Banking", "Insurance"] }`. This avoids a database migration and is fast to curate alongside the existing brand and logo maps.
- Later: promote to a `provider_types text[]` column on the catalogue if the map grows or partners self-tag. The UI and engines read the same helper either way, so this is a backend swap with no interface change.

Helper: a single `providerTypes(provider, membership)` returning the array, used everywhere, defaulting to `["Other"]` when untagged.

## 3. Where it appears

A. Email membership section. Each membership row gains its category label, for example "Energy · OVO Beyond", "Mobile · Vodafone", "Banking · Monzo Max". Where a membership has more than one type, show the primary (first) one to keep rows tidy.

B. Profile memberships section. Two things:

- Each Active Membership row shows its category label as a small chip next to the provider.
- A filter row of category chips sits above the Active Memberships list: All, then each category the user actually holds (Energy, Mobile, Banking, and so on), in a fixed order. Selecting a chip filters the visible memberships to those tagged with that category. As labels and filters, a membership tagged with two categories appears under both. The default is All. Selecting All clears the filter.

C. The engines and system. The savings and consolidation engines read the same tags:

- Savings can speak in category terms ("your energy provider is OVO") and, in future, compare providers within a category.
- Consolidation already looks for category overlap; provider types let it say "you hold two mobile providers" cleanly, in addition to the perk-category overlap it uses now.

## 4. Filter UX

- A horizontal, swipeable chip row above the Active Memberships list, matching the marketplace filter style: All plus one chip per category the user holds.
- Single select, like the marketplace tier and category rows. Selecting a category filters; selecting All resets.
- The chip set is derived from the user's held memberships, so empty categories never show.
- On mobile the row scrolls horizontally; chips are large enough to tap.
- The filter only affects the Active Memberships list, not the rest of the Profile.

## 5. Component breakdown

- providerTypes helper (catalogue layer): provider and membership in, category array out.
- MembershipTypeChip: the small category label shown on a membership row, in the email and on Profile.
- MembershipTypeFilter: the chip row above Active Memberships on Profile, holding the selected category and filtering the list.
- Reuse the existing chip styling from the marketplace so this matches the rest of Perki.

## 6. Data requirements

- No new user input. The tags are catalogue metadata, not something the user sets.
- Source: the `PROVIDER_TYPES` map (MVP) or a `provider_types` column (later). Read through the `providerTypes` helper only, so the storage choice is hidden from the UI.
- The email reads the tag per held membership at send time, alongside the data it already loads.
- No change to `user_memberships`; tags are derived from the provider and membership the user holds.

## 7. Edge cases

- Untagged provider: defaults to "Other"; still shows a chip so nothing looks broken. Keep an eye on the "Other" bucket as a sign the map needs extending.
- Provider in multiple categories: appears under each matching filter; the email row shows the primary (first) category to avoid clutter.
- A category with only one held membership: still gets a filter chip; selecting it simply shows that one membership.
- No memberships held: the filter row is hidden.
- Long category names: keep the standard set short; chips truncate cleanly if needed.

## 8. Implementation notes

- Web Profile is `src/pages/Profile.jsx`; app Profile is `src/app/tabs/ProfileTab.jsx`; the email is `supabase/functions/daily-digest/index.ts`. Add the `PROVIDER_TYPES` map and `providerTypes` helper in the shared catalogue/theme layer so all three read the same source.
- This pairs naturally with the Add Membership flow just shipped: the same memberships now carry a visible category, and the filter row sits directly above the Active Memberships list the button feeds.
- Keep provider type strictly separate from the per-perk `category` field in code and copy, to avoid confusion.
- Start with the curated map covering the current 24 providers; it is a few lines and easy to review for accuracy, in keeping with the manual, accuracy-first approach.

## 9. Acceptance criteria

1. Every membership resolves to at least one provider type via a single shared helper, defaulting to "Other".
2. The email membership section shows each membership's category label.
3. Profile shows a category chip on each Active Membership and a filter chip row above the list, derived from the categories the user holds.
4. Selecting a category filters the Active Memberships list; All resets it; multi-category memberships appear under each.
5. The savings and consolidation engines can read provider types through the same helper.
6. No new user input, no `user_memberships` change, and the storage choice (map or column) is invisible to the UI.
