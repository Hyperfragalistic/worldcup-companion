/**
 * POST /api/odds?matchId=<uuid>
 *
 * Hybrid odds proxy — tries to fetch live data from The Odds API, writes the
 * result back to the Supabase cache, then returns the fresh odds.
 *
 * Environment variables (set in Vercel dashboard):
 *   ODDS_API_KEY          — The Odds API key (https://the-odds-api.com)
 *                           If absent the route returns 501 and the client
 *                           falls back to cached data gracefully.
 *   SUPABASE_URL          — e.g. https://xxx.supabase.co
 *   SUPABASE_SERVICE_KEY  — service role key (bypasses RLS for cache write)
 *
 * Debugging tip:
 *   The Odds API returns events keyed by a sport-specific event ID, not by
 *   team names. The mapping step below (matchOddsApiId) is the most likely
 *   place things break if the fixture list changes — log `events` to verify.
 */

const SUPABASE_URL         = process.env.SUPABASE_URL         ?? process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const ODDS_API_KEY         = process.env.ODDS_API_KEY

const SUPABASE_HEADERS = {
  apikey:         SUPABASE_SERVICE_KEY ?? '',
  Authorization:  `Bearer ${SUPABASE_SERVICE_KEY ?? ''}`,
  'Content-Type': 'application/json',
  Prefer:         'return=representation',
}

export default async function handler(req, res) {
  // Only accept POST (GET is read-only from Supabase cache; the hook handles that)
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const matchId = req.query.matchId
  if (!matchId) {
    return res.status(400).json({ message: 'matchId query param required' })
  }

  // ── 1. Fetch the match record to get team names ──────────────────────────────
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(503).json({ message: 'Server misconfiguration: missing Supabase env vars' })
  }

  const matchRes = await fetch(
    `${SUPABASE_URL}/rest/v1/matches?id=eq.${matchId}&select=id,team1,team2,odds,odds_last_updated`,
    { headers: SUPABASE_HEADERS },
  )
  const [match] = await matchRes.json()

  if (!match) {
    return res.status(404).json({ message: 'Match not found' })
  }

  // ── 2. No API key — return 501 so the client keeps cached data ───────────────
  if (!ODDS_API_KEY) {
    return res.status(501).json({
      message: 'Live odds unavailable — ODDS_API_KEY not configured. Showing cached data.',
    })
  }

  // ── 3. Fetch live odds from The Odds API ─────────────────────────────────────
  // Docs: https://the-odds-api.com/liveapi/guides/v4/#get-odds
  try {
    const oddsRes = await fetch(
      `https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds/` +
      `?apiKey=${ODDS_API_KEY}&regions=eu&markets=h2h,totals&oddsFormat=decimal`,
    )

    if (!oddsRes.ok) {
      const quota = oddsRes.headers.get('x-requests-remaining')
      if (oddsRes.status === 401) {
        return res.status(502).json({ message: 'Invalid ODDS_API_KEY — showing cached data' })
      }
      if (oddsRes.status === 429 || quota === '0') {
        return res.status(502).json({ message: 'Odds API quota exhausted — showing cached data' })
      }
      return res.status(502).json({ message: `Odds API error ${oddsRes.status} — showing cached data` })
    }

    const events = await oddsRes.json()

    // Our DB name → The Odds API name (where substring matching would fail)
    const ODDS_NAME_MAP = {
      'turkiye':  'turkey',
      'czechia':  'czech republic',
      'bosnia':   'bosnia & herzegovina',
      'curacao':  'curaçao',
      'ivory coast': 'ivory coast',   // same, included for clarity
    }
    const normalise = name => ODDS_NAME_MAP[name.toLowerCase()] ?? name.toLowerCase()

    // Find the event matching this match by team names (case-insensitive, with aliases)
    const t1 = normalise(match.team1)
    const t2 = normalise(match.team2)
    const event = events.find(e =>
      (e.home_team.toLowerCase().includes(t1) || t1.includes(e.home_team.toLowerCase())) &&
      (e.away_team.toLowerCase().includes(t2) || t2.includes(e.away_team.toLowerCase()))
    ) ?? events.find(e =>
      // Also check reversed (API may swap home/away)
      (e.home_team.toLowerCase().includes(t2) || t2.includes(e.home_team.toLowerCase())) &&
      (e.away_team.toLowerCase().includes(t1) || t1.includes(e.away_team.toLowerCase()))
    )

    if (!event) {
      return res.status(404).json({
        message: `No live odds found for ${match.team1} vs ${match.team2} — showing cached data`,
      })
    }

    // Extract h2h market (home/draw/away)
    const h2hBook  = event.bookmakers?.[0]?.markets?.find(m => m.key === 'h2h')
    const totalsBook = event.bookmakers?.[0]?.markets?.find(m => m.key === 'totals')

    if (!h2hBook) {
      return res.status(404).json({ message: 'h2h market not found in API response — showing cached data' })
    }

    const outcomes = h2hBook.outcomes ?? []
    const homeOutcome = outcomes.find(o => o.name.toLowerCase().includes(event.home_team.toLowerCase()))
    const awayOutcome = outcomes.find(o => o.name.toLowerCase().includes(event.away_team.toLowerCase()))
    const drawOutcome = outcomes.find(o => o.name.toLowerCase() === 'draw')

    const over25 = totalsBook?.outcomes?.find(o => o.name === 'Over' && o.point === 2.5)

    const freshOdds = {
      home_win: homeOutcome?.price ?? match.odds?.home_win,
      draw:     drawOutcome?.price ?? match.odds?.draw,
      away_win: awayOutcome?.price ?? match.odds?.away_win,
      ...(over25 ? { over_2_5: over25.price } : {}),
    }

    // ── 4. Write fresh odds back to Supabase cache ─────────────────────────────
    const now = new Date().toISOString()
    await fetch(
      `${SUPABASE_URL}/rest/v1/matches?id=eq.${matchId}`,
      {
        method:  'PATCH',
        headers: SUPABASE_HEADERS,
        body:    JSON.stringify({ odds: freshOdds, odds_last_updated: now }),
      },
    )

    return res.status(200).json({ odds: freshOdds, odds_last_updated: now })

  } catch (err) {
    // Network failure — client will fall back to cache
    return res.status(502).json({ message: 'Failed to reach odds provider — showing cached data' })
  }
}
