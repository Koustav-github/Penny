# Assets Management — Design Spec

**Date:** 2026-06-03
**Status:** Approved (design)
**Sub-project 1 of:** Assets → Monthly income/expenses → Live rates (the latter two are separate specs)

## Goal

Let each user start with **zero assets** and manually enter their holdings (banks,
cash, crypto, stocks, gold, other). Entered data persists per-user in the database
and drives the dashboard: a total net worth in the user's chosen currency and a
pie/donut chart of distribution by category.

## Scope

**In scope**
- Per-user asset CRUD (create, read, update, delete) across six categories.
- Unified asset data model with category-specific fields.
- Authenticated API (verified Clerk JWT) — a user can only access their own data.
- Currency display preference (no conversion).
- Dashboard + Assets page wired to real data, including empty/start-at-zero states.
- SVG donut chart of distribution by category.

**Out of scope (later sub-projects / passes)**
- Live rate fetching for crypto/stocks/gold (values entered manually for now).
- FX conversion between currencies (changing currency only changes formatting).
- Monthly income/expense tracking, salary increments, month navigation.
- Change-over-time history and the dashboard "monthly change %" indicator (removed in v1).

## Decisions (from brainstorming)

- **Per-asset fields:** store **quantity + current value** for crypto/stock/gold
  (value typed manually now; later the rates API can compute `value = quantity × price`).
- **Auth:** verify the Clerk session JWT on every request; derive the user from it.
- **Categories:** `bank`, `cash`, `crypto`, `stock`, `gold`, `other` (catch-all).
- **Architecture:** frontend fetches FastAPI with the Clerk Bearer token (matches the
  existing `/users/sync` pattern); FastAPI + SQLAlchemy + Alembic remain the data layer.
- **Charting:** hand-rolled SVG donut, no chart-library dependency.
- **Change %:** dropped for v1 (needs history we don't store).

## Data model

Replace the existing bare `assets` table with a unified, extensible schema (one row
per holding):

```
assets
  id          INTEGER  PK
  user_id     INTEGER  FK → user.id (indexed, not null)
  category    STRING   one of: bank | cash | crypto | stock | gold | other
  name        STRING   e.g. "SBI", "Bitcoin", "Nifty 50"   (not null)
  subtype     STRING   bank only: "Savings"/"Current"      (nullable)
  quantity    FLOAT    crypto/stock/gold units             (nullable)
  value       FLOAT    current worth in the user's base currency (not null, ≥ 0)
  created_at  DATETIME server default now()
  updated_at  DATETIME server default now(), onupdate now()
```

User table gains a currency preference:

```
user
  ... existing columns ...
  currency    STRING  default 'INR'   (one of: INR, USD, EUR, GBP)
```

- **Migration:** an Alembic migration alters the existing `assets` table
  (`asset_type` → `category`, `balance` → `value`, add `subtype`, `quantity`,
  `updated_at`) and adds `user.currency`. (Project uses Alembic;
  `Base.metadata.create_all` is intentionally commented out.)
- **Totals are computed on the fly** by summing `value`. `user.net_asset` stops being
  a second source of truth — it is no longer read or written by this feature.

## Backend API (FastAPI)

All endpoints require authentication and are scoped to the current user.

### Auth dependency: `get_current_user`
- Reads `Authorization: Bearer <clerk_jwt>`.
- Verifies the JWT against Clerk's JWKS (signature, `exp`, `iss`), with the JWKS cached
  in-process. Adds `pyjwt[crypto]`.
- Extracts `sub` (clerk_id), looks up the `User`; **creates it on first sight** (folds in
  today's `/users/sync` behavior). Returns the `User`.
- Missing/invalid/expired token → `401`.

### Endpoints
| Method | Path | Purpose |
|---|---|---|
| GET | `/assets` | List the current user's assets |
| GET | `/assets/summary` | `{ total, currency, by_category: [{category, total, pct}] }` |
| POST | `/assets` | Create an asset |
| PATCH | `/assets/{id}` | Update an asset (ownership enforced) |
| DELETE | `/assets/{id}` | Delete an asset (ownership enforced) |
| GET | `/users/me` | Current user profile incl. `currency` |
| PATCH | `/users/me` | Update `currency` |

### Validation (Pydantic)
- `value ≥ 0`; `category` must be a valid enum value; `name` non-empty.
- `quantity` required when category ∈ {crypto, stock, gold}; ignored otherwise.
- `subtype` only meaningful for `bank`.
- Mutations on an asset not owned by the current user → `404` (don't reveal existence).

## Frontend (Next.js)

- **`src/lib/api.ts`** — typed fetch client injecting `getToken()` and reading
  `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`). Centralizes the currently
  hardcoded `localhost:8000` calls. Exposes typed `assets.list/summary/create/update/remove`
  and `users.me/updateCurrency`.
- **Assets page** (`/assets`) → client component:
  - Category summary cards (each shows total for that category, `0` when empty).
  - Allocation bar + list of assets with per-row **edit/delete**.
  - **Empty state** when the user has no assets ("No assets yet — add your first").
  - **Add/Edit Asset modal** (`AssetForm`) with a category picker; fields adapt:
    `subtype` shown for bank, `quantity` shown for crypto/stock/gold, `value` + `name`
    always. Submit disabled while saving.
- **Dashboard** (`DashboardClient`) → fetches `/assets/summary` + `/assets`:
  - Net worth total in chosen currency; **`CategoryDonut`** (SVG) of distribution.
  - Empty state (`₹0` / "Add assets to get started").
  - Hardcoded placeholder data and change % removed.
- **Currency selector** → `PATCH /users/me`; v1 list INR/USD/EUR/GBP.
- **`formatCurrency(value, currency)`** helper via `Intl.NumberFormat`.
- New components: `AssetForm`, `CategoryDonut`, currency selector.

## Error handling
- Backend: `401` (bad/missing token), `404` (asset not owned), `422` (validation).
- Frontend: loading states; error banners on fetch/mutation failure; refetch after each
  mutation; disable submit while in flight.

## Testing
- **Backend (TDD for logic):**
  - Auth dependency: valid token → user; invalid/expired/missing → 401; first-sight token
    creates the user.
  - CRUD **ownership isolation**: user A cannot read/update/delete user B's assets.
  - Validation rules (value ≥ 0, quantity-required-by-category, category enum).
  - `/assets/summary` math (totals and percentages, including the empty case → total 0).
- **Frontend:**
  - `AssetForm` shows the correct fields per category.
  - Empty state renders when there are no assets.

## Affected files (anticipated)
- Backend: `models.py`, `database.py` (none expected), `main.py` (or new routers
  `routers/assets.py`, `routers/users.py`), new `auth.py` (Clerk JWT dependency),
  `schemas.py`, a new Alembic migration, `requirements`/deps for `pyjwt[crypto]`, tests.
- Frontend: `src/lib/api.ts`, `src/app/assets/page.tsx`, `src/app/dashboard/DashboardClient.tsx`,
  new `src/components/AssetForm.tsx`, `src/components/CategoryDonut.tsx`, currency selector,
  `src/lib/format.ts`, tests.
```
