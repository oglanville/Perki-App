# Perki

All your membership perks in one place. Track, manage and discover perks from Monzo, Revolut, OVO Energy, American Express and more.

## Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Supabase (Auth, Database)
- **Hosting**: Vercel

## Local Development

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase credentials
npm run dev
```

## Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USER/perki.git
git push -u origin main
```

### 2. Import in Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel auto-detects Vite — no build settings to change

### 3. Add Environment Variables

In **Vercel → Project Settings → Environment Variables**, add:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

Then redeploy.

## Supabase Tables

The app expects these tables:

### `perks`
| Column | Type | Notes |
|--------|------|-------|
| perk_id | text (PK) | e.g. `monzo-perks-greggs-weekly` |
| provider | text | e.g. `Monzo` |
| membership | text | e.g. `Monzo` |
| tier | text | e.g. `Perks` |
| title | text | Display name |
| description | text | |
| category | text | `retail`, `finance`, `travel`, etc. |
| reset_period | text | `WEEKLY`, `MONTHLY`, `ANNUALLY`, `NONE` |
| next_reset_date | date | nullable |
| usage_limit | text | |
| popularity | text | |
| emoji | text | Optional — emoji for tile icon (e.g. `☕`) |
| icon_initials | text | Optional — 2-3 letter abbreviation |
| icon_color | text | Optional — hex colour |
| icon_gradient | text | Optional — CSS gradient string |

### `tiers`
| Column | Type | Notes |
|--------|------|-------|
| provider | text | e.g. `Revolut` |
| tier | text | e.g. `Premium` |
| price_label | text | e.g. `£7.99/mo` |
| sort_order | integer | 0 = cheapest |

### `user_memberships`
| Column | Type |
|--------|------|
| user_id | uuid (FK → auth.users) |
| provider | text |
| membership | text |
| tier | text |

### `user_perk_state`
| Column | Type |
|--------|------|
| user_id | uuid (FK → auth.users) |
| perk_id | text |
| used | boolean |
| dismissed | boolean |
| used_at | timestamptz |
| updated_at | timestamptz |

### `membership_requests`
| Column | Type |
|--------|------|
| user_id | uuid |
| requester_name | text |
| description | text |

### `profiles`
| Column | Type |
|--------|------|
| id | uuid (PK, FK → auth.users) |
| full_name | text |
