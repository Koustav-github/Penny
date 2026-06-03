"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { type AssetSummary, CATEGORIES } from "@/lib/assets";
import { categoryLabel, monthShortLabel, type ExpenseSummary } from "@/lib/expenses";

type ReportType = "spending" | "networth" | "savings" | "investing";

interface Insight {
  tone: "good" | "warn" | "info";
  title: string;
  body: string;
}

const REPORT_TYPES: { id: ReportType; label: string; desc: string; icon: React.ReactNode }[] = [
  { id: "spending", label: "Spending Breakdown", desc: "Where your money went and how to trim it", icon: <IconReceipt /> },
  { id: "networth", label: "Net-Worth Review", desc: "Your asset mix and concentration risk", icon: <IconChart /> },
  { id: "savings", label: "Savings Strategy", desc: "A simple plan to save more each month", icon: <IconPig /> },
  { id: "investing", label: "Investment Ideas", desc: "Allocation suggestions for your profile", icon: <IconSpark /> },
];

const PERIODS = ["This month", "Last 3 months", "Last 6 months", "Year to date"] as const;

export default function AIReportsClient() {
  const { getToken } = useAuth();
  const [assets, setAssets] = useState<AssetSummary | null>(null);
  const [expenses, setExpenses] = useState<ExpenseSummary | null>(null);
  const [type, setType] = useState<ReportType>("spending");
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("This month");
  const [phase, setPhase] = useState<"idle" | "analyzing" | "done">("idle");
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    Promise.all([api.summary(getToken), api.expenseSummary(getToken)])
      .then(([a, e]) => {
        setAssets(a);
        setExpenses(e);
      })
      .catch((err) => console.error("Failed to load report data", err));
  }, [getToken]);

  const currency = assets?.currency ?? expenses?.currency ?? "INR";
  const hasData = (assets?.total ?? 0) > 0 || (expenses?.count ?? 0) > 0;

  const generate = () => {
    setPhase("analyzing");
    setInsights([]);
    // Simulated "thinking" — the real LLM/RAG engine plugs in here later.
    setTimeout(() => {
      setInsights(buildInsights(type, assets, expenses, currency));
      setPhase("done");
    }, 1500);
  };

  return (
    <div className="flex-1 px-8 py-8 space-y-8 max-w-6xl">
      {/* Builder */}
      <section className="rounded-3xl bg-surface border border-border p-6 sm:p-8 animate-rise">
        <p className="text-xs font-semibold text-faint uppercase tracking-[0.16em] mb-4">1 · Choose a report</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {REPORT_TYPES.map((r) => {
            const active = type === r.id;
            return (
              <button
                key={r.id}
                onClick={() => { setType(r.id); setPhase("idle"); }}
                className={`text-left rounded-2xl border p-4 transition-all ${
                  active
                    ? "border-accent/50 bg-accent/10 ring-1 ring-accent/30"
                    : "border-border bg-surface-2 hover:border-border-strong"
                }`}
              >
                <span className={`grid h-9 w-9 place-items-center rounded-xl mb-3 ${active ? "bg-accent text-accent-ink" : "bg-surface text-muted"}`}>
                  {r.icon}
                </span>
                <p className="text-sm font-semibold text-ink">{r.label}</p>
                <p className="text-xs text-muted mt-0.5">{r.desc}</p>
              </button>
            );
          })}
        </div>

        <p className="text-xs font-semibold text-faint uppercase tracking-[0.16em] mt-7 mb-3">2 · Time period</p>
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                period === p
                  ? "bg-ink text-bg border-ink"
                  : "bg-surface-2 text-muted border-border hover:text-ink"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-4">
          <button
            onClick={generate}
            disabled={phase === "analyzing" || !hasData}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent hover:bg-accent-press text-accent-ink font-semibold text-sm transition-all shadow-[0_0_28px_var(--glow)] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {phase === "analyzing" ? <><Spinner /> Penny is analyzing…</> : <><IconSpark /> Generate report</>}
          </button>
          {!hasData && (
            <p className="text-xs text-muted">Add assets or log expenses first so Penny has something to analyze.</p>
          )}
          <span className="text-xs text-faint">Period: {period}</span>
        </div>
      </section>

      {/* Output */}
      {phase === "analyzing" && <AnalyzingSkeleton />}

      {phase === "done" && (
        <section className="space-y-4 animate-fade">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-ink">
              {REPORT_TYPES.find((r) => r.id === type)?.label}
            </h2>
            <span className="text-[11px] font-medium text-faint px-2.5 py-1 rounded-full bg-surface-2 border border-border">
              Heuristic preview · full AI engine coming soon
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((ins, i) => (
              <InsightCard key={i} insight={ins} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* What Penny analyzes */}
      <section>
        <h2 className="font-display text-lg font-bold text-ink mb-4">What Penny looks at</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FeatureCard icon={<IconChart />} title="Your full picture" body="Assets, allocation, expenses and monthly trends — all in one analysis." />
          <FeatureCard icon={<IconBook />} title="Financial principles" body="Grounded in budgeting rules and investment fundamentals (RAG-based engine, coming soon)." />
          <FeatureCard icon={<IconShield />} title="SEBI-aware by design" body="Penny suggests; you decide. Built toward compliant, advice-grade reporting." />
        </div>
      </section>

      {/* History (empty for now) */}
      <section>
        <h2 className="font-display text-lg font-bold text-ink mb-4">Past reports</h2>
        <div className="rounded-2xl border border-dashed border-border-strong p-10 text-center">
          <p className="text-sm text-muted">Your generated reports will be saved here once the AI engine is live.</p>
        </div>
      </section>
    </div>
  );
}

function InsightCard({ insight, index }: { insight: Insight; index: number }) {
  const toneStyles: Record<Insight["tone"], string> = {
    good: "border-positive/30 bg-positive/8",
    warn: "border-negative/30 bg-negative/8",
    info: "border-border bg-surface",
  };
  const dot: Record<Insight["tone"], string> = {
    good: "bg-positive",
    warn: "bg-negative",
    info: "bg-accent",
  };
  return (
    <div
      className={`rounded-2xl border p-5 animate-rise ${toneStyles[insight.tone]}`}
      style={{ animationDelay: `${index * 90}ms` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`h-2 w-2 rounded-full ${dot[insight.tone]}`} />
        <p className="text-sm font-semibold text-ink">{insight.title}</p>
      </div>
      <p className="text-sm text-muted leading-relaxed">{insight.body}</p>
    </div>
  );
}

function AnalyzingSkeleton() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-border bg-surface p-5">
          <div className="h-3 w-1/3 rounded-full bg-surface-2 mb-3" style={{ animation: "penny-fade 1s ease infinite alternate" }} />
          <div className="h-2.5 w-full rounded-full bg-surface-2 mb-2" style={{ animation: "penny-fade 1s ease infinite alternate", animationDelay: "120ms" }} />
          <div className="h-2.5 w-4/5 rounded-full bg-surface-2" style={{ animation: "penny-fade 1s ease infinite alternate", animationDelay: "240ms" }} />
        </div>
      ))}
    </section>
  );
}

function FeatureCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-surface border border-border p-5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent/15 text-accent mb-3">{icon}</span>
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="text-xs text-muted mt-1 leading-relaxed">{body}</p>
    </div>
  );
}

/**
 * Heuristic insight generator. This is deliberately rule-based for now; the
 * real LLM/RAG engine will replace `buildInsights` while keeping this shape.
 */
function buildInsights(
  type: ReportType,
  assets: AssetSummary | null,
  expenses: ExpenseSummary | null,
  currency: string
): Insight[] {
  const out: Insight[] = [];
  const top = expenses?.by_category?.[0];
  const monthly = expenses?.monthly ?? [];
  const thisMonth = monthly.at(-1)?.total ?? 0;
  const lastMonth = monthly.at(-2)?.total ?? 0;
  const topAsset = [...(assets?.by_category ?? [])].sort((a, b) => b.total - a.total)[0];

  if (type === "spending" || type === "savings") {
    if (top) {
      out.push({
        tone: top.pct > 35 ? "warn" : "info",
        title: `${categoryLabel(top.category)} leads your spending`,
        body: `You spent ${formatCurrency(top.total, currency)} (${top.pct}%) on ${categoryLabel(top.category).toLowerCase()} this month.${
          top.pct > 35 ? ` That's a large share — trimming it toward 20% would free up roughly ${formatCurrency(top.total * 0.4, currency)} a month.` : " That looks well balanced."
        }`,
      });
    }
    if (lastMonth > 0) {
      const delta = ((thisMonth - lastMonth) / lastMonth) * 100;
      out.push({
        tone: delta > 10 ? "warn" : "good",
        title: delta >= 0 ? "Spending is up vs last month" : "Spending is down vs last month",
        body: `${monthShortLabel(monthly.at(-1)!.month)} spend is ${Math.abs(delta).toFixed(0)}% ${delta >= 0 ? "higher" : "lower"} than ${monthShortLabel(monthly.at(-2)!.month)} (${formatCurrency(thisMonth, currency)} vs ${formatCurrency(lastMonth, currency)}).`,
      });
    }
  }

  if (type === "savings") {
    out.push({
      tone: "info",
      title: "Suggested savings move",
      body: `A simple 50/30/20 split puts 20% of income toward savings. Once you add income, Penny can size an emergency fund and a monthly SIP target for you.`,
    });
  }

  if (type === "networth" || type === "investing") {
    if (topAsset && assets) {
      out.push({
        tone: topAsset.pct > 60 ? "warn" : "good",
        title: `${CATEGORIES.find((c) => c.value === topAsset.category)?.label ?? topAsset.category} dominates your portfolio`,
        body: `${topAsset.pct}% of your ${formatCurrency(assets.total, currency)} in assets sits in ${(CATEGORIES.find((c) => c.value === topAsset.category)?.label ?? topAsset.category).toLowerCase()}.${
          topAsset.pct > 60 ? " High concentration adds risk — consider diversifying across more categories." : " That's a reasonably diversified base."
        }`,
      });
    }
    out.push({
      tone: "info",
      title: "A balanced starting allocation",
      body: "A common long-term mix is ~50% index funds, 20% bonds, 20% stocks, 10% gold. Penny will tailor this to your risk profile once goals and income are added.",
    });
  }

  if (out.length === 0) {
    out.push({
      tone: "info",
      title: "Not enough data yet",
      body: "Add a few assets and log some expenses, then regenerate — Penny needs data to find patterns.",
    });
  }

  out.push({
    tone: "info",
    title: "How this becomes real AI",
    body: "These are rule-based previews. The production engine will use an open-source LLM over a RAG knowledge base of financial principles to write tailored, advice-grade reports.",
  });

  return out;
}

/* — icons — */
function IconReceipt() {
  return (<svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z" /></svg>);
}
function IconChart() {
  return (<svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>);
}
function IconPig() {
  return (<svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>);
}
function IconSpark() {
  return (<svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>);
}
function IconBook() {
  return (<svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>);
}
function IconShield() {
  return (<svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 5.25-3.75 9-9 9s-9-3.75-9-9 3.75-9 9-9 9 3.75 9 9z" /></svg>);
}
function Spinner() {
  return (<span className="inline-block h-4 w-4 rounded-full border-2 border-accent-ink/30 border-t-accent-ink" style={{ animation: "penny-spin 0.7s linear infinite" }} />);
}
