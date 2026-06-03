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
    <div className="flex-1 px-8 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/40">
          {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}
        </p>
        <button
          onClick={() => { setEditing(undefined); setFormOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary hover:bg-primary-hover text-black text-sm font-semibold transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:-translate-y-0.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Log Expense
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-300">{error}</div>
      )}

      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white/[0.03] border border-white/8 p-6">
          <p className="text-xs font-medium text-white/40 uppercase tracking-widest mb-2">This Month</p>
          <p className="text-4xl font-bold text-white tracking-tight">{formatCurrency(monthTotal, currency)}</p>
          <p className="text-xs text-white/30 mt-2">{summary?.count ?? 0} transactions</p>
        </div>

        <div className="rounded-2xl bg-white/[0.03] border border-white/8 p-6 sm:col-span-2">
          <p className="text-xs font-medium text-white/40 uppercase tracking-widest mb-4">Top Categories</p>
          {topCategories.length === 0 ? (
            <p className="text-sm text-white/30">No spending logged this month yet.</p>
          ) : (
            <div className="space-y-3">
              {topCategories.map((c) => (
                <div key={c.category} className="flex items-center gap-3">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border w-28 text-center truncate ${EXPENSE_CATEGORY_COLORS[c.category]}`}>
                    {categoryLabel(c.category)}
                  </span>
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary/60 rounded-full" style={{ width: `${c.pct}%` }} />
                  </div>
                  <span className="text-xs text-white/60 font-medium w-20 text-right">
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
        <p className="text-white/40 text-sm">Loading…</p>
      ) : expenses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
          <p className="text-white/60">No expenses yet — log your first to start tracking your spending.</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white/[0.03] border border-white/8 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <p className="text-sm font-semibold text-white/80">Transactions</p>
            <span className="text-xs text-white/40">{expenses.length} entries</span>
          </div>
          <div className="divide-y divide-white/5">
            {expenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-sm font-bold text-white/60">
                    {expense.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/90">{expense.name}</p>
                    <p className="text-xs text-white/35">
                      {formatExpenseDate(expense.spent_on)}{expense.note ? ` · ${expense.note}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${EXPENSE_CATEGORY_COLORS[expense.category]}`}>
                    {categoryLabel(expense.category)}
                  </span>
                  <span className="text-sm font-semibold text-white w-28 text-right">
                    −{formatCurrency(expense.amount, currency)}
                  </span>
                  <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditing(expense); setFormOpen(true) }} className="text-xs text-white/40 hover:text-white/80">Edit</button>
                    <button onClick={() => handleDelete(expense.id)} className="text-xs text-red-400/70 hover:text-red-400">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {formOpen && (
        <ExpenseForm initial={editing} onSubmit={handleSubmit} onClose={() => setFormOpen(false)} />
      )}
    </div>
  )
}
