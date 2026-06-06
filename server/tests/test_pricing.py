import pytest

from services import pricing
import models


class FakeResp:
    def __init__(self, payload, status=200):
        self._payload = payload
        self.status_code = status

    def json(self):
        return self._payload


@pytest.fixture(autouse=True)
def _clear_cache():
    pricing._cache.clear()
    yield
    pricing._cache.clear()


def test_crypto_price_in_user_currency(monkeypatch):
    monkeypatch.setenv("COIN_GECKO_API_KEY", "x")
    monkeypatch.setattr(pricing, "_get", lambda url, **kw: FakeResp({"bitcoin": {"inr": 5_000_000.0}}))
    out = pricing.get_crypto_prices(["bitcoin"], "INR")
    assert out["bitcoin"] == 5_000_000.0


def test_stock_price_fx_converted(monkeypatch):
    monkeypatch.setenv("TWELVE_DATA_API_KEY", "x")
    monkeypatch.setenv("EXCHANGE_RATES_API_KEY", "x")

    def fake_get(url, **kw):
        if "quote" in url:
            return FakeResp({"close": "100", "currency": "USD"})
        if "pair" in url:
            return FakeResp({"result": "success", "conversion_rate": 83.0})
        raise AssertionError(url)

    monkeypatch.setattr(pricing, "_get", fake_get)
    assert pricing.get_stock_price("AAPL", "INR") == pytest.approx(8300.0)


def test_gold_per_gram(monkeypatch):
    monkeypatch.setenv("GOLDAPI_KEY", "x")
    monkeypatch.setattr(pricing, "_get", lambda url, **kw: FakeResp({"price_gram_24k": 6500.0}))
    assert pricing.get_gold_price_per_gram("INR") == 6500.0


def test_gold_missing_key_returns_none(monkeypatch):
    monkeypatch.delenv("GOLDAPI_KEY", raising=False)
    assert pricing.get_gold_price_per_gram("INR") is None


def test_price_assets_updates_then_falls_back(monkeypatch, db):
    user = models.User(clerk_id="p", email="p@x.com", currency="INR")
    db.add(user)
    db.commit()
    db.refresh(user)
    asset = models.Assets(
        user_id=user.id, category="crypto", name="Bitcoin", symbol="bitcoin", quantity=2, value=0.0
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)

    monkeypatch.setattr(pricing, "get_crypto_prices", lambda ids, cur: {"bitcoin": 100.0})
    pricing.price_assets(db, user, [asset])
    assert asset.value == 200.0 and asset.priced_at is not None

    # API now returns nothing -> keep the last-known value
    monkeypatch.setattr(pricing, "get_crypto_prices", lambda ids, cur: {})
    pricing.price_assets(db, user, [asset])
    assert asset.value == 200.0
