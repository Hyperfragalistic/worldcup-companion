import { motion } from 'framer-motion'

interface Props {
  home:  number
  away:  number
  team1: string
  team2: string
}

export default function PossessionBar({ home, away, team1, team2 }: Props) {
  return (
    <div className="px-4 pb-2 pt-1">
      <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-wider text-gray-500">
        <span className="font-semibold text-wc-gold">{home}%</span>
        <span>Possession</span>
        <span className="font-semibold text-blue-400">{away}%</span>
      </div>

      <div className="flex h-2 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full bg-wc-gold"
          initial={{ width: '50%' }}
          animate={{ width: `${home}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        <motion.div
          className="h-full bg-blue-500"
          initial={{ width: '50%' }}
          animate={{ width: `${away}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </div>

      <div className="mt-1 flex justify-between text-[10px] text-gray-600">
        <span className="truncate max-w-[40%]">{team1}</span>
        <span className="truncate max-w-[40%] text-right">{team2}</span>
      </div>
    </div>
  )
}
