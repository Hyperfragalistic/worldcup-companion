import { useEffect, useRef } from 'react'

// 5 minutes — matches the cron cadence. useMatchLive already polls ESPN every
// 60s for events/possession/shots, so score writes back to Supabase don't need
// to be more frequent than the background cron.
const LIVE_POLL_MS = 5 * 60 * 1000

/**
 * Writes live ESPN scores back to Supabase so Realtime pushes updates to
 * other clients. Fires once on mount for upcoming (catches recent kick-offs)
 * then every 5 minutes while live. No-op for finished matches.
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
