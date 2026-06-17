import { useState, useEffect, type FormEvent } from 'react'
import { LogOut, Save, Loader2, CheckCircle } from 'lucide-react'
import Layout from '../components/Layout'
import { useProfile } from '../hooks/useProfile'
import { useGeoLocation } from '../hooks/useGeoLocation'
import { supabase } from '../lib/supabaseClient'
import { WC_TEAM_BY_COUNTRY, teamFlag } from '../lib/utils'

const TEAMS = [
  'Argentina', 'Australia', 'Belgium', 'Brazil', 'Cameroon', 'Canada',
  'Croatia', 'Denmark', 'Ecuador', 'England', 'France', 'Germany',
  'Ghana', 'Iran', 'Japan', 'Mexico', 'Morocco', 'Netherlands',
  'Nigeria', 'Poland', 'Portugal', 'Senegal', 'South Korea', 'Spain',
  'Switzerland', 'Tunisia', 'USA', 'Uruguay', 'Wales',
]

export default function ProfilePage() {
  const { profile, loading, updateProfile } = useProfile()
  const geo = useGeoLocation()

  const [username,     setUsername]     = useState('')
  const [fullName,     setFullName]     = useState('')
  const [favoriteTeam, setFavoriteTeam] = useState('')
  const [country,      setCountry]      = useState('')

  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)

  // Team suggested by geolocation, if it's on the WC 2026 roster
  const suggestedTeam = geo.countryCode ? (WC_TEAM_BY_COUNTRY[geo.countryCode] ?? null) : null
  // Show only when: geo resolved, field empty, suggestion available, not dismissed
  const showSuggestion = !geo.loading && suggestedTeam !== null && favoriteTeam === '' && !dismissed

  // Populate form when profile loads
  useEffect(() => {
    if (!profile) return
    setUsername(profile.username     ?? '')
    setFullName(profile.full_name    ?? '')
    setFavoriteTeam(profile.favorite_team ?? '')
    setCountry(profile.country       ?? '')
  }, [profile])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const err = await updateProfile({
      username:      username.trim()     || null,
      full_name:     fullName.trim()     || null,
      favorite_team: favoriteTeam        || null,
      country:       country.trim()      || null,
    })

    setSaving(false)

    if (err) {
      setError(err)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex h-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-wc-gold border-t-transparent" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="px-4 py-6">
        <h1 className="mb-6 text-xl font-bold text-white">Profile</h1>

        <form onSubmit={handleSave} className="space-y-4">

          {/* Username */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">
              Username <span className="text-gray-600">(shown in chat)</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. golazo_fan"
              maxLength={30}
              className="w-full rounded-xl bg-wc-surface px-4 py-3 text-sm text-white placeholder-gray-600 outline-none ring-1 ring-white/10 transition focus:ring-wc-gold"
            />
          </div>

          {/* Full name */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="e.g. Jordan Smith"
              maxLength={60}
              className="w-full rounded-xl bg-wc-surface px-4 py-3 text-sm text-white placeholder-gray-600 outline-none ring-1 ring-white/10 transition focus:ring-wc-gold"
            />
          </div>

          {/* Favourite team */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">Favourite team</label>
            <select
              value={favoriteTeam}
              onChange={e => {
                setFavoriteTeam(e.target.value)
                // Re-surface suggestion if user clears the field
                if (e.target.value === '') setDismissed(false)
              }}
              className="w-full rounded-xl bg-wc-surface px-4 py-3 text-sm text-white outline-none ring-1 ring-white/10 transition focus:ring-wc-gold"
            >
              <option value="">— Select a team —</option>
              {TEAMS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            {/* Location-based suggestion */}
            {showSuggestion && (
              <div className="mt-2 flex items-center justify-between rounded-lg bg-wc-gold/10 px-3 py-2 ring-1 ring-wc-gold/30">
                <span className="text-xs text-wc-gold">
                  {teamFlag(suggestedTeam!)} Detected location — use{' '}
                  <strong>{suggestedTeam}</strong>?
                </span>
                <div className="flex items-center gap-3 pl-2">
                  <button
                    type="button"
                    onClick={() => { setFavoriteTeam(suggestedTeam!); setDismissed(true) }}
                    className="text-xs font-semibold text-wc-gold underline underline-offset-2"
                  >
                    Use it
                  </button>
                  <button
                    type="button"
                    onClick={() => setDismissed(true)}
                    className="text-sm leading-none text-gray-500 transition hover:text-white"
                    aria-label="Dismiss suggestion"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Country */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">Your country</label>
            <input
              type="text"
              value={country}
              onChange={e => setCountry(e.target.value)}
              placeholder="e.g. United States"
              maxLength={60}
              className="w-full rounded-xl bg-wc-surface px-4 py-3 text-sm text-white placeholder-gray-600 outline-none ring-1 ring-white/10 transition focus:ring-wc-gold"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
          )}

          {/* Save button */}
          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-wc-gold py-3 text-sm font-semibold text-wc-dark transition hover:brightness-110 disabled:opacity-60"
          >
            {saving  ? <Loader2 className="h-4 w-4 animate-spin" />     : null}
            {saved   ? <CheckCircle className="h-4 w-4 text-wc-dark" /> : null}
            {!saving && !saved && <Save className="h-4 w-4" />}
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save profile'}
          </button>
        </form>

        {/* Sign out */}
        <button
          onClick={() => supabase.auth.signOut()}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-sm text-gray-400 transition hover:border-white/20 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </Layout>
  )
}
