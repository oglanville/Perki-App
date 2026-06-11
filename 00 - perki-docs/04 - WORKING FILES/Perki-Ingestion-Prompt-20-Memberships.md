# Task prompt — add 20 new memberships to the Perki catalogue

_Paste everything below the line into the new task. It is self-contained: it tells the model what file to edit, the exact schema, the rules, a worked example, and the 20 memberships with their tier structures._

---

## Role and objective

You are populating the Perki perks catalogue. Perki is a UK personal perks aggregator that shows people the perks, features, discounts and competitions they already get from memberships they hold. Your job is to add **20 new memberships** to the working spreadsheet, one row per item per tier, with accurate, verifiable detail.

**Accuracy matters more than speed.** Do not scrape, brute-force, or bulk-extract from company websites. Use each scheme's officially published benefits. If you are not confident a benefit, price or detail is current and correct, do **not** invent it — enter your best verifiable value and add `NEEDS VERIFY` at the start of the `usage_notes` cell so Ollie can check it. Quality over volume: a focused, correct set of rows per membership beats an exhaustive guess.

## The file

- **Path:** `Perks_Rows.xlsx` in the root of the selected project folder.
- **Sheet name:** `perks_rows`.
- **Row 1 is the header.** There are currently 288 data rows (rows 2–289). **Append new rows below the existing data. Do not edit, reorder or delete any existing row, and do not change the header.**
- Edit the file in place with openpyxl (load, append, save back to the same filename). Save a copy named `Perks_Rows_backup.xlsx` before you start.

## Column schema (21 columns, in this exact order)

| # | Column | Meaning / rules | Example |
|---|--------|-----------------|---------|
| 1 | `perk_id` | Unique slug: `{provider}-{tier}-{title}`, all lowercase, spaces→hyphens, punctuation stripped. Must be unique across the whole sheet. | `amazon-prime-prime-video` |
| 2 | `provider` | Brand display name. | `Amazon` |
| 3 | `membership` | Membership/product name (often same as provider). | `Amazon Prime` |
| 4 | `tier` | Tier name within the membership. | `Prime` |
| 5 | `feature` | **The item TYPE.** One of exactly: `feature`, `perk`, `discount`, `competition` (see definitions below). | `feature` |
| 6 | `titlegroup` | Usually identical to `title`. Use the same value as `title` unless grouping a variant. | `Prime Video` |
| 7 | `title` | Short name of the item. | `Prime Video` |
| 8 | `description` | One clear sentence, British English, factual, no hype, no em dashes. | `Stream thousands of films and TV shows, including Amazon Originals, included with Prime.` |
| 9 | `category` | Reuse an existing category (list below) wherever possible. | `Streaming` |
| 10 | `reset_period` | One of: `NONE`, `WEEKLY`, `MONTHLY`, `ANNUALLY`. Use `NONE` for always-on features. | `NONE` |
| 11 | `next_reset_date` | Leave blank unless a specific date is known. | _(blank)_ |
| 12 | `usage_limit` | Short free-text limit, or `Ongoing`. | `Ongoing` |
| 13 | `usage_notes` | Short `Usage: …` sentence. Prefix with `NEEDS VERIFY` if unsure. | `Usage: Ongoing.` |
| 14 | `source_url` | The official page that evidences this item. | `https://www.amazon.co.uk/prime` |
| 15 | `last_verified` | Date you checked, `YYYY-MM-DD`. | `2026-06-11` |
| 16 | `popularity` | Default `Unknown`. | `Unknown` |
| 17 | `icon_provider_url` | `https://logo.clearbit.com/{domain}` (domain given per membership below). | `https://logo.clearbit.com/amazon.co.uk` |
| 18 | `icon_membership_url` | Same Clearbit URL as the provider icon. | `https://logo.clearbit.com/amazon.co.uk` |
| 19 | `created_at` | Today's date, `YYYY-MM-DD`. | `2026-06-11` |
| 20 | `emoji` | One emoji that fits the item. | `📺` |
| 21 | `price` | The tier's standing cost in **GBP per month**, as a number. Free/earned tiers = `0`. Same value on every row of a tier. | `8.99` |

### Type definitions for the `feature` column

- **feature** — an always-on capability of the tier (for example "Full UK current account", "Unlimited next-day delivery"). Most common type.
- **perk** — a benefit you actively claim or redeem (for example a free birthday treat, monthly free game, partner reward).
- **discount** — money off something (for example "10% off food and drink", "Clubcard Prices", member pricing).
- **competition** — prize draws, ballots, presale ballots, or early-access entries (for example weekly prize draws, members' screening ballots).

### Existing categories to reuse (prefer these; only add a new one if nothing fits)

Automotive, Banking, Broadband, Budgeting, Card, Competition, Creativity, Credit, Currency, EV, Education, Energy, Entertainment, Family, Fitness, Food, Hardware, Heating, Insurance, Investments, Lifestyle, News, Productivity, Protection, Rewards, Savings, Security, Shopping, Smart Home, Solar, Sports, Streaming, Tools, Transfers, Travel, Wellness, Workspace.

## Modelling rules

1. **One row per item per tier.** If a perk exists on several tiers, repeat it on each tier with its own `perk_id` and that tier's `price`. (This mirrors the existing data, for example Monzo's "A UK current account" appears on Free, Extra, Perks and Max.)
2. **Tiers sort by `price`.** The app derives tier order and price labels from the `price` column, so prices must be correct and ascending across a membership's tiers.
3. **Annual or one-off memberships:** enter `price` as the monthly equivalent (annual fee ÷ 12, to two decimals) so tiers still sort and label sensibly, and state the real billing basis in the `description` or `usage_notes` (for example "Billed annually."). Apply this consistently.
4. **Free baseline tiers:** where a paid membership is best understood against "having nothing", include a `Free` / `Non-member` tier at `price` 0 carrying the baseline features, so Perki's Compare feature has two sides to show.
5. **British English, sentence case, no em dashes, no marketing hype** in every text cell.
6. **Representative, not exhaustive:** for schemes with large rotating catalogues (discount cards, card-offer programmes, telco reward apps), capture the structural features plus a representative, dated sample of well-known partner discounts/competitions. Mark these `Usage: Representative sample as of {date}.` Do not attempt to list everything.

## Worked example (three rows for Amazon Prime)

```
perk_id: amazon-non-member-standard-delivery
provider: Amazon | membership: Amazon Prime | tier: Non-member | feature: feature
title: Standard delivery | category: Shopping | reset_period: NONE | usage_limit: Ongoing
description: Pay-as-you-go delivery with standard speeds and minimum-spend thresholds for free postage.
price: 0 | emoji: 📦 | icon: https://logo.clearbit.com/amazon.co.uk

perk_id: amazon-prime-free-one-day-delivery
provider: Amazon | membership: Amazon Prime | tier: Prime | feature: feature
title: Free one-day delivery | category: Shopping | reset_period: NONE | usage_limit: Ongoing
description: Free fast delivery on millions of eligible items, with no minimum spend, included with Prime.
price: 8.99 | emoji: 🚚 | icon: https://logo.clearbit.com/amazon.co.uk

perk_id: amazon-prime-prime-gaming-monthly-games
provider: Amazon | membership: Amazon Prime | tier: Prime | feature: competition
title: Prime Gaming monthly games | category: Entertainment | reset_period: MONTHLY | usage_limit: Monthly drop
description: A rotating set of free games and in-game content claimable each month through Prime Gaming.
price: 8.99 | emoji: 🎮 | icon: https://logo.clearbit.com/amazon.co.uk
```

## The 20 memberships to add

For each: use the given Clearbit domain, model the listed tiers, and capture a focused mix of features, perks, discounts and competitions. Verify current names and prices; flag anything uncertain.

1. **Tesco — Clubcard** (`tesco.com`). Tiers: `Clubcard` (free, 0) and `Clubcard Plus` (paid monthly). Capture Clubcard Prices (discount), points and Reward Partners value (perk), digital card and vouchers (feature), Clubcard Plus benefits such as 10% off two big shops and double data with Tesco Mobile (perk/discount).
2. **Boots — Advantage Card** (`boots.com`). Single free tier. Points on spend (perk), Price Advantage member prices (discount), Parenting Club and birthday gift (perk), digital card (feature).
3. **IKEA — IKEA Family** (`ikea.com`). Single free tier. Member prices (discount), free hot drink and in-store offers (perk), workshops and events (perk), extended returns and damage-on-the-way-home cover (feature), Family prize draws (competition).
4. **Greggs — Greggs Rewards** (`greggs.co.uk`). Single free tier. Free birthday treat and free drink after stamps (perk), app-exclusive offers (discount), order ahead (feature).
5. **Nando's — Nando's Rewards** (`nandos.co.uk`). Single free tier. Chilli rewards laddering to a free starter, main or dessert (perk), scan to earn (feature).
6. **Pret — Club Pret** (`pret.co.uk`). Tiers: `Free` (0) and `Club Pret` (paid monthly subscription). Set number of barista-made drinks per day (perk), 20% off food (discount), in-app ordering (feature).
7. **Deliveroo — Deliveroo Plus** (`deliveroo.co.uk`). Tiers: `Free` (0) and `Plus` (paid monthly; note Silver/Gold variants if current). Free delivery over a threshold (feature), member credits and partner offers (perk), occasional restaurant discounts (discount).
8. **Amazon — Amazon Prime** (`amazon.co.uk`). Tiers: `Non-member` (0), `Prime` (paid monthly), and optionally `Prime Student`. Delivery, Prime Video, Music, Photos, Reading (feature), Deliveroo Plus and Prime Day early access (perk), Prime Gaming monthly games (competition), member-only deals (discount). See worked example above.
9. **Spotify — Spotify Premium** (`spotify.com`). Tiers: `Free` (0), `Individual`, `Duo`, `Family`, `Student`. Ad-free listening, offline downloads, on-demand play (feature); occasional partner offers (perk).
10. **Cineworld — Unlimited** (`cineworld.co.uk`). Tiers: `Unlimited` and `Unlimited Plus` (paid, regional). Unlimited standard films (feature), 10% off food and drink and partner restaurant discounts (discount), advance and preview screenings (perk), members' screening ballots (competition).
11. **ASOS — ASOS Premier** (`asos.com`). Tiers: `Free` (0) and `Premier` (paid, billed annually). Unlimited next-day delivery (feature), early sale access (perk).
12. **Nationwide — FlexPlus** (`nationwide.co.uk`). Tiers: `FlexAccount` (free, 0) and `FlexPlus` (paid monthly). Worldwide family travel insurance, mobile phone insurance, UK and European breakdown cover (feature/perk), current account (feature), any member reward such as Fairer Share if current (perk, verify).
13. **Santander — Edge** (`santander.co.uk`). Tiers: `Everyday` (free, 0), `Edge` (paid) and `Edge Up` (higher paid). Cashback on household bills and on supermarket, fuel and travel spend, capped (discount/perk), linked savings rate (feature).
14. **American Express** (`americanexpress.com`). Tiers (verify the current UK line-up; UK does not use "Green"): a no-fee `Rewards` card (0), `Gold` (annual fee), `Platinum` (higher annual fee). Membership Rewards points (perk), airport lounge access and hotel status on Platinum (feature/perk), Amex Offers (discount), Amex presale and Experiences ticket access (competition), travel insurance on premium tiers (feature).
15. **Vodafone — VeryMe Rewards** (`vodafone.co.uk`). Single free-with-plan tier (name it `VeryMe`). Weekly rewards such as free drinks and snacks (perk), prize draws (competition), partner discounts (discount), early or priority event tickets (perk).
16. **Costco** (`costco.co.uk`). Tiers: `Gold Star` (paid, annual) and `Executive` (higher annual, with a 2% annual reward). Warehouse access (feature), member services such as optical, tyres, travel and fuel savings (perk/discount), member pricing (discount), Executive 2% reward (perk).
17. **Blue Light Card** (`bluelightcard.co.uk`). Single paid tier, eligibility-gated to NHS, emergency services, social care and armed forces. Capture eligibility and the card (feature, state eligibility in the description), plus a representative dated sample of well-known retailer discounts (discount, marked as representative).
18. **National Trust** (`nationaltrust.org.uk`). Tiers: `Individual`, `Joint`, `Family`, `Life` (paid, annual). Free entry to places and free parking (feature), members' handbook, magazine and events (perk), any members' prize draw (competition).
19. **Railcard** (`railcard.co.uk`). Model each card type as a tier: `16-25`, `26-30`, `Two Together`, `Family & Friends`, `Network`, `Senior`, `Disabled Persons` (each paid annually, eligibility-gated). One-third off most fares (discount), digital railcard (feature). **FLAG to Ollie:** these tiers are similarly priced and eligibility-gated, so the price-based tier ordering will not differentiate them cleanly. Add a `NEEDS VERIFY` note and ask how he wants railcards modelled.
20. **British Airways — Executive Club** (`britishairways.com`). Earned-status tiers: `Blue`, `Bronze`, `Silver`, `Gold` (free to join, so `price` 0 on all). Earn and spend Avios (feature/perk), companion benefits (perk), lounge access from Silver (perk), priority boarding and baggage (feature), Avios-only seat sales and draws (competition). **FLAG to Ollie:** all tiers are price 0, so they will not sort by price; add a `NEEDS VERIFY` note and ask how he wants earned-status tiers ordered.

## Output and validation

1. Append all new rows to `perks_rows`, preserving existing rows and the header.
2. Check every `perk_id` is unique across the whole sheet.
3. Check `feature` only ever contains `feature`, `perk`, `discount` or `competition`.
4. Check `price` is the same number on every row of a given provider+tier, and that tiers ascend in price.
5. Save the workbook back to `Perks_Rows.xlsx`.
6. Produce a short summary: rows added per membership, total new rows, the full list of cells you marked `NEEDS VERIFY`, and the two flagged modelling questions (Railcard tiers and British Airways earned-status ordering).

## Hard guardrails

- Manual, accurate ingestion only. No scraping, brute-forcing, or automated bulk extraction from company websites.
- Do not fabricate prices or benefits. Flag uncertainty with `NEEDS VERIFY` rather than guessing.
- British English, sentence case, no em dashes, no marketing language.
- Do not modify existing rows, the header, or any other file.
