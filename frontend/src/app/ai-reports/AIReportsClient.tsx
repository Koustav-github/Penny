"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/lib/api";
import {
  RISK_OPTIONS,
  profileComplete,
  type Goal,
  type GoalTerm,
  type Profile,
  type ProfileInput,
  type Report,
  type ReportType,
  type RiskAppetite,
} from "@/lib/reports";

const REPORT_TYPES: { id: ReportType; label: string; desc: string; icon: React.ReactNode }[] = [
  { id: "spending", label: "Spending Breakdown", desc: "Where your money went and how to trim it", icon: <IconReceipt /> },
  { id: "networth", label: "Net-Worth Review", desc: "Your asset mix and concentration risk", icon: <IconChart /> },
  { id: "savings", label: "Savings Strategy", desc: "A plan to save more each month", icon: <IconPig /> },
  { id: "investing", label: "Investment Ideas", desc: "Allocation for your risk profile", icon: <IconSpark /> },
];

const PERIODS = ["This month", "Last 3 months", "Last 6 months", "Year to date"] as const;

export default function AIReportsClient() {
  const { getToken } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [type, setType] = useState<ReportType>("spending");
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("This month");
  const [phase, setPhase] = useState<"idle" | "analyzing" | "done">("idle");
  const [current, setCurrent] = useState<Report | null>(null);
  const [consentOpen, setConsentOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getProfile(getToken), api.listReports(getToken)])
      .then(([p, r]) => {
        setProfile(p);
        setReports(r);
      })
      .catch((e) => console.error("Failed to load AI reports", e))
      .finally(() => setLoading(false));
  }, [getToken]);

  const runGenerate = async () => {
    setError(null);
    setPhase("analyzing");
    try {
      const r = await api.generateReport(getToken, { report_type: type, period });
      setCurrent(r);
      setReports((prev) => [r, ...prev]);
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate report");
      setPhase("idle");
    }
  };

  const onGenerate = () => {
    if (!profile?.ai_consent) {
      setConsentOpen(true);
      return;
    }
    runGenerate();
  };

  const acceptConsent = async () => {
    try {
      const p = await api.aiConsent(getToken);
      setProfile(p);
      setConsentOpen(false);
      runGenerate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to record consent");
      setConsentOpen(false);
    }
  };

  return (
    <div className="flex-1 px-8 py-8 space-y-8 max-w-6xl">
      {loading ? (
        <AIReportsSkeleton />
      ) : (
        <>
      {/* Profile setup */}
      {profile && !profileComplete(profile) && (
        <ProfilePanel profile={profile} onSaved={setProfile} />
      )}

      {/* Goals */}
      {profile && <GoalsSection profile={profile} onSaved={setProfile} />}

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
                  active ? "border-accent/50 bg-accent/10 ring-1 ring-accent/30" : "border-border bg-surface-2 hover:border-border-strong"
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
                period === p ? "bg-ink text-bg border-ink" : "bg-surface-2 text-muted border-border hover:text-ink"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-6 rounded-xl bg-negative/10 border border-negative/25 px-3 py-2 text-sm text-negative">{error}</div>
        )}

        <div className="mt-7 flex flex-wrap items-center gap-4">
          <button
            onClick={onGenerate}
            disabled={phase === "analyzing"}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent hover:bg-accent-press text-accent-ink font-semibold text-sm transition-all shadow-[0_0_28px_var(--glow)] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {phase === "analyzing" ? <><Spinner /> Penny is analyzing…</> : <><IconSpark /> Generate report</>}
          </button>
          <span className="text-xs text-faint">Period: {period}</span>
        </div>
      </section>

      {/* Output */}
      {phase === "analyzing" && <AnalyzingSkeleton />}
      {phase === "done" && current && <ReportView report={current} />}

      {/* History */}
      <section>
        <h2 className="font-display text-lg font-bold text-ink mb-4">Past reports</h2>
        {reports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-strong p-10 text-center">
            <p className="text-sm text-muted">Your generated reports will appear here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reports.map((r) => (
              <button
                key={r.id}
                onClick={() => { setCurrent(r); setPhase("done"); }}
                className="w-full flex items-center justify-between gap-3 rounded-2xl bg-surface border border-border px-5 py-3.5 text-left hover:border-border-strong transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {REPORT_TYPES.find((t) => t.id === r.report_type)?.label ?? r.report_type}
                    <span className="text-faint font-normal"> · {r.period}</span>
                  </p>
                  <p className="text-xs text-faint">{new Date(r.created_at).toLocaleString()} · {r.model === "heuristic" ? "heuristic preview" : "AI"}</p>
                </div>
                <span className="text-accent text-sm font-medium">View →</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {consentOpen && <ConsentModal onAccept={acceptConsent} onClose={() => setConsentOpen(false)} />}
        </>
      )}
    </div>
  );
}

function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <span className={`block skeleton rounded-lg ${className}`} style={style} />;
}

function AIReportsSkeleton() {
  return (
    <div className="space-y-8 animate-fade">
      {/* Builder section */}
      <section className="rounded-3xl bg-surface border border-border p-6 sm:p-8">
        <Skeleton className="h-3 w-32 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-border bg-surface-2 p-4 space-y-3">
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          ))}
        </div>
        <Skeleton className="h-3 w-24 my-6" />
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-10 w-40 rounded-full mt-7" />
      </section>

      {/* History section */}
      <section>
        <Skeleton className="h-6 w-28 mb-4" />
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl bg-surface border border-border px-5 py-3.5 space-y-2">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-3 w-48" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ReportView({ report }: { report: Report }) {
  return (
    <section className="space-y-4 animate-fade">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-display text-xl font-bold text-ink">
          {REPORT_TYPES.find((t) => t.id === report.report_type)?.label ?? report.report_type}
        </h2>
        <span className="text-[11px] font-medium text-faint px-2.5 py-1 rounded-full bg-surface-2 border border-border">
          {report.model === "heuristic" ? "Heuristic preview · set GROQ_API_KEY for full AI" : `Generated by ${report.model}`}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {report.sections.map((s, i) => (
          <div key={s.key} className="rounded-2xl bg-surface border border-border p-6 animate-rise" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <h3 className="font-display text-base font-bold text-ink">{s.title}</h3>
            </div>
            <p className="text-sm text-muted leading-relaxed">{s.body}</p>
            {s.bullets.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {s.bullets.map((b, j) => (
                  <li key={j} className="flex gap-2 text-sm text-muted">
                    <span className="text-accent mt-0.5 shrink-0">›</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-faint">{report.disclaimer}</p>
    </section>
  );
}

function ProfilePanel({ profile, onSaved }: { profile: Profile; onSaved: (p: Profile) => void }) {
  const { getToken } = useAuth();
  const [risk, setRisk] = useState<RiskAppetite>(profile.risk_appetite ?? "balanced");
  const [savings, setSavings] = useState(profile.monthly_savings_target?.toString() ?? "");
  const [horizon, setHorizon] = useState(profile.time_horizon_years?.toString() ?? "");
  const [dependents, setDependents] = useState(profile.dependents?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const body: ProfileInput = {
      risk_appetite: risk,
      monthly_savings_target: savings ? Number(savings) : null,
      time_horizon_years: horizon ? Number(horizon) : null,
      dependents: dependents ? Number(dependents) : null,
    };
    try {
      onSaved(await api.updateProfile(getToken, body));
    } catch (e) {
      console.error("Failed to save profile", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-3xl border border-accent/30 bg-accent/[0.06] p-6 sm:p-8 animate-rise">
      <h2 className="font-display text-lg font-bold text-ink">Set up your financial profile</h2>
      <p className="text-sm text-muted mt-1 mb-5">Penny uses this to tailor your reports. You can change it anytime.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-muted">Risk appetite</span>
          <select value={risk} onChange={(e) => setRisk(e.target.value as RiskAppetite)} className="rounded-xl bg-surface-2 border border-border px-3 py-2.5 text-sm text-ink outline-none focus:border-border-strong">
            {RISK_OPTIONS.map((o) => <option key={o.value} value={o.value} className="bg-surface text-ink">{o.label}</option>)}
          </select>
        </label>
        <Field label="Monthly savings target" value={savings} onChange={setSavings} type="number" placeholder="e.g. 10000" />
        <Field label="Time horizon (years)" value={horizon} onChange={setHorizon} type="number" placeholder="e.g. 10" />
        <Field label="Dependents" value={dependents} onChange={setDependents} type="number" placeholder="e.g. 2" />
      </div>

      <button onClick={save} disabled={saving} className="mt-5 px-5 py-2.5 rounded-full bg-accent hover:bg-accent-press text-accent-ink text-sm font-semibold transition-colors disabled:opacity-60">
        {saving ? "Saving…" : "Save profile"}
      </button>
    </section>
  );
}

const TERMS: { term: GoalTerm; label: string }[] = [
  { term: "short", label: "Short-term" },
  { term: "long", label: "Long-term" },
];

function GoalsSection({ profile, onSaved }: { profile: Profile; onSaved: (p: Profile) => void }) {
  const { getToken } = useAuth();
  const [goals, setGoals] = useState<Goal[]>(profile.goals ?? []);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const patch = (i: number, p: Partial<Goal>) => {
    setGoals((gs) => gs.map((g, j) => (j === i ? { ...g, ...p } : g)));
    setDirty(true);
  };
  const remove = (i: number) => {
    setGoals((gs) => gs.filter((_, j) => j !== i));
    setDirty(true);
  };
  const add = (term: GoalTerm) => {
    setGoals((gs) => [...gs, { text: "", term }]);
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    const cleaned = goals.map((g) => ({ text: g.text.trim(), term: g.term })).filter((g) => g.text);
    try {
      onSaved(await api.updateProfile(getToken, { goals: cleaned }));
      setGoals(cleaned);
      setDirty(false);
    } catch (e) {
      console.error("Failed to save goals", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-3xl bg-surface border border-border p-6 sm:p-8 animate-rise">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h2 className="font-display text-lg font-bold text-ink">Your goals</h2>
        {dirty && (
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded-full bg-accent hover:bg-accent-press text-accent-ink text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save goals"}
          </button>
        )}
      </div>
      <p className="text-sm text-muted mb-6">Track short- and long-term goals. Penny uses these to tailor your reports.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {TERMS.map(({ term, label }) => {
          const count = goals.filter((g) => g.term === term).length;
          return (
            <div key={term}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${term === "short" ? "bg-accent" : "bg-emerald"}`} />
                  {label}
                </h3>
                <span className="text-xs text-faint">{count} {count === 1 ? "goal" : "goals"}</span>
              </div>

              <div className="space-y-2">
                {goals.map((g, i) =>
                  g.term !== term ? null : (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={g.text}
                        onChange={(e) => patch(i, { text: e.target.value })}
                        placeholder={term === "short" ? "e.g. Build an emergency fund" : "e.g. Buy a house in 5 years"}
                        className="flex-1 rounded-xl bg-surface-2 border border-border px-3 py-2.5 text-sm text-ink placeholder:text-faint outline-none focus:border-accent/60"
                      />
                      <button
                        type="button"
                        onClick={() => patch(i, { term: term === "short" ? "long" : "short" })}
                        title={`Move to ${term === "short" ? "long" : "short"}-term`}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 border border-border text-muted hover:text-ink transition-colors"
                      >
                        <IconSwap />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(i)}
                        title="Delete goal"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 border border-border text-negative/80 hover:text-negative transition-colors"
                      >
                        <IconTrash />
                      </button>
                    </div>
                  )
                )}
                {count === 0 && <p className="text-xs text-faint">No {label.toLowerCase()} goals yet.</p>}
                <button
                  type="button"
                  onClick={() => add(term)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline mt-1"
                >
                  <IconPlus /> Add {label.toLowerCase()} goal
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ConsentModal({ onAccept, onClose }: { onAccept: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl bg-surface border border-border-strong p-6 shadow-[var(--shadow)] animate-rise">
        <h2 className="font-display text-xl font-bold text-ink">Before Penny analyzes your finances</h2>
        <p className="text-sm text-muted mt-3 leading-relaxed">
          To generate a report, a summary of your financial data (asset totals, spending by category, salary and loans —
          no names) is sent to an external AI provider (Groq) for analysis.
        </p>
        <p className="text-sm text-muted mt-3 leading-relaxed">
          Penny is <span className="text-ink font-medium">not a registered investment adviser</span>. Reports are for
          informational purposes only and are not financial advice.
        </p>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-surface-2 border border-border text-sm text-muted hover:text-ink transition-colors">Cancel</button>
          <button onClick={onAccept} className="flex-1 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-press text-accent-ink font-semibold text-sm transition-colors">I understand, continue</button>
        </div>
      </div>
    </div>
  );
}

function AnalyzingSkeleton() {
  return (
    <section className="space-y-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-border bg-surface p-6">
          <div className="h-3 w-1/3 rounded-full bg-surface-2 mb-3" style={{ animation: "penny-fade 1s ease infinite alternate" }} />
          <div className="h-2.5 w-full rounded-full bg-surface-2 mb-2" style={{ animation: "penny-fade 1s ease infinite alternate", animationDelay: "120ms" }} />
          <div className="h-2.5 w-4/5 rounded-full bg-surface-2" style={{ animation: "penny-fade 1s ease infinite alternate", animationDelay: "240ms" }} />
        </div>
      ))}
    </section>
  );
}

function Field({ label, value, onChange, ...rest }: { label: string; value: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] text-muted">{label}</span>
      <input {...rest} value={value} onChange={(e) => onChange(e.target.value)} className="rounded-xl bg-surface-2 border border-border px-3 py-2.5 text-sm text-ink placeholder:text-faint outline-none focus:border-accent/60" />
    </label>
  );
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
function Spinner() {
  return (<span className="inline-block h-4 w-4 rounded-full border-2 border-accent-ink/30 border-t-accent-ink" style={{ animation: "penny-spin 0.7s linear infinite" }} />);
}
function IconSwap() {
  return (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>);
}
function IconTrash() {
  return (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>);
}
function IconPlus() {
  return (<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>);
}
