/**
 * GET /api/refresh-scores?matchId=<uuid>
 *
 * Client-callable score refresh. No auth required — reads only from ESPN's
 * public unofficial API and writes match scores/status to Supabase.
 * Safe to expose: no secrets flow to the client and the write surface is
 * limited to score1, score2, status on already-known match rows.
 *
 * Targeted to a single match's date so each page-open triggers one ESPN
 * request rather than a full sweep. The cron endpoint (/api/update-scores)
 * handles the full daily sweep.
 */

const SUPABASE_URL         = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

const SUPABASE_HEADERS = {
  apikey:         SUPABASE_SERVICE_KEY ?? '',
  Authorization:  `Bearer ${SUPABASE_SERVICE_KEY ?? ''}`,
  'Content-Type': 'application/json',
  Prefer:         'return=minimal',
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

function normalise(espnName) {
  return ESPN_NAME_MAP[espnName] ?? espnName
}

function toDbStatus(espnStatusName) {
  if (!espnStatusName) return null
  const n = espnStatusName.toUpperCase()
  if (n.includes('FINAL') || n.includes('FULL_TIME') || n.includes('POST')) return 'finished'
  if (n.includes('IN_PROGRESS') || n.includes('HALF') || n.includes('EXTRA') ||
      n.includes('PENALT')      || n.includes('ABANDONED')) return 'live'
  return null
}

async function fetchEspnDay(dateStr) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${dateStr}`
  const res = await fetch(url, { headers: { 'User-Agent': 'WorldCupCompanion/1.0' } })
  if (!res.ok) return []
  const json = await res.json()
  return json.events ?? []
}

function parseEvent(event) {
  const comp        = event.competitions?.[0]
  if (!comp) return null
  const competitors = comp.competitors ?? []
  const home        = competitors.find(c => c.homeAway === 'home')
  const away        = competitors.find(c => c.homeAway === 'away')
  if (!home || !away) return null
  const espnStatus  = comp.status?.type?.name ?? ''
  const score1      = parseInt(home.score ?? '', 10)
  const score2      = parseInt(away.score ?? '', 10)
  return {
    home:   normalise(home.team?.displayName ?? home.team?.name ?? ''),
    away:   normalise(away.team?.displayName ?? away.team?.name ?? ''),
    score1: isNaN(score1) ? null : score1,
    score2: isNaN(score2) ? null : score2,
    status: toDbStatus(espnStatus),
  }
}

async function patchMatch(matchId, score1, score2, status) {
  const body = {}
  if (score1 !== null) body.score1 = score1
  if (score2 !== null) body.score2 = score2
  if (status)          body.status = status
  if (Object.keys(body).length === 0) return
  await fetch(`${SUPABASE_URL}/rest/v1/matches?id=eq.${matchId}`, {
    method: 'PATCH', headers: SUPABASE_HEADERS, body: JSON.stringify(body),
  })
}

export default async function handler(req, res) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(503).json({ message: 'Server misconfiguration' })
  }

  const matchId = req.query.matchId
  if (!matchId) {
    return res.status(400).json({ message: 'matchId required' })
  }

  // 1. Fetch the target match to get its date and confirm it isn't finished
  const matchRes = await fetch(
    `${SUPABASE_URL}/rest/v1/matches?id=eq.${matchId}&select=id,team1,team2,starts_at,status`,
    { headers: { ...SUPABASE_HEADERS, Prefer: 'return=representation' } },
  )
  const [target] = await matchRes.json()

  if (!target) return res.status(404).json({ message: 'Match not found' })
  if (target.status === 'finished') {
    return res.status(200).json({ updated: 0, skipped: 1, message: 'Match already finished' })
  }

  // 2. Fetch all non-finished matches on the same date from Supabase
  const datePrefix = new Date(target.starts_at).toISOString().slice(0, 10)
  const dateStr    = datePrefix.replace(/-/g, '')

  const dayRes = await fetch(
    `${SUPABASE_URL}/rest/v1/matches?starts_at=gte.${datePrefix}T00:00:00Z&starts_at=lt.${datePrefix}T23:59:59Z&status=neq.finished&select=id,team1,team2`,
    { headers: { ...SUPABASE_HEADERS, Prefer: 'return=representation' } },
  )
  const dayMatches = await dayRes.json()
  const lookup = new Map(dayMatches.map(m => [`${m.team1}|${m.team2}`, m]))

  // 3. Fetch ESPN scoreboard for that date and patch matching rows
  const events  = await fetchEspnDay(dateStr)
  const results = { updated: 0, skipped: 0 }

  for (const event of events) {
    const parsed = parseEvent(event)
    if (!parsed || parsed.status === null) { results.skipped++; continue }

    const dbMatch =
      lookup.get(`${parsed.home}|${parsed.away}`) ??
      lookup.get(`${parsed.away}|${parsed.home}`)

    if (!dbMatch) { results.skipped++; continue }

    const swapped = dbMatch.team1 === parsed.away
    await patchMatch(dbMatch.id, swapped ? parsed.score2 : parsed.score1,
                                 swapped ? parsed.score1 : parsed.score2, parsed.status)
    results.updated++
  }

  return res.status(200).json(results)
}
