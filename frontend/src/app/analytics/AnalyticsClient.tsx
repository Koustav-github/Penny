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
    ;(async () => {
      try {
        const [a, e] = await Promise.all([api.summary(getToken), api.expenseSummary(getToken)])
        setAssets(a)
        setExpenses(e)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    })()
  }, [getToken])

  const currency = assets?.currency ?? expenses?.currency ?? 'INR'

  if (loading) {
    return <div className="flex-1 px-8 py-8"><p className="text-white/40 text-sm">Loading…</p></div>
  }
  if (error) {
    return (
      <div className="flex-1 px-8 py-8">
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-300">{error}</div>
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
    { label: 'Net Worth', value: formatCurrency(netWorth, currency), sub: `Across ${allocation.length} categories` },
    { label: 'This Month', value: formatCurrency(thisMonthSpend, currency), sub: `${expenses?.count ?? 0} transactions` },
    { label: 'Avg Monthly Spend', value: formatCurrency(avgMonthly, currency), sub: 'Last 6 months' },
  ]

  return (
    <div className="flex-1 px-8 py-8 space-y-8">
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-xl bg-white/[0.03] border border-white/8 p-5">
            <p className="text-xs font-medium text-white/40 uppercase tracking-widest mb-2">{kpi.label}</p>
            <p className="text-2xl font-bold text-white">{kpi.value}</p>
            <p className="text-xs text-white/30 mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly spending chart */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/8 p-6">
          <p className="text-sm font-semibold text-white/80 mb-6">Monthly Spending</p>
          {!hasSpend ? (
            <p className="text-sm text-white/30">Log expenses to see your monthly trend.</p>
          ) : (
            <div className="flex items-end gap-3 h-32">
              {monthly.map((d, i) => {
                const heightPct = (d.total / maxSpend) * 100
                const isLast = i === monthly.length - 1
                return (
                  <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex items-end" style={{ height: '64px' }}>
                      <div
                        className={`w-full rounded-t-md ${isLast ? 'bg-primary/50' : 'bg-white/10'}`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="text-xs text-white/40">{monthShortLabel(d.month)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Asset allocation */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/8 p-6">
          <p className="text-sm font-semibold text-white/80 mb-6">Asset Allocation</p>
          {!hasAssets ? (
            <p className="text-sm text-white/30">Add assets to see your allocation.</p>
          ) : (
            <div className="space-y-4">
              {allocation.map((item) => (
                <div key={item.category} className="flex items-center gap-3">
                  <span className="text-xs text-white/50 w-16 shrink-0">
                    {CATEGORIES.find((c) => c.value === item.category)?.label ?? item.category}
                  </span>
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${item.pct}%`, backgroundColor: CATEGORY_COLORS[item.category] }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-white/70 w-24 text-right">
                    {formatCurrency(item.total, currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Spending by category */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/8 p-6">
        <p className="text-sm font-semibold text-white/80 mb-6">
          Spending by Category — {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}
        </p>
        {byCategory.length === 0 ? (
          <p className="text-sm text-white/30">No spending logged this month yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {byCategory.map((item) => (
              <div key={item.category} className="flex items-center gap-3">
                <span className="text-xs text-white/50 w-24 shrink-0">{categoryLabel(item.category)}</span>
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-primary/50 rounded-full" style={{ width: `${(item.total / maxCategory) * 100}%` }} />
                </div>
                <span className="text-xs font-semibold text-white/70 w-20 text-right">
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
