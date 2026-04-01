import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/AppSidebar'

const assets = [
  { name: 'HDFC Bank', type: 'Bank', balance: 12400.0, account: '****4821', change: +1.2 },
  { name: 'Zerodha Portfolio', type: 'Stock', balance: 8200.0, account: 'EQ Portfolio', change: +5.4 },
  { name: 'Bitcoin', type: 'Crypto', balance: 2100.0, account: '0.031 BTC', change: -2.1 },
  { name: 'Cash', type: 'Cash', balance: 2150.0, account: 'On hand', change: 0 },
  { name: 'SBI Savings', type: 'Bank', balance: 6800.0, account: '****2204', change: +0.6 },
  { name: 'Ethereum', type: 'Crypto', balance: 1340.0, account: '0.44 ETH', change: +3.8 },
]

const typeColors: Record<string, { badge: string; dot: string }> = {
  Bank:   { badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',     dot: 'bg-blue-400' },
  Stock:  { badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
  Crypto: { badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20',  dot: 'bg-orange-400' },
  Cash:   { badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',  dot: 'bg-purple-400' },
}

const allocationGroups = ['Bank', 'Stock', 'Crypto', 'Cash']

export default async function AssetsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  const totalBalance = assets.reduce((s, a) => s + a.balance, 0)

  return (
    <div className="min-h-screen bg-black flex">
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary/10 blur-[180px] rounded-full pointer-events-none -z-0" />

      <AppSidebar active="assets" />

      <main className="flex-1 flex flex-col min-h-screen relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-5 border-b border-white/5">
          <div>
            <h1 className="text-xl font-semibold text-white">Assets</h1>
            <p className="text-sm text-white/40 mt-0.5">Track and manage all your holdings</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary hover:bg-primary-hover text-black text-sm font-semibold transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:-translate-y-0.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Asset
          </button>
        </header>

        <div className="flex-1 px-8 py-8 space-y-8">
          {/* Summary row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {allocationGroups.map((type) => {
              const group = assets.filter((a) => a.type === type)
              const total = group.reduce((s, a) => s + a.balance, 0)
              const pct = ((total / totalBalance) * 100).toFixed(1)
              const colors = typeColors[type]
              return (
                <div key={type} className="rounded-xl bg-white/[0.03] border border-white/8 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                    <span className="text-xs font-medium text-white/50 uppercase tracking-wider">{type}</span>
                  </div>
                  <p className="text-2xl font-bold text-white tracking-tight">
                    ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-white/30 mt-1">{pct}% of portfolio</p>
                </div>
              )
            })}
          </div>

          {/* Allocation bar */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/8 p-6">
            <p className="text-sm font-medium text-white/50 uppercase tracking-widest mb-4">Allocation</p>
            <div className="flex rounded-full overflow-hidden h-3 mb-4">
              {allocationGroups.map((type) => {
                const total = assets.filter((a) => a.type === type).reduce((s, a) => s + a.balance, 0)
                const pct = (total / totalBalance) * 100
                const dotClass = typeColors[type]?.dot ?? 'bg-white/20'
                return (
                  <div
                    key={type}
                    style={{ width: `${pct}%` }}
                    className={`${dotClass} first:rounded-l-full last:rounded-r-full`}
                  />
                )
              })}
            </div>
            <div className="flex flex-wrap gap-4">
              {allocationGroups.map((type) => {
                const total = assets.filter((a) => a.type === type).reduce((s, a) => s + a.balance, 0)
                const pct = ((total / totalBalance) * 100).toFixed(1)
                const colors = typeColors[type]
                return (
                  <div key={type} className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                    <span className="text-xs text-white/50">{type}</span>
                    <span className="text-xs font-semibold text-white/80">{pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Asset list */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/8 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <p className="text-sm font-semibold text-white/80">All Assets</p>
              <span className="text-xs text-white/40">{assets.length} holdings</span>
            </div>
            <div className="divide-y divide-white/5">
              {assets.map((asset) => {
                const colors = typeColors[asset.type]
                return (
                  <div key={asset.name} className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${colors.badge} border`}>
                        {asset.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/90">{asset.name}</p>
                        <p className="text-xs text-white/40">{asset.account}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${colors.badge}`}>
                        {asset.type}
                      </span>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">
                          ${asset.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <p className={`text-xs font-medium ${asset.change > 0 ? 'text-emerald-400' : asset.change < 0 ? 'text-red-400' : 'text-white/30'}`}>
                          {asset.change > 0 ? '+' : ''}{asset.change}%
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-white/[0.02]">
              <span className="text-sm font-semibold text-white/60">Total</span>
              <span className="text-sm font-bold text-white">
                ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
