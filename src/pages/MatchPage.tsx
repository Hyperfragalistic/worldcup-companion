import { useState, useEffect, type FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Send, Lock, Loader2 } from 'lucide-react'
import { useMatch } from '../hooks/useMatch'
import { useChat } from '../hooks/useChat'
import { useProfile } from '../hooks/useProfile'
import { useSupabase } from '../providers/SupabaseProvider'
import { teamFlag, deriveStatus, formatFullKickoff, formatKickoffLocal, isLocked, scorePrediction } from '../lib/utils'
import { useGeoLocation } from '../hooks/useGeoLocation'
import BottomNav from '../components/BottomNav'
import OddsDisplay from '../components/OddsDisplay'
import { useScoreRefresh } from '../hooks/useScoreRefresh'
import { useMatchEvents } from '../hooks/useMatchEvents'
import { useMatchShots }  from '../hooks/useMatchShots'
import LiveTimer     from '../components/LiveTimer'
import PossessionBar from '../components/PossessionBar'
import MatchTimeline from '../components/MatchTimeline'
import ShotHeatmap   from '../components/ShotHeatmap'

// ---------------------------------------------------------------------------
// Score stepper — +/- buttons for mobile-friendly score input
// ---------------------------------------------------------------------------
function ScoreStepper({
  value,
  onChange,
  disabled,
}: {
  value: number
  onChange: (v: number) => void
  disabled: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={disabled || value <= 0}
        onClick={() => onChange(value - 1)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg font-bold text-white transition hover:bg-white/20 disabled:opacity-30"
      >
        −
      </button>
      <span className="w-8 text-center text-2xl font-bold text-white">{value}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(value + 1)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg font-bold text-white transition hover:bg-white/20 disabled:opacity-30"
      >
        +
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function MatchPage() {
  const { id = '' }    = useParams<{ id: string }>()
  const navigate       = useNavigate()
  const { user }       = useSupabase()
  const { profile }    = useProfile()
  const { match, prediction, loading, error, savePrediction } = useMatch(id)
  const { messages, sending, error: chatError, sendMessage, bottomRef } = useChat(id)
  const geo = useGeoLocation()
  const localTz = geo.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone

  const [homeScore,  setHomeScore]  = useState(0)
  const [awayScore,  setAwayScore]  = useState(0)
  const [predSaving, setPredSaving] = useState(false)

  // Sync steppers when an existing prediction loads for the first time.
  // `prediction` omitted: keyed on prediction.id so steppers sync once on load
  // but don't reset on every optimistic update (id is stable after a save).
  useEffect(() => {
    if (prediction) {
      setHomeScore(prediction.home_score)
      setAwayScore(prediction.away_score)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prediction?.id])
  const [predError,  setPredError]  = useState<string | null>(null)
  const [chatInput,  setChatInput]  = useState('')

  // Hooks must be called unconditionally — derive status before early returns,
  // falling back to 'upcoming' while match data is still loading.
  const status = match ? deriveStatus(match) : 'upcoming'
  useScoreRefresh(id, status)
  const { events, possession } = useMatchEvents(id, status)
  const { shots, stats }       = useMatchShots(id, status)

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-wc-dark">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-wc-gold border-t-transparent" />
      </div>
    )
  }

  if (error || !match) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-wc-dark px-6">
        <p className="text-sm text-red-400">{error ?? 'Match not found'}</p>
        <button onClick={() => navigate('/')} className="text-sm text-wc-gold underline">Go back</button>
      </div>
    )
  }

  const locked  = isLocked(match)
  const username = profile?.username ?? 'Anonymous'

  async function handlePrediction(e: FormEvent) {
    e.preventDefault()
    setPredError(null)
    setPredSaving(true)
    const err = await savePrediction(homeScore, awayScore)
    if (err) setPredError(err)
    setPredSaving(false)
  }

  async function handleSendChat(e: FormEvent) {
    e.preventDefault()
    if (!chatInput.trim()) return
    await sendMessage(chatInput, username)
    setChatInput('')
  }

  return (
    <div className="flex h-dvh flex-col bg-wc-dark pt-safe">

      {/* ── Top header ── */}
      <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <button onClick={() => navigate(-1)} className="rounded-full p-1 transition hover:bg-white/10">
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <div className="flex-1">
          <p className="text-xs text-gray-500">
            {match.group_name ? `Group ${match.group_name}` : match.round}
          </p>
          <p className="text-sm font-semibold text-white">
            {match.team1} vs {match.team2}
          </p>
        </div>
        {status === 'live' && (
          <span className="animate-pulse rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
            ● Live
          </span>
        )}
      </header>

      {/* ── Scrollable content: match info + prediction + messages ── */}
      <div className="flex-1 overflow-y-auto">

        {/* Match hero */}
        <div className="px-4 py-6">
          <div className="flex items-center justify-between">
            {/* Team 1 */}
            <Link to={`/team/${match.team1}`} className="flex flex-1 flex-col items-center gap-2 hover:opacity-80 transition">
              <span className="text-5xl">{teamFlag(match.team1)}</span>
              <span className="text-sm font-bold text-white">{match.team1}</span>
            </Link>

            {/* Centre: score or time */}
            <div className="flex flex-col items-center px-4">
              {status !== 'upcoming' ? (
                <div className="flex items-center gap-2">
                  <span className="text-4xl font-black text-white">{match.score1 ?? '-'}</span>
                  <span className="text-2xl text-gray-600">–</span>
                  <span className="text-4xl font-black text-white">{match.score2 ?? '-'}</span>
                </div>
              ) : (
                <span className="text-lg font-semibold text-gray-400">vs</span>
              )}
              <LiveTimer startsAt={match.starts_at} status={status} />
              <p className="mt-1 text-center text-[11px] text-gray-500">
                {status === 'finished' ? 'Full time' : (
                  <>
                    {formatFullKickoff(match.starts_at)}
                    {localTz !== 'UTC' && (
                      <span className="block text-gray-600">
                        {formatKickoffLocal(match.starts_at, localTz)} local
                      </span>
                    )}
                  </>
                )}
              </p>
              {match.venue && (
                <p className="mt-0.5 max-w-[160px] text-center text-[10px] text-gray-600 leading-tight">
                  {match.venue}
                </p>
              )}
            </div>

            {/* Team 2 */}
            <Link to={`/team/${match.team2}`} className="flex flex-1 flex-col items-center gap-2 hover:opacity-80 transition">
              <span className="text-5xl">{teamFlag(match.team2)}</span>
              <span className="text-sm font-bold text-white">{match.team2}</span>
            </Link>
          </div>
        </div>

        {/* Possession bar — only when data available */}
        {possession && (
          <PossessionBar
            home={possession.home}
            away={possession.away}
            team1={match.team1}
            team2={match.team2}
          />
        )}

        {/* Odds display */}
        <OddsDisplay matchId={id} team1={match.team1} team2={match.team2} />

        {/* Match timeline */}
        <MatchTimeline events={events} team1={match.team1} team2={match.team2} />

        {/* Shot heatmap */}
        <ShotHeatmap shots={shots} stats={stats} team1={match.team1} team2={match.team2} />

        {/* Prediction section */}
        <div className="mx-4 mb-4 rounded-xl bg-wc-surface p-4 ring-1 ring-white/10">
          <h2 className="mb-3 text-sm font-semibold text-white">Your Prediction</h2>

          {/* Already predicted — show result */}
          {prediction && (
            <div className="mb-3 flex items-center justify-between rounded-lg bg-white/5 px-4 py-2">
              <span className="text-sm text-gray-400">
                {match.team1} <span className="font-bold text-white">{prediction.home_score}</span>
                {' – '}
                <span className="font-bold text-white">{prediction.away_score}</span> {match.team2}
              </span>
              {status === 'finished' && (() => {
                const r = scorePrediction(prediction.home_score, prediction.away_score, match.score1, match.score2)
                const labels = { exact: '🎯 Exact! +3pts', correct: '✅ Correct +1pt', wrong: '❌ Wrong', pending: '' }
                return <span className="text-xs font-medium text-wc-gold">{labels[r]}</span>
              })()}
            </div>
          )}

          {/* Prediction form */}
          {locked ? (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Lock className="h-3.5 w-3.5" />
              {status === 'live' ? 'Predictions locked — match in progress' : 'Predictions closed'}
            </div>
          ) : (
            <form onSubmit={handlePrediction}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-1 flex-col items-center gap-1">
                  <p className="text-xs text-gray-500">{match.team1}</p>
                  <ScoreStepper value={homeScore} onChange={setHomeScore} disabled={predSaving} />
                </div>
                <span className="text-xl text-gray-600">–</span>
                <div className="flex flex-1 flex-col items-center gap-1">
                  <p className="text-xs text-gray-500">{match.team2}</p>
                  <ScoreStepper value={awayScore} onChange={setAwayScore} disabled={predSaving} />
                </div>
              </div>
              {predError && <p className="mt-2 text-xs text-red-400">{predError}</p>}
              <button
                type="submit"
                disabled={predSaving}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-wc-gold py-2.5 text-sm font-semibold text-wc-dark transition hover:brightness-110 disabled:opacity-60"
              >
                {predSaving
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : prediction ? 'Update prediction' : 'Submit prediction'
                }
              </button>
            </form>
          )}
        </div>

        {/* Chat messages */}
        <div className="px-4">
          <h2 className="mb-3 text-sm font-semibold text-white">Match Chat</h2>
          {messages.length === 0 && (
            <p className="py-6 text-center text-sm text-gray-600">
              No messages yet. Be the first!
            </p>
          )}
          <div className="space-y-3 pb-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-2 ${msg.user_id === user?.id ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    msg.user_id === user?.id
                      ? 'rounded-tr-sm bg-wc-gold text-wc-dark'
                      : 'rounded-tl-sm bg-wc-surface text-white'
                  }`}
                >
                  {msg.user_id !== user?.id && (
                    <p className="mb-0.5 text-[10px] font-semibold text-gray-400">{msg.username ?? 'Anonymous'}</p>
                  )}
                  <p>{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>
      </div>

      {/* ── Chat input — sits above BottomNav ── */}
      <div className="border-t border-white/10 bg-wc-surface px-4 py-2">
        {chatError && (
          <p className="mb-1 text-xs text-red-400">{chatError}</p>
        )}
        <form onSubmit={handleSendChat} className="flex items-center gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            placeholder="Say something…"
            maxLength={500}
            className="flex-1 rounded-full bg-white/5 px-4 py-2 text-sm text-white placeholder-gray-600 outline-none ring-1 ring-white/10 transition focus:ring-wc-gold"
          />
          <button
            type="submit"
            disabled={sending || !chatInput.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-wc-gold text-wc-dark transition hover:brightness-110 disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </div>

      <BottomNav />
    </div>
  )
}
