# HANDOFF_NOTES_FOR_NEXT_AI.md — Guidance for the Next Developer

This document is written specifically for an AI developer (or engineer) picking up this codebase cold. It captures the non-obvious patterns, the quirks that burned previous development cycles, and the rules of thumb for working in this repo safely.

---

## 1. How to Orient Yourself in 5 Minutes

Read these files in order:
1. `src/lib/database.types.ts` — the full data model in one file
2. `src/App.tsx` — provider tree, routing, onboarding gate (50 lines)
3. `api/match-live.js` — the most complex serverless function; understanding it unlocks 80% of the live feature behavior
4. `src/lib/utils.ts` — `deriveStatus()` and `isLocked()` are called everywhere

Run `npm run build` before and after any change. TypeScript errors surface immediately and the build is fast (~600ms).

---

## 2. Patterns to Follow

### Shared profile state via `ProfileProvider`
All profile reads must go through `useProfile()` (which is `useProfileContext()`). Never call `supabase.from('profiles').select(...)` directly in a component or hook. The provider fetches once, all consumers share the result, and `updateProfile()` writes through the same shared state.

If you add a new page/component that needs profile data, just add `const { profile } = useProfile()` — no new fetch needed.

### Optimistic updates for user-facing writes
Both `updateProfile()` and `savePrediction()` follow this pattern:
```ts
const previous = state
setState(prev => ({ ...prev, ...updates }))  // optimistic
const { data, error } = await supabase...    // actual write
if (error) setState(previous)                // rollback
else       setState(data)                    // confirm with server data
```
Follow this for any new user-facing write operation. Never wait for the network before updating the UI.

### URL-persisted state in SchedulePage
Tab, search, group filter, and view are in `useSearchParams()`, not `useState()`. All mutations must go through `setParams()`. Do not introduce local state for any of these — it would break URL sharing and browser back/forward.

The debounce ref pattern for search:
```ts
const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
if (debounceRef.current) clearTimeout(debounceRef.current)
debounceRef.current = setTimeout(() => { ... }, 300)
```

### `useEffect` dependency lint exceptions
Several effects intentionally omit dependencies (with `// eslint-disable-next-line react-hooks/exhaustive-deps`). Read the comment before these lines — they explain the invariant being maintained. Do not "fix" these by adding the missing dependency without understanding why it was omitted.

### `updateRef` pattern (SchedulePage)
```ts
const updateRef = useRef(updateProfile)
useEffect(() => { updateRef.current = updateProfile }, [updateProfile])
```
This gives `useEffect` a stable ref to the latest `updateProfile` function without including `updateProfile` itself as a dependency (which would re-run the auto-save effect on every profile change). Do not replace this with a direct `updateProfile` call inside the effect.

---

## 3. The ESPN API — What You Must Know

### Name mapping is critical
The app maintains `ESPN_NAME_MAP` in three files. If you add a new serverless function that calls ESPN, copy the full map. If a team name mismatch causes `espnEvent` to be `undefined`, the function returns `EMPTY` silently — there's no error in logs.

To debug a name mismatch:
```bash
curl "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=YYYYMMDD" \
  | python3 -c "import sys,json; [print(e['name']) for e in json.load(sys.stdin)['events']]"
```
Compare the ESPN `displayName` against your DB `team1`/`team2` values.

### Date-bucket rule
**Never query ESPN with only the UTC date.** Always retry with `UTC - 1 day`. Any match starting between 00:00–05:59 UTC is indexed by ESPN under the prior calendar day (US Eastern Time).

`match-live.js` has this fix. `refresh-scores.js` does **not** (known gap — see DEVELOPMENT_ROADMAP.md P0).

### ESPN summary endpoint has variable data quality
For very recent matches (within minutes of final whistle), `keyEvents` may be sparse or empty. `match-live.js` has a fallback: if `keyEvents` yields no goal/card events, it tries `comp.details` from the scoreboard response. This covers the gap for about 10-15 minutes post-match.

### The `fieldPositionX/Y` coordinate system
ESPN shot coordinates: `espnX` = 50–100 (higher = closer to goal being attacked), `espnY` = 0–100 (50 = centre width). These are **from the attacking team's perspective**. `ShotHeatmap` uses `toSvgY(espnX, side)` to map each shot to the correct half of the pitch based on which team shot it.

---

## 4. Supabase — Rules of Engagement

### Service key usage
The `SUPABASE_SERVICE_KEY` bypasses all RLS. It lives only in Vercel environment variables and is used only in `api/*.js` files. Never import it into frontend code or `src/`. The frontend exclusively uses the anon key (`VITE_SUPABASE_ANON_KEY`).

### RLS is the real prediction lock
`useMatch.savePrediction()` has a client-side `isLocked()` guard, but the DB RLS policy is the authoritative enforcement. Test prediction behavior against the DB directly, not just the UI. A user could bypass the client check via DevTools.

### Realtime channel cleanup
Every `supabase.channel(...)` call **must** have a corresponding cleanup in the `useEffect` return:
```ts
return () => { supabase.removeChannel(ch) }
```
Forgetting this leaks WebSocket connections. Check for this in any new hook.

### `handle_new_user()` trigger
New users get a `profiles` row automatically. You never need to INSERT into `profiles` from client code. If you see a missing profile, check if the trigger is attached: `SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created'`.

---

## 5. Validating Changes

### Before any commit
```bash
npm run build   # TypeScript check + Vite build — must pass clean
```

### After changes to serverless functions
Test directly with curl:
```bash
# Replace with a real match UUID from the DB
curl "https://worldcup-companion.vercel.app/api/match-live?matchId=<uuid>"
curl "https://worldcup-companion.vercel.app/api/refresh-scores?matchId=<uuid>"
```
Or locally:
```bash
npx vercel dev   # starts Vite + serverless functions together on localhost:3000
```

### After changes to SchedulePage or profile handling
1. Delete the test user via Supabase admin API (see the delete-user pattern used throughout this session)
2. Sign in fresh with magic link
3. Verify: WelcomeModal → OnboardingModal (geo suggestion shows) → pick a non-geo-default team → "Let's Go!" → Schedule page immediately shows correct team in header + My Team tab count

### After changes to match-live.js
Find a live or recently-finished match with a known score and event list, hit `/api/match-live?matchId=<uuid>`, verify `events` and `shots` arrays are non-empty. Brazil vs Haiti (UUID: `b571fdd3-6f87-4830-9d6f-6ce01eb3bc4f`) is a good test case — it has 37 ESPN key events and kicks off at 01:00 UTC, making it the canonical date-bucket test.

### Realtime verification
Open two browser windows to the same match page. Send a chat message in one — it should appear in the other within ~1 second. Then trigger `/api/refresh-scores` manually and verify the score updates without a page reload.

---

## 6. Common Pitfalls to Avoid

### Don't call `useProfile()` outside `ProfileProvider`
It throws: `"useProfileContext must be inside ProfileProvider"`. All pages are inside `ProfileProvider` (see `App.tsx`). But if you add a standalone test component or render something outside the router tree, you'll hit this.

### Don't add `updateProfile` as a `useEffect` dependency in SchedulePage
`updateProfile` changes identity on every render (it's a `useCallback` that depends on `profile`, which updates after every successful save). Including it as a dependency would cause infinite loops. Use the `updateRef` pattern already in place.

### Don't forget `deriveStatus()` vs `match.status`
The DB `status` column can be stale. Always use `deriveStatus(match)` for client-side display decisions. Use `match.status` only when you specifically want the DB-persisted value (e.g., in `useMatchLive` to decide whether to fetch ESPN data).

### Don't query ESPN with `https://` on localhost without a proxy
Local Vite dev server can't proxy ESPN directly. Use `npx vercel dev` which runs the serverless functions and can call external APIs. For pure frontend changes, `npm run dev` is fine.

### Don't commit `.env.test`
Running `vercel env pull .env.test` creates a file containing `VERCEL_OIDC_TOKEN` which must never be committed. It's in `.gitignore`. If you accidentally stage it, unstage immediately: `git restore --staged .env.test`.

### Don't add ESPN calls to `update-scores.js` without also adding to `refresh-scores.js`
The two files maintain parallel logic. If you add a new ESPN name alias or date-handling logic to one, add it to the other to avoid divergence.

### The shot heatmap `PA_LEFT` centering formula
```ts
const PA_LEFT = (68 - 40.32) / 2 / 68 * 100  // CORRECT — divides by 2 to center
```
A previous bug had this without the `/ 2`, placing all boxes on the right edge. If you touch the heatmap geometry, verify the formula preserves the `/ 2` for PA, SB, and GOAL constants.

---

## 7. Pragmatic vs. Production-Hardened Areas

| Area | Current approach | Production would need |
|---|---|---|
| ESPN integration | Unofficial API, no key, undocumented | Official FIFA data partner API or SportsRadar |
| Score sync | Client-triggered (useScoreRefresh) + daily cron | WebSocket or server-side event listener; sub-minute updates |
| Chat at scale | Supabase Realtime (200 concurrent limit on free tier) | Dedicated WebSocket service (Ably, Pusher) |
| Roster data | Static TypeScript file | DB-backed with admin UI for updates |
| Error handling | Silent catch blocks | Structured error logging + alerting |
| Rate limiting | None | Vercel middleware rate limit per IP/user |
| Odds | The Odds API free tier | Odds aggregator with historical data |
| Auth | Magic link only | Could add Google/Apple OAuth for better UX |
| Tests | HTTP-level API tests | Full browser e2e (Playwright with actual browser) |

---

## 8. Environment Checklist When Starting a New Session

```bash
# Verify Supabase is reachable
curl -s "$SUPABASE_URL/rest/v1/matches?limit=1" -H "apikey: $VITE_SUPABASE_ANON_KEY" | head -c 100

# Verify ESPN is accessible  
curl -s "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'ESPN ok: {len(d[\"events\"])} events today')"

# Verify Vercel deployment is live
curl -s "https://worldcup-companion.vercel.app/api/match-live?matchId=00000000-0000-0000-0000-000000000000" | python3 -m json.tool
# Should return: {"events":[],"possession":null,"elapsed":null,"shots":[],"stats":null}
```

---

## 9. The One Architectural Decision That Matters Most

The **ProfileProvider** context is the load-bearing architectural choice of this session. Before it existed, the onboarding → schedule state sync was broken. The design principle it embodies:

> **Shared mutable state should live in a single context provider at the highest scope that needs it.** Components below that scope read and write through the same instance. Multiple independent `useX()` calls for the same piece of data is an anti-pattern.

Apply this principle when adding new shared state (e.g., a leaderboard, standings, or notification unread count). Don't reach for Zustand or Redux unless the state genuinely needs to be accessed across routes that are unmounted — React context handles all the cases in this app cleanly.
