"""Live pricing for crypto/stock/gold assets, plus symbol search.

Prices come from CoinGecko (crypto), Twelve Data (stocks) and GoldAPI (gold),
are converted to the user's currency, and cached briefly in-process. Every
function degrades gracefully: on any failure it returns ``None`` / leaves values
untouched, so callers fall back to the last-known stored value and the dashboard
never errors.
"""
import logging
import os
import time
from datetime import datetime, timezone
from typing import Optional

import httpx
from sqlalchemy.orm import Session

import models
import schemas

logger = logging.getLogger(__name__)

COINGECKO_BASE = "https://api.coingecko.com/api/v3"
TWELVEDATA_BASE = "https://api.twelvedata.com"
EXCHANGERATE_BASE = "https://v6.exchangerate-api.com/v6"

GRAMS_PER_TROY_OUNCE = 31.1034768
CACHE_TTL_SECONDS = 60

# key -> (value, expires_at_epoch)
_cache: dict[str, tuple[float, float]] = {}


def _cache_get(key: str) -> Optional[float]:
    hit = _cache.get(key)
    if hit and hit[1] > time.time():
        return hit[0]
    return None


def _cache_set(key: str, value: float) -> None:
    _cache[key] = (value, time.time() + CACHE_TTL_SECONDS)


def _get(url: str, **kwargs) -> httpx.Response:
    with httpx.Client(timeout=10) as client:
        return client.get(url, **kwargs)


# --------------------------------------------------------------------------- FX

def get_fx_rate(base: str, target: str) -> Optional[float]:
    """Conversion rate base -> target via ExchangeRate-API (cached). None on failure."""
    base, target = base.upper(), target.upper()
    if base == target:
        return 1.0
    key = f"fx:{base}:{target}"
    cached = _cache_get(key)
    if cached is not None:
        return cached
    api_key = os.getenv("EXCHANGE_RATES_API_KEY")
    if not api_key:
        return None
    try:
        r = _get(
            f"{EXCHANGERATE_BASE}/pair/{base}/{target}",
            headers={"Authorization": f"Bearer {api_key}"},
        )
        data = r.json()
        if r.status_code == 200 and data.get("result") == "success":
            rate = float(data["conversion_rate"])
            _cache_set(key, rate)
            return rate
    except Exception as exc:  # noqa: BLE001
        logger.warning("FX %s->%s failed: %s", base, target, exc)
    return None


# ------------------------------------------------------------------------ Crypto

def _coingecko_headers() -> dict[str, str]:
    api_key = os.getenv("COIN_GECKO_API_KEY")
    return {"x-cg-demo-api-key": api_key} if api_key else {}


def get_crypto_prices(ids: list[str], currency: str) -> dict[str, float]:
    """Batch price lookup. Returns {coin_id: price_in_currency} for what resolved."""
    currency = currency.lower()
    out: dict[str, float] = {}
    missing: list[str] = []
    for cid in ids:
        c = _cache_get(f"cg:{cid}:{currency}")
        if c is not None:
            out[cid] = c
        else:
            missing.append(cid)
    if not missing:
        return out
    try:
        r = _get(
            f"{COINGECKO_BASE}/simple/price",
            params={"ids": ",".join(missing), "vs_currencies": currency},
            headers=_coingecko_headers(),
        )
        if r.status_code == 200:
            data = r.json()
            for cid in missing:
                price = data.get(cid, {}).get(currency)
                if price is not None:
                    out[cid] = float(price)
                    _cache_set(f"cg:{cid}:{currency}", float(price))
    except Exception as exc:  # noqa: BLE001
        logger.warning("CoinGecko price failed: %s", exc)
    return out


def search_crypto(q: str) -> list[schemas.SymbolHit]:
    if not q.strip():
        return []
    try:
        r = _get(f"{COINGECKO_BASE}/search", params={"query": q}, headers=_coingecko_headers())
        if r.status_code != 200:
            return []
        coins = r.json().get("coins", [])[:10]
        return [
            schemas.SymbolHit(
                symbol=c["id"], name=c["name"], exchange=(c.get("symbol") or "").upper()
            )
            for c in coins
        ]
    except Exception as exc:  # noqa: BLE001
        logger.warning("CoinGecko search failed: %s", exc)
        return []


# ------------------------------------------------------------------------- Stock

def get_stock_price(symbol: str, currency: str) -> Optional[float]:
    """Latest stock price converted to the user's currency. None on failure."""
    key = f"td:{symbol}:{currency.upper()}"
    cached = _cache_get(key)
    if cached is not None:
        return cached
    api_key = os.getenv("TWELVE_DATA_API_KEY")
    if not api_key:
        return None
    try:
        r = _get(f"{TWELVEDATA_BASE}/quote", params={"symbol": symbol, "apikey": api_key})
        data = r.json()
        raw = data.get("close") or data.get("price")
        if raw is None:
            return None
        price = float(raw)
        native = (data.get("currency") or "").upper()
        if native and native != currency.upper():
            fx = get_fx_rate(native, currency)
            if fx is None:
                return None
            price *= fx
        _cache_set(key, price)
        return price
    except Exception as exc:  # noqa: BLE001
        logger.warning("TwelveData price for %s failed: %s", symbol, exc)
        return None


def search_stock(q: str) -> list[schemas.SymbolHit]:
    if not q.strip():
        return []
    api_key = os.getenv("TWELVE_DATA_API_KEY")
    if not api_key:
        return []
    try:
        r = _get(f"{TWELVEDATA_BASE}/symbol_search", params={"symbol": q, "apikey": api_key})
        if r.status_code != 200:
            return []
        rows = r.json().get("data", [])[:10]
        return [
            schemas.SymbolHit(
                symbol=s["symbol"],
                name=s.get("instrument_name", s["symbol"]),
                exchange=s.get("exchange"),
            )
            for s in rows
        ]
    except Exception as exc:  # noqa: BLE001
        logger.warning("TwelveData search failed: %s", exc)
        return []


# -------------------------------------------------------------------------- Gold

def get_gold_price_per_gram(currency: str) -> Optional[float]:
    """Gold price per gram in the user's currency via Twelve Data's XAU/USD spot
    pair (per troy ounce, USD) -> per gram -> FX. None on failure/missing key."""
    key = f"gold:{currency.upper()}"
    cached = _cache_get(key)
    if cached is not None:
        return cached
    api_key = os.getenv("TWELVE_DATA_API_KEY")
    if not api_key:
        return None
    try:
        r = _get(f"{TWELVEDATA_BASE}/price", params={"symbol": "XAU/USD", "apikey": api_key})
        raw = r.json().get("price")
        if raw is None:
            return None
        per_gram_usd = float(raw) / GRAMS_PER_TROY_OUNCE
        if currency.upper() == "USD":
            per_gram = per_gram_usd
        else:
            fx = get_fx_rate("USD", currency)
            if fx is None:
                return None
            per_gram = per_gram_usd * fx
        _cache_set(key, per_gram)
        return per_gram
    except Exception as exc:  # noqa: BLE001
        logger.warning("Twelve Data gold (XAU/USD) failed: %s", exc)
        return None


# ------------------------------------------------------------- apply to assets

def price_assets(db: Session, user: models.User, assets: list[models.Assets]) -> None:
    """Recompute value (and priced_at) in place for crypto/stock/gold assets,
    persisting the refreshed cache. Manual assets are untouched. Never raises."""
    currency = user.currency or "INR"
    now = datetime.now(timezone.utc)
    changed = False

    crypto = [a for a in assets if a.category == "crypto" and a.symbol]
    if crypto:
        prices = get_crypto_prices([a.symbol for a in crypto], currency)
        for a in crypto:
            p = prices.get(a.symbol)
            if p is not None:
                a.value = round((a.quantity or 0.0) * p, 2)
                a.priced_at = now
                changed = True

    for a in (a for a in assets if a.category == "stock" and a.symbol):
        p = get_stock_price(a.symbol, currency)
        if p is not None:
            a.value = round((a.quantity or 0.0) * p, 2)
            a.priced_at = now
            changed = True

    gold = [a for a in assets if a.category == "gold"]
    if gold:
        per_gram = get_gold_price_per_gram(currency)
        if per_gram is not None:
            for a in gold:
                a.value = round((a.quantity or 0.0) * per_gram, 2)
                a.priced_at = now
                changed = True

    if changed:
        try:
            db.commit()
        except Exception as exc:  # noqa: BLE001
            logger.warning("Persisting priced values failed: %s", exc)
            db.rollback()
