# COMPONENT_AND_HOOKS_REFERENCE.md — Component & Hook Reference

---

## 1. Context Providers

### `SupabaseProvider` (`src/providers/SupabaseProvider.tsx`)

**Scope**: Root of the app, wraps everything.

**State**: `{ session: Session | null, user: User | null, loading: boolean }`

**Behavior**:
- Calls `supabase.auth.getSession()` on mount to hydrate immediately (avoids flash-of-auth-page).
- Subscribes to `supabase.auth.onAuthStateChange()` for login/logout/token refresh.
- `loading` is `true` only during the initial session check (~100ms). All routes wait on this before rendering.

**Hook**: `useSupabase()` — throws if used outside provider.

---

### `ProfileProvider` (`src/providers/ProfileProvider.tsx`)

**Scope**: Inside `SupabaseProvider`, outside `BrowserRouter`. Mounted once per session.

**State**: `{ profile: Profile | null, loading: boolean, error: string | null, updateProfile: fn }`

**Behavior**:
- Fetches `profiles` row when `user` resolves (triggered by `useSupabase`).
- `updateProfile(updates)` applies an **optimistic update** immediately, then PATCHes Supabase and either confirms (server data) or rolls back (on error).
- Because it's mounted once at the top, all consumers share the same instance — `OnboardingModal` saving a favorite team is immediately visible to `SchedulePage` without a reload.

**Why it exists**: Before this provider, `useProfile()` was called independently in each page, creating isolated state copies. The onboarding → schedule state sync bug was the direct motivation for this refactor.

**Hook**: `useProfile()` in `src/hooks/useProfile.ts` is a one-line re-export of `useProfileContext()`. All consumers use `import { useProfile } from '../hooks/useProfile'` unchanged.

---

## 2. Custom Hooks

### `useMatches` (`src/hooks/useMatches.ts`)

**Used by**: `SchedulePage`

**Returns**: `{ matches: MatchWithPrediction[], loading, error, refetch }`

**Behavior**:
- Fetches all `matches` and user's `predictions` in parallel on mount.
- Merges them: each match gets a `my_prediction` field (own prediction row or null).
- Subscribes to `postgres_changes` on the `matches` table for `UPDATE` events — patches individual match rows in-place when scores/status change (Realtime push from `refresh-scores`).
- `refetch` is exposed but rarely used — Realtime handles live updates.

**Key pattern**: Uses `useCallback` for `fetchAll` with `[user]` dependency, then `useEffect(() => { fetchAll() }, [fetchAll])`. This ensures a fresh fetch when the user changes (login/logout) without creating effect dependency loops.

---

### `useMatch` (`src/hooks/useMatch.ts`)

**Used by**: `MatchPage`

**Returns**: `{ match: Match | null, prediction: Prediction | null, loading, error, savePrediction }`

**Behavior**:
- Fetches a single match + user's prediction in parallel on mount.
- `savePrediction(home, away)` checks `isLocked(match)` (client-side guard), applies optimistic update, then upserts with `onConflict: 'user_id,match_id'`.
- No Realtime subscription (single match details don't need live score updates — that's handled by `useScoreRefresh` → Supabase PATCH → `useMatches` Realtime in the background).

---

### `useChat` (`src/hooks/useChat.ts`)

**Used by**: `MatchPage`

**Returns**: `{ messages: Message[], sending, error, sendMessage, bottomRef }`

**Behavior**:
- Initial load: fetches last 200 messages for the match, ordered ascending.
- Realtime: subscribes to `postgres_changes INSERT` on `messages` with `filter: match_id=eq.${matchId}`.
- Deduplication guard: checks `prev.some(m => m.id === incoming.id)` before appending — prevents double-display when the current user's own insert triggers the Realtime event.
- `sendMessage()` inserts via Supabase client (user_id from session, username from profile passed in as argument).
- `bottomRef`: a `RefObject<HTMLDivElement>` attached to a sentinel div below the message list — `scrollIntoView({ behavior: 'smooth' })` auto-scrolls on new messages.

---

### `useMatchLive` (`src/hooks/useMatchLive.ts`)

**Used by**: `MatchPage`

**Returns**: `{ events: MatchEvent[], possession, elapsed, shots, stats, loading }`

**Behavior**:
- No-op if `status === 'upcoming'`.
- Fetches `/api/match-live?matchId={id}` on mount (for `finished`) and immediately + every 60s (for `live`).
- Skips fetch if `document.hidden` (tab in background) — avoids unnecessary ESPN calls.
- Clears interval on cleanup (React `useEffect` return).
- Returns the combined data shape from `api/match-live.js`.

**Types**: Imports `MatchEvent` from `useMatchEvents.ts` and `Shot`/`ShotStats` from `useMatchShots.ts`. These files are kept as type sources even though their hook functions are not used (the legacy poll hooks they contained were replaced by `useMatchLive`).

---

### `useScoreRefresh` (`src/hooks/useScoreRefresh.ts`)

**Used by**: `MatchPage`

**Returns**: void (side-effect only)

**Behavior**:
- Fires once on mount for any non-finished match (catches matches that just kicked off since the last cron).
- Polls every 5 minutes while `status === 'live'`.
- No-op if `document.hidden`.
- Calls `GET /api/refresh-scores?matchId={id}` — the serverless function writes to Supabase, triggering Realtime for all clients.

**Why not more frequent**: `useMatchLive` already polls ESPN every 60s for events/shots. `useScoreRefresh` serves a different purpose: writing scores **back to Supabase** so other clients (who aren't on the match page) receive Realtime updates. 5-minute cadence matches the cron.

---

### `useGeoLocation` (`src/hooks/useGeoLocation.ts`)

**Used by**: `OnboardingModal`, `SchedulePage`, `MatchPage`, `ProfilePage`

**Returns**: `{ countryCode, countryName, timezone, loading, error }`

**Behavior**:
- Calls `navigator.geolocation.getCurrentPosition()` once on mount. Cached for 5 minutes (`maximumAge: 300000`), 10s timeout.
- On success: parallel calls to Nominatim (country) and timeapi.io (timezone).
- Special case: `countryCode === 'GB'` → inspect `address.state` to distinguish Wales (`GB-WLS`) and Scotland (`GB-SCT`) from England (`GB`).
- `error` is set on permission denied, position unavailable, or timeout — consumers show a manual entry fallback.

**Important**: Called in multiple components independently. Each call is a separate `useState` / `useEffect` — not shared state. If multiple components need geo, they each trigger their own browser prompt check (though `maximumAge` prevents duplicate GPS requests).

---

### `useMatchOdds` (`src/hooks/useMatchOdds.ts`)

**Used by**: `OddsDisplay`

**Returns**: `{ odds: OddsData | null, loading, lastUpdated: string | null }`

**Behavior**:
- Reads `match.odds` from the match record already fetched by `useMatch`.
- On mount, fires a `POST /api/odds?matchId={id}` to attempt a live refresh.
- The POST response updates local state if successful; otherwise the seeded/cached DB value is shown.
- `loading` is false after the POST resolves (success or error).

---

### `useNews` (`src/hooks/useNews.ts`)

**Used by**: `SchedulePage` (→ `NewsTicker`)

**Returns**: `{ items: NewsItem[], loading, error }`

**Behavior**:
- Fetches `GET /api/news` once on mount.
- No polling — 15-minute CDN cache on the serverless function is sufficient.

---

## 3. Pages

### `SchedulePage` (`src/pages/SchedulePage.tsx`)

The main hub. Most complex component in the app.

**Key state (all URL-persisted via `useSearchParams`)**:
- `tab`: `'today' | 'myteam' | 'upcoming' | 'all'`
- `view`: `'list' | 'grid'`
- `q`: search query string
- `group`: group letter or round name filter

**Key derived state (all `useMemo`)**:
- `counts`: badge counts for each tab + `hasLive` flag
- `filtered`: matches after applying tab filter + search + group filter
- `byDate`: `Map<dateString, MatchWithPrediction[]>` for date-grouped rendering
- `relevantMatches`: up to 3 upcoming favorite-team matches for the "Relevant for You" section

**Auto-team save**: Uses `useRef(autoSaved)` flag + `useRef(updateProfile)` (stable ref to avoid effect re-runs) to auto-save the geo-detected team once, silently.

**Date strip**: Scrollable row per month. `dateChipRefs` maps date strings to DOM button elements for `scrollIntoView`. `sectionRefs` maps date strings to section elements for scroll-to-date behavior.

---

### `MatchPage` (`src/pages/MatchPage.tsx`)

**Render order** (inside scrollable div):
1. Match hero (flags, score or "vs", LiveTimer, kickoff time + local time, venue)
2. PossessionBar (conditional on `possession !== null`)
3. OddsDisplay
4. MatchTimeline (conditional on `events.length > 0`)
5. ShotHeatmap (conditional on `shots.length > 0 || stats !== null`)
6. Prediction form (locked → icon + text; unlocked → ScoreStepper form)
7. Chat messages (200 messages, real-time append)
8. Fixed bottom: chat input bar above BottomNav

**Prediction lock**: `isLocked(match)` = `starts_at ≤ Date.now()`. The prediction form shows a lock icon. The DB also enforces this via RLS.

**Score display**: Uses `match.score1 ?? '-'` — shows `-` until scores are written.

---

### `TeamPage` (`src/pages/TeamPage.tsx`)

Navigated to from match hero flags (`/team/:teamName`). Looks up `ROSTERS[teamName]` from static data. Grouped by position with color-coded badges. Player tap opens `PlayerModal` (bottom sheet) which fetches a headshot from TheSportsDB.

---

### `ProfilePage` (`src/pages/ProfilePage.tsx`)

Simple form with geo suggestion for favorite team. Uses the shared `useProfile()` context. `updateProfile()` writes to Supabase and propagates to all other consumers.

---

### `AuthPage` (`src/pages/AuthPage.tsx`)

Magic link email form. Reads `location.state.from` (set by `ProtectedRoute`) and redirects back after sign-in (OTP flow). Magic link always lands on `/`.

---

## 4. UI Components

### `MatchCard` (`src/components/MatchCard.tsx`)

Renders one match in the schedule list or grid. Two variants:
- `full`: shows teams, score/time, venue, prediction badge, group label
- `compact`: minimal grid version for 2-column layout

Props: `match: MatchWithPrediction`, `variant`, `highlight` (gold ring for favorite team), `timezone`.

Calls `deriveStatus(match)` for client-side status display. Status badge: red pulsing dot for live, "FT" for finished, formatted kickoff time for upcoming.

---

### `ShotHeatmap` (`src/components/ShotHeatmap.tsx`)

Full-pitch SVG shot visualization. Key geometry constants:

```ts
const VB_W = 100, FIELD_H = 152, GOAL_OVERHANG = 4, VB_H = 160
// Penalty area: 40.32m × 16.5m, centered on 68m pitch
const PA_LEFT = (68 - 40.32) / 2 / 68 * 100   // ≈ 20.4
// 6-yard box: 18.32m × 5.5m
const SB_LEFT = (68 - 18.32) / 2 / 68 * 100   // ≈ 36.5
// Goal: 7.32m wide
const GOAL_LEFT = (68 - 7.32) / 2 / 68 * 100  // ≈ 44.6
```

**Orientation**: Home attacks bottom, away attacks top. `toSvgY(espnX, side)` maps ESPN's attacking coordinate to the correct half of the pitch per team.

**Dot types**: goals (filled), saved (hollow ring), missed/blocked (hollow dashed ring).

**D-shape arcs**: Penalty arcs calculated from `ARC_R = 9.15m` circle centered on penalty spot, showing only the portion outside the penalty area.

---

### `LiveTimer` (`src/components/LiveTimer.tsx`)

Props: `{ startsAt: string, status, elapsed?: string | null }`

**Priority**: If `elapsed` is provided (from ESPN via `useMatchLive`), display it directly. Otherwise fall back to local computation (`computeDisplay(startsAt)` = minutes since kickoff, updated every 30s via `setInterval`).

For `upcoming`: shows `formatFullKickoff` or `relativeKickoff`.
For `finished`: shows "Full time".

---

### `MatchTimeline` (`src/components/MatchTimeline.tsx`)

Props: `{ events: MatchEvent[], team1: string, team2: string }`

Renders goals and cards in a vertical timeline, separated by home (left) and away (right). Color-coded: gold for home, blue for away. Goal vs card icons.

---

### `PossessionBar` (`src/components/PossessionBar.tsx`)

Props: `{ home, away, team1, team2 }`

Horizontal percentage bar with team names on each end. Animated width via Tailwind `transition-all duration-700`.

---

### `OddsDisplay` (`src/components/OddsDisplay.tsx`)

Uses `useMatchOdds(matchId, team1, team2)`. Shows decimal odds for home/draw/away as proportional colored bars. Optional `over_2_5` row. Shows "odds via The Odds API" attribution and `odds_last_updated` timestamp.

---

### `OnboardingModal` (`src/components/OnboardingModal.tsx`)

2-step animated form (`AnimatePresence` + `stepVariants` Framer Motion).

Step 1: Full name + username (500ms debounced uniqueness check against Supabase `profiles`).
Step 2: Country (geo pre-filled) + Favorite team (geo-suggested via `WC_TEAM_BY_COUNTRY`).

**Team pre-fill guard**: `if (favoriteTeam) return` — never overwrites a manual pick with a geo suggestion.

On submit: calls `updateProfile({ ..., onboarding_complete: true })` which writes to `ProfileProvider`'s shared state. `onComplete()` just closes the modal — the schedule page already has the new data.

---

### `WelcomeModal` (`src/components/WelcomeModal.tsx`)

Shows once per device (keyed on `localStorage.getItem('wc_welcome_${user.id}')`). Auto-advances to onboarding after 4 seconds or immediately on "Let's Go" tap.

---

### `NewsTicker` (`src/components/NewsTicker.tsx`)

Horizontally scrolling headline strip from `useNews()`. CSS animation (`@keyframes ticker-scroll`) moves headlines left continuously. Tapping a headline opens the BBC Sport link in a new tab.

---

### `BottomNav` (`src/components/BottomNav.tsx`)

3 items: Schedule (`/`), Profile (`/profile`). Uses `useLocation()` to highlight the active tab.

---

### `Layout` (`src/components/Layout.tsx`)

Wraps page content with `pt-safe` (iOS safe area top inset), `pb-safe` (bottom inset), and `BottomNav` at the bottom. Used by `SchedulePage` and `ProfilePage`. `MatchPage` and `TeamPage` use their own full-height layouts for more control.

---

## 5. Static Data

### `src/data/rosters.ts`

```ts
export type Position = 'GK' | 'DEF' | 'MID' | 'FWD'
export interface Player {
  name:     string
  position: Position
  number:   number
  club:     string
  caps?:    number
  goals?:   number
}
export const ROSTERS: Record<string, Player[]> = { ... }
```

48 WC 2026 teams × ~23 players each (~1100 players total). Key players only (not full 26-man squads for all teams). Data validated and corrected in an audit on 2026-06-18 — 15 corrections made (duplicate numbers, wrong positions, wrong clubs).

---

## 6. Utility Functions (`src/lib/utils.ts`)

### `deriveStatus(match: Match): 'upcoming' | 'live' | 'finished'`

```ts
if (match.status === 'finished') return 'finished'
const start = new Date(match.starts_at).getTime()
const now   = Date.now()
const end   = start + 2 * 60 * 60 * 1000
if (now >= start && now <= end) return 'live'
if (now > end) return 'finished'
return 'upcoming'
```

Key behavior: once past the 2h window, always returns `'finished'` **regardless of `score1 === null`**. This prevents the stale-upcoming bug where games with no ESPN score data stayed in the Upcoming tab permanently.

### `isLocked(match: Match): boolean`

```ts
return new Date(match.starts_at).getTime() <= Date.now()
```

Used for prediction form locking. Matches the DB RLS policy condition.

### `scorePrediction(homeScore, awayScore, actualHome, actualAway): PredictionResult`

Returns `'exact'` (3pts), `'correct'` (1pt, correct result direction), `'wrong'`, or `'pending'`.

### `teamFlag(name: string): string`

Lookup table mapping team names to emoji flags. Returns `'🏳️'` for unknown teams. Scotland and England use regional flag emoji.

### `WC_TEAM_BY_COUNTRY: Record<string, string>`

Maps uppercase ISO 3166-1 alpha-2 codes to WC 2026 team names. `GB-WLS` → Wales (not in WC 2026 — intentionally absent). `GB-SCT` → Scotland.
