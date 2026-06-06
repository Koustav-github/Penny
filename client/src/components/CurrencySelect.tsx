'use client'

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP']

export default function CurrencySelect({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (c: string) => void
  disabled?: boolean
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl bg-surface-2 border border-border px-3 py-2 text-sm text-ink outline-none focus:border-border-strong disabled:opacity-60"
    >
      {CURRENCIES.map((c) => (
        <option key={c} value={c} className="bg-surface text-ink">{c}</option>
      ))}
    </select>
  )
}
