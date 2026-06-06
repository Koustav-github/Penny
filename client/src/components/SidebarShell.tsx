'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import SidebarSignOut from './SidebarSignOut'
import ThemeToggle from './ThemeToggle'

export interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

/**
 * Responsive app sidebar. On desktop (lg+) it's a static column; on mobile it
 * becomes an off-canvas drawer toggled from a fixed top bar.
 */
export default function SidebarShell({
  active,
  firstName,
  email,
  imageUrl,
  navItems,
}: {
  active: string
  firstName: string
  email: string
  imageUrl?: string | null
  navItems: NavItem[]
}) {
  const [open, setOpen] = useState(false)

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [open])

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 flex items-center gap-3 px-4 border-b border-border bg-bg-elev/85 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="grid h-9 w-9 place-items-center rounded-lg border border-border text-ink hover:bg-surface-2 transition-colors"
        >
          <IconMenu />
        </button>
        <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-accent-ink font-display font-extrabold text-sm">P</span>
          <span className="font-display text-lg font-extrabold tracking-tight text-ink">Penny</span>
        </Link>
      </div>

      {/* Overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/55 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden="true" />
      )}

      {/* Sidebar / drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 overflow-hidden border-r border-border bg-bg-elev/95 lg:bg-bg-elev/85 backdrop-blur-xl flex flex-col px-4 py-6 transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Logo + mobile close (pinned) */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-2 group">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-ink font-display font-extrabold text-lg shadow-[0_0_24px_var(--glow)] transition-transform group-hover:scale-105">
              P
            </span>
            <span className="font-display text-xl font-extrabold tracking-tight text-ink">Penny</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="lg:hidden grid h-8 w-8 place-items-center rounded-lg text-muted hover:text-ink hover:bg-surface-2 transition-colors"
          >
            <IconClose />
          </button>
        </div>

        {/* Scrollable nav region */}
        <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">Menu</p>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = active === item.label.toLowerCase().replace(' ', '-') || active === item.label.toLowerCase()
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive ? 'bg-accent/12 text-ink' : 'text-muted hover:text-ink hover:bg-surface-2'
                }`}
              >
                {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-accent" />}
                <span className={isActive ? 'text-accent' : 'text-faint group-hover:text-muted'}>{item.icon}</span>
                {item.label}
                {item.label === 'AI Reports' && (
                  <span className="ml-auto text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-accent/15 text-accent">New</span>
                )}
              </Link>
            )
          })}
        </nav>
        </div>

        {/* Footer (pinned, always visible) */}
        <div className="border-t border-border pt-4 mt-4 flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between px-2">
            <span className="text-[11px] font-medium text-faint">Appearance</span>
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt={firstName} className="h-9 w-9 rounded-full object-cover shrink-0 ring-1 ring-border-strong" />
            ) : (
              <div className="grid h-9 w-9 place-items-center rounded-full bg-accent/15 text-accent font-semibold text-sm shrink-0">
                {firstName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-ink truncate">{firstName}</span>
              <span className="text-xs text-faint truncate">{email}</span>
            </div>
          </div>
          <SidebarSignOut />
        </div>
      </aside>
    </>
  )
}

function IconMenu() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
    </svg>
  )
}

function IconClose() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
