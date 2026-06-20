/**
 * GET /api/update-scores
 *
 * Fetches live/finished WC 2026 results from the ESPN scoreboard API (no key
 * required) and patches matches.score1, score2, status in Supabase.
 *
 * Called automatically by the Vercel cron (see vercel.json).
 * Can also be triggered manually: GET /api/update-scores?secret=<CRON_SECRET>
 *
 * Environment variables:
 *   CRON_SECRET        — shared secret that must match the Authorization header
 *                        or ?secret= query param. Set in Vercel dashboard.
 *   SUPABASE_URL       — e.g. https://xxx.supabase.co
 *   SUPABASE_SERVICE_KEY — service role key (bypasses RLS for UPDATE)
 *
 * Returns JSON: { updated: number, skipped: number, errors: string[] }
 */

const SUPABASE_URL        = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const CRON_SECRET          = process.env.CRON_SECRET

const SUPABASE_HEADERS = {
  apikey:        SUPABASE_SERVICE_KEY ?? '',
  Authorization: `Bearer ${SUPABASE_SERVICE_KEY ?? ''}`,
  'Content-Type': 'application/json',
  Prefer:         'return=minimal',
}

// ── ESPN team name → our DB team name ────────────────────────────────────────
// ESPN uses official FIFA names which sometimes differ from our seeded names.
const ESPN_NAME_MAP = {
  'United States':             'USA',
  'Türkiye':                   'Turkiye',
  'Turkey':                    'Turkiye',
  'Korea Republic':            'South Korea',
  'Republic of Korea':         'South Korea',
  "Côte d'Ivoire":             'Ivory Coast',
  "Cote d'Ivoire":             'Ivory Coast',
  'Congo DR':                  'DR Congo',
  'Congo, DR':                 'DR Congo',
  'Democratic Republic of the Congo': 'DR Congo',
  'Cabo Verde':                'Cape Verde',
  'Bosnia & Herzegovina':      'Bosnia',
  'Bosnia and Herzegovina':    'Bosnia',
  'Czech Republic':            'Czechia',
  'Czechia':                   'Czechia',
  'Curacao':                   'Curacao',
  'Curaçao':                   'Curacao',
}

function normalise(espnName) {
  return ESPN_NAME_MAP[espnName] ?? espnName
}

// ── ESPN status → our DB status ───────────────────────────────────────────────
function toDbStatus(espnStatusName) {
  if (!espnStatusName) return null
  const n = espnStatusName.toUpperCase()
  if (n.includes('FINAL') || n.includes('FULL_TIME') || n.includes('POST')) return 'finished'
  // Covers: STATUS_IN_PROGRESS, STATUS_HALFTIME, STATUS_FIRST_HALF, STATUS_SECOND_HALF,
  //         STATUS_EXTRA_TIME, STATUS_PENALTIES, STATUS_ABANDONED
  if (n.includes('IN_PROGRESS') || n.includes('HALF') || n.includes('EXTRA') ||
      n.includes('PENALT')      || n.includes('ABANDONED')) return 'live'
  return null  // STATUS_SCHEDULED or unknown — don't overwrite
}

// ── Fetch ESPN scoreboard for one date (YYYYMMDD) ─────────────────────────────
async function fetchEspnDay(dateStr) {
  const url = dateStr
    ? `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${dateStr}`
    : `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard`

  const res = await fetch(url, {
    headers: { 'User-Agent': 'WorldCupCompanion/1.0' },
  })
  if (!res.ok) throw new Error(`ESPN API ${res.status} for date ${dateStr ?? 'today'}`)
  const json = await res.json()
  return json.events ?? []
}

// ── Parse a single ESPN event into { home, away, score1, score2, status } ────
function parseEvent(event) {
  const comp        = event.competitions?.[0]
  if (!comp) return null

  const competitors = comp.competitors ?? []
  const home        = competitors.find(c => c.homeAway === 'home')
  const away        = competitors.find(c => c.homeAway === 'away')
  if (!home || !away) return null

  const espnStatus  = comp.status?.type?.name ?? ''
  const dbStatus    = toDbStatus(espnStatus)
  const score1      = parseInt(home.score ?? '', 10)
  const score2      = parseInt(away.score ?? '', 10)

  return {
    home:    normalise(home.team?.displayName ?? home.team?.name ?? ''),
    away:    normalise(away.team?.displayName ?? away.team?.name ?? ''),
    score1:  isNaN(score1) ? null : score1,
    score2:  isNaN(score2) ? null : score2,
    status:  dbStatus,
    rawDate: event.date,  // ISO string
  }
}

// ── Patch one match row in Supabase ──────────────────────────────────────────
async function patchMatch(matchId, score1, score2, status) {
  const body = {}
  if (score1 !== null) body.score1 = score1
  if (score2 !== null) body.score2 = score2
  if (status)          body.status = status

  if (Object.keys(body).length === 0) return

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/matches?id=eq.${matchId}`,
    { method: 'PATCH', headers: SUPABASE_HEADERS, body: JSON.stringify(body) },
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase PATCH failed for ${matchId}: ${text}`)
  }
}

// ── Fetch the matches we need to consider from Supabase ──────────────────────
// Only rows that aren't already finished (no point re-patching settled rows).
async function fetchPendingMatches() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/matches?status=neq.finished&select=id,team1,team2,starts_at`,
    { headers: { ...SUPABASE_HEADERS, Prefer: 'return=representation' } },
  )
  if (!res.ok) throw new Error(`Supabase fetch failed: ${await res.text()}`)
  return await res.json()  // [{ id, team1, team2, starts_at }]
}

// ── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // Auth — accept Vercel's built-in cron header OR a matching secret
  const authHeader    = req.headers['authorization'] ?? ''
  const querySecret   = req.query?.secret ?? ''
  const vercelCronHdr = req.headers['x-vercel-cron']  // set automatically by Vercel

  if (CRON_SECRET) {
    const bearerOk = authHeader === `Bearer ${CRON_SECRET}`
    const queryOk  = querySecret === CRON_SECRET
    if (!bearerOk && !queryOk && !vercelCronHdr) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(503).json({ message: 'Server misconfiguration: missing Supabase env vars' })
  }

  const results = { updated: 0, skipped: 0, errors: [] }

  try {
    // 1. Grab matches we actually need to update (non-finished rows)
    const pending = await fetchPendingMatches()
    if (pending.length === 0) {
      return res.status(200).json({ ...results, message: 'No pending matches' })
    }

    // Build a quick lookup: "TEAM1|TEAM2" → match row
    const lookup = new Map(pending.map(m => [`${m.team1}|${m.team2}`, m]))

    // 2. Determine which dates to fetch from ESPN.
    //    We fetch every distinct calendar date that has a pending match whose
    //    starts_at is in the past — so missed days are automatically caught up.
    const now       = Date.now()
    const fmt       = d => new Date(d).toISOString().slice(0, 10).replace(/-/g, '')
    const todayFmt  = fmt(now)

    // Unique YYYYMMDD strings for past pending matches + today.
    // Also include the prior day for early-UTC matches (ESPN buckets by
    // US-ET, so 00:00–04:59 UTC = prior ET date in ESPN's index).
    const datesToFetch = [
      ...new Set([
        ...pending
          .filter(m => new Date(m.starts_at).getTime() < now)
          .flatMap(m => {
            const d = fmt(m.starts_at)
            return new Date(m.starts_at).getUTCHours() < 5
              ? [d, fmt(new Date(m.starts_at).getTime() - 86_400_000)]
              : [d]
          }),
        todayFmt,
      ]),
    ].sort()

    const eventArrays = await Promise.all(
      datesToFetch.map(d => fetchEspnDay(d).catch(() => []))
    )
    const events = eventArrays.flat()

    // 3. Match ESPN events to our DB rows and patch
    for (const event of events) {
      const parsed = parseEvent(event)
      if (!parsed) continue

      // Try home|away then away|home (ESPN occasionally swaps labels)
      const dbMatch =
        lookup.get(`${parsed.home}|${parsed.away}`) ??
        lookup.get(`${parsed.away}|${parsed.home}`)

      if (!dbMatch) {
        results.skipped++
        continue
      }

      // Determine if home/away was swapped and flip scores accordingly
      const swapped = dbMatch.team1 === parsed.away
      const s1 = swapped ? parsed.score2 : parsed.score1
      const s2 = swapped ? parsed.score1 : parsed.score2

      // Skip if nothing has changed
      if (parsed.status === null) { results.skipped++; continue }

      try {
        await patchMatch(dbMatch.id, s1, s2, parsed.status)
        results.updated++
      } catch (e) {
        results.errors.push(e.message)
      }
    }
  } catch (err) {
    return res.status(500).json({ ...results, message: err.message })
  }

  return res.status(200).json(results)
}
