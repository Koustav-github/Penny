# AI Reports — LLM-Generated Financial Reports (v1) — Design

**Date:** 2026-06-04
**Status:** Approved (pending spec review)

## Problem

The AI Reports page currently generates rule-based ("heuristic") insights from a
local `buildInsights()` function. It is a shell with no real intelligence. We
want Penny to act as a financial assistant: given the user's tracked finances
plus a short profile, an LLM produces a report with a summary, where the user
overspent, where costs can be reduced, and how to grow savings and net worth.

## Decisions (locked)

- **Provider:** Groq (hosted Llama), via **LangChain** orchestration
  (`langchain-groq` `ChatGroq`). LangChain is chosen over a direct HTTP call so
  the RAG phase later slots in cleanly (retrievers/chains). Model:
  `llama-3.3-70b-versatile`.
- **Privacy:** the user's financial data is sent to Groq. v1 requires explicit
  **consent** and shows a **"not registered financial advice" disclaimer**.
- **Scope (v1):** core LLM report over existing data + a "fuller" profile.
  **No RAG, no location** in v1 (both are later phases).
- **Profile (fuller):** risk appetite (`conservative|balanced|aggressive`),
  1–3 free-text goals, monthly savings target, time horizon (years),
  dependents/family size.
- **Report format:** fixed sections returned as structured output —
  **Summary · Overspending · Where to cut costs · Ways to grow savings & net
  worth** — each with a short writeup + bullet points. Saved to history.
- The report uses **existing tracked data** (assets, expenses, salary, loans/
  EMIs, net worth). The user does not re-enter totals.

## Out of scope (later phases)

- RAG knowledge base (pgvector) of financial principles.
- Location-based lifestyle/cost-of-living benchmarking.
- Fine-tuning / training any model.
- Live market data (the Twelve Data / CoinGecko / GoldAPI / Finnhub keys stay
  unused).

## Architecture

Direct, single-call chain via LangChain. No new infra; Postgres + FastAPI as-is.

```
AI Reports page ──POST /reports/generate──▶ FastAPI
                                              │
                                  build financial snapshot
                                  (assets summary, expense summary,
                                   salary, loans/EMIs, net worth, profile)
                                              │
                                  ChatGroq.with_structured_output(ReportPayload)
                                              │  (prompt: system + snapshot)
                                              ▼
                                       parsed sections
                                              │
                                   save to `reports` table
                                              ▼
                              return ReportOut ──▶ render fixed sections + save history
```

## Backend

### Data model (`models.py`)
Extend `User` with profile fields:
- `risk_appetite` (String, nullable) — `conservative|balanced|aggressive`
- `monthly_savings_target` (Float, nullable)
- `time_horizon_years` (Integer, nullable)
- `dependents` (Integer, nullable)
- `goals` (JSON, nullable) — list of strings (1–3)
- `ai_consent_at` (DateTime, nullable) — set when the user accepts the notice

New `Report` model:
- `id` (PK), `user_id` (FK→user, indexed, cascade)
- `created_at` (DateTime, server default now)
- `report_type` (String) — `spending|networth|savings|investing`
- `period` (String) — the selected period label
- `model` (String) — the LLM model id used
- `sections` (JSON) — list of `{ key, title, body, bullets[] }`

### Schemas (`schemas.py`)
- `RiskAppetite(str, Enum)`.
- `ProfileIn` / `ProfileOut` — the profile fields above (goals: list[str], each
  validated for length; ≤ 3 items).
- `ReportSection { key: str, title: str, body: str, bullets: list[str] }`.
- `ReportPayload { sections: list[ReportSection] }` — the **LLM structured-output
  schema** (the four fixed sections, in order).
- `ReportOut { id, created_at, report_type, period, model, sections,
  disclaimer }`.
- `ReportGenerateIn { report_type: ReportType, period: str }`.

### LLM service (`services/ai_reports.py`)
- `build_snapshot(db, user) -> dict` — reuses the existing asset-summary and
  expense-summary computations (refactor those into shared helpers so the router
  and the service share one implementation), plus salary, loans/EMIs, net worth,
  and the profile.
- `generate(snapshot, report_type, period) -> ReportPayload`:
  - Lazily constructs `ChatGroq(model=..., api_key=GROQ_API_KEY)` and
    `.with_structured_output(ReportPayload)`.
  - System prompt: Penny's role, the user's currency, the requested report type,
    instruction to produce exactly the four sections, be specific and reference
    the real numbers, and **not** to fabricate data or give registered advice.
  - Human message: the JSON snapshot.
  - Returns the parsed `ReportPayload`.
- **Fallback:** on any LLM error/timeout (or missing `GROQ_API_KEY`), fall back
  to the existing heuristic insights mapped into the section shape, with a note
  that the AI engine was unavailable. The endpoint therefore never hard-fails.

### Routers
- `routers/users.py`:
  - `GET /users/profile` — returns `ProfileOut`.
  - `PUT /users/profile` — accepts `ProfileIn`, sets the profile fields. Does
    **not** touch consent.
  - `POST /users/ai-consent` — sets `ai_consent_at = now()`. This is the single,
    explicit consent mechanism.
- `routers/reports.py`:
  - `POST /reports/generate` — requires `ai_consent_at` to be set (else `412`
    with a clear "consent required" message); builds snapshot, calls the
    service, saves a `Report`, returns `ReportOut` (with the disclaimer string).
  - `GET /reports` — history, newest first.
- A light per-user rate limit on generate (e.g. in-process token bucket or a
  simple "max N per minute" check) to cap cost.

### Migration
One Alembic revision: add the six `user` profile/consent columns and create the
`reports` table. Additive only.

### Tests (`tests/test_reports.py`, extend `test_users.py`)
- Profile GET/PUT round-trip; goals length validation.
- `ai-consent` sets the timestamp; generate without consent is rejected.
- `POST /reports/generate` with the **Groq call mocked** returns parsed sections
  and persists a `Report`; `GET /reports` lists it.
- Fallback path: when the LLM call raises, the endpoint returns heuristic
  sections (still 200) rather than erroring.

### Dependencies
Add `langchain`, `langchain-core`, `langchain-groq` to `pyproject.toml`.
New env var `GROQ_API_KEY` (documented in `.env.example`).

## Frontend

### `lib`
- `lib/reports.ts` — `ReportType`, `ReportSection`, `Report`, `Profile`,
  `RiskAppetite`, labels.
- `lib/api.ts` — `getProfile`, `updateProfile`, `aiConsent`, `generateReport`,
  `listReports`.

### Profile form
On the AI Reports page: if the profile is incomplete, show a **"Set up your
profile"** panel (risk appetite select, up to 3 goal inputs, savings target,
time horizon, dependents) that saves via `PUT /users/profile`. Editable later.

### AI Reports page (`AIReportsClient.tsx`)
- Replace `buildInsights()` with `api.generateReport()`.
- **First generate** shows a consent modal (financial-data notice +
  not-registered-advice disclaimer); accepting calls `aiConsent()` then proceeds.
- Render the four fixed sections (title + body + bullets) instead of the current
  card grid. Keep the "analyzing" state (now a real request).
- "Past reports" lists `listReports()`; clicking one re-renders it (no
  re-billing).
- A persistent disclaimer line under generated reports.

## Error handling

- Missing `GROQ_API_KEY` or LLM error → heuristic fallback (200, flagged).
- No consent → 412 with a clear message; frontend opens the consent modal.
- Rate limit exceeded → 429 with a friendly message.
- Snapshot with no data → the LLM is still called but the prompt notes sparse
  data; frontend also nudges the user to add assets/expenses.

## Testing summary

Backend pytest with the Groq client mocked (no network in tests). Frontend:
typecheck/lint/build; a light test for the profile form's required-field gating.

## Rollout note

Adds columns + a table → run `alembic upgrade head`. Set `GROQ_API_KEY` in
`.env` before generating real reports; without it the page still works via the
heuristic fallback.
