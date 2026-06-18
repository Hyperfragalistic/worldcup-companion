/**
 * Phase 3 — Geo-Location & Personalization end-to-end test
 * Runs against the live Vercel deployment using Playwright (headless Chromium).
 *
 * Prerequisites:
 *   npm install -D playwright
 *   npx playwright install chromium
 *
 * Required env vars:
 *   SUPABASE_SERVICE_KEY   — service role key (bypasses RLS for test setup)
 *   TEST_USER_EMAIL        — magic-link email for the test account
 *
 * Usage:
 *   SUPABASE_SERVICE_KEY=<key> TEST_USER_EMAIL=you@example.com \
 *     node tests/phase3-schedule.mjs
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

let USER_ID = ''; // derived from session after auth

let PASS = 0, FAIL = 0;
function check(label, ok, detail = '') {
  console.log(`  ${ok ? '✅' : '❌'} ${label}${detail ? ' — ' + detail : ''}`);
  ok ? PASS++ : FAIL++;
}
async function shot(page, label) {
  await page.screenshot({ path: `/tmp/p3-${label}.png` });
  console.log(`  📸 /tmp/p3-${label}.png`);
}
async function dbTeam() {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${USER_ID}&select=favorite_team`, { headers: HEADERS });
  const d = await r.json();
  return d[0]?.favorite_team ?? null;
}
async function setTeam(team) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${USER_ID}`, {
    method: 'PATCH',
    headers: { ...HEADERS, Prefer: 'return=representation' },
    body: JSON.stringify({ favorite_team: team }),
  });
  if (!r.ok) console.log('  ⚠️  setTeam failed:', r.status, await r.text());
  const data = await r.json();
  return data[0]?.favorite_team ?? null;
}
async function genLink() {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: 'POST', headers: HEADERS,
    body: JSON.stringify({ type: 'magiclink', email: TEST_EMAIL, redirect_to: BASE }),
  });
  const d = await r.json();
  if (!d.action_link) throw new Error('generate_link failed: ' + JSON.stringify(d));
  return d.action_link;
}

// ── Acquire session once — reuse across all tests ─────────────────────────────
const browser = await chromium.launch({ headless: true });
{
  const ctx  = await browser.newContext({ viewport: VIEWPORT });
  const page = await ctx.newPage();
  await page.goto(await genLink());
  await page.waitForURL(`${BASE}/**`, { timeout: 15000 });
  await page.waitForTimeout(2000);
  var session = await page.evaluate(() => {
    const key = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    return key ? { key, value: localStorage.getItem(key) } : null;
  });
  await ctx.close();
}
USER_ID = JSON.parse(session.value)?.user?.id ?? '';
console.log('Session key:', session?.key);
console.log('User ID from session:', USER_ID);

// Ensure onboarding is marked complete so the Phase 4 modal never blocks tests
await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${USER_ID}`, {
  method: 'PATCH',
  headers: { ...HEADERS, Prefer: 'return=minimal' },
  body: JSON.stringify({ onboarding_complete: true }),
});

// ── Helper: open schedule page with optional geo ──────────────────────────────
// Only intercepts Nominatim — never touches Supabase REST so PATCH calls flow through.
async function openSchedule(geoCoords) {
  const ctxOpts = { viewport: VIEWPORT };
  if (geoCoords) {
    ctxOpts.geolocation = geoCoords;
    ctxOpts.permissions = ['geolocation'];
  }
  const ctx  = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();

  const supabaseRequests = [];
  page.on('request', req => {
    if (req.url().includes('supabase.co'))
      supabaseRequests.push({ method: req.method(), url: req.url(), postData: req.postData() });
  });
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()) });
  page.on('pageerror', err => consoleErrors.push('PAGE: ' + err.message));

  // Coordinate-based Nominatim mock
  await ctx.route('**/nominatim.openstreetmap.org/**', async route => {
    const url = route.request().url();
    const lat = parseFloat(url.match(/lat=([-\d.]+)/)?.[1] ?? '0');
    const lon = parseFloat(url.match(/lon=([-\d.]+)/)?.[1] ?? '0');
    let mock = { address: { country_code: 'xx', country: 'Unknown' } };
    if (lat < -10 && lon < -30) mock = { address: { country_code: 'br', country: 'Brazil',        state: 'São Paulo'  } };
    if (lat >  35 && lon < -60) mock = { address: { country_code: 'us', country: 'United States', state: 'New York'   } };
    if (lat >  35 && lon > 130) mock = { address: { country_code: 'jp', country: 'Japan',          state: 'Tokyo'      } };
    console.log(`    [nominatim] lat=${lat.toFixed(1)} lon=${lon.toFixed(1)} → ${mock.address.country_code.toUpperCase()}`);
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mock) });
  });

  await page.goto(BASE);
  await page.waitForTimeout(300);
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), session);
  await page.goto(`${BASE}/`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(4000); // allow geo resolution + auto-save DB write to settle

  return { ctx, page, supabaseRequests, consoleErrors };
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1: Team already set → header shows it, no spurious PATCH
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n=== TEST 1: Existing team (Brazil) shown in header ===');
console.log(`  DB after setTeam('Brazil'): ${await setTeam('Brazil')}`);
{
  const { ctx, page, supabaseRequests, consoleErrors } = await openSchedule(
    { latitude: -23.55, longitude: -46.63, accuracy: 10 }
  );
  const patches = supabaseRequests.filter(r => r.method === 'PATCH');
  const header  = await page.locator('header').textContent();
  check('Header shows Brazil', header.includes('Brazil'), header.trim());
  check('"Brazil Matches" section visible', await page.isVisible('text=Brazil Matches'));
  check('No spurious PATCH (team already set)', patches.length === 0, `patches: ${patches.length}`);
  check('No console errors', consoleErrors.length === 0, consoleErrors.slice(0,2).join(' | ') || 'none');
  await shot(page, '1-existing-team');
  await ctx.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2: No team + Brazil geo → auto-save fires and persists to DB
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n=== TEST 2: Auto-save: null team + Brazil geo → saves Brazil ===');
console.log(`  DB after setTeam(null): ${await setTeam(null)}`);
{
  const { ctx, page, supabaseRequests, consoleErrors } = await openSchedule(
    { latitude: -23.55, longitude: -46.63, accuracy: 10 }
  );
  const patches = supabaseRequests.filter(r => r.method === 'PATCH');
  console.log(`  Supabase requests: ${supabaseRequests.map(r => `${r.method} ${r.url.split('/v1/')[1]?.split('?')[0]}`).join(', ')}`);
  console.log(`  PATCH bodies: ${patches.map(p => p.postData).join(' | ')}`);
  const header = await page.locator('header').textContent();
  check('Header shows Brazil (optimistic)', header.includes('Brazil'), header.trim());
  check('"Brazil Matches" section visible', await page.isVisible('text=Brazil Matches'));
  check('Profile PATCH request sent', patches.length > 0, `patches: ${patches.length}`);
  check('No console errors', consoleErrors.length === 0, consoleErrors.slice(0,2).join(' | ') || 'none');
  await page.waitForTimeout(1000);
  const saved = await dbTeam();
  check('favorite_team persisted to DB', saved === 'Brazil', `got: ${saved}`);
  await shot(page, '2-autosave-brazil');
  await ctx.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3: No team, geo denied → full plain schedule
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n=== TEST 3: No team + geo denied → plain schedule ===');
console.log(`  DB after setTeam(null): ${await setTeam(null)}`);
{
  const { ctx, page, consoleErrors } = await openSchedule(null);
  const header = await page.locator('header').textContent();
  check('No team name in header', !header.includes('Brazil') && !header.includes('Argentina'), header.trim());
  const cards = await page.locator('button.w-full.rounded-xl').count();
  check('Full schedule renders (24 cards)', cards === 24, `cards: ${cards}`);
  check('No team section shown', !await page.isVisible('text=Brazil Matches').catch(() => false));
  check('No console errors', consoleErrors.length === 0, consoleErrors.slice(0,2).join(' | ') || 'none');
  await shot(page, '3-geo-denied');
  await ctx.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 4: Personalized header — team flag emoji + name
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n=== TEST 4: Header shows flag + team name ===');
console.log(`  DB after setTeam('Brazil'): ${await setTeam('Brazil')}`);
{
  const { ctx, page } = await openSchedule(null);
  check('Team flag in header', await page.locator('header').locator('text=🇧🇷').isVisible().catch(() => false));
  check('Team name in header', await page.locator('header').locator('text=Brazil').isVisible().catch(() => false));
  await shot(page, '4-header-personalized');
  await ctx.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 5: MatchCard highlight — exactly 3 gold cards, 21 regular
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n=== TEST 5: MatchCard highlight ===');
{
  const { ctx, page } = await openSchedule(null);
  const goldCards    = await page.locator('[class*="ring-wc-gold"]').count();
  const regularCards = await page.locator('[class*="ring-white\\/10"]').count();
  check('3 Brazil cards highlighted', goldCards === 3, `gold: ${goldCards}`);
  check('21 regular cards unchanged', regularCards === 21, `regular: ${regularCards}`);
  await shot(page, '5-match-highlights');
  await ctx.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 6: Brazil section pinned first before date groups
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n=== TEST 6: Team section pinned first ===');
{
  const { ctx, page } = await openSchedule(null);
  const sections = await page.locator('section h2').allTextContents();
  check('"Brazil Matches" is first section', sections[0]?.includes('Brazil'), `first: "${sections[0]?.trim()}"`);
  check('Date sections follow', sections.length > 1, `total: ${sections.length}`);
  await shot(page, '6-section-order');
  await ctx.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 7: Switching to a different team (Argentina) personalizes correctly
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n=== TEST 7: Different team (Argentina) ===');
console.log(`  DB after setTeam('Argentina'): ${await setTeam('Argentina')}`);
{
  const { ctx, page } = await openSchedule(null);
  const header = await page.locator('header').textContent();
  check('Header shows Argentina', header.includes('Argentina'), header.trim());
  check('"Argentina Matches" section visible', await page.isVisible('text=Argentina Matches'));
  const goldCards = await page.locator('[class*="ring-wc-gold"]').count();
  check('3 Argentina cards highlighted', goldCards === 3, `gold: ${goldCards}`);
  await shot(page, '7-argentina');
  await ctx.close();
}

// Restore to Brazil and close
await setTeam('Brazil');
console.log('\n=== CLEANUP: restored favorite_team = Brazil ===');

await browser.close();
console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${PASS} passed, ${FAIL} failed`);
console.log('Screenshots written to /tmp/p3-*.png');
if (FAIL > 0) process.exit(1);
