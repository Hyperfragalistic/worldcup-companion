import { useEffect, useRef } from 'react'

const LIVE_POLL_MS = 2 * 60 * 1000 // 2 minutes

/**
 * Triggers /api/refresh-scores when a MatchPage is open.
 * - upcoming: fires once on mount (catches a match that has just kicked off)
 * - live: fires on mount then every 2 minutes, paused while tab is hidden
 * - finished: no-op
 */
export function useScoreRefresh(matchId: string, status: 'upcoming' | 'live' | 'finished') {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (status === 'finished' || !matchId) return

    const trigger = () => {
      if (document.hidden) return
      fetch(`/api/refresh-scores?matchId=${matchId}`).catch(() => {})
    }

    trigger()

    if (status === 'live') {
      intervalRef.current = setInterval(trigger, LIVE_POLL_MS)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [matchId, status])
}
