import type { Asset, AssetSummary, Category } from './assets'
import type { Expense, ExpenseCategory, ExpenseSummary } from './expenses'
import type { Profile, ProfileInput, Report, ReportType } from './reports'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

type TokenGetter = () => Promise<string | null>

export interface AssetInput {
  category: Category
  name: string
  subtype?: string | null
  quantity?: number | null
  value: number
  emi?: number | null
}

export interface Me {
  id: number
  email: string
  currency: string
  monthly_salary: number
}

export interface ExpenseInput {
  category: ExpenseCategory
  name: string
  amount: number
  spent_on: string // ISO "YYYY-MM-DD"
  note?: string | null
}

async function req<T>(getToken: TokenGetter, path: string, init?: RequestInit): Promise<T> {
  const token = await getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`API ${res.status}: ${body}`)
  }
  return (res.status === 204 ? (undefined as T) : await res.json()) as T
}

export const api = {
  listAssets: (g: TokenGetter) => req<Asset[]>(g, '/assets'),
  summary: (g: TokenGetter) => req<AssetSummary>(g, '/assets/summary'),
  createAsset: (g: TokenGetter, body: AssetInput) =>
    req<Asset>(g, '/assets', { method: 'POST', body: JSON.stringify(body) }),
  updateAsset: (g: TokenGetter, id: number, body: AssetInput) =>
    req<Asset>(g, `/assets/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteAsset: (g: TokenGetter, id: number) =>
    req<void>(g, `/assets/${id}`, { method: 'DELETE' }),
  listExpenses: (g: TokenGetter) => req<Expense[]>(g, '/expenses'),
  expenseSummary: (g: TokenGetter) => req<ExpenseSummary>(g, '/expenses/summary'),
  createExpense: (g: TokenGetter, body: ExpenseInput) =>
    req<Expense>(g, '/expenses', { method: 'POST', body: JSON.stringify(body) }),
  updateExpense: (g: TokenGetter, id: number, body: ExpenseInput) =>
    req<Expense>(g, `/expenses/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteExpense: (g: TokenGetter, id: number) =>
    req<void>(g, `/expenses/${id}`, { method: 'DELETE' }),
  me: (g: TokenGetter) => req<Me>(g, '/users/me'),
  updateCurrency: (g: TokenGetter, currency: string) =>
    req<Me>(g, '/users/me', { method: 'PATCH', body: JSON.stringify({ currency }) }),
  updateSalary: (g: TokenGetter, monthly_salary: number) =>
    req<Me>(g, '/users/me', { method: 'PATCH', body: JSON.stringify({ monthly_salary }) }),
  getProfile: (g: TokenGetter) => req<Profile>(g, '/users/profile'),
  updateProfile: (g: TokenGetter, body: ProfileInput) =>
    req<Profile>(g, '/users/profile', { method: 'PUT', body: JSON.stringify(body) }),
  aiConsent: (g: TokenGetter) => req<Profile>(g, '/users/ai-consent', { method: 'POST' }),
  generateReport: (g: TokenGetter, body: { report_type: ReportType; period: string }) =>
    req<Report>(g, '/reports/generate', { method: 'POST', body: JSON.stringify(body) }),
  listReports: (g: TokenGetter) => req<Report[]>(g, '/reports'),
}
