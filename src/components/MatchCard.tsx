import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, MessageCircle, Target, Clock, MapPin } from 'lucide-react'
import type { MatchWithPrediction } from '../lib/database.types'
import {
  teamFlag,
  deriveStatus,
  formatKickoff,
  formatKickoffLocal,
  formatShortDate,
  scorePrediction,
} from '../lib/utils'

// ── Status badge styling ───────────────────────────────────────────────────────
const STATUS_BADGE: Record<string, string> = {
  live:     'bg-red-500 text-white',
  finished: 'bg-white/10 text-gray-400',
  upcoming: 'bg-wc-blue/30 text-blue-300',
}

// ── Prediction result label + colour ──────────────────────────────────────────
const RESULT: Record<string, { label: string; cls: string }> = {
  exact:   { label: '🎯 Exact! +3 pts',  cls: 'text-wc-gold' },
  correct: { label: '✅ Correct +1 pt',  cls: 'text-green-400' },
  wrong:   { label: '❌ Wrong',           cls: 'text-red-400' },
  pending: { label: '⏳ Predicted',       cls: 'text-gray-400' },
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  match:        MatchWithPrediction
  highlight?:   boolean
  defaultOpen?: boolean
  variant?:     'full' | 'compact'
  timezone?:    string  // IANA tz from geo; falls back to Intl if absent
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MatchCard({ match, highlight = false, defaultOpen = false, variant = 'full', timezone }: Props) {
  const navigate      = useNavigate()
  const [open, setOpen] = useState(defaultOpen)
  const status         = deriveStatus(match)
  const pred           = match.my_prediction
  const isLive         = status === 'live'
  const isFinished     = status === 'finished'
  const isUpcoming     = status === 'upcoming'

  const resultKey = pred
    ? scorePrediction(pred.home_score, pred.away_score, match.score1, match.score2)
    : null

  // Whether the "Predict" CTA should be emphasised
  const wantsPrediction = isUpcoming && !pred

  // Use geo-detected timezone; fall back to browser Intl if not yet resolved
  const localTz   = timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
  const localTime = localTz !== 'UTC' ? formatKickoffLocal(match.starts_at, localTz) : null

  function goToMatch()   { navigate(`/match/${match.id}`) }
  function goToChat()    { navigate(`/match/${match.id}`) } // chat is on same page

  // ── Compact variant (grid view) — tap navigates directly ──────────────────
  if (variant === 'compact') {
    return (
      <button
        onClick={goToMatch}
        className={`w-full rounded-xl p-3 text-left ring-1 transition active:scale-[0.97] ${
          highlight   ? 'bg-wc-gold/[0.07] ring-wc-gold/40' : 'bg-wc-surface ring-white/10'
        } ${isLive ? 'ring-red-500/50' : ''}`}
      >
        {/* Round + status */}
        <div className="mb-2 flex items-center justify-between gap-1">
          <span className="truncate text-[10px] text-gray-500">
            {match.group_name ? `Grp ${match.group_name}` : match.round}
          </span>
          <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide flex-shrink-0 ${
            STATUS_BADGE[status]
          } ${isLive ? 'animate-pulse' : ''}`}>
            {isLive ? '● Live' : isFinished ? 'FT' : (localTime ?? formatKickoff(match.starts_at))}
          </span>
        </div>

        {/* Teams */}
        <div className="flex items-center gap-1">
          <div className="flex flex-1 flex-col items-center gap-0.5 min-w-0">
            <span className="text-xl leading-none">{teamFlag(match.team1)}</span>
            <span className="w-full truncate text-center text-[10px] font-semibold text-white leading-tight">
              {match.team1}
            </span>
          </div>

          <div className="flex min-w-[36px] flex-col items-center">
            {!isUpcoming ? (
              <span className={`text-base font-bold leading-none ${isLive ? 'text-red-400' : 'text-white'}`}>
                {match.score1 ?? '-'}–{match.score2 ?? '-'}
              </span>
            ) : (
              <span className="text-xs font-semibold text-gray-600">vs</span>
            )}
          </div>

          <div className="flex flex-1 flex-col items-center gap-0.5 min-w-0">
            <span className="text-xl leading-none">{teamFlag(match.team2)}</span>
            <span className="w-full truncate text-center text-[10px] font-semibold text-white leading-tight">
              {match.team2}
            </span>
          </div>
        </div>

        {/* Prediction dot */}
        {pred && (
          <div className="mt-2 flex justify-center">
            <span className={`h-1.5 w-1.5 rounded-full ${
              resultKey === 'exact'   ? 'bg-wc-gold'   :
              resultKey === 'correct' ? 'bg-green-400' :
              resultKey === 'wrong'   ? 'bg-red-400'   : 'bg-gray-500'
            }`} />
          </div>
        )}
      </button>
    )
  }

  // ── Full variant (list view) ────────────────────────────────────────────────
  return (
    <div
      className={`rounded-xl ring-1 overflow-hidden transition-shadow ${
        highlight   ? 'bg-wc-gold/[0.07] ring-wc-gold/40' : 'bg-wc-surface ring-white/10'
      } ${isLive ? 'ring-red-500/40' : ''}`}
    >
      {/* ── Compact body (always visible) ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full p-4 text-left active:opacity-80"
        aria-expanded={open}
      >
        {/* Row 1: round label | status badge | chevron */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-xs text-gray-500 truncate">
            {match.group_name ? `Group ${match.group_name}` : match.round}
          </span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                STATUS_BADGE[status]
              } ${isLive ? 'animate-pulse' : ''}`}
            >
              {isLive ? '● Live' : isFinished ? 'FT' : formatKickoff(match.starts_at)}
            </span>
            <ChevronDown
              className={`h-4 w-4 flex-shrink-0 text-gray-600 transition-transform duration-200 ${
                open ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>

        {/* Row 2: team1 | score/vs | team2 */}
        <div className="flex items-center gap-2">
          {/* Team 1 */}
          <div className="flex flex-1 flex-col items-center gap-1 min-w-0">
            <span className="text-2xl leading-none">{teamFlag(match.team1)}</span>
            <span className="text-center text-xs font-semibold text-white leading-tight truncate w-full">{match.team1}</span>
          </div>

          {/* Score or VS */}
          <div className="flex min-w-[60px] items-center justify-center gap-1">
            {!isUpcoming ? (
              <>
                <span className={`text-2xl font-bold ${isLive ? 'text-red-400' : 'text-white'}`}>
                  {match.score1 ?? '-'}
                </span>
                <span className="text-sm text-gray-500">–</span>
                <span className={`text-2xl font-bold ${isLive ? 'text-red-400' : 'text-white'}`}>
                  {match.score2 ?? '-'}
                </span>
              </>
            ) : (
              <span className="text-base font-semibold text-gray-500">vs</span>
            )}
          </div>

          {/* Team 2 */}
          <div className="flex flex-1 flex-col items-center gap-1 min-w-0">
            <span className="text-2xl leading-none">{teamFlag(match.team2)}</span>
            <span className="text-center text-xs font-semibold text-white leading-tight truncate w-full">{match.team2}</span>
          </div>
        </div>

        {/* Row 3: inline prediction result (compact, only when not open) */}
        {!open && pred && resultKey && (
          <div className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-white/5 py-1.5">
            <span className={`text-xs font-medium ${RESULT[resultKey].cls}`}>
              {RESULT[resultKey].label}
            </span>
            <span className="text-xs text-gray-500">({pred.home_score}–{pred.away_score})</span>
          </div>
        )}

        {/* Row 3: predict nudge (only when not open) */}
        {!open && wantsPrediction && (
          <p className="mt-3 text-center text-xs text-wc-gold">Tap to predict →</p>
        )}
      </button>

      {/* ── Expanded panel — CSS grid height trick for smooth animation ── */}
      <div
        className={`grid transition-all duration-200 ease-in-out ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-white/5 px-4 pb-4 pt-3 space-y-3">

            {/* Kickoff + venue */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-start gap-2 text-xs text-gray-400">
                <Clock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gray-600" />
                <div className="flex flex-col gap-0.5">
                  <span>
                    {isFinished
                      ? `Played ${formatShortDate(match.starts_at)}`
                      : isLive
                      ? `Live · started ${formatShortDate(match.starts_at)}`
                      : formatShortDate(match.starts_at)}
                  </span>
                  {!isFinished && (
                    <span className="flex flex-wrap gap-x-2 text-gray-500">
                      <span>{formatKickoff(match.starts_at)}</span>
                      {localTime && <span className="text-gray-600">· {localTime} local</span>}
                    </span>
                  )}
                </div>
              </div>
              {match.venue && (
                <div className="flex items-start gap-2 text-xs text-gray-500">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-gray-600 mt-0.5" />
                  <span className="leading-snug">{match.venue}</span>
                </div>
              )}
            </div>

            {/* Prediction result (expanded view) */}
            {pred && resultKey && (
              <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                <span className="text-xs text-gray-400">
                  Your pick: {pred.home_score}–{pred.away_score}
                </span>
                <span className={`text-xs font-medium ${RESULT[resultKey].cls}`}>
                  {RESULT[resultKey].label}
                </span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {/* Predict — prominent when upcoming + no prediction yet */}
              {!isFinished && (
                <button
                  onClick={goToMatch}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition ${
                    wantsPrediction
                      ? 'bg-wc-gold text-wc-dark hover:brightness-110'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <Target className="h-3.5 w-3.5" />
                  {pred ? 'Update prediction' : 'Predict'}
                </button>
              )}

              {/* Chat */}
              <button
                onClick={goToChat}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/5 py-2 text-xs font-semibold text-gray-300 transition hover:bg-white/10"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Chat
              </button>

              {/* View match (text link) */}
              <button
                onClick={goToMatch}
                className="text-xs text-wc-gold underline underline-offset-2 hover:text-yellow-300 px-1 flex-shrink-0"
              >
                Full&nbsp;→
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
