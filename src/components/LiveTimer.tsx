import { useState, useEffect } from 'react'

interface Props {
  startsAt: string
  status:   'upcoming' | 'live' | 'finished'
}

function computeDisplay(startsAt: string): string {
  const elapsed = Math.floor((Date.now() - new Date(startsAt).getTime()) / 60_000)
  if (elapsed < 0)   return '0\''
  if (elapsed <= 45) return `${elapsed}'`
  if (elapsed <= 50) return `45+${elapsed - 45}'`
  if (elapsed <= 90) return `${elapsed}'`
  return `90+${elapsed - 90}'`
}

export default function LiveTimer({ startsAt, status }: Props) {
  const [display, setDisplay] = useState(() => computeDisplay(startsAt))

  useEffect(() => {
    if (status !== 'live') return
    const id = setInterval(() => setDisplay(computeDisplay(startsAt)), 30_000)
    return () => clearInterval(id)
  }, [startsAt, status])

  if (status !== 'live') return null

  return (
    <div className="mt-1 flex items-center justify-center gap-1.5">
      <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
      <span className="text-sm font-bold tabular-nums text-red-400">{display}</span>
    </div>
  )
}
