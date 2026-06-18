-- Phase 5: add odds cache columns to matches table
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS odds              jsonb,
  ADD COLUMN IF NOT EXISTS odds_last_updated timestamptz;

-- ── Seed realistic decimal odds for all 24 WC 2026 group-stage matches ──────
-- Format: { home_win, draw, away_win, over_2_5 } — all decimal (European) odds

-- Group A
UPDATE public.matches SET odds = '{"home_win":1.45,"draw":4.20,"away_win":7.50,"over_2_5":1.72}', odds_last_updated = now() - interval '2 minutes'
  WHERE id = 'add748d1-e4ca-4b0f-9cf3-412ce11c2029'; -- Brazil vs Japan

UPDATE public.matches SET odds = '{"home_win":1.55,"draw":3.90,"away_win":6.00,"over_2_5":1.85}', odds_last_updated = now() - interval '2 minutes'
  WHERE id = '53e80c5c-527a-4e7f-a751-7e2981796cf5'; -- France vs Morocco

UPDATE public.matches SET odds = '{"home_win":1.40,"draw":4.50,"away_win":8.50,"over_2_5":1.70}', odds_last_updated = now() - interval '2 minutes'
  WHERE id = '5c4dac45-8132-4744-97b5-da234167a1d0'; -- Brazil vs Morocco

UPDATE public.matches SET odds = '{"home_win":1.35,"draw":4.80,"away_win":9.00,"over_2_5":1.75}', odds_last_updated = now() - interval '2 minutes'
  WHERE id = '0f454a1a-7ba5-4437-b7f9-7aa747026293'; -- France vs Japan

UPDATE public.matches SET odds = '{"home_win":2.05,"draw":3.35,"away_win":3.60,"over_2_5":1.78}', odds_last_updated = now() - interval '2 minutes'
  WHERE id = 'db7b546c-634e-4f51-965f-ea1a515b37de'; -- Brazil vs France

UPDATE public.matches SET odds = '{"home_win":2.80,"draw":3.10,"away_win":2.60,"over_2_5":2.05}', odds_last_updated = now() - interval '2 minutes'
  WHERE id = '92b54f10-5376-429a-9546-773cb60dd888'; -- Japan vs Morocco

-- Group B
UPDATE public.matches SET odds = '{"home_win":1.40,"draw":4.50,"away_win":8.00,"over_2_5":1.75}', odds_last_updated = now() - interval '2 minutes'
  WHERE id = '4be3dea5-08b6-476a-91c5-e27613b33185'; -- Argentina vs USA

UPDATE public.matches SET odds = '{"home_win":1.60,"draw":3.75,"away_win":5.50,"over_2_5":1.90}', odds_last_updated = now() - interval '2 minutes'
  WHERE id = '501a7bb4-0c54-428e-a9f0-8d1fb4fdab57'; -- Spain vs Poland

UPDATE public.matches SET odds = '{"home_win":1.38,"draw":4.60,"away_win":8.00,"over_2_5":1.80}', odds_last_updated = now() - interval '2 minutes'
  WHERE id = 'f7a295fd-6093-4eac-9057-bacafdead446'; -- Argentina vs Poland

UPDATE public.matches SET odds = '{"home_win":1.65,"draw":3.70,"away_win":5.00,"over_2_5":1.85}', odds_last_updated = now() - interval '2 minutes'
  WHERE id = '7f614e9d-5a82-4d77-a3a8-e7aca932d4e6'; -- Spain vs USA

UPDATE public.matches SET odds = '{"home_win":2.20,"draw":3.25,"away_win":3.30,"over_2_5":1.85}', odds_last_updated = now() - interval '2 minutes'
  WHERE id = '89888ee3-e0da-420d-80cc-bedd5d09576d'; -- Argentina vs Spain

UPDATE public.matches SET odds = '{"home_win":2.35,"draw":3.20,"away_win":3.05,"over_2_5":2.00}', odds_last_updated = now() - interval '2 minutes'
  WHERE id = '88af24f4-6ef6-4ed8-8645-c46248d909e7'; -- USA vs Poland

-- Group C
UPDATE public.matches SET odds = '{"home_win":1.75,"draw":3.50,"away_win":4.50,"over_2_5":1.88}', odds_last_updated = now() - interval '2 minutes'
  WHERE id = '351bdaed-4d50-419c-90f9-b8d63613a9bb'; -- England vs Mexico

UPDATE public.matches SET odds = '{"home_win":1.70,"draw":3.60,"away_win":4.80,"over_2_5":1.82}', odds_last_updated = now() - interval '2 minutes'
  WHERE id = 'aa4ecb82-7f2d-4abf-9523-ba95987ff7da'; -- Germany vs Switzerland

UPDATE public.matches SET odds = '{"home_win":1.80,"draw":3.40,"away_win":4.20,"over_2_5":1.90}', odds_last_updated = now() - interval '2 minutes'
  WHERE id = '4b24997f-1ee2-4aba-8c09-27057b115bd5'; -- England vs Switzerland

UPDATE public.matches SET odds = '{"home_win":1.65,"draw":3.65,"away_win":5.25,"over_2_5":1.88}', odds_last_updated = now() - interval '2 minutes'
  WHERE id = '6d1886ef-5212-4024-9c32-fdf897ba4ee1'; -- Germany vs Mexico

UPDATE public.matches SET odds = '{"home_win":2.40,"draw":3.25,"away_win":2.95,"over_2_5":1.80}', odds_last_updated = now() - interval '2 minutes'
  WHERE id = '4ceea274-0d22-482d-a3c8-9fb92fd99316'; -- England vs Germany

UPDATE public.matches SET odds = '{"home_win":2.60,"draw":3.15,"away_win":2.70,"over_2_5":2.10}', odds_last_updated = now() - interval '2 minutes'
  WHERE id = '1ba4d4e9-465f-4978-9556-1c47b6e45ef1'; -- Mexico vs Switzerland

-- Group D
UPDATE public.matches SET odds = '{"home_win":1.55,"draw":3.80,"away_win":5.50,"over_2_5":1.95}', odds_last_updated = now() - interval '2 minutes'
  WHERE id = 'f326620f-9c74-4777-a776-c74c6bab9469'; -- Portugal vs Senegal

UPDATE public.matches SET odds = '{"home_win":2.10,"draw":3.30,"away_win":3.50,"over_2_5":1.80}', odds_last_updated = now() - interval '2 minutes'
  WHERE id = '04a27805-2dc4-40a1-b0fd-71f6cccf4719'; -- Netherlands vs Belgium

UPDATE public.matches SET odds = '{"home_win":1.95,"draw":3.40,"away_win":3.80,"over_2_5":1.85}', odds_last_updated = now() - interval '2 minutes'
  WHERE id = '412a5a42-12a5-4b5f-b74f-e49b3556b760'; -- Portugal vs Belgium

UPDATE public.matches SET odds = '{"home_win":1.55,"draw":3.80,"away_win":5.50,"over_2_5":1.90}', odds_last_updated = now() - interval '2 minutes'
  WHERE id = 'b82f156a-bae7-4dea-b8cc-8b0fec825a0f'; -- Netherlands vs Senegal

UPDATE public.matches SET odds = '{"home_win":3.20,"draw":3.10,"away_win":2.30,"over_2_5":1.95}', odds_last_updated = now() - interval '2 minutes'
  WHERE id = '9c71db55-b38d-4a45-8f9b-564372ea0799'; -- Senegal vs Belgium

UPDATE public.matches SET odds = '{"home_win":2.50,"draw":3.20,"away_win":2.80,"over_2_5":1.88}', odds_last_updated = now() - interval '2 minutes'
  WHERE id = '54944e8a-b788-4eb2-882f-a3ad3ef898c6'; -- Portugal vs Netherlands
