-- =============================================================================
-- World Cup Companion — Phase 8 Schema
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. match_events — goals, cards, substitutions, VAR decisions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.match_events (
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

CREATE INDEX IF NOT EXISTS match_events_match_minute_idx
  ON public.match_events (match_id, minute ASC);

ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events readable by authenticated users"
  ON public.match_events FOR SELECT TO authenticated USING (true);

-- Enable realtime so live matches push events to clients instantly
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'match_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.match_events;
  END IF;
END $$;


-- ---------------------------------------------------------------------------
-- 2. possession_home — nullable % column on matches (0–100)
--    NULL = not tracked / hidden; any value shows the possession bar
-- ---------------------------------------------------------------------------
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS possession_home int
  CHECK (possession_home BETWEEN 0 AND 100);


-- ---------------------------------------------------------------------------
-- 3. match_shots — shot coordinates for finished matches
--    x/y are percentage of pitch (0–100). Origin = top-left.
--    Shots should have y < 50 (attacking half from the shooting team's POV).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.match_shots (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id   uuid    NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  x          float   NOT NULL CHECK (x BETWEEN 0 AND 100),
  y          float   NOT NULL CHECK (y BETWEEN 0 AND 100),
  team       text    NOT NULL,
  on_target  boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS match_shots_match_idx
  ON public.match_shots (match_id);

ALTER TABLE public.match_shots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shots readable by authenticated users"
  ON public.match_shots FOR SELECT TO authenticated USING (true);


-- ---------------------------------------------------------------------------
-- 4. Seed — match_events and match_shots for already-finished matches
--
--    The Phase 6 migration set several matches to status='finished'.
--    We seed plausible events + shots so the UI has something to show
--    on day one without needing a live stats feed.
--
--    Finished matches confirmed in Phase 6 seed (as of 2026-06-18):
--      Canada 6–0 Qatar  (Group B, 2026-06-18 — first match Canada hosted)
--    And many earlier matches from the Phase 6 data.
--    We seed events for a representative sample below.
--    Additional matches can be seeded by repeating the INSERT pattern.
-- ---------------------------------------------------------------------------

-- Helper: resolve a match UUID by team names + date so the seed is portable
-- (avoids hardcoding UUIDs that differ per environment).

DO $$
DECLARE
  v_match_id uuid;
BEGIN

  -- ── Canada 6–0 Qatar (Group B, Jun 18) ────────────────────────────────────
  SELECT id INTO v_match_id FROM public.matches
  WHERE team1 = 'Canada' AND team2 = 'Qatar'
  LIMIT 1;

  IF v_match_id IS NOT NULL THEN
    INSERT INTO public.match_events
      (match_id, minute, event_type, team, player_name, description)
    VALUES
      (v_match_id,  8, 'goal',        'Canada', 'Jonathan David',   'Header from corner'),
      (v_match_id, 23, 'goal',        'Canada', 'Alphonso Davies',  'Low drive, near post'),
      (v_match_id, 34, 'yellow_card', 'Qatar',  'Assim Madibo',     'Late tackle'),
      (v_match_id, 41, 'goal',        'Canada', 'Jonathan David',   'Penalty — brace'),
      (v_match_id, 55, 'goal',        'Canada', 'Tajon Buchanan',   'Counter-attack'),
      (v_match_id, 63, 'substitution','Canada', 'Cyle Larin',       'on for Jonathan David'),
      (v_match_id, 71, 'goal',        'Canada', 'Liam Millar',      'Chip over keeper'),
      (v_match_id, 82, 'red_card',    'Qatar',  'Pedro Miguel',     'Second yellow'),
      (v_match_id, 89, 'goal',        'Canada', 'Cyle Larin',       'Tap-in from close range')
    ON CONFLICT DO NOTHING;

    UPDATE public.matches SET possession_home = 64 WHERE id = v_match_id;

    INSERT INTO public.match_shots
      (match_id, x, y, team, on_target)
    VALUES
      -- Canada shots (team1 = home, attacking right → left in SVG, y < 50)
      (v_match_id, 52, 12, 'Canada', true),
      (v_match_id, 48, 8,  'Canada', true),
      (v_match_id, 60, 18, 'Canada', true),
      (v_match_id, 55, 10, 'Canada', true),
      (v_match_id, 45, 15, 'Canada', true),
      (v_match_id, 50, 20, 'Canada', true),
      (v_match_id, 62, 22, 'Canada', false),
      (v_match_id, 38, 25, 'Canada', false),
      (v_match_id, 70, 30, 'Canada', false),
      (v_match_id, 44, 35, 'Canada', false),
      (v_match_id, 58, 28, 'Canada', false),
      (v_match_id, 65, 14, 'Canada', false),
      -- Qatar shots
      (v_match_id, 52, 88, 'Qatar',  true),
      (v_match_id, 48, 82, 'Qatar',  false),
      (v_match_id, 56, 75, 'Qatar',  false)
    ON CONFLICT DO NOTHING;
  END IF;

END $$;
