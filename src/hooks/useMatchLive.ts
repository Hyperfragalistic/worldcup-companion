import { useState, useEffect, useRef } from 'react'
import type { MatchEvent } from './useMatchEvents'
import type { Shot, ShotStats } from './useMatchShots'

export type { MatchEvent, Shot, ShotStats }

export interface MatchLiveData {
  events:     MatchEvent[]
  possession: { home: number; away: number } | null
  elapsed:    string | null
  shots:      Shot[]
  stats:      ShotStats | null
  loading:    boolean
}

const POLL_MS = 60_000

export function useMatchLive(
  matchId: string,
  status: 'upcoming' | 'live' | 'finished',
): MatchLiveData {
  const [events,     setEvents]     = useState<MatchEvent[]>([])
  const [possession, setPossession] = useState<{ home: number; away: number } | null>(null)
  const [elapsed,    setElapsed]    = useState<string | null>(null)
  const [shots,      setShots]      = useState<Shot[]>([])
  const [stats,      setStats]      = useState<ShotStats | null>(null)
  const [loading,    setLoading]    = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (status === 'upcoming' || !matchId) return

    const fetchData = () => {
      if (document.hidden) return
      setLoading(true)
      fetch(`/api/match-live?matchId=${matchId}`)
        .then(r => r.json())
        .then(d => {
          setEvents(d.events         ?? [])
          setPossession(d.possession ?? null)
          setElapsed(d.elapsed       ?? null)
          setShots(d.shots           ?? [])
          setStats(d.stats           ?? null)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }

    fetchData()

    if (status === 'live') {
      intervalRef.current = setInterval(fetchData, POLL_MS)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [matchId, status])

  return { events, possession, elapsed, shots, stats, loading }
}
