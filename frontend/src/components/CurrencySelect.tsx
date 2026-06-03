'use client'

import { useAuth } from '@clerk/nextjs'
import { api } from '@/lib/api'

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP']

export default function CurrencySelect({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const { getToken } = useAuth()
  return (
    <select
      value={value}
      onChange={async (e) => {
        const c = e.target.value
        onChange(c)
        try { await api.updateCurrency(getToken, c) } catch (err) { console.error(err) }
      }}
      className="rounded-xl bg-surface-2 border border-border px-3 py-2 text-sm text-ink outline-none focus:border-border-strong"
    >
      {CURRENCIES.map((c) => <option key={c} value={c} className="bg-surface text-ink">{c}</option>)}
    </select>
  )
}
