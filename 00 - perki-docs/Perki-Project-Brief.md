# Perki - project brief

_Starting context for a new build agent. Last updated: 2026-06-24 · Founder: Ollie Glanville (ollie_glanville@hotmail.co.uk)_

## 1. What Perki is

Perki is a personal, cross-provider perks engine for the UK. It shows people the perks, features, discounts and competitions they already get from memberships they hold, and it is evolving into a weekly personalised email that (1) saves people money by optimising and consolidating their memberships, and (2) tells them how to use the perks they already pay for.

North star: grow the weekly email list to 10,000 subscribers. Two value drivers: save the user money, and help them use what they already pay for.

## 2. Stack and where things live

- Front end: React 18 + Vite 6 + react-router + Tailwind (tokens), lucide-react. Repo root `C:\Projects\Perki-App`. Two surfaces share the codebase: the website (`src/pages`, `src/ui`) and a mobile-style app (`src/app`). Marketing site + app.
- Backend: Supabase (project ref `iievmjsfpgixqdpuxbkg`, region eu-west-1). Postgres, Auth, Edge Functions, pg_cron, pg_net, Vault.
- Email: Resend, sending domain `perki.app` (from `digest@perki.app`).
- Hosting: Vercel, live at perki-app.vercel.app. Deploys from GitHub `oglanville/Perki-App` on push.
- Email marketing (future weekly engine): Beehiiv (not yet set up).

Key code:

- `src/pages/Perks.jsx`, website Marketplace (filters, Compare, Add-to-profile).
- `src/pages/Profile.jsx`, website Profile (dashboard, memberships, Add Membership modal, Active/Inactive split).
- `src/app/`, the app: `AppShell.jsx`, `tabs/` (HomeTab, MarketplaceTab, ProfileTab, WhereTab), `components.jsx`, `theme.js`, `hooks/usePerksData.js`.
- `src/data/catalog.js`, data helpers: fetchAllPerks, buildTierMap, buildMembershipCatalog, addMembership/removeMembership, cadence + status helpers, `RENEWAL_DATES_ENABLED` flag.
- `src/ui/brand.jsx` and `src/app/theme.js`, brand logo maps (Clearbit → Simple Icons → favicon → initials fallback).
- `supabase/functions/daily-digest/index.ts`, the 7am email function.
- `Perks_Rows.xlsx` (repo root), the catalogue source of truth that is ingested into the Supabase `perks` table.
- `00 - perki-docs/`, all specs, brand, research, working files (to-do board), outputs.

## 3. Brand

Eggshell #F4F0E6, raised #FCFAF4, indigo #2B2A6E (hover #3A388F), gold #E0A93B / gold-deep #B07C1A / gold-tint #F7ECD4, ink #23202A, muted #6B6757, border #E4DDCB. Fonts: Outfit (headings), Work Sans (body). Voice: British English, sentence case, value-first, no em dashes, no hype.

## 4. Data model

- `perks` (catalogue, 433 rows, 24 providers): perk_id, provider, membership, tier, feature (the item TYPE: feature | perk | discount | competition), title, description, category, reset_period, next_reset_date, price (tier monthly cost), plus icon/source/verify fields.
- `user_memberships`: user_id, provider, membership, tier. "No tier" is stored as an empty string.
- `user_perk_state`: user_id, perk_id, used, dismissed, will_not_use, next_reset_date.
- Derived in code: tier price/order from `price`; cadence (Weekly/Monthly/One-off) from `reset_period`; status (Have used / Have not used / Will not use) from the state flags.
- Ollie is currently the only user, with ~10 memberships (Monzo Max, Revolut Standard, Sky TV Silver, OVO Energy Beyond, Amazon Prime, Spotify Individual, Deliveroo Plus Silver, BA Blue, Tesco Clubcard, Nando's Rewards).

## 5. What is live

- Website + app deployed on Vercel; catalogue served live from Supabase `perks`.
- 24 providers in the catalogue (145 rows added for 20 new memberships beyond the original Monzo/Revolut/OVO/Sky).
- The 7am daily digest is sending and arriving. Note: it currently runs via an interim cron route (the function's preview path authenticated with the project anon key), so the subject carries a `[PREVIEW]` prefix and it emails only Ollie. See section 6 for the proper fix.

## 6. Built and verified but NOT yet deployed (as of this brief)

All bundle/syntax-verified, pending the deploys in the deploy script:

- Cadence + Status system across web, app, email; renewal dates hidden behind `RENEWAL_DATES_ENABLED = false`.
- Provider logo fallback chain for all memberships.
- Marketplace: selecting a tier filters the membership chips.
- Daily digest: reordered layout, gold Active/Inactive per-type dashboard counts, cadence copy, Resend error reporting, and the Savings + Consolidation engines now computed from real per-user data (no more hardcoded "Revolut Metal").
- Profile: "Add Membership" button + two-step onboarding-style modal (search memberships → tier or "No tier"), web and app.

Deploy: front end via `git add src/ && git commit && git push` (Vercel), digest via `supabase functions deploy daily-digest --project-ref iievmjsfpgixqdpuxbkg`.

## 7. Open workstreams

- Proper digest send: redeploy the function with `--no-verify-jwt` plus a matching `CRON_SECRET`, then point the cron at the production path to drop the `[PREVIEW]` prefix and support more than one recipient.
- Winter DST: the single 06:00 UTC cron is 07:00 BST now but 06:00 GMT in winter; move to 07:00 UTC (or restore the 7am-London guard + two jobs) before late October.
- Provider types (life-category labels and filters): spec ready (Perki-Spec-Provider-Types-Labels.md), not built.
- Bundles view in the app (Holiday / Cinema / Sports / Workday): config exists, UI not built.
- Beehiiv: choose the personalisation route and stand up the publication + signup flow toward 10k.
- Email deliverability: watch that the 7am send keeps landing in Hotmail; verify SPF/DKIM/DMARC on perki.app in Resend if it starts getting filtered.
- Catalogue: ingest O2 + Lidl (awaiting source data); verify the 19 NEEDS-VERIFY rows (Perki-NEEDS-VERIFY.md); reconcile OVO Energy/Sky TV vs OVO/Sky naming.
- Onboarding flow (reuse the Add Membership two screens); deepen the catalogue; test with real users.

## 8. Guardrails (decisions already made)

Manual, accurate catalogue ingestion only, no scraping or automated extraction. Accuracy over speed. Perki recommends and links but never cancels, switches, buys or moves money on a user's behalf. Calendar access (future) is opt-in and read-only. Brand is locked (eggshell, indigo, gold). The auto-send of the internal to-do board is off. Secrets (Resend key, cron secret) stay in Supabase Vault, never in git.

## 9. Where to look first

- Current status and priorities: `00 - perki-docs/04 - WORKING FILES/perki-kanban.html` and `daily-todo.md` (rev 12).
- Specs: `00 - perki-docs/02 - PRODUCT/` (weekly savings engine, daily digest update, cadence/status/bundles, marketplace compare, add-membership flow, provider types).
- Brand: `00 - perki-docs/06 - BRAND/`.
