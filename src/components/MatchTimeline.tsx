import type { MatchEvent } from '../hooks/useMatchEvents'

const TYPE_ICON: Record<string, string> = {
  goal:        '⚽',
  yellow_card: '🟨',
  red_card:    '🟥',
}

interface Props {
  events: MatchEvent[]
  team1:  string
  team2:  string
}

export default function MatchTimeline({ events, team1, team2 }: Props) {
  if (events.length === 0) return null

  return (
    <div className="mx-4 mb-4 rounded-xl bg-wc-surface ring-1 ring-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
        <span className="max-w-[40%] truncate text-[11px] font-semibold text-gray-400">{team1}</span>
        <span className="text-[10px] uppercase tracking-wider text-gray-600">Events</span>
        <span className="max-w-[40%] truncate text-right text-[11px] font-semibold text-gray-400">{team2}</span>
      </div>

      {/* Event rows */}
      <div className="divide-y divide-white/5">
        {events.map((ev, i) => (
          <div key={i} className="flex items-center px-3 py-2">

            {/* Home side */}
            <div className="flex flex-1 items-center justify-end gap-1.5 pr-2 min-w-0">
              {ev.side === 'home' && (
                <>
                  <span className="truncate text-right text-[11px] text-white leading-tight min-w-0">
                    {ev.ownGoal && ev.player ? `${ev.player} (OG)` : (ev.player ?? '—')}
                  </span>
                  <span className="flex-shrink-0 text-sm">{TYPE_ICON[ev.type] ?? '📌'}</span>
                </>
              )}
            </div>

            {/* Minute badge */}
            <div className="flex w-10 flex-shrink-0 items-center justify-center">
              <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[10px] font-bold text-gray-500 ring-1 ring-white/10">
                {ev.minute != null ? `${ev.minute}'` : '—'}
              </span>
            </div>

            {/* Away side */}
            <div className="flex flex-1 items-center justify-start gap-1.5 pl-2 min-w-0">
              {ev.side === 'away' && (
                <>
                  <span className="flex-shrink-0 text-sm">{TYPE_ICON[ev.type] ?? '📌'}</span>
                  <span className="truncate text-[11px] text-white leading-tight min-w-0">
                    {ev.ownGoal && ev.player ? `${ev.player} (OG)` : (ev.player ?? '—')}
                  </span>
                </>
              )}
            </div>

          </div>
        ))}
      </div>
    </div>
  )
}
