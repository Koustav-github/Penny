'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { api, type SymbolHit } from '@/lib/api'

interface Props {
  kind: 'crypto' | 'stock'
  label: string
  /** Display name of the currently selected symbol (for edit mode). */
  selectedName?: string
  onSelect: (hit: SymbolHit) => void
  placeholder?: string
}

/** Debounced symbol autocomplete for crypto (CoinGecko) and stocks (Twelve Data). */
export default function AssetSearch({ kind, label, selectedName = '', onSelect, placeholder }: Props) {
  const { getToken } = useAuth()
  const [q, setQ] = useState(selectedName)
  const [hits, setHits] = useState<SymbolHit[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const term = q.trim()
    if (term.length < 2) { setHits([]); return }
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const fn = kind === 'crypto' ? api.searchCrypto : api.searchStock
        setHits(await fn(getToken, term))
      } catch {
        setHits([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [q, kind, open, getToken])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div className="flex flex-col gap-1.5" ref={boxRef}>
      <span className="text-[13px] text-muted">{label}</span>
      <div className="relative">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full rounded-xl bg-surface-2 border border-border px-3 py-2.5 text-sm text-ink placeholder:text-faint outline-none focus:border-accent/60"
        />
        {open && q.trim().length >= 2 && (
          <div className="absolute z-10 mt-1 w-full max-h-56 overflow-auto rounded-xl bg-surface border border-border-strong shadow-[var(--shadow)]">
            {loading ? (
              <p className="px-3 py-2 text-xs text-faint">Searching…</p>
            ) : hits.length === 0 ? (
              <p className="px-3 py-2 text-xs text-faint">No matches</p>
            ) : (
              hits.map((h) => (
                <button
                  type="button"
                  key={`${h.symbol}-${h.exchange ?? ''}`}
                  onClick={() => { onSelect(h); setQ(h.name); setOpen(false) }}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-surface-2"
                >
                  <span className="text-sm text-ink truncate">{h.name}</span>
                  <span className="text-[11px] text-faint shrink-0">{h.exchange || h.symbol}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
