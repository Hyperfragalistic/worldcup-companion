import type { NewsItem } from '../hooks/useNews'

interface Props {
  items: NewsItem[]
}

// Scroll speed: pixels per second. Longer text = same speed = more read time.
const PX_PER_SECOND = 55

export default function NewsTicker({ items }: Props) {
  if (items.length === 0) return null

  // Estimate content width (average ~9px per character at text-[11px])
  const totalChars    = items.reduce((n, i) => n + i.title.length + 6, 0)  // +6 for separator
  const contentWidthPx = totalChars * 9
  const durationS     = Math.round(contentWidthPx / PX_PER_SECOND)

  // Duplicate items so the strip loops seamlessly
  const doubled = [...items, ...items]

  return (
    <div className="relative flex items-stretch overflow-hidden border-b border-white/5 bg-black/30">
      {/* Injected keyframes — avoids touching tailwind.config */}
      <style>{`
        @keyframes wc-ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .wc-ticker-track {
          animation: wc-ticker ${durationS}s linear infinite;
          will-change: transform;
        }
        .wc-ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* "NEWS" label badge */}
      <div className="z-10 flex flex-shrink-0 items-center bg-wc-gold px-2.5">
        <span className="text-[9px] font-black uppercase tracking-widest text-wc-dark">
          News
        </span>
      </div>

      {/* Left fade overlay */}
      <div className="pointer-events-none absolute inset-y-0 left-[44px] z-10 w-4 bg-gradient-to-r from-black/30 to-transparent" />

      {/* Scrolling track */}
      <div className="flex-1 overflow-hidden py-1.5">
        <div className="wc-ticker-track flex items-center whitespace-nowrap">
          {doubled.map((item, i) => (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-shrink-0 items-center gap-2 px-4 text-[11px] text-gray-300 hover:text-white transition-colors"
            >
              <span className="text-wc-gold select-none">•</span>
              <span>{item.title}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Right fade overlay */}
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-black/40 to-transparent" />
    </div>
  )
}
