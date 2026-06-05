export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'groceries'
  | 'subscriptions'
  | 'utilities'
  | 'shopping'
  | 'health'
  | 'entertainment'
  | 'other'

export interface Expense {
  id: number
  category: ExpenseCategory
  name: string
  amount: number
  spent_on: string // ISO date "YYYY-MM-DD"
  note: string | null
  created_at: string
}

export interface ExpenseCategorySummary {
  category: ExpenseCategory
  total: number
  pct: number
}

export interface MonthlySpend {
  month: string // "YYYY-MM"
  total: number
}

export interface ExpenseSummary {
  total: number
  currency: string
  count: number
  by_category: ExpenseCategorySummary[]
  monthly: MonthlySpend[]
}

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'food', label: 'Food' },
  { value: 'transport', label: 'Transport' },
  { value: 'groceries', label: 'Groceries' },
  { value: 'subscriptions', label: 'Subscriptions' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'health', label: 'Health' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'other', label: 'Other' },
]

export function categoryLabel(category: ExpenseCategory): string {
  return EXPENSE_CATEGORIES.find((c) => c.value === category)?.label ?? category
}

// Tailwind pill classes, reused from the original mockup palette.
export const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  food: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  transport: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  groceries: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  subscriptions: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  utilities: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  shopping: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  health: 'bg-red-500/10 text-red-400 border-red-500/20',
  entertainment: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  other: 'bg-white/10 text-white/50 border-white/10',
}

/** "2026-04" -> "Apr" */
export function monthShortLabel(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'short' })
}

/** ISO date "2026-04-01" -> "Apr 1, 2026" */
export function formatExpenseDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
