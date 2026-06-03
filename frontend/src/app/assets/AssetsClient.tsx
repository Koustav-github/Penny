'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { api, type AssetInput } from '@/lib/api'
import { formatCurrency } from '@/lib/format'
import { CATEGORIES, type Asset, type AssetSummary } from '@/lib/assets'
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

  return (
    <div className="flex-1 px-8 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white/50 uppercase tracking-widest">Total</p>
          <p className="text-4xl font-bold text-white">{formatCurrency(summary?.total ?? 0, currency)}</p>
        </div>
        <div className="flex items-center gap-3">
          <CurrencySelect
            value={currency}
            onChange={(c) => setSummary((s) => (s ? { ...s, currency: c } : s))}
          />
          <button
            onClick={() => { setEditing(undefined); setFormOpen(true) }}
            className="px-4 py-2 rounded-full bg-primary text-black text-sm font-semibold"
          >
            + Add Asset
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-300">{error}</div>}

      {!loading && summary && summary.total > 0 && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/8 p-6">
          <CategoryDonut data={summary.by_category} />
        </div>
      )}

      {loading ? (
        <p className="text-white/40 text-sm">Loading…</p>
      ) : assets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
          <p className="text-white/60">No assets yet — add your first to see it on your dashboard.</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white/[0.03] border border-white/8 divide-y divide-white/5">
          {assets.map((a) => {
            const label = CATEGORIES.find((c) => c.value === a.category)?.label ?? a.category
            return (
              <div key={a.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-white/90">{a.name}</p>
                  <p className="text-xs text-white/40">
                    {label}{a.subtype ? ` · ${a.subtype}` : ''}{a.quantity != null ? ` · ${a.quantity}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-white">{formatCurrency(a.value, currency)}</span>
                  <button onClick={() => { setEditing(a); setFormOpen(true) }} className="text-xs text-white/40 hover:text-white/80">Edit</button>
                  <button onClick={() => handleDelete(a.id)} className="text-xs text-red-400/70 hover:text-red-400">Delete</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {formOpen && (
        <AssetForm initial={editing} onSubmit={handleSubmit} onClose={() => setFormOpen(false)} />
      )}
    </div>
  )
}
