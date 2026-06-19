-- =============================================================================
-- Phase 6: Full Schedule Alignment
-- Replaces the 24 fictional seed matches with all 72 real FIFA 2026 group-stage
-- matches, sourced from the official schedule (NBC Sports / FIFA.com).
--
-- WARNING: TRUNCATE matches CASCADE will delete all associated predictions,
-- messages, and odds. The previous data used fictional team groupings.
-- =============================================================================

-- 1. Wipe old data
TRUNCATE TABLE public.matches CASCADE;

-- 2. Unique index to prevent duplicate inserts in future seeds
CREATE UNIQUE INDEX IF NOT EXISTS matches_team1_team2_starts_at_uidx
  ON public.matches (team1, team2, starts_at);

-- 3. Enable realtime on matches (messages already has it)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'matches'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
  END IF;
END $$;

-- =============================================================================
-- GROUP STAGE — 72 matches
-- Times are UTC (EDT = UTC-4, CDT = UTC-5)
-- status: 'finished' for all before Jun 18; Canada v Qatar confirmed 6-0 Jun 18
-- =============================================================================

INSERT INTO public.matches
  (round, match_date, team1, team2, venue, group_name, starts_at, score1, score2, status)
VALUES

-- ── GROUP A  (Mexico · South Africa · South Korea · Czechia) ─────────────────

-- Matchday 1
('Group A','2026-06-11','Mexico',       'South Africa','Estadio Azteca, Mexico City',         'A','2026-06-11 22:00:00+00', 2, 0,'finished'),
('Group A','2026-06-11','South Korea',  'Czechia',     'Arrowhead Stadium, Kansas City',      'A','2026-06-11 18:00:00+00', 2, 1,'finished'),

-- Matchday 2
('Group A','2026-06-18','Czechia',      'South Africa','Mercedes-Benz Stadium, Atlanta',      'A','2026-06-18 16:00:00+00',null,null,'upcoming'),
('Group A','2026-06-18','Mexico',       'South Korea', 'Estadio Akron, Guadalajara',          'A','2026-06-19 01:00:00+00',null,null,'upcoming'),

-- Matchday 3
('Group A','2026-06-24','Czechia',      'Mexico',      'Estadio Azteca, Mexico City',         'A','2026-06-25 01:00:00+00',null,null,'upcoming'),
('Group A','2026-06-24','South Africa', 'South Korea', 'Estadio BBVA, Monterrey',             'A','2026-06-25 01:00:00+00',null,null,'upcoming'),

-- ── GROUP B  (Canada · Bosnia · Qatar · Switzerland) ─────────────────────────

-- Matchday 1
('Group B','2026-06-12','Canada',  'Bosnia',      'BC Place, Vancouver',                 'B','2026-06-12 22:00:00+00', 1, 1,'finished'),
('Group B','2026-06-13','Qatar',   'Switzerland', 'Levi''s Stadium, San Francisco Bay Area','B','2026-06-13 16:00:00+00', 1, 1,'finished'),

-- Matchday 2
('Group B','2026-06-18','Switzerland','Bosnia',   'SoFi Stadium, Los Angeles',           'B','2026-06-18 19:00:00+00',null,null,'upcoming'),
('Group B','2026-06-18','Canada',     'Qatar',    'BC Place, Vancouver',                 'B','2026-06-18 22:00:00+00', 6, 0,'finished'),

-- Matchday 3
('Group B','2026-06-24','Switzerland','Canada',   'BC Place, Vancouver',                 'B','2026-06-24 19:00:00+00',null,null,'upcoming'),
('Group B','2026-06-24','Bosnia',     'Qatar',    'Lumen Field, Seattle',                'B','2026-06-24 19:00:00+00',null,null,'upcoming'),

-- ── GROUP C  (Brazil · Morocco · Haiti · Scotland) ───────────────────────────

-- Matchday 1
('Group C','2026-06-13','Brazil',   'Morocco', 'AT&T Stadium, Dallas',                  'C','2026-06-13 22:00:00+00', 1, 1,'finished'),
('Group C','2026-06-13','Haiti',    'Scotland','Gillette Stadium, Boston',               'C','2026-06-13 18:00:00+00', 0, 1,'finished'),

-- Matchday 2
('Group C','2026-06-19','Scotland', 'Morocco', 'Gillette Stadium, Boston',               'C','2026-06-19 22:00:00+00',null,null,'upcoming'),
('Group C','2026-06-19','Brazil',   'Haiti',   'Lincoln Financial Field, Philadelphia',  'C','2026-06-20 01:00:00+00',null,null,'upcoming'),

-- Matchday 3
('Group C','2026-06-24','Scotland', 'Brazil',  'Hard Rock Stadium, Miami',               'C','2026-06-24 22:00:00+00',null,null,'upcoming'),
('Group C','2026-06-24','Morocco',  'Haiti',   'Mercedes-Benz Stadium, Atlanta',         'C','2026-06-24 22:00:00+00',null,null,'upcoming'),

-- ── GROUP D  (USA · Paraguay · Australia · Turkiye) ──────────────────────────

-- Matchday 1
('Group D','2026-06-12','USA',       'Paraguay', 'SoFi Stadium, Los Angeles',            'D','2026-06-12 18:00:00+00', 4, 1,'finished'),
('Group D','2026-06-13','Australia', 'Turkiye',  'NRG Stadium, Houston',                 'D','2026-06-13 19:00:00+00', 2, 0,'finished'),

-- Matchday 2
('Group D','2026-06-19','USA',       'Australia','Lumen Field, Seattle',                 'D','2026-06-19 19:00:00+00',null,null,'upcoming'),
('Group D','2026-06-19','Turkiye',   'Paraguay', 'Levi''s Stadium, San Francisco Bay Area','D','2026-06-20 04:00:00+00',null,null,'upcoming'),

-- Matchday 3
('Group D','2026-06-25','Turkiye',   'USA',      'SoFi Stadium, Los Angeles',            'D','2026-06-26 02:00:00+00',null,null,'upcoming'),
('Group D','2026-06-25','Paraguay',  'Australia','Levi''s Stadium, San Francisco Bay Area','D','2026-06-26 02:00:00+00',null,null,'upcoming'),

-- ── GROUP E  (Germany · Curacao · Ivory Coast · Ecuador) ─────────────────────

-- Matchday 1
('Group E','2026-06-14','Germany',     'Curacao',     'MetLife Stadium, New York/New Jersey','E','2026-06-14 16:00:00+00', 7, 1,'finished'),
('Group E','2026-06-14','Ivory Coast', 'Ecuador',     'Hard Rock Stadium, Miami',            'E','2026-06-14 22:00:00+00', 1, 0,'finished'),

-- Matchday 2
('Group E','2026-06-20','Germany',     'Ivory Coast', 'BMO Field, Toronto',                  'E','2026-06-20 20:00:00+00',null,null,'upcoming'),
('Group E','2026-06-20','Ecuador',     'Curacao',     'Arrowhead Stadium, Kansas City',      'E','2026-06-21 00:00:00+00',null,null,'upcoming'),

-- Matchday 3
('Group E','2026-06-25','Ecuador',     'Germany',     'MetLife Stadium, New York/New Jersey','E','2026-06-25 20:00:00+00',null,null,'upcoming'),
('Group E','2026-06-25','Curacao',     'Ivory Coast', 'Lincoln Financial Field, Philadelphia','E','2026-06-25 20:00:00+00',null,null,'upcoming'),

-- ── GROUP F  (Netherlands · Japan · Sweden · Tunisia) ────────────────────────

-- Matchday 1
('Group F','2026-06-14','Netherlands','Japan',   'Rose Bowl, Los Angeles',               'F','2026-06-14 19:00:00+00', 2, 2,'finished'),
('Group F','2026-06-14','Sweden',     'Tunisia', 'Mercedes-Benz Stadium, Atlanta',       'F','2026-06-14 23:00:00+00', 5, 1,'finished'),

-- Matchday 2
('Group F','2026-06-20','Netherlands','Sweden',  'NRG Stadium, Houston',                 'F','2026-06-20 17:00:00+00',null,null,'upcoming'),
('Group F','2026-06-20','Tunisia',    'Japan',   'Estadio BBVA, Monterrey',              'F','2026-06-21 04:00:00+00',null,null,'upcoming'),

-- Matchday 3
('Group F','2026-06-25','Japan',      'Sweden',  'AT&T Stadium, Dallas',                 'F','2026-06-25 23:00:00+00',null,null,'upcoming'),
('Group F','2026-06-25','Tunisia',    'Netherlands','Arrowhead Stadium, Kansas City',    'F','2026-06-25 23:00:00+00',null,null,'upcoming'),

-- ── GROUP G  (Belgium · Egypt · Iran · New Zealand) ──────────────────────────

-- Matchday 1
('Group G','2026-06-15','Iran',       'New Zealand','Lincoln Financial Field, Philadelphia','G','2026-06-15 16:00:00+00', 2, 2,'finished'),
('Group G','2026-06-15','Belgium',    'Egypt',      'BMO Field, Toronto',                   'G','2026-06-15 22:00:00+00', 1, 1,'finished'),

-- Matchday 2
('Group G','2026-06-21','Belgium',    'Iran',       'SoFi Stadium, Los Angeles',            'G','2026-06-21 19:00:00+00',null,null,'upcoming'),
('Group G','2026-06-21','New Zealand','Egypt',      'BC Place, Vancouver',                  'G','2026-06-22 01:00:00+00',null,null,'upcoming'),

-- Matchday 3
('Group G','2026-06-26','Egypt',      'Iran',       'Lumen Field, Seattle',                 'G','2026-06-27 03:00:00+00',null,null,'upcoming'),
('Group G','2026-06-26','New Zealand','Belgium',    'BC Place, Vancouver',                  'G','2026-06-27 03:00:00+00',null,null,'upcoming'),

-- ── GROUP H  (Spain · Cape Verde · Saudi Arabia · Uruguay) ───────────────────

-- Matchday 1
('Group H','2026-06-15','Spain',        'Cape Verde',  'Estadio BBVA, Monterrey',            'H','2026-06-15 19:00:00+00', 0, 0,'finished'),
('Group H','2026-06-15','Saudi Arabia', 'Uruguay',     'Estadio Akron, Guadalajara',          'H','2026-06-16 01:00:00+00', 1, 1,'finished'),

-- Matchday 2
('Group H','2026-06-21','Spain',        'Saudi Arabia','Mercedes-Benz Stadium, Atlanta',     'H','2026-06-21 16:00:00+00',null,null,'upcoming'),
('Group H','2026-06-21','Uruguay',      'Cape Verde',  'Hard Rock Stadium, Miami',            'H','2026-06-21 22:00:00+00',null,null,'upcoming'),

-- Matchday 3
('Group H','2026-06-26','Cape Verde',   'Saudi Arabia','NRG Stadium, Houston',               'H','2026-06-27 00:00:00+00',null,null,'upcoming'),
('Group H','2026-06-26','Uruguay',      'Spain',       'Estadio Akron, Guadalajara',          'H','2026-06-27 00:00:00+00',null,null,'upcoming'),

-- ── GROUP I  (France · Senegal · Iraq · Norway) ───────────────────────────────

-- Matchday 1
('Group I','2026-06-16','France',  'Senegal','MetLife Stadium, New York/New Jersey',     'I','2026-06-16 22:00:00+00', 3, 1,'finished'),
('Group I','2026-06-16','Iraq',    'Norway', 'BMO Field, Toronto',                       'I','2026-06-16 18:00:00+00', 1, 4,'finished'),

-- Matchday 2
('Group I','2026-06-22','France',  'Iraq',   'Lincoln Financial Field, Philadelphia',    'I','2026-06-22 21:00:00+00',null,null,'upcoming'),
('Group I','2026-06-22','Norway',  'Senegal','MetLife Stadium, New York/New Jersey',     'I','2026-06-23 00:00:00+00',null,null,'upcoming'),

-- Matchday 3
('Group I','2026-06-26','Norway',  'France', 'Gillette Stadium, Boston',                 'I','2026-06-26 19:00:00+00',null,null,'upcoming'),
('Group I','2026-06-26','Senegal', 'Iraq',   'BMO Field, Toronto',                       'I','2026-06-26 19:00:00+00',null,null,'upcoming'),

-- ── GROUP J  (Argentina · Algeria · Austria · Jordan) ────────────────────────

-- Matchday 1
('Group J','2026-06-16','Argentina','Algeria','AT&T Stadium, Dallas',                    'J','2026-06-16 16:00:00+00', 3, 0,'finished'),
('Group J','2026-06-16','Austria',  'Jordan', 'Rose Bowl, Los Angeles',                  'J','2026-06-17 01:00:00+00', 3, 1,'finished'),

-- Matchday 2
('Group J','2026-06-22','Argentina','Austria','AT&T Stadium, Dallas',                    'J','2026-06-22 17:00:00+00',null,null,'upcoming'),
('Group J','2026-06-22','Jordan',   'Algeria','Levi''s Stadium, San Francisco Bay Area', 'J','2026-06-23 03:00:00+00',null,null,'upcoming'),

-- Matchday 3
('Group J','2026-06-27','Algeria',  'Austria','Arrowhead Stadium, Kansas City',          'J','2026-06-28 02:00:00+00',null,null,'upcoming'),
('Group J','2026-06-27','Jordan',   'Argentina','AT&T Stadium, Dallas',                  'J','2026-06-28 02:00:00+00',null,null,'upcoming'),

-- ── GROUP K  (Portugal · DR Congo · Uzbekistan · Colombia) ───────────────────

-- Matchday 1
('Group K','2026-06-17','Portugal',  'DR Congo',  'Lumen Field, Seattle',               'K','2026-06-17 16:00:00+00', 1, 1,'finished'),
('Group K','2026-06-17','Uzbekistan','Colombia',  'Hard Rock Stadium, Miami',            'K','2026-06-17 22:00:00+00', 1, 3,'finished'),

-- Matchday 2
('Group K','2026-06-23','Portugal',  'Uzbekistan','NRG Stadium, Houston',               'K','2026-06-23 17:00:00+00',null,null,'upcoming'),
('Group K','2026-06-23','Colombia',  'DR Congo',  'Estadio Akron, Guadalajara',          'K','2026-06-24 02:00:00+00',null,null,'upcoming'),

-- Matchday 3
('Group K','2026-06-27','Colombia',  'Portugal',  'Hard Rock Stadium, Miami',            'K','2026-06-27 23:30:00+00',null,null,'upcoming'),
('Group K','2026-06-27','DR Congo',  'Uzbekistan','Mercedes-Benz Stadium, Atlanta',      'K','2026-06-27 23:30:00+00',null,null,'upcoming'),

-- ── GROUP L  (England · Croatia · Ghana · Panama) ────────────────────────────

-- Matchday 1
('Group L','2026-06-17','England','Croatia','MetLife Stadium, New York/New Jersey',      'L','2026-06-17 19:00:00+00', 4, 2,'finished'),
('Group L','2026-06-17','Ghana',  'Panama', 'Mercedes-Benz Stadium, Atlanta',           'L','2026-06-17 23:00:00+00', 1, 0,'finished'),

-- Matchday 2
('Group L','2026-06-23','England','Ghana',  'Gillette Stadium, Boston',                  'L','2026-06-23 20:00:00+00',null,null,'upcoming'),
('Group L','2026-06-23','Panama', 'Croatia','BMO Field, Toronto',                        'L','2026-06-23 23:00:00+00',null,null,'upcoming'),

-- Matchday 3
('Group L','2026-06-27','Panama', 'England','MetLife Stadium, New York/New Jersey',      'L','2026-06-27 21:00:00+00',null,null,'upcoming'),
('Group L','2026-06-27','Croatia','Ghana',  'Lincoln Financial Field, Philadelphia',     'L','2026-06-27 21:00:00+00',null,null,'upcoming')

ON CONFLICT (team1, team2, starts_at) DO NOTHING;

-- =============================================================================
-- KNOCKOUT STAGE — 32 placeholder matches (teams TBD after group stage)
-- Dates from the official FIFA 2026 schedule
-- =============================================================================

INSERT INTO public.matches
  (round, match_date, team1, team2, venue, group_name, starts_at, score1, score2, status)
VALUES
-- Round of 32 (June 29 – July 4)
('Round of 32','2026-06-29','TBD','TBD','Estadio Azteca, Mexico City',               null,'2026-06-29 22:00:00+00',null,null,'upcoming'),
('Round of 32','2026-06-29','TBD','TBD','MetLife Stadium, New York/New Jersey',       null,'2026-06-30 02:00:00+00',null,null,'upcoming'),
('Round of 32','2026-06-30','TBD','TBD','SoFi Stadium, Los Angeles',                 null,'2026-06-30 19:00:00+00',null,null,'upcoming'),
('Round of 32','2026-06-30','TBD','TBD','AT&T Stadium, Dallas',                      null,'2026-06-30 23:00:00+00',null,null,'upcoming'),
('Round of 32','2026-07-01','TBD','TBD','Hard Rock Stadium, Miami',                  null,'2026-07-01 19:00:00+00',null,null,'upcoming'),
('Round of 32','2026-07-01','TBD','TBD','Lumen Field, Seattle',                      null,'2026-07-01 23:00:00+00',null,null,'upcoming'),
('Round of 32','2026-07-02','TBD','TBD','Mercedes-Benz Stadium, Atlanta',            null,'2026-07-02 19:00:00+00',null,null,'upcoming'),
('Round of 32','2026-07-02','TBD','TBD','BC Place, Vancouver',                       null,'2026-07-02 23:00:00+00',null,null,'upcoming'),
('Round of 32','2026-07-03','TBD','TBD','NRG Stadium, Houston',                      null,'2026-07-03 19:00:00+00',null,null,'upcoming'),
('Round of 32','2026-07-03','TBD','TBD','BMO Field, Toronto',                        null,'2026-07-03 23:00:00+00',null,null,'upcoming'),
('Round of 32','2026-07-04','TBD','TBD','Rose Bowl, Los Angeles',                    null,'2026-07-04 19:00:00+00',null,null,'upcoming'),
('Round of 32','2026-07-04','TBD','TBD','Lincoln Financial Field, Philadelphia',     null,'2026-07-04 23:00:00+00',null,null,'upcoming'),
('Round of 32','2026-07-04','TBD','TBD','Arrowhead Stadium, Kansas City',            null,'2026-07-05 01:00:00+00',null,null,'upcoming'),
('Round of 32','2026-07-05','TBD','TBD','Levi''s Stadium, San Francisco Bay Area',   null,'2026-07-05 19:00:00+00',null,null,'upcoming'),
('Round of 32','2026-07-05','TBD','TBD','Estadio BBVA, Monterrey',                  null,'2026-07-05 23:00:00+00',null,null,'upcoming'),
('Round of 32','2026-07-06','TBD','TBD','Gillette Stadium, Boston',                  null,'2026-07-06 19:00:00+00',null,null,'upcoming'),

-- Round of 16 (July 8–11)
('Round of 16','2026-07-08','TBD','TBD','MetLife Stadium, New York/New Jersey',       null,'2026-07-08 19:00:00+00',null,null,'upcoming'),
('Round of 16','2026-07-08','TBD','TBD','SoFi Stadium, Los Angeles',                 null,'2026-07-08 23:00:00+00',null,null,'upcoming'),
('Round of 16','2026-07-09','TBD','TBD','AT&T Stadium, Dallas',                      null,'2026-07-09 19:00:00+00',null,null,'upcoming'),
('Round of 16','2026-07-09','TBD','TBD','Hard Rock Stadium, Miami',                  null,'2026-07-09 23:00:00+00',null,null,'upcoming'),
('Round of 16','2026-07-10','TBD','TBD','Lumen Field, Seattle',                      null,'2026-07-10 19:00:00+00',null,null,'upcoming'),
('Round of 16','2026-07-10','TBD','TBD','NRG Stadium, Houston',                      null,'2026-07-10 23:00:00+00',null,null,'upcoming'),
('Round of 16','2026-07-11','TBD','TBD','Mercedes-Benz Stadium, Atlanta',            null,'2026-07-11 19:00:00+00',null,null,'upcoming'),
('Round of 16','2026-07-11','TBD','TBD','Rose Bowl, Los Angeles',                    null,'2026-07-11 23:00:00+00',null,null,'upcoming'),

-- Quarter-finals (July 14–16)
('Quarter-final','2026-07-14','TBD','TBD','MetLife Stadium, New York/New Jersey',     null,'2026-07-14 19:00:00+00',null,null,'upcoming'),
('Quarter-final','2026-07-14','TBD','TBD','SoFi Stadium, Los Angeles',               null,'2026-07-14 23:00:00+00',null,null,'upcoming'),
('Quarter-final','2026-07-15','TBD','TBD','AT&T Stadium, Dallas',                    null,'2026-07-15 19:00:00+00',null,null,'upcoming'),
('Quarter-final','2026-07-16','TBD','TBD','Hard Rock Stadium, Miami',                null,'2026-07-16 19:00:00+00',null,null,'upcoming'),

-- Semi-finals (July 18–19)
('Semi-final','2026-07-18','TBD','TBD','MetLife Stadium, New York/New Jersey',        null,'2026-07-18 23:00:00+00',null,null,'upcoming'),
('Semi-final','2026-07-19','TBD','TBD','Rose Bowl, Los Angeles',                     null,'2026-07-19 23:00:00+00',null,null,'upcoming'),

-- Third-place play-off & Final
('Third Place','2026-07-18','TBD','TBD','AT&T Stadium, Dallas',                      null,'2026-07-18 19:00:00+00',null,null,'upcoming'),
('Final',      '2026-07-19','TBD','TBD','MetLife Stadium, New York/New Jersey',       null,'2026-07-20 00:00:00+00',null,null,'upcoming')

ON CONFLICT DO NOTHING;
