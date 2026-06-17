import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useSupabase } from '../providers/SupabaseProvider'
import type { Match, Prediction } from '../lib/database.types'
import { isLocked } from '../lib/utils'

interface UseMatchReturn {
  match:           Match | null
  prediction:      Prediction | null
  loading:         boolean
  error:           string | null
  savePrediction:  (home: number, away: number) => Promise<string | null>
}

export function useMatch(matchId: string): UseMatchReturn {
  const { user } = useSupabase()
  const [match,      setMatch]      = useState<Match | null>(null)
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)

  useEffect(() => {
    if (!user || !matchId) return

    Promise.all([
      supabase.from('matches').select('*').eq('id', matchId).single(),
      supabase.from('predictions').select('*')
        .eq('match_id', matchId)
        .eq('user_id', user.id)
        .maybeSingle(),
    ]).then(([matchRes, predRes]) => {
      if (matchRes.error) setError(matchRes.error.message)
      else                setMatch(matchRes.data)
      if (!predRes.error) setPrediction(predRes.data)
      setLoading(false)
    })
  }, [matchId, user])

  const savePrediction = useCallback(async (
    homeScore: number,
    awayScore: number,
  ): Promise<string | null> => {
    if (!user || !match) return 'Not ready'
    if (isLocked(match))  return 'Match has already started'

    const previous = prediction

    // Optimistic update — reflect immediately in UI
    setPrediction(prev => ({
      id:         prev?.id ?? '',
      user_id:    user.id,
      match_id:   matchId,
      home_score: homeScore,
      away_score: awayScore,
      created_at: prev?.created_at ?? new Date().toISOString(),
    }))

    const { data, error } = await supabase
      .from('predictions')
      .upsert(
        { user_id: user.id, match_id: matchId, home_score: homeScore, away_score: awayScore },
        { onConflict: 'user_id,match_id' },
      )
      .select()
      .single()

    if (error) {
      setPrediction(previous) // rollback
      return error.message
    }
    setPrediction(data)
    return null
  }, [user, match, matchId, prediction])

  return { match, prediction, loading, error, savePrediction }
}
