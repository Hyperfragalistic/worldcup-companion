import { useState, useEffect } from 'react'

export interface NewsItem {
  title:       string
  link:        string
  description: string | null
  pubDate:     string | null
  thumb:       string | null
}

const REFRESH_MS = 15 * 60 * 1000   // 15 min — matches BBC RSS TTL

export function useNews() {
  const [items,   setItems]   = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const fetchNews = () => {
      fetch('/api/news')
        .then(r => r.json())
        .then(d => { if (!cancelled) { setItems(d.items ?? []); setLoading(false) } })
        .catch(() => { if (!cancelled) setLoading(false) })
    }

    fetchNews()
    const id = setInterval(fetchNews, REFRESH_MS)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  return { items, loading }
}
