import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Trophy, X } from 'lucide-react'
import Layout from '../components/Layout'
import MatchCard from '../components/MatchCard'
import { useMatches } from '../hooks/useMatches'
import { useProfile } from '../hooks/useProfile'
import { useGeoLocation } from '../hooks/useGeoLocation'
import { deriveStatus, formatMatchDate, teamFlag, WC_TEAM_BY_COUNTRY } from '../lib/utils'
import type { MatchWithPrediction } from '../lib/database.types'

// ── Types ─────────────────────────────────────────────────────────────────────
type TabId = 'today' | 'myteam' | 'upcoming' | 'all'

interface Tab {
  id:    TabId
  label: string
  count: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function todayDateString(): string {
  return new Date().toLocaleDateString('en-CA') // 'YYYY-MM-DD' in local time
}

function groupByDate(matches: MatchWithPrediction[]): Map<string, MatchWithPrediction[]> {
  const map = new Map<string, MatchWithPrediction[]>()
  for (const m of matches) {
    if (!map.has(m.match_date)) map.set(m.match_date, [])
    map.get(m.match_date)!.push(m)
  }
  return map
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SchedulePage() {
  const { matches, loading, error } = useMatches()
  const { profile, updateProfile }  = useProfile()
  const geo                         = useGeoLocation()
  const [params, setParams]         = useSearchParams()

  // Persist tab + search in URL so refreshes and back-nav restore state
  const activeTab = (params.get('tab') as TabId | null) ?? 'today'
  const searchRaw = params.get('q') ?? ''

  // Local search input (instant) — URL param is the debounced source of truth
  const [searchInput, setSearchInput] = useState(searchRaw)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const favoriteTeam = profile?.favorite_team ?? null
  const autoSaved    = useRef(false)
  const updateRef    = useRef(updateProfile)
  useEffect(() => { updateRef.current = updateProfile }, [updateProfile])

  // Auto-save geo → favorite team on first load if unset
  useEffect(() => {
    if (autoSaved.current || profile === null || favoriteTeam) return
    if (geo.loading || !geo.countryCode) return
    const detected = WC_TEAM_BY_COUNTRY[geo.countryCode]
    if (!detected) return
    autoSaved.current = true
    updateRef.current({ favorite_team: detected })
  }, [profile, favoriteTeam, geo.loading, geo.countryCode])

  // Sync input when URL param changes externally (e.g. back/forward)
  useEffect(() => { setSearchInput(params.get('q') ?? '') }, [params])

  const handleSearch = useCallback((value: string) => {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setParams(prev => {
        const next = new URLSearchParams(prev)
        if (value) next.set('q', value)
        else next.delete('q')
        return next
      }, { replace: true })
    }, 300)
  }, [setParams])

  const setTab = useCallback((id: TabId) => {
    setParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('tab', id)
      return next
    }, { replace: true })
  }, [setParams])

  const handleClearSearch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSearchInput('')
    setParams(prev => {
      const next = new URLSearchParams(prev)
      next.delete('q')
      return next
    }, { replace: true })
  }, [setParams])

  const today = todayDateString()

  // Per-tab match counts (no search applied — shows "universe" for each tab)
  const counts = useMemo(() => {
    const live = matches.filter(m => deriveStatus(m) === 'live')
    return {
      today:    matches.filter(m => deriveStatus(m) === 'live' || m.match_date === today).length,
      myteam:   favoriteTeam ? matches.filter(m => m.team1 === favoriteTeam || m.team2 === favoriteTeam).length : 0,
      upcoming: matches.filter(m => deriveStatus(m) === 'upcoming').length,
      all:      matches.length,
      hasLive:  live.length > 0,
    }
  }, [matches, favoriteTeam, today])

  const TABS: Tab[] = useMemo(() => [
    { id: 'today',    label: counts.hasLive ? '● Live' : 'Today',    count: counts.today },
    { id: 'myteam',   label: favoriteTeam ? `${teamFlag(favoriteTeam)} My Team` : 'My Team', count: counts.myteam },
    { id: 'upcoming', label: 'Upcoming',  count: counts.upcoming },
    { id: 'all',      label: 'All',       count: counts.all },
  ], [counts, favoriteTeam])

  // Filtered matches for current tab + search
  const filtered = useMemo(() => {
    let list = matches

    // Search filter
    const q = searchRaw.trim().toLowerCase()
    if (q) {
      list = list.filter(m =>
        m.team1.toLowerCase().includes(q) ||
        m.team2.toLowerCase().includes(q) ||
        (m.venue?.toLowerCase().includes(q) ?? false) ||
        m.round.toLowerCase().includes(q)
      )
    }

    // Tab filter
    switch (activeTab) {
      case 'today':
        return list.filter(m => deriveStatus(m) === 'live' || m.match_date === today)
      case 'myteam':
        if (!favoriteTeam) return list
        return list.filter(m => m.team1 === favoriteTeam || m.team2 === favoriteTeam)
      case 'upcoming':
        return list.filter(m => deriveStatus(m) === 'upcoming')
      case 'all':
      default:
        return list
    }
  }, [matches, searchRaw, activeTab, favoriteTeam, today])

  const byDate = useMemo(() => groupByDate(filtered), [filtered])

  const isSearching = searchRaw.trim().length > 0

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Layout>
      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-wc-dark/95 backdrop-blur">
        {/* Title row */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
          <Trophy className="h-5 w-5 flex-shrink-0 text-wc-gold" />
          <h1 className="font-semibold text-white">World Cup 2026</h1>
          {favoriteTeam && (
            <span className="ml-auto flex items-center gap-1.5">
              <span className="text-xl leading-none">{teamFlag(favoriteTeam)}</span>
              <span className="text-xs font-medium text-wc-gold">{favoriteTeam}</span>
            </span>
          )}
        </div>

        {/* Search bar */}
        <div className="relative mx-4 mb-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            type="search"
            placeholder="Search teams, venues…"
            value={searchInput}
            onChange={e => handleSearch(e.target.value)}
            className="w-full rounded-xl bg-wc-surface py-2 pl-9 pr-9 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-wc-gold/50"
          />
          {searchInput && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Tab bar — horizontally scrollable */}
        <div
          className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-none"
          role="tablist"
        >
          {TABS.map(tab => {
            const isActive = activeTab === tab.id
            const isLiveTab = tab.id === 'today' && counts.hasLive
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setTab(tab.id)}
                className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? isLiveTab
                      ? 'bg-red-500 text-white'
                      : 'bg-wc-gold text-wc-dark'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                  isActive
                    ? isLiveTab ? 'bg-white/20 text-white' : 'bg-wc-dark/20 text-wc-dark'
                    : 'bg-white/10 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      </header>

      {/* ── Content ── */}
      <div className="px-4 py-4">

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-wc-gold border-t-transparent" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <p className="rounded-xl bg-red-500/10 p-4 text-sm text-red-400">{error}</p>
        )}

        {/* Match list */}
        {!loading && !error && (
          <div className="space-y-6">

            {/* Search result label */}
            {isSearching && (
              <p className="text-xs text-gray-500">
                {filtered.length === 0
                  ? `No matches for "${searchRaw}"`
                  : `${filtered.length} match${filtered.length !== 1 ? 'es' : ''} for "${searchRaw}"`}
              </p>
            )}

            {/* Empty state */}
            {byDate.size === 0 && (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <span className="text-4xl">⚽</span>
                <p className="text-sm font-medium text-gray-400">
                  {activeTab === 'today'
                    ? 'No matches today'
                    : activeTab === 'myteam' && !favoriteTeam
                    ? 'Set a favourite team on your Profile to see their matches here'
                    : 'No matches found'}
                </p>
              </div>
            )}

            {/* Date groups */}
            {Array.from(byDate.entries()).map(([date, dayMatches]) => (
              <section key={date}>
                <h2 className="mb-3 text-sm font-semibold text-gray-400">
                  {date === today ? `Today — ${formatMatchDate(date)}` : formatMatchDate(date)}
                </h2>
                <div className="space-y-3">
                  {dayMatches.map(match => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      highlight={
                        !!favoriteTeam &&
                        (match.team1 === favoriteTeam || match.team2 === favoriteTeam)
                      }
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
