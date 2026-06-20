# DEVELOPMENT_ROADMAP.md — Current Status & Next Steps

---

## 1. Current Status (as of 2026-06-20)

### Working Well

- **Authentication**: Magic link fully functional. New user triggers auto-profile creation via DB trigger. Onboarding modal shows once per device and persists `onboarding_complete` permanently.
- **Schedule hub**: Full 104-match WC 2026 schedule. Today / My Team / Upcoming / All tabs with counts. Group/round filter chips, full-text search, date strip, list/grid view toggle — all URL-persisted.
- **Personalization**: Geo-location auto-suggests favorite team. My Team tab and "Relevant for You" section update immediately after onboarding (ProfileProvider fix).
- **Predictions**: Score stepper, optimistic updates, locked at kickoff (client + DB RLS), scoring display post-match (exact/correct/wrong).
- **Match chat**: Real-time Supabase subscription, 200-message history, auto-scroll, username display, own messages styled right-aligned.
- **Live match data**: `match-live.js` returns events, possession, elapsed clock, shots, stats from ESPN. Polls every 60s with tab-visibility pause. Date-bucket retry fix covers early-UTC matches.
- **Shot heatmap**: Full-pitch SVG with dual goals, per-side shot orientation, penalty arcs, center circle. Goal/saved/missed/blocked dot types.
- **Odds**: Seeded realistic decimal odds for all group-stage matches. Refreshes from The Odds API when key is configured.
- **News ticker**: BBC Sport RSS headlines on Schedule page.
- **Team rosters**: 48 teams with position grouping, player modal (headshot + stats + Wikipedia link).
- **Deployment**: Vercel with SPA rewrite and daily score-update cron.
- **Tests**: 7 Playwright test suites covering all major phases.

### Known Gaps

- No leaderboard / points aggregation across predictions
- No avatar upload (column exists in schema, no UI)
- No push notifications for live score changes
- No standings table (group standings calculation)
- No knockout bracket visualization
- `deriveStatus()` 2h window is approximate (extra time/penalties edge case)
- Roster data is static and manually maintained

---

## 2. Prioritized Next Features

### P0 — Correctness/Polish (ship before tournament heats up)

**Prediction results leaderboard**
- Aggregate `scorePrediction()` across all finished matches per user
- Store cumulative points in `profiles.prediction_points` (or compute on read)
- Leaderboard page or Schedule page section: top predictors ranked by points
- Effort: ~1 day

**Fix `deriveStatus()` 2h window for extra time**
- Replace hardcoded `2 * 60 * 60 * 1000` with a signal from the DB
- Option A: `matches.status` is `'live'` until explicitly set to `'finished'` by `refresh-scores`
- Option B: Add `matches.actual_end_at` column written when ESPN signals FULL_TIME
- Current behavior: match auto-"finishes" in client UI at `starts_at + 2h` even if in extra time. `deriveStatus()` already respects `status === 'finished'` first — so once `refresh-scores` writes `finished`, it's correct. The only gap is the ~30-min window between the 2h wall and when the cron/user visit triggers the update.
- Simplest fix: bump the window to 3h

**Refresh-scores date-bucket parity**
- `refresh-scores.js` uses UTC date but doesn't retry with prev day (unlike `match-live.js`)
- For early-UTC matches, `refresh-scores` won't update the score until the next cron
- Fix: apply the same `fetchScoreboard(dateUTC) || fetchScoreboard(datePrev)` pattern

### P1 — High-Value Features

**Group standings table**
- Compute from finished match scores: W/D/L/GF/GA/GD/Pts per team per group
- Display in a `/standings` page or as a modal from Schedule header
- No additional DB data needed — derive from `matches` table
- Effort: ~1 day

**Push notifications (PWA)**
- Service worker + Web Push API for goal alerts
- Subscribe users on match page, send via Vercel cron + Supabase subscription trigger
- Requires: Web Push VAPID keys (env vars), a `push_subscriptions` table, a notification serverless function
- Effort: ~2 days

**Prediction locking UI improvement**
- Currently shows a lock icon with text. Could show the match countdown timer until lock.
- After lock: show the user's prediction alongside the running score.
- Effort: ~0.5 days

**Avatar upload**
- `avatar_url` column already exists in `profiles`
- Add Supabase Storage bucket (`avatars/`), file picker in `ProfilePage`, image crop/resize client-side
- Display avatars in chat messages next to username
- Effort: ~1.5 days

### P2 — Nice-to-Have

**Knockout bracket visualization**
- SVG or CSS bracket showing Round of 32 → Final
- TBD match placeholders already in DB (team names `'TBD'`)
- Needs winner propagation logic as matches finish
- Effort: ~2 days

**Private match-day predictions reveal**
- Hide other users' predictions until kickoff; reveal all after the match starts
- Currently any authenticated user can read all predictions (RLS policy)
- Requires RLS policy change: `FOR SELECT USING (auth.uid() = user_id OR (SELECT starts_at FROM matches WHERE id = match_id) <= now())`

**Dark/light theme toggle**
- Currently hardcoded dark theme (`wc-dark` = `#0d1117`)
- Tailwind dark mode + CSS variable swap

**Internationalization**
- App is English-only. Could add Spanish/French/Portuguese for broader WC audience.

---

## 3. Technical Improvements

### Immediate

- **Extract `ESPN_NAME_MAP` to a shared module**: Currently duplicated in `match-live.js`, `refresh-scores.js`, and `update-scores.js`. A single `api/_espn-name-map.js` import would prevent drift.
- **ESPN event ID caching**: Store the ESPN event ID in `matches` after first resolution. Subsequent calls skip the scoreboard lookup entirely. Eliminates the date-bucket problem permanently.
- **`refresh-scores.js` date-bucket fix**: Apply same retry logic as `match-live.js`.
- **Error logging**: Currently errors are swallowed silently (`catch () => setLoading(false)`). Adding Vercel log drain or a `api_errors` Supabase table would make debugging easier.

### Medium-term

- **Code-split SchedulePage**: The bundle is 616 KB minified. SchedulePage, MatchPage, TeamPage each import heavy components (Framer Motion, ShotHeatmap SVG). Lazy loading routes with `React.lazy()` + `Suspense` would improve initial load.
- **Roster API instead of static file**: `rosters.ts` is ~1100 players as static JS. Move to a Supabase `roster_players` table with a `/api/roster?team=...` endpoint. Enables admin updates without code deploys.
- **Supabase Edge Functions**: Move score sync logic server-side (triggered by Supabase cron, not Vercel) to eliminate dependency on Vercel's cron infrastructure.
- **Rate limiting chat**: No spam protection currently. Add a server-side check: max 1 message per 2 seconds per user (can be done in RLS or a Vercel middleware).

### Architecture

- **Typed Supabase client**: Already using `createClient<Database>()` — ensure all queries go through the typed client (no raw `any` casts).
- **Test coverage gaps**: Phase 7 (team pages, roster) has no test suite. Phase 3 tests are partially outdated from the Phase 6 schedule redesign.
- **Storybook**: Components like `MatchCard`, `ShotHeatmap`, `LiveTimer` would benefit from isolated visual testing.

---

## 4. Open Questions

1. **Score source of truth**: Should `matches.score1/score2` be the authoritative score (written by cron), or should the client always re-derive from ESPN? Currently it's mixed — the DB has scores written by refresh-scores, but MatchPage shows the DB score (from `useMatch`) while the client can independently poll ESPN via `useMatchLive`.

2. **Prediction visibility**: Should users be able to see each other's predictions before kickoff? Currently yes (RLS allows all authenticated reads). Tournament conventions usually hide until kickoff.

3. **Roster accuracy commitment**: 48 teams × 26 players = 1248 entries to maintain. What's the acceptable staleness threshold? Injuries and last-minute call-ups happen frequently.

4. **Chat moderation**: No profanity filter, no report mechanism, no admin delete. Acceptable for an MVP; needs a plan before scaling.

5. **Knockout stage team propagation**: How to handle `TBD vs TBD` match entries as winners advance? Either a manual update flow or an automated winner-propagation function based on group standings.
