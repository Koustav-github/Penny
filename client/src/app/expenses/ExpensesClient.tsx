'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { api, type ExpenseInput } from '@/lib/api'
import { formatCurrency } from '@/lib/format'
import {
  EXPENSE_CATEGORY_COLORS,
  categoryLabel,
  formatExpenseDate,
  type Expense,
  type ExpenseSummary,
} from '@/lib/expenses'
import ExpenseForm from '@/components/ExpenseForm'

export default function ExpensesClient() {
  const { getToken } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [summary, setSummary] = useState<ExpenseSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | undefined>()

  const load = useCallback(async () => {
    setError(null)
    try {
      const [e, s] = await Promise.all([api.listExpenses(getToken), api.expenseSummary(getToken)])
      setExpenses(e)
      setSummary(s)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => { load() }, [load])

  const handleSubmit = async (input: ExpenseInput) => {
    if (editing) await api.updateExpense(getToken, editing.id, input)
    else await api.createExpense(getToken, input)
    await load()
  }

  const handleDelete = async (id: number) => {
    await api.deleteExpense(getToken, id)
    await load()
  }

  const currency = summary?.currency ?? 'INR'
  const monthTotal = summary?.total ?? 0
  const topCategories = (summary?.by_category ?? []).slice(0, 4)

  return (
    <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 space-y-6">
      {loading ? (
        <ExpensesSkeleton />
      ) : (
        <>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-muted">
          {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}
        </p>
        <button
          onClick={() => { setEditing(undefined); setFormOpen(true) }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-accent hover:bg-accent-press text-accent-ink text-sm font-semibold transition-all shadow-[0_0_24px_var(--glow)] hover:-translate-y-0.5"
        >
          <PlusIcon /> Log Expense
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-negative/10 border border-negative/25 px-3 py-2 text-sm text-negative">{error}</div>
      )}

      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-3xl bg-surface border border-border p-6">
          <p className="text-xs font-semibold text-faint uppercase tracking-[0.16em] mb-2">This Month</p>
          <p className="font-display text-4xl font-extrabold text-ink tracking-tight tabular-nums">{formatCurrency(monthTotal, currency)}</p>
          <p className="text-xs text-muted mt-2">{summary?.count ?? 0} transactions</p>
        </div>

        <div className="rounded-3xl bg-surface border border-border p-6 sm:col-span-2">
          <p className="text-xs font-semibold text-faint uppercase tracking-[0.16em] mb-4">Top Categories</p>
          {topCategories.length === 0 ? (
            <p className="text-sm text-muted">No spending logged this month yet.</p>
          ) : (
            <div className="space-y-3">
              {topCategories.map((c) => (
                <div key={c.category} className="flex items-center gap-3">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border w-28 text-center truncate ${EXPENSE_CATEGORY_COLORS[c.category]}`}>
                    {categoryLabel(c.category)}
                  </span>
                  <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${c.pct}%` }} />
                  </div>
                  <span className="text-xs text-muted font-medium w-20 text-right tabular-nums">
                    {formatCurrency(c.total, currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expense list */}
      {loading ? (
        <p className="text-muted text-sm">Loading…</p>
      ) : expenses.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border-strong p-12 text-center">
          <p className="text-muted">No expenses yet — log your first to start tracking your spending.</p>
        </div>
      ) : (
        <div className="rounded-3xl bg-surface border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">Transactions</p>
            <span className="text-xs text-faint">{expenses.length} entries</span>
          </div>
          <div className="divide-y divide-border">
            {expenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between px-6 py-4 hover:bg-surface-2 transition-colors group">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-surface-2 border border-border text-sm font-bold text-muted shrink-0">
                    {expense.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{expense.name}</p>
                    <p className="text-xs text-faint">
                      {formatExpenseDate(expense.spent_on)}{expense.note ? ` · ${expense.note}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${EXPENSE_CATEGORY_COLORS[expense.category]}`}>
                    {categoryLabel(expense.category)}
                  </span>
                  <span className="text-sm font-semibold text-ink w-28 text-right tabular-nums">
                    −{formatCurrency(expense.amount, currency)}
                  </span>
                  <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditing(expense); setFormOpen(true) }} className="text-xs text-muted hover:text-ink">Edit</button>
                    <button onClick={() => handleDelete(expense.id)} className="text-xs text-negative/80 hover:text-negative">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

        </>
      )}
      {formOpen && (
        <ExpenseForm initial={editing} onSubmit={handleSubmit} onClose={() => setFormOpen(false)} />
      )}
    </div>
  )
}

function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <span className={`block skeleton rounded-lg ${className}`} style={style} />
}

function ExpensesSkeleton() {
  return (
    <div className="space-y-6 animate-fade">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-10 w-28 rounded-full" />
      </div>
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-3xl bg-surface border border-border p-6">
          <Skeleton className="h-3 w-24 mb-3" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-3 w-20 mt-2" />
        </div>
        <div className="rounded-3xl bg-surface border border-border p-6 sm:col-span-2">
          <Skeleton className="h-3 w-28 mb-4" />
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-3 w-24 shrink-0" />
                <Skeleton className="h-1.5 flex-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Transaction list */}
      <div className="rounded-3xl bg-surface border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="divide-y divide-border">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4 flex-1">
                <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}
