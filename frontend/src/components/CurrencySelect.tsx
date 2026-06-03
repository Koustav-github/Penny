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
      className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none"
    >
      {CURRENCIES.map((c) => <option key={c} value={c} className="bg-[#0c0c0c]">{c}</option>)}
    </select>
  )
}
