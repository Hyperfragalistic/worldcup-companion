/**
 * GET /api/match-live?matchId=<uuid>
 *
 * Single endpoint combining match-events + match-shots into one ESPN round-trip.
 * Called by useMatchLive hook; replaces separate /api/match-events and
 * /api/match-shots polling which hit ESPN independently and simultaneously.
 *
 * Returns:
 *   { events, possession, elapsed, shots, stats }
 *
 * All fields degrade gracefully to empty arrays / null on any error.
 */

const SUPABASE_URL         = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

const SUPABASE_HEADERS = {
  apikey:        SUPABASE_SERVICE_KEY ?? '',
  Authorization: `Bearer ${SUPABASE_SERVICE_KEY ?? ''}`,
  'Content-Type': 'application/json',
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

const EMPTY = { events: [], possession: null, elapsed: null, shots: [], stats: null }

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

// ── Event parsing ─────────────────────────────────────────────────────────────
function parseEventType(typeText) {
  const t = (typeText ?? '').toLowerCase()
  if (t === 'goal' || t === 'penalty goal') return 'goal'
  if (t === 'own goal')                     return 'goal'
  if (t === 'yellow card')                  return 'yellow_card'
  if (t === 'red card' || t === 'yellow-red card') return 'red_card'
  return null
}

function parseMinute(displayValue) {
  const m = parseInt(displayValue ?? '')
  return isNaN(m) ? null : m
}

// ── Shot parsing ──────────────────────────────────────────────────────────────
function parseShotType(text) {
  if (/^Goal!/i.test(text))           return 'goal'
  if (/^Attempt saved/i.test(text))   return 'saved'
  if (/^Attempt blocked/i.test(text)) return 'blocked'
  if (/^Attempt missed/i.test(text))  return 'missed'
  return null
}

function parseShotSide(text, team1, team2) {
  const m = text.match(/\(([^)]+)\)/)
  if (!m) return null
  const name = m[1]
  if (teamsMatch(name, team1)) return 'home'
  if (teamsMatch(name, team2)) return 'away'
  return null
}

function parseShotPlayer(text) {
  const m = text.match(/^(?:Attempt \w+\.|Goal![^.]+\.)\s+(.+?)\s+\([^)]+\)/)
  return m ? m[1] : null
}

function zoneToCoords(text) {
  let x = 85, y = 50
  if (/close range|6.?yard|tap.?in/i.test(text))                       x = 96
  else if (/penalty spot/i.test(text))                                   return { x: 89, y: 50 }
  else if (/centre of the box|center of the box/i.test(text))           x = 90
  else if (/right side of the box|left side of the box/i.test(text))    x = 87
  else if (/right side of the penalty|left side of the penalty/i.test(text)) x = 87
  else if (/edge of the box|edge of the area/i.test(text))              x = 82
  else if (/difficult angle/i.test(text))                                x = 82
  else if (/outside the box|outside the area/i.test(text))              x = 73
  else if (/long range/i.test(text))                                     x = 66

  if      (/difficult angle.*left|left.*difficult angle/i.test(text))   y = 18
  else if (/difficult angle.*right|right.*difficult angle/i.test(text)) y = 82
  else if (/right side/i.test(text))                                     y = 65
  else if (/left side/i.test(text))                                      y = 35
  else if (/right of cent/i.test(text))                                  y = 58
  else if (/left of cent/i.test(text))                                   y = 42
  else if (/on the right|right hand/i.test(text))                        y = 62
  else if (/on the left|left hand/i.test(text))                          y = 38

  const jitter = (text.length % 7 - 3) * 0.9
  return { x: Math.min(99, x), y: Math.min(98, Math.max(2, y + jitter)) }
}

function getStat(comp, name) {
  return parseInt(comp?.statistics?.find(s => s.name === name)?.displayValue ?? '') || 0
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return res.status(200).json(EMPTY)

  const { matchId } = req.query
  if (!matchId || !/^[0-9a-f-]{36}$/.test(matchId)) return res.status(200).json(EMPTY)

  try {
    // ── 1. Match record ───────────────────────────────────────────────────────
    const [match] = await (await fetch(
      `${SUPABASE_URL}/rest/v1/matches?id=eq.${matchId}&select=id,team1,team2,starts_at,status`,
      { headers: SUPABASE_HEADERS },
    )).json()

    if (!match || match.status === 'upcoming') return res.status(200).json(EMPTY)

    // ── 2. ESPN scoreboard ────────────────────────────────────────────────────
    const dateStr = new Date(match.starts_at).toISOString().slice(0, 10).replace(/-/g, '')
    const boardRes = await fetchWithTimeout(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${dateStr}`,
      { headers: { 'User-Agent': 'WorldCupCompanion/1.0' } },
    )
    if (!boardRes.ok) return res.status(200).json(EMPTY)

    const { events: espnEvents = [] } = await boardRes.json()
    const espnEvent = espnEvents.find(ev => {
      const comp = ev.competitions?.[0]
      if (!comp) return false
      const h = comp.competitors?.find(c => c.homeAway === 'home')?.team?.displayName ?? ''
      const a = comp.competitors?.find(c => c.homeAway === 'away')?.team?.displayName ?? ''
      return (teamsMatch(h, match.team1) && teamsMatch(a, match.team2)) ||
             (teamsMatch(h, match.team2) && teamsMatch(a, match.team1))
    })
    if (!espnEvent) return res.status(200).json(EMPTY)

    const comp       = espnEvent.competitions[0]
    const homeComp   = comp.competitors?.find(c => c.homeAway === 'home')
    const awayComp   = comp.competitors?.find(c => c.homeAway === 'away')
    const homeIsTeam1 = teamsMatch(homeComp?.team?.displayName ?? '', match.team1)

    // ── 3. Elapsed + possession (from scoreboard) ─────────────────────────────
    const isInProgress = comp.status?.type?.name?.includes('IN_PROGRESS') ?? false
    const elapsed      = isInProgress ? (comp.status?.displayClock ?? null) : null

    const getPoss = c => parseFloat(c?.statistics?.find(s => s.name === 'possessionPct')?.displayValue ?? '') || null
    const homePoss = getPoss(homeComp), awayPoss = getPoss(awayComp)
    const possession = homePoss !== null
      ? { home: homeIsTeam1 ? homePoss : (awayPoss ?? 100 - homePoss),
          away: homeIsTeam1 ? (awayPoss ?? 100 - homePoss) : homePoss }
      : null

    // ── 4. ESPN summary (single fetch — used for both events and shots) ────────
    const summRes = await fetchWithTimeout(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${espnEvent.id}`,
      { headers: { 'User-Agent': 'WorldCupCompanion/1.0' } },
    )
    if (!summRes.ok) return res.status(200).json({ ...EMPTY, possession, elapsed })

    const summData  = await summRes.json()
    const keyEvents = summData.keyEvents ?? summData.plays ?? []

    // ── 5. Parse events (goals + cards) ──────────────────────────────────────
    const events = []
    for (const ev of keyEvents) {
      const type = parseEventType(ev.type?.text)
      if (!type) continue
      const minute     = parseMinute(ev.clock?.displayValue)
      const player     = ev.participants?.[0]?.athlete?.displayName ?? ev.athletesInvolved?.[0]?.displayName ?? null
      const isEspnHome = ev.team?.id === homeComp?.id
      const side       = (isEspnHome === homeIsTeam1) ? 'home' : 'away'
      const ownGoal    = ev.ownGoal === true || (ev.type?.text ?? '').toLowerCase().includes('own goal')
      events.push({ minute, type, side, player, ownGoal })
    }

    // Fallback from scoreboard details when summary is sparse
    if (events.length === 0) {
      for (const d of comp.details ?? []) {
        const type = parseEventType(d.type?.text)
        if (!type) continue
        const minute     = parseMinute(d.clock?.displayValue)
        const player     = d.athletesInvolved?.[0]?.displayName ?? null
        const isEspnHome = d.team?.id === homeComp?.id
        const side       = (isEspnHome === homeIsTeam1) ? 'home' : 'away'
        const ownGoal    = (d.type?.text ?? '').toLowerCase().includes('own goal')
        events.push({ minute, type, side, player, ownGoal })
      }
    }

    events.sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0))

    // ── 6. Parse shots ────────────────────────────────────────────────────────
    const shots = []

    // Goals from keyEvents — accurate ESPN coordinates, includes own goals
    for (const ev of keyEvents) {
      if (!['Goal', 'Own Goal', 'Penalty Goal'].includes(ev.type?.text)) continue
      if (ev.fieldPositionX == null || ev.fieldPositionY == null) continue
      const isEspnHome = ev.team?.id === homeComp?.id
      const side   = (isEspnHome === homeIsTeam1) ? 'home' : 'away'
      const minute = Math.floor((ev.clock?.value ?? 0) / 60)
      const player = ev.participants?.[0]?.athlete?.displayName ?? null
      shots.push({ minute, type: 'goal', side, player, espnX: ev.fieldPositionX, espnY: ev.fieldPositionY, accurate: true })
    }

    // Non-goal shots from commentary — zone-approximated coordinates
    for (const item of summData.commentary ?? []) {
      const type = parseShotType(item.text ?? '')
      if (!type || type === 'goal') continue
      const side = parseShotSide(item.text, match.team1, match.team2)
      if (!side) continue
      const minute = item.time?.value != null ? Math.floor(item.time.value / 60) : null
      const player = parseShotPlayer(item.text)
      const { x: espnX, y: espnY } = zoneToCoords(item.text)
      shots.push({ minute, type, side, player, espnX, espnY, accurate: false })
    }

    shots.sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0))

    // ── 7. Shot stats from boxscore ───────────────────────────────────────────
    const homeRaw = { total: getStat(homeComp, 'totalShots'), onTarget: getStat(homeComp, 'shotsOnTarget'), blocked: getStat(homeComp, 'blockedShots') }
    const awayRaw = { total: getStat(awayComp, 'totalShots'), onTarget: getStat(awayComp, 'shotsOnTarget'), blocked: getStat(awayComp, 'blockedShots') }
    const stats   = homeIsTeam1 ? { home: homeRaw, away: awayRaw } : { home: awayRaw, away: homeRaw }

    const maxAge = match.status === 'finished' ? 300 : 30
    res.setHeader('Cache-Control', `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`)
    return res.status(200).json({ events, possession, elapsed, shots, stats })

  } catch {
    return res.status(200).json(EMPTY)
  }
}
