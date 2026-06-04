# Perki App Redesign Strategy
### Bringing the mobile app onto the new brand and website UX · 2026-06-04

---

## 1. The short version

The website redesign already produced a finished, brand-correct component library in the codebase: `src/ui/components.jsx`, `src/ui/perkui.jsx`, `src/ui/PerkDrawer.jsx`, `src/ui/brand.jsx` and the data helpers in `src/data/catalog.js`. The app does not. The app is a single 968-line file, `src/LegacyApp.jsx`, with its own blue theme, its own DM Sans type, emoji icons, inline styles, and its own Supabase data layer.

So this is not a visual tweak. It is a port. The right move is to keep the app structure you like (bottom nav, four-tab flow, collapsible sections, the slide-out detail panel) and rebuild each tab on top of the website's existing brand components instead of the legacy blue ones. Most of the brand work is already done and tested on the website. We are pointing the app at it.

This document covers strategy, information architecture, a component-by-component map, wireframe-level descriptions for all four tabs, the bottom-nav redesign, the slide-out and lowest-tier rules, visual and interaction recommendations, a technical plan, and the risks.

---

## 2. What we are starting from

**The app today (`LegacyApp.jsx`, mounted at `/app`):**

- Theme object `T` with a blue palette (primary `#0B3D91`, accent `#1E90FF`, page `#F8F9FC`, white surfaces). Every component reads from `T`, so the whole app is themed from one object.
- Type: DM Sans throughout, loaded from a Google Fonts `<link>`.
- Icons: emoji (🏠 💳 📍 ✨ 👤), used in nav and category rows.
- Five tabs in the bottom bar: Home, Current (memberships), Where, Potential, Profile.
- Its own Supabase fetching: `perks`, `tiers`, `user_memberships`, `user_perk_state`. Note it queries a `tiers` table that does not exist in the live database, so `tierPrices` ends up empty and the app silently falls back to `perk.price`. This is a latent bug to fix in the port.
- Good bones worth keeping: the `CollapsibleSection` component, the tier-hierarchy helpers (`getEffectiveTiers`, `getHighestTier`, `isHigherTier`), the detail callout pattern, and the dedup-by-titlegroup logic.

**The website (already on brand):**

- Brand tokens live in `tailwind.config.js`: eggshell page (`ink` `#F4F0E6`), raised surfaces (`ink2` `#FCFAF4`), indigo primary (`purple` `#2B2A6E`), gold value accent (`gold` `#E0A93B` / `golddeep` `#B07C1A` / `goldlight` `#F7ECD4`), ink text (`snow` `#23202A`), warm grey (`muted` `#6B6757`). Outfit for display, Work Sans for body. Radii `btn`/`card`/`modal`, shadows `sm`–`xl`, `ease-fluid` timing.
- Component library: `Button`, `GlassCard`, `TierPill`, `PerkCard`, `ProviderMark`, `TopNav`, `Footer`, `StickyCta`, `BottomTabs`, plus `perkui.jsx` (`Modal`, `ConfirmModal`, `CategoryChip`, `PerkListItem`, `PerkList`, `TierSelector`, `SearchBar`, `MembershipRow`, `RequestMembershipModal`) and `PerkDrawer` (the slide-out, with `marketplace` and `profile` modes).
- `BrandLogo` renders real provider logos from the Simple Icons CDN with an initials fallback.
- `data/catalog.js` already centralises tier maps (`buildTierMap` from `perks.price`), ordering (`featureThenAlpha`), and the write actions (`markPerkUsed`, `markPerkWontUse`).

The gap is simply that `LegacyApp.jsx` predates all of it and was never refactored.

---

## 3. Redesign strategy and principles

1. **Port, don't reinvent.** Reuse the website's tokens, components and drawer. The app should look like the website rendered for a phone, not a separate product.
2. **Keep the structure you like.** Bottom nav, the four-tab flow, collapsible boxed sections, and the tap-to-expand detail panel all stay. We change the skin and the components, not the navigation model.
3. **One source of styling truth.** Kill the `T` theme object. Everything reads Tailwind brand tokens, exactly like the website. No second palette can drift.
4. **One source of data truth.** Move the app onto `data/catalog.js` so tier pricing, ordering and write actions match the website and the `tiers`-table bug disappears.
5. **Value-first, calm, premium.** Gold is reserved for value moments (prices, "claimed", reminders). Indigo is the primary action. Eggshell keeps it warm and uncluttered. Generous spacing, one idea per row.
6. **Native where native is better.** Bottom tab bar, sheet-style drawer that slides from the bottom on mobile, large 44px+ touch targets, momentum scrolling, safe-area padding. We mimic the website's look, not its desktop layout.

---

## 4. Information architecture

**Decision to confirm:** the app currently has five tabs; your brief lists four (Home, Marketplace, Where to Use, Profile). Recommended resolution:

| App tab | Source today | What it becomes |
|---|---|---|
| **Home** | HomeTab | Your dashboard. The perks you already own, value claimed vs available, what is resetting or closing soon. Personal and signed-in. |
| **Marketplace** (formerly Perks / Potential) | PotentialTab + the public browse idea | The full library of every provider and tier. Browse, search, see what a perk costs, add a membership. Mirrors the website Marketplace. Absorbs the old "Potential" tab. |
| **Where to Use** | WhereTab | Category-led discovery (Travel, Banking, Streaming…). Kept, re-skinned. |
| **Profile** | ProfileTab + Current Memberships | Account, monthly cost, your memberships, and your perks split into **Active** and **Inactive**, both collapsed by default on first load. Absorbs the old "Current Memberships" tab. |

This folds five tabs into the four you asked for. "Current Memberships" content moves into Profile (it already lives near the Active Memberships block); "Potential" becomes "Marketplace". If you would rather keep Memberships as its own fifth tab, that is a one-line change — flag it and I will keep it.

**Global shell:** sticky top bar (Perki mark left, value counter right), scrollable content, fixed bottom tab bar. Auth screen and loading state re-skinned to brand.

---

## 5. Component-by-component map (website → app)

| Website component | App use | Adapt / Rebuild / Native |
|---|---|---|
| Tailwind brand tokens | Replace the entire `T` object | **Rebuild** the theme layer (delete `T`, use tokens) |
| `GlassCard` / boxed sections | Every card, stat box, cost summary, collapsible header | **Adapt** — already mobile-friendly; tighten padding for phone |
| `PerkCard` / `PerkListItem` | Perk rows in every tab | **Adapt** — `PerkListItem` is the canonical row; replace legacy `PerkTile` |
| `PerkList` | The list bodies inside collapsibles | **Reuse** with `mode="profile"` or `"marketplace"` |
| `PerkDrawer` (slide-out) | Replaces `PerkTooltip`, `PerkCalloutModal`, `PerkSquareTile` modal | **Reuse** — bottom-sheet on mobile, the single detail surface |
| `BrandLogo` | Provider marks in rows, headers, category chips | **Reuse** — replaces legacy initials-only `ProviderBadge` |
| `TierPill` / `TierSelector` | Tier labels and the add-membership tier picker | **Reuse** |
| `SearchBar` | Marketplace and Where search | **Reuse** |
| `MembershipRow` / `RequestMembershipModal` | Add / request membership in Marketplace | **Reuse** |
| `CategoryChip` + category meta | Where-to-Use category headers | **Adapt** — map legacy emoji categories onto brand chips |
| `Button` | All CTAs (Add tier, Remove, Log out, Visit) | **Reuse** |
| `BottomTabs` | The app tab bar | **Rebuild** to drive in-app state + 4 tabs + lucide icons (see §6) |
| `Modal` / `ConfirmModal` | Remove-membership confirm, request flow | **Reuse** |
| `CollapsibleSection` (legacy) | Provider/tier/Active/Inactive accordions | **Adapt** — keep the component, restyle to tokens |
| Tier helpers (legacy) | Lowest-tier and hierarchy logic | **Reuse**, but converge with `catalog.js` |
| Stat tiles (legacy Profile) | Available / Used / Will-not-use | **Rebuild** in brand (eggshell card, gold/indigo numerals) |

**Stays native to mobile (no website equivalent):** the fixed bottom tab bar, the bottom-sheet drawer gesture, the sticky compact app header, the 5-up Home grid, profile-photo upload, and safe-area insets.

---

## 6. Bottom navigation redesign

Keep the four-item layout and the "raised pill" treatment you like. Change the skin.

- **Items:** Home · Marketplace · Where · Profile.
- **Icons:** swap emoji for `lucide-react` line icons to match the website (`Home`, `LayoutGrid`, `MapPin`, `User`). Consistent stroke weight, 24px.
- **Bar:** `ink2` raised surface with a hairline `border` top, `shadow-lg`, rounded `modal` radius, floating ~10px off the bottom with safe-area padding. Frosted/`glass` backdrop like the website nav.
- **Active state:** icon and label switch to `golddeep`; a soft `goldlight` pill sits behind the active item; label weight goes to 600. Inactive items use `muted`. (Today the active state is a blue `#EFF6FF` chip — that becomes the gold tint.)
- **Motion:** 150ms `ease-fluid` colour/opacity crossfade; the active pill slides between items rather than popping.
- **Touch target:** each item min 56px tall, full-width hit area.

---

## 7. Tab-by-tab redesign (wireframe level)

Layout assumes a 390px-wide phone, 16px gutters, 12px inter-card spacing, eggshell page.

### 7.1 Home — "your perks"
- **Header:** "Your perks" in Outfit; right-aligned value chip "Used X / Y".
- **Value banner (new):** a single eggshell→gold-tint card showing claimed vs available value and a one-line nudge ("3 perks reset this week"). Gold numerals.
- **Segmented control:** Perks · Features · Competitions · Discounts (pill segmented control, indigo active fill).
- **Grouping toggle:** By reset / By category (small pills).
- **Body:** the 5-up square grid stays (it is good and native), re-skinned — rounded `card` tiles, provider `BrandLogo` chip top-right, gold "claimed" tick, dimmed when used/dismissed. Section headers in Outfit with a count badge.
- **Tap a tile →** opens the **PerkDrawer** (bottom sheet), not the old modal.

### 7.2 Marketplace — "the whole library"
- **Header:** "Marketplace" + a "Request a membership" `+` (opens `RequestMembershipModal`).
- **Search:** `SearchBar`, full width.
- **List:** providers as boxed collapsible sections (`BrandLogo` + name + "from £X/mo" using the **lowest** tier price). Inside, tiers as nested collapsibles ordered cheapest-first; active tiers carry a gold "Active" pill, others a `Button` "Add tier".
- **Rows:** `PerkListItem`. Tapping a perk opens the drawer in `marketplace` mode (read-only detail + "Visit provider" deep link).
- **Empty/search states** in brand muted text.

### 7.3 Where to Use — "by category"
- **Header:** "Where to use".
- **Body:** category cards (icon chip + label + perk count + stacked `BrandLogo`s of the providers in that category). Tap expands an inline boxed list of `PerkListItem`s on an eggshell raised panel (replacing the dark navy expansion).
- **Tap a perk →** drawer.

### 7.4 Profile — "account + your value"
- **Identity card:** avatar (upload), name (Outfit), email, "Log out" `Button` (ghost).
- **Stat row:** three brand stat tiles — Available (gold), Used (indigo), Will-not-use (muted). Eggshell cards, no more red/green/blue blocks.
- **Monthly cost:** collapsible cost summary, indigo total, per-provider breakdown using lowest-tier-aware pricing.
- **Active section (NEW rule):** "Active perks" — available, not-yet-used perks. **Collapsed by default on first load.**
- **Inactive section (NEW rule):** "Inactive perks" — used or will-not-use. **Collapsed by default on first load.**
- **Memberships:** providers as collapsibles with a "Remove" action (confirm via `ConfirmModal`), tiers nested and cheapest-first.

---

## 8. The two rules, made explicit

**Default to the lowest tier.** Everywhere a provider is summarised (Marketplace "from £X", Profile cost, Home dedup), the price shown and the default selected tier is the cheapest tier that carries the perk. The legacy helpers already support this (`getProviderTierOrder` sorts by price ascending; `getEffectiveTiers` returns "this tier and below"). The fix is to (a) make every price label read the **lowest** carrying tier, and (b) when adding a membership, default the `TierSelector` to the lowest tier rather than the first alphabetical. Converge this with `catalog.js` `buildTierMap` so the app and website agree.

**Active / Inactive collapsed by default.** Both Profile sections mount with `defaultOpen={false}`. No persistence on first load — every fresh visit starts collapsed. (If you later want "remember my last state", that is a localStorage flag, but the brief says collapsed on first load, so we start there.)

**Slide-out panel logic.** Retire the three legacy detail surfaces (`PerkTooltip`, `PerkCalloutModal`, the inline callout) and route every "tap a perk" through the single `PerkDrawer`. On mobile it becomes a bottom sheet: drag handle, provider logo + title header, description, reset/renewal meta, and mode-aware actions — `profile` mode shows "Mark as used" / "Will not use"; `marketplace` mode shows "Visit provider" deep link. One detail surface, one set of behaviours, matching the website.

---

## 9. Visual and interaction recommendations

- **Type scale:** screen titles Outfit 22/700; section headers Outfit 15/700; row titles Work Sans 14/600; meta Work Sans 12/500 muted. Tabular numerals for prices and counts.
- **Cards:** `ink2` fill, 1px `border`, `card` radius, `shadow-sm`; lift to `shadow-md` on press.
- **Colour discipline:** indigo = action, gold = value, eggshell = ground, muted = secondary. No raw red/green; use gold for positive ("claimed") and a restrained terracotta only for destructive confirm.
- **Motion (subtle, 150–250ms `ease-fluid`):** collapsible chevron rotate + height ease; drawer slides up with a backdrop fade; active-tab pill slides; tiles scale to 0.98 on tap; "Mark as used" triggers a one-shot gold check animation; skeleton shimmer on load instead of the spinner.
- **Empty states:** short, warm, on-brand ("Nothing here yet. Browse the marketplace to add a membership.").
- **Accessibility:** AA contrast (indigo on eggshell and gold-deep on eggshell both pass), 44px targets, focus rings, drawer focus-trap + Escape, `prefers-reduced-motion` to disable slides.

---

## 10. Technical implementation plan

**Reuse as-is:** `tailwind.config.js`, `index.css`, `ui/components.jsx`, `ui/perkui.jsx`, `ui/PerkDrawer.jsx`, `ui/brand.jsx`, `data/catalog.js`, `lib/supabase.js`.

**Rebuild:** the styling layer of `LegacyApp.jsx` (remove `T`), the bottom nav, and the perk-detail surfaces (replace with `PerkDrawer`).

**Recommended structure** — split the monolith into an app feature folder:

```
src/app/
  AppShell.jsx        // header + bottom nav + tab routing (state or nested routes)
  BottomNav.jsx       // 4 tabs, lucide icons, brand active state
  tabs/
    HomeTab.jsx
    MarketplaceTab.jsx
    WhereTab.jsx
    ProfileTab.jsx
  hooks/
    usePerksData.js   // perks, memberships, tierMap, used/dismissed + write actions
```

Lift all the data effects and callbacks out of `LegacyApp.jsx` into `usePerksData` so tabs are presentational and read from `catalog.js`.

**Phased delivery (low risk, shippable each step):**
1. **Re-skin in place.** Swap `T` to brand tokens, load Outfit + Work Sans, restyle the bottom nav to four brand tabs, set Profile Active/Inactive collapsed. Whole app goes brand-correct with minimal structural change. *(Started in this pass — see §12.)*
2. **Swap the detail surface.** Route taps through `PerkDrawer`; delete the legacy tooltip/modal.
3. **Adopt shared rows.** Replace `PerkTile`/`PotentialPerkTile` with `PerkListItem`/`PerkList`; replace `ProviderBadge` with `BrandLogo`.
4. **Converge data.** Move fetching to `usePerksData` on top of `catalog.js`; remove the dead `tiers` query; enforce lowest-tier pricing.
5. **Extract + restructure** into `src/app/` as above; retire `LegacyApp.jsx`.

**Routing:** today `/app/*` renders `LegacyApp` and `/app/account` renders the website `Profile`. After the port, the app tabs should be consistent — either keep internal tab state (simplest) or move to nested routes `/app`, `/app/marketplace`, `/app/where`, `/app/account` so deep links and the website `BottomTabs` line up.

**Verification each phase:** `vite build` must pass; spot-check on a 390px viewport; run the `design:accessibility-review` skill before handoff.

---

## 11. Risks, blockers, dependencies

- **The `tiers` table does not exist live.** Legacy queries it and silently degrades. Until data converges on `catalog.js`/`perks.price`, double-check every price label after the re-skin. *(Known from the website fix.)*
- **Monolith coupling.** `LegacyApp.jsx` mixes data, state and view in one 968-line file. Phase 1 (re-skin) is safe; phases 4–5 (data + extraction) need care and a build check at each step.
- **Provider logos.** `BrandLogo` depends on the Simple Icons CDN; OVO and Sky can fall back to initials, and the OVO mark is currently wrong (already on the to-do). Network-blocked users see initials — acceptable, but note it.
- **Two profiles exist.** The website `Profile.jsx` (`/app/account`) and the legacy `ProfileTab` overlap. Pick one as canonical (recommend the website one, extended with Active/Inactive) to avoid divergence.
- **Auth surface.** Legacy has its own `AuthScreen`; the website has `Auth.jsx`. Consolidate so sign-in looks identical in both places.
- **Fonts.** Outfit + Work Sans must be loaded in the app shell (and ideally self-hosted for performance) or headings fall back to system fonts.
- **Scope creep.** Phases 2–5 are a meaningful refactor. Phase 1 delivers the brand win immediately; sequence the rest so nothing ships half-ported.

---

## 12. What was done in this pass

Phase 1 was started in code (see the build that ships with this document): the app theme was moved onto brand tokens, Outfit + Work Sans loaded, the bottom navigation rebuilt to the four brand tabs with the gold active state, and the Profile Active/Inactive sections set to collapsed-by-default on first load. The remaining phases are sequenced above.
