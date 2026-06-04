import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/AppSidebar'
import AssetsClient from './AssetsClient'

export default async function AssetsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  return (
    <div className="min-h-screen bg-bg flex relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-accent/10 blur-[150px]" />
      <AppSidebar active="assets" />
      <main className="flex-1 flex flex-col min-h-screen relative z-10 pt-14 lg:pt-0">
        <header className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-8 py-4 border-b border-border">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink tracking-tight">Assets</h1>
            <p className="text-sm text-muted mt-0.5">Track and manage all your holdings</p>
          </div>
        </header>
        <AssetsClient />
      </main>
    </div>
  )
}
