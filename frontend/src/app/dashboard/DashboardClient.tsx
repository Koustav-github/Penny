"use client";
import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { api, type ExpenseInput } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { computeNetWorth } from "@/lib/networth";
import { CATEGORIES, type Asset, type AssetSummary } from "@/lib/assets";
import { categoryLabel, type ExpenseSummary } from "@/lib/expenses";
import CategoryDonut from "@/components/CategoryDonut";
import ExpenseForm from "@/components/ExpenseForm";
import SalaryEditor from "@/components/SalaryEditor";

interface DashboardClientProps {
  firstName: string;
  email: string;
}

export default function DashboardClient({ firstName }: DashboardClientProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();

  const [summary, setSummary] = useState<AssetSummary | null>(null);
  const [assetList, setAssetList] = useState<Asset[]>([]);
  const [expenses, setExpenses] = useState<ExpenseSummary | null>(null);
  const [salary, setSalary] = useState(0);
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);

  const reload = async () => {
    const [s, a, e, m] = await Promise.all([
      api.summary(getToken),
      api.listAssets(getToken),
      api.expenseSummary(getToken),
      api.me(getToken),
    ]);
    setSummary(s);
    setAssetList(a);
    setExpenses(e);
    setSalary(m.monthly_salary);
  };

  const logExpense = async (input: ExpenseInput) => {
    await api.createExpense(getToken, input);
    await reload();
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetch("http://localhost:8000/users/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerk_id: user?.id,
          email: user?.primaryEmailAddress?.emailAddress,
        }),
      }).catch((error) => console.error("Failed to sync user:", error));
    }
  }, [isLoaded, isSignedIn, user]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    reload().catch((e) => console.error("Failed to load dashboard data", e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, getToken]);

  const currency = summary?.currency ?? "INR";
  const assetTotal = summary?.total ?? 0;
  const thisMonthSpend = expenses?.total ?? 0;
  const emiTotal = summary?.emi_total ?? 0;
  const netWorth = computeNetWorth({ assetTotal, salary, monthExpenses: thisMonthSpend, emiTotal });
  const monthly = expenses?.monthly ?? [];
  const maxMonthly = Math.max(1, ...monthly.map((m) => m.total));
  const topCategory = expenses?.by_category?.[0];
  const greeting = greetingForNow();

  return (
    <main className="flex-1 flex flex-col min-h-screen relative z-10">
      {/* Top bar */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-border">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink tracking-tight">
            {greeting}, {firstName}
          </h1>
          <p className="text-sm text-muted mt-0.5">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-2 border border-border text-xs text-muted font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Live
          </span>
          <Link
            href="/ai-reports"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent hover:bg-accent-press text-accent-ink text-sm font-semibold transition-all shadow-[0_0_24px_var(--glow)] hover:-translate-y-0.5"
          >
            <SparkIcon /> Generate AI report
          </Link>
        </div>
      </header>

      <div className="flex-1 px-8 py-8 space-y-6">
        {/* Hero row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Net worth */}
          <div className="lg:col-span-2 relative rounded-3xl bg-surface border border-border p-8 overflow-hidden animate-rise">
            <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-faint uppercase tracking-[0.18em] mb-2">Total Net Worth</p>
                <p className="font-display text-5xl md:text-6xl font-extrabold text-ink tracking-tight tabular-nums">
                  {formatCurrency(netWorth, currency)}
                </p>
                <p className="text-sm text-muted mt-3">
                  {formatCurrency(assetTotal, currency)} assets + {formatCurrency(salary, currency)} income − {formatCurrency(thisMonthSpend, currency)} spent − {formatCurrency(emiTotal, currency)} EMIs
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-positive/15 text-positive text-xs font-semibold">
                <SparkIcon /> Tracked
              </div>
            </div>

            {summary && summary.total > 0 ? (
              <div className="mt-8 pt-6 border-t border-border">
                <CategoryDonut data={summary.by_category} />
              </div>
            ) : (
              <div className="mt-8 pt-6 border-t border-border">
                <p className="text-sm text-muted">
                  No assets yet —{" "}
                  <Link href="/assets" className="text-accent font-medium hover:underline">
                    add your first asset
                  </Link>{" "}
                  to start tracking your net worth.
                </p>
              </div>
            )}
          </div>

          {/* AI insight teaser */}
          <div className="relative rounded-3xl border border-border bg-linear-to-b from-accent/8 to-transparent p-6 flex flex-col overflow-hidden animate-rise" style={{ animationDelay: "80ms" }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/15 text-accent">
                <SparkIcon />
              </span>
              <span className="text-sm font-semibold text-ink">Penny AI</span>
            </div>
            <p className="font-display text-lg font-semibold text-ink leading-snug">
              {topCategory
                ? `${categoryLabel(topCategory.category)} is your biggest spend this month at ${topCategory.pct}%.`
                : "Log some expenses and I'll surface where your money goes."}
            </p>
            <p className="text-sm text-muted mt-2 flex-1">
              Get a full AI breakdown of your spending, savings rate, and tailored suggestions.
            </p>
            <Link
              href="/ai-reports"
              className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border-strong text-sm font-semibold text-ink hover:bg-surface-2 transition-colors"
            >
              Open AI Reports →
            </Link>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-accent/25 bg-accent/10 p-5">
            <p className="text-[11px] font-semibold text-faint uppercase tracking-[0.16em] mb-2">Monthly Income</p>
            <SalaryEditor value={salary} currency={currency} onSaved={setSalary} />
            <p className="text-xs text-muted mt-1">Increments net worth</p>
          </div>
          <StatCard label="This Month Spent" value={formatCurrency(thisMonthSpend, currency)} sub={`${expenses?.count ?? 0} transactions`} />
          <StatCard label="Monthly EMIs" value={formatCurrency(emiTotal, currency)} sub={emiTotal > 0 ? "Across your loans" : "No loans"} />
          <StatCard label="Top Category" value={topCategory ? categoryLabel(topCategory.category) : "—"} sub={topCategory ? `${topCategory.pct}% of spend` : "No data"} />
        </div>

        {/* Spending trend + assets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mini spend chart */}
          <div className="rounded-3xl bg-surface border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm font-semibold text-ink">Spending — last 6 months</p>
              <Link href="/analytics" className="text-xs text-accent font-medium hover:underline">Analytics →</Link>
            </div>
            {monthly.some((m) => m.total > 0) ? (
              <div className="flex items-end gap-2.5 h-32">
                {monthly.map((m, i) => {
                  const h = (m.total / maxMonthly) * 100;
                  const last = i === monthly.length - 1;
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex items-end" style={{ height: "88px" }}>
                        <div
                          className={`w-full rounded-t-lg origin-bottom ${last ? "bg-accent" : "bg-border-strong"}`}
                          style={{ height: `${h}%`, animation: "penny-grow-bar 0.6s cubic-bezier(0.16,1,0.3,1) both", animationDelay: `${i * 60}ms` }}
                        />
                      </div>
                      <span className="text-[11px] text-faint">{monthShort(m.month)}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted">Log expenses to see your spending trend.</p>
            )}
          </div>

          {/* Assets list */}
          <div className="lg:col-span-2 rounded-3xl bg-surface border border-border overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <p className="text-sm font-semibold text-ink">Your Assets</p>
              <Link href="/assets" className="text-xs text-accent font-medium hover:underline">Manage →</Link>
            </div>
            {assetList.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-muted text-sm">Add assets to see them here.</p>
              </div>
            ) : (
              <div className="divide-y divide-border max-h-72 overflow-auto">
                {assetList.slice(0, 6).map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-surface-2 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-surface-2 border border-border text-sm font-bold text-muted shrink-0">
                        {a.name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{a.name}</p>
                        <p className="text-xs text-faint">{CATEGORIES.find((c) => c.value === a.category)?.label ?? a.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-ink tabular-nums">{formatCurrency(a.value, currency)}</p>
                      <p className="text-xs text-faint">{assetTotal > 0 ? ((a.value / assetTotal) * 100).toFixed(1) : "0.0"}%</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setExpenseFormOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent hover:bg-accent-press text-accent-ink text-sm font-semibold transition-all hover:-translate-y-0.5"
          >
            <PlusIcon /> Log Expense
          </button>
          <QuickLink href="/assets" label="Add Asset" />
          <QuickLink href="/analytics" label="View Analytics" />
          <QuickLink href="/ai-reports" label="AI Reports" />
        </div>
      </div>

      {expenseFormOpen && (
        <ExpenseForm onSubmit={logExpense} onClose={() => setExpenseFormOpen(false)} />
      )}
    </main>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${accent ? "bg-accent/10 border-accent/25" : "bg-surface border-border"}`}>
      <p className="text-[11px] font-semibold text-faint uppercase tracking-[0.16em] mb-2">{label}</p>
      <p className="font-display text-xl font-bold text-ink tracking-tight truncate tabular-nums">{value}</p>
      <p className="text-xs text-muted mt-1 truncate">{sub}</p>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center px-5 py-2.5 rounded-full bg-surface hover:bg-surface-2 border border-border text-sm font-medium text-muted hover:text-ink transition-all"
    >
      {label}
    </Link>
  );
}

function greetingForNow() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function monthShort(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-US", { month: "short" });
}

function SparkIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}
