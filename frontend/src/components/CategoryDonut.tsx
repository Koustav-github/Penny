import type { CategorySummary } from '@/lib/assets'
import { CATEGORY_COLORS, CATEGORIES } from '@/lib/assets'

interface Props { data: CategorySummary[]; size?: number; stroke?: number }

export default function CategoryDonut({ data, size = 180, stroke = 22 }: Props) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const total = data.reduce((s, d) => s + d.total, 0)

  let offset = 0
  const segments = total > 0 ? data.filter((d) => d.total > 0) : []

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke}
          />
          {segments.map((d) => {
            const len = (d.total / total) * circumference
            const seg = (
              <circle
                key={d.category}
                cx={size / 2} cy={size / 2} r={radius}
                fill="none"
                stroke={CATEGORY_COLORS[d.category]}
                strokeWidth={stroke}
                strokeDasharray={`${len} ${circumference - len}`}
                strokeDashoffset={-offset}
              />
            )
            offset += len
            return seg
          })}
        </g>
      </svg>
      <div className="flex flex-col gap-2">
        {data.filter((d) => d.total > 0).map((d) => {
          const label = CATEGORIES.find((c) => c.value === d.category)?.label ?? d.category
          return (
            <div key={d.category} className="flex items-center gap-2 text-sm">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_COLORS[d.category] }} />
              <span className="text-white/60">{label}</span>
              <span className="text-white/80 font-medium">{d.pct}%</span>
            </div>
          )
        })}
        {total === 0 && <span className="text-sm text-white/40">No assets yet</span>}
      </div>
    </div>
  )
}
