export type Category = 'bank' | 'cash' | 'crypto' | 'stock' | 'gold' | 'other'

export interface Asset {
  id: number
  category: Category
  name: string
  subtype: string | null
  quantity: number | null
  value: number
  created_at: string
  updated_at: string
}

export interface CategorySummary { category: Category; total: number; pct: number }
export interface AssetSummary { total: number; currency: string; by_category: CategorySummary[] }

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'bank', label: 'Bank' },
  { value: 'cash', label: 'Cash' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'stock', label: 'Stocks' },
  { value: 'gold', label: 'Gold' },
  { value: 'other', label: 'Other' },
]

export const QUANTITY_CATEGORIES: Category[] = ['crypto', 'stock', 'gold']

export const CATEGORY_COLORS: Record<Category, string> = {
  bank: '#3b82f6',
  cash: '#a855f7',
  crypto: '#f97316',
  stock: '#10b981',
  gold: '#eab308',
  other: '#64748b',
}
