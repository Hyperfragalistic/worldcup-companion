/**
 * Phase 1 — Predictions & Profile end-to-end test
 * Runs against the live Vercel deployment using Playwright (headless Chromium).
 *
 * Required env vars:
 *   SUPABASE_SERVICE_KEY   — service role key (bypasses RLS for test setup/teardown)
 *   TEST_USER_EMAIL        — magic-link email for the test account
 *
 * Usage:
 *   SUPABASE_SERVICE_KEY=<key> TEST_USER_EMAIL=you@example.com \
 *     node tests/phase1-predictions.mjs
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

let USER_ID = '';

let PASS = 0, FAIL = 0;
function check(label, ok, detail = '') {
  console.log(`  ${ok ? '✅' : '❌'} ${label}${detail ? ' — ' + detail : ''}`);
  ok ? PASS++ : FAIL++;
}
async function shot(page, label) {
  await page.screenshot({ path: `/tmp/p1-${label}.png` });
  console.log(`  📸 /tmp/p1-${label}.png`);
}

// ── DB helpers ────────────────────────────────────────────────────────────────
async function dbPrediction(matchId) {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/predictions?user_id=eq.${USER_ID}&match_id=eq.${matchId}&select=home_score,away_score`,
    { headers: HEADERS }
  );
  const d = await r.json();
  return d[0] ?? null;
}
async function clearPrediction(matchId) {
  await fetch(`${SUPABASE_URL}/rest/v1/predictions?user_id=eq.${USER_ID}&match_id=eq.${matchId}`, {
    method: 'DELETE', headers: HEADERS,
  });
}
async function dbProfile() {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${USER_ID}&select=username,favorite_team`, { headers: HEADERS });
  const d = await r.json();
  return d[0] ?? null;
}
async function setUsername(username) {
  await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${USER_ID}`, {
    method: 'PATCH',
    headers: { ...HEADERS, Prefer: 'return=minimal' },
    body: JSON.stringify({ username }),
  });
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

// ── Acquire session ───────────────────────────────────────────────────────────
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
console.log('Session key :', session?.key);
console.log('User ID     :', USER_ID);

// ── Find a safely-upcoming match (≥2h away, guaranteed unlocked) ─────────────
const twoHoursAhead = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
const matchRes = await fetch(
  `${SUPABASE_URL}/rest/v1/matches?starts_at=gt.${encodeURIComponent(twoHoursAhead)}&select=id,team1,team2,starts_at&order=starts_at.asc&limit=1`,
  { headers: HEADERS }
);
const [TEST_MATCH] = await matchRes.json();
if (!TEST_MATCH) { console.error('No upcoming unlocked match found — all matches may have started.'); process.exit(1); }
console.log(`Test match  : ${TEST_MATCH.team1} vs ${TEST_MATCH.team2} (${TEST_MATCH.id.slice(0, 8)}…)`);

// ── Open page helper ──────────────────────────────────────────────────────────
async function openPage(path, waitMs = 2500) {
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
// TEST 1: Schedule — 24 match cards render
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n=== TEST 1: Schedule loads 24 match cards ===');
{
  const { ctx, page, consoleErrors } = await openPage('/');
  const cards = await page.locator('button.w-full.rounded-xl').count();
  check('24 match cards rendered', cards === 24, `count: ${cards}`);
  check('Schedule header visible', await page.isVisible('text=World Cup 2026'));
  check('No console errors', consoleErrors.length === 0, consoleErrors.slice(0,2).join(' | ') || 'none');
  await shot(page, '1-schedule');
  await ctx.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2: Match page structure — hero, prediction form, chat section
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n=== TEST 2: Match page structure — ${TEST_MATCH.team1} vs ${TEST_MATCH.team2} ===`);
{
  const { ctx, page, consoleErrors } = await openPage(`/match/${TEST_MATCH.id}`);
  check('Team 1 name visible in hero', await page.isVisible(`text=${TEST_MATCH.team1}`));
  check('Team 2 name visible in hero', await page.isVisible(`text=${TEST_MATCH.team2}`));
  check('"Your Prediction" section visible', await page.isVisible('text=Your Prediction'));
  check('"Match Chat" section visible', await page.isVisible('text=Match Chat'));
  check('Stepper "−" buttons present', await page.locator('form button').filter({ hasText: '−' }).first().isVisible());
  check('No console errors', consoleErrors.length === 0, consoleErrors.slice(0,2).join(' | ') || 'none');
  await shot(page, '2-match-structure');
  await ctx.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3: Submit new prediction (home 2 – away 1)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n=== TEST 3: Submit new prediction (2–1) ===');
await clearPrediction(TEST_MATCH.id);
console.log('  Existing prediction cleared');
{
  const { ctx, page, consoleErrors } = await openPage(`/match/${TEST_MATCH.id}`);

  // Steppers start at 0-0 (no existing prediction)
  const form    = page.locator('form');
  const plusBtns = form.getByRole('button', { name: '+' });

  // Home +2, Away +1
  await plusBtns.first().click();
  await plusBtns.first().click();
  await plusBtns.last().click();

  // Verify display shows 2 and 1
  const stepperSpans = form.locator('span.w-8');
  const homeVal = await stepperSpans.first().textContent();
  const awayVal = await stepperSpans.last().textContent();
  check('Home stepper shows 2', homeVal?.trim() === '2', `got: ${homeVal?.trim()}`);
  check('Away stepper shows 1', awayVal?.trim() === '1', `got: ${awayVal?.trim()}`);

  // Submit
  await page.getByRole('button', { name: 'Submit prediction' }).click();
  await page.waitForTimeout(1500);

  check('"Update prediction" button appears after save', await page.isVisible('text=Update prediction'));
  check('No console errors', consoleErrors.length === 0, consoleErrors.slice(0,2).join(' | ') || 'none');

  // Verify DB
  const pred = await dbPrediction(TEST_MATCH.id);
  check('Prediction saved to DB (2–1)', pred?.home_score === 2 && pred?.away_score === 1,
    `got: ${pred?.home_score}-${pred?.away_score}`);

  await shot(page, '3-submit-prediction');
  await ctx.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 4: Pre-fill — reopening the match page shows saved scores in steppers
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n=== TEST 4: Stepper pre-fills from saved prediction ===');
{
  const { ctx, page, consoleErrors } = await openPage(`/match/${TEST_MATCH.id}`);

  const form       = page.locator('form');
  const stepperSpans = form.locator('span.w-8');
  const homeVal = await stepperSpans.first().textContent();
  const awayVal = await stepperSpans.last().textContent();
  check('Home stepper pre-filled with 2', homeVal?.trim() === '2', `got: ${homeVal?.trim()}`);
  check('Away stepper pre-filled with 1', awayVal?.trim() === '1', `got: ${awayVal?.trim()}`);
  check('"Update prediction" button shown', await page.isVisible('text=Update prediction'));
  check('No console errors', consoleErrors.length === 0, consoleErrors.slice(0,2).join(' | ') || 'none');

  await shot(page, '4-prefill');
  await ctx.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 5: Update prediction to 3–2, DB reflects new values
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n=== TEST 5: Update prediction to 3–2 ===');
{
  const { ctx, page, consoleErrors } = await openPage(`/match/${TEST_MATCH.id}`);

  const form     = page.locator('form');
  const plusBtns  = form.getByRole('button', { name: '+' });
  const minusBtns = form.getByRole('button', { name: '−' });

  // Currently 2-1. Go to 3-2: home +1, away +1
  await plusBtns.first().click(); // home: 2→3
  await plusBtns.last().click();  // away: 1→2

  const stepperSpans = form.locator('span.w-8');
  const homeVal = await stepperSpans.first().textContent();
  const awayVal = await stepperSpans.last().textContent();
  check('Home stepper shows 3', homeVal?.trim() === '3', `got: ${homeVal?.trim()}`);
  check('Away stepper shows 2', awayVal?.trim() === '2', `got: ${awayVal?.trim()}`);

  await page.getByRole('button', { name: 'Update prediction' }).click();
  await page.waitForTimeout(1500);

  const pred = await dbPrediction(TEST_MATCH.id);
  check('DB updated to 3–2', pred?.home_score === 3 && pred?.away_score === 2,
    `got: ${pred?.home_score}-${pred?.away_score}`);
  check('No console errors', consoleErrors.length === 0, consoleErrors.slice(0,2).join(' | ') || 'none');

  await shot(page, '5-update-prediction');
  await ctx.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 6: Profile page — save username, verify DB, restore original
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n=== TEST 6: Profile — save username ===');
const originalProfile = await dbProfile();
const testUsername    = 'e2e_test_user';
console.log(`  Original username: ${originalProfile?.username}`);
{
  const { ctx, page, consoleErrors } = await openPage('/profile', 2000);

  // Username is the first text input on the page (placeholder "e.g. golazo_fan")
  const usernameInput = page.locator('input[placeholder*="golazo_fan"]');
  await usernameInput.fill(testUsername);

  // Save
  await page.getByRole('button', { name: 'Save profile' }).click();
  await page.waitForTimeout(1500);

  const saved = await dbProfile();
  check('Username saved to DB', saved?.username === testUsername, `got: ${saved?.username}`);
  check('No console errors', consoleErrors.length === 0, consoleErrors.slice(0,2).join(' | ') || 'none');

  await shot(page, '6-profile-save');
  await ctx.close();
}
// Restore original username
await setUsername(originalProfile?.username ?? 'clinton_wc26');
console.log(`  Restored username to: ${originalProfile?.username}`);

// Cleanup — remove test prediction so the next run starts fresh
await clearPrediction(TEST_MATCH.id);
console.log('\n=== CLEANUP: test prediction removed ===');

await browser.close();
console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${PASS} passed, ${FAIL} failed`);
console.log('Screenshots written to /tmp/p1-*.png');
if (FAIL > 0) process.exit(1);
