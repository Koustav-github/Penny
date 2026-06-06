export type Category = 'bank' | 'cash' | 'crypto' | 'stock' | 'gold' | 'loan' | 'other'

export interface Asset {
  id: number
  category: Category
  name: string
  subtype: string | null
  symbol: string | null
  account: string | null
  quantity: number | null
  value: number
  emi: number | null
  priced_at: string | null
  created_at: string
  updated_at: string
}

export interface CategorySummary { category: Category; total: number; pct: number }
export interface AssetSummary {
  total: number
  currency: string
  by_category: CategorySummary[]
  emi_total: number
}

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'bank', label: 'Bank' },
  { value: 'cash', label: 'Cash' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'stock', label: 'Stocks' },
  { value: 'gold', label: 'Gold' },
  { value: 'loan', label: 'Loan' },
  { value: 'other', label: 'Other' },
]

export const QUANTITY_CATEGORIES: Category[] = ['crypto', 'stock', 'gold']
// Categories whose value is computed live from a price API (no manual value).
export const AUTO_CATEGORIES: Category[] = ['crypto', 'stock', 'gold']
// Categories picked via symbol autocomplete (resolve to an exact API symbol).
export const SYMBOL_CATEGORIES: Category[] = ['crypto', 'stock']

export const CATEGORY_COLORS: Record<Category, string> = {
  bank: '#3b82f6',
  cash: '#a855f7',
  crypto: '#f97316',
  stock: '#10b981',
  gold: '#eab308',
  loan: '#ef4444',
  other: '#64748b',
}
