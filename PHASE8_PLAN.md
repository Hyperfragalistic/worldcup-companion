# Phase 8 Implementation Plan

## Current state (end of Phase 7)

| Item | Detail |
|------|--------|
| Routes | `/` (SchedulePage), `/match/:id` (MatchPage), `/profile` (ProfilePage) |
| Supabase tables | `profiles`, `messages`, `matches` (104 rows), `predictions` |
| API routes | `api/odds.js` (Vercel serverless, proxies The Odds API) |
| Auth | Magic-link, persistent session, auto-profile on signup |
| Realtime | `matches` + `messages` tables in `supabase_realtime` publication |

---

## Feature 1 — Team Roster Deep-Dive (Priority 1)

### Data source
**Hybrid: static TypeScript file + TheSportsDB headshots + Wikipedia links.**

- `src/data/rosters.ts` — static squad data for all 48 WC 2026 teams.
  No API, no quota, no downtime risk. Each player record:
  `{ name, number, position, club, caps?, goals? }`.
- **Headshots**: fetched lazily from TheSportsDB free search endpoint
  (`https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p={name}`)
  when a player card is opened. Result cached in component state.
  Falls back gracefully to a flag-emoji initial avatar — demo always works
  even if the network call fails.
- **"More info" link**: Wikipedia deep-link constructed from player name
  (`https://en.wikipedia.org/wiki/First_Last`). Opens in new tab.
  Works without any stored IDs for ~95 % of WC roster players.
- **In-app card design**: bottom-sheet modal styled like a tournament card
  (position badge, flag, headshot/avatar, club, caps, goals). Fully
  Tailwind — no external card dependency.

### New files
```
src/data/rosters.ts          Static squad data for all 48 WC 2026 teams
src/pages/TeamPage.tsx        Roster page — squad list grouped by position
```

### Updated files
```
src/App.tsx                  Add route: /team/:teamName
src/pages/MatchPage.tsx      Team flag + name in match hero → link to /team/:teamName
src/components/MatchCard.tsx  "View squad" link in expanded panel
```

### Route
`/team/:teamName` — teamName is the plain-text team name used throughout the app
(e.g. "Canada", "South Korea"). No slug mapping needed; names are already
consistent across `matches` rows, `WC_TEAM_BY_COUNTRY`, and `FLAGS`.

### Navigation entry points
1. MatchPage hero: flag + team name becomes a tappable link
2. MatchCard expanded panel: small "Squad →" link alongside "Chat" and "Predict"

---

## Feature 2 — Live Match Enhancements (Priority 2)

### Sub-features
| Sub-feature | Implementation |
|-------------|---------------|
| Live elapsed timer | Client-side: `Date.now() - starts_at` in a 1-second interval. Shown only when `deriveStatus() === 'live'`. Stops at 90′ (extra time shown as `90+N`). |
| Match events timeline | New Supabase table `match_events`. Realtime subscription for live matches; simple list for finished. |
| Animated possession bar | Two `match_events` rows with `event_type = 'possession_snapshot'` are NOT used. Instead, a `possession_home` INT column (0–100) is added to the `matches` table. Shown when non-null. Animated fill with CSS transition. |

### New Supabase migration — `20260621000000_phase8_events_shots.sql`

```sql
-- match_events: goals, cards, subs, etc.
CREATE TABLE public.match_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id    uuid        NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  minute      int         NOT NULL,
  event_type  text        NOT NULL
              CHECK (event_type IN ('goal','yellow_card','red_card',
                                   'substitution','var','penalty_missed')),
  team        text        NOT NULL,
  player_name text,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX match_events_match_minute_idx ON public.match_events (match_id, minute);
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events readable by authenticated users"
  ON public.match_events FOR SELECT TO authenticated USING (true);

-- possession column on matches
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS possession_home int CHECK (possession_home BETWEEN 0 AND 100);

-- match_shots: for heatmap
CREATE TABLE public.match_shots (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id   uuid    NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  x          float   NOT NULL CHECK (x BETWEEN 0 AND 100),
  y          float   NOT NULL CHECK (y BETWEEN 0 AND 100),
  team       text    NOT NULL,
  on_target  boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX match_shots_match_idx ON public.match_shots (match_id);
ALTER TABLE public.match_shots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shots readable by authenticated users"
  ON public.match_shots FOR SELECT TO authenticated USING (true);

-- Enable realtime on match_events
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_events;
```

### New files
```
src/components/LiveTimer.tsx     Elapsed clock (mm:ss), 1-second tick via useEffect
src/components/MatchTimeline.tsx Events list: icon + minute + player name + description
src/components/PossessionBar.tsx Animated dual-fill bar; receives possessionHome: number | null
src/hooks/useMatchEvents.ts      Fetches + Realtime-subscribes to match_events for a matchId
```

### Updated files
```
src/pages/MatchPage.tsx          Integrate the three new components above ShotHeatmap
src/lib/database.types.ts        Add match_events and match_shots row types;
                                  add possession_home to matches.Row
```

---

## Feature 3 — Shot Heatmap (Priority 3)

### Data source
Supabase `match_shots` table, seeded with realistic coordinates for all
finished matches via the same migration seed script as match_events.
Coordinates are `(x, y)` as percentage of pitch (0–100), origin = top-left
of the full pitch, so shots appear in the attacking half (y < 50).

### New files
```
src/components/ShotHeatmap.tsx   SVG component: full-pitch outline, goal, penalty arc,
                                  circles per shot (filled = on-target, ring = off-target),
                                  colour-coded by team (wc-gold vs white/10)
src/hooks/useMatchShots.ts       Fetches match_shots for a matchId from Supabase
```

### Updated files
```
src/pages/MatchPage.tsx          Render <ShotHeatmap> below the chat section for
                                  finished matches only
```

---

## Feature 4 — News Ticker (Priority 4)

### Data source
**BBC Sport Football RSS** — `https://feeds.bbci.co.uk/sport/football/rss.xml`  
No API key required. Filtered client-side for World Cup / FIFA keywords.
Fetched server-side via a Vercel serverless function to avoid CORS.

Falls back to 5 static headlines if the feed is unavailable.

### New files
```
api/news.js                      Vercel serverless: fetches BBC RSS, parses XML,
                                  returns top 5 WC-relevant items as JSON
src/components/NewsTicker.tsx    Horizontal marquee using CSS animation (no library);
                                  auto-refreshes every 10 minutes
src/hooks/useNews.ts             Fetches /api/news, exposes { headlines, loading, error, refresh }
```

### Updated files
```
src/components/Layout.tsx        Mount <NewsTicker> above <main> as a thin sticky bar
```

---

## New route summary

| Route | Component | Entry points |
|-------|-----------|--------------|
| `/team/:teamName` | `TeamPage` | MatchPage hero flags, MatchCard "Squad →" |

---

## Step order

| Step | Work | Commit message |
|------|------|----------------|
| 1 | This plan file | `docs: Phase 8 plan` |
| 2 | Migration SQL + `database.types.ts` update | `feat(db): add match_events, match_shots, possession_home` |
| 3 | `rosters.ts` data + `TeamPage` + route | `feat: team roster deep-dive page (/team/:teamName)` |
| 4 | `LiveTimer`, `MatchTimeline`, `PossessionBar`, `useMatchEvents` | `feat: live match enhancements — timer, events, possession bar` |
| 5 | `ShotHeatmap`, `useMatchShots` | `feat: post-match shot heatmap` |
| 6 | `api/news.js`, `NewsTicker`, `useNews`, Layout wiring | `feat: news ticker — BBC Sport RSS via serverless proxy` |
| 7 | Navigation links, polish, README update | `feat(phase8): integration polish and README` |

---

## Constraints / known limits

- **No external football API**: Roster data is static; events + shots are seeded,
  not from a live stats provider. Sufficient for demo; swap in API-Football
  endpoints later by changing the hooks' fetch calls.
- **BBC RSS**: `<item>` elements may not always mention "World Cup" — filter is
  best-effort. Static fallback ensures the ticker always shows something.
- **`possession_home`**: Must be set manually (admin SQL or Supabase dashboard)
  for live matches. Component gracefully hides when null.
- **Heatmap shots**: Seeded coordinates are realistic distributions, not real
  shot-tracking data. Clearly labelled as illustrative in the UI.
