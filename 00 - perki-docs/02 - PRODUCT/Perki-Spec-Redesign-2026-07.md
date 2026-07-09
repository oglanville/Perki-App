# Perki redesign specification — website, daily email, catalogue

_2026-07-09 · Implementation-ready. Brand locked (eggshell, indigo, gold, Outfit/Work Sans). Prototypes and data files live in `00 - perki-docs/04 - WORKING FILES/redesign-2026-07/`._

## 0. What ships with this spec

| Deliverable | File |
|---|---|
| Homepage prototype | `redesign-2026-07/prototype-home.html` |
| Perks page prototype | `redesign-2026-07/prototype-perks.html` |
| Profile prototype | `redesign-2026-07/prototype-profile.html` |
| Daily email prototype (Beehiiv-compatible) | `redesign-2026-07/prototype-daily-email.html` |
| Proposed perks + corrections (review list) | `redesign-2026-07/proposed-perk-additions.md` |
| Supabase-ready SQL (run after approval) | `redesign-2026-07/proposed-perk-additions.sql` |

All prototypes are self-contained HTML, viewable in any browser, sized mobile-first for iPhone 13 (390px).

## 1. Website (mob.co.uk-inspired)

### 1.1 Design principles (from the mob analysis, translated to Perki)

1. **One loud family, two voices.** Outfit 900 at line-height 0.95 for display (44-64px hero, 26-30px H2); Outfit 600 for card titles, nav and labels; Work Sans 400/500/600 for everything else. Sentence case everywhere. Zero letter-spacing, zero all-caps except 11px eyebrows. Weight does the shouting.
2. **Pages are shelves.** Every content section = H2 + one-line sub + a horizontally scrolling rail of uniform 1:1 cards (16px radius, text below the tile, never overlaid) that bleeds off the right edge. Rhythm through repetition, not bespoke sections.
3. **Pill every interaction.** 48px fully-rounded buttons (44px on dense pages): solid indigo primary, hairline-border ghost secondary, gold for the standout footer CTA. Filter chips 38px, selected = solid indigo.
4. **High contrast via indigo bands, not photography.** Perki has no lifestyle photo library yet, so contrast alternation is: eggshell base → raised cards → full-bleed indigo band (proof/stats/quotes) → gold-tint panels (consolidation, highlights). Category glyph tiles stand in for photography; swap for lifestyle imagery later without layout change.
5. **Narrative order: utility → story → proof → engines → capture.** Hero (noun-payoff headline + 3 checks + CTA) → instantly useful bundle shelf → editorial interstitial → second shelf → indigo proof band (stats + first-name quotes) → engines split → email capture. The same CTA ("Get the daily email") recurs at strip, hero and capture.

### 1.2 Page structures

**Homepage** (`prototype-home.html`): announcement strip → sticky header (logo, 4 links, Log in ghost, Join pill) → hero with data-tile visual grid (savings found, provider logos, perks ready, overlap flag — real product values, not stock) → "Tonight, sorted" cinema shelf → editorial interstitial → "Going away, covered" holiday shelf → indigo proof band → engines split (Savings/Consolidation, mirrors the email) → email capture with reassurance microcopy → footer with repeated gold CTA.

**Perks page** (`prototype-perks.html`): page display head → sticky two-row chip filter (row 1 = bundles/moments with counts, row 2 = type + "Held by you") → 2-col card grid (4-col ≥768px) → tier ladder block. Card anatomy: 1:1 glyph tile with provider logo overlay top-right, title (Outfit 600 15px), meta ("Provider · from Tier"), tags (type + cadence/usage). Display-logic upgrades: (a) "from {lowest tier}" on every card, (b) inverse "Also in {cheaper tier}" indigo tag when a cheaper tier covers it, (c) the **tier ladder** — tiers as rungs, held tier solid indigo, verdict chip = cheapest tier covering the user's used perks ("You hold this" / "Not worth it for you" / "Save £x"). The ladder replaces the current Compare modal as the default compare surface.

**Profile** (`prototype-profile.html`): "Morning, {name}" display head → indigo **verdict card** (one sentence stating available perks + savings on the table, then 4 stat tiles: Available / Have used / Will not use / Memberships) → membership rows (logo, name · tier, perk count · price, inline engine badge: "Save £x/mo" indigo or "Right-sized" gold, partner-sourced tiers labelled "Partner perk") → "Worth a tap today" items with cadence chip + three-way status segment (Have used / Have not used / Will not use) → settings card (7am email toggle, engine toggles, log out).

### 1.3 Component library (web)

| Component | Spec |
|---|---|
| Pill button | h48 (44 dense), radius 999, Work Sans 700 14-15px; primary indigo/white, hover `#3A388F`; ghost 1.5px border; gold variant for footer CTA only |
| Chip | h38, radius 999, 13px 600; selected solid indigo; optional count badge (gold-tint pill) |
| Perk card | 236-290px wide, radius 16, raised bg, 1px border, shadow `0 1px 2px rgba(43,42,40,.06)`; 1:1 tile + body; provider logo 28-34px white rounded square overlay |
| Rail | flex, gap 14, `overflow-x:auto`, scroll-snap, negative margins so cards bleed off-edge, hidden scrollbar |
| Shelf header | H2 + count pill + one-line sub, 4px/14px spacing |
| Ink band | full-bleed indigo, white display type, gold stat numerals, quote cards `rgba(255,255,255,.07)` |
| Verdict card | indigo, radius 16, gold eyebrow, Outfit 800 24px headline, 4 stat tiles |
| Tier ladder | horizontal rungs 190px, held = solid indigo, verdict chip per rung |
| Status segment | 3 equal buttons in 999-radius track, selected solid indigo, exact copy: Have used / Have not used / Will not use |
| Membership row | radius 16, logo + name·tier + meta + engine badge + chevron |
| Eyebrow | 11px, 800, letter-spacing .12em, uppercase, gold-deep — the only uppercase allowed |

### 1.4 Performance and cognitive-load rules

No JS beyond what filtering needs; no animation except native scroll; system-quality font loading (two families, five weights total); Clearbit → Simple Icons → favicon → initials fallback chain for all provider marks (already in `theme.js`); every section answers one question; max two CTAs visible per viewport.

## 2. Daily email (WHOOP-inspired)

### 2.1 Structure (fixed block order)

1. **Logo band** — slim indigo bar, wordmark only.
2. **Verdict hero** — uppercase eyebrow (date · "Your daily Perki"), Outfit 900 34px 2-line headline that characterises the day ("One morning, seven perks ready."), then a short personalised paragraph weaving 2-3 real stats in prose (WHOOP's 2026 narrative direction).
3. **Summary card** — dark indigo rounded card, "Here's how it stands", 3-4 icon + one-sentence stats with **numbers bolded in gold**, comparisons inline ("+4 vs June").
4. **Section pill: Use today** (gold) — 3-6 metric rows: 42px icon disc + stat sentence + meta line (membership · cadence · status).
5. **Split-screen engines** (kept per requirement) — Savings (raised card, big £ numeral) + Consolidation (gold-tint card, overlap count); 50/50 that stacks on mobile.
6. **Section pill: Your week so far** (indigo) — the one real chart: live-text horizontal bars (nested tables, gold fills, no images), plus a one-line insight sentence.
7. **Section pill: Your memberships** (indigo) — compact rows with engine badges, truncated at 3 + "+ n more".
8. **Single CTA** — one pill, "See today's perks".
9. **Footer** — reassurance line, preferences/unsubscribe, address.

### 2.2 Content layout rules

- Coloured full-width **section pills are the only dividers** — never hairline rules. Gold pill = act now; indigo pill = review.
- **One sentence per stat, bold the number** (gold `#E0A93B` on dark, ink elsewhere). Comparisons always inline ("+£6 vs yesterday"), never arrow glyphs.
- Centred: hero, summary card, pills, CTA, footer. Left-aligned: metric rows, engine cards, chart.
- Exactly **one chart** and **one CTA** per email. Numerals in engines/chart are Outfit 800-900, 30px+.
- Coach voice, second person, congratulate first ("Yesterday you used…"), each section carries a why-it-matters line. No dates shown for resets — cadence words only (spec: Cadence-Status rules still bind).
- Modular: every block is a standalone table — weekly Beehiiv sends reuse blocks 1-3 + 5 + 8-9 with a "Your week" hero.

### 2.3 Email component library

Verdict hero · summary card (dark, icon-sentence rows) · section pill (gold/indigo) · metric row (icon disc + sentence + meta) · engine pane pair (raised + gold-tint) · live-text bar chart · membership row with badge · CTA pill · footer. All table-based, inline-styled, live text throughout (only images are provider logos if added later), 600px container, `.stack` media query for mobile — Beehiiv custom-HTML safe.

### 2.4 Migration

Rebuild `buildEmailHtml()` in `supabase/functions/daily-digest/index.ts` around these blocks. Data already available per user: counts, savings moves, consolidation, cadence, statuses. New requirement: per-day usage counts for the chart — derive from `user_perk_state.last_used_at` (column exists, dormant). Keep subject line format; move the "verdict" sentence generation into a small helper so daily and future weekly share it.

## 3. Catalogue expansion (proposed, awaiting approval)

~66 verified new perks (≈85 rows after variant expansion) and 20 corrections across 20 providers — full list in `proposed-perk-additions.md`, executable in `proposed-perk-additions.sql`, all sourced from official UK pages on 2026-07-08. Three items need Ollie's call first: Boots Price Advantage conflict, Amazon Prime Gaming → Luna, Amazon Student tier rename. After approval: run SQL, mirror into `Perks_Rows.xlsx`, re-run the bundle counts.

## 4. Corrected membership → tier → perk mapping

### 4.1 Structural findings

1. **Two tier kinds exist and the model only supports one.** Hierarchical (Monzo, Revolut, Deliveroo, Cineworld groups, Costco, Santander, Tesco, Amex, BA, Nationwide, Sky): price-ordered, lower tiers' perks inherit upward — current `getEffectiveTiers` logic is correct. Variant (Spotify plans, Railcard types, National Trust compositions, Amazon Prime vs Student): parallel products where inheritance is WRONG (e.g. Family price > Individual, but Family should not inherit Student).
2. **BA tiers all price £0**, so `getProviderTierOrder` (price sort) returns arbitrary order; only the front-end `TIER_RANK` map saves display. Backend savings engine sees no order.
3. **Mis-tiered rows** found: BA priority boarding (Bronze, not Silver; Gold duplicate), Santander fee-free overseas (Edge, not Edge Up). Fixed in the SQL.

### 4.2 Authoritative fix (Supabase-ready)

Add two columns to `perks` (and `Perks_Rows.xlsx`):

```sql
alter table perks add column tier_kind text not null default 'hierarchical' check (tier_kind in ('hierarchical','variant'));
alter table perks add column tier_rank int; -- explicit order within provider; replaces price-derived ordering
```

- Set `tier_kind='variant'` for Spotify, Railcard, National Trust, Amazon (Student), Cineworld (groups are hierarchical for pricing but variant for inheritance — a member of Group 2 does not "hold" Group 1; set variant and duplicate rows per group, which the catalogue already does).
- Set `tier_rank` explicitly everywhere (BA: Blue 0, Bronze 1, Silver 2, Gold 3).
- Update `getEffectiveTiers`/`getProviderTierOrder` (in `src/data/catalog.js`, `src/app/theme.js`, and the digest function) to: order by `tier_rank`, and return only the held tier when `tier_kind='variant'`.
- Savings engine: only propose moves within `hierarchical` providers; for `variant` providers compare variants only when perk coverage is a strict superset.

## 5. Bundling logic (updated)

Bundles stay a presentation layer over `category` — no schema change. Config update (all three copies: `catalog.js`, `theme.js`, digest):

```js
export const BUNDLES = [
  { key:"holiday", name:"Holiday", icon:"✈️", categories:["Travel","Insurance","Currency"] },
  { key:"cinema",  name:"Cinema",  icon:"🎬", categories:["Entertainment","Streaming"] },
  { key:"sports",  name:"Sports",  icon:"⚽", categories:["Sports"] },
  { key:"workday", name:"Workday", icon:"💼", categories:["Productivity","Insurance","Food"] },
  { key:"bigshop", name:"Big shop", icon:"🛒", categories:["Shopping","Savings","Rewards"] },      // NEW
  { key:"famday",  name:"Family day out", icon:"👨‍👩‍👧", categories:["Family","Education"] },        // NEW
];
```

Rules unchanged: a bundle renders only when the user holds ≥1 matching item; items may appear in multiple bundles; items keep type tag, cadence chip and status control; order by type then title. Single source of truth recommended (see 7.3). Display rule addition: bundle chips on the perks page show live counts; the email's "Use today" section draws candidates bundle-first (today's featured bundle rotates by day-of-year, same mechanism as the digest's moment boxes).

## 6. Perk display rules (consistent across website + email)

Every item, everywhere, shows exactly: provider mark, title, membership · tier, type tag (Feature/Perk/Discount/Competition), cadence chip (Weekly/Monthly/One-off), status (control on web/app, text in email). Never: dates, countdowns, "expires", streaks (`RENEWAL_DATES_ENABLED` stays false). Marketplace additions: "from {tier}" pricing and "Also in {tier}" cheaper-tier flags. Copy: British English, sentence case, value-first, no em dashes, no hype.

## 7. Implementation notes (Fable + Supabase)

**Order of work:**
1. Approve + run `proposed-perk-additions.sql`; mirror xlsx (I can do both on your say-so).
2. Migration: `tier_kind` + `tier_rank` columns, backfill (one migration file; values in section 4.2).
3. Update the three tier-logic copies to rank/kind-aware versions.
4. Rebuild the digest template per section 2 (one deploy via MCP, as v47 was).
5. Rebuild website pages from prototypes: `src/pages/Home.jsx` (new), `Perks.jsx` (chip filters + ladder), `Profile.jsx` (verdict card + rows). Reuse existing hooks (`usePerksData`, `fetchProfileBundle`).
6. QA on `npm run dev` at 390px, then push.

**Supabase:** no new tables. `last_used_at` powers the email chart. Add index if needed: `create index on user_perk_state (user_id, last_used_at)`.

## 8. Architecture recommendations

1. **Kill the triple-copy problem.** `BUNDLES`, cadence helpers, tier logic and `STATUS_LABEL` exist in `catalog.js`, `theme.js` and the digest function. Extract a `src/shared/` module; have the edge function import a generated copy (a small build step or straight duplication with a lint check) — drift here is the likeliest future bug.
2. **`tier_rank`/`tier_kind`** (section 4.2) — the single most valuable data-model fix; unblocks correct savings maths for BA, Spotify, Railcard, NT.
3. **Verdict generator as a shared function** — one `buildVerdict(userStats)` used by profile page and email hero keeps product voice identical across surfaces.
4. **Email componentisation now pays at Beehiiv time** — the block library in section 2.3 is exactly what Beehiiv custom HTML wants; the weekly email becomes a re-ordering, not a rebuild.
5. **Photography debt** — the design language works with glyph tiles but mob's warmth comes from imagery; when ready, commission 1:1 lifestyle crops and drop them into `card-img` with zero layout change.
6. **Keep guardrails visible in UI copy** — "Read-only, always. We never move your money." appears in footer + email footer; it is a differentiator, not legal boilerplate.
