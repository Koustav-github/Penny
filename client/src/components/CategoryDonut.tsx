import type { CategorySummary } from '@/lib/assets'
import { CATEGORY_COLORS, CATEGORIES } from '@/lib/assets'

interface Props { data: CategorySummary[]; size?: number; stroke?: number; avatarUrl?: string | null }

export default function CategoryDonut({ data, size = 180, stroke = 13, avatarUrl }: Props) {
  const radius = (size - stroke) / 2
  const avatarSize = Math.max(0, size - stroke * 2 - 16) // fits inside the ring's hole
  const circumference = 2 * Math.PI * radius
  const total = data.reduce((s, d) => s + d.total, 0)

  const segments = total > 0 ? data.filter((d) => d.total > 0) : []
  // Reserve a constant gap between every segment (>= stroke, so the rounded caps
  // can't overlap), then split the remaining arc proportionally. A tiny slice
  // therefore keeps its own slot and never spills into a neighbour.
  const gapPx = stroke + 6
  const available = Math.max(circumference - segments.length * gapPx, 0.001)
  const lengths = segments.map((d) => (d.total / total) * available)
  const offsets = lengths.map((_, i) => lengths.slice(0, i).reduce((s, l) => s + l, 0) + i * gapPx)

  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {segments.map((d, i) => {
            const len = Math.max(lengths[i], 0.5) // tiny slices still render as a rounded dot
            return (
              <circle
                key={d.category}
                cx={size / 2} cy={size / 2} r={radius}
                fill="none"
                stroke={CATEGORY_COLORS[d.category]}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${len} ${circumference - len}`}
                strokeDashoffset={-offsets[i]}
              />
            )
          })}
        </g>
      </svg>
        {avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt="Your profile"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full object-cover ring-2 ring-border-strong"
            style={{ width: avatarSize, height: avatarSize }}
          />
        )}
      </div>
      <div className="flex flex-col gap-2">
        {data.filter((d) => d.total > 0).map((d) => {
          const label = CATEGORIES.find((c) => c.value === d.category)?.label ?? d.category
          return (
            <div key={d.category} className="flex items-center gap-2 text-sm">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_COLORS[d.category] }} />
              <span className="text-muted">{label}</span>
              <span className="text-ink font-medium">{d.pct}%</span>
            </div>
          )
        })}
        {total === 0 && <span className="text-sm text-faint">No assets yet</span>}
      </div>
    </div>
  )
}
