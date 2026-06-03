'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/format'

/**
 * Inline editor for the user's monthly salary. Shows the formatted figure;
 * click to edit, saves to the backend on Enter/blur and reports the new value
 * up so net-worth recomputes.
 */
export default function SalaryEditor({
  value,
  currency,
  onSaved,
}: {
  value: number
  currency: string
  onSaved: (v: number) => void
}) {
  const { getToken } = useAuth()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value.toString())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!editing) setDraft(value.toString())
  }, [value, editing])

  const commit = async () => {
    setEditing(false)
    const next = Number(draft)
    if (!Number.isFinite(next) || next < 0 || next === value) return
    setSaving(true)
    try {
      const me = await api.updateSalary(getToken, next)
      onSaved(me.monthly_salary)
    } catch (e) {
      console.error('Failed to save salary', e)
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        min="0"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') setEditing(false)
        }}
        className="w-full font-display text-xl font-bold bg-surface-2 border border-accent/50 rounded-lg px-2 py-1 text-ink outline-none tabular-nums"
      />
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="group flex items-center gap-1.5 font-display text-xl font-bold text-ink tracking-tight tabular-nums hover:text-accent transition-colors"
      title="Click to edit your monthly income"
    >
      {saving ? '…' : formatCurrency(value, currency)}
      <svg className="w-3.5 h-3.5 text-faint group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
      </svg>
    </button>
  )
}
