/**
 * GET /api/match-shots?matchId=<uuid>
 *
 * Returns shot positions and team shot stats for a match.
 *
 * Data sources (ESPN unofficial public API):
 *   - keyEvents → accurate shot coordinates for goals (fieldPositionX/Y)
 *   - commentary → all shot attempts parsed for type, team, and zone text
 *     (non-goal positions are approximated from zone descriptions)
 *   - boxscore  → totalShots, shotsOnTarget, blockedShots per team
 *
 * Coordinate space returned (ESPN-normalised):
 *   espnX: 0–100 where 100 = the goal being attacked (always attacking direction)
 *   espnY: 0–100 where 0 = left touchline, 50 = centre, 100 = right touchline
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
  'United States': 'USA', 'Türkiye': 'Turkiye', 'Turkey': 'Turkiye',
  'Korea Republic': 'South Korea', 'Republic of Korea': 'South Korea',
  "Côte d'Ivoire": 'Ivory Coast', "Cote d'Ivoire": 'Ivory Coast',
  'Congo DR': 'DR Congo', 'Democratic Republic of the Congo': 'DR Congo',
  'Cabo Verde': 'Cape Verde', 'Bosnia & Herzegovina': 'Bosnia',
  'Bosnia and Herzegovina': 'Bosnia', 'Czech Republic': 'Czechia', 'Curaçao': 'Curacao',
}

const EMPTY = { shots: [], stats: null }

function fetchWithTimeout(url, options = {}, ms = 5000) {
  const ac = new AbortController()
  const t  = setTimeout(() => ac.abort(), ms)
  return fetch(url, { ...options, signal: ac.signal }).finally(() => clearTimeout(t))
}

function norm(name) { return ESPN_NAME_MAP[name] ?? name }

function teamsMatch(a, b) {
  const na = norm(a).toLowerCase(), nb = norm(b).toLowerCase()
  return na === nb || na.includes(nb) || nb.includes(na)
}

// ── Zone parsing ──────────────────────────────────────────────────────────────
// Returns ESPN-space coords (x=distance from goal 50–100, y=left-right 0–100)
function zoneToCoords(text) {
  let x = 85, y = 50

  // X (distance from goal)
  if (/close range|6.?yard|tap.?in/i.test(text))                      x = 96
  else if (/penalty spot/i.test(text))                                  return { x: 89, y: 50 }
  else if (/centre of the box|center of the box/i.test(text))          x = 90
  else if (/right side of the box|left side of the box/i.test(text))   x = 87
  else if (/right side of the penalty|left side of the penalty/i.test(text)) x = 87
  else if (/edge of the box|edge of the area/i.test(text))             x = 82
  else if (/difficult angle/i.test(text))                               x = 82
  else if (/outside the box|outside the area/i.test(text))             x = 73
  else if (/long range/i.test(text))                                    x = 66

  // Y (left/right position)
  if      (/difficult angle.*left|left.*difficult angle/i.test(text))  y = 18
  else if (/difficult angle.*right|right.*difficult angle/i.test(text)) y = 82
  else if (/right side/i.test(text))                                    y = 65
  else if (/left side/i.test(text))                                     y = 35
  else if (/right of cent/i.test(text))                                 y = 58
  else if (/left of cent/i.test(text))                                  y = 42
  else if (/on the right|right hand/i.test(text))                       y = 62
  else if (/on the left|left hand/i.test(text))                         y = 38

  // Add a small deterministic offset based on text length to avoid all
  // shots from the same zone stacking exactly — visual only, not data-driven
  const jitter = (text.length % 7 - 3) * 0.9
  return { x: Math.min(99, x), y: Math.min(98, Math.max(2, y + jitter)) }
}

function parseShotType(text) {
  if (/^Goal!/i.test(text))          return 'goal'
  if (/^Attempt saved/i.test(text))  return 'saved'
  if (/^Attempt blocked/i.test(text)) return 'blocked'
  if (/^Attempt missed/i.test(text)) return 'missed'
  return null
}

function parseSide(text, team1, team2) {
  const m = text.match(/\(([^)]+)\)/)
  if (!m) return null
  const name = m[1]
  if (teamsMatch(name, team1)) return 'home'
  if (teamsMatch(name, team2)) return 'away'
  return null
}

function parsePlayer(text) {
  // "Attempt saved. Forename Surname (Team) …"
  // "Goal! Score. Forename Surname (Team) …"
  const m = text.match(/^(?:Attempt \w+\.|Goal![^.]+\.)\s+(.+?)\s+\([^)]+\)/)
  return m ? m[1] : null
}

export default async function handler(req, res) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return res.status(200).json(EMPTY)
  const matchId = req.query.matchId
  if (!matchId) return res.status(200).json(EMPTY)

  try {
    // ── 1. Get match record ────────────────────────────────────────────────
    const [match] = await (await fetch(
      `${SUPABASE_URL}/rest/v1/matches?id=eq.${matchId}&select=id,team1,team2,starts_at,status`,
      { headers: SUPABASE_HEADERS },
    )).json()

    if (!match || match.status === 'upcoming') return res.status(200).json(EMPTY)

    // ── 2. ESPN scoreboard → event ID ─────────────────────────────────────
    const dateStr = new Date(match.starts_at).toISOString().slice(0, 10).replace(/-/g, '')
    const { events: espnEvents = [] } = await (await fetchWithTimeout(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${dateStr}`,
      { headers: { 'User-Agent': 'WorldCupCompanion/1.0' } },
    )).json()

    const espnEvent = espnEvents.find(ev => {
      const comp = ev.competitions?.[0]
      if (!comp) return false
      const h = comp.competitors?.find(c => c.homeAway === 'home')?.team?.displayName ?? ''
      const a = comp.competitors?.find(c => c.homeAway === 'away')?.team?.displayName ?? ''
      return (teamsMatch(h, match.team1) && teamsMatch(a, match.team2)) ||
             (teamsMatch(h, match.team2) && teamsMatch(a, match.team1))
    })

    if (!espnEvent) return res.status(200).json(EMPTY)

    const comp     = espnEvent.competitions[0]
    const homeComp = comp.competitors?.find(c => c.homeAway === 'home')
    const awayComp = comp.competitors?.find(c => c.homeAway === 'away')
    const homeIsTeam1 = teamsMatch(homeComp?.team?.displayName ?? '', match.team1)

    // ── 3. ESPN summary → keyEvents (precise goal coords) + commentary ────
    const summRes  = await fetchWithTimeout(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${espnEvent.id}`,
      { headers: { 'User-Agent': 'WorldCupCompanion/1.0' } },
    )
    if (!summRes.ok) return res.status(200).json(EMPTY)
    const summData = await summRes.json()

    // Goals from keyEvents — accurate coordinates, includes own goals
    const shots = []
    for (const ev of summData.keyEvents ?? []) {
      if (!['Goal', 'Own Goal', 'Penalty Goal'].includes(ev.type?.text)) continue
      if (ev.fieldPositionX == null || ev.fieldPositionY == null) continue
      const isEspnHome = ev.team?.id === homeComp?.id
      const side   = (isEspnHome === homeIsTeam1) ? 'home' : 'away'
      const minute = Math.floor((ev.clock?.value ?? 0) / 60)
      const player = ev.participants?.[0]?.athlete?.displayName ?? null
      shots.push({
        minute, type: 'goal', side, player,
        espnX: ev.fieldPositionX, espnY: ev.fieldPositionY,
        accurate: true,
      })
    }

    // Non-goal shots from commentary — approximate zone coordinates
    for (const item of summData.commentary ?? []) {
      const type = parseShotType(item.text ?? '')
      if (!type || type === 'goal') continue   // goals already covered above
      const side = parseSide(item.text, match.team1, match.team2)
      if (!side) continue
      const minute = item.time?.value != null ? Math.floor(item.time.value / 60) : null
      const player = parsePlayer(item.text)
      const { x: espnX, y: espnY } = zoneToCoords(item.text)
      shots.push({ minute, type, side, player, espnX, espnY, accurate: false })
    }

    shots.sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0))

    // ── 4. Boxscore stats ─────────────────────────────────────────────────
    const getStat = (comp_, name) =>
      parseInt(comp_?.statistics?.find(s => s.name === name)?.displayValue ?? '') || 0

    const homeStats = { total: getStat(homeComp, 'totalShots'), onTarget: getStat(homeComp, 'shotsOnTarget'), blocked: getStat(homeComp, 'blockedShots') }
    const awayStats = { total: getStat(awayComp, 'totalShots'), onTarget: getStat(awayComp, 'shotsOnTarget'), blocked: getStat(awayComp, 'blockedShots') }

    const stats = homeIsTeam1
      ? { home: homeStats, away: awayStats }
      : { home: awayStats, away: homeStats }

    const maxAge = match.status === 'finished' ? 300 : 30
    res.setHeader('Cache-Control', `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`)
    return res.status(200).json({ shots, stats })

  } catch {
    return res.status(200).json(EMPTY)
  }
}
