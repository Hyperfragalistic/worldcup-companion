import { RefreshCw, Clock, TrendingUp } from 'lucide-react'
import { useMatchOdds } from '../hooks/useMatchOdds'
import type { OddsData } from '../lib/database.types'

interface Props {
  matchId: string
  team1:   string
  team2:   string
}

// Returns the label ('home' | 'draw' | 'away') of the lowest (= favourite) odds
function favourite(odds: OddsData): 'home' | 'draw' | 'away' {
  const min = Math.min(odds.home_win, odds.draw, odds.away_win)
  if (odds.home_win === min) return 'home'
  if (odds.draw    === min) return 'draw'
  return 'away'
}

function formatTime(date: Date): string {
  const diff = Math.round((Date.now() - date.getTime()) / 60_000)
  if (diff < 1)  return 'just now'
  if (diff < 60) return `${diff}m ago`
  return `${Math.floor(diff / 60)}h ago`
}

interface OddsButtonProps {
  label:    string
  value:    number
  isFav:    boolean
  pct:      string   // implied probability
}
function OddsButton({ label, value, isFav, pct }: OddsButtonProps) {
  return (
    <div
      className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-3 transition ${
        isFav
          ? 'bg-wc-gold/[0.12] ring-1 ring-wc-gold/50'
          : 'bg-white/5 ring-1 ring-white/10'
      }`}
    >
      <span className={`text-[10px] font-semibold uppercase tracking-wider ${isFav ? 'text-wc-gold' : 'text-gray-500'}`}>
        {label}
      </span>
      <span className={`text-lg font-black tabular-nums ${isFav ? 'text-wc-gold' : 'text-white'}`}>
        {value.toFixed(2)}
      </span>
      <span className="text-[10px] text-gray-600">{pct}</span>
    </div>
  )
}

export default function OddsDisplay({ matchId, team1, team2 }: Props) {
  const { odds, lastUpdated, stale, loading, refreshing, error, refresh } = useMatchOdds(matchId)

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="mx-4 mb-4 rounded-xl bg-wc-surface p-4 ring-1 ring-white/10">
        <div className="mb-3 flex items-center justify-between">
          <div className="h-3.5 w-24 animate-pulse rounded bg-white/10" />
          <div className="h-6 w-16 animate-pulse rounded bg-white/10" />
        </div>
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-16 flex-1 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      </div>
    )
  }

  // ── No odds in cache ─────────────────────────────────────────────────────────
  if (!odds) {
    return (
      <div className="mx-4 mb-4 rounded-xl bg-wc-surface p-4 ring-1 ring-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-gray-600" />
            <span className="text-xs font-semibold text-white">Match Odds</span>
          </div>
          <button
            onClick={refresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-gray-400 transition hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Fetching…' : 'Load odds'}
          </button>
        </div>
        <p className="mt-3 text-xs text-gray-600">No odds data available yet.</p>
        {error && <p className="mt-1 text-xs text-amber-400">{error}</p>}
      </div>
    )
  }

  // ── Implied probabilities (sum > 100% = bookmaker margin) ────────────────────
  const impliedHome = ((1 / odds.home_win) * 100).toFixed(0) + '%'
  const impliedDraw = ((1 / odds.draw)     * 100).toFixed(0) + '%'
  const impliedAway = ((1 / odds.away_win) * 100).toFixed(0) + '%'
  const fav         = favourite(odds)

  return (
    <div className="mx-4 mb-4 rounded-xl bg-wc-surface p-4 ring-1 ring-white/10">

      {/* Header row */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-wc-gold" />
          <span className="text-xs font-semibold text-white">Match Odds</span>
          <span className="text-[10px] text-gray-600">decimal</span>
        </div>

        <button
          onClick={refresh}
          disabled={refreshing}
          title="Refresh live odds"
          className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-gray-400 transition hover:bg-white/10 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Fetching…' : 'Refresh'}
        </button>
      </div>

      {/* Stale data notice */}
      {stale && (
        <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-2">
          <Clock className="h-3 w-3 text-amber-400" />
          <span className="text-[11px] text-amber-400">
            Cached data · updated {lastUpdated ? formatTime(lastUpdated) : 'unknown'}. Tap Refresh for live odds.
          </span>
        </div>
      )}

      {/* Odds buttons */}
      <div className="flex gap-2">
        <OddsButton
          label={team1}
          value={odds.home_win}
          isFav={fav === 'home'}
          pct={impliedHome}
        />
        <OddsButton
          label="Draw"
          value={odds.draw}
          isFav={fav === 'draw'}
          pct={impliedDraw}
        />
        <OddsButton
          label={team2}
          value={odds.away_win}
          isFav={fav === 'away'}
          pct={impliedAway}
        />
      </div>

      {/* Over 2.5 goals row */}
      {odds.over_2_5 && (
        <div className="mt-2 flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
          <span className="text-[11px] text-gray-500">Over 2.5 goals</span>
          <span className="text-sm font-bold tabular-nums text-white">{odds.over_2_5.toFixed(2)}</span>
        </div>
      )}

      {/* Cache timestamp (when not stale) */}
      {lastUpdated && !stale && (
        <p className="mt-2 text-right text-[10px] text-gray-700">
          Updated {formatTime(lastUpdated)}
        </p>
      )}

      {/* Error notice — shown after a failed live refresh */}
      {error && (
        <p className="mt-2 rounded-lg bg-red-500/10 px-3 py-1.5 text-[11px] text-amber-400">
          {error}
        </p>
      )}

      <p className="mt-2 text-right text-[9px] text-gray-700">
        For entertainment only · not financial advice
      </p>
    </div>
  )
}
