import Link from 'next/link'
import ThemeToggle from './ThemeToggle'

interface AuthShellProps {
  title: string
  subtitle: string
  footerPrompt: string
  footerLinkLabel: string
  footerHref: string
  children: React.ReactNode
}

const BULLETS = [
  { icon: <IconWallet />, text: 'Track every asset in one net-worth figure' },
  { icon: <IconSpark />, text: 'AI insights that tell you what to do next' },
  { icon: <IconShield />, text: 'Your data, your control — no hidden fees' },
]

export default function AuthShell({
  title,
  subtitle,
  footerPrompt,
  footerLinkLabel,
  footerHref,
  children,
}: AuthShellProps) {
  return (
    <div className="min-h-screen bg-bg text-ink relative overflow-hidden flex items-center justify-center px-4 py-10">
      {/* Atmosphere */}
      <div className="pointer-events-none absolute -top-40 -left-24 h-[520px] w-[520px] rounded-full bg-accent/12 blur-[150px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[480px] w-[480px] rounded-full bg-emerald/10 blur-[150px]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'radial-gradient(var(--text) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />

      {/* Theme toggle */}
      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-5xl grid lg:grid-cols-2 rounded-[2rem] border border-border bg-surface/80 backdrop-blur-xl shadow-[var(--shadow)] overflow-hidden animate-rise">
        {/* Brand panel */}
        <aside className="hidden lg:flex flex-col justify-between p-10 bg-linear-to-br from-accent/12 via-transparent to-emerald/8 border-r border-border">
          <Link href="/" className="flex items-center gap-2.5 w-fit">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-ink font-display font-extrabold text-lg shadow-[0_0_24px_var(--glow)]">P</span>
            <span className="font-display text-xl font-extrabold tracking-tight">Penny</span>
          </Link>

          <div>
            <h2 className="font-display text-3xl font-extrabold tracking-tight leading-tight">
              Your money,
              <br />
              <span className="text-accent">intelligently managed.</span>
            </h2>
            <ul className="mt-7 space-y-3.5">
              {BULLETS.map((b, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-muted">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/15 text-accent shrink-0">{b.icon}</span>
                  {b.text}
                </li>
              ))}
            </ul>
          </div>

          {/* Mini mock */}
          <div className="rounded-2xl border border-border bg-surface/70 p-4">
            <p className="text-[10px] uppercase tracking-[0.16em] text-faint">Net Worth</p>
            <div className="flex items-end justify-between">
              <p className="font-display text-2xl font-extrabold tabular-nums">₹12,84,500</p>
              <span className="text-xs font-semibold text-positive">▲ 8.2%</span>
            </div>
            <div className="mt-3 flex items-end gap-1.5 h-10">
              {[40, 55, 48, 70, 62, 88].map((h, i) => (
                <div key={i} className="flex-1 flex items-end h-full">
                  <div className={`w-full rounded-t ${i === 5 ? 'bg-accent' : 'bg-border-strong'}`} style={{ height: `${h}%` }} />
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Form panel */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          {/* Mobile logo */}
          <Link href="/" className="flex lg:hidden items-center gap-2 mb-6 w-fit">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-ink font-display font-extrabold">P</span>
            <span className="font-display text-lg font-extrabold tracking-tight">Penny</span>
          </Link>

          <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted mt-1 mb-6">{subtitle}</p>

          {children}

          <p className="mt-6 text-center text-sm text-muted">
            {footerPrompt}{' '}
            <Link href={footerHref} className="text-accent hover:underline font-semibold transition-colors">
              {footerLinkLabel}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function IconWallet() {
  return (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9" /></svg>)
}
function IconSpark() {
  return (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>)
}
function IconShield() {
  return (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 5.25-3.75 9-9 9s-9-3.75-9-9 3.75-9 9-9 9 3.75 9 9z" /></svg>)
}
