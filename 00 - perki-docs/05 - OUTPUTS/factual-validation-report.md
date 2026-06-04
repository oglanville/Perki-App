# PERKS — FACTUAL VALIDATION REPORT

_Date: 2026-06-02 · Source of truth: Perks_Rows.xlsx (repaired) · Method: live provider source pages + web search_

## Coverage
| Provider | Perks | Status | Method |
|----------|-------|--------|--------|
| Monzo | 55 | **Validated** | Live page render (monzo.com/current-account/max) |
| Revolut | 123 | **Partially validated** | Pricing/tiers via search; per-perk detail pending (page is JS-rendered, no browser connected) |
| Sky | 87 | **Blocked** | No `source_url` (lost in file corruption) |
| OVO | 23 | **Blocked** | No `source_url` (lost in file corruption) |

## Monzo — validated
**Prices: CORRECT.** Live page = Free £0, Extra £3, Perks £7, Max from £17. File = 0 / 3 / 7 / 17. ✔
**Tier structure: CORRECT.** Free → Extra → Perks → Max, cumulative inheritance matches the page's "includes all features from…" model.

Discrepancies / gaps vs live page:
1. **Missing perk — Billsback™** (up to £150 of bills covered): present on Extra/Perks/Max on the live page, absent from the file.
2. **Missing perk — "Add your family to insurance for £5 a month"** (Max tier): on the page, not in the file.
3. **Possibly missing Free-tier items:** "All the Monzo features you know and love" and "Fee-free withdrawals up to £200" appear on the page's Free list but not the file (may be intentional exclusions).
4. **Duplicate/ambiguous titles within a tier:** "Credit Insights" and "Instant Access savings Account" each appear twice in some tiers with identical titles — on the page these are distinct (e.g. Credit Insights TransUnion-only vs 2-score TransUnion+Equifax). Titles should disambiguate.

## Revolut — pricing validated, detail pending
**Prices:**
- Standard £0 — CORRECT ✔
- Ultra £55/month — CORRECT ✔ (also £540/year)
- Plus: file £4 vs actual **£3.99** — rounded
- Premium: file £8 vs actual **£7.99** — rounded
- Metal: file £15 vs actual **£14.99** — rounded
**Tier names** (Standard/Plus/Premium/Metal/Ultra): CORRECT ✔
**Per-perk feature validation:** NOT done — both Revolut source pages are client-rendered and returned no content to a plain fetch; needs a connected browser to render.

## Sky + OVO — blocked
Cannot validate: the file corruption wiped all 110 `source_url`s. Refill required before validation (see `sky-ovo-recovery-gaps.csv`).

## Recommended actions
1. Decide on Revolut price precision: store exact £3.99 / £7.99 / £14.99 or keep rounded whole pounds (be consistent for display/comparison).
2. Add missing Monzo perks (Billsback™; Max family add-on) or confirm intentional exclusions.
3. Disambiguate duplicate Monzo titles (Credit Insights ×2, Instant Access ×2).
4. Refill Sky/OVO source URLs, then validate (and connect a browser to render Revolut for full per-perk checks).

## Sources
- [Monzo Max / plan comparison](https://monzo.com/current-account/max)
- [Revolut — Compare plans](https://www.revolut.com/our-pricing-plans/)
- [Revolut Ultra personal fees (£55/mo, £540/yr)](https://www.revolut.com/legal/ultra-fees/)
