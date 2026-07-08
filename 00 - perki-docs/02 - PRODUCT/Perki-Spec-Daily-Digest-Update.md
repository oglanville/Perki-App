# Perki spec: Daily Digest update (blended layout)

_Status: implemented in the daily-digest function, pending production deploy · Owner: Ollie · Last updated: 2026-06-14_

## 1. Summary

The Perki Daily Digest is reworked to blend the original digest with the new savings direction. It keeps the dashboard and the familiar "Your memberships" and "What to use today" sections, and introduces the two new engines (Savings and Consolidation) as a side-by-side split-screen so they draw attention without dominating the top of the email. "Where to use next" becomes contextual prompts tied to upcoming plans rather than a category grid.

## 2. Delivery and profile requirements

The digest is sent in production (not preview or sandbox) by the existing `daily-digest` edge function, on the live 7am schedule. It runs once a day and lands at 07:00 Europe/London. Ollie is currently the only person with memberships and is not opted out, so he is the sole recipient and receives the real per-user production email, exactly as any user would see it (no `[PREVIEW]` prefix). Because he is the only recipient, wholesale layout changes are safe.

The 7am timing is already handled: two pg_cron jobs fire at 06:00 and 07:00 UTC and the function guards so it only sends when the London hour is 7, which stays correct across daylight saving. No cron change is needed; deploying the updated function is enough.

## 3. Section order (exact)

The email renders top to bottom in this order, and only these sections:

1. Header: Perki wordmark and the date.
2. Greeting: one short line.
3. Dashboard: unchanged. Headline plus the four stat tiles (Available, Used, Set aside, Memberships).
4. Your memberships: directly under the dashboard. The held providers and tiers, each marked Active.
5. Split-screen engines: a two-column row. Left pane is the Savings engine ("Move this, save that"); right pane is the Consolidation engine ("Stop doubling up"). On mobile the two panes stack, savings first.
6. What to use today: perks resetting or expiring soon, including weekly resets, each with an Open action.
7. Where to use next: contextual prompts mapped to perks the user already holds (see section 5).
8. Footer: read-only reassurance, manage preferences, unsubscribe.

Removed from the previous digest: the long greeting paragraph is trimmed, and the "Worth adding" and "All your perks by category" sections are dropped, so the email stays focused.

## 4. The two engines (split-screen)

Both engines sit in the split-screen and are intentionally not at the very top, so the dashboard and memberships ground the email first.

Savings engine, left pane, titled "Move this, save that". Shows one or two money moves: a cheaper equivalent tier, a consolidation that removes duplicated cost, or a worthwhile upgrade. Each move is a short title, a one-line reason, and a saving chip (gold for a saving, indigo for a small extra cost).

Consolidation engine, right pane, titled "Stop doubling up". Shows where the user is likely paying twice or holding redundant cover, with the duplicate named and the reason it is redundant.

Important: the engine content is currently illustrative placeholder copy. The real Savings and Consolidation logic (computing cheaper tiers and detecting duplicate benefits from the catalogue) is the separate build described in Perki-Spec-Weekly-Savings-Engine.md. Until that logic lands, these two panes show sample moves. Because Ollie is the sole recipient and aware of this, that is acceptable for now; the panes must be wired to real per-user computation before the list grows beyond him.

## 5. Where to use next (contextual)

Replaces the old category grid. Three prompts, each shown only if the user holds a matching perk:

- "Going on holiday?" maps to Travel, Insurance or Currency perks.
- "Fancy a trip to the cinema?" maps to Entertainment or Streaming perks.
- "Off to a sports game?" maps to Sports perks.

Each prompt picks the first matching perk the user holds and names it ("Use your X from Y") with a "Use this" action. Prompts with no matching perk are omitted, so the section is never padded. This runs entirely on the user's own memberships; no partner input and no calendar are required yet. When calendar access is added later (see the weekly-engine spec), these prompts can key off real upcoming events rather than always-on availability.

## 6. Implementation notes

The change is contained in `supabase/functions/daily-digest/index.ts`, in `buildEmailHtml`. The split-screen, the contextual "where to use next", and the new assembly order are implemented there; the data loading, dashboard, memberships and "what to use today" builders are unchanged, so the real per-user data stays accurate. Mobile stacking uses the existing `.stack` and `.stack-mb` classes.

To go live: deploy the function and the existing 7am cron picks it up.

```
supabase functions deploy daily-digest --project-ref iievmjsfpgixqdpuxbkg
```

The deploy is best run from the CLI because it reads the file directly with no risk of corrupting an 800-plus line production function. After deploying, the layout can be checked immediately with a preview send (the function's preview path posts a single email to a chosen address), or simply by waiting for the next 07:00 London production run.

## 7. Cleanup applied

The one-off preview scaffolding from the earlier "send it just to me" test is removed: the `email_templates` table is dropped, the standalone `weekly-preview` function is retired, and the temporary template branch is taken back out of the daily-digest source. Production is left clean, with only the updated `daily-digest` function in place.

## 8. Open items

- Wire the Savings and Consolidation panes to real per-user computation before the mailing list grows beyond one person.
- Confirm "what to use today" is surfacing weekly resets as intended once live (it selects perks resetting or expiring soon).
- Calendar-driven "where to use next" is a later phase, tracked in the weekly-engine spec.
