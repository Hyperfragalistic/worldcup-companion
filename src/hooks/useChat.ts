import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useSupabase } from '../providers/SupabaseProvider'
import type { Message } from '../lib/database.types'

interface UseChatReturn {
  messages:    Message[]
  sending:     boolean
  error:       string | null
  sendMessage: (content: string, username: string) => Promise<string | null>
  bottomRef:   React.RefObject<HTMLDivElement | null>
}

export function useChat(matchId: string): UseChatReturn {
  const { user }  = useSupabase()
  const [messages, setMessages] = useState<Message[]>([])
  const [sending,  setSending]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const bottomRef  = useRef<HTMLDivElement>(null)

  // Initial load
  useEffect(() => {
    if (!matchId) return

    supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })
      .limit(200)
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else       setMessages(data ?? [])
      })
  }, [matchId])

  // Realtime subscription — append new messages as they arrive
  useEffect(() => {
    if (!matchId) return

    const channel = supabase
      .channel(`chat-${matchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
        (payload) => {
          setMessages(prev => {
            // Deduplicate: realtime fires even for messages we just inserted
            const incoming = payload.new as Message
            if (prev.some(m => m.id === incoming.id)) return prev
            return [...prev, incoming]
          })
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [matchId])

  // Auto-scroll to bottom whenever messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async (
    content: string,
    username: string,
  ): Promise<string | null> => {
    if (!user) return 'Not authenticated'
    if (!content.trim()) return null

    setSending(true)
    const { error } = await supabase.from('messages').insert({
      match_id: matchId,
      user_id:  user.id,
      username: username || 'Anonymous',
      content:  content.trim(),
    })
    setSending(false)

    if (error) return error.message
    return null
  }, [user, matchId])

  return { messages, sending, error, sendMessage, bottomRef }
}
