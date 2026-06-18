import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { OddsData } from '../lib/database.types'

const STALE_THRESHOLD_MS = 30 * 60 * 1000 // 30 minutes

export interface UseMatchOddsReturn {
  odds:         OddsData | null
  lastUpdated:  Date | null
  stale:        boolean          // cached data is > 30 min old
  loading:      boolean
  refreshing:   boolean          // live-fetch in progress
  error:        string | null
  refresh:      () => Promise<void>
}

export function useMatchOdds(matchId: string): UseMatchOddsReturn {
  const [odds,        setOdds]        = useState<OddsData | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [refreshing,  setRefreshing]  = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  // ── Initial load from Supabase cache ────────────────────────────────────────
  useEffect(() => {
    if (!matchId) return
    setLoading(true)

    supabase
      .from('matches')
      .select('odds, odds_last_updated')
      .eq('id', matchId)
      .single()
      .then(({ data, error: err }) => {
        if (err) {
          setError(err.message)
        } else {
          setOdds((data?.odds as OddsData) ?? null)
          setLastUpdated(data?.odds_last_updated ? new Date(data.odds_last_updated) : null)
        }
        setLoading(false)
      })
  }, [matchId])

  // ── Realtime: re-read odds whenever the matches row updates ─────────────────
  useEffect(() => {
    if (!matchId) return

    const channel = supabase
      .channel(`match-odds-${matchId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
        payload => {
          const updated = payload.new as { odds?: OddsData; odds_last_updated?: string }
          if (updated.odds !== undefined) setOdds(updated.odds ?? null)
          if (updated.odds_last_updated)  setLastUpdated(new Date(updated.odds_last_updated))
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [matchId])

  // ── Refresh: call /api/odds proxy, fallback to cache on failure ─────────────
  const refresh = useCallback(async () => {
    setRefreshing(true)
    setError(null)

    try {
      const res = await fetch(`/api/odds?matchId=${matchId}`, { method: 'POST' })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        // Graceful fallback: keep showing cached odds, surface a friendly message
        setError(body.message ?? `Live odds unavailable (${res.status}) — showing cached data`)
        return
      }

      const { odds: fresh, odds_last_updated } = await res.json()
      setOdds(fresh)
      setLastUpdated(new Date(odds_last_updated))
    } catch {
      setError('Network error — showing cached data')
    } finally {
      setRefreshing(false)
    }
  }, [matchId])

  const stale =
    lastUpdated === null
      ? false
      : Date.now() - lastUpdated.getTime() > STALE_THRESHOLD_MS

  return { odds, lastUpdated, stale, loading, refreshing, error, refresh }
}
