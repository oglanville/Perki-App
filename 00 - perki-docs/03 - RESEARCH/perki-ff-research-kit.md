# Perki friends-and-family evaluation kit

_2026-07-09 · Evaluates: is a daily perk email people interact with a good idea? Cohort: 10-20 friends and family. Method: 2-week live diary study (the email IS the diary) + 5-8 interviews + behavioural metrics. The product is the research instrument — no surveys needed._

## 1. The question, made falsifiable

Not "do you like Perki?" but three testable claims:
- **H1 (habit):** ≥40% of the cohort still opens the email in week 2 (day 8-14 average open rate).
- **H2 (interaction):** ≥30% click "Update your perk tracker" or mark a perk used at least twice in the fortnight.
- **H3 (growth):** ≥3 of 20 forward the email or ask for an invite link for someone else, unprompted.

If all three hold → daily email validated for this segment, scale the list. If H1 fails but H2 holds → frequency problem, not value problem (go weekly-default). If H2 fails → the interaction loop needs rework before any growth push. If only H3 fails → product works, shareable moment missing.

## 2. Recruit message (send as-is, WhatsApp)

> I've built something and need 15 honest guinea pigs. It's a daily 7am email that shows every perk you already get from stuff you pay for (bank, supermarket, streaming, mobile) — and finds where you're overpaying. Two weeks, then I'll grill you for 20 minutes about why you did or didn't open it. Free, no bank connection, just pick your providers from a list. In?

Track who says yes within 24h — that ratio is itself a signal on the pitch.

## 3. The fortnight

- **Day 0:** They onboard themselves (no hand-holding — onboarding IS under test). Note where anyone stalls or messages you for help.
- **Days 1-14:** Emails send as normal. You watch the metrics (below) and change NOTHING mid-test.
- **Day 5 + Day 12:** One-line WhatsApp pulse: "This morning's email — opened it? y/n, one word why."
- **Day 15+:** Interviews with 5-8, chosen to cover: 2 who engaged heavily, 2 who dropped off, 1 who never started, and the oldest + youngest participants.

## 4. Interview guide (25 min)

**Warm-up (3):** How do you currently keep track of what your memberships give you? (Expected: "I don't.")
**Context (5):** Walk me through yesterday morning's inbox. What got opened, what got swiped away, why?
**Deep dive (10):**
- Show me how you used Perki this week (watch, don't prompt).
- Which email do you remember? What was in it? (Tests: does anything stick?)
- Have you acted on anything — used a perk, considered a downgrade? What stopped you?
- The magic-wand question: if Perki could only do ONE thing, what should it keep?
**Reaction (5):** Show the savings-engine finding on your account ("£X/mo on the table"). First words out of their mouth get written down verbatim.
**Wrap (2):** Who do you know that needs this? Would you send it to them right now, while I watch? (The flinch is the data.)

## 5. Behavioural metrics (the quant layer)

Per person per day, from Resend + the tracker: delivered / opened / tracker-clicked / perks marked used. Weekly rollup per participant. Definition of an "engaged" participant: ≥3 opens AND ≥1 interaction per week. North-star for the fortnight: **engaged% at day 14** — this number, not opinions, decides the 10k push.

## 6. Synthesis (after interviews)

Affinity-map quotes into: frequency, value, trust, effort, shareability. Prioritise on impact/effort. Deliverable: one page — keep / change / kill list plus the day-14 engaged%. Use `design:research-synthesis` on the interview notes.

## 7. What the synthetic panel already flagged (test these against real humans)

Five simulated personas (directional only) predicted: daily frequency kills busy/inbox-zero segments by week 2 (watch H1 by persona type); the tick-off must be one-tap from the email; the first engine finding must land within 48h of signup or interest dies; "Perki found me £31/month" beats "track your perks" as the pitch; the shareable moment (screenshot-able finding) outranks referral rewards and social proof as the growth lever for 4 of 5 personas; data staleness is the trust-killer for optimiser types. Real-cohort data confirming or refuting each of these is the actual output of this study.
