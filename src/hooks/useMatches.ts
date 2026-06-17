import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useSupabase } from '../providers/SupabaseProvider'
import type { Match, Prediction, MatchWithPrediction } from '../lib/database.types'

interface UseMatchesReturn {
  matches: MatchWithPrediction[]
  loading: boolean
  error:   string | null
  refetch: () => void
}

export function useMatches(): UseMatchesReturn {
  const { user } = useSupabase()
  const [matches, setMatches] = useState<MatchWithPrediction[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [tick,    setTick]    = useState(0)

  useEffect(() => {
    if (!user) return

    setLoading(true)

    Promise.all([
      supabase.from('matches').select('*').order('starts_at', { ascending: true }),
      supabase.from('predictions').select('*').eq('user_id', user.id),
    ]).then(([matchesRes, predsRes]) => {
      if (matchesRes.error) { setError(matchesRes.error.message); setLoading(false); return }

      const predictions: Prediction[] = predsRes.data ?? []

      const merged: MatchWithPrediction[] = (matchesRes.data as Match[]).map(m => ({
        ...m,
        my_prediction: predictions.find(p => p.match_id === m.id) ?? null,
      }))

      setMatches(merged)
      setLoading(false)
    })
  }, [user, tick])

  return { matches, loading, error, refetch: () => setTick(t => t + 1) }
}
