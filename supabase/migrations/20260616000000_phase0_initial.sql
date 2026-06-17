-- =============================================================================
-- World Cup Companion — Initial Schema  (Phase 0)
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- =============================================================================

-- -------------------------------------------------------------------------
-- PROFILES
-- One row per authenticated user; auto-created on first sign-in via trigger.
-- -------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid        primary key references auth.users(id) on delete cascade,
  username      text        unique,
  avatar_url    text,
  favorite_team text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Index for username lookups
create index if not exists profiles_username_idx on public.profiles (username);

-- Automatically keep updated_at current
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- Auto-create a profile row whenever a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- -------------------------------------------------------------------------
-- MESSAGES
-- Fan chat / match commentary — scoped to an optional match_id.
-- -------------------------------------------------------------------------
create table if not exists public.messages (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  content    text        not null check (char_length(content) between 1 and 500),
  match_id   text,        -- e.g. "group-A-match-3", null = global chat
  created_at timestamptz not null default now()
);

-- Fast time-ordered retrieval per match
create index if not exists messages_match_created_idx
  on public.messages (match_id, created_at desc);

create index if not exists messages_user_idx
  on public.messages (user_id);


-- -------------------------------------------------------------------------
-- ROW-LEVEL SECURITY
-- -------------------------------------------------------------------------

-- PROFILES: users can read all profiles; only own profile is editable
alter table public.profiles enable row level security;

create policy "Profiles are viewable by all authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- MESSAGES: any authenticated user can read; only own messages can be inserted/deleted
alter table public.messages enable row level security;

create policy "Messages are viewable by all authenticated users"
  on public.messages for select
  to authenticated
  using (true);

create policy "Users can insert their own messages"
  on public.messages for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete their own messages"
  on public.messages for delete
  to authenticated
  using (auth.uid() = user_id);


-- -------------------------------------------------------------------------
-- REALTIME (optional — enable for live match chat)
-- -------------------------------------------------------------------------
-- Uncomment to stream new messages to clients via supabase.channel():
-- alter publication supabase_realtime add table public.messages;
