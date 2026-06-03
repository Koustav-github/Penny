import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/AppSidebar'
import AnalyticsClient from './AnalyticsClient'

export default async function AnalyticsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  return (
    <div className="min-h-screen bg-black flex">
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary/10 blur-[180px] rounded-full pointer-events-none -z-0" />
      <AppSidebar active="analytics" />
      <main className="flex-1 flex flex-col min-h-screen relative z-10">
        <header className="flex items-center justify-between px-8 py-5 border-b border-white/5">
          <div>
            <h1 className="text-xl font-semibold text-white">Analytics</h1>
            <p className="text-sm text-white/40 mt-0.5">Your assets and spending at a glance</p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/60 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Live
          </div>
        </header>
        <AnalyticsClient />
      </main>
    </div>
  )
}
