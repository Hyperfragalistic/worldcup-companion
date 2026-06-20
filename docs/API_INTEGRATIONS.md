# API_INTEGRATIONS.md — External API & Serverless Function Reference

---

## 1. ESPN Scoreboard API (Primary Live Data Source)

**Base URL**: `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/`
**Auth**: None required (unofficial public API)
**Rate limit**: Not documented; `User-Agent` header set to `WorldCupCompanion/1.0`

### 1.1 Scoreboard Endpoint

```
GET /scoreboard?dates=YYYYMMDD
```

Returns all matches ESPN has for that calendar date. Used by:
- `api/match-live.js` — to find the ESPN event ID for a specific match
- `api/refresh-scores.js` — to patch scores back to Supabase
- `api/update-scores.js` — full sweep across all pending match dates

**Critical: Date-bucket behavior**

ESPN indexes matches by **US Eastern Time (ET) local date**, not UTC. A match starting at `01:00 UTC June 20` (= `9 PM ET June 19`) is filed under `20260619` in ESPN's API.

**Fix implemented in `api/match-live.js`** (commit `408da9e`):

```js
const dateUTC  = new Date(match.starts_at).toISOString().slice(0, 10).replace(/-/g, '')
const datePrev = new Date(startMs - 86_400_000).toISOString().slice(0, 10).replace(/-/g, '')

let espnEvent = findInEvents(await fetchScoreboard(dateUTC))
if (!espnEvent && datePrev !== dateUTC) {
  espnEvent = findInEvents(await fetchScoreboard(datePrev))
}
```

This retry is in `match-live.js` only. `refresh-scores.js` and `update-scores.js` use a simpler approach: they fetch both the match's UTC date **and** today's date, which naturally catches most cases. For `update-scores.js`, all distinct past-pending dates are fetched — it catches any missed day automatically.

**Matches affected by UTC vs ET mismatch** (kicks off 00:00–05:59 UTC):
- Any match in the 9 PM–midnight ET prime-time window
- For WC 2026 US host schedule, this is common for West Coast late games

### 1.2 Summary Endpoint

```
GET /summary?event={espnEventId}
```

Returns detailed match data for a specific event. Used by `api/match-live.js` after finding the event ID from the scoreboard.

Key fields extracted:
- `keyEvents[]` — goals, cards, own goals with `fieldPositionX/Y` coordinates and clock values
- `commentary[]` — all shot attempts with zone-description text (for non-goal shots)
- Statistics from scoreboard competitors (possession %, total shots, on-target, blocked)

### 1.3 Team Name Mapping

ESPN uses official FIFA names which differ from the app's canonical DB names. Both `match-live.js` and `refresh-scores.js` maintain an `ESPN_NAME_MAP`:

```js
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
```

`teamsMatch()` in `match-live.js` also uses substring inclusion (`na.includes(nb) || nb.includes(na)`) as a fuzzy fallback. `refresh-scores.js` and `update-scores.js` use exact string matching after normalization.

### 1.4 Shot Coordinate System

ESPN's `fieldPositionX` and `fieldPositionY` for goal events:
- `espnX`: 50–100, where 100 = the goal being attacked (attacking direction)
- `espnY`: 0–100, where 50 = centre of pitch width

For non-goal shots, coordinates are approximated from commentary text zone descriptions (e.g., "centre of the box", "right side of the penalty area") via `zoneToCoords()` in `match-live.js`.

`ShotHeatmap.tsx` remaps these coordinates onto a full-pitch SVG (`viewBox="0 0 100 160"`):
- Home team attacks the **bottom** goal (y increases toward bottom)
- Away team attacks the **top** goal (y is inverted)
- `toSvgY(espnX, side)` handles the per-team remapping

### 1.5 Error Handling

All ESPN calls use `fetchWithTimeout(url, options, 5000)` — a 5-second abort controller timeout. On any error (network, timeout, non-200), `match-live.js` returns `EMPTY = { events: [], possession: null, elapsed: null, shots: [], stats: null }`. The client degrades gracefully (heatmap and timeline simply don't render when empty).

---

## 2. `/api/match-live` — Unified Live Data Endpoint

**Method**: `GET /api/match-live?matchId={uuid}`
**Auth**: None (relies on matchId being a valid UUID from the DB)
**Cache-Control**: `s-maxage=30` for live, `s-maxage=300` for finished

**Full data flow**:

```
1. Fetch match record from Supabase (team1, team2, starts_at, status)
2. If status === 'upcoming' → return EMPTY immediately
3. Compute UTC date string + prev-day string
4. Fetch ESPN scoreboard for UTC date → search for matching event
5. If not found, fetch ESPN scoreboard for prev date → search again
6. If still not found → return EMPTY
7. Extract elapsed clock + possession from scoreboard competitor stats
8. Fetch ESPN /summary?event={id} for keyEvents + commentary
9. Parse keyEvents → goals + cards events array
10. Fallback: if keyEvents empty, parse comp.details from scoreboard
11. Parse keyEvents goals (with ESPN fieldPositionX/Y coordinates)
12. Parse commentary lines for non-goal shots (zone-approximated coordinates)
13. Parse boxscore stats (totalShots, shotsOnTarget, blockedShots)
14. Return { events, possession, elapsed, shots, stats }
```

**Response shape**:

```json
{
  "events": [
    { "minute": 23, "type": "goal", "side": "home", "player": "Matheus Cunha", "ownGoal": false }
  ],
  "possession": { "home": 62, "away": 38 },
  "elapsed": "67'",
  "shots": [
    { "minute": 23, "type": "goal", "side": "home", "player": "Matheus Cunha", "espnX": 94, "espnY": 52, "accurate": true }
  ],
  "stats": {
    "home": { "total": 12, "onTarget": 5, "blocked": 2 },
    "away": { "total": 4, "onTarget": 1, "blocked": 1 }
  }
}
```

---

## 3. `/api/refresh-scores` — Client-Triggered Score Sync

**Method**: `GET /api/refresh-scores?matchId={uuid}`
**Auth**: None (intentionally open — write surface is limited)
**Cache-Control**: None (never cached)

Called by `useScoreRefresh` on mount and every 5 minutes while live. Fetches the ESPN scoreboard for the match's date, finds all non-finished matches on that date, patches Supabase with updated scores and status. The Supabase PATCH triggers a Realtime `UPDATE` event, which propagates to all connected clients via `useMatches`.

**Why this exists separately from `update-scores`**: The cron only runs once daily. For live matches, scores need to update within minutes. This client-triggered endpoint ensures any user watching a match drives near-real-time score updates for all other connected clients.

---

## 4. `/api/update-scores` — Daily Cron Sweep

**Method**: `GET /api/update-scores`
**Auth**: Vercel cron header (`x-vercel-cron`) OR `?secret=<CRON_SECRET>` OR `Authorization: Bearer <CRON_SECRET>`
**Schedule**: `0 5 * * *` UTC (5 AM daily)

Fetches all non-finished matches from Supabase, determines which past calendar dates need ESPN lookups, fetches those dates in parallel, matches by team name, and patches all scores/statuses. Handles:
- Missed previous days (fetches all distinct dates with pending past matches)
- Home/away swap detection (ESPN sometimes lists home/away reversed from our DB)

---

## 5. `/api/odds` — Betting Odds Proxy

**Method**: `POST /api/odds?matchId={uuid}`
**Auth**: None (protected by `ODDS_API_KEY` being server-side only)
**External**: The Odds API (`https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds/`)

**Flow**:
1. Fetch match record from Supabase
2. If no `ODDS_API_KEY` → return 501 (client falls back to cached `matches.odds`)
3. Fetch all WC 2026 odds from The Odds API (EU region, h2h + totals markets, decimal format)
4. Find matching event by team name substring matching with `ODDS_NAME_MAP`
5. Extract home_win/draw/away_win from h2h market, over_2_5 from totals
6. PATCH `matches.odds` and `matches.odds_last_updated` in Supabase
7. Return `{ odds, odds_last_updated }`

The client hook `useMatchOdds` reads odds from the match record (already loaded by `useMatch`). It POSTs to `/api/odds` to attempt a refresh, then falls back to whatever is in the DB.

**Graceful degradation**: If `ODDS_API_KEY` is absent, the DB cache (seeded realistic odds for all 48 group-stage teams) is shown. The user sees odds either way.

---

## 6. `/api/news` — BBC Sport RSS Proxy

**Method**: `GET /api/news`
**Auth**: None
**External**: `https://feeds.bbci.co.uk/sport/football/rss.xml`
**Cache-Control**: `s-maxage=900, stale-while-revalidate=1800` (15 min CDN cache)

Fetches BBC Sport's football RSS feed, parses XML to JSON with a minimal no-dependency parser, returns up to 12 items. Used by `NewsTicker` on `SchedulePage`.

The proxy is necessary to avoid browser CORS restrictions when fetching an RSS feed directly.

---

## 7. `/api/player-headshot` — TheSportsDB Headshot Lookup

**Method**: `GET /api/player-headshot?name={playerName}`
**Auth**: None (TheSportsDB free tier)
**External**: `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p={name}`

Returns `{ thumb: url | null }`. Used by `TeamPage`'s `PlayerModal` when a player card is tapped. Falls back gracefully to a position-colored jersey-number avatar circle on null.

**Note**: TheSportsDB's API v1 with key `3` is a public free tier. Response quality varies — not all players have headshots.

---

## 8. Browser Geolocation + Country-to-Team Mapping

### `useGeoLocation` hook

```
navigator.geolocation.getCurrentPosition()
→ { coords.latitude, coords.longitude }
→ (parallel) Nominatim OSM reverse geocode + timeapi.io timezone lookup
→ { countryCode, countryName, timezone }
```

**Nominatim**: `https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}`
- Returns `address.country_code` (ISO 3166-1 alpha-2, uppercased)
- Special case: `GB` + `address.state === 'Wales'` → `GB-WLS`; `address.state === 'Scotland'` → `GB-SCT`

**timeapi.io**: `https://timeapi.io/api/time/current/coordinate?latitude={lat}&longitude={lon}`
- Returns `timeZone` (IANA format, e.g. `America/New_York`)
- Used in `MatchPage` to show local kickoff time alongside UTC

### `WC_TEAM_BY_COUNTRY` mapping (`src/lib/utils.ts`)

Maps ISO 3166-1 alpha-2 codes → WC 2026 team names:

```ts
export const WC_TEAM_BY_COUNTRY: Record<string, string> = {
  MX: 'Mexico', ZA: 'South Africa', KR: 'South Korea', /* ... */
  GB: 'England', 'GB-SCT': 'Scotland', /* ... */
}
```

48 teams mapped. Countries not in WC 2026 are intentionally absent (returns `undefined`, and the auto-suggest is silently skipped).

### Cascade: geo → favorite team auto-save

In `SchedulePage`, if the user has no `favorite_team` set and geo resolves, the team is auto-saved via `updateProfile()` without user interaction:

```ts
const autoSaved = useRef(false)
useEffect(() => {
  if (autoSaved.current || profile === null || favoriteTeam) return
  if (geo.loading || !geo.countryCode) return
  const detected = WC_TEAM_BY_COUNTRY[geo.countryCode]
  if (!detected) return
  autoSaved.current = true
  updateRef.current({ favorite_team: detected })
}, [profile, favoriteTeam, geo.loading, geo.countryCode])
```

`autoSaved.current` prevents re-firing. `updateRef` prevents the effect from depending on `updateProfile` (which changes identity each render due to `useCallback` depending on `profile`).

---

## 9. Caching Strategy Summary

| Endpoint | Cache | Mechanism |
|---|---|---|
| `/api/match-live` (live) | 30s | `Cache-Control: s-maxage=30` on Vercel CDN |
| `/api/match-live` (finished) | 300s | `Cache-Control: s-maxage=300` |
| `/api/news` | 900s | `Cache-Control: s-maxage=900, stale-while-revalidate=1800` |
| `/api/refresh-scores` | None | Never cached — always hits ESPN |
| `/api/update-scores` | None | Never cached — cron handler |
| `/api/odds` | None | Response not cached; writes to Supabase DB cache |
| Odds data | Indefinite | `matches.odds` JSONB column in Supabase; updated on match page visit |
| Match list | Session | `useMatches` holds in React state; Realtime patches on change |
| Profile | Session | `ProfileProvider` holds in React context |

---

## 10. Future-Proofing Recommendations

1. **ESPN name map**: When new teams qualify or ESPN changes display names for knockouts (e.g. "Group C Winner"), add entries to `ESPN_NAME_MAP` in all three files (`match-live.js`, `refresh-scores.js`, `update-scores.js`). Consider extracting to a shared module.

2. **Date-bucket edge case**: The current fix retries `date - 1 day`. For matches starting after 23:00 UTC (rare), ESPN might file them on `date + 1 day`. A more robust solution would try all three dates, or use the ESPN event ID stored in the DB.

3. **Odds refresh cadence**: Odds currently only refresh when a user visits a match page. For pre-match odds movement, a cron-based odds sweep (similar to `update-scores`) would give all users current data.

4. **ESPN rate limiting**: The API is undocumented and unofficial. If ESPN adds rate limiting or changes the API structure, `match-live.js` will return `EMPTY` silently. Consider adding error logging to a Supabase table or Vercel log drain.

5. **TheSportsDB**: The free tier (`key=3`) has limited search accuracy. Consider TheSportsDB's paid tiers or a different headshot source for production.
