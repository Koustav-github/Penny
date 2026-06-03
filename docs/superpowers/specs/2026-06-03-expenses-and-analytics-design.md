# Real Expenses + Data-Driven Analytics — Design

**Date:** 2026-06-03
**Status:** Approved

## Problem

The Expenses and Analytics pages render hardcoded placeholder data. They must
instead reflect real, per-user data the user enters — consistent with how Assets
already works.

## Decisions

- **Expenses**: full CRUD (add/edit/delete) via a modal form, mirroring the
  Assets feature end-to-end.
- **Categories**: fixed set — food, transport, groceries, subscriptions,
  utilities, shopping, health, entertainment, other. Enables color-coding and
  category analytics.
- **Net Worth Growth chart**: removed for now. We store only current asset
  values, not historical snapshots, so a net-worth time series cannot be
  computed truthfully. Replaced by a current net-worth KPI tile. (A snapshot
  system is a possible future sub-project.)
- Everything displayed on both pages is derived from real data. New users see
  empty states, not broken charts.

## Backend

Mirrors `routers/assets.py` / `models.Assets` / asset schemas.

### Model (`models.py`)
`Expense`:
- `id` (PK)
- `user_id` (FK → user.id, indexed, cascade delete via `User.expenses`)
- `category` (str) — one of the fixed set
- `name` (str) — e.g. "Swiggy"
- `amount` (Float)
- `spent_on` (Date)
- `note` (str, nullable)
- `created_at` (DateTime, server default now)

`User.expenses = relationship(... cascade="all, delete-orphan")`.

### Schemas (`schemas.py`)
- `ExpenseCategory(str, Enum)` — the nine categories.
- `ExpenseBase` (category, name, amount ≥ 0, spent_on, note optional),
  `ExpenseCreate`, `ExpenseUpdate`, `ExpenseOut` (+ id, created_at).
- `ExpenseCategorySummary` (category, total, pct).
- `MonthlySpend` (month: "YYYY-MM", total).
- `ExpenseSummary` (total, currency, count, by_category[], monthly[]).

### Router (`routers/expenses.py`)
- `GET /expenses` — list newest first (by `spent_on` desc, then id desc).
- `POST /expenses` — create.
- `PATCH /expenses/{id}` — update (ownership-checked).
- `DELETE /expenses/{id}` — delete (ownership-checked).
- `GET /expenses/summary` — single call returning current-calendar-month
  `total`, `count`, `by_category[]`, plus `monthly[]` (last 6 months, oldest
  first, zero-filled). `currency` echoes `user.currency`.

Ownership helper `_owned` mirrors the assets router. Registered in `main.py`.

### Migration
New Alembic revision: `create_table("expenses", ...)` + index on `user_id`.
Additive only — no changes to existing tables. `down_revision` = current head
(`95fe626bccef`).

### Tests (`tests/test_expenses.py`)
Mirror `test_assets.py`: create, list, update, delete, ownership (404 on
another user's expense), and summary (month total + by_category + monthly).

## Frontend

### `lib/expenses.ts`
`ExpenseCategory` type, `Expense` interface, `EXPENSE_CATEGORIES` list,
`EXPENSE_CATEGORY_COLORS` (the existing mockup palette), and summary types
(`ExpenseCategorySummary`, `MonthlySpend`, `ExpenseSummary`).

### `lib/api.ts`
Add `ExpenseInput` and methods: `listExpenses`, `expenseSummary`,
`createExpense`, `updateExpense`, `deleteExpense`.

### `components/ExpenseForm.tsx`
Modal mirroring `AssetForm`: fields name, category (select), amount, date
(`spent_on`, default today), note (optional). Handles create + edit.

### Expenses page
- `app/expenses/page.tsx` → thin server wrapper (auth guard + sidebar + header)
  rendering `<ExpensesClient />`.
- `app/expenses/ExpensesClient.tsx` — fetches `listExpenses` + `expenseSummary`.
  Renders "This Month" total + transaction count, top categories bars,
  transaction list with edit/delete, "Log Expense" → form. Empty state when no
  expenses.

### Analytics page
- `app/analytics/page.tsx` → server wrapper rendering `<AnalyticsClient />`.
- `app/analytics/AnalyticsClient.tsx` — fetches `/assets/summary` +
  `/expenses/summary`. Renders:
  - KPIs: current net worth, this-month spend, avg monthly spend.
  - Asset Allocation (real, from asset summary by_category).
  - Monthly Spending chart (real, from `monthly[]`).
  - Spending by Category (real, from `by_category[]`).
  - Net Worth Growth chart removed.
  Empty states where data is missing.

## Out of Scope

- Net-worth historical snapshots / growth chart.
- Recurring expenses, budgets, income tracking.
- Currency conversion of expenses (amounts assumed already in user currency,
  same assumption as assets).
