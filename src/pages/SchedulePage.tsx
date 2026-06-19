import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { RotateCcw, Search, Star, Trophy, X } from 'lucide-react'
import Layout from '../components/Layout'
import MatchCard from '../components/MatchCard'
import { useMatches } from '../hooks/useMatches'
import { useProfile } from '../hooks/useProfile'
import { useGeoLocation } from '../hooks/useGeoLocation'
import { deriveStatus, formatMatchDate, teamFlag, WC_TEAM_BY_COUNTRY } from '../lib/utils'
import type { MatchWithPrediction } from '../lib/database.types'

// ── Constants ─────────────────────────────────────────────────────────────────
type TabId = 'today' | 'myteam' | 'upcoming' | 'all'

const GROUP_FILTER_CHIPS = [
  ...['A','B','C','D','E','F','G','H','I','J','K','L'].map(g => ({ label: g,      value: g,              isGroup: true  })),
  { label: 'R32',   value: 'Round of 32',   isGroup: false },
  { label: 'R16',   value: 'Round of 16',   isGroup: false },
  { label: 'QF',    value: 'Quarter-final', isGroup: false },
  { label: 'SF',    value: 'Semi-final',    isGroup: false },
  { label: '3rd',   value: 'Third Place',   isGroup: false },
  { label: 'Final', value: 'Final',         isGroup: false },
]

const GROUP_VALUES = new Set(['A','B','C','D','E','F','G','H','I','J','K','L'])

// ── Helpers ───────────────────────────────────────────────────────────────────
function todayDateString() {
  return new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time
}

function groupByDate(ms: MatchWithPrediction[]) {
  const map = new Map<string, MatchWithPrediction[]>()
  for (const m of ms) {
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

  // URL state
  const activeTab   = (params.get('tab') as TabId | null) ?? 'today'
  const searchRaw   = params.get('q')      ?? ''
  const groupFilter = params.get('group')  ?? ''

  // Local search value — instant feedback, debounced write to URL
  const [searchInput, setSearchInput] = useState(searchRaw)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const favoriteTeam = profile?.favorite_team ?? null
  const autoSaved    = useRef(false)
  const updateRef    = useRef(updateProfile)
  useEffect(() => { updateRef.current = updateProfile }, [updateProfile])

  // Auto-save geo → favorite team silently on first load
  useEffect(() => {
    if (autoSaved.current || profile === null || favoriteTeam) return
    if (geo.loading || !geo.countryCode) return
    const detected = WC_TEAM_BY_COUNTRY[geo.countryCode]
    if (!detected) return
    autoSaved.current = true
    updateRef.current({ favorite_team: detected })
  }, [profile, favoriteTeam, geo.loading, geo.countryCode])

  // Sync input when URL changes externally (browser back/forward)
  useEffect(() => { setSearchInput(params.get('q') ?? '') }, [params])

  // ── URL mutators ────────────────────────────────────────────────────────────
  const setTab = useCallback((id: TabId) => {
    setParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('tab', id)
      next.delete('group') // clear group filter when switching tabs
      return next
    }, { replace: true })
  }, [setParams])

  const handleSearch = useCallback((value: string) => {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setParams(prev => {
        const next = new URLSearchParams(prev)
        if (value.trim()) next.set('q', value)
        else next.delete('q')
        return next
      }, { replace: true })
    }, 300)
  }, [setParams])

  const handleClearSearch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSearchInput('')
    setParams(prev => { const n = new URLSearchParams(prev); n.delete('q'); return n }, { replace: true })
  }, [setParams])

  const setGroup = useCallback((value: string) => {
    setParams(prev => {
      const next = new URLSearchParams(prev)
      if (value) next.set('group', value)
      else next.delete('group')
      return next
    }, { replace: true })
  }, [setParams])

  const handleReset = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSearchInput('')
    setParams(prev => {
      const next = new URLSearchParams()
      next.set('tab', prev.get('tab') ?? 'today')
      return next
    }, { replace: true })
  }, [setParams])

  // ── Derived state ───────────────────────────────────────────────────────────
  const today = todayDateString()
  const hasActiveFilters = !!searchRaw.trim() || !!groupFilter

  // Tab counts — not affected by secondary filters (shows universe per tab)
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

  const TABS = useMemo(() => [
    { id: 'today'    as TabId, label: counts.hasLive ? '● Live' : 'Today',    count: counts.today    },
    { id: 'myteam'   as TabId, label: favoriteTeam ? `${teamFlag(favoriteTeam)} My Team` : 'My Team', count: counts.myteam   },
    { id: 'upcoming' as TabId, label: 'Upcoming',  count: counts.upcoming },
    { id: 'all'      as TabId, label: 'All',       count: counts.all      },
  ], [counts, favoriteTeam])

  // Main filtered list: search → tab → group
  const filtered = useMemo(() => {
    let list = matches

    // 1. Search
    const q = searchRaw.trim().toLowerCase()
    if (q) {
      list = list.filter(m =>
        m.team1.toLowerCase().includes(q) ||
        m.team2.toLowerCase().includes(q) ||
        (m.venue?.toLowerCase().includes(q) ?? false) ||
        m.round.toLowerCase().includes(q)
      )
    }

    // 2. Tab
    switch (activeTab) {
      case 'today':
        list = list.filter(m => deriveStatus(m) === 'live' || m.match_date === today)
        break
      case 'myteam':
        list = favoriteTeam
          ? list.filter(m => m.team1 === favoriteTeam || m.team2 === favoriteTeam)
          : list
        break
      case 'upcoming':
        list = list.filter(m => deriveStatus(m) === 'upcoming')
        break
    }

    // 3. Group / round filter
    if (groupFilter) {
      list = GROUP_VALUES.has(groupFilter)
        ? list.filter(m => m.group_name === groupFilter)
        : list.filter(m => m.round === groupFilter)
    }

    return list
  }, [matches, searchRaw, activeTab, groupFilter, favoriteTeam, today])

  const byDate = useMemo(() => groupByDate(filtered), [filtered])

  // "Relevant for You" — shown on All tab with no secondary filters when user has a team
  const showRelevant = activeTab === 'all' && !searchRaw.trim() && !groupFilter && !!favoriteTeam

  const relevantMatches = useMemo((): MatchWithPrediction[] => {
    if (!showRelevant || !favoriteTeam) return []
    // Prioritise live, then soonest upcoming; exclude finished
    return matches
      .filter(m => (m.team1 === favoriteTeam || m.team2 === favoriteTeam) && deriveStatus(m) !== 'finished')
      .sort((a, b) => {
        const sa = deriveStatus(a), sb = deriveStatus(b)
        if (sa === 'live' && sb !== 'live') return -1
        if (sb === 'live' && sa !== 'live') return  1
        return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
      })
      .slice(0, 3)
  }, [matches, favoriteTeam, showRelevant])

  // Show group filter row on All / Upcoming tabs
  const showGroupFilter = activeTab === 'all' || activeTab === 'upcoming'

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Layout>
      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-wc-dark/95 backdrop-blur">

        {/* Title row */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
          <Trophy className="h-5 w-5 flex-shrink-0 text-wc-gold" />
          <h1 className="font-semibold text-white">World Cup 2026</h1>
          <div className="ml-auto flex items-center gap-2">
            {/* Reset button — appears when any secondary filter is active */}
            {hasActiveFilters && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-gray-300 transition hover:bg-white/20"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            )}
            {favoriteTeam && (
              <span className="flex items-center gap-1.5">
                <span className="text-xl leading-none">{teamFlag(favoriteTeam)}</span>
                <span className="text-xs font-medium text-wc-gold">{favoriteTeam}</span>
              </span>
            )}
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mx-4 mb-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
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
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-none" role="tablist">
          {TABS.map(tab => {
            const isActive   = activeTab === tab.id
            const isLiveTab  = tab.id === 'today' && counts.hasLive
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setTab(tab.id)}
                className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? isLiveTab ? 'bg-red-500 text-white' : 'bg-wc-gold text-wc-dark'
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

        {/* Group / round filter chips (All + Upcoming tabs only) */}
        {showGroupFilter && (
          <div className="flex gap-1.5 overflow-x-auto px-4 pb-3 scrollbar-none">
            {/* "All" clear chip */}
            <button
              onClick={() => setGroup('')}
              className={`flex-shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                !groupFilter
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300'
              }`}
            >
              All
            </button>
            {/* Divider between groups and knockouts */}
            {GROUP_FILTER_CHIPS.map((chip, idx) => {
              const isKnockoutFirst = !chip.isGroup && (idx === 0 || GROUP_FILTER_CHIPS[idx - 1].isGroup)
              return (
                <div key={chip.value} className="flex flex-shrink-0 items-center gap-1.5">
                  {isKnockoutFirst && <div className="h-4 w-px bg-white/10" />}
                  <button
                    onClick={() => setGroup(groupFilter === chip.value ? '' : chip.value)}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                      groupFilter === chip.value
                        ? 'bg-wc-blue text-white'
                        : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300'
                    }`}
                  >
                    {chip.isGroup ? `Grp ${chip.label}` : chip.label}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </header>

      {/* ── Content ── */}
      <div className="px-4 py-4">

        {loading && (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-wc-gold border-t-transparent" />
          </div>
        )}

        {error && !loading && (
          <p className="rounded-xl bg-red-500/10 p-4 text-sm text-red-400">{error}</p>
        )}

        {!loading && !error && (
          <div className="space-y-6">

            {/* ── "Relevant for You" section (All tab, no secondary filters, has team) ── */}
            {showRelevant && relevantMatches.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-wc-gold">
                  <Star className="h-3.5 w-3.5 fill-wc-gold" />
                  Relevant for You
                  <span className="ml-auto text-[11px] font-normal text-gray-500">
                    {teamFlag(favoriteTeam!)} {favoriteTeam}
                  </span>
                </h2>
                <div className="space-y-3">
                  {relevantMatches.map(match => (
                    <MatchCard key={match.id} match={match} highlight />
                  ))}
                </div>
                {/* Divider before full list */}
                <div className="mt-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">
                    All {counts.all} matches
                  </span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
              </section>
            )}

            {/* Active filter summary */}
            {(searchRaw.trim() || groupFilter) && (
              <p className="text-xs text-gray-500">
                {filtered.length === 0
                  ? 'No matches found'
                  : `${filtered.length} match${filtered.length !== 1 ? 'es' : ''}${
                      groupFilter ? ` · ${groupFilter}` : ''
                    }${searchRaw.trim() ? ` · "${searchRaw}"` : ''}`}
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
                    : hasActiveFilters
                    ? 'No matches match the current filters'
                    : 'No matches found'}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={handleReset}
                    className="mt-1 text-xs text-wc-gold underline underline-offset-2"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {/* Date-grouped match list */}
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
