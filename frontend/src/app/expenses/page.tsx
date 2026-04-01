import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/AppSidebar'

const expenses = [
  { id: 1,  name: 'Swiggy',           category: 'Food',          amount: 340,   date: 'Apr 1, 2026',  note: 'Dinner' },
  { id: 2,  name: 'Uber',             category: 'Transport',     amount: 185,   date: 'Mar 31, 2026', note: 'To airport' },
  { id: 3,  name: 'Netflix',          category: 'Subscriptions', amount: 649,   date: 'Mar 30, 2026', note: 'Monthly' },
  { id: 4,  name: 'D-Mart',           category: 'Groceries',     amount: 1240,  date: 'Mar 29, 2026', note: 'Weekly shop' },
  { id: 5,  name: 'Spotify',          category: 'Subscriptions', amount: 119,   date: 'Mar 28, 2026', note: 'Monthly' },
  { id: 6,  name: 'Zepto',            category: 'Groceries',     amount: 430,   date: 'Mar 27, 2026', note: '' },
  { id: 7,  name: 'BookMyShow',       category: 'Entertainment', amount: 560,   date: 'Mar 26, 2026', note: 'Movie' },
  { id: 8,  name: 'Ola',              category: 'Transport',     amount: 95,    date: 'Mar 25, 2026', note: '' },
  { id: 9,  name: 'Zomato',           category: 'Food',          amount: 275,   date: 'Mar 24, 2026', note: 'Lunch' },
  { id: 10, name: 'Electricity Bill', category: 'Utilities',     amount: 1820,  date: 'Mar 22, 2026', note: 'March bill' },
  { id: 11, name: 'Amazon',           category: 'Shopping',      amount: 2199,  date: 'Mar 20, 2026', note: 'Headphones' },
  { id: 12, name: 'Gym',              category: 'Health',        amount: 1500,  date: 'Mar 15, 2026', note: 'Monthly membership' },
]

const categoryColors: Record<string, string> = {
  Food:          'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Transport:     'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Subscriptions: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Groceries:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Entertainment: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  Utilities:     'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  Shopping:      'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  Health:        'bg-red-500/10 text-red-400 border-red-500/20',
}

export default async function ExpensesPage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  const totalMonth = expenses.reduce((s, e) => s + e.amount, 0)

  // Category totals for summary
  const categoryTotals = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount
    return acc
  }, {})
  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)

  return (
    <div className="min-h-screen bg-black flex">
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary/10 blur-[180px] rounded-full pointer-events-none -z-0" />

      <AppSidebar active="expenses" />

      <main className="flex-1 flex flex-col min-h-screen relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-5 border-b border-white/5">
          <div>
            <h1 className="text-xl font-semibold text-white">Expenses</h1>
            <p className="text-sm text-white/40 mt-0.5">April 2026</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary hover:bg-primary-hover text-black text-sm font-semibold transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:-translate-y-0.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Log Expense
          </button>
        </header>

        <div className="flex-1 px-8 py-8 space-y-8">
          {/* Summary row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white/[0.03] border border-white/8 p-6 col-span-1 sm:col-span-1">
              <p className="text-xs font-medium text-white/40 uppercase tracking-widest mb-2">This Month</p>
              <p className="text-4xl font-bold text-white tracking-tight">
                ₹{totalMonth.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-white/30 mt-2">{expenses.length} transactions</p>
            </div>

            <div className="rounded-2xl bg-white/[0.03] border border-white/8 p-6 sm:col-span-2">
              <p className="text-xs font-medium text-white/40 uppercase tracking-widest mb-4">Top Categories</p>
              <div className="space-y-3">
                {topCategories.map(([cat, total]) => {
                  const pct = Math.round((total / totalMonth) * 100)
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border w-28 text-center truncate ${categoryColors[cat] ?? 'bg-white/10 text-white/50 border-white/10'}`}>
                        {cat}
                      </span>
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/60 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-white/60 font-medium w-16 text-right">
                        ₹{total.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Expense list */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/8 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <p className="text-sm font-semibold text-white/80">Transactions</p>
              <span className="text-xs text-white/40">{expenses.length} entries</span>
            </div>
            <div className="divide-y divide-white/5">
              {expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-sm font-bold text-white/60">
                      {expense.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/90">{expense.name}</p>
                      <p className="text-xs text-white/35">{expense.date}{expense.note ? ` · ${expense.note}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${categoryColors[expense.category] ?? 'bg-white/10 text-white/50 border-white/10'}`}>
                      {expense.category}
                    </span>
                    <span className="text-sm font-semibold text-white w-24 text-right">
                      −₹{expense.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
