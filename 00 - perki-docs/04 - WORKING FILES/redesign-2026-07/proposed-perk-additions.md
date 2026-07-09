# Proposed perk additions and corrections — for Ollie's approval

_Verified against official UK provider pages on 2026-07-08. Nothing here is live. Approve, strike out what you don't want, and I'll run `proposed-perk-additions.sql` and mirror into `Perks_Rows.xlsx`. Format: tier · type · title — description (usage). Sources are in the SQL file._

## Conflicts needing your call first

1. **Boots Price Advantage.** This morning we rewrote the row to "Personalised offers and double points" based on dated press coverage saying member pricing ended May 2026. Today's agent reports boots.com/advantage-card still lists Price Advantage member prices. Options: (a) restore Price Advantage as a row alongside the new one, (b) keep this morning's version. I can't resolve this without a human look at boots.com — it's JS-rendered and fetches fail.
2. **Amazon Prime Gaming vs Luna.** The official UK benefits page now lists Amazon Luna game streaming; Prime Gaming monthly games may have been replaced. Proposal: add Luna, keep Prime Gaming flagged NEEDS-VERIFY until you check your own Prime account.
3. **Deliveroo Gold price.** Agent suggests "from £4.99". You decided £7.99 standard this morning — keeping that. Only the threshold split (restaurants £10 / shops £15) goes in.

## American Express (8 new)

- Rewards · feature · **Purchase protection** — cover for theft or accidental damage to eligible items bought on the card within 90 days.
- Rewards · feature · **Refund protection** — up to £200 per item if a retailer won't take back an unused eligible item (up to £750 per 12 months).
- Gold · perk · **£120 Deliveroo credit** — £5 back twice a month on Deliveroo orders of £5+, enrolment required.
- Gold · feature · **Travel inconvenience cover** — flight delay and lost baggage cover when you pay with the card.
- Gold · perk · **The Hotel Collection benefits** — US$100 hotel credit and elevated benefits on 2+ night Amex Travel stays.
- Platinum · perk · **£400 Global Dining Credit** — £200 UK + £200 abroad each year at 2,000+ venues, resets 1 Jan and 1 Jul.
- Platinum · perk · **Fine Hotels + Resorts benefits** — late check-out, upgrades, breakfast for two, experience credit at 1,300 properties.
- Platinum · feature · **Car hire insurance** — rental cover included on top of hire firm insurance.

## Santander Edge (3 new, 2 fixes)

- Everyday · perk · **Santander Boosts rewards** — cashback offers, vouchers and prize draws when you activate offers.
- Edge · feature · **Fee-free debit card use abroad** — 0% foreign conversion fee on purchases and withdrawals.
- Edge · feature · **Fee-free international payments** — CHAPS and international payments free (usually £25).
- FIX: "Fee-free overseas spending" is currently at Edge Up only, but Edge also has it — move to Edge so Edge Up inherits.
- FIX: "Cashback on household bills" — supermarket/travel card cashback was removed Sep 2025; copy must reference Direct Debit bills only (1%, capped £10/mo Edge, £15/mo Edge Up).

## Nationwide (4 new, 1 fix)

- FlexAccount · feature · **£50 interest-free overdraft** — first £50 of arranged overdraft interest-free.
- FlexAccount · feature · **Member-only savings access** — exclusive savers such as Flex Regular Saver.
- FlexAccount · perk · **£175 switching bonus** — full switch via CASS, limited time. (Time-limited: flag for periodic re-verification.)
- FlexPlus · feature · **Fee-free card use abroad** — no Nationwide charges on non-sterling debit card use.
- FIX: Fairer Share copy should say the payment is conditional and not guaranteed.

## British Airways Club (8 new, 3 fixes)

- Blue · feature · **Household account** — pool Avios with family at your address.
- Bronze · perk · **Priority boarding** — board ahead of general boarding from Bronze up.
- Bronze · discount · **The Wine Flyer discount** — 5% off at BA's wine store (10% Silver, 15% Gold).
- Silver · perk · **Extra baggage allowance** — additional checked bag from Silver (not on Basic fares).
- Silver · feature · **Reservation Assurance** — guaranteed seat on a full flight on eligible fares.
- Gold · perk · **Gold upgrade vouchers** — upgrade-for-two voucher at 35,000 tier points, two upgrade-for-one at 50,000.
- Gold · perk · **Concorde Room access** — at 65,000 tier points (40,000 in later years).
- Gold · perk · **Partner and member status cards** — Gold Guest List: one Gold partner card + two Silver cards.
- FIX: "Priority boarding and baggage" at Silver is mis-tiered — priority boarding starts at Bronze; retitle Silver extras properly.
- FIX: same row at Gold duplicates the Bronze benefit — remove.
- FIX: Blue "Avios seat sales" → rename "Member-only offers" (the official benefit name).

## Railcard (7 new incl. variant-specific, 4 fixes)

- Family & Friends · discount · **60% off kids' fares** — up to 4 kids at 60% off, 4 adults at 1/3 off, one card.
- Two Together · discount · **First class fares included** — 1/3 off First Class for the two named holders.
- Network · discount · **Group savings on one card** — +3 adults 1/3 off, +4 kids 60% off, Network area only.
- Disabled Persons · discount · **Companion travels for 1/3 off**.
- Disabled Persons · perk · **Oyster pay as you go discount** — 1/3 off single PAYG fares on LU/DLR.
- 16-25 · feature · **Mature student route** — 26+ full-time students qualify. *(Optional — eligibility rule more than a perk.)*
- ALL 7 variants · perk · **Partner offers and rewards** — deals from Gousto, Craft Gin Club, Readly etc.
- FIX: prices — Family & Friends, Two Together, Network are £30/yr (£2.50/mo), Disabled Persons £20/yr (£1.67/mo). 16-25 stays £35/yr.
- FIX: Two Together and Network core rows need their travel-together / area+minimum-fare conditions in usage notes.

## National Trust (5 new, 1 fix)

- ALL 4 tiers · perk · **Free entry to trusts overseas** — INTO partner organisations abroad.
- Individual/Joint/Family · perk · **New member guest pass** — single-use pass when joining by annual Direct Debit online.
- ALL · feature · **Vote at the AGM**.
- ALL · competition · **Member-exclusive competitions** — via member emails.
- ALL · feature · **Online members' area**.
- FIX: "Free parking" — official wording is many coast and countryside car parks, soften copy.

## Tesco Clubcard (2 new, 2 fixes)

- Clubcard · perk · **Clubcard points on fuel** — 1 pt/2L at Tesco stations, 1 pt/£3 at Esso Express sites.
- Clubcard · competition · **Clubcard Challenges** — app challenges awarding bonus points during promo periods.
- FIX: "10% off two big shops a month" — in-store only, capped £20/shop, £40/month.
- FIX: "10% off selected Tesco brands" — in-store only, name the brands (F&F, Tesco Pet, Fred & Flo, Go Cook, Fox & Ivy etc).

## Boots (2 new — see conflict #1)

- Advantage Card · discount · **Price Advantage member prices** — pending conflict resolution.
- Advantage Card · perk · **Over 60s Rewards** — 8 points per £1 on own brands for 60+ members.

## IKEA Family (5 new, 1 fix)

- **Member food offers** (restaurant + food market) · **Delivery and collection savings** · **15% extra on Buyback & Resell** · **Digital receipts** · **Gift registry**.
- FIX: "Free hot drink" — Mon-Fri only, tea or filter coffee, store exclusions apply.

## Costco (5 new, 1 fix)

- Gold Star: **Double Guarantee**, **Hearing centre services**, **Cake and deli ordering**, **EV charging at warehouses**.
- Executive: **Executive-only coupons and events**.
- FIX: retitle "Optical tyres and travel services" → "Optical, tyres and travel services".

## ASOS Premier (2 new, 2 fixes)

- Premier · perk · **Free nominated day delivery** (£15 minimum).
- Premier · perk · **ASOS.WORLD auto-enrolment**.
- FIX: "Unlimited next-day delivery" needs the £15 minimum + cut-off caveat.
- FIX: free-tier "Standard delivery" — only free above a spend threshold for non-Premier.

## Blue Light Card (3 new, 1 fix)

- **Mobile app with virtual card** · **Member competitions and free tickets** · **Local offers near you**.
- FIX: Deliveroo row should state 12 months + £15/£25 thresholds.

## Amazon (10 new, 2 fixes)

- Prime: **Free same-day delivery** (£20+), **Amazon Fresh grocery delivery**, **Morrisons groceries on Amazon**, **First Reads early book access**, **Music Unlimited member discount**, **Alexa+ included** *(optional — UK rollout timing unclear)*, **Amazon Luna games included**, **Amazon Family benefit sharing**.
- Prime Student: **Six-month free Prime trial**, **10% off thousands of textbooks**.
- FIX: Prime Gaming vs Luna (conflict #2).
- FIX: tier rename — the scheme is now "Prime for Students and 18-24 year-olds", open to any 18-24 year old.

## Spotify (7 new)

- Individual: **15 hours of audiobooks a month**, **Lossless audio quality**, **Listen with friends in real time (Jam)**, **AI DJ personalised sessions**.
- Duo: **Audiobooks for the plan manager**.
- Family: **Audiobooks for the plan manager**, **Managed accounts for under-13s**.

## Deliveroo (2 fixes, no new)

- FIX: Gold description → free delivery over £10 restaurants / £15 shops (price stays £7.99 per your earlier decision).
- FIX: Silver → partner-only (not sold directly), thresholds £15 restaurants / £25 shops.

## Pret (1 new)

- Free · perk · **Pret Perks rewards scheme** — collect stars via the app.

## Nando's (1 new)

- **Bonus chilli on sign-up** — rewards unlock at 3, 6, 10 chillies; chillies expire after a year.

## Vodafone VeryMe (5 new)

- **25% off local coffee shops** (Local Blend) · **2-for-1 meals with Eat Local** (Gourmet Society) · **Up to 56% off days out** (Kids Pass) · **Caffè Nero coffee offers** · **Vodafone Together monthly extras** (needs broadband bundle).

## Bundle impact (automatic via category)

New rows flow into existing bundles with no logic change: Holiday gains Amex travel covers, BA baggage/lounge rows, NT overseas entry; Cinema unchanged; Sports unchanged; Workday gains Amex/Vodafone/Pret food perks. Two new bundles proposed in the spec: **Big shop** (Food + Shopping + Savings: Tesco, IKEA, Costco, Boots) and **Family day out** (Family + Education: Railcard kids fares, Kids Pass, NT, Spotify managed accounts).

## Totals

~66 distinct new perks (≈85 rows after variant expansion), 20 corrections. Everything sourced from official provider pages; sources in the SQL file.
