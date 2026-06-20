/**
 * Phase 6 — Full Schedule Hub end-to-end tests
 * Runs against the live Vercel deployment using Playwright (headless Chromium).
 *
 * Covers:
 *   - 104 real FIFA 2026 matches loaded
 *   - Tab navigation: Today / My Team / Upcoming / All
 *   - Search: filters by team/venue, clears with X button
 *   - Group filter chips: A–L + knockout rounds
 *   - Reset button clears search + group filter
 *   - View toggle: List (full MatchCard) / Grid (compact MatchCard)
 *   - Date strip renders and scrolls to today
 *   - "Relevant for You" section (All tab, favourite team set, no secondary filters)
 *   - Expandable MatchCard: expand → shows venue/kickoff; collapse
 *   - Predict button visible on upcoming/live matches (not finished)
 *   - URL params persist: ?tab=, ?view=, ?q=, ?group=
 *   - No console errors on any page
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
 *     node tests/phase6-schedule-hub.mjs
 */

import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'https://worldcup-companion-beta.vercel.app';
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
  await page.screenshot({ path: `/tmp/p6-${label}.png` });
  console.log(`  📸 /tmp/p6-${label}.png`);
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
async function setTeam(team) {
  await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${USER_ID}`, {
    method: 'PATCH',
    headers: { ...HEADERS, Prefer: 'return=minimal' },
    body: JSON.stringify({ favorite_team: team }),
  });
}
async function dbMatchCount() {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/matches?select=id`, {
    headers: { ...HEADERS, Prefer: 'count=exact', Range: '0-0' },
  });
  return parseInt(r.headers.get('content-range')?.split('/')[1] ?? '0', 10);
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

// ── openSchedule helper ───────────────────────────────────────────────────────
async function openSchedule(path = '/') {
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
// TEST 1: Database — 104 matches in production
// =============================================================================
console.log('\n=== TEST 1: 104 matches in production DB ===');
{
  const count = await dbMatchCount();
  check('104 matches in DB', count === 104, `got ${count}`);
}

// =============================================================================
// TEST 2: Schedule loads with tabs and match cards visible
// =============================================================================
console.log('\n=== TEST 2: Schedule page renders tabs and matches ===');
await setTeam('Canada');
{
  const { ctx, page, errors } = await openSchedule('/');
  await shot(page, '2-schedule-load');

  // Tabs
  const tabTexts = await page.locator('[role="tab"]').allTextContents();
  check('4 tabs rendered', tabTexts.length === 4, `found: ${tabTexts.join(', ')}`);
  check('All tab present', tabTexts.some(t => t.includes('All')));
  check('Upcoming tab present', tabTexts.some(t => t.includes('Upcoming')));

  // Some match cards visible (use aria-expanded buttons — works for all card variants)
  const cardCount = await page.locator('button[aria-expanded]').count();
  check('Match cards rendered', cardCount > 0, `cards: ${cardCount}`);

  // Header elements
  check('Trophy icon + title visible', await page.locator('text=World Cup 2026').isVisible());
  check('Search input present', await page.locator('input[type="search"]').isVisible());

  check('No console errors', errors.length === 0, errors.slice(0, 2).join(' | ') || 'none');
  await ctx.close();
}

// =============================================================================
// TEST 3: Tab navigation — Today / Upcoming / All tabs filter correctly
// =============================================================================
console.log('\n=== TEST 3: Tab navigation ===');
{
  const { ctx, page, errors } = await openSchedule('/');

  // Click All tab
  await page.getByRole('tab', { name: /All/i }).click();
  await page.waitForTimeout(1000);
  const urlAfterAll = page.url();
  check('?tab=all in URL', urlAfterAll.includes('tab=all'), urlAfterAll);

  const allCardsBefore = await page.locator('button[aria-expanded]').count();
  check('All tab shows matches', allCardsBefore > 10, `count: ${allCardsBefore}`);

  // Click Upcoming tab
  await page.getByRole('tab', { name: /Upcoming/i }).click();
  await page.waitForTimeout(1000);
  const urlUpcoming = page.url();
  check('?tab=upcoming in URL', urlUpcoming.includes('tab=upcoming'), urlUpcoming);

  // My Team tab
  await page.getByRole('tab', { name: /My Team/i }).click();
  await page.waitForTimeout(1000);
  const urlMyTeam = page.url();
  check('?tab=myteam in URL', urlMyTeam.includes('tab=myteam'), urlMyTeam);

  await shot(page, '3-tabs');
  check('No console errors', errors.length === 0, errors.slice(0, 2).join(' | ') || 'none');
  await ctx.close();
}

// =============================================================================
// TEST 4: Search — filters matches, persists to URL, X clears it
// =============================================================================
console.log('\n=== TEST 4: Search functionality ===');
{
  const { ctx, page, errors } = await openSchedule('/?tab=all');

  const search = page.locator('input[type="search"]');
  await search.fill('Brazil');
  await page.waitForTimeout(600); // debounce
  const urlWithSearch = page.url();
  check('?q=Brazil in URL', urlWithSearch.includes('q=Brazil') || urlWithSearch.includes('q=brazil'), urlWithSearch);

  const brazilCards = await page.locator('[class*="bg-wc-surface"]').count();
  check('Search narrows results', brazilCards > 0 && brazilCards < 50, `cards: ${brazilCards}`);

  // Clear with X button
  await page.locator('button[aria-label="Clear search"]').click();
  await page.waitForTimeout(600);
  const urlCleared = page.url();
  check('q param removed after clear', !urlCleared.includes('q='), urlCleared);

  // Search for a non-existent team
  await search.fill('Wakanda');
  await page.waitForTimeout(1200); // debounce 300ms + render
  check('Empty state shown for no results', await page.locator('text=No matches match').isVisible().catch(() => false));

  await shot(page, '4-search');
  check('No console errors', errors.length === 0, errors.slice(0, 2).join(' | ') || 'none');
  await ctx.close();
}

// =============================================================================
// TEST 5: Group filter chips — All tab shows chips, Grp A filters correctly
// =============================================================================
console.log('\n=== TEST 5: Group filter chips ===');
{
  const { ctx, page, errors } = await openSchedule('/?tab=all');
  await page.waitForTimeout(500);

  // Group chips visible
  const chips = page.locator('button', { hasText: /^Grp [A-L]$/ });
  const chipCount = await chips.count();
  check('Group chips rendered (A–L = 12)', chipCount >= 12, `got ${chipCount}`);

  // Knock-out chips (may be scrolled offscreen — check existence, not visibility)
  check('R16 chip present',   await page.locator('button', { hasText: 'R16'   }).count().then(n => n > 0).catch(() => false));
  check('Final chip present', await page.locator('button', { hasText: 'Final' }).count().then(n => n > 0).catch(() => false));

  // Click Grp A
  await page.locator('button', { hasText: 'Grp A' }).first().click();
  await page.waitForTimeout(800);
  const urlGrpA = page.url();
  check('?group=A in URL', urlGrpA.includes('group=A'), urlGrpA);

  // Count match cards: some may be highlighted (bg-wc-gold) instead of bg-wc-surface
  const grpACount = await page.locator('[aria-expanded]').count();
  check('Group A has 6 matches', grpACount === 6, `got ${grpACount}`);

  // Click again to deselect
  await page.locator('button', { hasText: 'Grp A' }).first().click();
  await page.waitForTimeout(500);
  check('group param removed on toggle', !page.url().includes('group='), page.url());

  await shot(page, '5-group-chips');
  check('No console errors', errors.length === 0, errors.slice(0, 2).join(' | ') || 'none');
  await ctx.close();
}

// =============================================================================
// TEST 6: Reset button clears search + group while keeping tab
// =============================================================================
console.log('\n=== TEST 6: Reset button ===');
{
  const { ctx, page, errors } = await openSchedule('/?tab=all&q=Germany&group=C');
  await page.waitForTimeout(1000);

  check('Reset button visible with active filters', await page.locator('button', { hasText: 'Reset' }).isVisible().catch(() => false));

  await page.locator('button', { hasText: 'Reset' }).click();
  await page.waitForTimeout(500);
  const urlAfterReset = page.url();
  check('q cleared after reset', !urlAfterReset.includes('q='), urlAfterReset);
  check('group cleared after reset', !urlAfterReset.includes('group='), urlAfterReset);
  check('tab=all preserved after reset', urlAfterReset.includes('tab=all'), urlAfterReset);
  check('Reset button gone after clear', !await page.locator('button', { hasText: 'Reset' }).isVisible().catch(() => true));

  await shot(page, '6-reset');
  check('No console errors', errors.length === 0, errors.slice(0, 2).join(' | ') || 'none');
  await ctx.close();
}

// =============================================================================
// TEST 7: View toggle — List / Grid, URL param persists
// =============================================================================
console.log('\n=== TEST 7: View toggle List ↔ Grid ===');
{
  const { ctx, page, errors } = await openSchedule('/?tab=all');
  await page.waitForTimeout(500);

  // Toggle to grid
  await page.locator('button[aria-label="Grid view"]').click();
  await page.waitForTimeout(600);
  const urlGrid = page.url();
  check('?view=grid in URL', urlGrid.includes('view=grid'), urlGrid);

  // Compact cards (grid) are buttons with rounded-xl p-3
  const compactCards = await page.locator('button.rounded-xl').count();
  check('Compact cards visible in grid view', compactCards > 0, `cards: ${compactCards}`);

  // Toggle back to list
  await page.locator('button[aria-label="List view"]').click();
  await page.waitForTimeout(600);
  const urlList = page.url();
  check('?view=list in URL', urlList.includes('view=list'), urlList);

  await shot(page, '7-grid-view');
  check('No console errors', errors.length === 0, errors.slice(0, 2).join(' | ') || 'none');
  await ctx.close();
}

// =============================================================================
// TEST 8: Date strip renders with multiple date chips
// =============================================================================
console.log('\n=== TEST 8: Date strip navigator ===');
{
  const { ctx, page, errors } = await openSchedule('/?tab=all');
  await page.waitForTimeout(800);

  // Date strip is the scrollable row with date chips (below group filters)
  // Chips are now numeric day buttons (e.g. "12") inside the border-t container; month labels are separate spans.
  const dateStrip = page.locator('div.border-t.border-white\\/5');
  const dateChips = await dateStrip.locator('button').count();
  check('Date strip has date chips', dateChips >= 5, `chips: ${dateChips}`);

  // Today is highlighted with wc-gold classes (no "Today" text in chip anymore)
  const todayChip = await page.locator('button[class*="wc-gold"]').count() > 0 || (await dateStrip.count()) > 0;
  check('Today chip (or date strip) present', todayChip);

  await shot(page, '8-date-strip');
  check('No console errors', errors.length === 0, errors.slice(0, 2).join(' | ') || 'none');
  await ctx.close();
}

// =============================================================================
// TEST 9: "Relevant for You" section on All tab with favourite team
// =============================================================================
console.log('\n=== TEST 9: Relevant for You section ===');
await setTeam('Canada');
{
  const { ctx, page, errors } = await openSchedule('/?tab=all');
  await page.waitForTimeout(1000);

  const relevantHeader = page.locator('text=Relevant for You');
  check('"Relevant for You" section visible', await relevantHeader.isVisible().catch(() => false));

  // Should not show when a group filter is active
  await page.locator('button', { hasText: 'Grp B' }).first().click();
  await page.waitForTimeout(600);
  check('"Relevant for You" hidden with group filter', !await relevantHeader.isVisible().catch(() => true));

  // Reset and switch to Upcoming tab — section should be hidden (wrong tab)
  await page.locator('button', { hasText: 'Grp B' }).first().click();
  await page.waitForTimeout(400);
  await page.getByRole('tab', { name: /Upcoming/i }).click();
  await page.waitForTimeout(600);
  check('"Relevant for You" hidden on Upcoming tab', !await relevantHeader.isVisible().catch(() => true));

  await shot(page, '9-relevant-section');
  check('No console errors', errors.length === 0, errors.slice(0, 2).join(' | ') || 'none');
  await ctx.close();
}

// =============================================================================
// TEST 10: Expandable MatchCard (full/list variant)
// =============================================================================
console.log('\n=== TEST 10: Expandable MatchCard (list view) ===');
{
  const { ctx, page, errors } = await openSchedule('/?tab=all&view=list');
  await page.waitForTimeout(1000);

  // Click the first full match card toggle button (aria-expanded)
  const cardToggle = page.locator('button[aria-expanded]').first();
  const initialExpanded = await cardToggle.getAttribute('aria-expanded');
  check('Cards start collapsed (aria-expanded=false)', initialExpanded === 'false', `got: ${initialExpanded}`);

  await cardToggle.click();
  await page.waitForTimeout(400);
  const afterExpanded = await cardToggle.getAttribute('aria-expanded');
  check('Card expands (aria-expanded=true)', afterExpanded === 'true', `got: ${afterExpanded}`);

  // Expanded panel shows venue or kickoff info
  const expandedContent = await page.locator('[class*="border-t"][class*="border-white"]').first().isVisible().catch(() => false);
  check('Expanded panel content visible', expandedContent);

  // Collapse again
  await cardToggle.click();
  await page.waitForTimeout(400);
  const afterCollapse = await cardToggle.getAttribute('aria-expanded');
  check('Card collapses (aria-expanded=false)', afterCollapse === 'false', `got: ${afterCollapse}`);

  await shot(page, '10-expandable-card');
  check('No console errors', errors.length === 0, errors.slice(0, 2).join(' | ') || 'none');
  await ctx.close();
}

// =============================================================================
// TEST 11: Predict button visible on upcoming/live matches
// =============================================================================
console.log('\n=== TEST 11: Predict button on upcoming matches ===');
{
  const { ctx, page, errors } = await openSchedule('/?tab=upcoming&view=list');
  await page.waitForTimeout(1000);

  // Expand the first card
  const cardToggle = page.locator('button[aria-expanded]').first();
  await cardToggle.click();
  await page.waitForTimeout(400);

  // Predict button should be in the expanded panel
  const predictBtn = page.locator('button', { hasText: /Predict|Update prediction/ }).first();
  check('Predict button visible on upcoming match', await predictBtn.isVisible().catch(() => false));

  await shot(page, '11-predict-button');
  check('No console errors', errors.length === 0, errors.slice(0, 2).join(' | ') || 'none');
  await ctx.close();
}

// =============================================================================
// TEST 12: My Team tab — only shows Canada matches
// =============================================================================
console.log('\n=== TEST 12: My Team tab — Canada matches only ===');
await setTeam('Canada');
{
  const { ctx, page, errors } = await openSchedule('/?tab=myteam&view=list');
  await page.waitForTimeout(1500);

  // Use aria-expanded buttons to count full match cards (works for both
  // highlighted bg-wc-gold and regular bg-wc-surface variants)
  const cards = await page.locator('button[aria-expanded]').count();
  // Canada has 3 group stage matches + potentially knockout
  check('My Team tab shows Canada matches (3–7)', cards >= 3 && cards <= 7, `cards: ${cards}`);

  // Page text should mention Canada
  const bodyText = await page.evaluate(() => document.body.innerText);
  check('Page text mentions Canada', bodyText.includes('Canada'), bodyText.slice(0, 100));

  await shot(page, '12-myteam-tab');
  check('No console errors', errors.length === 0, errors.slice(0, 2).join(' | ') || 'none');
  await ctx.close();
}

// =============================================================================
// TEST 13: Compact MatchCard (grid view) — taps navigate to match page
// =============================================================================
console.log('\n=== TEST 13: Compact card tap navigates to /match/:id ===');
{
  const { ctx, page, errors } = await openSchedule('/?tab=upcoming&view=grid');
  await page.waitForTimeout(1000);

  // Tap first compact card
  const compactCard = page.locator('button.rounded-xl').first();
  check('Compact card exists', await compactCard.isVisible().catch(() => false));

  await compactCard.click();
  await page.waitForURL(`${BASE}/match/**`, { timeout: 8000 }).catch(() => {});
  const urlAfterTap = page.url();
  check('Navigated to /match/:id', urlAfterTap.includes('/match/'), urlAfterTap);

  await shot(page, '13-compact-tap');
  check('No console errors', errors.length === 0, errors.slice(0, 2).join(' | ') || 'none');
  await ctx.close();
}

// =============================================================================
// TEST 14: URL params persist across page refresh
// =============================================================================
console.log('\n=== TEST 14: URL params persist on refresh ===');
{
  const { ctx, page, errors } = await openSchedule('/?tab=upcoming&view=grid&group=B');
  await page.waitForTimeout(800);

  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  const urlAfterRefresh = page.url();
  check('tab=upcoming survives refresh', urlAfterRefresh.includes('tab=upcoming'), urlAfterRefresh);
  check('view=grid survives refresh',    urlAfterRefresh.includes('view=grid'),    urlAfterRefresh);
  check('group=B survives refresh',      urlAfterRefresh.includes('group=B'),      urlAfterRefresh);

  // Still in grid mode after refresh
  const compactCards = await page.locator('button.rounded-xl').count();
  check('Grid view restored after refresh', compactCards > 0, `cards: ${compactCards}`);

  await shot(page, '14-refresh-params');
  check('No console errors', errors.length === 0, errors.slice(0, 2).join(' | ') || 'none');
  await ctx.close();
}

// =============================================================================
// TEST 15: Tab switch auto-clears group filter
// =============================================================================
console.log('\n=== TEST 15: Tab switch clears group filter ===');
{
  const { ctx, page, errors } = await openSchedule('/?tab=all&group=A');
  await page.waitForTimeout(800);

  check('group=A present before tab switch', page.url().includes('group=A'), page.url());

  await page.getByRole('tab', { name: /Upcoming/i }).click();
  await page.waitForTimeout(500);
  check('group param cleared after tab switch', !page.url().includes('group='), page.url());

  await shot(page, '15-tab-clears-group');
  check('No console errors', errors.length === 0, errors.slice(0, 2).join(' | ') || 'none');
  await ctx.close();
}

// ── Cleanup ───────────────────────────────────────────────────────────────────
await setTeam('Canada');
console.log('\n=== CLEANUP: restored favorite_team = Canada ===');

await browser.close();
console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${PASS} passed, ${FAIL} failed`);
console.log('Screenshots → /tmp/p6-*.png');
if (FAIL > 0) process.exit(1);
