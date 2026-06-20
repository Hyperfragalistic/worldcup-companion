import { useState, useEffect } from 'react'

interface Props {
  startsAt: string
  status:   'upcoming' | 'live' | 'finished'
  elapsed?: string | null  // ESPN's authoritative clock (e.g. "45:30"); takes priority when present
}

function computeDisplay(startsAt: string): string {
  const mins = Math.floor((Date.now() - new Date(startsAt).getTime()) / 60_000)
  if (mins < 0)   return '0\''
  if (mins <= 45) return `${mins}'`
  if (mins <= 50) return `45+${mins - 45}'`
  if (mins <= 90) return `${mins}'`
  return `90+${mins - 90}'`
}

export default function LiveTimer({ startsAt, status, elapsed }: Props) {
  const [display, setDisplay] = useState(() => elapsed ?? computeDisplay(startsAt))

  useEffect(() => {
    if (status !== 'live') return
    // ESPN's clock (refreshed every 60s by useMatchLive) is preferred — it knows
    // actual stoppage time. Only run the local counter when elapsed is absent.
    if (elapsed) { setDisplay(elapsed); return }
    const id = setInterval(() => setDisplay(computeDisplay(startsAt)), 30_000)
    return () => clearInterval(id)
  }, [startsAt, status, elapsed])

  if (status !== 'live') return null

  return (
    <div className="mt-1 flex items-center justify-center gap-1.5">
      <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
      <span className="text-sm font-bold tabular-nums text-red-400">{display}</span>
    </div>
  )
}
