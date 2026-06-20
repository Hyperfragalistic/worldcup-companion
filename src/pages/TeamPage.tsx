import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, X, ExternalLink, Loader2 } from 'lucide-react'
import { ROSTERS, type Player, type Position } from '../data/rosters'
import { teamFlag } from '../lib/utils'
import BottomNav from '../components/BottomNav'

// ── Position metadata ─────────────────────────────────────────────────────────
const POS_ORDER: Position[] = ['GK', 'DEF', 'MID', 'FWD']
const POS_LABEL: Record<Position, string> = { GK: 'Goalkeepers', DEF: 'Defenders', MID: 'Midfielders', FWD: 'Forwards' }
const POS_COLOR: Record<Position, string> = {
  GK:  'bg-amber-500/20  text-amber-400  ring-amber-500/30',
  DEF: 'bg-blue-500/20   text-blue-400   ring-blue-500/30',
  MID: 'bg-green-500/20  text-green-400  ring-green-500/30',
  FWD: 'bg-red-500/20    text-red-400    ring-red-500/30',
}
const POS_NUM_BG: Record<Position, string> = {
  GK:  'bg-amber-500/30 text-amber-300',
  DEF: 'bg-blue-500/30  text-blue-300',
  MID: 'bg-green-500/30 text-green-300',
  FWD: 'bg-red-500/30   text-red-300',
}

// ── TheSportsDB headshot fetch ────────────────────────────────────────────────
async function fetchHeadshot(name: string): Promise<string | null> {
  try {
    const encoded = encodeURIComponent(name)
    const res  = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encoded}`)
    if (!res.ok) return null
    const json = await res.json()
    return (json.player?.[0]?.strThumb as string | undefined) ?? null
  } catch {
    return null
  }
}

// ── Avatar fallback: position-coloured circle with jersey number ──────────────
function AvatarFallback({ player }: { player: Player }) {
  return (
    <div className={`flex h-24 w-24 items-center justify-center rounded-full text-2xl font-black ring-2 ${POS_NUM_BG[player.position]} ring-white/10`}>
      {player.number}
    </div>
  )
}

// ── Player modal (bottom sheet) ───────────────────────────────────────────────
function PlayerModal({ player, teamName, onClose }: { player: Player; teamName: string; onClose: () => void }) {
  const [imgUrl,  setImgUrl]  = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchHeadshot(player.name).then(url => {
      if (!cancelled) { setImgUrl(url); setLoading(false) }
    })
    return () => { cancelled = true }
  }, [player.name])

  const wikiName = player.name.replace(/ /g, '_')
  const wikiUrl  = `https://en.wikipedia.org/wiki/${wikiName}`

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        className="relative w-full rounded-t-2xl bg-wc-surface px-6 pb-10 pt-5 ring-1 ring-white/10"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 hover:bg-white/10 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Headshot / avatar */}
        <div className="flex justify-center mb-4">
          {loading ? (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/5 ring-2 ring-white/10">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          ) : imgUrl ? (
            <img
              src={imgUrl}
              alt={player.name}
              className="h-24 w-24 rounded-full object-cover ring-2 ring-wc-gold/40"
              onError={() => setImgUrl(null)}
            />
          ) : (
            <AvatarFallback player={player} />
          )}
        </div>

        {/* Name + team */}
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-white">{player.name}</h2>
          <p className="text-sm text-gray-400">
            {teamFlag(teamName)} {teamName}
          </p>
        </div>

        {/* Stat grid */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          <StatBox label="Position" value={player.position} />
          <StatBox label="Jersey" value={`#${player.number}`} />
          <StatBox label="Club" value={player.club} />
          {player.caps !== undefined && <StatBox label="Caps" value={String(player.caps)} />}
          {player.goals !== undefined && <StatBox label="Int'l Goals" value={String(player.goals)} />}
        </div>

        {/* Wikipedia CTA */}
        <a
          href={wikiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-wc-gold py-3 text-sm font-semibold text-wc-dark transition hover:brightness-110"
        >
          <ExternalLink className="h-4 w-4" />
          View on Wikipedia
        </a>
      </div>
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/5 px-3 py-2.5 text-center ring-1 ring-white/10">
      <p className="mb-0.5 text-[10px] uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-white leading-snug">{value}</p>
    </div>
  )
}

// ── Player row card ───────────────────────────────────────────────────────────
function PlayerCard({ player, onTap }: { player: Player; onTap: () => void }) {
  return (
    <button
      onClick={onTap}
      className="flex w-full items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2.5 text-left ring-1 ring-white/8 transition active:scale-[0.98] hover:bg-white/[0.07]"
    >
      {/* Number badge */}
      <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${POS_NUM_BG[player.position]}`}>
        {player.number}
      </span>

      {/* Name + club */}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold text-white">{player.name}</p>
        <p className="truncate text-xs text-gray-500">{player.club}</p>
      </div>

      {/* Position badge */}
      <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${POS_COLOR[player.position]}`}>
        {player.position}
      </span>
    </button>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TeamPage() {
  const { teamName = '' } = useParams<{ teamName: string }>()
  const navigate          = useNavigate()
  const [selected, setSelected] = useState<Player | null>(null)

  const roster = ROSTERS[teamName]

  if (!roster) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-wc-dark px-6">
        <p className="text-sm text-gray-400">No roster found for "{teamName}".</p>
        <button onClick={() => navigate(-1)} className="text-sm text-wc-gold underline">Go back</button>
      </div>
    )
  }

  const byPosition = POS_ORDER.reduce<Record<Position, Player[]>>(
    (acc, pos) => { acc[pos] = roster.filter(p => p.position === pos); return acc },
    { GK: [], DEF: [], MID: [], FWD: [] },
  )

  return (
    <div className="flex h-dvh flex-col bg-wc-dark pt-safe">

      {/* Header */}
      <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <button onClick={() => navigate(-1)} className="rounded-full p-1 transition hover:bg-white/10">
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <span className="text-2xl">{teamFlag(teamName)}</span>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-bold text-white">{teamName}</p>
          <p className="text-[11px] text-gray-500">Key players · {roster.length} listed</p>
        </div>
      </header>

      {/* Scrollable roster */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {POS_ORDER.map(pos => {
          const players = byPosition[pos]
          if (players.length === 0) return null
          return (
            <section key={pos}>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                {POS_LABEL[pos]}
              </h2>
              <div className="space-y-2">
                {players.map(p => (
                  <PlayerCard key={p.name} player={p} onTap={() => setSelected(p)} />
                ))}
              </div>
            </section>
          )
        })}

        {/* Footer note */}
        <p className="pb-4 text-center text-[11px] text-gray-600">
          Key players only · Data as of 2025–26 season
        </p>
      </div>

      <BottomNav />

      {/* Bottom-sheet modal */}
      {selected && (
        <PlayerModal
          player={selected}
          teamName={teamName}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
