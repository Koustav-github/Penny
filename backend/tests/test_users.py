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
