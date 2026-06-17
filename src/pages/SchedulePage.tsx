import { useMemo } from 'react'
import { Trophy } from 'lucide-react'
import Layout from '../components/Layout'
import MatchCard from '../components/MatchCard'
import { useMatches } from '../hooks/useMatches'
import { formatMatchDate } from '../lib/utils'
import type { MatchWithPrediction } from '../lib/database.types'

export default function SchedulePage() {
  const { matches, loading, error } = useMatches()

  // Group matches by match_date, preserving chronological order
  const byDate = useMemo(() => {
    const map = new Map<string, MatchWithPrediction[]>()
    for (const m of matches) {
      const key = m.match_date
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(m)
    }
    return map
  }, [matches])

  return (
    <Layout>
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-white/10 bg-wc-dark/95 px-4 py-3 backdrop-blur">
        <Trophy className="h-5 w-5 text-wc-gold" />
        <h1 className="font-semibold text-white">World Cup 2026</h1>
      </header>

      {/* Content */}
      <div className="px-4 py-4">
        {loading && (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-wc-gold border-t-transparent" />
          </div>
        )}

        {error && (
          <p className="rounded-xl bg-red-500/10 p-4 text-sm text-red-400">{error}</p>
        )}

        {!loading && matches.length === 0 && (
          <p className="py-16 text-center text-sm text-gray-500">No matches found.</p>
        )}

        <div className="space-y-6">
          {Array.from(byDate.entries()).map(([date, dayMatches]) => (
            <section key={date}>
              {/* Date header */}
              <h2 className="mb-3 text-sm font-semibold text-gray-400">
                {formatMatchDate(date)}
              </h2>
              <div className="space-y-3">
                {dayMatches.map(match => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </Layout>
  )
}
