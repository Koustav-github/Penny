'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/format'
import { CATEGORIES, CATEGORY_COLORS, type AssetSummary } from '@/lib/assets'
import {
  categoryLabel,
  monthShortLabel,
  type ExpenseSummary,
} from '@/lib/expenses'

export default function AnalyticsClient() {
  const { getToken } = useAuth()
  const [assets, setAssets] = useState<AssetSummary | null>(null)
  const [expenses, setExpenses] = useState<ExpenseSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([api.summary(getToken), api.expenseSummary(getToken)])
      .then(([a, e]) => {
        setAssets(a)
        setExpenses(e)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [getToken])

  const currency = assets?.currency ?? expenses?.currency ?? 'INR'

  if (loading) {
    return <div className="flex-1 px-8 py-8"><p className="text-muted text-sm">Loading…</p></div>
  }
  if (error) {
    return (
      <div className="flex-1 px-8 py-8">
        <div className="rounded-xl bg-negative/10 border border-negative/25 px-3 py-2 text-sm text-negative">{error}</div>
      </div>
    )
  }

  const netWorth = assets?.total ?? 0
  const monthly = expenses?.monthly ?? []
  const monthsWithSpend = monthly.filter((m) => m.total > 0)
  const avgMonthly =
    monthsWithSpend.length > 0
      ? monthsWithSpend.reduce((s, m) => s + m.total, 0) / monthsWithSpend.length
      : 0
  const thisMonthSpend = expenses?.total ?? 0
  const maxSpend = Math.max(1, ...monthly.map((m) => m.total))

  const allocation = assets?.by_category ?? []
  const byCategory = expenses?.by_category ?? []
  const maxCategory = Math.max(1, ...byCategory.map((c) => c.total))

  const hasAssets = (assets?.total ?? 0) > 0
  const hasSpend = monthsWithSpend.length > 0

  const kpis = [
    { label: 'Net Worth', value: formatCurrency(netWorth, currency), sub: `Across ${allocation.length} categories`, accent: true },
    { label: 'This Month', value: formatCurrency(thisMonthSpend, currency), sub: `${expenses?.count ?? 0} transactions` },
    { label: 'Avg Monthly Spend', value: formatCurrency(avgMonthly, currency), sub: 'Last 6 months' },
  ]

  return (
    <div className="flex-1 px-8 py-8 space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`rounded-3xl border p-6 ${kpi.accent ? 'bg-accent/10 border-accent/25' : 'bg-surface border-border'}`}>
            <p className="text-xs font-semibold text-faint uppercase tracking-[0.16em] mb-2">{kpi.label}</p>
            <p className="font-display text-2xl font-bold text-ink tracking-tight tabular-nums">{kpi.value}</p>
            <p className="text-xs text-muted mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly spending chart */}
        <div className="rounded-3xl bg-surface border border-border p-6">
          <p className="text-sm font-semibold text-ink mb-6">Monthly Spending</p>
          {!hasSpend ? (
            <p className="text-sm text-muted">Log expenses to see your monthly trend.</p>
          ) : (
            <div className="flex items-end gap-3 h-32">
              {monthly.map((d, i) => {
                const heightPct = (d.total / maxSpend) * 100
                const isLast = i === monthly.length - 1
                return (
                  <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex items-end" style={{ height: '88px' }}>
                      <div
                        className={`w-full rounded-t-lg origin-bottom ${isLast ? 'bg-accent' : 'bg-border-strong'}`}
                        style={{ height: `${heightPct}%`, animation: 'penny-grow-bar 0.6s cubic-bezier(0.16,1,0.3,1) both', animationDelay: `${i * 60}ms` }}
                      />
                    </div>
                    <span className="text-[11px] text-faint">{monthShortLabel(d.month)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Asset allocation */}
        <div className="rounded-3xl bg-surface border border-border p-6">
          <p className="text-sm font-semibold text-ink mb-6">Asset Allocation</p>
          {!hasAssets ? (
            <p className="text-sm text-muted">Add assets to see your allocation.</p>
          ) : (
            <div className="space-y-4">
              {allocation.map((item) => (
                <div key={item.category} className="flex items-center gap-3">
                  <span className="text-xs text-muted w-16 shrink-0">
                    {CATEGORIES.find((c) => c.value === item.category)?.label ?? item.category}
                  </span>
                  <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${item.pct}%`, backgroundColor: CATEGORY_COLORS[item.category] }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-ink w-24 text-right tabular-nums">
                    {formatCurrency(item.total, currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Spending by category */}
      <div className="rounded-3xl bg-surface border border-border p-6">
        <p className="text-sm font-semibold text-ink mb-6">
          Spending by Category — {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}
        </p>
        {byCategory.length === 0 ? (
          <p className="text-sm text-muted">No spending logged this month yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {byCategory.map((item) => (
              <div key={item.category} className="flex items-center gap-3">
                <span className="text-xs text-muted w-24 shrink-0">{categoryLabel(item.category)}</span>
                <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${(item.total / maxCategory) * 100}%` }} />
                </div>
                <span className="text-xs font-semibold text-ink w-20 text-right tabular-nums">
                  {formatCurrency(item.total, currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
