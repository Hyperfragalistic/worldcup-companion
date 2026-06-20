-- =============================================================================
-- Re-seed realistic pre-match decimal odds for all 72 WC 2026 group-stage
-- matches. The Phase 5 odds seed targeted hardcoded UUIDs that were wiped
-- by the Phase 6 TRUNCATE, so every match currently has odds = null.
--
-- Uses team1 + team2 matching (no UUID dependency) so it is safe to re-run.
-- Odds are European decimal format: { home_win, draw, away_win, over_2_5 }.
-- Values reflect pre-tournament form / FIFA rankings.
-- =============================================================================

-- ── GROUP A  (Mexico · South Africa · South Korea · Czechia) ─────────────────
UPDATE public.matches SET odds = '{"home_win":1.70,"draw":3.50,"away_win":5.00,"over_2_5":1.80}', odds_last_updated = now()
  WHERE team1 = 'Mexico'       AND team2 = 'South Africa';
UPDATE public.matches SET odds = '{"home_win":2.20,"draw":3.20,"away_win":3.30,"over_2_5":1.88}', odds_last_updated = now()
  WHERE team1 = 'South Korea'  AND team2 = 'Czechia';
UPDATE public.matches SET odds = '{"home_win":1.85,"draw":3.30,"away_win":4.20,"over_2_5":1.82}', odds_last_updated = now()
  WHERE team1 = 'Czechia'      AND team2 = 'South Africa';
UPDATE public.matches SET odds = '{"home_win":2.10,"draw":3.25,"away_win":3.40,"over_2_5":1.85}', odds_last_updated = now()
  WHERE team1 = 'Mexico'       AND team2 = 'South Korea';
UPDATE public.matches SET odds = '{"home_win":2.00,"draw":3.30,"away_win":3.75,"over_2_5":1.90}', odds_last_updated = now()
  WHERE team1 = 'Czechia'      AND team2 = 'Mexico';
UPDATE public.matches SET odds = '{"home_win":2.50,"draw":3.20,"away_win":2.75,"over_2_5":1.88}', odds_last_updated = now()
  WHERE team1 = 'South Africa' AND team2 = 'South Korea';

-- ── GROUP B  (Canada · Bosnia · Qatar · Switzerland) ─────────────────────────
UPDATE public.matches SET odds = '{"home_win":2.30,"draw":3.20,"away_win":3.10,"over_2_5":1.85}', odds_last_updated = now()
  WHERE team1 = 'Canada'       AND team2 = 'Bosnia';
UPDATE public.matches SET odds = '{"home_win":4.00,"draw":3.50,"away_win":1.85,"over_2_5":1.80}', odds_last_updated = now()
  WHERE team1 = 'Qatar'        AND team2 = 'Switzerland';
UPDATE public.matches SET odds = '{"home_win":1.90,"draw":3.40,"away_win":4.00,"over_2_5":1.82}', odds_last_updated = now()
  WHERE team1 = 'Switzerland'  AND team2 = 'Bosnia';
UPDATE public.matches SET odds = '{"home_win":1.40,"draw":4.50,"away_win":8.00,"over_2_5":1.75}', odds_last_updated = now()
  WHERE team1 = 'Canada'       AND team2 = 'Qatar';
UPDATE public.matches SET odds = '{"home_win":2.40,"draw":3.20,"away_win":3.00,"over_2_5":1.88}', odds_last_updated = now()
  WHERE team1 = 'Switzerland'  AND team2 = 'Canada';
UPDATE public.matches SET odds = '{"home_win":1.75,"draw":3.40,"away_win":4.50,"over_2_5":1.80}', odds_last_updated = now()
  WHERE team1 = 'Bosnia'       AND team2 = 'Qatar';

-- ── GROUP C  (Brazil · Morocco · Haiti · Scotland) ───────────────────────────
UPDATE public.matches SET odds = '{"home_win":1.50,"draw":4.00,"away_win":7.00,"over_2_5":1.78}', odds_last_updated = now()
  WHERE team1 = 'Brazil'       AND team2 = 'Morocco';
UPDATE public.matches SET odds = '{"home_win":5.00,"draw":3.50,"away_win":1.65,"over_2_5":1.85}', odds_last_updated = now()
  WHERE team1 = 'Haiti'        AND team2 = 'Scotland';
UPDATE public.matches SET odds = '{"home_win":2.60,"draw":3.10,"away_win":2.80,"over_2_5":2.00}', odds_last_updated = now()
  WHERE team1 = 'Scotland'     AND team2 = 'Morocco';
UPDATE public.matches SET odds = '{"home_win":1.20,"draw":7.00,"away_win":15.00,"over_2_5":1.65}', odds_last_updated = now()
  WHERE team1 = 'Brazil'       AND team2 = 'Haiti';
UPDATE public.matches SET odds = '{"home_win":10.00,"draw":5.50,"away_win":1.30,"over_2_5":1.75}', odds_last_updated = now()
  WHERE team1 = 'Scotland'     AND team2 = 'Brazil';
UPDATE public.matches SET odds = '{"home_win":1.35,"draw":4.80,"away_win":8.50,"over_2_5":1.72}', odds_last_updated = now()
  WHERE team1 = 'Morocco'      AND team2 = 'Haiti';

-- ── GROUP D  (USA · Paraguay · Australia · Turkiye) ──────────────────────────
UPDATE public.matches SET odds = '{"home_win":1.65,"draw":3.60,"away_win":5.50,"over_2_5":1.85}', odds_last_updated = now()
  WHERE team1 = 'USA'          AND team2 = 'Paraguay';
UPDATE public.matches SET odds = '{"home_win":2.30,"draw":3.20,"away_win":3.10,"over_2_5":1.90}', odds_last_updated = now()
  WHERE team1 = 'Australia'    AND team2 = 'Turkiye';
UPDATE public.matches SET odds = '{"home_win":1.75,"draw":3.50,"away_win":4.80,"over_2_5":1.88}', odds_last_updated = now()
  WHERE team1 = 'USA'          AND team2 = 'Australia';
UPDATE public.matches SET odds = '{"home_win":2.20,"draw":3.20,"away_win":3.40,"over_2_5":1.85}', odds_last_updated = now()
  WHERE team1 = 'Turkiye'      AND team2 = 'Paraguay';
UPDATE public.matches SET odds = '{"home_win":3.50,"draw":3.30,"away_win":2.10,"over_2_5":1.88}', odds_last_updated = now()
  WHERE team1 = 'Turkiye'      AND team2 = 'USA';
UPDATE public.matches SET odds = '{"home_win":2.60,"draw":3.20,"away_win":2.80,"over_2_5":1.82}', odds_last_updated = now()
  WHERE team1 = 'Paraguay'     AND team2 = 'Australia';

-- ── GROUP E  (Germany · Curacao · Ivory Coast · Ecuador) ─────────────────────
UPDATE public.matches SET odds = '{"home_win":1.10,"draw":10.00,"away_win":25.00,"over_2_5":1.55}', odds_last_updated = now()
  WHERE team1 = 'Germany'      AND team2 = 'Curacao';
UPDATE public.matches SET odds = '{"home_win":2.50,"draw":3.20,"away_win":2.80,"over_2_5":1.90}', odds_last_updated = now()
  WHERE team1 = 'Ivory Coast'  AND team2 = 'Ecuador';
UPDATE public.matches SET odds = '{"home_win":1.55,"draw":3.80,"away_win":6.00,"over_2_5":1.82}', odds_last_updated = now()
  WHERE team1 = 'Germany'      AND team2 = 'Ivory Coast';
UPDATE public.matches SET odds = '{"home_win":1.50,"draw":3.90,"away_win":6.50,"over_2_5":1.78}', odds_last_updated = now()
  WHERE team1 = 'Ecuador'      AND team2 = 'Curacao';
UPDATE public.matches SET odds = '{"home_win":7.00,"draw":4.50,"away_win":1.45,"over_2_5":1.80}', odds_last_updated = now()
  WHERE team1 = 'Ecuador'      AND team2 = 'Germany';
UPDATE public.matches SET odds = '{"home_win":6.00,"draw":4.20,"away_win":1.55,"over_2_5":1.78}', odds_last_updated = now()
  WHERE team1 = 'Curacao'      AND team2 = 'Ivory Coast';

-- ── GROUP F  (Netherlands · Japan · Sweden · Tunisia) ────────────────────────
UPDATE public.matches SET odds = '{"home_win":1.70,"draw":3.60,"away_win":5.00,"over_2_5":1.85}', odds_last_updated = now()
  WHERE team1 = 'Netherlands'  AND team2 = 'Japan';
UPDATE public.matches SET odds = '{"home_win":1.55,"draw":3.80,"away_win":6.00,"over_2_5":1.80}', odds_last_updated = now()
  WHERE team1 = 'Sweden'       AND team2 = 'Tunisia';
UPDATE public.matches SET odds = '{"home_win":1.65,"draw":3.60,"away_win":5.50,"over_2_5":1.88}', odds_last_updated = now()
  WHERE team1 = 'Netherlands'  AND team2 = 'Sweden';
UPDATE public.matches SET odds = '{"home_win":3.40,"draw":3.20,"away_win":2.15,"over_2_5":1.85}', odds_last_updated = now()
  WHERE team1 = 'Tunisia'      AND team2 = 'Japan';
UPDATE public.matches SET odds = '{"home_win":2.70,"draw":3.20,"away_win":2.60,"over_2_5":1.88}', odds_last_updated = now()
  WHERE team1 = 'Japan'        AND team2 = 'Sweden';
UPDATE public.matches SET odds = '{"home_win":7.50,"draw":4.50,"away_win":1.45,"over_2_5":1.80}', odds_last_updated = now()
  WHERE team1 = 'Tunisia'      AND team2 = 'Netherlands';

-- ── GROUP G  (Belgium · Egypt · Iran · New Zealand) ──────────────────────────
UPDATE public.matches SET odds = '{"home_win":2.10,"draw":3.20,"away_win":3.60,"over_2_5":1.88}', odds_last_updated = now()
  WHERE team1 = 'Iran'         AND team2 = 'New Zealand';
UPDATE public.matches SET odds = '{"home_win":1.60,"draw":3.75,"away_win":5.50,"over_2_5":1.85}', odds_last_updated = now()
  WHERE team1 = 'Belgium'      AND team2 = 'Egypt';
UPDATE public.matches SET odds = '{"home_win":1.50,"draw":3.90,"away_win":6.50,"over_2_5":1.80}', odds_last_updated = now()
  WHERE team1 = 'Belgium'      AND team2 = 'Iran';
UPDATE public.matches SET odds = '{"home_win":2.60,"draw":3.20,"away_win":2.80,"over_2_5":1.85}', odds_last_updated = now()
  WHERE team1 = 'New Zealand'  AND team2 = 'Egypt';
UPDATE public.matches SET odds = '{"home_win":2.40,"draw":3.20,"away_win":3.00,"over_2_5":1.90}', odds_last_updated = now()
  WHERE team1 = 'Egypt'        AND team2 = 'Iran';
UPDATE public.matches SET odds = '{"home_win":8.00,"draw":5.00,"away_win":1.40,"over_2_5":1.80}', odds_last_updated = now()
  WHERE team1 = 'New Zealand'  AND team2 = 'Belgium';

-- ── GROUP H  (Spain · Cape Verde · Saudi Arabia · Uruguay) ───────────────────
UPDATE public.matches SET odds = '{"home_win":1.25,"draw":5.50,"away_win":12.00,"over_2_5":1.72}', odds_last_updated = now()
  WHERE team1 = 'Spain'        AND team2 = 'Cape Verde';
UPDATE public.matches SET odds = '{"home_win":2.80,"draw":3.10,"away_win":2.60,"over_2_5":1.85}', odds_last_updated = now()
  WHERE team1 = 'Saudi Arabia' AND team2 = 'Uruguay';
UPDATE public.matches SET odds = '{"home_win":1.40,"draw":4.50,"away_win":8.00,"over_2_5":1.78}', odds_last_updated = now()
  WHERE team1 = 'Spain'        AND team2 = 'Saudi Arabia';
UPDATE public.matches SET odds = '{"home_win":1.55,"draw":3.80,"away_win":6.00,"over_2_5":1.82}', odds_last_updated = now()
  WHERE team1 = 'Uruguay'      AND team2 = 'Cape Verde';
UPDATE public.matches SET odds = '{"home_win":2.90,"draw":3.20,"away_win":2.50,"over_2_5":1.85}', odds_last_updated = now()
  WHERE team1 = 'Cape Verde'   AND team2 = 'Saudi Arabia';
UPDATE public.matches SET odds = '{"home_win":5.00,"draw":3.80,"away_win":1.70,"over_2_5":1.80}', odds_last_updated = now()
  WHERE team1 = 'Uruguay'      AND team2 = 'Spain';

-- ── GROUP I  (France · Senegal · Iraq · Norway) ───────────────────────────────
UPDATE public.matches SET odds = '{"home_win":1.45,"draw":4.20,"away_win":7.50,"over_2_5":1.78}', odds_last_updated = now()
  WHERE team1 = 'France'       AND team2 = 'Senegal';
UPDATE public.matches SET odds = '{"home_win":6.00,"draw":4.00,"away_win":1.55,"over_2_5":1.82}', odds_last_updated = now()
  WHERE team1 = 'Iraq'         AND team2 = 'Norway';
UPDATE public.matches SET odds = '{"home_win":1.20,"draw":6.50,"away_win":15.00,"over_2_5":1.65}', odds_last_updated = now()
  WHERE team1 = 'France'       AND team2 = 'Iraq';
UPDATE public.matches SET odds = '{"home_win":2.30,"draw":3.20,"away_win":3.20,"over_2_5":1.88}', odds_last_updated = now()
  WHERE team1 = 'Norway'       AND team2 = 'Senegal';
UPDATE public.matches SET odds = '{"home_win":5.00,"draw":3.80,"away_win":1.70,"over_2_5":1.80}', odds_last_updated = now()
  WHERE team1 = 'Norway'       AND team2 = 'France';
UPDATE public.matches SET odds = '{"home_win":1.75,"draw":3.40,"away_win":4.50,"over_2_5":1.82}', odds_last_updated = now()
  WHERE team1 = 'Senegal'      AND team2 = 'Iraq';

-- ── GROUP J  (Argentina · Algeria · Austria · Jordan) ────────────────────────
UPDATE public.matches SET odds = '{"home_win":1.30,"draw":5.00,"away_win":10.00,"over_2_5":1.72}', odds_last_updated = now()
  WHERE team1 = 'Argentina'    AND team2 = 'Algeria';
UPDATE public.matches SET odds = '{"home_win":1.65,"draw":3.60,"away_win":5.50,"over_2_5":1.85}', odds_last_updated = now()
  WHERE team1 = 'Austria'      AND team2 = 'Jordan';
UPDATE public.matches SET odds = '{"home_win":1.45,"draw":4.20,"away_win":7.50,"over_2_5":1.78}', odds_last_updated = now()
  WHERE team1 = 'Argentina'    AND team2 = 'Austria';
UPDATE public.matches SET odds = '{"home_win":2.80,"draw":3.20,"away_win":2.60,"over_2_5":1.85}', odds_last_updated = now()
  WHERE team1 = 'Jordan'       AND team2 = 'Algeria';
UPDATE public.matches SET odds = '{"home_win":2.50,"draw":3.20,"away_win":2.80,"over_2_5":1.88}', odds_last_updated = now()
  WHERE team1 = 'Algeria'      AND team2 = 'Austria';
UPDATE public.matches SET odds = '{"home_win":8.00,"draw":5.00,"away_win":1.40,"over_2_5":1.78}', odds_last_updated = now()
  WHERE team1 = 'Jordan'       AND team2 = 'Argentina';

-- ── GROUP K  (Portugal · DR Congo · Uzbekistan · Colombia) ───────────────────
UPDATE public.matches SET odds = '{"home_win":1.55,"draw":3.80,"away_win":6.00,"over_2_5":1.82}', odds_last_updated = now()
  WHERE team1 = 'Portugal'     AND team2 = 'DR Congo';
UPDATE public.matches SET odds = '{"home_win":5.00,"draw":3.80,"away_win":1.70,"over_2_5":1.80}', odds_last_updated = now()
  WHERE team1 = 'Uzbekistan'   AND team2 = 'Colombia';
UPDATE public.matches SET odds = '{"home_win":1.25,"draw":5.50,"away_win":12.00,"over_2_5":1.72}', odds_last_updated = now()
  WHERE team1 = 'Portugal'     AND team2 = 'Uzbekistan';
UPDATE public.matches SET odds = '{"home_win":1.65,"draw":3.60,"away_win":5.50,"over_2_5":1.85}', odds_last_updated = now()
  WHERE team1 = 'Colombia'     AND team2 = 'DR Congo';
UPDATE public.matches SET odds = '{"home_win":2.80,"draw":3.10,"away_win":2.60,"over_2_5":1.85}', odds_last_updated = now()
  WHERE team1 = 'Colombia'     AND team2 = 'Portugal';
UPDATE public.matches SET odds = '{"home_win":2.60,"draw":3.20,"away_win":2.80,"over_2_5":1.88}', odds_last_updated = now()
  WHERE team1 = 'DR Congo'     AND team2 = 'Uzbekistan';

-- ── GROUP L  (England · Croatia · Ghana · Panama) ────────────────────────────
UPDATE public.matches SET odds = '{"home_win":1.50,"draw":3.90,"away_win":6.50,"over_2_5":1.85}', odds_last_updated = now()
  WHERE team1 = 'England'      AND team2 = 'Croatia';
UPDATE public.matches SET odds = '{"home_win":2.30,"draw":3.20,"away_win":3.20,"over_2_5":1.88}', odds_last_updated = now()
  WHERE team1 = 'Ghana'        AND team2 = 'Panama';
UPDATE public.matches SET odds = '{"home_win":1.40,"draw":4.50,"away_win":8.00,"over_2_5":1.80}', odds_last_updated = now()
  WHERE team1 = 'England'      AND team2 = 'Ghana';
UPDATE public.matches SET odds = '{"home_win":3.80,"draw":3.40,"away_win":2.00,"over_2_5":1.82}', odds_last_updated = now()
  WHERE team1 = 'Panama'       AND team2 = 'Croatia';
UPDATE public.matches SET odds = '{"home_win":7.50,"draw":4.50,"away_win":1.45,"over_2_5":1.78}', odds_last_updated = now()
  WHERE team1 = 'Panama'       AND team2 = 'England';
UPDATE public.matches SET odds = '{"home_win":1.80,"draw":3.40,"away_win":4.50,"over_2_5":1.85}', odds_last_updated = now()
  WHERE team1 = 'Croatia'      AND team2 = 'Ghana';
