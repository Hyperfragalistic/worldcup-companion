import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useSupabase } from '../providers/SupabaseProvider'
import type { Match, Prediction, MatchWithPrediction } from '../lib/database.types'

interface UseMatchesReturn {
  matches: MatchWithPrediction[]
  loading: boolean
  error:   string | null
  refetch: () => void
}

function merge(ms: Match[], ps: Prediction[]): MatchWithPrediction[] {
  return ms.map(m => ({
    ...m,
    my_prediction: ps.find(p => p.match_id === m.id) ?? null,
  }))
}

export function useMatches(): UseMatchesReturn {
  const { user } = useSupabase()
  const [rawMatches,   setRawMatches]   = useState<Match[]>([])
  const [predictions,  setPredictions]  = useState<Prediction[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [matchRes, predRes] = await Promise.all([
      supabase.from('matches').select('*').order('starts_at', { ascending: true }),
      supabase.from('predictions').select('*').eq('user_id', user.id),
    ])
    if (matchRes.error) { setError(matchRes.error.message); setLoading(false); return }
    setRawMatches((matchRes.data ?? []) as Match[])
    setPredictions((predRes.data ?? []) as Prediction[])
    setError(null)
    setLoading(false)
  }, [user])

  // Initial + manual refetch
  useEffect(() => { fetchAll() }, [fetchAll])

  // Realtime: patch individual match rows (scores, status) as they update
  useEffect(() => {
    if (!user) return
    const ch = supabase
      .channel('matches-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matches' },
        payload => {
          setRawMatches(prev =>
            prev.map(m => m.id === (payload.new as Match).id ? { ...m, ...(payload.new as Match) } : m)
          )
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [user])

  return {
    matches: merge(rawMatches, predictions),
    loading,
    error,
    refetch: fetchAll,
  }
}
