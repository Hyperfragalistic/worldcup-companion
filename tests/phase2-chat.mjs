/**
 * Phase 2 — Chat end-to-end test
 * Runs against the live Vercel deployment using Playwright (headless Chromium).
 *
 * Required env vars:
 *   SUPABASE_SERVICE_KEY   — service role key (bypasses RLS for test setup/teardown)
 *   TEST_USER_EMAIL        — magic-link email for the test account
 *
 * Usage:
 *   SUPABASE_SERVICE_KEY=<key> TEST_USER_EMAIL=you@example.com \
 *     node tests/phase2-chat.mjs
 */

import { chromium } from 'playwright';

const BASE         = 'https://worldcup-companion-beta.vercel.app';
const SUPABASE_URL = 'https://cxklsqbtmhxapebaqrlh.supabase.co';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY;
const TEST_EMAIL   = process.env.TEST_USER_EMAIL;

if (!SERVICE_KEY) { console.error('SUPABASE_SERVICE_KEY env var required'); process.exit(1); }
if (!TEST_EMAIL)  { console.error('TEST_USER_EMAIL env var required');       process.exit(1); }

const VIEWPORT  = { width: 390, height: 844 };
const HEADERS   = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' };
const E2E_TAG   = '[e2e]'; // prefix for test messages — makes cleanup easy

let USER_ID = '';

let PASS = 0, FAIL = 0;
function check(label, ok, detail = '') {
  console.log(`  ${ok ? '✅' : '❌'} ${label}${detail ? ' — ' + detail : ''}`);
  ok ? PASS++ : FAIL++;
}
async function shot(page, label) {
  await page.screenshot({ path: `/tmp/p2-${label}.png` });
  console.log(`  📸 /tmp/p2-${label}.png`);
}

// ── DB helpers ────────────────────────────────────────────────────────────────
async function deleteTestMessages(matchId) {
  await fetch(`${SUPABASE_URL}/rest/v1/messages?match_id=eq.${matchId}&content=like.*${encodeURIComponent(E2E_TAG)}*`, {
    method: 'DELETE', headers: HEADERS,
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

// Ensure onboarding is marked complete so the Phase 4 modal never blocks tests
await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${USER_ID}`, {
  method: 'PATCH',
  headers: { ...HEADERS, Prefer: 'return=minimal' },
  body: JSON.stringify({ onboarding_complete: true }),
});

// Use first available match (chat is always open regardless of match status)
const matchRes = await fetch(
  `${SUPABASE_URL}/rest/v1/matches?select=id,team1,team2&order=starts_at.asc&limit=1`,
  { headers: HEADERS }
);
const [TEST_MATCH] = await matchRes.json();
console.log(`Test match  : ${TEST_MATCH.team1} vs ${TEST_MATCH.team2} (${TEST_MATCH.id.slice(0, 8)}…)`);

// Clean up any leftover e2e messages from previous runs
await deleteTestMessages(TEST_MATCH.id);

// ── Page helper ───────────────────────────────────────────────────────────────
async function openMatchPage(extraRoutes) {
  const ctx  = await browser.newContext({ viewport: VIEWPORT });
  const page = await ctx.newPage();

  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()) });
  page.on('pageerror', err => consoleErrors.push('PAGE: ' + err.message));

  if (extraRoutes) await extraRoutes(ctx);

  await page.goto(BASE);
  await page.waitForTimeout(300);
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), session);
  await page.goto(`${BASE}/match/${TEST_MATCH.id}`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  return { ctx, page, consoleErrors };
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1: Chat section visible — heading, empty state or existing messages
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n=== TEST 1: Chat section visible ===');
{
  const { ctx, page, consoleErrors } = await openMatchPage();
  check('"Match Chat" heading visible', await page.isVisible('text=Match Chat'));
  check('Chat input present', await page.isVisible('input[placeholder="Say something…"]'));
  check('Send button present', await page.locator('button[type="submit"]').last().isVisible());
  check('No console errors', consoleErrors.length === 0, consoleErrors.slice(0,2).join(' | ') || 'none');
  await shot(page, '1-chat-visible');
  await ctx.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2: Send message — appears in list, input clears
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n=== TEST 2: Send message → appears in list, input clears ===');
const testMsg2 = `${E2E_TAG} send test ${Date.now()}`;
{
  const { ctx, page, consoleErrors } = await openMatchPage();

  const input = page.locator('input[placeholder="Say something…"]');
  await input.fill(testMsg2);
  check('Input has text before send', await input.inputValue() === testMsg2);

  // Submit by pressing Enter
  await input.press('Enter');
  await page.waitForTimeout(1500);

  check('Input cleared after send', (await input.inputValue()) === '');
  check('Message appears in chat list', await page.isVisible(`text=${testMsg2}`));
  check('No console errors', consoleErrors.length === 0, consoleErrors.slice(0,2).join(' | ') || 'none');

  await shot(page, '2-send-message');
  await ctx.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3: Real-time delivery — message sent in page A appears in page B
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n=== TEST 3: Real-time — message from page A appears in page B ===');
const testMsg3 = `${E2E_TAG} realtime ${Date.now()}`;
{
  // Open both pages, let Realtime subscriptions establish
  const { ctx: ctxA, page: pageA } = await openMatchPage();
  const { ctx: ctxB, page: pageB } = await openMatchPage();
  console.log('  Both pages open, waiting for Realtime subscriptions…');
  await pageA.waitForTimeout(3000);
  await pageB.waitForTimeout(3000);

  // Send from page A
  await pageA.locator('input[placeholder="Say something…"]').fill(testMsg3);
  await pageA.locator('input[placeholder="Say something…"]').press('Enter');
  console.log('  Message sent from page A, waiting for delivery…');

  // Page B should receive via Realtime without reload
  await pageB.waitForTimeout(4000);

  check('Message visible in sender (page A)', await pageA.isVisible(`text=${testMsg3}`));
  check('Message delivered to page B via Realtime', await pageB.isVisible(`text=${testMsg3}`));

  await shot(pageA, '3a-sender');
  await shot(pageB, '3b-receiver');
  await ctxA.close();
  await ctxB.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 4: Own messages — right-aligned with gold background
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n=== TEST 4: Own messages styled correctly ===');
const testMsg4 = `${E2E_TAG} style test ${Date.now()}`;
{
  const { ctx, page, consoleErrors } = await openMatchPage();

  await page.locator('input[placeholder="Say something…"]').fill(testMsg4);
  await page.locator('input[placeholder="Say something…"]').press('Enter');
  await page.waitForTimeout(1500);

  // Own messages render as gold bubbles in a flex-row-reverse container
  const ownBubble = page.locator('.bg-wc-gold').filter({ hasText: testMsg4 });
  check('Own message has gold background', await ownBubble.isVisible());

  // The bubble's parent div should have flex-row-reverse (right-aligned layout)
  // DOM: div.flex.flex-row-reverse > div.bg-wc-gold > p
  const container = page.locator('.flex.gap-2', { has: ownBubble });
  const containerClass = await container.getAttribute('class') ?? '';
  check('Own message is right-aligned (flex-row-reverse)', containerClass.includes('flex-row-reverse'),
    `class: ${containerClass}`);

  check('No console errors', consoleErrors.length === 0, consoleErrors.slice(0,2).join(' | ') || 'none');
  await shot(page, '4-own-message-style');
  await ctx.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 5: Error state — initial load failure shows error above chat input
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n=== TEST 5: Error state — failed message load shows error UI ===');
{
  const { ctx, page, consoleErrors } = await openMatchPage(async (ctx) => {
    // Intercept messages GET only — return a PostgREST-style error
    await ctx.route(/supabase\.co\/rest\/v1\/messages/, async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Connection failed', code: '500', details: null, hint: null }),
        });
      } else {
        const res = await route.fetch();
        await route.fulfill({ response: res });
      }
    });
  });

  // Error message should appear above the chat input
  const errorEl = page.locator('.text-red-400').filter({ hasText: /connection failed|error/i });
  check('Error message shown above input', await errorEl.isVisible().catch(() => false));
  check('Chat input still present (UI not broken)', await page.isVisible('input[placeholder="Say something…"]'));

  await shot(page, '5-error-state');
  await ctx.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// Cleanup — remove all e2e test messages
await deleteTestMessages(TEST_MATCH.id);
console.log('\n=== CLEANUP: e2e test messages deleted ===');

await browser.close();
console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${PASS} passed, ${FAIL} failed`);
console.log('Screenshots written to /tmp/p2-*.png');
if (FAIL > 0) process.exit(1);
