# PERKI DESIGN SYSTEM v2 — light / eggshell
### Phase 2 · Brand-locked palette + Pro Max typography & structure · 2026-06-03

> The enforceable system for the re-skin + pitch deck. Built on the locked brand (eggshell · indigo · gold) using Pro Max's type, UX, and component guidance — not its (dark) default palette.

## 1. Colour tokens (UI-ready)
| Token | Hex | Use |
|-------|-----|-----|
| `--surface` | `#F4F0E6` | Page background (eggshell) |
| `--surface-raised` | `#FCFAF4` | Cards, sheets, raised UI |
| `--ink` | `#23202A` | Primary text |
| `--ink-secondary` | `#6B6757` | Secondary text (warm grey) |
| `--ink-muted` | `#8A8576` | Hints, captions |
| `--indigo` | `#2B2A6E` | Brand · primary action · the P |
| `--indigo-hover` | `#3A388F` | Hover/active for indigo |
| `--indigo-tint` | `#ECECF6` | Indigo fills / selected states |
| `--gold` | `#E0A93B` | Value accent · highlights · badges |
| `--gold-deep` | `#B07C1A` | Gold roll-off, borders, icons |
| `--gold-tint` | `#F7ECD4` | Soft value fills |
| `--border` | `#E4DDCB` | Hairlines, dividers |
| `--success` | `#1D9E75` | Positive states |
| `--danger` | `#C0392B` | Errors / destructive |

**Colour roles (changed from the old dark theme):** indigo is now the **primary action** colour (trust); gold is reserved as the **value accent** (the "found money" moment) — used for the P, value badges, and highlights, *not* the main CTA, so it stays special.

**Contrast rules (WCAG AA):** ink on eggshell ≈ 13:1 ✓ · indigo on eggshell ✓ · white on indigo ✓. **Gold is never body text** (fails on light) — gold text only on indigo; `--gold-deep` allowed for icons/large only.

## 2. Typography (Pro Max pairing)
- **Headings / display:** Outfit (geometric — echoes the P). Weights 500/600/700.
- **Body / UI:** Work Sans. Weights 400/500/600.
- Import: `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Work+Sans:wght@400;500;600&display=swap');`

| Token | Size / line | Font · weight |
|-------|-------------|---------------|
| Display | 44/48 | Outfit 700 |
| H1 | 32/38 | Outfit 600 |
| H2 | 24/30 | Outfit 600 |
| H3 | 19/26 | Outfit 500 |
| Body-L | 18/28 | Work Sans 400 |
| Body | 16/24 | Work Sans 400 |
| Meta | 13/18 | Work Sans 500 |

## 3. Spacing, radius, elevation
- Spacing: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`.
- Radius: `--r-sm 8` · `--r-md 12` (default cards) · `--r-lg 16` · pill `999`.
- Shadows (soft, warm): sm `0 1px 2px rgba(43,42,40,.06)` · md `0 4px 12px rgba(43,42,40,.08)` · lg `0 12px 28px rgba(43,42,40,.10)`.

## 4. Components
- **Button / primary:** `--indigo` bg, `#FCFAF4` text, radius-md, 12×24, hover `--indigo-hover`, focus ring `3px rgba(43,42,110,.4)`. Min 44px.
- **Button / secondary:** transparent, 1.5px `--indigo` border + indigo text.
- **Value badge:** `--gold-tint` bg, `--gold-deep` text, pill — for prices/"value unlocked".
- **Card:** `--surface-raised`, 1px `--border`, radius-md, shadow-sm; hover shadow-md.
- **Input:** `--surface-raised`, 1px `--border`, radius-md, 16px text; focus `--indigo` border + soft ring.
- **Coin chip:** the mark in indigo/gold as the brand stamp on headers, empty states, and the deck.

## 5. Style & motion
- Recommended style: **premium-calm minimalism with reward warmth** — generous eggshell space, one clear action per view, gold used sparingly for the value moment. (We are *not* taking Pro Max's "Liquid Glass" — it conflicts with the warm-flat direction and its contrast/perf caveats.)
- Motion: micro 150–250ms; no "fast" jumps; respect `prefers-reduced-motion`.

## 6. Carryover guardrails (from Pro Max pre-delivery)
SVG icons not emoji (product) · `cursor:pointer` on clickables · visible focus · 4.5:1 contrast · responsive 375/768/1024/1440 · no content under fixed navbars.

---
_Next: design-system skill standardises these tokens against the live React components (the re-skin), and Brand Voice sets the tone layer._
