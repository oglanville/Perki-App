# Perki spec: weekly savings and smart-usage engine

_Status: direction proposal, ready for engineering scoping · Owner: Ollie · Last updated: 2026-06-11_

## 1. Summary

Perki evolves from a perks catalogue into a weekly personalised email engine. Every subscriber receives one email a week, tailored to the memberships, tiers and perks they hold, that does two jobs: it saves them money by optimising and consolidating what they pay for, and it tells them how to use perks they already have, timed to what is coming up in their life. The weekly email is the core engagement channel and the main growth engine. It is generated as Beehiiv-ready content and delivered through Beehiiv.

The catalogue, the app and the website remain, but their job shifts to feeding and supporting the email: the catalogue is the data layer, the app and site are where people connect memberships and a calendar.

## 2. Goals and non-goals

Goals: deliver a genuinely personalised weekly email; quantify real monthly savings from optimisation and consolidation; surface the right unused perk at the right moment using only the user's own data; make the whole thing run through Beehiiv so growth, segmentation, scheduling and testing are handled by a proven platform.

Non-goals for this phase: no partner or company input is required for any recommendation; no scraping or automated extraction from company websites (the catalogue stays manually, accurately curated); no execution of changes on the user's behalf (Perki recommends and links, the user acts); no real-time or daily cadence, this is a weekly product.

## 3. North star metric

Grow the Beehiiv weekly email list to 10,000 subscribers. Every design and prioritisation decision should be weighed against whether it grows or retains that list. Supporting metrics: weekly open rate, click-through on the savings and usage blocks, week-on-week retention, referral rate, and total quantified savings surfaced per subscriber (a proof point for sharing and press).

## 4. The two core value drivers

Everything in the email ladders up to two promises. First, save the user money, through optimisation (cheaper equivalent tiers) and consolidation (removing duplicate or redundant memberships). Second, help the user use what they already pay for, through context-aware perk activation tied to upcoming events. The email should always lead with money saved, because that is the sharpest hook for growth, then follow with usage.

## 5. Inputs and data model

The engines run entirely on data Perki already holds or the user connects. No partner integration is needed.

Catalogue (Supabase `perks`, already live with 24 providers): provider, membership, tier, feature type (feature, perk, discount, competition), category, description, `reset_period`, `usage_limit`, and `price` (the tier's monthly cost, which already drives tier ordering). This is the universe of memberships, tiers and benefits.

User memberships (`user_memberships`): which provider, membership and tier each user holds. This defines what they pay for today.

User perk state (`user_perk_state`): which perks they have used, when, `next_reset_date`, and any marked will-not-use. This tells the usage engine what is going unused.

Calendar data (new input): read-only access to the user's calendar to detect upcoming events (birthdays, Mother's Day and similar dates, holidays and trips). This is the only new data source and carries the main privacy weight (see section 11). It must be optional: the savings and consolidation engines work without it, and the smart-usage engine degrades gracefully to a general seasonal calendar when no personal calendar is connected.

## 6. Engine one: savings engine ("move this, save that")

Purpose: show the user, at the top of every email, concrete moves that cut their monthly bill or add value for little more. It produces a ranked list of recommendations, each quantified.

Recommendation types:

- Cheaper equivalent tier: the user holds a tier whose benefits they actually use are available on a lower-priced tier of the same or another provider. Output: "Move X to Y, save £N a month," with the perks kept and any perks lost.
- Better-value upgrade: a small step up unlocks perks the user would value. Output: "Upgrade X for £N more, unlock these perks." Only shown when the added perks plausibly match the user's behaviour or category interests.
- Provider switch: a competing membership delivers the same core benefit cheaper (for example a phone plan benefit available through a bank tier the user could hold). Output: "Move your phone plan to Monzo, save £N a month plus gain these perks."

Logic: for each held membership, compute the user's effective monthly cost from the catalogue `price`, identify the cheapest tier or alternative that preserves the benefits the user actually uses (from perk state), and compute the delta. Reuse the tier-price and cheapest-tier logic already built for the Marketplace and Compare features. Rank by net monthly saving, then by confidence.

Each recommendation must carry: the move in plain language, monthly saving (or extra cost for upgrades), perks gained, perks lost, and a CTA linking to the relevant Perki page. Never recommend a downgrade that strips a perk the user has recently used without flagging the loss.

## 7. Engine two: consolidation engine (one-tap optimisation)

Purpose: find where the user overpays through duplication, and propose the most cost-efficient set of memberships and tiers overall.

Detection:

- Duplicate benefits: the same real-world benefit held twice across memberships (for example travel insurance from a packaged bank account and again from a separate policy, or two services that both bundle breakdown cover). Match on benefit category and description, not on provider.
- Redundant memberships: a membership whose used benefits are fully covered by another membership the user holds.
- Consolidation opportunity: a single membership or tier that would replace two or more current ones at lower combined cost.

Output: a proposed optimal set ("your most cost-efficient line-up"), the total monthly saving versus today, and the specific changes to get there. "One-tap" in this phase means a clear, ordered checklist with deep links, not automated account changes. Perki never cancels, switches or buys on the user's behalf; it shows the path and links out.

## 8. Engine three: smart-usage engine (context-aware recommendations)

Purpose: surface perks the user is not using but should be, timed to what is coming up. It needs no partner input and relies only on the user's memberships plus calendar.

Logic: scan the next one to four weeks of calendar events, classify each into intent categories (birthday, gifting occasion such as Mother's Day, travel or holiday, dining, entertainment, and so on), then match those intents to unused perks the user holds, using the catalogue category and description plus perk state (unused, and not marked will-not-use). Prioritise perks that reset soon (`reset_period`, `next_reset_date`) so value is not lost.

Examples: a birthday next week surfaces relevant rewards and dining perks; Mother's Day approaching surfaces gift discounts and experiences; an upcoming trip surfaces lounge access, travel insurance, fee-free spending and roaming benefits the user already holds.

Fallback without a connected calendar: use a general UK seasonal calendar (bank holidays, common gifting dates) plus reset-soon perks, so the block is never empty.

## 9. The weekly email

Structure, in order:

1. Subject line: leads with the headline saving or the single most timely perk. A/B tested in Beehiiv.
2. Preheader: one line reinforcing the subject, distinct from it.
3. Opening: one short personalised line (total potential monthly saving, or the week's standout move).
4. Savings engine block: the top one to three quantified moves.
5. Consolidation engine block: the optimal line-up and total saving, shown when there is a meaningful consolidation to make.
6. Smart-usage engine block: one to three timely perks to use this week.
7. Close: a single primary CTA and a referral prompt that feeds the growth metric.

Content rules: brand voice throughout (British English, sentence case, value-first, no hype, no em dashes). Every block leads with a number or a concrete action. Keep it scannable on mobile. Blocks that have nothing to say are omitted rather than padded.

## 10. Beehiiv integration

Beehiiv is the primary delivery platform and owns scheduling, audience segmentation, subscriber-growth tracking and A/B testing. Perki's job is to generate Beehiiv-ready content; Beehiiv's job is to deliver and grow.

Output format: Claude (or the generation service) outputs each email as clean, Beehiiv-compatible HTML built from simple blocks, structured so it can be pasted straight into the Beehiiv editor or pushed via the Beehiiv API. Each output includes: subject line, preheader, body, and the three dynamic blocks (savings, consolidation, smart usage) as self-contained HTML sections. Use Beehiiv-friendly building blocks only: clean HTML sections, images, CTA buttons, and personalisation tokens where applicable. Avoid layout that Beehiiv's editor cannot represent.

Personalisation approach (key architecture decision): Beehiiv's native model is one broadcast to a segment, with personalisation tokens (custom fields) for simple values like first name. Perki's content is deeply per-user (each person's savings differ). Three options, to be chosen during scoping:

- A. Segment-based: cluster subscribers into a manageable number of segments (by held memberships and savings profile) and send one tailored broadcast per segment, with tokens for light personalisation. Simplest to operate; coarser personalisation.
- B. Custom-field injection: precompute each subscriber's blocks and write them into Beehiiv custom fields, then reference those fields in a single broadcast template. Fully personalised; depends on Beehiiv field limits and payload size.
- C. API per-send: generate and send each subscriber's email individually through the Beehiiv API. Most personalised; highest operational complexity and the most to get right on deliverability.

Recommended path: start with A to launch and grow the list fast, instrument it, then move the highest-value blocks (savings) toward B as volume justifies. Confirm Beehiiv's current custom-field and API capabilities before committing to B or C.

## 11. Privacy and guardrails

Calendar access is the most sensitive element. It must be explicit opt-in, read-only, used solely to generate the user's own recommendations, never shared, and revocable. The savings and consolidation engines must work fully without it. Calendar contents must not be placed in URLs, query strings, or sent to any third party, and must not be stored beyond what is needed to generate the current email.

Carry the existing guardrails forward: manual, accurate catalogue ingestion only, no scraping; accuracy over speed; Perki recommends and links but never cancels, switches, buys or moves money on the user's behalf; the user performs every account change themselves. Recommendations must show perks lost as clearly as perks gained, so a "saving" is never misleading.

## 12. Roadmap

Phase 1, foundations: lock the email structure and brand template as Beehiiv blocks; build the savings engine on the existing catalogue and membership data; ship a segment-based weekly send (option A); start growing the list.

Phase 2, depth: add the consolidation engine; add the smart-usage engine on a general seasonal calendar; introduce A/B testing on subject lines and block order.

Phase 3, personalisation and calendar: add opt-in calendar connection for true context-aware usage; move the savings block toward per-subscriber personalisation (option B); add referral mechanics aimed squarely at the 10,000 target.

## 13. Open questions

- Personalisation route: confirm Beehiiv's current custom-field and API limits to choose between options A, B and C.
- Calendar source: which providers to support first (Google, Apple, Outlook) and via what connection.
- Savings confidence: how to model "benefits the user actually uses" well enough to recommend a downgrade safely.
- Consolidation matching: how to reliably detect duplicate real-world benefits across providers from catalogue descriptions.
- Provider-name reconciliation: align the live catalogue naming (for example OVO Energy versus OVO) before savings comparisons depend on it.
- Acquisition: which channels feed the Beehiiv list toward 10,000, and what the referral loop looks like.
