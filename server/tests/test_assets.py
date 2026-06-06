from conftest import make_user, auth_as


def test_create_and_list_asset(client, db):
    user = make_user(db)
    auth_as(user)
    resp = client.post("/assets", json={
        "category": "bank", "name": "SBI", "subtype": "Savings", "value": 5000,
    })
    assert resp.status_code == 201, resp.text
    assert resp.json()["name"] == "SBI"

    listed = client.get("/assets")
    assert listed.status_code == 200
    assert len(listed.json()) == 1


def test_quantity_required_for_crypto(client, db):
    auth_as(make_user(db))
    resp = client.post("/assets", json={"category": "crypto", "name": "BTC", "value": 100})
    assert resp.status_code == 422


def test_symbol_required_for_crypto_and_stock(client, db):
    auth_as(make_user(db))
    # quantity present but no symbol -> rejected
    assert client.post("/assets", json={
        "category": "crypto", "name": "Bitcoin", "quantity": 1,
    }).status_code == 422
    assert client.post("/assets", json={
        "category": "stock", "name": "Reliance", "quantity": 10,
    }).status_code == 422


def test_gold_requires_quantity(client, db):
    auth_as(make_user(db))
    assert client.post("/assets", json={
        "category": "gold", "name": "Gold", "account": "Zerodha",
    }).status_code == 422


def test_cash_is_auto_named(client, db):
    auth_as(make_user(db))
    resp = client.post("/assets", json={"category": "cash", "value": 500})
    assert resp.status_code == 201, resp.text
    assert resp.json()["name"] == "Cash"


def test_cannot_touch_another_users_asset(client, db):
    a = make_user(db, clerk_id="a", email="a@x.com")
    b = make_user(db, clerk_id="b", email="b@x.com")
    auth_as(a)
    created = client.post("/assets", json={"category": "cash", "name": "Wallet", "value": 50}).json()

    auth_as(b)
    assert client.patch(f"/assets/{created['id']}", json={
        "category": "cash", "name": "Hacked", "value": 0,
    }).status_code == 404
    assert client.delete(f"/assets/{created['id']}").status_code == 404
    assert client.get("/assets").json() == []


def test_update_and_delete(client, db):
    auth_as(make_user(db))
    created = client.post("/assets", json={"category": "cash", "name": "Wallet", "value": 50}).json()
    upd = client.patch(f"/assets/{created['id']}", json={
        "category": "cash", "name": "Wallet", "value": 75,
    })
    assert upd.status_code == 200 and upd.json()["value"] == 75
    assert client.delete(f"/assets/{created['id']}").status_code == 204
    assert client.get("/assets").json() == []


def test_summary_totals_and_pct(client, db):
    auth_as(make_user(db))
    client.post("/assets", json={"category": "cash", "name": "Wallet", "value": 75})
    client.post("/assets", json={"category": "bank", "name": "SBI", "subtype": "Savings", "value": 25})
    s = client.get("/assets/summary").json()
    assert s["total"] == 100
    assert s["currency"] == "INR"
    by = {c["category"]: c for c in s["by_category"]}
    assert by["cash"]["total"] == 75 and by["cash"]["pct"] == 75.0
    assert by["bank"]["pct"] == 25.0


def test_loan_requires_emi(client, db):
    auth_as(make_user(db))
    # loan without emi is rejected
    assert client.post("/assets", json={"category": "loan", "name": "Car loan", "value": 300000}).status_code == 422
    # with emi it succeeds
    ok = client.post("/assets", json={"category": "loan", "name": "Car loan", "value": 300000, "emi": 8000})
    assert ok.status_code == 201 and ok.json()["emi"] == 8000


def test_loans_excluded_from_total_and_reported_as_emi(client, db):
    auth_as(make_user(db))
    client.post("/assets", json={"category": "cash", "name": "Wallet", "value": 1000})
    client.post("/assets", json={"category": "loan", "name": "Car loan", "value": 300000, "emi": 8000})
    s = client.get("/assets/summary").json()
    # loan principal not counted in asset total or allocation
    assert s["total"] == 1000
    assert s["emi_total"] == 8000
    assert all(c["category"] != "loan" for c in s["by_category"])


def test_summary_empty_is_zero(client, db):
    auth_as(make_user(db))
    s = client.get("/assets/summary").json()
    assert s["total"] == 0 and s["by_category"] == []
    assert s["emi_total"] == 0
