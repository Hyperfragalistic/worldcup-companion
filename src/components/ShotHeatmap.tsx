import type { Shot, ShotStats } from '../hooks/useMatchShots'

// ── Coordinate mapping ────────────────────────────────────────────────────────
// viewBox: "0 0 100 78"
//   width  100 = full pitch width  (ESPN Y: 0–100)
//   height  78 = attacking half + small goal overhang (ESP X: 50–100, plus goal above)
//
// espnX: 100 = goal line (top of SVG, y≈3), 50 = halfway (bottom, y≈78)
// espnY: 0   = left touchline (x=0),        100 = right touchline (x=100)

const VB_W     = 100   // viewBox width
const VB_H     = 78    // viewBox height (includes 3 above goal line for goal)
const GOAL_Y   = 3     // y where the goal line sits (leaves room for goal outline above)
const HALF_H   = 75    // px from goal line to halfway — maps ESPN X 50→100

const toSvgX = (espnY: number) => espnY                               // 0–100
const toSvgY = (espnX: number) => GOAL_Y + (100 - espnX) / 50 * HALF_H  // 3 – 78

// ── Pitch geometry constants (proportional to a 105m × 68m pitch) ─────────────
// All values in SVG units (pitch width = 100 units = 68m → 1 unit ≈ 0.68m)
const PITCH_LEFT  = 0
const PITCH_RIGHT = 100
const PITCH_TOP   = GOAL_Y      // goal line
const PITCH_BOT   = GOAL_Y + HALF_H  // halfway line

// Penalty area: 40.32m wide centred, 16.5m deep
const PA_LEFT  = (68 - 40.32) / 68 * 100    // ≈ 20.7
const PA_RIGHT = PA_LEFT + 40.32 / 68 * 100  // ≈ 79.3
const PA_DEPTH = 16.5 / 52.5 * HALF_H       // ≈ 23.6 units

// 6-yard box: 18.32m wide centred, 5.5m deep
const SB_LEFT  = (68 - 18.32) / 68 * 100   // ≈ 36.1
const SB_RIGHT = SB_LEFT + 18.32 / 68 * 100 // ≈ 63.9
const SB_DEPTH = 5.5 / 52.5 * HALF_H       // ≈ 7.9 units

// Goal: 7.32m wide centred (drawn above goal line)
const GOAL_LEFT  = (68 - 7.32) / 68 * 100   // ≈ 44.6
const GOAL_RIGHT = GOAL_LEFT + 7.32 / 68 * 100 // ≈ 55.4

// Penalty spot: 11m from goal
const PEN_X = 50
const PEN_Y = GOAL_Y + 11 / 52.5 * HALF_H  // ≈ 18.7

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
            style={{ maxHeight: 220 }}
            aria-label="Shot map"
          >
            {/* ── Pitch surface ── */}
            <rect x={PITCH_LEFT} y={PITCH_TOP} width={PITCH_RIGHT} height={HALF_H}
              fill="#1a3a2a" stroke="#3d7a55" strokeWidth="0.6" />

            {/* ── Halfway line (bottom edge, just for reference) ── */}
            <line x1={0} y1={PITCH_BOT} x2={100} y2={PITCH_BOT}
              stroke="#3d7a55" strokeWidth="0.5" strokeDasharray="2 2" />

            {/* ── Penalty area ── */}
            <rect x={PA_LEFT} y={PITCH_TOP} width={PA_RIGHT - PA_LEFT} height={PA_DEPTH}
              fill="none" stroke="#4a9e6a" strokeWidth="0.6" />

            {/* ── 6-yard box ── */}
            <rect x={SB_LEFT} y={PITCH_TOP} width={SB_RIGHT - SB_LEFT} height={SB_DEPTH}
              fill="none" stroke="#4a9e6a" strokeWidth="0.5" />

            {/* ── Goal (above goal line) ── */}
            <rect x={GOAL_LEFT} y={0} width={GOAL_RIGHT - GOAL_LEFT} height={GOAL_Y}
              fill="#2a4a35" stroke="#6abe87" strokeWidth="0.7" />

            {/* ── Goal line ── */}
            <line x1={0} y1={PITCH_TOP} x2={100} y2={PITCH_TOP}
              stroke="#4a9e6a" strokeWidth="0.8" />

            {/* ── Penalty spot ── */}
            <circle cx={PEN_X} cy={PEN_Y} r="0.8" fill="#4a9e6a" />

            {/* ── Centre arc (bottom of pitch) ── */}
            <path
              d={`M 21.7 ${PITCH_BOT} A 28.3 28.3 0 0 1 78.3 ${PITCH_BOT}`}
              fill="none" stroke="#3d7a55" strokeWidth="0.5"
            />

            {/* ── Shot dots ── */}
            {shots.map((shot, i) => {
              const cx  = toSvgX(shot.espnY)
              const cy  = toSvgY(shot.espnX)
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
