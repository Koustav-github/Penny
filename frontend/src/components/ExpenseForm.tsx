'use client'

import { useState } from 'react'
import { EXPENSE_CATEGORIES, type Expense, type ExpenseCategory } from '@/lib/expenses'
import type { ExpenseInput } from '@/lib/api'

interface Props {
  initial?: Expense
  onSubmit: (input: ExpenseInput) => Promise<void>
  onClose: () => void
}

function todayIso() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function ExpenseForm({ initial, onSubmit, onClose }: Props) {
  const [category, setCategory] = useState<ExpenseCategory>(initial?.category ?? 'food')
  const [name, setName] = useState(initial?.name ?? '')
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? '')
  const [spentOn, setSpentOn] = useState(initial?.spent_on ?? todayIso())
  const [note, setNote] = useState(initial?.note ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await onSubmit({
        category,
        name: name.trim(),
        amount: Number(amount),
        spent_on: spentOn,
        note: note.trim() ? note.trim() : null,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl bg-[#0c0c0c] border border-white/10 p-6 flex flex-col gap-4"
      >
        <h2 className="text-lg font-semibold text-white">{initial ? 'Edit expense' : 'Log expense'}</h2>
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <Input label="Name" value={name} onChange={setName} placeholder="e.g. Swiggy, Uber, Netflix" required />

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-white/55">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none"
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value} className="bg-[#0c0c0c]">{c.label}</option>
            ))}
          </select>
        </label>

        <Input label="Amount" type="number" min="0" step="0.01" value={amount} onChange={setAmount} placeholder="0.00" required />

        <Input label="Date" type="date" value={spentOn} onChange={setSpentOn} required />

        <Input label="Note (optional)" value={note} onChange={setNote} placeholder="e.g. Dinner with friends" />

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-sm text-white/70">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-black font-semibold text-sm disabled:opacity-60">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Input({
  label, value, onChange, ...rest
}: { label: string; value: string; onChange: (v: string) => void } &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] text-white/55">{label}</span>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-primary/50"
      />
    </label>
  )
}
