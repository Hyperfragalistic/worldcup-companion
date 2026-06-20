/**
 * GET /api/match-events?matchId=<uuid>
 *
 * Returns match events (goals, cards) and possession stats sourced from ESPN's
 * unofficial public API — no key required. Safe to poll every 60 s while live.
 *
 * Flow:
 *   1. Look up match in Supabase to get team names + date
 *   2. Fetch ESPN scoreboard for that date → find matching event + ESPN eventId
 *   3. Fetch ESPN summary for that eventId → parse keyEvents
 *   4. Also extract possession from scoreboard competitor statistics
 *
 * All errors return { events: [], possession: null, elapsed: null } so the
 * client degrades gracefully rather than showing an error state.
 */

const SUPABASE_URL         = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

const SUPABASE_HEADERS = {
  apikey:         SUPABASE_SERVICE_KEY ?? '',
  Authorization:  `Bearer ${SUPABASE_SERVICE_KEY ?? ''}`,
  'Content-Type': 'application/json',
  Prefer:         'return=representation',
}

const ESPN_NAME_MAP = {
  'United States':                    'USA',
  'Türkiye':                          'Turkiye',
  'Turkey':                           'Turkiye',
  'Korea Republic':                   'South Korea',
  'Republic of Korea':                'South Korea',
  "Côte d'Ivoire":                    'Ivory Coast',
  "Cote d'Ivoire":                    'Ivory Coast',
  'Congo DR':                         'DR Congo',
  'Congo, DR':                        'DR Congo',
  'Democratic Republic of the Congo': 'DR Congo',
  'Cabo Verde':                       'Cape Verde',
  'Bosnia & Herzegovina':             'Bosnia',
  'Bosnia and Herzegovina':           'Bosnia',
  'Czech Republic':                   'Czechia',
  'Curaçao':                          'Curacao',
}

const EMPTY = { events: [], possession: null, elapsed: null }

function fetchWithTimeout(url, options = {}, ms = 5000) {
  const ac = new AbortController()
  const t  = setTimeout(() => ac.abort(), ms)
  return fetch(url, { ...options, signal: ac.signal }).finally(() => clearTimeout(t))
}

function norm(name) {
  return ESPN_NAME_MAP[name] ?? name
}

function teamsMatch(espnName, dbName) {
  const e = norm(espnName).toLowerCase()
  const d = dbName.toLowerCase()
  return e === d || e.includes(d) || d.includes(e)
}

function parseEventType(typeText) {
  const t = (typeText ?? '').toLowerCase()
  if (t === 'goal' || t === 'penalty goal') return 'goal'
  if (t === 'own goal')                     return 'goal'
  if (t === 'yellow card')                  return 'yellow_card'
  if (t === 'red card' || t === 'yellow-red card') return 'red_card'
  return null
}

function parseMinute(displayValue) {
  if (!displayValue) return null
  const m = parseInt(displayValue)
  return isNaN(m) ? null : m
}

export default async function handler(req, res) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(200).json(EMPTY)
  }

  const matchId = req.query.matchId
  if (!matchId) return res.status(200).json(EMPTY)

  try {
    // ── 1. Get match record ──────────────────────────────────────────────────
    const matchRes = await fetch(
      `${SUPABASE_URL}/rest/v1/matches?id=eq.${matchId}&select=id,team1,team2,starts_at,status`,
      { headers: SUPABASE_HEADERS },
    )
    const [match] = await matchRes.json()
    if (!match || match.status === 'upcoming') return res.status(200).json(EMPTY)

    // ── 2. Fetch ESPN scoreboard for this date ───────────────────────────────
    const dateStr = new Date(match.starts_at).toISOString().slice(0, 10).replace(/-/g, '')
    const boardRes = await fetchWithTimeout(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${dateStr}`,
      { headers: { 'User-Agent': 'WorldCupCompanion/1.0' } },
    )
    if (!boardRes.ok) return res.status(200).json(EMPTY)

    const { events: espnEvents = [] } = await boardRes.json()

    // ── 3. Find matching ESPN event ──────────────────────────────────────────
    const t1 = match.team1
    const t2 = match.team2

    const espnEvent = espnEvents.find(ev => {
      const comp = ev.competitions?.[0]
      if (!comp) return false
      const h = comp.competitors?.find(c => c.homeAway === 'home')?.team?.displayName ?? ''
      const a = comp.competitors?.find(c => c.homeAway === 'away')?.team?.displayName ?? ''
      return (teamsMatch(h, t1) && teamsMatch(a, t2)) ||
             (teamsMatch(h, t2) && teamsMatch(a, t1))
    })

    if (!espnEvent) return res.status(200).json(EMPTY)

    const comp     = espnEvent.competitions[0]
    const homeComp = comp.competitors?.find(c => c.homeAway === 'home')
    const awayComp = comp.competitors?.find(c => c.homeAway === 'away')

    // Does ESPN's "home" side correspond to our team1?
    const homeIsTeam1 = teamsMatch(homeComp?.team?.displayName ?? '', t1)

    // ── 4. Elapsed clock from live status ────────────────────────────────────
    const isInProgress = comp.status?.type?.name?.includes('IN_PROGRESS') ?? false
    const elapsed      = isInProgress ? (comp.status?.displayClock ?? null) : null

    // ── 5. Possession from competitor statistics ─────────────────────────────
    const getPoss = (comp_) =>
      parseFloat(comp_?.statistics?.find(s => s.name === 'possessionPct')?.displayValue ?? '') || null

    const homePoss = getPoss(homeComp)
    const awayPoss = getPoss(awayComp)
    const possession = homePoss !== null
      ? {
          home: homeIsTeam1 ? homePoss : (awayPoss ?? 100 - homePoss),
          away: homeIsTeam1 ? (awayPoss ?? 100 - homePoss) : homePoss,
        }
      : null

    // ── 6. Fetch ESPN summary for key events ─────────────────────────────────
    let parsedEvents = []

    const summRes = await fetchWithTimeout(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${espnEvent.id}`,
      { headers: { 'User-Agent': 'WorldCupCompanion/1.0' } },
    )

    if (summRes.ok) {
      const summData  = await summRes.json()
      const keyEvents = summData.keyEvents ?? summData.plays ?? []

      for (const ev of keyEvents) {
        const type = parseEventType(ev.type?.text)
        if (!type) continue

        const minute  = parseMinute(ev.clock?.displayValue)
        const player  = ev.participants?.[0]?.athlete?.displayName
                     ?? ev.athletesInvolved?.[0]?.displayName
                     ?? null
        const isEspnHome = ev.team?.id === homeComp?.id
        const side       = (isEspnHome === homeIsTeam1) ? 'home' : 'away'
        const ownGoal    = ev.ownGoal === true ||
                           (ev.type?.text ?? '').toLowerCase().includes('own goal')

        parsedEvents.push({ minute, type, side, player, ownGoal })
      }
    } else {
      // Fallback: inline details from scoreboard event (not always present)
      for (const d of comp.details ?? []) {
        const type = parseEventType(d.type?.text)
        if (!type) continue
        const minute     = parseMinute(d.clock?.displayValue)
        const player     = d.athletesInvolved?.[0]?.displayName ?? null
        const isEspnHome = d.team?.id === homeComp?.id
        const side       = (isEspnHome === homeIsTeam1) ? 'home' : 'away'
        const ownGoal    = (d.type?.text ?? '').toLowerCase().includes('own goal')
        parsedEvents.push({ minute, type, side, player, ownGoal })
      }
    }

    parsedEvents.sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0))

    const maxAge = match.status === 'finished' ? 300 : 30
    res.setHeader('Cache-Control', `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`)
    return res.status(200).json({ events: parsedEvents, possession, elapsed })

  } catch {
    return res.status(200).json(EMPTY)
  }
}
