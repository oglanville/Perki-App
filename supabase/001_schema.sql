-- ╔══════════════════════════════════════════════════════════════╗
-- ║  PERKI — Supabase Schema                                    ║
-- ║  Run this ONCE in the Supabase SQL Editor (Dashboard → SQL)  ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ─────────────────────────────────────────────
-- 1. PERKS CATALOGUE (public, read-only for users)
-- ─────────────────────────────────────────────
create table public.perks (
  perk_id       text primary key,
  provider      text not null,
  membership    text not null,
  tier          text not null,
  title         text not null,
  description   text not null default '',
  category      text not null default 'other',
  reset_period  text not null default 'NONE',
  next_reset_date date,
  usage_limit   text default '',
  usage_notes   text default '',
  source_url    text default '',
  last_verified date default current_date,
  popularity    text default 'Unknown',
  icon_provider_url    text default '',
  icon_membership_url  text default '',
  created_at    timestamptz default now()
);

comment on table public.perks is 'Master catalogue of all membership perks across all providers.';

-- ─────────────────────────────────────────────
-- 2. PROFILES (extends Supabase Auth users)
-- ─────────────────────────────────────────────
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  email         text,
  avatar_url    text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

comment on table public.profiles is 'Public profile data for each authenticated user.';

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────
-- 3. USER MEMBERSHIPS (which provider+tier a user has)
-- ─────────────────────────────────────────────
create table public.user_memberships (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  provider      text not null,
  membership    text not null,
  tier          text not null,
  added_at      timestamptz default now(),
  unique(user_id, provider, tier)
);

comment on table public.user_memberships is 'Tracks which memberships each user has activated.';

-- ─────────────────────────────────────────────
-- 4. USER PERK STATE (used/unused per perk per user)
-- ─────────────────────────────────────────────
create table public.user_perk_state (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  perk_id       text not null references public.perks(perk_id) on delete cascade,
  used          boolean not null default false,
  used_at       timestamptz,
  updated_at    timestamptz default now(),
  unique(user_id, perk_id)
);

comment on table public.user_perk_state is 'Per-user used/unused state for each perk.';

-- ─────────────────────────────────────────────
-- 5. MEMBERSHIP REQUESTS (user-submitted requests)
-- ─────────────────────────────────────────────
create table public.membership_requests (
  id            bigint generated always as identity primary key,
  user_id       uuid references public.profiles(id) on delete set null,
  requester_name text,
  description   text not null,
  status        text default 'pending',
  created_at    timestamptz default now()
);

comment on table public.membership_requests is 'User requests for new memberships to be added to the catalogue.';


-- ═════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═════════════════════════════════════════════

-- Perks: anyone can read, only service_role can write
alter table public.perks enable row level security;
create policy "Perks are publicly readable"
  on public.perks for select
  using (true);

-- Profiles: users can read/update their own profile
alter table public.profiles enable row level security;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- User memberships: users can CRUD their own
alter table public.user_memberships enable row level security;
create policy "Users can view own memberships"
  on public.user_memberships for select
  using (auth.uid() = user_id);
create policy "Users can insert own memberships"
  on public.user_memberships for insert
  with check (auth.uid() = user_id);
create policy "Users can delete own memberships"
  on public.user_memberships for delete
  using (auth.uid() = user_id);

-- User perk state: users can CRUD their own
alter table public.user_perk_state enable row level security;
create policy "Users can view own perk state"
  on public.user_perk_state for select
  using (auth.uid() = user_id);
create policy "Users can insert own perk state"
  on public.user_perk_state for insert
  with check (auth.uid() = user_id);
create policy "Users can update own perk state"
  on public.user_perk_state for update
  using (auth.uid() = user_id);

-- Membership requests: users can insert and view their own
alter table public.membership_requests enable row level security;
create policy "Users can submit requests"
  on public.membership_requests for insert
  with check (auth.uid() = user_id);
create policy "Users can view own requests"
  on public.membership_requests for select
  using (auth.uid() = user_id);


-- ═════════════════════════════════════════════
-- INDEXES
-- ═════════════════════════════════════════════
create index idx_perks_provider on public.perks(provider);
create index idx_perks_category on public.perks(category);
create index idx_user_memberships_user on public.user_memberships(user_id);
create index idx_user_perk_state_user on public.user_perk_state(user_id);
