import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useSupabase } from '../providers/SupabaseProvider'
import type { Profile } from '../lib/database.types'

interface UseProfileReturn {
  profile:       Profile | null
  loading:       boolean
  error:         string | null
  updateProfile: (updates: Partial<Pick<Profile, 'username' | 'full_name' | 'favorite_team' | 'country' | 'onboarding_complete'>>) => Promise<string | null>
}

export function useProfile(): UseProfileReturn {
  const { user } = useSupabase()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    if (!user) { setLoading(false); return }

    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else       setProfile(data)
        setLoading(false)
      })
  }, [user])

  const updateProfile = useCallback(async (
    updates: Partial<Pick<Profile, 'username' | 'full_name' | 'favorite_team' | 'country' | 'onboarding_complete'>>,
  ): Promise<string | null> => {
    if (!user) return 'Not authenticated'

    const previous = profile
    // Optimistic update
    setProfile(prev => prev ? { ...prev, ...updates } : prev)

    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      setProfile(previous) // rollback
      return error.message
    }
    setProfile(data)
    return null
  }, [user, profile])

  return { profile, loading, error, updateProfile }
}
