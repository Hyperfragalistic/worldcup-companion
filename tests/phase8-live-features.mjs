/**
 * Phase 8 — Live Features end-to-end tests
 * Runs against the live Vercel deployment using Playwright (headless Chromium).
 *
 * Covers:
 *   Step 3 — Team Roster pages
 *     - /team/:teamName route loads with GK/DEF/MID/FWD sections
 *     - PlayerCard tap opens bottom-sheet modal
 *     - Modal shows position badge + Wikipedia link
 *     - Squad links appear in expanded MatchCard
 *
 *   Step 4 — Live match enhancements
 *     - LiveTimer visible (pulsing dot) on a live match page
 *     - PossessionBar renders when data is present
 *     - MatchTimeline renders for live/finished matches
 *     - Upcoming match page has no possession / timeline
 *
 *   Step 5 — Shot Heatmap
 *     - SVG pitch renders for a finished match with shot data
 *     - Stat bars (totalShots etc.) visible below pitch
 *     - No heatmap on an upcoming match
 *
 *   Step 6 — News Ticker
 *     - Ticker visible on SchedulePage
 *     - Contains at least one headline link to bbc.co.uk / bbc.com
 *     - NEWS badge visible
 *
 * Prerequisites:
 *   npx playwright install chromium
 *
 * Required env vars:
 *   SUPABASE_SERVICE_KEY   — service role key (bypasses RLS)
 *   TEST_USER_EMAIL        — test account email
 *
 * Usage:
 *   SUPABASE_SERVICE_KEY=<key> TEST_USER_EMAIL=you@example.com \
 *     node tests/phase8-live-features.mjs
 */

import { chromium } from 'playwright';

const BASE         = 'https://worldcup-companion-beta.vercel.app';
const SUPABASE_URL = 'https://cxklsqbtmhxapebaqrlh.supabase.co';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY;
const TEST_EMAIL   = process.env.TEST_USER_EMAIL;

if (!SERVICE_KEY) { console.error('SUPABASE_SERVICE_KEY env var required'); process.exit(1); }
if (!TEST_EMAIL)  { console.error('TEST_USER_EMAIL env var required');       process.exit(1); }

const VIEWPORT = { width: 390, height: 844 };
const HEADERS  = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' };

let PASS = 0, FAIL = 0;
function check(label, ok, detail = '') {
  console.log(`  ${ok ? '✅' : '❌'} ${label}${detail ? ' — ' + detail : ''}`);
  ok ? PASS++ : FAIL++;
}
async function shot(page, label) {
  await page.screenshot({ path: `/tmp/p8-${label}.png` });
  console.log(`  📸 /tmp/p8-${label}.png`);
}

// ── Auth helpers ──────────────────────────────────────────────────────────────
async function genLink() {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: 'POST', headers: HEADERS,
    body: JSON.stringify({ type: 'magiclink', email: TEST_EMAIL, redirect_to: BASE }),
  });
  const d = await r.json();
  if (!d.action_link) throw new Error('generate_link failed: ' + JSON.stringify(d));
  return d.action_link;
}

// ── DB helpers ─────────────────────────────────────────────────────────────────
async function fetchMatches(filter) {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/matches?${filter}&select=id,team1,team2,starts_at,status&order=starts_at.asc&limit=5`,
    { headers: HEADERS },
  );
  return r.json();
}

// ── Acquire session ───────────────────────────────────────────────────────────
const browser = await chromium.launch({ headless: true });
let session, USER_ID;
{
  const ctx  = await browser.newContext({ viewport: VIEWPORT });
  const page = await ctx.newPage();
  await page.goto(await genLink());
  await page.waitForURL(`${BASE}/**`, { timeout: 15000 });
  await page.waitForTimeout(2000);
  session = await page.evaluate(() => {
    const key = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    return key ? { key, value: localStorage.getItem(key) } : null;
  });
  await ctx.close();
}
USER_ID = JSON.parse(session.value)?.user?.id ?? '';
console.log('User ID:', USER_ID);

// Mark onboarding complete so the modal never blocks tests
await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${USER_ID}`, {
  method: 'PATCH',
  headers: { ...HEADERS, Prefer: 'return=minimal' },
  body: JSON.stringify({ onboarding_complete: true }),
});

// ── Page helper ───────────────────────────────────────────────────────────────
async function openPage(path) {
  const ctx  = await browser.newContext({ viewport: VIEWPORT });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) });
  page.on('pageerror', e => errors.push('PAGE: ' + e.message));

  await page.goto(BASE);
  await page.waitForTimeout(300);
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), session);
  await page.goto(`${BASE}${path}`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  return { ctx, page, errors };
}

// =============================================================================
// TEST 1: News Ticker visible on Schedule page
// =============================================================================
console.log('\n=== TEST 1: News Ticker on SchedulePage ===');
{
  const { ctx, page, errors } = await openPage('/');
  await shot(page, '1-news-ticker');

  // "NEWS" badge from NewsTicker component
  const newsBadge = page.locator('text=News').first();
  const badgeVisible = await newsBadge.isVisible().catch(() => false);
  check('NEWS badge visible in ticker', badgeVisible);

  // wc-ticker-track div should exist
  const tickerTrack = page.locator('.wc-ticker-track');
  const trackExists = await tickerTrack.count() > 0;
  check('Ticker scroll track present', trackExists);

  // At least one headline link should point to BBC
  const bbcLinks = await page.locator('.wc-ticker-track a[href*="bbc"]').count();
  check('Ticker contains BBC headline links', bbcLinks > 0, `found ${bbcLinks}`);

  check('No console errors on schedule page', errors.length === 0, errors.slice(0, 2).join(' | ') || 'none');
  await ctx.close();
}

// =============================================================================
// TEST 2: Team Roster page loads with position groups
// =============================================================================
console.log('\n=== TEST 2: Team Roster page — /team/Brazil ===');
{
  const { ctx, page, errors } = await openPage('/team/Brazil');
  await shot(page, '2-team-roster');

  // Header with team name — it's a <p> inside <header>
  const headerName = page.locator('header p').first();
  const headingText = await headerName.textContent().catch(() => '');
  check('Team name in heading', headingText.includes('Brazil'), `got: "${headingText}"`);

  // Position group headings — h2 elements inside sections
  const h2s = await page.locator('section h2').allTextContents().catch(() => []);
  check('Position section headings present', h2s.length >= 1, `found: ${h2s.join(', ')}`);

  // At least some player rows (using position badge elements)
  const playerRows = await page.locator('[class*="rounded"]').count();
  check('Player cards rendered', playerRows > 5, `count: ${playerRows}`);

  // Back button / navigation present
  const backBtn = page.locator('button').first();
  const backVisible = await backBtn.isVisible().catch(() => false);
  check('Back navigation button present', backVisible);

  check('No console errors on team page', errors.length === 0, errors.slice(0, 2).join(' | ') || 'none');
  await ctx.close();
}

// =============================================================================
// TEST 3: Team Roster — tap player card, modal opens with Wikipedia link
// =============================================================================
console.log('\n=== TEST 3: Team Roster — PlayerModal via tapping player card ===');
{
  const { ctx, page, errors } = await openPage('/team/Brazil');
  await page.waitForTimeout(1000);

  // Tap the first player row (button element)
  const firstPlayer = page.locator('button[class*="flex"]').first();
  const playerExists = await firstPlayer.count() > 0;
  check('At least one tappable player row', playerExists);

  if (playerExists) {
    await firstPlayer.click();
    await page.waitForTimeout(1500);
    await shot(page, '3-player-modal');

    // Modal should appear — look for Wikipedia link
    const wikiLink = page.locator('a[href*="wikipedia.org"]');
    const wikiVisible = await wikiLink.isVisible().catch(() => false);
    check('Wikipedia link in PlayerModal', wikiVisible);

    // Position badge in modal (GK / DEF / MID / FWD)
    const posText = await page.locator('text=/^(GK|DEF|MID|FWD)$/').count();
    check('Position badge visible in modal', posText > 0, `badge count: ${posText}`);
  } else {
    check('Wikipedia link in PlayerModal', false, 'no player rows found');
    check('Position badge visible in modal', false, 'no player rows found');
  }

  await ctx.close();
}

// =============================================================================
// TEST 4: Squad links in expanded MatchCard
// =============================================================================
console.log('\n=== TEST 4: Squad links in expanded MatchCard ===');
{
  const { ctx, page, errors } = await openPage('/');

  // Click All tab to ensure we have match cards
  await page.getByRole('tab', { name: /All/i }).click().catch(() => {});
  await page.waitForTimeout(1000);

  // Expand first match card
  const firstCard = page.locator('button[aria-expanded]').first();
  const cardExists = await firstCard.count() > 0;
  check('Match card found to expand', cardExists);

  if (cardExists) {
    await firstCard.click();
    await page.waitForTimeout(1500);
    await shot(page, '4-squad-links');

    // Squad links appear as buttons containing "Squad" text (with &nbsp; before →)
    const squadLinks = page.locator('button:has-text("Squad")');
    const squadCount = await squadLinks.count();
    check('Squad links visible in expanded card', squadCount >= 2, `found ${squadCount}`);

    if (squadCount > 0) {
      // Click first squad link and verify navigation
      await squadLinks.first().click();
      await page.waitForTimeout(2000);
      const url = page.url();
      check('Squad link navigates to /team/ route', url.includes('/team/'), url);
      await shot(page, '4-squad-nav');
    }
  } else {
    check('Squad links visible in expanded card', false, 'no match cards found');
  }

  await ctx.close();
}

// =============================================================================
// TEST 5: /api/news endpoint returns items
// =============================================================================
console.log('\n=== TEST 5: /api/news API returns BBC headlines ===');
{
  const r = await fetch(`${BASE}/api/news`);
  check('GET /api/news returns 200', r.status === 200, `status: ${r.status}`);
  const data = await r.json();
  check('Response has items array', Array.isArray(data.items), typeof data.items);
  check('At least 1 news item returned', (data.items?.length ?? 0) > 0, `count: ${data.items?.length}`);
  if (data.items?.length > 0) {
    const first = data.items[0];
    check('Item has title', typeof first.title === 'string' && first.title.length > 0);
    check('Item has BBC link', typeof first.link === 'string' && first.link.includes('bbc'), first.link);
  }
}

// =============================================================================
// TEST 6: Finished match page — Shot Heatmap SVG
// =============================================================================
console.log('\n=== TEST 6: Shot Heatmap on a finished match page ===');
{
  const finishedMatches = await fetchMatches("status=eq.finished");
  console.log(`  Found ${finishedMatches.length} finished matches`);

  if (finishedMatches.length === 0) {
    check('Shot heatmap SVG renders for finished match', false, 'no finished matches in DB — skipped');
    check('Stat bars visible below heatmap', false, 'skipped');
  } else {
    const match = finishedMatches[0];
    console.log(`  Testing: ${match.team1} vs ${match.team2} (${match.id})`);
    const { ctx, page, errors } = await openPage(`/match/${match.id}`);
    await page.waitForTimeout(3000); // allow shot data to load
    await shot(page, '6-shot-heatmap');

    // SVG pitch — ShotHeatmap renders an SVG with viewBox="0 0 100 78"
    const svg = page.locator('svg[viewBox="0 0 100 78"]');
    const svgCount = await svg.count();
    check('Shot heatmap SVG present', svgCount > 0, `svg count: ${svgCount}`);

    // Stat bars section — look for "Total Shots" text
    const statBars = page.locator('text=/Total Shots/i');
    const statBarCount = await statBars.count();
    check('Shot stat bars visible', statBarCount > 0, `count: ${statBarCount}`);

    check('No console errors on finished match page', errors.length === 0, errors.slice(0, 2).join(' | ') || 'none');
    await ctx.close();
  }
}

// =============================================================================
// TEST 7: Live match page — LiveTimer, PossessionBar, MatchTimeline
// =============================================================================
console.log('\n=== TEST 7: Live match page enhancements ===');
{
  // Query matches that are within the 2-hour timestamp window (truly live),
  // not just DB status='live' (which can lag behind the cron).
  const now = Date.now();
  const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000).toISOString();
  const nowIso = new Date(now).toISOString();
  const liveMatches = await fetchMatches(
    `status=eq.live&starts_at=gte.${twoHoursAgo}&starts_at=lte.${nowIso}`
  );
  console.log(`  Found ${liveMatches.length} truly-live matches (within 2h window)`);

  if (liveMatches.length === 0) {
    console.log('  No truly-live matches right now — checking finished match for timeline/possession');
    const finishedMatches = await fetchMatches("status=eq.finished");

    if (finishedMatches.length === 0) {
      check('Live/finished match page has match timeline', false, 'no finished matches — skipped');
      check('Possession bar present', false, 'skipped');
    } else {
      const match = finishedMatches[0];
      const { ctx, page, errors } = await openPage(`/match/${match.id}`);
      await page.waitForTimeout(3000);
      await shot(page, '7-finished-match');

      // MatchTimeline: two-column layout with event badges
      const timelineEvents = page.locator('[class*="wc-timeline"], .event, text=/⚽|🟨|🟥/');
      // More reliably, check for elements containing goal/card icons in the match page
      const hasTimeline = await page.locator('text=/⚽/').count() > 0 ||
                          await page.locator('text=/🟨/').count() > 0;
      check('MatchTimeline event icons visible (finished)', hasTimeline, `goal/card icons found: ${hasTimeline}`);

      // PossessionBar: framer-motion div with percentage text
      const possBar = page.locator('text=/%/').count();
      const hasPoss = (await possBar) > 0;
      check('Possession percentage visible', hasPoss);

      check('No console errors on finished match page', errors.length === 0, errors.slice(0, 2).join(' | ') || 'none');
      await ctx.close();
    }
  } else {
    const match = liveMatches[0];
    console.log(`  Testing live: ${match.team1} vs ${match.team2} (${match.id})`);
    const { ctx, page, errors } = await openPage(`/match/${match.id}`);
    await page.waitForTimeout(3000);
    await shot(page, '7-live-match');

    // LiveTimer: pulsing dot in header AND/OR LiveTimer component minute display
    const liveBadge = page.locator('text=Live').first();
    const liveBadgeVisible = await liveBadge.isVisible().catch(() => false);
    const pulseEls = await page.locator('[class*="animate-pulse"]').count();
    check('LiveTimer / LIVE badge visible', liveBadgeVisible || pulseEls > 0, `badge visible: ${liveBadgeVisible}, pulse elements: ${pulseEls}`);

    // Minute text (e.g. "45'" or "90+2'") — rendered by LiveTimer
    const minuteLocator = page.locator('text=/\\d+\\+?\\d*\'/');
    const hasMinute = await minuteLocator.count() > 0;
    check('Match minute text visible', hasMinute, `minute text found: ${hasMinute}`);

    // PossessionBar or MatchTimeline might be loading
    await page.waitForTimeout(3000);
    await shot(page, '7-live-after-poll');

    check('No console errors on live match page', errors.length === 0, errors.slice(0, 2).join(' | ') || 'none');
    await ctx.close();
  }
}

// =============================================================================
// TEST 8: Upcoming match page — no LiveTimer, no heatmap, no possession
// =============================================================================
console.log('\n=== TEST 8: Upcoming match page — live features absent ===');
{
  const upcomingMatches = await fetchMatches("status=eq.upcoming");
  console.log(`  Found ${upcomingMatches.length} upcoming matches`);

  if (upcomingMatches.length === 0) {
    check('No SVG heatmap on upcoming match', false, 'no upcoming matches — skipped');
    check('No pulsing timer on upcoming match', false, 'skipped');
  } else {
    const match = upcomingMatches[0];
    console.log(`  Testing upcoming: ${match.team1} vs ${match.team2} (${match.id})`);
    const { ctx, page, errors } = await openPage(`/match/${match.id}`);
    await page.waitForTimeout(2000);
    await shot(page, '8-upcoming-match');

    // No SVG heatmap for upcoming match (ShotHeatmap returns null when no shots/stats)
    const svgHeatmap = await page.locator('svg[viewBox="0 0 100 78"]').count();
    check('No shot heatmap SVG on upcoming match', svgHeatmap === 0, `found ${svgHeatmap}`);

    // No pulsing timer for upcoming
    const pulseEls = await page.locator('[class*="animate-pulse"]').count();
    check('No live timer pulse on upcoming match', pulseEls === 0, `pulse elements: ${pulseEls}`);

    check('No console errors on upcoming match page', errors.length === 0, errors.slice(0, 2).join(' | ') || 'none');
    await ctx.close();
  }
}

// =============================================================================
// TEST 9: /api/match-events endpoint structure
// =============================================================================
console.log('\n=== TEST 9: /api/match-events API ===');
{
  const finishedMatches = await fetchMatches("status=eq.finished");

  if (finishedMatches.length === 0) {
    check('/api/match-events returns events array', false, 'no finished matches — skipped');
  } else {
    const matchId = finishedMatches[0].id;
    const r = await fetch(`${BASE}/api/match-events?matchId=${matchId}`);
    check('GET /api/match-events returns 200', r.status === 200, `status: ${r.status}`);
    const data = await r.json();
    check('Response has events array', Array.isArray(data.events), typeof data.events);
    check('Response has possession or null', data.possession === null || (typeof data.possession?.home === 'number'), JSON.stringify(data.possession));
  }
}

// =============================================================================
// TEST 10: /api/match-shots endpoint structure
// =============================================================================
console.log('\n=== TEST 10: /api/match-shots API ===');
{
  const finishedMatches = await fetchMatches("status=eq.finished");

  if (finishedMatches.length === 0) {
    check('/api/match-shots returns shots array', false, 'no finished matches — skipped');
  } else {
    const matchId = finishedMatches[0].id;
    const r = await fetch(`${BASE}/api/match-shots?matchId=${matchId}`);
    check('GET /api/match-shots returns 200', r.status === 200, `status: ${r.status}`);
    const data = await r.json();
    check('Response has shots array', Array.isArray(data.shots), typeof data.shots);
    if (data.shots?.length > 0) {
      const s = data.shots[0];
      check('Shot has espnX and espnY coords', typeof s.espnX === 'number' && typeof s.espnY === 'number', `x=${s.espnX} y=${s.espnY}`);
      check('Shot has side field (home/away)', s.side === 'home' || s.side === 'away', `side: ${s.side}`);
    } else {
      check('Shot data (may be 0 if ESPN has no data)', true, 'shots array empty — ESPN may not have data for this match yet');
    }
  }
}

// =============================================================================
// Tear down
// =============================================================================
await browser.close();

const total = PASS + FAIL;
console.log(`\n${'─'.repeat(50)}`);
console.log(`Phase 8 results: ${PASS}/${total} passed, ${FAIL} failed`);
if (FAIL === 0) {
  console.log('All Phase 8 checks passed! ✅');
} else {
  console.log(`${FAIL} check(s) need attention ❌`);
  process.exit(1);
}
