from datetime import date

from conftest import make_user, auth_as


def _today_iso():
    return date.today().isoformat()


def test_create_and_list_expense(client, db):
    user = make_user(db)
    auth_as(user)
    resp = client.post("/expenses", json={
        "category": "food", "name": "Swiggy", "amount": 340,
        "spent_on": _today_iso(), "note": "Dinner",
    })
    assert resp.status_code == 201, resp.text
    assert resp.json()["name"] == "Swiggy"

    listed = client.get("/expenses")
    assert listed.status_code == 200
    assert len(listed.json()) == 1


def test_invalid_category_rejected(client, db):
    auth_as(make_user(db))
    resp = client.post("/expenses", json={
        "category": "nonsense", "name": "X", "amount": 10, "spent_on": _today_iso(),
    })
    assert resp.status_code == 422


def test_cannot_touch_another_users_expense(client, db):
    a = make_user(db, clerk_id="a", email="a@x.com")
    b = make_user(db, clerk_id="b", email="b@x.com")
    auth_as(a)
    created = client.post("/expenses", json={
        "category": "transport", "name": "Uber", "amount": 185, "spent_on": _today_iso(),
    }).json()

    auth_as(b)
    assert client.patch(f"/expenses/{created['id']}", json={
        "category": "transport", "name": "Hacked", "amount": 0, "spent_on": _today_iso(),
    }).status_code == 404
    assert client.delete(f"/expenses/{created['id']}").status_code == 404
    assert client.get("/expenses").json() == []


def test_update_and_delete(client, db):
    auth_as(make_user(db))
    created = client.post("/expenses", json={
        "category": "food", "name": "Zomato", "amount": 275, "spent_on": _today_iso(),
    }).json()
    upd = client.patch(f"/expenses/{created['id']}", json={
        "category": "food", "name": "Zomato", "amount": 300, "spent_on": _today_iso(),
    })
    assert upd.status_code == 200 and upd.json()["amount"] == 300
    assert client.delete(f"/expenses/{created['id']}").status_code == 204
    assert client.get("/expenses").json() == []


def test_summary_month_total_and_categories(client, db):
    auth_as(make_user(db))
    client.post("/expenses", json={"category": "food", "name": "Swiggy", "amount": 300, "spent_on": _today_iso()})
    client.post("/expenses", json={"category": "transport", "name": "Uber", "amount": 100, "spent_on": _today_iso()})
    s = client.get("/expenses/summary").json()
    assert s["total"] == 400
    assert s["currency"] == "INR"
    assert s["count"] == 2
    by = {c["category"]: c for c in s["by_category"]}
    assert by["food"]["total"] == 300 and by["food"]["pct"] == 75.0
    assert by["transport"]["pct"] == 25.0
    # monthly always returns 6 months, current month last
    assert len(s["monthly"]) == 6
    assert s["monthly"][-1]["total"] == 400


def test_summary_empty_is_zero(client, db):
    auth_as(make_user(db))
    s = client.get("/expenses/summary").json()
    assert s["total"] == 0 and s["by_category"] == []
    assert len(s["monthly"]) == 6
    assert all(m["total"] == 0 for m in s["monthly"])
