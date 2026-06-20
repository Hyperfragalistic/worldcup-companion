import type { Shot, ShotStats } from '../hooks/useMatchShots'

// ── Full pitch coordinate mapping ─────────────────────────────────────────────
// viewBox: "0 0 100 160" (width = 68m pitch, height ≈ 105m + goal over hangs)
//
// Fixed orientation (vertical):
//   y=0 (top)    → one goal
//   y≈160 (bottom) → opposite goal
//
// Home team (gold) attacks the BOTTOM goal.
// Away team (blue)  attacks the TOP goal.
//
// Data notes:
//   espnX: 50-100, 100 = the goal being attacked by *that shot*
//   espnY: 0-100 (left to right touchlines)
//
// We remap espnX per side so shots end up on the correct half of the full pitch.

const VB_W = 100
const GOAL_OVERHANG = 4
const FIELD_H = 152          // 105m scaled
const VB_H = GOAL_OVERHANG * 2 + FIELD_H

const TOP_GOAL_LINE_Y = GOAL_OVERHANG
const BOTTOM_GOAL_LINE_Y = GOAL_OVERHANG + FIELD_H
const HALFWAY_Y = GOAL_OVERHANG + FIELD_H / 2

const toSvgX = (espnY: number) => espnY

// Map espnX so home shots attack bottom, away shots attack top
const toSvgY = (espnX: number, side: 'home' | 'away') => {
  const norm = side === 'home' ? espnX : 100 - espnX
  return GOAL_OVERHANG + (norm / 100) * FIELD_H
}

// ── Pitch geometry (proportional to 105m × 68m pitch) ─────────────────────────
const PITCH_LEFT = 0
const PITCH_RIGHT = 100
const PITCH_TOP = TOP_GOAL_LINE_Y

const FIELD_SCALE = FIELD_H / 105

// Penalty area
const PA_LEFT = (68 - 40.32) / 68 * 100
const PA_RIGHT = PA_LEFT + 40.32 / 68 * 100
const PA_DEPTH = 16.5 * FIELD_SCALE

// 6-yard box
const SB_LEFT = (68 - 18.32) / 68 * 100
const SB_RIGHT = SB_LEFT + 18.32 / 68 * 100
const SB_DEPTH = 5.5 * FIELD_SCALE

// Goal width
const GOAL_LEFT = (68 - 7.32) / 68 * 100
const GOAL_RIGHT = GOAL_LEFT + 7.32 / 68 * 100

// Penalty spots
const PEN_X = 50
const TOP_PEN_Y = TOP_GOAL_LINE_Y + 11 * FIELD_SCALE
const BOTTOM_PEN_Y = BOTTOM_GOAL_LINE_Y - 11 * FIELD_SCALE

// Centre circle
const CENTER_R = 9.15 * FIELD_SCALE

// ── Shot visual config ────────────────────────────────────────────────────────
const DOT_CONFIG = {
  goal:    { r: 4.5, fill: true,  strokeW: 0 },
  saved:   { r: 3.5, fill: false, strokeW: 1.5 },
  missed:  { r: 2.8, fill: false, strokeW: 1.2 },
  blocked: { r: 2.8, fill: false, strokeW: 1.2 },
}

const HOME_COLOR = '#d4a017'   // wc-gold
const AWAY_COLOR = '#3b82f6'   // blue-500
const GOAL_STROKE = '#fff'

// ── Stat bar ─────────────────────────────────────────────────────────────────
function StatRow({ label, home, away }: { label: string; home: number; away: number }) {
  const max = Math.max(home, away, 1)
  return (
    <div className="flex items-center gap-2">
      <span className="w-5 text-right text-sm font-bold text-wc-gold">{home}</span>
      <div className="flex flex-1 items-center gap-1">
        <div className="flex flex-1 justify-end">
          <div
            className="h-2 rounded-full bg-wc-gold transition-all duration-700"
            style={{ width: `${home / max * 100}%` }}
          />
        </div>
        <span className="w-20 text-center text-[10px] text-gray-500">{label}</span>
        <div className="flex flex-1 justify-start">
          <div
            className="h-2 rounded-full bg-blue-500 transition-all duration-700"
            style={{ width: `${away / max * 100}%` }}
          />
        </div>
      </div>
      <span className="w-5 text-left text-sm font-bold text-blue-400">{away}</span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
interface Props {
  shots: Shot[]
  stats: ShotStats | null
  team1: string
  team2: string
}

export default function ShotHeatmap({ shots, stats, team1, team2 }: Props) {
  if (shots.length === 0 && !stats) return null

  return (
    <div className="mx-4 mb-4 overflow-hidden rounded-xl bg-wc-surface ring-1 ring-white/10">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
        <span className="text-[11px] font-semibold text-wc-gold">{team1}</span>
        <span className="text-[10px] uppercase tracking-wider text-gray-600">Shot Map</span>
        <span className="text-[11px] font-semibold text-blue-400">{team2}</span>
      </div>

      {/* Pitch SVG */}
      {shots.length > 0 && (
        <div className="px-2 pt-2">
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            className="w-full"
            style={{ maxHeight: 320 }}
            aria-label="Shot map"
          >
            {/* ── Pitch surface (full pitch) ── */}
            <rect x={PITCH_LEFT} y={PITCH_TOP} width={PITCH_RIGHT} height={FIELD_H}
              fill="#1a3a2a" stroke="#3d7a55" strokeWidth="0.6" />

            {/* ── Halfway line ── */}
            <line x1={0} y1={HALFWAY_Y} x2={100} y2={HALFWAY_Y}
              stroke="#3d7a55" strokeWidth="0.5" strokeDasharray="2 2" />

            {/* ── Top penalty area (goal at top) ── */}
            <rect x={PA_LEFT} y={TOP_GOAL_LINE_Y} width={PA_RIGHT - PA_LEFT} height={PA_DEPTH}
              fill="none" stroke="#4a9e6a" strokeWidth="0.6" />

            {/* ── Top 6-yard box ── */}
            <rect x={SB_LEFT} y={TOP_GOAL_LINE_Y} width={SB_RIGHT - SB_LEFT} height={SB_DEPTH}
              fill="none" stroke="#4a9e6a" strokeWidth="0.5" />

            {/* ── Top goal (above top goal line) ── */}
            <rect x={GOAL_LEFT} y={0} width={GOAL_RIGHT - GOAL_LEFT} height={GOAL_OVERHANG}
              fill="#2a4a35" stroke="#6abe87" strokeWidth="0.7" />

            {/* ── Top goal line ── */}
            <line x1={0} y1={TOP_GOAL_LINE_Y} x2={100} y2={TOP_GOAL_LINE_Y}
              stroke="#4a9e6a" strokeWidth="0.8" />

            {/* ── Top penalty spot ── */}
            <circle cx={PEN_X} cy={TOP_PEN_Y} r="0.8" fill="#4a9e6a" />

            {/* ── Bottom penalty area (goal at bottom) ── */}
            <rect x={PA_LEFT} y={BOTTOM_GOAL_LINE_Y - PA_DEPTH} width={PA_RIGHT - PA_LEFT} height={PA_DEPTH}
              fill="none" stroke="#4a9e6a" strokeWidth="0.6" />

            {/* ── Bottom 6-yard box ── */}
            <rect x={SB_LEFT} y={BOTTOM_GOAL_LINE_Y - SB_DEPTH} width={SB_RIGHT - SB_LEFT} height={SB_DEPTH}
              fill="none" stroke="#4a9e6a" strokeWidth="0.5" />

            {/* ── Bottom goal (beyond bottom goal line) ── */}
            <rect x={GOAL_LEFT} y={BOTTOM_GOAL_LINE_Y} width={GOAL_RIGHT - GOAL_LEFT} height={GOAL_OVERHANG}
              fill="#2a4a35" stroke="#6abe87" strokeWidth="0.7" />

            {/* ── Bottom goal line ── */}
            <line x1={0} y1={BOTTOM_GOAL_LINE_Y} x2={100} y2={BOTTOM_GOAL_LINE_Y}
              stroke="#4a9e6a" strokeWidth="0.8" />

            {/* ── Bottom penalty spot ── */}
            <circle cx={PEN_X} cy={BOTTOM_PEN_Y} r="0.8" fill="#4a9e6a" />

            {/* ── Centre circle (full) ── */}
            <circle cx="50" cy={HALFWAY_Y} r={CENTER_R} fill="none" stroke="#3d7a55" strokeWidth="0.5" />

            {/* ── Shot dots ── */}
            {shots.map((shot, i) => {
              const cx = toSvgX(shot.espnY)
              const cy = toSvgY(shot.espnX, shot.side)
              const cfg = DOT_CONFIG[shot.type]
              const color = shot.side === 'home' ? HOME_COLOR : AWAY_COLOR
              return (
                <g key={i}>
                  {cfg.fill ? (
                    <circle
                      cx={cx} cy={cy} r={cfg.r}
                      fill={color}
                      stroke={GOAL_STROKE}
                      strokeWidth="0.6"
                      opacity="0.9"
                    />
                  ) : (
                    <circle
                      cx={cx} cy={cy} r={cfg.r}
                      fill="none"
                      stroke={color}
                      strokeWidth={cfg.strokeW}
                      opacity="0.7"
                    />
                  )}
                </g>
              )
            })}
          </svg>
        </div>
      )}

      {/* ── Legend ── */}
      {shots.length > 0 && (
        <div className="flex items-center justify-center gap-4 px-4 py-1.5">
          <LegendItem color={HOME_COLOR} fill label="Goal" />
          <LegendItem color="#aaa" fill={false} label="Saved" />
          <LegendItem color="#888" fill={false} label="Missed/Blocked" dashed />
        </div>
      )}

      {/* ── Shot stats ── */}
      {stats && (
        <div className="space-y-1.5 border-t border-white/5 px-4 py-3">
          <StatRow label="Total shots"  home={stats.home.total}    away={stats.away.total} />
          <StatRow label="On target"    home={stats.home.onTarget} away={stats.away.onTarget} />
          <StatRow label="Blocked"      home={stats.home.blocked}  away={stats.away.blocked} />
        </div>
      )}
    </div>
  )
}

function LegendItem({ color, fill, label, dashed }: { color: string; fill: boolean; label: string; dashed?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      <svg width="12" height="12" viewBox="0 0 12 12">
        <circle
          cx="6" cy="6" r="4"
          fill={fill ? color : 'none'}
          stroke={color}
          strokeWidth={fill ? '0' : dashed ? '1' : '1.5'}
          strokeDasharray={dashed ? '2 1' : undefined}
        />
      </svg>
      <span className="text-[9px] text-gray-600">{label}</span>
    </div>
  )
}
