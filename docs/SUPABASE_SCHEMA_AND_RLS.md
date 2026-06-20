# SUPABASE_SCHEMA_AND_RLS.md — Database Reference

Project: `cxklsqbtmhxapebaqrlh` (Supabase project ref)

---

## 1. Tables Overview

| Table | Purpose | Realtime |
|---|---|---|
| `profiles` | One row per auth user; extended by migrations | No |
| `matches` | Full WC 2026 schedule with live score + status | Yes (UPDATE) |
| `predictions` | User score predictions, one per user per match | No |
| `messages` | Per-match fan chat | Yes (INSERT) |
| `match_events` | Goals, cards, substitutions (ESPN-sourced) | Yes (INSERT) |
| `match_shots` | Shot coordinates for heatmap (ESPN-sourced) | No |

---

## 2. Schema Detail

### `profiles`

Created by `handle_new_user()` trigger on every `auth.users` INSERT.

```sql
CREATE TABLE public.profiles (
  id                  uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username            text        UNIQUE,
  full_name           text,
  avatar_url          text,
  favorite_team       text,
  country             text,
  onboarding_complete boolean     NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
```

- `id` mirrors `auth.users.id` — no separate surrogate key.
- `username` has a unique index (`profiles_username_idx`).
- `updated_at` is maintained by the `profiles_updated_at` trigger (calls `handle_updated_at()`).
- `onboarding_complete` gates the `OnboardingModal` — once true, it never shows again.
- `avatar_url` is present in the schema but has no upload UI (future feature).

---

### `matches`

Full 104-match WC 2026 schedule. Scores and status are written by serverless functions, never by the client.

```sql
CREATE TABLE public.matches (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  round             text        NOT NULL,          -- 'Group A', 'Round of 16', 'Final', etc.
  match_date        date        NOT NULL,           -- YYYY-MM-DD (UTC date, used for grouping)
  team1             text        NOT NULL,           -- home team (our canonical name)
  team2             text        NOT NULL,           -- away team
  venue             text,
  group_name        text,                           -- 'A'–'L' for group stage; null for knockout
  starts_at         timestamptz NOT NULL,           -- kickoff time UTC
  score1            int,                            -- null until match starts
  score2            int,
  status            text        NOT NULL DEFAULT 'upcoming'
                    CHECK (status IN ('upcoming','live','finished')),
  odds              jsonb,                          -- { home_win, draw, away_win, over_2_5? }
  odds_last_updated timestamptz,
  possession_home   int         CHECK (possession_home BETWEEN 0 AND 100)
);
```

**Important distinction**: `match_date` is a plain `date` used for schedule grouping in the UI (e.g. "Jun 20"). `starts_at` is the precise UTC kickoff timestamp used for `isLocked()`, `deriveStatus()`, and ESPN API date lookups.

**Status lifecycle**:
```
upcoming → live   (when ESPN returns IN_PROGRESS status via refresh-scores)
live → finished   (when ESPN returns FULL_TIME status via refresh-scores or update-scores)
```

The client also derives status independently via `deriveStatus()` in `utils.ts`, which treats any match past `starts_at + 2h` as finished regardless of the DB `status` column. This prevents stale `upcoming` rendering if the cron missed a game.

---

### `predictions`

```sql
CREATE TABLE public.predictions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_id    uuid NOT NULL REFERENCES public.matches(id)  ON DELETE CASCADE,
  home_score  int  NOT NULL CHECK (home_score >= 0),
  away_score  int  NOT NULL CHECK (away_score >= 0),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, match_id)
);
```

- The `UNIQUE (user_id, match_id)` constraint enables `upsert` with `onConflict: 'user_id,match_id'` — clients can update their prediction by re-submitting.
- RLS **enforces kickoff locking** at the database level (see Section 3).
- No `updated_at` column — `created_at` reflects the original prediction time; updates silently overwrite `home_score`/`away_score`.

---

### `messages`

```sql
CREATE TABLE public.messages (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id   uuid        NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  username   text,                                 -- denormalized for display speed
  content    text        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX messages_match_created_idx ON public.messages (match_id, created_at ASC);
```

- `username` is denormalized (copied from `profiles.username` at insert time by the client). This avoids a JOIN on every chat fetch and means messages retain their username even if the user later changes it.
- 500-character limit enforced by DB check constraint.
- Index on `(match_id, created_at ASC)` supports the common `ORDER BY created_at ASC LIMIT 200` query.

---

### `match_events`

```sql
CREATE TABLE public.match_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id    uuid        NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  minute      int         NOT NULL CHECK (minute >= 0),
  event_type  text        NOT NULL
              CHECK (event_type IN (
                'goal', 'own_goal', 'yellow_card', 'red_card',
                'second_yellow', 'substitution', 'var', 'penalty_missed'
              )),
  team        text        NOT NULL,
  player_name text,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX match_events_match_minute_idx ON public.match_events (match_id, minute ASC);
```

**Note**: In production, `match_events` is populated by parsing ESPN's `summary.keyEvents` API response in `api/match-live.js`, **not** by inserting into Supabase. The table exists for persistence/seeding of historical data. The client hook (`useMatchLive`) fetches from `/api/match-live` (ESPN) directly, not from this table.

---

### `match_shots`

```sql
CREATE TABLE public.match_shots (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id   uuid    NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  x          float   NOT NULL CHECK (x BETWEEN 0 AND 100),
  y          float   NOT NULL CHECK (y BETWEEN 0 AND 100),
  team       text    NOT NULL,
  on_target  boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

Same note as `match_events`: populated via seed SQL for historical matches; live shots come from ESPN via `/api/match-live`.

---

## 3. Row Level Security (RLS) Policies

All tables have `ENABLE ROW LEVEL SECURITY`. The client uses the **anon key**. Only Vercel serverless functions use the **service role key** (bypasses RLS).

### `profiles`

```sql
-- Anyone authenticated can read any profile (for usernames in chat)
CREATE POLICY "Profiles are viewable by all authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);

-- Users can only update their own row
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
```

No INSERT policy for clients — profiles are created exclusively by the `handle_new_user()` trigger using `SECURITY DEFINER`.

### `matches`

```sql
CREATE POLICY "Matches are readable by authenticated users"
  ON public.matches FOR SELECT TO authenticated USING (true);
```

No write policies for authenticated users. All writes go through the service role key in Vercel Functions.

### `predictions`

```sql
CREATE POLICY "Predictions readable by authenticated users"
  ON public.predictions FOR SELECT TO authenticated USING (true);

-- Kickoff lock: insert only before match starts
CREATE POLICY "Users insert own predictions before kickoff"
  ON public.predictions FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (SELECT starts_at FROM public.matches WHERE id = match_id) > now()
  );

-- Same kickoff lock for updates
CREATE POLICY "Users update own predictions before kickoff"
  ON public.predictions FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    AND (SELECT starts_at FROM public.matches WHERE id = match_id) > now()
  );

CREATE POLICY "Users delete own predictions"
  ON public.predictions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
```

The subquery `(SELECT starts_at FROM public.matches WHERE id = match_id) > now()` is the authoritative prediction lock. The client-side `isLocked()` check is a UX optimization only.

### `messages`

```sql
CREATE POLICY "Messages readable by authenticated users"
  ON public.messages FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users insert own messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own messages"
  ON public.messages FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
```

### `match_events` and `match_shots`

```sql
CREATE POLICY "Events readable by authenticated users"
  ON public.match_events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Shots readable by authenticated users"
  ON public.match_shots FOR SELECT TO authenticated USING (true);
```

Read-only for clients. Writes only via service role key.

---

## 4. Database Functions & Triggers

### `handle_new_user()` — Auto-create profile on signup

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

`SECURITY DEFINER` allows the trigger to bypass RLS and insert into `profiles` even though no INSERT policy exists for clients.

### `handle_updated_at()` — Auto-update timestamp

```sql
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
```

---

## 5. Realtime Configuration

Three tables are in the `supabase_realtime` publication:

| Table | Event | Subscriber | Purpose |
|---|---|---|---|
| `matches` | `UPDATE` | `useMatches` (SchedulePage) | Push score/status changes to all connected clients |
| `messages` | `INSERT` | `useChat` (MatchPage) | Push new chat messages to all clients on that match channel |
| `match_events` | `INSERT` | (Available, not currently consumed from DB) | Future: push live events without polling ESPN |

**Channel naming**:
- Matches: single channel `'matches-realtime'` with a table-level subscription (all match updates)
- Chat: per-match channel `'chat-${matchId}'` with filter `match_id=eq.${matchId}`

**Deduplication**: `useChat` checks `prev.some(m => m.id === incoming.id)` before appending — Realtime can fire for messages the current user just inserted, creating duplicates without this guard.

---

## 6. Migration History

| File | Phase | Key changes |
|---|---|---|
| `20260616000000_phase0_initial.sql` | 0 | `profiles`, `messages` (v1), RLS, `handle_new_user` trigger |
| `20260617000000_phase1_matches_chat.sql` | 1 | `profiles` add `full_name`/`country`; recreate `messages` with UUID FK; `matches`; `predictions`; Realtime for `messages`; 24-match seed |
| `20260618000000_onboarding_complete.sql` | 4 | `profiles` add `onboarding_complete boolean DEFAULT false` |
| `20260619000000_odds_columns.sql` | 5 | `matches` add `odds jsonb`, `odds_last_updated`; seed odds for all 24 group-stage matches |
| `20260620000000_phase6_full_schedule.sql` | 6 | Full 48-team, 104-match schedule; replaces 24-match seed |
| `20260621000000_phase8_events_shots.sql` | 8 | `match_events`, `match_shots`; `matches.possession_home`; seed Canada 6-0 Qatar events+shots |
| `20260622000000_reseed_group_stage_odds.sql` | — | Re-seeds odds for all 48 teams after Phase 6 schedule replace |

---

## 7. Seeding & Initial Data Strategy

- **Match schedule**: Phase 6 migration replaces the original 24-match seed with the full 104-match WC 2026 group stage + knockout bracket. Matches before the migration date are seeded as `finished` with scores.
- **Odds**: Seeded as realistic decimal odds in Phase 5 migration. Refreshed per-match when users visit match pages (if `ODDS_API_KEY` is set).
- **Events/shots**: Seeded for Canada 6-0 Qatar as a representative sample. All other finished matches get live data from ESPN when their match pages are visited.
- **Profiles**: Created automatically by trigger — no manual seeding needed.

---

## 8. Supabase Client Configuration

```typescript
// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)
```

The client is a singleton. `Database` generic provides full TypeScript type safety for all table operations.
