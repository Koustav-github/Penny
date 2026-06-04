'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

const LINKS = [
  { href: '#how', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#demo', label: 'Meet Penny' },
  { href: '#roadmap', label: 'Roadmap' },
]

export default function LandingNav() {
  const [open, setOpen] = useState(false)

  // Lock scroll while the mobile menu is open.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  return (
    <>
      <nav className="nav-inner" aria-label="Primary">
        <Link className="brand" href="#top" onClick={() => setOpen(false)}>
          <span className="coin-mark">P</span>Penny
        </Link>

        <div className="nav-links">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>{l.label}</a>
          ))}
        </div>

        <div className="nav-cta">
          <ThemeToggle />
          <Link href="/login" className="nav-signin" style={{ fontSize: 14, color: 'var(--ink-dim)' }}>Sign in</Link>
          <Link className="btn btn-primary nav-getstarted" href="/signup">Get started</Link>
          <button
            type="button"
            className="nav-burger"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {open && (
        <>
          <div className="nav-scrim" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="nav-menu" role="menu">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
            ))}
            <div className="nav-menu-actions">
              <Link href="/login" onClick={() => setOpen(false)} className="btn btn-ghost">Sign in</Link>
              <Link href="/signup" onClick={() => setOpen(false)} className="btn btn-primary">Get started</Link>
            </div>
          </div>
        </>
      )}
    </>
  )
}
