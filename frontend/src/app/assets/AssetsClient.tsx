'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { api, type AssetInput } from '@/lib/api'
import { formatCurrency } from '@/lib/format'
import { CATEGORIES, CATEGORY_COLORS, type Asset, type AssetSummary } from '@/lib/assets'
import AssetForm from '@/components/AssetForm'
import CategoryDonut from '@/components/CategoryDonut'
import CurrencySelect from '@/components/CurrencySelect'

export default function AssetsClient() {
  const { getToken } = useAuth()
  const [assets, setAssets] = useState<Asset[]>([])
  const [summary, setSummary] = useState<AssetSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Asset | undefined>()

  const load = useCallback(async () => {
    setError(null)
    try {
      const [a, s] = await Promise.all([api.listAssets(getToken), api.summary(getToken)])
      setAssets(a)
      setSummary(s)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load assets')
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => { load() }, [load])

  const handleSubmit = async (input: AssetInput) => {
    if (editing) await api.updateAsset(getToken, editing.id, input)
    else await api.createAsset(getToken, input)
    await load()
  }

  const handleDelete = async (id: number) => {
    await api.deleteAsset(getToken, id)
    await load()
  }

  const currency = summary?.currency ?? 'INR'
  const total = summary?.total ?? 0

  return (
    <div className="flex-1 px-8 py-8 space-y-6">
      {loading ? (
        <AssetsSkeleton />
      ) : (
        <>
      {/* Total + actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold text-faint uppercase tracking-[0.16em]">Total Value</p>
          <p className="font-display text-4xl font-extrabold text-ink tracking-tight tabular-nums">{formatCurrency(total, currency)}</p>
        </div>
        <div className="flex items-center gap-3">
          <CurrencySelect
            value={currency}
            onChange={(c) => setSummary((s) => (s ? { ...s, currency: c } : s))}
          />
          <button
            onClick={() => { setEditing(undefined); setFormOpen(true) }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-accent hover:bg-accent-press text-accent-ink text-sm font-semibold transition-all shadow-[0_0_24px_var(--glow)] hover:-translate-y-0.5"
          >
            <PlusIcon /> Add Asset
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-negative/10 border border-negative/25 px-3 py-2 text-sm text-negative">{error}</div>
      )}

      {!loading && summary && summary.total > 0 && (
        <div className="rounded-3xl bg-surface border border-border p-6">
          <CategoryDonut data={summary.by_category} />
        </div>
      )}

      {loading ? (
        <p className="text-muted text-sm">Loading…</p>
      ) : assets.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border-strong p-12 text-center">
          <p className="text-muted">No assets yet — add your first to see it on your dashboard.</p>
        </div>
      ) : (
        <div className="rounded-3xl bg-surface border border-border divide-y divide-border overflow-hidden">
          {assets.map((a) => {
            const label = CATEGORIES.find((c) => c.value === a.category)?.label ?? a.category
            return (
              <div key={a.id} className="group flex items-center justify-between px-6 py-4 hover:bg-surface-2 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="h-9 w-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[a.category] }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{a.name}</p>
                    <p className="text-xs text-faint">
                      {label}{a.subtype ? ` · ${a.subtype}` : ''}{a.quantity != null ? ` · ${a.quantity}` : ''}{a.emi != null ? ` · EMI ${formatCurrency(a.emi, currency)}/mo` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-ink tabular-nums">{formatCurrency(a.value, currency)}</span>
                  <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditing(a); setFormOpen(true) }} className="text-xs text-muted hover:text-ink">Edit</button>
                    <button onClick={() => handleDelete(a.id)} className="text-xs text-negative/80 hover:text-negative">Delete</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {formOpen && (
        <AssetForm initial={editing} onSubmit={handleSubmit} onClose={() => setFormOpen(false)} />
      )}
        </>
      )}
    </div>
  )
}

function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <span className={`block skeleton rounded-lg ${className}`} style={style} />
}

function AssetsSkeleton() {
  return (
    <div className="space-y-6 animate-fade">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-32 rounded-full" />
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>
      </div>
      {/* Chart placeholder */}
      <div className="rounded-3xl bg-surface border border-border p-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
      {/* Asset list */}
      <div className="rounded-3xl bg-surface border border-border overflow-hidden">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="space-y-2 text-right">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
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
