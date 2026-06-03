'use client'

import { useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

/**
 * Dark is the default (no class on <html>). Light adds `html.light`.
 * The choice is persisted to localStorage and applied pre-paint by the
 * bootstrap script in the root layout, so this only needs to sync + flip.
 */
export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Sync React state with the theme already applied to <html> by the pre-paint
    // bootstrap script — an external system we can only read after mount.
    /* eslint-disable react-hooks/set-state-in-effect */
    setMounted(true)
    setTheme(document.documentElement.classList.contains('light') ? 'light' : 'dark')
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.classList.toggle('light', next === 'light')
    try {
      localStorage.setItem('penny-theme', next)
    } catch {
      /* ignore */
    }
  }

  const isLight = theme === 'light'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
      title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
      className={`relative inline-flex h-9 w-16 shrink-0 items-center rounded-full border border-border bg-surface-2 px-1 transition-colors hover:border-border-strong ${className}`}
    >
      {/* knob */}
      <span
        className="grid h-7 w-7 place-items-center rounded-full bg-accent text-accent-ink shadow transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ transform: mounted && isLight ? 'translateX(28px)' : 'translateX(0)' }}
      >
        {isLight ? <SunIcon /> : <MoonIcon />}
      </span>
    </button>
  )
}

function MoonIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  )
}
