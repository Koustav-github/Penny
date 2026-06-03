import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/AppSidebar'
import ExpensesClient from './ExpensesClient'

export default async function ExpensesPage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  return (
    <div className="min-h-screen bg-bg flex relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-accent/10 blur-[150px]" />
      <AppSidebar active="expenses" />
      <main className="flex-1 flex flex-col min-h-screen relative z-10">
        <header className="flex items-center justify-between px-8 py-5 border-b border-border">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink tracking-tight">Expenses</h1>
            <p className="text-sm text-muted mt-0.5">Track where your money goes</p>
          </div>
        </header>
        <ExpensesClient />
      </main>
    </div>
  )
}
