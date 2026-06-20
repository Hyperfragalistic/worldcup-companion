import { useState, useEffect, useRef } from 'react'

export interface MatchEvent {
  minute:  number | null
  type:    'goal' | 'yellow_card' | 'red_card'
  side:    'home' | 'away'
  player:  string | null
  ownGoal: boolean
}

export interface MatchEventData {
  events:     MatchEvent[]
  possession: { home: number; away: number } | null
  elapsed:    string | null
  loading:    boolean
}

const POLL_MS = 60_000

export function useMatchEvents(
  matchId: string,
  status: 'upcoming' | 'live' | 'finished',
): MatchEventData {
  const [events,     setEvents]     = useState<MatchEvent[]>([])
  const [possession, setPossession] = useState<{ home: number; away: number } | null>(null)
  const [elapsed,    setElapsed]    = useState<string | null>(null)
  const [loading,    setLoading]    = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (status === 'upcoming' || !matchId) return

    const fetchData = () => {
      if (document.hidden) return
      setLoading(true)
      fetch(`/api/match-events?matchId=${matchId}`)
        .then(r => r.json())
        .then(d => {
          setEvents(d.events     ?? [])
          setPossession(d.possession ?? null)
          setElapsed(d.elapsed   ?? null)
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

  return { events, possession, elapsed, loading }
}
