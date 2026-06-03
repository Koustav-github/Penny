import { currentUser } from '@clerk/nextjs/server'
import Link from 'next/link'
import SidebarSignOut from './SidebarSignOut'
import ThemeToggle from './ThemeToggle'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: <IconGrid /> },
  { href: '/assets', label: 'Assets', icon: <IconWallet /> },
  { href: '/expenses', label: 'Expenses', icon: <IconReceipt /> },
  { href: '/analytics', label: 'Analytics', icon: <IconChart /> },
  { href: '/ai-reports', label: 'AI Reports', icon: <IconSparkle /> },
]

export async function AppSidebar({ active }: { active: string }) {
  const user = await currentUser()
  const firstName = user?.firstName ?? 'there'
  const email = user?.emailAddresses[0]?.emailAddress ?? ''

  return (
    <aside className="w-64 min-h-screen border-r border-border bg-bg-elev/60 backdrop-blur-xl flex flex-col px-4 py-6 shrink-0 relative z-20">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2.5 mb-9 px-2 group">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-ink font-display font-extrabold text-lg shadow-[0_0_24px_var(--glow)] transition-transform group-hover:scale-105">
          P
        </span>
        <span className="font-display text-xl font-extrabold tracking-tight text-ink">Penny</span>
      </Link>

      <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">Menu</p>
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const isActive = active === item.label.toLowerCase().replace(' ', '-') || active === item.label.toLowerCase()
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-accent/12 text-ink'
                  : 'text-muted hover:text-ink hover:bg-surface-2'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-accent" />
              )}
              <span className={isActive ? 'text-accent' : 'text-faint group-hover:text-muted'}>{item.icon}</span>
              {item.label}
              {item.label === 'AI Reports' && (
                <span className="ml-auto text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-accent/15 text-accent">
                  New
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border pt-4 mt-4 flex flex-col gap-2">
        <div className="flex items-center justify-between px-2">
          <span className="text-[11px] font-medium text-faint">Appearance</span>
          <ThemeToggle />
        </div>
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-accent/15 text-accent font-semibold text-sm shrink-0">
            {firstName.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-ink truncate">{firstName}</span>
            <span className="text-xs text-faint truncate">{email}</span>
          </div>
        </div>
        <SidebarSignOut />
      </div>
    </aside>
  )
}

function IconGrid() {
  return (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

function IconWallet() {
  return (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
    </svg>
  )
}

function IconReceipt() {
  return (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z" />
    </svg>
  )
}

function IconChart() {
  return (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  )
}

function IconSparkle() {
  return (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
  )
}
