-- =============================================================================
-- World Cup Companion — Phase 1 Schema Migration
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- =============================================================================

-- -------------------------------------------------------------------------
-- 1. UPDATE PROFILES — add new columns
-- -------------------------------------------------------------------------
alter table public.profiles
  add column if not exists full_name text,
  add column if not exists country   text;


-- -------------------------------------------------------------------------
-- 2. DROP MESSAGES — recreate with proper UUID FK to matches
-- -------------------------------------------------------------------------
drop table if exists public.messages cascade;


-- -------------------------------------------------------------------------
-- 3. MATCHES
-- -------------------------------------------------------------------------
create table if not exists public.matches (
  id         uuid        primary key default gen_random_uuid(),
  round      text        not null,                         -- 'Group A', 'Round of 16', etc.
  match_date date        not null,
  team1      text        not null,
  team2      text        not null,
  venue      text,
  group_name text,                                         -- 'A'–'F', null for knockout
  starts_at  timestamptz not null,
  score1     int,                                          -- null until finished
  score2     int,
  status     text        not null default 'upcoming'       -- upcoming | live | finished
             check (status in ('upcoming','live','finished'))
);

alter table public.matches enable row level security;

create policy "Matches are readable by authenticated users"
  on public.matches for select to authenticated using (true);


-- -------------------------------------------------------------------------
-- 4. MESSAGES — proper match FK
-- -------------------------------------------------------------------------
create table public.messages (
  id         uuid        primary key default gen_random_uuid(),
  match_id   uuid        not null references public.matches(id) on delete cascade,
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  username   text,
  content    text        not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);

create index messages_match_created_idx on public.messages (match_id, created_at asc);

alter table public.messages enable row level security;

create policy "Messages readable by authenticated users"
  on public.messages for select to authenticated using (true);

create policy "Users insert own messages"
  on public.messages for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users delete own messages"
  on public.messages for delete to authenticated
  using (auth.uid() = user_id);


-- -------------------------------------------------------------------------
-- 5. PREDICTIONS
-- -------------------------------------------------------------------------
create table if not exists public.predictions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  match_id    uuid not null references public.matches(id)  on delete cascade,
  home_score  int  not null check (home_score >= 0),
  away_score  int  not null check (away_score >= 0),
  created_at  timestamptz not null default now(),
  unique (user_id, match_id)
);

create index predictions_user_idx  on public.predictions (user_id);
create index predictions_match_idx on public.predictions (match_id);

alter table public.predictions enable row level security;

create policy "Predictions readable by authenticated users"
  on public.predictions for select to authenticated using (true);

-- Can only predict before the match starts
create policy "Users insert own predictions before kickoff"
  on public.predictions for insert to authenticated
  with check (
    auth.uid() = user_id
    and (select starts_at from public.matches where id = match_id) > now()
  );

create policy "Users update own predictions before kickoff"
  on public.predictions for update to authenticated
  using (
    auth.uid() = user_id
    and (select starts_at from public.matches where id = match_id) > now()
  );

create policy "Users delete own predictions"
  on public.predictions for delete to authenticated
  using (auth.uid() = user_id);


-- -------------------------------------------------------------------------
-- 6. REALTIME — stream new messages to clients
-- -------------------------------------------------------------------------
alter publication supabase_realtime add table public.messages;


-- -------------------------------------------------------------------------
-- 7. SEED — 24 group-stage matches across 4 groups
--    Groups: A (Brazil/France/Japan/Morocco)
--            B (Argentina/Spain/USA/Poland)
--            C (England/Germany/Mexico/Switzerland)
--            D (Portugal/Netherlands/Belgium/Senegal)
--    Today  = 2026-06-17; matches before this date are 'finished' with scores
-- -------------------------------------------------------------------------
insert into public.matches (round, match_date, team1, team2, venue, group_name, starts_at, score1, score2, status) values

-- Group A
('Group A', '2026-06-12', 'Brazil',  'Japan',   'MetLife Stadium, New York',         'A', '2026-06-12 13:00:00+00', 3, 1, 'finished'),
('Group A', '2026-06-12', 'France',  'Morocco', 'Rose Bowl, Los Angeles',            'A', '2026-06-12 19:00:00+00', 2, 0, 'finished'),
('Group A', '2026-06-16', 'Brazil',  'Morocco', 'AT&T Stadium, Dallas',              'A', '2026-06-16 16:00:00+00', 1, 0, 'finished'),
('Group A', '2026-06-16', 'France',  'Japan',   'MetLife Stadium, New York',         'A', '2026-06-16 22:00:00+00', 2, 1, 'finished'),
('Group A', '2026-06-20', 'Japan',   'Morocco', 'Levi''s Stadium, Santa Clara',      'A', '2026-06-20 19:00:00+00', null, null, 'upcoming'),
('Group A', '2026-06-20', 'Brazil',  'France',  'Hard Rock Stadium, Miami',          'A', '2026-06-20 19:00:00+00', null, null, 'upcoming'),

-- Group B
('Group B', '2026-06-13', 'Argentina', 'USA',    'Arrowhead Stadium, Kansas City',   'B', '2026-06-13 13:00:00+00', 2, 0, 'finished'),
('Group B', '2026-06-13', 'Spain',     'Poland', 'Mercedes-Benz Stadium, Atlanta',   'B', '2026-06-13 19:00:00+00', 3, 1, 'finished'),
('Group B', '2026-06-17', 'Argentina', 'Poland', 'MetLife Stadium, New York',        'B', '2026-06-17 16:00:00+00', null, null, 'upcoming'),
('Group B', '2026-06-17', 'Spain',     'USA',    'Levi''s Stadium, Santa Clara',     'B', '2026-06-17 22:00:00+00', null, null, 'upcoming'),
('Group B', '2026-06-21', 'USA',       'Poland', 'AT&T Stadium, Dallas',             'B', '2026-06-21 19:00:00+00', null, null, 'upcoming'),
('Group B', '2026-06-21', 'Argentina', 'Spain',  'Rose Bowl, Los Angeles',           'B', '2026-06-21 19:00:00+00', null, null, 'upcoming'),

-- Group C
('Group C', '2026-06-14', 'England',     'Mexico',      'Gillette Stadium, Boston',          'C', '2026-06-14 13:00:00+00', 1, 1, 'finished'),
('Group C', '2026-06-14', 'Germany',     'Switzerland', 'Levi''s Stadium, Santa Clara',      'C', '2026-06-14 19:00:00+00', 2, 1, 'finished'),
('Group C', '2026-06-18', 'England',     'Switzerland', 'MetLife Stadium, New York',         'C', '2026-06-18 16:00:00+00', null, null, 'upcoming'),
('Group C', '2026-06-18', 'Germany',     'Mexico',      'AT&T Stadium, Dallas',              'C', '2026-06-18 22:00:00+00', null, null, 'upcoming'),
('Group C', '2026-06-22', 'Mexico',      'Switzerland', 'Rose Bowl, Los Angeles',            'C', '2026-06-22 19:00:00+00', null, null, 'upcoming'),
('Group C', '2026-06-22', 'England',     'Germany',     'Hard Rock Stadium, Miami',          'C', '2026-06-22 19:00:00+00', null, null, 'upcoming'),

-- Group D
('Group D', '2026-06-15', 'Portugal',    'Senegal',     'Hard Rock Stadium, Miami',          'D', '2026-06-15 13:00:00+00', 1, 0, 'finished'),
('Group D', '2026-06-15', 'Netherlands', 'Belgium',     'Lincoln Financial Field, Philadelphia', 'D', '2026-06-15 19:00:00+00', 2, 2, 'finished'),
('Group D', '2026-06-19', 'Portugal',    'Belgium',     'Levi''s Stadium, Santa Clara',      'D', '2026-06-19 16:00:00+00', null, null, 'upcoming'),
('Group D', '2026-06-19', 'Netherlands', 'Senegal',     'Mercedes-Benz Stadium, Atlanta',    'D', '2026-06-19 22:00:00+00', null, null, 'upcoming'),
('Group D', '2026-06-23', 'Senegal',     'Belgium',     'AT&T Stadium, Dallas',              'D', '2026-06-23 19:00:00+00', null, null, 'upcoming'),
('Group D', '2026-06-23', 'Portugal',    'Netherlands', 'Rose Bowl, Los Angeles',            'D', '2026-06-23 19:00:00+00', null, null, 'upcoming');
