import { useMemo, useEffect, useRef } from 'react'
import { Trophy } from 'lucide-react'
import Layout from '../components/Layout'
import MatchCard from '../components/MatchCard'
import { useMatches } from '../hooks/useMatches'
import { useProfile } from '../hooks/useProfile'
import { useGeoLocation } from '../hooks/useGeoLocation'
import { formatMatchDate, teamFlag, WC_TEAM_BY_COUNTRY } from '../lib/utils'
import type { MatchWithPrediction } from '../lib/database.types'

export default function SchedulePage() {
  const { matches, loading, error } = useMatches()
  const { profile, updateProfile }  = useProfile()
  const geo                         = useGeoLocation()

  // Prevent the auto-save from firing more than once per session
  const autoSaved    = useRef(false)
  const updateRef    = useRef(updateProfile)
  useEffect(() => { updateRef.current = updateProfile }, [updateProfile])

  const favoriteTeam = profile?.favorite_team ?? null

  // On first load: if user has no team set and geo resolves to a WC country,
  // silently save it — no prompt needed, they can override any time on Profile.
  useEffect(() => {
    if (autoSaved.current)    return  // already ran this session
    if (profile === null)     return  // profile not loaded yet
    if (favoriteTeam)         return  // already has a team — nothing to do
    if (geo.loading)          return  // geo not resolved yet
    if (!geo.countryCode)     return  // geo failed or was denied

    const detected = WC_TEAM_BY_COUNTRY[geo.countryCode]
    if (!detected)            return  // country not in WC 2026 roster

    autoSaved.current = true
    updateRef.current({ favorite_team: detected })
  }, [profile, favoriteTeam, geo.loading, geo.countryCode])

  // Split into "my team's matches" and everything else
  const { myMatches, otherMatches } = useMemo(() => {
    if (!favoriteTeam) return { myMatches: [] as MatchWithPrediction[], otherMatches: matches }
    return {
      myMatches:    matches.filter(m => m.team1 === favoriteTeam || m.team2 === favoriteTeam),
      otherMatches: matches.filter(m => m.team1 !== favoriteTeam && m.team2 !== favoriteTeam),
    }
  }, [matches, favoriteTeam])

  // Group remaining matches by date for the full schedule section
  const byDate = useMemo(() => {
    const map = new Map<string, MatchWithPrediction[]>()
    for (const m of otherMatches) {
      const key = m.match_date
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(m)
    }
    return map
  }, [otherMatches])

  return (
    <Layout>
      {/* Header — shows team flag when favorite team is known */}
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-white/10 bg-wc-dark/95 px-4 py-3 backdrop-blur">
        <Trophy className="h-5 w-5 text-wc-gold" />
        <h1 className="font-semibold text-white">World Cup 2026</h1>
        {favoriteTeam && (
          <span className="ml-auto flex items-center gap-1.5">
            <span className="text-xl leading-none">{teamFlag(favoriteTeam)}</span>
            <span className="text-xs font-medium text-wc-gold">{favoriteTeam}</span>
          </span>
        )}
      </header>

      <div className="px-4 py-4">
        {loading && (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-wc-gold border-t-transparent" />
          </div>
        )}

        {error && (
          <p className="rounded-xl bg-red-500/10 p-4 text-sm text-red-400">{error}</p>
        )}

        {!loading && (
          <div className="space-y-6">

            {/* ── My Team's Matches ───────────────────────── */}
            {favoriteTeam && myMatches.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-wc-gold">
                  {teamFlag(favoriteTeam)}
                  <span>{favoriteTeam} Matches</span>
                </h2>
                <div className="space-y-3">
                  {myMatches.map(match => (
                    <MatchCard key={match.id} match={match} highlight />
                  ))}
                </div>
              </section>
            )}

            {/* ── Divider between team section and full schedule ── */}
            {favoriteTeam && myMatches.length > 0 && otherMatches.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">
                  All Matches
                </span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
            )}

            {/* ── Full schedule grouped by date ───────────── */}
            {Array.from(byDate.entries()).map(([date, dayMatches]) => (
              <section key={date}>
                <h2 className="mb-3 text-sm font-semibold text-gray-400">
                  {formatMatchDate(date)}
                </h2>
                <div className="space-y-3">
                  {dayMatches.map(match => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              </section>
            ))}

            {!loading && matches.length === 0 && (
              <p className="py-16 text-center text-sm text-gray-500">No matches found.</p>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
