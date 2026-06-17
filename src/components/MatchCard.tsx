import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { MatchWithPrediction } from '../lib/database.types'
import { teamFlag, deriveStatus, formatKickoff, scorePrediction } from '../lib/utils'

const STATUS_BADGE: Record<string, string> = {
  live:     'bg-red-500 text-white animate-pulse',
  finished: 'bg-white/10 text-gray-400',
  upcoming: 'bg-wc-blue/30 text-blue-300',
}

const RESULT_BADGE: Record<string, { label: string; cls: string }> = {
  exact:   { label: 'Exact! +3pts',   cls: 'text-wc-gold' },
  correct: { label: 'Correct +1pt',   cls: 'text-green-400' },
  wrong:   { label: 'Wrong',          cls: 'text-red-400' },
  pending: { label: 'Predicted',      cls: 'text-gray-400' },
}

interface Props {
  match: MatchWithPrediction
}

export default function MatchCard({ match }: Props) {
  const navigate = useNavigate()
  const status   = deriveStatus(match)
  const pred     = match.my_prediction

  const resultKey = pred
    ? scorePrediction(pred.home_score, pred.away_score, match.score1, match.score2)
    : null

  return (
    <button
      onClick={() => navigate(`/match/${match.id}`)}
      className="w-full rounded-xl bg-wc-surface p-4 text-left ring-1 ring-white/10 transition active:scale-[0.98] hover:ring-white/20"
    >
      {/* Row 1: round + status badge */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {match.group_name ? `Group ${match.group_name}` : match.round}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_BADGE[status]}`}>
          {status === 'live' ? '● Live' : status === 'finished' ? 'FT' : formatKickoff(match.starts_at)}
        </span>
      </div>

      {/* Row 2: teams + score/vs */}
      <div className="flex items-center justify-between gap-2">
        {/* Team 1 */}
        <div className="flex flex-1 flex-col items-center gap-1">
          <span className="text-2xl">{teamFlag(match.team1)}</span>
          <span className="text-center text-xs font-semibold text-white leading-tight">{match.team1}</span>
        </div>

        {/* Score or VS */}
        <div className="flex min-w-[64px] items-center justify-center gap-1">
          {status === 'finished' || status === 'live' ? (
            <>
              <span className="text-2xl font-bold text-white">{match.score1 ?? '-'}</span>
              <span className="text-sm text-gray-500">–</span>
              <span className="text-2xl font-bold text-white">{match.score2 ?? '-'}</span>
            </>
          ) : (
            <span className="text-lg font-semibold text-gray-500">vs</span>
          )}
        </div>

        {/* Team 2 */}
        <div className="flex flex-1 flex-col items-center gap-1">
          <span className="text-2xl">{teamFlag(match.team2)}</span>
          <span className="text-center text-xs font-semibold text-white leading-tight">{match.team2}</span>
        </div>

        <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-600" />
      </div>

      {/* Row 3: venue */}
      {match.venue && (
        <p className="mt-2 text-center text-[11px] text-gray-600 truncate">{match.venue}</p>
      )}

      {/* Row 4: prediction badge */}
      {pred && resultKey && (
        <div className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-white/5 py-1.5">
          <span className={`text-xs font-medium ${RESULT_BADGE[resultKey].cls}`}>
            {RESULT_BADGE[resultKey].label}
          </span>
          <span className="text-xs text-gray-500">
            {pred.home_score}–{pred.away_score}
          </span>
        </div>
      )}

      {!pred && status === 'upcoming' && (
        <p className="mt-3 text-center text-xs text-wc-gold">Tap to predict →</p>
      )}
    </button>
  )
}
