import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LayoutGrid, LayoutList, RotateCcw, Search, Star, Trophy, X } from 'lucide-react'
import Layout from '../components/Layout'
import MatchCard from '../components/MatchCard'
import { useMatches } from '../hooks/useMatches'
import { useProfile } from '../hooks/useProfile'
import { useGeoLocation } from '../hooks/useGeoLocation'
import { deriveStatus, formatMatchDate, teamFlag, WC_TEAM_BY_COUNTRY } from '../lib/utils'
import type { MatchWithPrediction } from '../lib/database.types'
import NewsTicker from '../components/NewsTicker'
import { useNews }  from '../hooks/useNews'

// ── Constants ─────────────────────────────────────────────────────────────────
type TabId  = 'today' | 'myteam' | 'upcoming' | 'all'
type ViewId = 'list' | 'grid'

const GROUP_FILTER_CHIPS = [
  ...['A','B','C','D','E','F','G','H','I','J','K','L'].map(g => ({ label: `Grp ${g}`, value: g, isGroup: true  })),
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
  return new Date().toLocaleDateString('en-CA')
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
  const { items: newsItems }        = useNews()
  const { profile, updateProfile }  = useProfile()
  const geo                         = useGeoLocation()
  const [params, setParams]         = useSearchParams()

  // URL-persisted state
  const activeTab   = (params.get('tab')   as TabId  | null) ?? 'today'
  const activeView  = (params.get('view')  as ViewId | null) ?? 'list'
  const searchRaw   = params.get('q')      ?? ''
  const groupFilter = params.get('group')  ?? ''

  const [searchInput, setSearchInput] = useState(searchRaw)
  const debounceRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dateChipRefs  = useRef<Map<string, HTMLButtonElement>>(new Map())
  const sectionRefs   = useRef<Map<string, HTMLElement>>(new Map())

  const favoriteTeam = profile?.favorite_team ?? null
  const autoSaved    = useRef(false)
  const updateRef    = useRef(updateProfile)
  useEffect(() => { updateRef.current = updateProfile }, [updateProfile])

  useEffect(() => {
    if (autoSaved.current || profile === null || favoriteTeam) return
    if (geo.loading || !geo.countryCode) return
    const detected = WC_TEAM_BY_COUNTRY[geo.countryCode]
    if (!detected) return
    autoSaved.current = true
    updateRef.current({ favorite_team: detected })
  }, [profile, favoriteTeam, geo.loading, geo.countryCode])

  useEffect(() => { setSearchInput(params.get('q') ?? '') }, [params])

  // ── URL mutators ─────────────────────────────────────────────────────────────
  const setTab = useCallback((id: TabId) => {
    setParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('tab', id)
      next.delete('group')
      return next
    }, { replace: true })
  }, [setParams])

  const setView = useCallback((v: ViewId) => {
    setParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('view', v)
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
      if (prev.get('view')) next.set('view', prev.get('view')!)
      return next
    }, { replace: true })
  }, [setParams])

  // ── Derived ───────────────────────────────────────────────────────────────────
  const today = todayDateString()
  const hasActiveFilters = !!searchRaw.trim() || !!groupFilter

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

  const filtered = useMemo(() => {
    let list = matches

    const q = searchRaw.trim().toLowerCase()
    if (q) {
      list = list.filter(m =>
        m.team1.toLowerCase().includes(q) ||
        m.team2.toLowerCase().includes(q) ||
        (m.venue?.toLowerCase().includes(q) ?? false) ||
        m.round.toLowerCase().includes(q)
      )
    }

    switch (activeTab) {
      case 'today':    list = list.filter(m => deriveStatus(m) === 'live' || m.match_date === today); break
      case 'myteam':   list = favoriteTeam ? list.filter(m => m.team1 === favoriteTeam || m.team2 === favoriteTeam) : list; break
      case 'upcoming': list = list.filter(m => deriveStatus(m) === 'upcoming'); break
    }

    if (groupFilter) {
      list = GROUP_VALUES.has(groupFilter)
        ? list.filter(m => m.group_name === groupFilter)
        : list.filter(m => m.round === groupFilter)
    }

    return list
  }, [matches, searchRaw, activeTab, groupFilter, favoriteTeam, today])

  const byDate = useMemo(() => groupByDate(filtered), [filtered])

  // Dates available in the current filtered view (for the date strip)
  const filteredDates = useMemo(() => Array.from(byDate.keys()), [byDate])

  const showRelevant  = activeTab === 'all' && !searchRaw.trim() && !groupFilter && !!favoriteTeam
  const showGroupFilter = activeTab === 'all' || activeTab === 'upcoming'

  const relevantMatches = useMemo((): MatchWithPrediction[] => {
    if (!showRelevant || !favoriteTeam) return []
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

  // Auto-scroll date strip: find today chip (or nearest future date) and center it
  useEffect(() => {
    if (filteredDates.length === 0) return
    const target = filteredDates.includes(today)
      ? today
      : filteredDates.find(d => d > today)
    if (!target) return
    dateChipRefs.current.get(target)?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [filteredDates, today])

  // ── Scroll-to-date helper ──────────────────────────────────────────────────
  const scrollToDate = useCallback((date: string) => {
    const el = sectionRefs.current.get(date)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Layout>
      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-wc-dark/95 backdrop-blur">

        {/* Title row */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
          <Trophy className="h-5 w-5 flex-shrink-0 text-wc-gold" />
          <h1 className="font-semibold text-white">World Cup 2026</h1>
          <div className="ml-auto flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-gray-300 transition hover:bg-white/20"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            )}
            {/* View toggle */}
            <div className="flex rounded-lg bg-white/5 p-0.5">
              <button
                onClick={() => setView('list')}
                aria-label="List view"
                className={`rounded-md p-1.5 transition-colors ${activeView === 'list' ? 'bg-white/15 text-white' : 'text-gray-600 hover:text-gray-400'}`}
              >
                <LayoutList className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setView('grid')}
                aria-label="Grid view"
                className={`rounded-md p-1.5 transition-colors ${activeView === 'grid' ? 'bg-white/15 text-white' : 'text-gray-600 hover:text-gray-400'}`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </div>
            {favoriteTeam && (
              <span className="flex items-center gap-1">
                <span className="text-lg leading-none">{teamFlag(favoriteTeam)}</span>
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
            <button onClick={handleClearSearch} aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-none" role="tablist">
          {TABS.map(tab => {
            const isActive  = activeTab === tab.id
            const isLiveTab = tab.id === 'today' && counts.hasLive
            return (
              <button key={tab.id} role="tab" aria-selected={isActive} onClick={() => setTab(tab.id)}
                className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? isLiveTab ? 'bg-red-500 text-white' : 'bg-wc-gold text-wc-dark'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                }`}>
                <span>{tab.label}</span>
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                  isActive
                    ? isLiveTab ? 'bg-white/20 text-white' : 'bg-wc-dark/20 text-wc-dark'
                    : 'bg-white/10 text-gray-500'
                }`}>{tab.count}</span>
              </button>
            )
          })}
        </div>

        {/* Group / round filter chips */}
        {showGroupFilter && (
          <div className="flex gap-1.5 overflow-x-auto px-4 pb-2 scrollbar-none">
            <button onClick={() => setGroup('')}
              className={`flex-shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                !groupFilter ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300'
              }`}>
              All
            </button>
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
                    }`}>
                    {chip.label}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Date strip — one scrollable row per month */}
        {!loading && filteredDates.length > 1 && (
          <div className="border-t border-white/5 pt-2 pb-2 space-y-1">
            {Array.from(
              filteredDates.reduce((acc, date) => {
                const month = date.slice(0, 7) // 'YYYY-MM'
                if (!acc.has(month)) acc.set(month, [])
                acc.get(month)!.push(date)
                return acc
              }, new Map<string, string[]>())
            ).map(([month, dates]) => {
              const monthLabel = new Date(month + '-01T12:00:00').toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
              return (
                <div key={month} className="flex items-center">
                  <span className="w-9 flex-shrink-0 text-center text-[10px] font-bold uppercase tracking-wider text-gray-600 select-none">
                    {monthLabel}
                  </span>
                  <div className="flex gap-1.5 overflow-x-auto pr-4 scrollbar-none">
                    {dates.map(date => {
                      const isToday = date === today
                      const hasLive = byDate.get(date)?.some(m => deriveStatus(m) === 'live') ?? false
                      const day = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { day: 'numeric', timeZone: 'UTC' })
                      return (
                        <button
                          key={date}
                          ref={el => { if (el) dateChipRefs.current.set(date, el); else dateChipRefs.current.delete(date) }}
                          onClick={() => scrollToDate(date)}
                          className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                            isToday
                              ? 'bg-wc-gold/20 text-wc-gold ring-1 ring-wc-gold/40'
                              : hasLive
                              ? 'bg-red-500/10 text-red-400 ring-1 ring-red-500/30'
                              : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300'
                          }`}>
                          {day}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </header>

      {/* ── News ticker ── */}
      <NewsTicker items={newsItems} />

      {/* ── Content ── */}
      <div className="px-4 py-4">

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-[110px] animate-pulse rounded-xl bg-wc-surface" />
            ))}
          </div>
        )}

        {error && !loading && (
          <p className="rounded-xl bg-red-500/10 p-4 text-sm text-red-400">{error}</p>
        )}

        {!loading && !error && (
          <div className="space-y-6">

            {/* "Relevant for You" section */}
            {showRelevant && relevantMatches.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-wc-gold">
                  <Star className="h-3.5 w-3.5 fill-wc-gold" />
                  Relevant for You
                  <span className="ml-auto text-[11px] font-normal text-gray-500">
                    {teamFlag(favoriteTeam!)} {favoriteTeam}
                  </span>
                </h2>
                <div className={activeView === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
                  {relevantMatches.map(match => (
                    <MatchCard key={match.id} match={match} highlight variant={activeView === 'grid' ? 'compact' : 'full'} timezone={geo.timezone ?? undefined} />
                  ))}
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">
                    All {counts.all} matches
                  </span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
              </section>
            )}

            {/* Filter summary */}
            {(searchRaw.trim() || groupFilter) && (
              <p className="text-xs text-gray-500">
                {filtered.length === 0
                  ? 'No matches found'
                  : `${filtered.length} match${filtered.length !== 1 ? 'es' : ''}${groupFilter ? ` · ${groupFilter}` : ''}${searchRaw.trim() ? ` · "${searchRaw}"` : ''}`}
              </p>
            )}

            {/* Empty state */}
            {byDate.size === 0 && (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <span className="text-4xl">⚽</span>
                <p className="text-sm font-medium text-gray-400">
                  {activeTab === 'today'   ? 'No matches today' :
                   activeTab === 'myteam' && !favoriteTeam ? 'Set a favourite team on your Profile to see their matches here' :
                   hasActiveFilters ? 'No matches match the current filters' : 'No matches found'}
                </p>
                {hasActiveFilters && (
                  <button onClick={handleReset} className="mt-1 text-xs text-wc-gold underline underline-offset-2">
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {/* Date-grouped match list / grid */}
            {Array.from(byDate.entries()).map(([date, dayMatches]) => {
              const hasLiveToday = dayMatches.some(m => deriveStatus(m) === 'live')
              return (
                <section
                  key={date}
                  ref={el => { if (el) sectionRefs.current.set(date, el); else sectionRefs.current.delete(date) }}
                  className="scroll-mt-64"
                >
                  {/* Date header */}
                  <div className={`mb-3 flex items-center gap-2 ${hasLiveToday ? 'text-red-400' : 'text-gray-400'}`}>
                    {hasLiveToday && <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />}
                    <h2 className="text-sm font-semibold">
                      {formatMatchDate(date)}{date === today ? ' · Today' : ''}
                    </h2>
                    <span className="ml-auto text-[11px] text-gray-600">
                      {dayMatches.length} match{dayMatches.length !== 1 ? 'es' : ''}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className={activeView === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
                    {dayMatches.map(match => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        variant={activeView === 'grid' ? 'compact' : 'full'}
                        highlight={!!favoriteTeam && (match.team1 === favoriteTeam || match.team2 === favoriteTeam)}
                        timezone={geo.timezone ?? undefined}
                      />
                    ))}
                  </div>
                </section>
              )
            })}

          </div>
        )}
      </div>
    </Layout>
  )
}
