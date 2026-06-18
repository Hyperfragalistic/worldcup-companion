import { chromium } from 'playwright'

const SUPABASE_URL         = 'https://cxklsqbtmhxapebaqrlh.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const TEST_EMAIL           = 'clchichung@gmail.com'
const BASE_URL             = 'http://localhost:5175'
const VERCEL_URL           = 'https://worldcup-companion-beta.vercel.app'

if (!SUPABASE_SERVICE_KEY) { console.error('SUPABASE_SERVICE_KEY required'); process.exit(1) }

const HEADERS = {
  apikey:         SUPABASE_SERVICE_KEY,
  Authorization:  `Bearer ${SUPABASE_SERVICE_KEY}`,
  'Content-Type': 'application/json',
}

async function genLink() {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: 'POST', headers: HEADERS,
    body: JSON.stringify({ type: 'magiclink', email: TEST_EMAIL, redirect_to: VERCEL_URL }),
  })
  const d = await r.json()
  if (!d.action_link) throw new Error('generate_link failed: ' + JSON.stringify(d))
  return d.action_link
}

async function dbGet(userId) {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=onboarding_complete,full_name,username,country,favorite_team`,
    { headers: HEADERS }
  )
  const rows = await r.json()
  return rows[0] ?? null
}

async function resetOnboarding(userId) {
  await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: { ...HEADERS, Prefer: 'return=minimal' },
    body: JSON.stringify({ onboarding_complete: false, username: null }),
  })
}

async function cleanup(userId) {
  await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: { ...HEADERS, Prefer: 'return=minimal' },
    body: JSON.stringify({ onboarding_complete: false, username: null }),
  })
}

// ─── main ─────────────────────────────────────────────────────────────────────
const browser = await chromium.launch({ headless: true })
let passed = 0, failed = 0

function ok(label)        { console.log(`  ✅ ${label}`); passed++ }
function fail(label, err) { console.log(`  ❌ ${label}: ${err}`); failed++ }

try {
  console.log('\n=== Phase 4 — Welcome + Onboarding modal ===')

  // ── Acquire session via magic link through browser ──────────────────────────
  let sessionData = null
  let userId = null
  {
    const authCtx  = await browser.newContext()
    const authPage = await authCtx.newPage()
    await authPage.goto(await genLink())
    await authPage.waitForURL(`${VERCEL_URL}/**`, { timeout: 15000 })
    await authPage.waitForTimeout(1500)
    sessionData = await authPage.evaluate(() => {
      const key = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
      return key ? { key, value: localStorage.getItem(key) } : null
    })
    await authCtx.close()
  }
  if (!sessionData) throw new Error('Could not acquire session from localStorage')
  userId = JSON.parse(sessionData.value)?.user?.id
  if (!userId) throw new Error('No user id in session')
  console.log('  User ID:', userId)

  await resetOnboarding(userId)

  const ctx  = await browser.newContext()
  const page = await ctx.newPage()

  // Inject session + clear welcome flag
  await page.goto(BASE_URL)
  await page.evaluate((s) => {
    localStorage.setItem(s.key, s.value)
    const parsed = JSON.parse(s.value)
    localStorage.removeItem(`wc_welcome_${parsed.user.id}`)
  }, sessionData)
  await page.reload()

  // 1. WelcomeModal should appear
  await page.waitForSelector('text=GOAL!', { timeout: 6000 })
  ok('WelcomeModal: GOAL! text visible')

  // 2. Soccer ball animation present
  const ball = page.locator('text=⚽')
  if (await ball.count() > 0) ok('WelcomeModal: soccer ball present')
  else fail('WelcomeModal: soccer ball not found', 'count=0')

  // 3. Countdown visible
  const countdown = page.locator('text=/\\(\\d+\\)/')
  if (await countdown.count() > 0) ok('WelcomeModal: countdown timer visible')
  else fail('WelcomeModal: countdown timer not found', '')

  // 4. Click Continue — should dismiss welcome and show OnboardingModal
  await page.getByRole('button', { name: /Continue/i }).click()
  await page.waitForSelector('text=Tell us about you', { timeout: 4000 })
  ok('OnboardingModal Step 1: visible after Continue')

  // 5. Full name input present
  const nameInput = page.locator('input[placeholder*="Jordan Smith"]')
  await nameInput.waitFor({ timeout: 3000 })
  ok('OnboardingModal Step 1: Full name input present')

  // 6. Username input present
  const usernameInput = page.locator('input[placeholder*="golazo_fan"]')
  await usernameInput.waitFor({ timeout: 3000 })
  ok('OnboardingModal Step 1: Username input present')

  // 7. Next button disabled when form is empty
  const nextBtn = page.getByRole('button', { name: /^Next$/ })
  const isDisabled = await nextBtn.evaluate(el => el.disabled)
  if (isDisabled) ok('OnboardingModal Step 1: Next disabled when form is empty')
  else fail('OnboardingModal Step 1: Next button should be disabled', 'not disabled')

  // 8. Fill name + username, wait for availability
  const testName     = 'Phase4 Test User'
  const testUsername = `phase4_test_${Date.now()}`
  await nameInput.fill(testName)
  await usernameInput.fill(testUsername)
  await page.waitForSelector('text=Available!', { timeout: 5000 })
  ok('OnboardingModal Step 1: username availability check → Available!')

  // 9. Next now enabled
  const isNowEnabled = !(await nextBtn.evaluate(el => el.disabled))
  if (isNowEnabled) ok('OnboardingModal Step 1: Next enabled after valid input')
  else fail('OnboardingModal Step 1: Next button still disabled', '')

  // 10. Advance to Step 2
  await nextBtn.click()
  await page.waitForSelector('text=Your football identity', { timeout: 4000 })
  ok('OnboardingModal Step 2: visible after Next')

  // 11. Step indicator
  if (await page.locator('text=Step 2 of 2').count() > 0)
    ok('OnboardingModal Step 2: "Step 2 of 2" indicator correct')
  else
    fail('OnboardingModal Step 2: step indicator not found', '')

  // 12. Country input
  const countryInput = page.locator('input[placeholder*="United States"]')
  await countryInput.waitFor({ timeout: 3000 })
  ok('OnboardingModal Step 2: Country input present')

  // 13. Team select
  const teamSelect = page.locator('select')
  await teamSelect.waitFor({ timeout: 3000 })
  ok('OnboardingModal Step 2: Team select present')

  // 14. Back button
  const backBtn = page.getByRole('button', { name: /^Back$/ })
  if (await backBtn.count() > 0) ok('OnboardingModal Step 2: Back button visible')
  else fail('OnboardingModal Step 2: Back button not found', '')

  // 15. Back returns to Step 1
  await backBtn.click()
  await page.waitForSelector('text=Tell us about you', { timeout: 3000 })
  ok('OnboardingModal: Back returns to Step 1')

  // 16. Re-advance (state preserved)
  await page.waitForSelector('text=Available!', { timeout: 5000 })
  await page.getByRole('button', { name: /^Next$/ }).click()
  await page.waitForSelector('text=Your football identity', { timeout: 4000 })

  // 17. Fill Step 2 and submit
  await countryInput.fill('United States')
  await teamSelect.selectOption('USA')

  const letsGoBtn = page.getByRole('button', { name: /Let's go!/i })

  // Wait for the profiles PATCH to complete before checking the DB.
  // The optimistic update shows "Schedule" before Supabase confirms the write,
  // so we listen for the network response instead of the UI change.
  const patchDone = page.waitForResponse(
    r => r.url().includes('/rest/v1/profiles') && r.request().method() === 'PATCH',
    { timeout: 8000 }
  )
  await letsGoBtn.click()
  await patchDone

  await page.waitForSelector('text=Schedule', { timeout: 5000 })
  ok('OnboardingModal: submits successfully, modal closes, schedule visible')

  // 18. Verify DB fields
  const profileAfter = await dbGet(userId)

  if (profileAfter?.onboarding_complete === true)
    ok('DB: onboarding_complete = true')
  else
    fail('DB: onboarding_complete not set', JSON.stringify(profileAfter))

  if (profileAfter?.full_name === testName)
    ok(`DB: full_name = "${profileAfter.full_name}"`)
  else
    fail('DB: full_name mismatch', `expected "${testName}", got "${profileAfter?.full_name}"`)

  if (profileAfter?.country === 'United States')
    ok('DB: country = "United States"')
  else
    fail('DB: country mismatch', profileAfter?.country)

  if (profileAfter?.favorite_team === 'USA')
    ok('DB: favorite_team = "USA"')
  else
    fail('DB: favorite_team mismatch', profileAfter?.favorite_team)

  // 19. Reload — modal must NOT reappear
  await page.reload()
  await page.waitForTimeout(3000)
  const modalAfterReload = await page.locator('text=Tell us about you').count()
  if (modalAfterReload === 0) ok('OnboardingGate: modal does NOT reappear after completion')
  else fail('OnboardingGate: modal still appeared after onboarding_complete = true', '')

  await cleanup(userId)
  await ctx.close()

} catch (err) {
  console.error('\nFatal error:', err)
  failed++
} finally {
  await browser.close()
  console.log(`\n${passed + failed} checks — ${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}
