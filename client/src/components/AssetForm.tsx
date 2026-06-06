'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { CATEGORIES, AUTO_CATEGORIES, SYMBOL_CATEGORIES, type Asset, type Category } from '@/lib/assets'
import { api, type AssetInput, type SymbolHit } from '@/lib/api'
import { formatCurrency } from '@/lib/format'
import AssetSearch from './AssetSearch'

interface Props {
  initial?: Asset
  onSubmit: (input: AssetInput) => Promise<void>
  onClose: () => void
}

type Preview = { value: number | null; currency: string; priced: boolean }

export default function AssetForm({ initial, onSubmit, onClose }: Props) {
  const { getToken } = useAuth()
  const [category, setCategory] = useState<Category>(initial?.category ?? 'bank')
  const [name, setName] = useState(initial?.name ?? '')
  const [symbol, setSymbol] = useState(initial?.symbol ?? '')
  const [subtype, setSubtype] = useState(initial?.subtype ?? 'Savings')
  const [account, setAccount] = useState(initial?.account ?? '')
  const [quantity, setQuantity] = useState(initial?.quantity?.toString() ?? '')
  const [value, setValue] = useState(initial?.value?.toString() ?? '')
  const [emi, setEmi] = useState(initial?.emi?.toString() ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [previewing, setPreviewing] = useState(false)

  const isAuto = AUTO_CATEGORIES.includes(category)
  const needsSymbol = SYMBOL_CATEGORIES.includes(category)

  // Live value preview for auto categories (crypto/stock/gold).
  useEffect(() => {
    if (!isAuto) { setPreview(null); return }
    const qty = Number(quantity)
    if (!qty || (needsSymbol && !symbol)) { setPreview(null); return }
    setPreviewing(true)
    const t = setTimeout(async () => {
      try {
        setPreview(await api.quote(getToken, { category, quantity: qty, symbol: needsSymbol ? symbol : null }))
      } catch {
        setPreview(null)
      } finally {
        setPreviewing(false)
      }
    }, 400)
    return () => clearTimeout(t)
  }, [category, quantity, symbol, isAuto, needsSymbol, getToken])

  const buildInput = (): AssetInput => {
    switch (category) {
      case 'bank':
        return { category, name: name.trim(), subtype, value: Number(value) }
      case 'cash':
        return { category, value: Number(value) } // server auto-names it "Cash"
      case 'crypto':
        return { category, name: name.trim(), symbol, quantity: Number(quantity) }
      case 'stock':
        return { category, name: name.trim(), symbol, account: account.trim() || null, quantity: Number(quantity) }
      case 'gold':
        return { category, name: 'Gold', account: account.trim() || null, quantity: Number(quantity) }
      case 'loan':
        return { category, name: name.trim(), value: Number(value), emi: Number(emi) }
      default: // other
        return { category, name: name.trim(), value: Number(value) }
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (needsSymbol && !symbol) {
      setError(`Please pick a ${category} from the search list.`)
      return
    }
    setSaving(true)
    try {
      await onSubmit(buildInput())
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const pickSymbol = (h: SymbolHit) => { setSymbol(h.symbol); setName(h.name) }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md rounded-3xl bg-surface border border-border-strong p-6 flex flex-col gap-4 shadow-[var(--shadow)] animate-rise"
      >
        <h2 className="font-display text-xl font-bold text-ink">{initial ? 'Edit asset' : 'Add asset'}</h2>
        {error && (
          <div className="rounded-xl bg-negative/10 border border-negative/25 px-3 py-2 text-sm text-negative">{error}</div>
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

        {category === 'bank' && (
          <>
            <Input label="Bank name" value={name} onChange={setName} placeholder="e.g. SBI" required />
            <Select label="Account type" value={subtype} onChange={setSubtype} options={['Savings', 'Current']} />
            <Input label="Current balance" type="number" value={value} onChange={setValue} placeholder="0.00" required />
          </>
        )}

        {category === 'cash' && (
          <Input label="Amount" type="number" value={value} onChange={setValue} placeholder="0.00" required />
        )}

        {category === 'crypto' && (
          <>
            <AssetSearch kind="crypto" label="Crypto" selectedName={initial?.name} onSelect={pickSymbol} placeholder="Search Bitcoin, Ethereum…" />
            <Input label="Quantity" type="number" value={quantity} onChange={setQuantity} placeholder="0.5" required />
          </>
        )}

        {category === 'stock' && (
          <>
            <AssetSearch kind="stock" label="Stock" selectedName={initial?.name} onSelect={pickSymbol} placeholder="Search Reliance, AAPL…" />
            <Input label="Demat / broker" value={account} onChange={setAccount} placeholder="e.g. Zerodha" />
            <Input label="Shares" type="number" value={quantity} onChange={setQuantity} placeholder="10" required />
          </>
        )}

        {category === 'gold' && (
          <>
            <Input label="Gold (grams / SGB units)" type="number" value={quantity} onChange={setQuantity} placeholder="10" required />
            <Input label="Demat / broker" value={account} onChange={setAccount} placeholder="e.g. HDFC Demat" />
          </>
        )}

        {category === 'loan' && (
          <>
            <Input label="Loan name" value={name} onChange={setName} placeholder="e.g. Car loan" required />
            <Input label="Outstanding amount" type="number" value={value} onChange={setValue} placeholder="0.00" required />
            <Input label="Monthly EMI" type="number" value={emi} onChange={setEmi} placeholder="0.00" required />
          </>
        )}

        {category === 'other' && (
          <>
            <Input label="Source" value={name} onChange={setName} placeholder="e.g. PPF, NPS" required />
            <Input label="Amount" type="number" value={value} onChange={setValue} placeholder="0.00" required />
          </>
        )}

        {isAuto && (
          <div className="rounded-xl bg-surface-2 border border-border px-3 py-2.5 text-sm">
            {previewing ? (
              <span className="text-faint">Fetching live price…</span>
            ) : preview?.priced && preview.value != null ? (
              <span className="text-ink">≈ {formatCurrency(preview.value, preview.currency)} <span className="text-faint">· live</span></span>
            ) : (
              <span className="text-faint">Value updates automatically from market price.</span>
            )}
          </div>
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

function Select({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl bg-surface-2 border border-border px-3 py-2.5 text-sm text-ink outline-none focus:border-border-strong"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-surface text-ink">{o}</option>
        ))}
      </select>
    </label>
  )
}
