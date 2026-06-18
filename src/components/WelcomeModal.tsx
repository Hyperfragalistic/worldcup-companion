import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

const AUTO_DISMISS_MS = 4000

interface Props {
  onContinue: () => void
}

// Simple SVG goal net rendered behind the ball
function GoalNet() {
  return (
    <svg width="96" height="72" viewBox="0 0 96 72" fill="none" aria-hidden>
      {/* Posts + crossbar */}
      <rect x="0"  y="0"  width="5"  height="72" rx="2.5" fill="white" fillOpacity="0.9" />
      <rect x="91" y="0"  width="5"  height="72" rx="2.5" fill="white" fillOpacity="0.9" />
      <rect x="0"  y="0"  width="96" height="5"  rx="2.5" fill="white" fillOpacity="0.9" />
      {/* Vertical net lines */}
      {[18, 36, 54, 72].map(x => (
        <line key={x} x1={x} y1="5" x2={x} y2="72"
          stroke="white" strokeOpacity="0.25" strokeWidth="1" />
      ))}
      {/* Horizontal net lines */}
      {[22, 39, 56].map(y => (
        <line key={y} x1="5" y1={y} x2="91" y2={y}
          stroke="white" strokeOpacity="0.25" strokeWidth="1" />
      ))}
    </svg>
  )
}

export default function WelcomeModal({ onContinue }: Props) {
  const [countdown, setCountdown] = useState(Math.round(AUTO_DISMISS_MS / 1000))
  const [netShake,  setNetShake]  = useState(false)

  // Auto-dismiss + countdown tick
  useEffect(() => {
    const dismissTimer = setTimeout(onContinue, AUTO_DISMISS_MS)
    const tickInterval = setInterval(
      () => setCountdown(c => Math.max(0, c - 1)),
      1000,
    )
    return () => { clearTimeout(dismissTimer); clearInterval(tickInterval) }
  }, [onContinue])

  return (
    // Full-screen overlay — sits above all app content
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-wc-dark">

      <div className="flex flex-col items-center gap-7 px-8 text-center">

        {/* ── Animation area: ball shoots into net ── */}
        <div className="relative flex items-center justify-center" style={{ width: 180, height: 96 }}>

          {/* Net — fades in, then shakes when ball arrives */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={
              netShake
                ? { x: [-3, 3, -2, 2, 0], opacity: 1, scale: 1 }
                : { opacity: 1, scale: 1 }
            }
            transition={netShake ? { duration: 0.35 } : { duration: 0.3 }}
            className="absolute right-0"
          >
            <GoalNet />
          </motion.div>

          {/* Soccer ball — arcs from lower-left into the net */}
          <motion.div
            initial={{ x: -70, y: 30, scale: 0.4, rotate: 0, opacity: 0 }}
            animate={{ x: 40, y: -8, scale: 1, rotate: 540, opacity: 1 }}
            transition={{
              duration:  0.85,
              delay:     0.25,
              ease:      [0.22, 1, 0.36, 1],  // custom cubic — fast finish
            }}
            onAnimationComplete={() => setNetShake(true)}
            className="absolute left-0 text-5xl select-none"
          >
            ⚽
          </motion.div>
        </div>

        {/* ── GOAL! burst ── */}
        <motion.p
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.0, type: 'spring', stiffness: 500, damping: 18 }}
          className="text-3xl font-black tracking-widest text-wc-gold"
        >
          GOAL! 🎉
        </motion.p>

        {/* ── Welcome copy ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.4 }}
          className="space-y-2"
        >
          <h1 className="text-2xl font-bold text-white">
            Welcome to World Cup Companion!
          </h1>
          <p className="text-sm text-gray-400">
            Thank you for signing up. Let's get you set up so we can personalise
            your experience.
          </p>
        </motion.div>

        {/* ── Continue button ── */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.3 }}
          onClick={onContinue}
          className="flex items-center gap-2 rounded-xl bg-wc-gold px-8 py-3 text-sm font-semibold text-wc-dark transition hover:brightness-110 active:scale-95"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
          <span className="ml-1 text-xs font-normal text-wc-dark/60">({countdown})</span>
        </motion.button>

      </div>
    </div>
  )
}
