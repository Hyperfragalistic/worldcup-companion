/**
 * GET /api/player-headshot?name=<player name>
 *
 * Proxies TheSportsDB free-tier player search to avoid exposing the third-party
 * URL in the browser, and to insulate the client from future API changes or
 * key requirements.
 *
 * Returns: { thumb: string | null }
 */

const BASE = 'https://www.thesportsdb.com/api/v1/json/3/searchplayers.php'

function fetchWithTimeout(url, options = {}, ms = 5000) {
  const ac = new AbortController()
  const t  = setTimeout(() => ac.abort(), ms)
  return fetch(url, { ...options, signal: ac.signal }).finally(() => clearTimeout(t))
}

export default async function handler(req, res) {
  const { name } = req.query
  if (!name || typeof name !== 'string') {
    return res.status(200).json({ thumb: null })
  }

  try {
    const r = await fetchWithTimeout(
      `${BASE}?p=${encodeURIComponent(name)}`,
      { headers: { 'User-Agent': 'WorldCupCompanion/1.0' } },
    )
    if (!r.ok) return res.status(200).json({ thumb: null })

    const data  = await r.json()
    const thumb = data?.player?.[0]?.strThumb ?? null

    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800')
    return res.status(200).json({ thumb })
  } catch {
    return res.status(200).json({ thumb: null })
  }
}
