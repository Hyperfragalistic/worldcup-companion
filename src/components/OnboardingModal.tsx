import { useState, useEffect, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Check, Loader2, AlertCircle, MapPin } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useSupabase } from '../providers/SupabaseProvider'
import { WC_TEAM_BY_COUNTRY, teamFlag } from '../lib/utils'
import type { Profile } from '../lib/database.types'
import type { GeoLocationState } from '../hooks/useGeoLocation'

const WC_TEAMS = [...new Set(Object.values(WC_TEAM_BY_COUNTRY))].sort()

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

interface Props {
  profile:       Profile | null
  geo:           GeoLocationState
  updateProfile: (updates: Partial<Pick<Profile,
    'username' | 'full_name' | 'favorite_team' | 'country' | 'onboarding_complete'
  >>) => Promise<string | null>
  onComplete: () => void
}

// Slide animation for step transitions
const stepVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
  exit:  (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0, transition: { duration: 0.2 } }),
}

export default function OnboardingModal({ profile, geo, updateProfile, onComplete }: Props) {
  const { user } = useSupabase()

  // ── Form state ──────────────────────────────────────────────────────────────
  const [step,         setStep]         = useState(1)
  const [direction,    setDirection]    = useState(1)   // +1 = forward, -1 = back
  const [fullName,     setFullName]     = useState(profile?.full_name     ?? '')
  const [username,     setUsername]     = useState(profile?.username      ?? '')
  const [country,      setCountry]      = useState(profile?.country       ?? '')
  const [favoriteTeam, setFavoriteTeam] = useState(profile?.favorite_team ?? '')
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  // ── Username availability check (debounced 500 ms) ──────────────────────────
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>(
    profile?.username ? 'available' : 'idle'
  )

  useEffect(() => {
    const trimmed = username.trim()
    if (!trimmed) { setUsernameStatus('idle'); return }
    if (trimmed.length < 3) { setUsernameStatus('invalid'); return }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) { setUsernameStatus('invalid'); return }

    setUsernameStatus('checking')
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', trimmed)
        .neq('id', user?.id ?? '')  // exclude ourselves
        .maybeSingle()
      setUsernameStatus(data ? 'taken' : 'available')
    }, 500)
    return () => clearTimeout(t)
  }, [username, user?.id])

  // ── Pre-fill country from geolocation if still empty ───────────────────────
  useEffect(() => {
    if (!geo.loading && geo.countryName && !country) {
      setCountry(geo.countryName)
    }
  }, [geo.loading, geo.countryName])

  // ── Pre-fill team from country whenever country changes ────────────────────
  useEffect(() => {
    if (favoriteTeam) return  // don't overwrite a manual pick

    // Map country name → country code → team
    // geo gives us the code directly; for typed names we do a best-effort match
    const code = geo.countryCode ?? null
    if (code) {
      const suggested = WC_TEAM_BY_COUNTRY[code]
      if (suggested) setFavoriteTeam(suggested)
    }
  }, [geo.countryCode])

  // ── Navigation ──────────────────────────────────────────────────────────────
  function goNext() {
    setDirection(1)
    setStep(s => s + 1)
  }
  function goBack() {
    setDirection(-1)
    setStep(s => s - 1)
  }

  const step1Valid =
    fullName.trim().length >= 1 &&
    username.trim().length >= 3 &&
    usernameStatus === 'available'

  // ── Submit (step 2) ─────────────────────────────────────────────────────────
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const err = await updateProfile({
      full_name:           fullName.trim()     || null,
      username:            username.trim()     || null,
      country:             country.trim()      || null,
      favorite_team:       favoriteTeam        || null,
      onboarding_complete: true,               // ← gate that prevents showing again
    })

    setSaving(false)

    if (err) {
      // Username uniqueness is enforced by a DB unique index; surface it clearly
      setError(err.includes('unique') ? 'That username is already taken.' : err)
    } else {
      onComplete()
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function UsernameIndicator() {
    if (usernameStatus === 'idle')     return null
    if (usernameStatus === 'checking') return <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
    if (usernameStatus === 'available') return <Check className="h-4 w-4 text-green-400" />
    if (usernameStatus === 'taken')    return <AlertCircle className="h-4 w-4 text-red-400" />
    if (usernameStatus === 'invalid')  return <AlertCircle className="h-4 w-4 text-amber-400" />
    return null
  }

  function usernameHint() {
    if (usernameStatus === 'taken')   return 'Username already taken'
    if (usernameStatus === 'invalid') return 'Min 3 chars, letters/numbers/underscores only'
    if (usernameStatus === 'available') return 'Available!'
    return ''
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    // Overlay — full-screen backdrop with blur, same z as WelcomeModal
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">

      {/* Sheet — slides up from bottom on mobile, centered on desktop */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0,  opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="w-full max-w-sm rounded-t-3xl bg-wc-dark pb-safe sm:rounded-3xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-wc-gold">
              Step {step} of 2
            </p>
            <h2 className="mt-0.5 text-base font-bold text-white">
              {step === 1 ? 'Tell us about you' : 'Your football identity'}
            </h2>
          </div>
          {/* Progress dots */}
          <div className="flex gap-1.5">
            {[1, 2].map(s => (
              <div
                key={s}
                className={`h-2 w-2 rounded-full transition-colors ${
                  s === step ? 'bg-wc-gold' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Animated step content */}
        <div className="overflow-hidden px-6 py-5" style={{ minHeight: 240 }}>
          <AnimatePresence mode="wait" custom={direction}>
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-4"
              >
                {/* Full name */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Jordan Smith"
                    maxLength={60}
                    autoFocus
                    className="w-full rounded-xl bg-wc-surface px-4 py-3 text-sm text-white placeholder-gray-600 outline-none ring-1 ring-white/10 transition focus:ring-wc-gold"
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">
                    Username <span className="text-gray-600">(shown in chat)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, '_'))}
                      placeholder="e.g. golazo_fan"
                      maxLength={30}
                      className="w-full rounded-xl bg-wc-surface px-4 py-3 pr-10 text-sm text-white placeholder-gray-600 outline-none ring-1 ring-white/10 transition focus:ring-wc-gold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      <UsernameIndicator />
                    </span>
                  </div>
                  {usernameHint() && (
                    <p className={`mt-1 text-xs ${
                      usernameStatus === 'available' ? 'text-green-400' :
                      usernameStatus === 'taken'     ? 'text-red-400'   : 'text-amber-400'
                    }`}>
                      {usernameHint()}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.form
                key="step2"
                id="step2-form"
                onSubmit={handleSubmit}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-4"
              >
                {/* Country */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-400">
                    Your country
                    {/* Show pin icon when value came from geo */}
                    {geo.countryName && country === geo.countryName && (
                      <span className="flex items-center gap-0.5 text-[10px] text-wc-gold">
                        <MapPin className="h-3 w-3" /> detected
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    placeholder="e.g. United States"
                    maxLength={60}
                    className="w-full rounded-xl bg-wc-surface px-4 py-3 text-sm text-white placeholder-gray-600 outline-none ring-1 ring-white/10 transition focus:ring-wc-gold"
                  />
                  {geo.error && (
                    <p className="mt-1 text-xs text-gray-600">
                      Location unavailable — enter manually
                    </p>
                  )}
                </div>

                {/* Favourite team */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">
                    Favourite team
                  </label>
                  <select
                    value={favoriteTeam}
                    onChange={e => setFavoriteTeam(e.target.value)}
                    className="w-full rounded-xl bg-wc-surface px-4 py-3 text-sm text-white outline-none ring-1 ring-white/10 transition focus:ring-wc-gold"
                  >
                    <option value="">— Select a team —</option>
                    {WC_TEAMS.map(t => (
                      <option key={t} value={t}>
                        {teamFlag(t)} {t}
                      </option>
                    ))}
                  </select>
                </div>

                {error && (
                  <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
                    {error}
                  </p>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Footer buttons */}
        <div className="flex gap-3 border-t border-white/10 px-6 py-4">
          {step === 2 && (
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-400 transition hover:border-white/20 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          )}

          {step === 1 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!step1Valid}
              className="ml-auto flex items-center gap-2 rounded-xl bg-wc-gold px-5 py-2.5 text-sm font-semibold text-wc-dark transition hover:brightness-110 disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              form="step2-form"
              disabled={saving}
              className="ml-auto flex items-center gap-2 rounded-xl bg-wc-gold px-5 py-2.5 text-sm font-semibold text-wc-dark transition hover:brightness-110 disabled:opacity-60"
            >
              {saving
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                : <><Check className="h-4 w-4" /> Let's go!</>
              }
            </button>
          )}
        </div>

      </motion.div>
    </div>
  )
}
