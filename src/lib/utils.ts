import type { Match } from './database.types'

// ---------------------------------------------------------------------------
// Date / time formatting
// ---------------------------------------------------------------------------

/** '2026-06-20' → 'Jun 20' */
export function formatMatchDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    month:    'short',
    day:      'numeric',
    timeZone: 'UTC',
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
  // Only auto-finish by time if the match has actual scores — prevents hiding
  // Predict on matches that are past their slot but not yet marked finished in DB
  if (now > end && match.score1 !== null) return 'finished'
  return 'upcoming'
}

export function isLocked(match: Match): boolean {
  return new Date(match.starts_at).getTime() <= Date.now()
}

// ---------------------------------------------------------------------------
// Flag emoji lookup
// ---------------------------------------------------------------------------

const FLAGS: Record<string, string> = {
  // Group A
  Mexico:          '🇲🇽',
  'South Africa':  '🇿🇦',
  'South Korea':   '🇰🇷',
  Czechia:         '🇨🇿',
  // Group B
  Canada:          '🇨🇦',
  Bosnia:          '🇧🇦',
  Qatar:           '🇶🇦',
  Switzerland:     '🇨🇭',
  // Group C
  Brazil:          '🇧🇷',
  Morocco:         '🇲🇦',
  Haiti:           '🇭🇹',
  Scotland:        '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  // Group D
  USA:             '🇺🇸',
  Paraguay:        '🇵🇾',
  Australia:       '🇦🇺',
  Turkiye:         '🇹🇷',
  // Group E
  Germany:         '🇩🇪',
  Curacao:         '🇨🇼',
  'Ivory Coast':   '🇨🇮',
  Ecuador:         '🇪🇨',
  // Group F
  Netherlands:     '🇳🇱',
  Japan:           '🇯🇵',
  Sweden:          '🇸🇪',
  Tunisia:         '🇹🇳',
  // Group G
  Belgium:         '🇧🇪',
  Egypt:           '🇪🇬',
  Iran:            '🇮🇷',
  'New Zealand':   '🇳🇿',
  // Group H
  Spain:           '🇪🇸',
  'Cape Verde':    '🇨🇻',
  'Saudi Arabia':  '🇸🇦',
  Uruguay:         '🇺🇾',
  // Group I
  France:          '🇫🇷',
  Senegal:         '🇸🇳',
  Iraq:            '🇮🇶',
  Norway:          '🇳🇴',
  // Group J
  Argentina:       '🇦🇷',
  Algeria:         '🇩🇿',
  Austria:         '🇦🇹',
  Jordan:          '🇯🇴',
  // Group K
  Portugal:        '🇵🇹',
  'DR Congo':      '🇨🇩',
  Uzbekistan:      '🇺🇿',
  Colombia:        '🇨🇴',
  // Group L
  England:         '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  Croatia:         '🇭🇷',
  Ghana:           '🇬🇭',
  Panama:          '🇵🇦',
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
  // Group A
  MX: 'Mexico',
  ZA: 'South Africa',
  KR: 'South Korea',
  CZ: 'Czechia',
  // Group B
  CA: 'Canada',
  BA: 'Bosnia',
  QA: 'Qatar',
  CH: 'Switzerland',
  // Group C
  BR: 'Brazil',
  MA: 'Morocco',
  HT: 'Haiti',
  // Group D
  US: 'USA',
  PY: 'Paraguay',
  AU: 'Australia',
  TR: 'Turkiye',
  // Group E
  DE: 'Germany',
  CW: 'Curacao',
  CI: 'Ivory Coast',
  EC: 'Ecuador',
  // Group F
  NL: 'Netherlands',
  JP: 'Japan',
  SE: 'Sweden',
  TN: 'Tunisia',
  // Group G
  BE: 'Belgium',
  EG: 'Egypt',
  IR: 'Iran',
  NZ: 'New Zealand',
  // Group H
  ES: 'Spain',
  CV: 'Cape Verde',
  SA: 'Saudi Arabia',
  UY: 'Uruguay',
  // Group I
  FR: 'France',
  SN: 'Senegal',
  IQ: 'Iraq',
  NO: 'Norway',
  // Group J
  AR: 'Argentina',
  DZ: 'Algeria',
  AT: 'Austria',
  JO: 'Jordan',
  // Group K
  PT: 'Portugal',
  CD: 'DR Congo',
  UZ: 'Uzbekistan',
  CO: 'Colombia',
  // Group L
  GB:       'England',
  'GB-SCT': 'Scotland',
  HR:       'Croatia',
  GH:       'Ghana',
  PA:       'Panama',
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
