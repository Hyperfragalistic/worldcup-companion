/**
 * Phase 5 — Odds Display verification
 * Runs against the live Vercel deployment using Playwright (headless Chromium).
 *
 * Checks:
 *   - OddsDisplay renders on match page (not loading skeleton, not "No odds" state)
 *   - Home / Draw / Away values visible and numeric
 *   - Favourite (lowest odds) is highlighted gold
 *   - Implied probability % shown under each button
 *   - Over 2.5 goals row present
 *   - "For entertainment only" disclaimer present
 *   - Refresh button present
 *   - No console errors on match page load
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
  await page.screenshot({ path: `/tmp/p5-${label}.png` });
  console.log(`  📸 /tmp/p5-${label}.png`);
}

// ── Acquire session ───────────────────────────────────────────────────────────
async function genLink() {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: 'POST', headers: HEADERS,
    body: JSON.stringify({ type: 'magiclink', email: TEST_EMAIL, redirect_to: BASE }),
  });
  const d = await r.json();
  if (!d.action_link) throw new Error('generate_link failed: ' + JSON.stringify(d));
  return d.action_link;
}

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
console.log('Session key :', session?.key);
console.log('User ID     :', USER_ID);

// Ensure onboarding is complete so modal never blocks tests
await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${USER_ID}`, {
  method: 'PATCH',
  headers: { ...HEADERS, Prefer: 'return=minimal' },
  body: JSON.stringify({ onboarding_complete: true }),
});

// Pick a match we know has odds seeded — Brazil vs Japan
const MATCH_ID = 'add748d1-e4ca-4b0f-9cf3-412ce11c2029';

// Confirm the match has odds in DB before testing the UI
const oddsRes = await fetch(
  `${SUPABASE_URL}/rest/v1/matches?id=eq.${MATCH_ID}&select=team1,team2,odds,odds_last_updated`,
  { headers: HEADERS }
);
const [matchRow] = await oddsRes.json();
console.log(`\nDB check    : ${matchRow?.team1} vs ${matchRow?.team2}`);
console.log(`Odds in DB  :`, JSON.stringify(matchRow?.odds));

// ── Open page helper ──────────────────────────────────────────────────────────
async function openPage(path, waitMs = 3000) {
  const ctx  = await browser.newContext({ viewport: VIEWPORT });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()) });
  page.on('pageerror', err => consoleErrors.push('PAGE: ' + err.message));
  await page.goto(BASE);
  await page.waitForTimeout(300);
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), session);
  await page.goto(`${BASE}${path}`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(waitMs);
  return { ctx, page, consoleErrors };
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1: Odds widget renders with actual data (not skeleton, not "No odds")
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n=== TEST 1: Odds widget renders on match page ===');
{
  const { ctx, page, consoleErrors } = await openPage(`/match/${MATCH_ID}`);

  // Header and section visible
  check('"Match Odds" header visible', await page.isVisible('text=Match Odds'));
  check('"decimal" label visible',     await page.isVisible('text=decimal'));

  // Not in loading or empty state
  const noOddsText   = await page.isVisible('text=No odds data available yet.');
  const loadingSkels = await page.locator('.animate-pulse').count();
  check('Not in "No odds" state',     !noOddsText);
  check('No loading skeleton visible', loadingSkels === 0, `${loadingSkels} skeletons`);

  // Odds values — Brazil home win = 1.45, draw = 4.20, away = 7.50
  check('Home odds "1.45" visible',  await page.isVisible('text=1.45'));
  check('Draw odds "4.20" visible',  await page.isVisible('text=4.20'));
  check('Away odds "7.50" visible',  await page.isVisible('text=7.50'));

  await shot(page, '1-odds-widget');
  await ctx.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2: Favourite highlighted — Brazil (1.45) is the fav, should be gold
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n=== TEST 2: Favourite (lowest odds) gets gold highlight ===');
{
  const { ctx, page, consoleErrors } = await openPage(`/match/${MATCH_ID}`);

  // The favourite card has bg-wc-gold/[0.12] + ring-1 ring-wc-gold/50
  // We verify via the gold-coloured odds value text
  const goldOddsValue = page.locator('span.text-wc-gold.text-lg.font-black');
  const goldCount = await goldOddsValue.count();
  check('Exactly one gold odds value (the favourite)', goldCount === 1, `count: ${goldCount}`);

  const favText = await goldOddsValue.first().textContent();
  check('Favourite odds = 1.45 (Brazil home win)', favText?.trim() === '1.45', `got: ${favText?.trim()}`);

  await shot(page, '2-favourite-gold');
  await ctx.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3: Implied probability percentages shown
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n=== TEST 3: Implied probability % visible ===');
{
  const { ctx, page, consoleErrors } = await openPage(`/match/${MATCH_ID}`);

  // 1/1.45 = 68.97% → "69%", 1/4.20 = 23.8% → "24%", 1/7.50 = 13.33% → "13%"
  check('Home implied prob "69%" visible', await page.isVisible('text=69%'));
  check('Draw implied prob "24%" visible', await page.isVisible('text=24%'));
  check('Away implied prob "13%" visible', await page.isVisible('text=13%'));

  await shot(page, '3-implied-prob');
  await ctx.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 4: Over 2.5 goals row + disclaimer + refresh button
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n=== TEST 4: Over 2.5 row, disclaimer, refresh button ===');
{
  const { ctx, page, consoleErrors } = await openPage(`/match/${MATCH_ID}`);

  check('Over 2.5 goals row visible',           await page.isVisible('text=Over 2.5 goals'));
  check('Over 2.5 value "1.72" visible',        await page.isVisible('text=1.72'));
  check('"For entertainment only" disclaimer',  await page.isVisible('text=For entertainment only'));
  check('Refresh button present',               await page.isVisible('button:has-text("Refresh")'));
  check('No console errors',                    consoleErrors.length === 0, consoleErrors.slice(0,2).join(' | ') || 'none');

  await shot(page, '4-footer-row');
  await ctx.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 5: Multiple match pages — spot-check a Group D match
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n=== TEST 5: Group D match also has odds (Argentina vs Spain) ===');
{
  // Argentina vs Spain: home_win 2.20, draw 3.25, away_win 3.30
  const GROUP_D_MATCH = '89888ee3-e0da-420d-80cc-bedd5d09576d';
  const { ctx, page, consoleErrors } = await openPage(`/match/${GROUP_D_MATCH}`);

  check('"Match Odds" header visible',    await page.isVisible('text=Match Odds'));
  check('Home odds "2.20" visible',       await page.isVisible('text=2.20'));
  check('Draw odds "3.25" visible',       await page.isVisible('text=3.25'));
  check('Away odds "3.30" visible',       await page.isVisible('text=3.30'));

  await shot(page, '5-group-d');
  await ctx.close();
}

await browser.close();

console.log(`\n${'─'.repeat(50)}`);
console.log(`Phase 5 result: ${PASS} passed, ${FAIL} failed`);
if (FAIL > 0) process.exit(1);
