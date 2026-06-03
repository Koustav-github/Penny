from conftest import make_user, auth_as


def test_get_me(client, db):
    auth_as(make_user(db, email="me@x.com"))
    r = client.get("/users/me")
    assert r.status_code == 200
    assert r.json()["email"] == "me@x.com"
    assert r.json()["currency"] == "INR"
    assert r.json()["monthly_salary"] == 0


def test_update_currency(client, db):
    auth_as(make_user(db))
    r = client.patch("/users/me", json={"currency": "USD"})
    assert r.status_code == 200 and r.json()["currency"] == "USD"


def test_update_salary(client, db):
    auth_as(make_user(db))
    r = client.patch("/users/me", json={"monthly_salary": 50000})
    assert r.status_code == 200 and r.json()["monthly_salary"] == 50000
    # currency unchanged when omitted
    assert r.json()["currency"] == "INR"


def test_reject_bad_currency(client, db):
    auth_as(make_user(db))
    assert client.patch("/users/me", json={"currency": "XYZ"}).status_code == 422


def test_profile_round_trip_and_goals_capped(client, db):
    auth_as(make_user(db))
    r = client.put("/users/profile", json={
        "risk_appetite": "balanced",
        "monthly_savings_target": 10000,
        "time_horizon_years": 10,
        "dependents": 2,
        "goals": ["car", "house", "retire", "extra"],  # 4 -> capped to 3
    })
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["risk_appetite"] == "balanced"
    assert body["goals"] == ["car", "house", "retire"]
    assert body["ai_consent"] is False
    # persists
    assert client.get("/users/profile").json()["dependents"] == 2


def test_ai_consent_sets_flag(client, db):
    auth_as(make_user(db))
    assert client.get("/users/profile").json()["ai_consent"] is False
    r = client.post("/users/ai-consent")
    assert r.status_code == 200 and r.json()["ai_consent"] is True
