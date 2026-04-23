# Perki — Supabase Setup Guide

This guide walks you through setting up Supabase as the backend for Perki. By the end you will have a live database powering the app, real user authentication, and persistent perk state.

---

## What you're setting up

| Table | Purpose |
|---|---|
| `perks` | Master catalogue of all perks (public, read-only for users) |
| `profiles` | User profile data (auto-created on signup) |
| `user_memberships` | Which provider + tier each user has activated |
| `user_perk_state` | Per-user used/unused toggle for each perk |
| `membership_requests` | User-submitted requests for new memberships |

All tables have Row Level Security (RLS) so users can only access their own data. The perks catalogue is readable by everyone.

---

## Step 1 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign up (free tier is fine).
2. Click **New Project**.
3. Choose an organisation (or create one), name it `perki`, pick a region close to your users (e.g. London), and set a database password. Save this password somewhere — you won't need it in the app, but you need it for direct DB access.
4. Wait ~60 seconds for the project to provision.

---

## Step 2 — Run the schema SQL

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar).
2. Click **New query**.
3. Open the file `supabase/001_schema.sql` from this project.
4. Copy the entire contents, paste into the SQL editor, and click **Run**.
5. You should see "Success. No rows returned" — that means all tables and policies were created.

---

## Step 3 — Seed the perks data

1. Still in the SQL Editor, click **New query** again.
2. Open `supabase/002_seed_perks.sql`.
3. Copy, paste, and click **Run**.
4. You should see "Success. 38 rows affected" (or similar).

To verify: go to **Table Editor** in the sidebar, click the `perks` table, and you should see all 38 perks listed.

---

## Step 4 — Get your API credentials

1. Go to **Settings → API** in the Supabase dashboard.
2. Copy the **Project URL** — it looks like `https://abcdefgh.supabase.co`.
3. Copy the **Publishable key** (starts with `sb_publishable_`). If you don't see one yet, copy the `anon` `public` key instead — both work for client-side access.

---

## Step 5 — Configure the app

1. In the root of your Perki project, copy the template:

```bash
cp env.local.example .env.local
```

2. Open `.env.local` and paste in your values:

```
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxx
```

3. Install the new dependency:

```bash
npm install
```

4. Start the dev server:

```bash
npm run dev
```

---

## Step 6 — Configure authentication

Supabase Auth handles signup, login, and session management. To set it up:

1. Go to **Authentication → Providers** in the Supabase dashboard.
2. Ensure **Email** is enabled (it is by default).
3. For testing, go to **Authentication → Settings** and toggle **off** "Confirm email" so you can sign up without checking your inbox. Turn this back on before going live.
4. Optionally add Google, Apple, or other OAuth providers later.

The app's login screen will need to call `supabase.auth.signUp()` and `supabase.auth.signInWithPassword()` instead of the current dummy check. The Supabase client helper is already set up at `src/lib/supabase.js`.

---

## Step 7 — Deploy to Vercel with environment variables

1. Push your code to GitHub (do NOT commit `.env.local`).
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Before clicking Deploy, go to **Environment Variables** and add:
   - `VITE_SUPABASE_URL` → your project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` → your publishable key
4. Click **Deploy**.

Vercel injects these at build time so the live app connects to your Supabase project.

---

## How the app will use Supabase

Here is the mapping from current behaviour to Supabase calls:

| Current (hardcoded) | Supabase equivalent |
|---|---|
| `PERKS_DATA` array in App.jsx | `supabase.from('perks').select('*')` |
| `usedMap` React state | `supabase.from('user_perk_state').select('*').eq('user_id', userId)` |
| Toggle used | `supabase.from('user_perk_state').upsert({ user_id, perk_id, used: true })` |
| `activeMemberships` state | `supabase.from('user_memberships').select('*').eq('user_id', userId)` |
| Add membership | `supabase.from('user_memberships').insert({ user_id, provider, membership, tier })` |
| Remove membership | `supabase.from('user_memberships').delete().eq('user_id', userId).eq('provider', x).eq('tier', y)` |
| Dummy login | `supabase.auth.signInWithPassword({ email, password })` |
| Dummy signup | `supabase.auth.signUp({ email, password, options: { data: { full_name } } })` |
| Request membership | `supabase.from('membership_requests').insert({ user_id, requester_name, description })` |

---

## Database diagram

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────────┐
│  auth.users   │────▶│    profiles      │     │      perks       │
│  (Supabase)   │     │  id (FK)        │     │  perk_id (PK)    │
│               │     │  full_name      │     │  provider        │
│               │     │  email          │     │  tier             │
│               │     │  avatar_url     │     │  title            │
└──────────────┘     └──────┬──────────┘     │  description     │
                            │                 │  category         │
                    ┌───────┴────────┐        │  reset_period     │
                    │                │        └────────┬─────────┘
           ┌────────▼──────┐  ┌──────▼───────────┐     │
           │ user_          │  │ user_perk_state   │     │
           │ memberships    │  │  user_id (FK)     │─────┘
           │  user_id (FK)  │  │  perk_id (FK)     │
           │  provider      │  │  used             │
           │  tier          │  │  used_at          │
           └───────────────┘  └──────────────────┘

           ┌──────────────────────┐
           │ membership_requests   │
           │  user_id (FK)         │
           │  requester_name       │
           │  description          │
           │  status               │
           └──────────────────────┘
```

---

## Weekly email (future)

Once users have real data flowing into `user_perk_state`, a weekly email becomes straightforward:

1. **Vercel Cron Function** (a serverless function at `/api/weekly-email.js` with a cron schedule in `vercel.json`).
2. The function queries Supabase with the `service_role` key (server-side only, never exposed to the browser) to get all users and their perk state.
3. For each user, compute available vs used vs resetting-soon perks.
4. Render an HTML email and send via **Resend** or **SendGrid**.
5. Include deep links back to the app like `https://perki.app/?tab=home`.

The `vercel.json` cron config looks like this:

```json
{
  "crons": [
    {
      "path": "/api/weekly-email",
      "schedule": "0 8 * * 1"
    }
  ]
}
```

This runs every Monday at 8am UTC.

---

## Quick reference: useful Supabase dashboard pages

| What | Where |
|---|---|
| View/edit perks data | Table Editor → `perks` |
| View users | Authentication → Users |
| Run SQL | SQL Editor |
| API keys | Settings → API |
| Auth settings | Authentication → Settings |
| Logs | Logs → API / Auth |

---

## Next steps

1. Run the two SQL files (schema + seed).
2. Set up `.env.local` with your credentials.
3. Test the app locally with `npm run dev`.
4. Swap the dummy login for real Supabase Auth calls.
5. Replace hardcoded data with Supabase queries.
6. Deploy to Vercel with environment variables.
