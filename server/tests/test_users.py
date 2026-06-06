from conftest import make_user, auth_as


def test_get_me(client, db):
    auth_as(make_user(db, email="me@x.com"))
    r = client.get("/users/me")
    assert r.status_code == 200
    assert r.json()["email"] == "me@x.com"
    assert r.json()["currency"] == "INR"
    assert r.json()["monthly_salary"] == 0


def test_update_currency_converts_amounts(client, db, monkeypatch):
    from services import pricing
    auth_as(make_user(db))
    client.post("/assets", json={"category": "cash", "name": "Wallet", "value": 1000})
    monkeypatch.setattr(pricing, "get_fx_rate", lambda base, target: 0.012)  # INR->USD
    r = client.patch("/users/me", json={"currency": "USD"})
    assert r.status_code == 200 and r.json()["currency"] == "USD"
    # the stored amount is re-denominated, not just relabelled
    assert client.get("/assets").json()[0]["value"] == 12.0


def test_currency_change_without_fx_is_rejected(client, db, monkeypatch):
    from services import pricing
    auth_as(make_user(db))
    monkeypatch.setattr(pricing, "get_fx_rate", lambda base, target: None)
    assert client.patch("/users/me", json={"currency": "USD"}).status_code == 502


def test_update_salary(client, db):
    auth_as(make_user(db))
    r = client.patch("/users/me", json={"monthly_salary": 50000})
    assert r.status_code == 200 and r.json()["monthly_salary"] == 50000
    # currency unchanged when omitted
    assert r.json()["currency"] == "INR"


def test_reject_bad_currency(client, db):
    auth_as(make_user(db))
    assert client.patch("/users/me", json={"currency": "XYZ"}).status_code == 422


def test_profile_round_trip_with_goal_terms(client, db):
    auth_as(make_user(db))
    r = client.put("/users/profile", json={
        "risk_appetite": "balanced",
        "monthly_savings_target": 10000,
        "time_horizon_years": 10,
        "dependents": 2,
        "goals": [
            {"text": "Emergency fund", "term": "short"},
            {"text": "Buy a house", "term": "long"},
        ],
    })
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["risk_appetite"] == "balanced"
    assert body["goals"] == [
        {"text": "Emergency fund", "term": "short"},
        {"text": "Buy a house", "term": "long"},
    ]
    assert body["ai_consent"] is False
    # persists, and goals survive an unrelated update
    client.patch("/users/me", json={"monthly_salary": 1000})
    assert client.get("/users/profile").json()["goals"][1]["term"] == "long"


def test_ai_consent_sets_flag(client, db):
    auth_as(make_user(db))
    assert client.get("/users/profile").json()["ai_consent"] is False
    r = client.post("/users/ai-consent")
    assert r.status_code == 200 and r.json()["ai_consent"] is True
