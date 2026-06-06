# Custom Asset Forms + Live Pricing — Design

**Date:** 2026-06-06
**Status:** Approved (pending written-spec review)

## Goal

Replace the single flat "add asset" form with **category-specific forms**, and make
crypto / stock / gold assets **auto-valued from live price APIs** in the user's selected
currency, recomputed on every read. Bank, cash, loan, and other stay manual.

## Decisions (from brainstorming)

- **Freshness:** live-on-read — store quantity + symbol, recompute value from current
  price + FX on each dashboard load, with short server-side caching. Stored `value`
  is kept as a last-known cache for resilience.
- **Providers:** Crypto → CoinGecko; Stocks → Twelve Data; Gold → GoldAPI.
- **Symbol entry:** searchable autocomplete that resolves to the exact API symbol.
- **Demat/associated bank:** a free-text label (string), no linkage to bank assets.
- **Gold:** quantity = grams (Sovereign Gold Bond units, 1g each).
- **Cash:** value only; `name` auto-set to "Cash".

## Per-category field map

| Category | User enters | Value source |
|---|---|---|
| Bank | name, account type (Savings/Current), value | manual |
| Cash | value (name auto = "Cash") | manual |
| Crypto | crypto (autocomplete → name+symbol), quantity | live (CoinGecko) |
| Stock | stock (autocomplete → name+symbol), demat label, quantity (shares) | live (Twelve Data + FX) |
| Gold | quantity (grams), demat label | live (GoldAPI + FX) |
| Loan | name, outstanding value, monthly EMI | manual |
| Other | source (name), amount (value) | manual |

## 1. Data model + migration

Add three nullable columns to `assets` (Alembic migration):

- `symbol: str | None` — API identifier (CoinGecko id, Twelve Data ticker). Null for
  non-priced categories and gold.
- `account: str | None` — free-text demat/associated-bank label (stock, gold).
- `priced_at: datetime | None` — last successful live-price timestamp.

`name` = display label; `quantity`, `value` reused. For auto categories `value` is a
**cached last-known** figure (recomputed on read, retained as fallback if the API fails).

Schema (`schemas.py`): `AssetBase` gains `symbol`, `account`, `priced_at` (out only).
Validation:
- crypto/stock → `symbol` required, `quantity` required.
- gold → `quantity` required (grams); `symbol` not used.
- stock/gold → `account` optional.
- crypto/stock/gold → client does **not** send `value`; server computes/caches it.

## 2. Pricing & search services (`server/services/pricing.py`)

Small, independently testable functions, one per provider:

- **Crypto (CoinGecko):**
  - Price: `GET /simple/price?ids={symbol}&vs_currencies={user_ccy}` → price already in
    the user's currency (no FX step). Batchable: one call for all crypto symbols.
  - Search: `GET /search?query={q}` → `[{id, name, symbol}]`.
- **Stocks (Twelve Data):**
  - Price: `GET /price?symbol={symbol}` → native currency; FX-convert to user currency.
  - Search: `GET /symbol_search?symbol={q}` → matches `[{symbol, name, exchange}]`.
- **Gold (GoldAPI):**
  - `GET /XAU/{user_ccy}` → price per troy ounce; ÷31.1035 → per gram;
    `value = grams × price_per_gram`.
- **FX:** extract the ExchangeRate-API call from `routers/rates.py` into a shared
  `get_fx_rate(base, target)` helper reused by both rates and pricing.

**Caching:** in-process TTL cache (~60s) keyed by `(provider, symbol, currency)`.
(Noted as a future Redis candidate in the scalability plan; in-process for now.)

**Env:** read the names actually in `.env`: `COIN_GECKO_API_KEY`, `TWELVE_DATA_API_KEY`.
**`GOLDAPI_KEY` must be added to `.env`** (currently only in `.env.example`); until then
gold pricing returns unavailable → manual/last-known fallback. Align `.env.example`
names with the real `.env` names.

**Search endpoints** (assets router, auth-protected):
`GET /assets/search/crypto?q=` and `GET /assets/search/stock?q=`, returning a small
normalized list for the autocomplete.

## 3. Live value computation on read

One helper `priced_value(asset, user_currency) -> (value, priced_at)`:

- manual categories → stored `value` unchanged.
- crypto/stock/gold → `quantity × current_price(symbol, user_ccy)`; on success write back
  cached `value` + `priced_at`; on API failure return last-known `value` (never error the
  dashboard).

Called in all read paths so values stay consistent:
- `GET /assets` (list)
- `GET /assets/summary` (`services/summaries.py: compute_asset_summary`)
- AI snapshot (`services/ai_reports.py: build_snapshot`, via `compute_asset_summary`).

Cost: up to N lookups per load, mostly cache hits; crypto batched into one call.

## 4. Frontend: custom per-category forms

`AssetForm.tsx` refactored into a category switch rendering only relevant fields:

- Bank / Cash / Loan / Other — plain inputs (cash = value only; other = source + amount).
- Crypto / Stock — `AssetSearch` subcomponent: debounced call to
  `/assets/search/{crypto|stock}`, pick a match → sets hidden `name` + `symbol`; then
  quantity (+ demat label for stock).
- Gold — quantity (grams) + demat label.

Auto-priced categories have **no manual value input**; instead a **live value preview**
("≈ ₹2,40,000 · live") once symbol + quantity are set. Real value is computed server-side.

New/changed pieces:
- `AssetSearch.tsx` — debounced autocomplete dropdown (crypto & stock).
- `lib/api.ts` — `searchCrypto(q)`, `searchStock(q)`; `AssetInput` gains `symbol`, `account`.
- `lib/assets.ts` — `Asset` gains `symbol`, `account`, `priced_at`; cards show demat label
  and "as of" hint.

**Error/empty states:** autocomplete shows "no matches"; an un-priceable saved symbol shows
last-known value with a subtle "stale" hint, never a hard error.

## 5. Testing

- `server/tests/test_assets.py` — extend for new schema validation (symbol required for
  crypto/stock, account optional, gold quantity).
- `server/tests/test_pricing.py` (new) — mock HTTP for CoinGecko / Twelve Data / GoldAPI /
  FX; cover success, FX conversion, gram conversion, and failure→last-known fallback.
- `client/.../AssetForm.test.tsx` — update for category branching; basic `AssetSearch` test.

## Out of scope (YAGNI)

- Background/periodic price refresh (live-on-read chosen).
- Redis caching (in-process TTL now; Redis is in the separate scalability plan).
- Historical price charts, P/L tracking, multiple lots per holding.
- Linking demat holdings to bank assets (free-text label chosen).

## Prerequisites / follow-ups

- Add `GOLDAPI_KEY` to `.env` for gold pricing.
- Reconcile `.env.example` key names with the real `.env` names.
