import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/AppSidebar'

// Placeholder monthly net worth history
const netWorthHistory = [
  { month: 'Oct', value: 18200 },
  { month: 'Nov', value: 19400 },
  { month: 'Dec', value: 20100 },
  { month: 'Jan', value: 21300 },
  { month: 'Feb', value: 22800 },
  { month: 'Mar', value: 23500 },
  { month: 'Apr', value: 24850 },
]

// Monthly spending
const spendingHistory = [
  { month: 'Oct', value: 18400 },
  { month: 'Nov', value: 22100 },
  { month: 'Dec', value: 31500 },
  { month: 'Jan', value: 19800 },
  { month: 'Feb', value: 17600 },
  { month: 'Mar', value: 20400 },
  { month: 'Apr', value: 9412 },
]

const assetAllocation = [
  { label: 'Bank',   value: 19200, color: 'bg-blue-400',     pct: 49 },
  { label: 'Stocks', value: 8200,  color: 'bg-emerald-400',  pct: 33 },
  { label: 'Crypto', value: 3440,  color: 'bg-orange-400',   pct: 14 },
  { label: 'Cash',   value: 2150,  color: 'bg-purple-400',   pct: 9  },
]

const spendingByCategory = [
  { label: 'Utilities',     value: 1820, pct: 93 },
  { label: 'Shopping',      value: 2199, pct: 100 },
  { label: 'Health',        value: 1500, pct: 77 },
  { label: 'Food',          value: 615,  pct: 31 },
  { label: 'Subscriptions', value: 768,  pct: 39 },
  { label: 'Groceries',     value: 1670, pct: 85 },
]

export default async function AnalyticsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  const maxNetWorth = Math.max(...netWorthHistory.map((d) => d.value))
  const maxSpend = Math.max(...spendingHistory.map((d) => d.value))
  const netWorthChange = (
    ((netWorthHistory.at(-1)!.value - netWorthHistory[0].value) /
      netWorthHistory[0].value) *
    100
  ).toFixed(1)

  return (
    <div className="min-h-screen bg-black flex">
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary/10 blur-[180px] rounded-full pointer-events-none -z-0" />

      <AppSidebar active="analytics" />

      <main className="flex-1 flex flex-col min-h-screen relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-5 border-b border-white/5">
          <div>
            <h1 className="text-xl font-semibold text-white">Analytics</h1>
            <p className="text-sm text-white/40 mt-0.5">Last 7 months overview</p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/60 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Oct 2025 – Apr 2026
          </div>
        </header>

        <div className="flex-1 px-8 py-8 space-y-8">
          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Net Worth', value: '$24,850', sub: `+${netWorthChange}% since Oct` },
              { label: 'Avg Monthly Spend', value: '₹19,887', sub: 'Last 6 months' },
              { label: 'Savings Rate', value: '34%', sub: 'Of gross income' },
              { label: 'Best Month', value: 'Feb', sub: '₹17,600 spent' },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-xl bg-white/[0.03] border border-white/8 p-5">
                <p className="text-xs font-medium text-white/40 uppercase tracking-widest mb-2">{kpi.label}</p>
                <p className="text-2xl font-bold text-white">{kpi.value}</p>
                <p className="text-xs text-white/30 mt-1">{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* Net worth chart */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/8 p-6">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm font-semibold text-white/80">Net Worth Growth</p>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                ▲ {netWorthChange}%
              </span>
            </div>
            {/* Bar chart */}
            <div className="flex items-end gap-3 h-40">
              {netWorthHistory.map((d, i) => {
                const heightPct = (d.value / maxNetWorth) * 100
                const isLast = i === netWorthHistory.length - 1
                return (
                  <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
                    <span className={`text-[11px] font-semibold ${isLast ? 'text-primary' : 'text-white/30'}`}>
                      ${(d.value / 1000).toFixed(1)}k
                    </span>
                    <div className="w-full flex items-end" style={{ height: '80px' }}>
                      <div
                        className={`w-full rounded-t-md transition-all ${isLast ? 'bg-primary/70' : 'bg-white/10 hover:bg-white/15'}`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="text-xs text-white/40">{d.month}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly spending chart */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/8 p-6">
              <p className="text-sm font-semibold text-white/80 mb-6">Monthly Spending</p>
              <div className="flex items-end gap-3 h-32">
                {spendingHistory.map((d, i) => {
                  const heightPct = (d.value / maxSpend) * 100
                  const isLast = i === spendingHistory.length - 1
                  return (
                    <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex items-end" style={{ height: '64px' }}>
                        <div
                          className={`w-full rounded-t-md ${isLast ? 'bg-primary/50' : d.value === maxSpend ? 'bg-red-400/40' : 'bg-white/10'}`}
                          style={{ height: `${heightPct}%` }}
                        />
                      </div>
                      <span className="text-xs text-white/40">{d.month}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Asset allocation */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/8 p-6">
              <p className="text-sm font-semibold text-white/80 mb-6">Asset Allocation</p>
              <div className="space-y-4">
                {assetAllocation.map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-xs text-white/50 w-14">{item.label}</span>
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-white/70 w-16 text-right">
                      ${item.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Spending by category */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/8 p-6">
            <p className="text-sm font-semibold text-white/80 mb-6">Spending by Category — April 2026</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {spendingByCategory.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-xs text-white/50 w-24 shrink-0">{item.label}</span>
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary/50 rounded-full" style={{ width: `${item.pct}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-white/70 w-16 text-right">
                    ₹{item.value.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
