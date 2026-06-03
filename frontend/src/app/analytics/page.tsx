import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/AppSidebar'
import AnalyticsClient from './AnalyticsClient'

export default async function AnalyticsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  return (
    <div className="min-h-screen bg-bg flex relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-accent/10 blur-[150px]" />
      <AppSidebar active="analytics" />
      <main className="flex-1 flex flex-col min-h-screen relative z-10">
        <header className="flex items-center justify-between px-8 py-5 border-b border-border">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink tracking-tight">Analytics</h1>
            <p className="text-sm text-muted mt-0.5">Your assets and spending at a glance</p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-2 border border-border text-xs text-muted font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Live
          </div>
        </header>
        <AnalyticsClient />
      </main>
    </div>
  )
}
