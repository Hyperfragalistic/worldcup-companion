/**
 * GET /api/news
 *
 * Fetches and returns the BBC Sport football RSS feed as JSON.
 * Parsed server-side to avoid CORS issues and to convert XML → JSON.
 * Response is cached for 15 minutes (matching the feed's TTL).
 *
 * Returns: { items: [{ title, link, description, pubDate, thumb }] }
 */

const FEED_URL = 'https://feeds.bbci.co.uk/sport/football/rss.xml'
const MAX_ITEMS = 12

// ── Minimal RSS XML parser (no external deps) ─────────────────────────────────
function cdataOrText(xml, tag) {
  const cdata = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`))
  if (cdata) return cdata[1].trim()
  const plain = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`))
  return plain ? plain[1].trim() : null
}

function parseItems(xml) {
  const items = []
  const blocks = xml.matchAll(/<item>([\s\S]*?)<\/item>/g)
  for (const [, block] of blocks) {
    const title = cdataOrText(block, 'title')
    if (!title) continue

    // <link> in RSS 2.0 is plain text between tags (not an attribute)
    const linkMatch = block.match(/<link>([^<]+)<\/link>/)
    const link = linkMatch ? linkMatch[1].trim().replace(/&amp;/g, '&') : null
    if (!link) continue

    const desc    = cdataOrText(block, 'description')
    const pubDate = cdataOrText(block, 'pubDate')
    const thumbM  = block.match(/media:thumbnail[^>]*url="([^"]+)"/)
    const thumb   = thumbM ? thumbM[1] : null

    items.push({ title, link, description: desc, pubDate, thumb })
    if (items.length >= MAX_ITEMS) break
  }
  return items
}

export default async function handler(req, res) {
  try {
    const feedRes = await fetch(FEED_URL, {
      headers: { 'User-Agent': 'WorldCupCompanion/1.0 (RSS reader)' },
    })

    if (!feedRes.ok) {
      return res.status(502).json({ items: [], error: `RSS fetch failed: ${feedRes.status}` })
    }

    const xml   = await feedRes.text()
    const items = parseItems(xml)

    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=1800')
    return res.status(200).json({ items })

  } catch (err) {
    return res.status(502).json({ items: [], error: 'Failed to fetch news feed' })
  }
}
