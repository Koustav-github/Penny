import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/AppSidebar'
import ExpensesClient from './ExpensesClient'

export default async function ExpensesPage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  return (
    <div className="min-h-screen bg-black flex">
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary/10 blur-[180px] rounded-full pointer-events-none -z-0" />
      <AppSidebar active="expenses" />
      <main className="flex-1 flex flex-col min-h-screen relative z-10">
        <header className="flex items-center justify-between px-8 py-5 border-b border-white/5">
          <div>
            <h1 className="text-xl font-semibold text-white">Expenses</h1>
            <p className="text-sm text-white/40 mt-0.5">Track where your money goes</p>
          </div>
        </header>
        <ExpensesClient />
      </main>
    </div>
  )
}
