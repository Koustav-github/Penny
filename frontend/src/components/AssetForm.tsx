'use client'

import { useState } from 'react'
import { CATEGORIES, QUANTITY_CATEGORIES, type Asset, type Category } from '@/lib/assets'
import type { AssetInput } from '@/lib/api'

interface Props {
  initial?: Asset
  onSubmit: (input: AssetInput) => Promise<void>
  onClose: () => void
}

export default function AssetForm({ initial, onSubmit, onClose }: Props) {
  const [category, setCategory] = useState<Category>(initial?.category ?? 'bank')
  const [name, setName] = useState(initial?.name ?? '')
  const [subtype, setSubtype] = useState(initial?.subtype ?? 'Savings')
  const [quantity, setQuantity] = useState(initial?.quantity?.toString() ?? '')
  const [value, setValue] = useState(initial?.value?.toString() ?? '')
  const [emi, setEmi] = useState(initial?.emi?.toString() ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const showQuantity = QUANTITY_CATEGORIES.includes(category)
  const showSubtype = category === 'bank'
  const isLoan = category === 'loan'

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await onSubmit({
        category,
        name: name.trim(),
        subtype: showSubtype ? subtype : null,
        quantity: showQuantity ? Number(quantity) : null,
        value: Number(value),
        emi: isLoan ? Number(emi) : null,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md rounded-3xl bg-surface border border-border-strong p-6 flex flex-col gap-4 shadow-[var(--shadow)] animate-rise"
      >
        <h2 className="font-display text-xl font-bold text-ink">{initial ? 'Edit asset' : 'Add asset'}</h2>
        {error && (
          <div className="rounded-xl bg-negative/10 border border-negative/25 px-3 py-2 text-sm text-negative">
            {error}
          </div>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-muted">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="rounded-xl bg-surface-2 border border-border px-3 py-2.5 text-sm text-ink outline-none focus:border-border-strong"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value} className="bg-surface text-ink">{c.label}</option>
            ))}
          </select>
        </label>

        <Input label="Name" value={name} onChange={setName} placeholder="e.g. SBI, Bitcoin, Nifty 50" required />

        {showSubtype && (
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] text-muted">Account type</span>
            <select
              value={subtype}
              onChange={(e) => setSubtype(e.target.value)}
              className="rounded-xl bg-surface-2 border border-border px-3 py-2.5 text-sm text-ink outline-none focus:border-border-strong"
            >
              <option className="bg-surface text-ink">Savings</option>
              <option className="bg-surface text-ink">Current</option>
            </select>
          </label>
        )}

        {showQuantity && (
          <Input label="Quantity" type="number" value={quantity} onChange={setQuantity} placeholder="0.5" required />
        )}

        <Input
          label={isLoan ? 'Outstanding amount' : 'Current value'}
          type="number"
          value={value}
          onChange={setValue}
          placeholder="0.00"
          required
        />

        {isLoan && (
          <Input label="Monthly EMI" type="number" value={emi} onChange={setEmi} placeholder="0.00" required />
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-surface-2 border border-border text-sm text-muted hover:text-ink transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-press text-accent-ink font-semibold text-sm disabled:opacity-60 transition-colors">
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
      <span className="text-[13px] text-muted">{label}</span>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl bg-surface-2 border border-border px-3 py-2.5 text-sm text-ink placeholder:text-faint outline-none focus:border-accent/60"
      />
    </label>
  )
}
