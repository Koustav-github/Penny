import schemas
import services.ai_reports as ai
from conftest import make_user, auth_as


def _consent(client):
    assert client.post("/users/ai-consent").status_code == 200


def test_generate_requires_consent(client, db):
    auth_as(make_user(db))
    r = client.post("/reports/generate", json={"report_type": "spending", "period": "This month"})
    assert r.status_code == 412


def test_generate_uses_heuristic_without_key(client, db, monkeypatch):
    # No GROQ_API_KEY in the test env → service falls back to heuristics.
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    auth_as(make_user(db))
    _consent(client)
    client.post("/assets", json={"category": "cash", "name": "Wallet", "value": 5000})
    client.post("/expenses", json={"category": "food", "name": "Swiggy", "amount": 400, "spent_on": "2026-06-04"})

    r = client.post("/reports/generate", json={"report_type": "spending", "period": "This month"})
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["model"] == "heuristic"
    assert [s["key"] for s in body["sections"]] == ["summary", "overspending", "cut_costs", "grow_savings"]
    assert body["disclaimer"]

    # saved to history
    hist = client.get("/reports").json()
    assert len(hist) == 1 and hist[0]["id"] == body["id"]


def test_generate_uses_llm_when_available(client, db, monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "test-key")

    def fake_llm(snapshot, report_type):
        return schemas.ReportPayload(sections=[
            schemas.ReportSection(key="summary", title="Summary", body="ok", bullets=["a"]),
            schemas.ReportSection(key="overspending", title="Where you overspent", body="ok", bullets=[]),
            schemas.ReportSection(key="cut_costs", title="Where to cut costs", body="ok", bullets=[]),
            schemas.ReportSection(key="grow_savings", title="Grow", body="ok", bullets=[]),
        ])

    monkeypatch.setattr(ai, "_generate_with_llm", fake_llm)
    auth_as(make_user(db))
    _consent(client)
    r = client.post("/reports/generate", json={"report_type": "networth", "period": "This month"})
    assert r.status_code == 201
    assert r.json()["model"] == ai.GROQ_MODEL


def test_generate_falls_back_when_llm_errors(client, db, monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "test-key")

    def boom(snapshot, report_type):
        raise RuntimeError("groq down")

    monkeypatch.setattr(ai, "_generate_with_llm", boom)
    auth_as(make_user(db))
    _consent(client)
    r = client.post("/reports/generate", json={"report_type": "savings", "period": "This month"})
    assert r.status_code == 201
    assert r.json()["model"] == "heuristic"
