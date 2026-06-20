import { useState, useEffect, useRef } from 'react'

export interface Shot {
  minute:   number | null
  type:     'goal' | 'saved' | 'missed' | 'blocked'
  side:     'home' | 'away'
  player:   string | null
  espnX:    number   // 50–100, higher = closer to goal (attacking direction)
  espnY:    number   // 0–100, 50 = centre of pitch width
  accurate: boolean  // true = precise ESPN coords, false = zone approximation
}

export interface ShotStats {
  home: { total: number; onTarget: number; blocked: number }
  away: { total: number; onTarget: number; blocked: number }
}

export interface ShotData {
  shots:   Shot[]
  stats:   ShotStats | null
  loading: boolean
}

const POLL_MS = 60_000

export function useMatchShots(
  matchId: string,
  status: 'upcoming' | 'live' | 'finished',
): ShotData {
  const [shots,   setShots]   = useState<Shot[]>([])
  const [stats,   setStats]   = useState<ShotStats | null>(null)
  const [loading, setLoading] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (status === 'upcoming' || !matchId) return

    const fetchData = () => {
      if (document.hidden) return
      setLoading(true)
      fetch(`/api/match-shots?matchId=${matchId}`)
        .then(r => r.json())
        .then(d => { setShots(d.shots ?? []); setStats(d.stats ?? null); setLoading(false) })
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

  return { shots, stats, loading }
}
