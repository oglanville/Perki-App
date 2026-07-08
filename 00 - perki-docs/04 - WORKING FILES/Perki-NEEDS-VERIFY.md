# Perki catalogue — NEEDS VERIFY follow-ups

_19 items loaded live on 2026-06-11 and flagged for confirmation. Verified against official provider pages on 2026-07-08. Verdicts below; rows marked CHANGED need edits in `Perks_Rows.xlsx` and the live `perks` table. Rows marked CONFIRMED can have their flag cleared from `usage_notes`._

## Tesco
- **Reward Partners** (Clubcard) — CONFIRMED. Still 2x voucher value with 100+ Reward Partners (cut from 3x in June 2023, unchanged since). Source: tesco.com/help/pages/clubcard-faqs/clubcard-reward-partners/using-clubcard-vouchers-with-reward-partners

## Boots
- **Price Advantage member prices** (Advantage Card) — CHANGED. From May 2026 the blanket 10% own-brand member discount ended; prices lowered for all customers on hundreds of own-brand lines instead, with more personalised app offers (regular double points and price promotions). Members keep 3 points per £1; 10% student discount and 8 points per £1 own-brand for Parenting Club and Over-60s retained. Row copy needs rewriting around points + personalised offers rather than member pricing. Source: Boots announcement 2026-04-02 (boots.com Advantage Card page is JS-rendered; verified via dated press coverage).

## IKEA
- **IKEA Family rewards points** (IKEA Family) — CONFIRMED. UK scheme live: 1 point per £5 spent plus action points; redemptions include delivery discounts (50pts = £5 off), restaurant deals and vouchers (65pts = £5 off £6+, up to 500pts = £40 off £41+). Points expire after 18 months. Source: ikea.com/gb/en/ikea-family/benefits/rewards/
- **Purchase protection** (IKEA Family) — CONFIRMED, renamed. Now branded "Just-in-case protection": free exchange if an item breaks in transport or self-assembly, card swiped at checkout. Update the title/description to the new name. Source: ikea.com/gb/en/ikea-family/benefits/
- **Member prize draws** (IKEA Family) — DISCONTINUED as a listed benefit. No longer on the UK benefits page; old prize-draw URL redirects to the generic Rewards page. Occasional one-off promotions still happen but there is no standing benefit. Recommend retiring this row. Source: ikea.com/gb/en/ikea-family/benefits/

## Pret
- **50% off barista-made drinks** (Club Pret) — CONFIRMED. £5/month, 50% off up to 5 barista-made drinks per day, 30 minutes between redemptions, QR in app. (The planned rise to £10 in March 2025 was reversed.) Source: pret.co.uk/en-GB/club-pret

## Deliveroo
- **Free delivery over £10** (Plus Gold) — CONFIRMED, price is customer-dependent. Official page lists Gold "from £4.99/month" behind login; £7.99/month (£79.90/year) is the standard rate. DECISION NEEDED: which price to model (suggest "from £4.99" with £7.99 standard). Note: Plus Silver is now partner-only (not directly purchasable). Source: deliveroo.co.uk/plus

## Amazon
- **Free Deliveroo Plus Silver** (Prime) — CONFIRMED, still running. 12 months of Plus Silver free when linking Prime; lapses if Prime is cancelled; no auto-convert to paid. Source: deliveroo.co.uk/partnerships/amazon_prime

## Cineworld
- **Unlimited standard films** (Unlimited) — CONFIRMED as modelled. Four UK regional groups: Group 1 £12.99, Group 2 £17.99, Group 3 £19.99, Group 4 £22.99 per month (3-month minimum; ~£2 uplift to visit a higher-group cinema). DECISION NEEDED: model as four tiers, or one tier at the Group 1 price. Source: help.cineworld.co.uk (membership groups article) — Group 2/3 prices via search snippets, endpoints solidly confirmed.
- **Free Superscreen and 3D upgrades** (Unlimited) — CONFIRMED, all groups. Superscreen uplift free from sign-up (Red card); free standard 3D with the Black card after 3 months (or from day one paying 12 months upfront; Black also lifts the food/drink discount from 10% to 25%). Source: help.cineworld.co.uk benefits article.
- **Unlimited films at every UK cinema** (Unlimited All UK) — CONFIRMED. Group 4 (£22.99/month) covers every UK Cineworld including Leicester Square. Source: help.cineworld.co.uk membership groups article.

## ASOS
- **Early sale access** (Premier) — CONFIRMED. "Premier Early Access" is a current, promoted benefit; Premier is £9.95/year with unlimited free next-day delivery (£15 minimum order). Source: asos.com/discover/ww-premier-early-access/

## Nationwide
- **Fairer Share payment** (FlexAccount) — CONFIRMED for 2026. £100 announced 21 May 2026 (fourth year), paid 10–30 June 2026 to 4m+ members; qualifying current account on 31 March 2026 plus qualifying savings (£100+) or mortgage (£100+ owing). Source: nationwide.co.uk/about-us/fairer-share

## American Express
- **Airport lounge passes** (Gold) — CONFIRMED. Still 4 complimentary Priority Pass visits per membership year, refreshed at renewal; extra visits ~£24. Source: americanexpress.com/en-gb/benefits/explore-your-gold-card/travel/lounges/

## Vodafone
- **Priority event tickets** (VeryMe) — CONFIRMED with copy change. Ticket access is live but works as prize draws/giveaways and occasional presales tied to partner events (Glastonbury, Wimbledon, BST etc), not standing priority booking. Soften copy to "chances to win tickets and exclusive access to partner events". Source: vodafone.co.uk VeryMe Rewards page.

## Costco
- **2% annual reward** (Executive) — CONFIRMED. UK caps: £400/year Executive Individual (£62 +VAT), £500/year Executive Trade (£56 +VAT); reward calculated ex-VAT. Source: costco.co.uk/membership-executive-requirements

## Blue Light Card
- **Free Deliveroo Plus Silver** (Blue Light Card) — CONFIRMED, still running. 12 months Plus Silver free for eligible members; BLC itself £4.99 for 2 years. Source: bluelightcard.co.uk/en/free-deliveroo-plus

## National Trust
- **Free entry to National Trust places** (Family) — CHANGED. Current prices: Family (2 adults + children/grandchildren 17 and under) £176.40/year or £14.70/month; Family (1 adult + children) £109.20/year or £9.10/month. The ~£126 figure is out of date. DECISION NEEDED: which family composition to model (or both). Source: nationaltrust.org.uk/membership
- **Free entry to National Trust places** (Life) — CHANGED. Current one-off prices: Individual £2,430 (senior 60+ £1,815), Joint £3,030 (senior £2,280), Family £3,170. The ~£1,845 figure matches only the senior individual rate. DECISION NEEDED: which life tier to model and how to represent the one-off fee monthly. Source: nationaltrust.org.uk/membership/life-membership

## OVO / Sky naming (reconciliation)
RESOLVED, no change needed. `perks` and `user_memberships` both use "OVO Energy" and "Sky TV" consistently; the extra "OVO"/"Sky" keys in `theme.js` are logo-alias fallbacks only.
