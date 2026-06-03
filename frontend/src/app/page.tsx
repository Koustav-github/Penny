import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import LandingMotion from "@/components/LandingMotion";

const FEATURES = [
  { icon: <IconWallet />, title: "Track every asset", body: "Bank balances, stocks, crypto, gold and cash — logged manually and unified into one live net-worth figure." },
  { icon: <IconReceipt />, title: "Expense tracking", body: "Log spending by category and instantly see where your money actually goes each month." },
  { icon: <IconChart />, title: "Net-worth dashboard", body: "Beautiful graphs and analytics that turn raw numbers into a clear picture of your finances." },
  { icon: <IconSpark />, title: "AI insights", body: "“You spent 35% on food this month — try 20% to boost savings.” Plain-language advice from your data." },
  { icon: <IconGlobe />, title: "Multi-currency", body: "Hold and view your wealth in INR, USD, EUR or GBP with live exchange rates." },
  { icon: <IconShield />, title: "Built toward compliance", body: "Designed from day one with SEBI-aware reporting in mind: Penny suggests, you decide." },
];

const ROADMAP = [
  { tag: "v0.1", name: "Tracker", desc: "Personal finance tracker — assets, expenses, net worth." },
  { tag: "v0.2", name: "Advisor", desc: "AI advisor: goal planning, risk profiling, SIP plans." },
  { tag: "v0.3", name: "Assistant", desc: "Live market & crypto data, alerts, recommendations." },
  { tag: "v0.4", name: "Planner", desc: "Allocation, rebalancing, strategy simulation & backtests." },
  { tag: "v0.5", name: "Investor", desc: "Connect brokerages — Penny suggests trades, you approve." },
  { tag: "v1.0", name: "Regulated", desc: "SEBI-authorized: advice-grade, compliant execution." },
];

const TECH = ["Next.js", "FastAPI", "PostgreSQL", "Open-source LLM", "RAG knowledge base"];

export default function Home() {
  return (
    <div className="min-h-screen bg-bg text-ink relative overflow-hidden">
      <LandingMotion />
      {/* Atmosphere */}
      <div className="pointer-events-none absolute -top-40 -left-20 h-[560px] w-[560px] rounded-full bg-accent/12 blur-[150px]" />
      <div className="pointer-events-none absolute top-1/4 -right-24 h-[460px] w-[460px] rounded-full bg-emerald/10 blur-[150px]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "radial-gradient(var(--text) 1px, transparent 1px)", backgroundSize: "32px 32px" }}
      />

      {/* Nav */}
      <header className="relative z-20 max-w-7xl mx-auto flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-ink font-display font-extrabold text-lg shadow-[0_0_24px_var(--glow)]">P</span>
          <span className="font-display text-xl font-extrabold tracking-tight">Penny</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-muted">
          <a href="#features" className="hover:text-ink transition-colors">Features</a>
          <a href="#roadmap" className="hover:text-ink transition-colors">Roadmap</a>
          <a href="#tech" className="hover:text-ink transition-colors">Tech</a>
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login" className="hidden sm:inline text-sm font-medium text-muted hover:text-ink transition-colors">Sign in</Link>
          <Link href="/signup" className="px-4 py-2 rounded-full bg-accent hover:bg-accent-press text-accent-ink text-sm font-semibold transition-all shadow-[0_0_24px_var(--glow)] hover:-translate-y-0.5">
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-20 grid lg:grid-cols-2 gap-14 items-center">
        <div className="animate-rise">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-2 border border-border text-xs font-medium text-muted mb-6">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            The AI financial assistant
          </span>
          <h1 className="font-display text-5xl md:text-6xl lg:text-[4.2rem] font-extrabold leading-[1.02] tracking-tight">
            Manage and grow
            <br />
            your money,{" "}
            <span className="text-accent">intelligently.</span>
          </h1>
          <p className="text-lg text-muted mt-6 max-w-xl text-balance">
            Penny tracks all your assets, analyzes your finances, and turns the numbers into
            clear, actionable advice — on a roadmap from tracker to fully-fledged, SEBI-compliant robo-advisor.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-9">
            <Link href="/signup" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-accent hover:bg-accent-press text-accent-ink font-semibold transition-all shadow-[0_0_36px_var(--glow)] hover:-translate-y-1">
              Start for free <IconArrow />
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center px-7 py-3.5 rounded-full bg-surface hover:bg-surface-2 border border-border font-semibold transition-all">
              Sign in
            </Link>
          </div>
          <div className="flex items-center gap-8 mt-10 pt-8 border-t border-border">
            {[["₹0", "Hidden fees"], ["100%", "Data control"], ["24/7", "Access"]].map(([n, l]) => (
              <div key={l}>
                <p className="font-display text-2xl font-bold">{n}</p>
                <p className="text-xs text-faint uppercase tracking-wider mt-0.5">{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard mock */}
        <div className="relative animate-rise" style={{ animationDelay: "120ms" }}>
          <DashboardMock />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <SectionHeading kicker="What it does" title="Everything you need to see your money clearly" />
        <div data-animate-group className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
          {FEATURES.map((f) => (
            <div key={f.title} data-animate-item className="rounded-3xl bg-surface border border-border p-6 hover:border-border-strong transition-colors">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/15 text-accent mb-4">{f.icon}</span>
              <h3 className="font-display text-lg font-bold">{f.title}</h3>
              <p className="text-sm text-muted mt-1.5 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI showcase */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="rounded-[2rem] border border-border bg-linear-to-b from-accent/8 to-transparent p-8 sm:p-12">
          <SectionHeading kicker="Penny AI" title="Advice that reads like a human wrote it" center />
          <div data-animate-group className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
            <AICard tone="warn" title="Spending alert" body="You spent 35% on food this month. Trimming toward 20% could save you ₹6,000." />
            <AICard tone="good" title="Savings plan" body="Invest ₹5,000/month in index funds and build a ₹1.5 lakh emergency fund." />
            <AICard tone="info" title="Allocation" body="50% index funds · 20% bonds · 20% stocks · 10% gold, tuned to your risk profile." />
          </div>
          <p className="text-center text-xs text-faint mt-8">Powered by an open-source LLM over a RAG knowledge base of financial principles.</p>
        </div>
      </section>

      {/* Roadmap */}
      <section id="roadmap" className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <SectionHeading kicker="The vision" title="From tracker to regulated fintech" />
        <div data-animate-group className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
          {ROADMAP.map((r, i) => (
            <div key={r.tag} data-animate-item className="relative rounded-3xl bg-surface border border-border p-6 overflow-hidden">
              <span className="absolute top-5 right-5 font-display text-5xl font-extrabold text-border-strong/40 select-none">{i + 1}</span>
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-accent/15 text-accent mb-3">{r.tag}</span>
              <h3 className="font-display text-xl font-bold">{r.name}</h3>
              <p className="text-sm text-muted mt-1.5 leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech */}
      <section id="tech" className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="flex flex-col items-center gap-6">
          <p className="text-xs font-semibold text-faint uppercase tracking-[0.18em]">Built with a modern stack</p>
          <div data-animate-group className="flex flex-wrap items-center justify-center gap-3">
            {TECH.map((t) => (
              <span key={t} data-animate-item className="px-4 py-2 rounded-full bg-surface-2 border border-border text-sm font-medium text-muted">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <div data-animate className="relative rounded-[2rem] bg-accent text-accent-ink p-10 sm:p-16 text-center overflow-hidden">
          <div className="pointer-events-none absolute -top-16 -right-10 h-56 w-56 rounded-full bg-black/10 blur-2xl" />
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight">Start growing your wealth today</h2>
          <p className="mt-4 text-accent-ink/80 max-w-xl mx-auto">Free to start, no hidden fees, full control of your data.</p>
          <Link href="/signup" className="inline-flex items-center gap-2 mt-8 px-8 py-3.5 rounded-full bg-accent-ink text-accent font-semibold transition-transform hover:-translate-y-1">
            Create your account <IconArrow />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-accent-ink font-display font-extrabold text-sm">P</span>
            <span className="font-display font-bold">Penny</span>
          </div>
          <p className="text-xs text-faint">Built by Koustav Manna · Penny is not yet a registered investment advisor.</p>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({ kicker, title, center }: { kicker: string; title: string; center?: boolean }) {
  return (
    <div data-animate className={center ? "text-center max-w-2xl mx-auto" : "max-w-2xl"}>
      <p className="text-xs font-semibold text-accent uppercase tracking-[0.18em] mb-3">{kicker}</p>
      <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">{title}</h2>
    </div>
  );
}

function AICard({ tone, title, body }: { tone: "good" | "warn" | "info"; title: string; body: string }) {
  const dot = tone === "good" ? "bg-positive" : tone === "warn" ? "bg-negative" : "bg-accent";
  return (
    <div data-animate-item className="rounded-2xl bg-surface border border-border p-5 text-left">
      <div className="flex items-center gap-2 mb-2">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <p className="text-sm text-muted leading-relaxed">{body}</p>
    </div>
  );
}

function DashboardMock() {
  const bars = [42, 58, 50, 71, 64, 88];
  return (
    <div className="rounded-[1.75rem] border border-border bg-surface shadow-[var(--shadow)] p-6 rotate-1 hover:rotate-0 transition-transform duration-500">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-faint">Net Worth</p>
          <p className="font-display text-3xl font-extrabold tabular-nums">₹12,84,500</p>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-positive/15 text-positive text-xs font-semibold">▲ 8.2%</span>
      </div>
      <div className="flex items-end gap-2 h-28 mb-5">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 flex items-end" style={{ height: "100%" }}>
            <div className={`w-full rounded-t-md ${i === bars.length - 1 ? "bg-accent" : "bg-border-strong"}`} style={{ height: `${h}%` }} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[["Stocks", "42%"], ["Crypto", "14%"], ["Bank", "44%"]].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-surface-2 border border-border p-3">
            <p className="text-[11px] text-faint">{k}</p>
            <p className="font-display font-bold">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* — icons — */
function IconArrow() { return (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>); }
function IconWallet() { return (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9" /></svg>); }
function IconReceipt() { return (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z" /></svg>); }
function IconChart() { return (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>); }
function IconSpark() { return (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>); }
function IconGlobe() { return (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m-9 9h18" /></svg>); }
function IconShield() { return (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 5.25-3.75 9-9 9s-9-3.75-9-9 3.75-9 9-9 9 3.75 9 9z" /></svg>); }
