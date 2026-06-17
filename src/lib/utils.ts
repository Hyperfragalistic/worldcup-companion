import type { Match } from './database.types'

// ---------------------------------------------------------------------------
// Date / time formatting
// ---------------------------------------------------------------------------

/** '2026-06-20' → 'Saturday, June 20' */
export function formatMatchDate(dateStr: string): string {
  // Append T00:00:00 to parse as local midnight, not UTC midnight
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month:   'long',
    day:     'numeric',
  })
}

/** ISO timestamp → '1:00 PM UTC' */
export function formatKickoff(isoStr: string): string {
  return new Date(isoStr).toLocaleTimeString('en-US', {
    hour:       'numeric',
    minute:     '2-digit',
    timeZone:   'UTC',
    timeZoneName: 'short',
  })
}

/** ISO timestamp → 'Jun 12' */
export function formatShortDate(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    timeZone: 'UTC',
  })
}

/** ISO timestamp → relative label like 'Starts in 2h 15m' or 'Started 30m ago' */
export function relativeKickoff(isoStr: string): string {
  const diff = new Date(isoStr).getTime() - Date.now()
  const abs  = Math.abs(diff)
  const h    = Math.floor(abs / 3_600_000)
  const m    = Math.floor((abs % 3_600_000) / 60_000)

  if (diff > 0) {
    if (h > 0) return `Starts in ${h}h ${m}m`
    if (m > 0) return `Starts in ${m}m`
    return 'Starting soon'
  }
  if (h > 0) return `Started ${h}h ago`
  if (m > 0) return `Started ${m}m ago`
  return 'Just started'
}

/** ISO timestamp → 'Jun 20 · 7:00 PM UTC' */
export function formatFullKickoff(isoStr: string): string {
  return `${formatShortDate(isoStr)} · ${formatKickoff(isoStr)}`
}

// ---------------------------------------------------------------------------
// Match status
// ---------------------------------------------------------------------------

/** Derives real-time status from starts_at, falling back to the DB column. */
export function deriveStatus(match: Match): 'upcoming' | 'live' | 'finished' {
  if (match.status === 'finished') return 'finished'
  const start = new Date(match.starts_at).getTime()
  const now   = Date.now()
  const end   = start + 2 * 60 * 60 * 1000 // assume 2-hour matches
  if (now >= start && now <= end) return 'live'
  if (now > end)  return 'finished'
  return 'upcoming'
}

export function isLocked(match: Match): boolean {
  return new Date(match.starts_at).getTime() <= Date.now()
}

// ---------------------------------------------------------------------------
// Flag emoji lookup
// ---------------------------------------------------------------------------

const FLAGS: Record<string, string> = {
  Argentina:   '🇦🇷',
  Australia:   '🇦🇺',
  Belgium:     '🇧🇪',
  Brazil:      '🇧🇷',
  Cameroon:    '🇨🇲',
  Canada:      '🇨🇦',
  Croatia:     '🇭🇷',
  Denmark:     '🇩🇰',
  Ecuador:     '🇪🇨',
  England:     '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  France:      '🇫🇷',
  Germany:     '🇩🇪',
  Ghana:       '🇬🇭',
  Iran:        '🇮🇷',
  Japan:       '🇯🇵',
  Mexico:      '🇲🇽',
  Morocco:     '🇲🇦',
  Netherlands: '🇳🇱',
  Nigeria:     '🇳🇬',
  Poland:      '🇵🇱',
  Portugal:    '🇵🇹',
  Senegal:     '🇸🇳',
  'South Korea': '🇰🇷',
  Spain:       '🇪🇸',
  Switzerland: '🇨🇭',
  Tunisia:     '🇹🇳',
  USA:         '🇺🇸',
  Uruguay:     '🇺🇾',
  Wales:       '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
}

export function teamFlag(name: string): string {
  return FLAGS[name] ?? '🏳️'
}

// ---------------------------------------------------------------------------
// Country code → WC 2026 team name
// Keys are uppercase ISO 3166-1 alpha-2; 'GB-WLS' is the Wales special-case
// (Nominatim returns country_code 'GB' for all UK; Wales distinguished by state field).
// Countries not in the WC 2026 roster are intentionally absent.
// ---------------------------------------------------------------------------
export const WC_TEAM_BY_COUNTRY: Record<string, string> = {
  AR:     'Argentina',
  AU:     'Australia',
  BE:     'Belgium',
  BR:     'Brazil',
  CM:     'Cameroon',
  CA:     'Canada',
  HR:     'Croatia',
  DK:     'Denmark',
  EC:     'Ecuador',
  FR:     'France',
  DE:     'Germany',
  GH:     'Ghana',
  IR:     'Iran',
  JP:     'Japan',
  MX:     'Mexico',
  MA:     'Morocco',
  NL:     'Netherlands',
  NG:     'Nigeria',
  PL:     'Poland',
  PT:     'Portugal',
  SN:     'Senegal',
  KR:     'South Korea',
  ES:     'Spain',
  CH:     'Switzerland',
  TN:     'Tunisia',
  US:     'USA',
  UY:     'Uruguay',
  GB:     'England',
  'GB-WLS': 'Wales',
}

// ---------------------------------------------------------------------------
// Prediction scoring (exact = 3pts, correct result = 1pt)
// ---------------------------------------------------------------------------
export type PredictionResult = 'exact' | 'correct' | 'wrong' | 'pending'

export function scorePrediction(
  homeScore: number,
  awayScore: number,
  actualHome: number | null,
  actualAway: number | null,
): PredictionResult {
  if (actualHome === null || actualAway === null) return 'pending'
  if (homeScore === actualHome && awayScore === actualAway) return 'exact'
  const predResult = Math.sign(homeScore - awayScore)
  const realResult = Math.sign(actualHome - actualAway)
  return predResult === realResult ? 'correct' : 'wrong'
}
